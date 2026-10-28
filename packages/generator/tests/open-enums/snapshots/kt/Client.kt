package com.pachca.sdk

import io.ktor.client.*
import io.ktor.client.call.*
import io.ktor.client.plugins.*
import io.ktor.client.plugins.auth.*
import io.ktor.client.plugins.auth.providers.*
import io.ktor.client.plugins.contentnegotiation.*
import io.ktor.client.request.*
import io.ktor.client.statement.*
import io.ktor.http.*
import io.ktor.serialization.kotlinx.json.*
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonNull
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import java.io.Closeable

internal val pachcaJson = Json { explicitNulls = false; ignoreUnknownKeys = true }

/**
 * An error body is either {"errors": [...]} or the OAuth form {"error", "error_description"},
 * which also comes with 400 and 403 (insufficient_scope, invalid_grant). The body decides the class.
 * An empty body or one that is not JSON gives an ApiError with no errors. The status code stays in statusCode.
 */
internal suspend fun errorFromResponse(response: HttpResponse): Exception {
    val text = response.bodyAsText()
    val element = runCatching { pachcaJson.parseToJsonElement(text) }.getOrNull()
    val code = (element as? JsonObject)?.get("error") as? JsonPrimitive
    if (element is JsonObject && element["errors"] == null && code != null && code.isString) {
        val description = element["error_description"] as? JsonPrimitive
        return OAuthError(error = OAuthErrorCode(code.content), errorDescription = description?.content ?: "")
    }
    val decoded = runCatching { pachcaJson.decodeFromString(ApiError.serializer(), text) }.getOrNull()
    return decoded?.copy(statusCode = response.status.value)
        ?: ApiError(errors = emptyList(), statusCode = response.status.value)
}

interface MembersService {
    suspend fun listMembers(
        sort: SortOrder? = null,
        role: MemberRole? = null,
        roles: List<MemberRole>? = null,
        region: Region? = null,
    ): ListMembersResponse {
        throw NotImplementedError("Members.listMembers is not implemented")
    }

    suspend fun updateMember(id: Int, request: MemberUpdateRequest): Member {
        throw NotImplementedError("Members.updateMember is not implemented")
    }
}

class MembersServiceImpl internal constructor(
    private val baseUrl: String,
    private val client: HttpClient,
) : MembersService {
    override suspend fun listMembers(
        sort: SortOrder?,
        role: MemberRole?,
        roles: List<MemberRole>?,
        region: Region?,
    ): ListMembersResponse {
        val response = client.get("$baseUrl/members") {
            sort?.let { parameter("sort", it.value) }
            role?.let { parameter("role", it.value) }
            roles?.forEach { parameter("roles[]", it.value) }
            region?.let { parameter("region", it.value) }
        }
        return when (response.status.value) {
            200 -> response.body()
            else -> throw errorFromResponse(response)
        }
    }

    override suspend fun updateMember(id: Int, request: MemberUpdateRequest): Member {
        val response = client.put("$baseUrl/members/$id") {
            contentType(ContentType.Application.Json)
            setBody(request)
        }
        return when (response.status.value) {
            200 -> response.body<MemberDataWrapper>().data
            else -> throw errorFromResponse(response)
        }
    }
}

class PachcaClient private constructor(
    private val _client: HttpClient?,
    val members: MembersService
) : Closeable {

    companion object {
        operator fun invoke(
            token: String,
            baseUrl: String,
            members: MembersService? = null
        ): PachcaClient {
            val client = createClient(token)
            return PachcaClient(
                _client = client,
                members = members ?: MembersServiceImpl(baseUrl, client)
            )
        }

        fun stub(
            members: MembersService = object : MembersService {}
        ): PachcaClient = PachcaClient(
            _client = null,
            members = members
        )

        // A 5xx says nothing about whether the server already applied the request.
        // These methods are safe to repeat. A retried POST or PATCH could apply
        // twice: POST /messages would send the message again, and the API has no
        // idempotency key. 429 is safe for any method: the request was rejected
        // before it was processed.
        private val idempotentMethods =
            setOf(HttpMethod.Get, HttpMethod.Head, HttpMethod.Options, HttpMethod.Put, HttpMethod.Delete)

        /** Set on a call whose 504 carries the error code `timeout`: the retry leaves it alone. */
        private val queryTimeoutKey = io.ktor.util.AttributeKey<Unit>("PachcaQueryTimeout")

        /**
         * A 504 with the error code `timeout` is a search the server stopped because the query
         * is too heavy: the same query would time out again, so it goes back to the caller at
         * once. A 504 from a proxy has no such code and is retried. `retryIf` cannot read the
         * body, so this interceptor, registered after the retry plugin and so running under it,
         * reads the body of each attempt and marks the call. Ktor keeps the body in memory, so
         * the caller can still read it.
         */
        private fun markQueryTimeouts(client: HttpClient) {
            client.plugin(HttpSend).intercept { request ->
                val call = execute(request)
                if (call.response.status == HttpStatusCode.GatewayTimeout && isQueryTimeout(call.response.bodyAsText())) {
                    call.attributes.put(queryTimeoutKey, Unit)
                }
                call
            }
        }

        private fun isQueryTimeout(body: String): Boolean {
            val element = runCatching { Json.parseToJsonElement(body) }.getOrNull()
            val errors = (element as? kotlinx.serialization.json.JsonObject)?.get("errors") as? kotlinx.serialization.json.JsonArray
            return errors.orEmpty().any { error ->
                val code = (error as? kotlinx.serialization.json.JsonObject)?.get("code") as? kotlinx.serialization.json.JsonPrimitive
                code != null && code.isString && code.content == "timeout"
            }
        }

        private fun createClient(token: String): HttpClient = HttpClient {
            expectSuccess = false
            install(ContentNegotiation) { json(Json { explicitNulls = false }) }
            install(HttpRequestRetry) {
                maxRetries = 3
                retryIf { request, response ->
                    val status = response.status.value
                    val retryAfter = response.headers["Retry-After"]?.toLongOrNull()
                    // Only the daily chat limit and the hour-long ban wait longer than a
                    // minute. Retrying those is pointless — it blocks the caller for hours,
                    // and an early retry doubles the pause. Hand the response back instead.
                    val waitsTooLong = status == 429 && retryAfter != null && retryAfter > 60L
                    val serverError = status in setOf(500, 502, 503, 504) &&
                        request.method in idempotentMethods &&
                        !response.call.attributes.contains(queryTimeoutKey)
                    !waitsTooLong && (status == 429 || serverError)
                }
                // Ktor also retries a request that failed with an exception, for any
                // method by default. A POST that failed after reaching the server may
                // already be applied, so only the methods above are retried. Timeouts
                // and cancellation stay unretried, as in the Ktor default.
                retryOnExceptionIf { request, cause ->
                    request.method in idempotentMethods &&
                        cause !is kotlin.coroutines.cancellation.CancellationException &&
                        cause !is HttpRequestTimeoutException &&
                        cause !is io.ktor.client.network.sockets.ConnectTimeoutException &&
                        cause !is java.net.SocketTimeoutException
                }
                delayMillis { retry ->
                    val retryAfter = response?.headers?.get("Retry-After")?.toLongOrNull()
                    // Retry-After is a minimum, not an estimate: waiting less lands the
                    // retry inside a window that is still closed. Jitter only upwards.
                    val jitter = 1 + kotlin.random.Random.nextDouble() * 0.25
                    if (retryAfter != null && response?.status?.value == 429) {
                        (retryAfter * 1000L * jitter).toLong()
                    } else {
                        val base = 10_000L * (1L shl retry)
                        (base * jitter).toLong()
                    }
                }
            }
            defaultRequest { bearerAuth(token) }
        }.also(::markQueryTimeouts)
    }

    constructor(
        client: HttpClient,
        baseUrl: String,
        members: MembersService? = null
    ) : this(
        _client = client,
        members = members ?: MembersServiceImpl(baseUrl, client)
    )

    override fun close() {
        _client?.close()
    }
}
