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
 */
internal suspend fun errorFromResponse(response: HttpResponse): Exception {
    val text = response.bodyAsText()
    val element = runCatching { pachcaJson.parseToJsonElement(text) }.getOrNull()
    val code = (element as? JsonObject)?.get("error") as? JsonPrimitive
    if (element is JsonObject && element["errors"] == null && code != null && code.isString) {
        val description = element["error_description"] as? JsonPrimitive
        return OAuthError(error = OAuthErrorCode(code.content), errorDescription = description?.content ?: "")
    }
    return pachcaJson.decodeFromString(ApiError.serializer(), text)
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
            401 -> throw response.body<OAuthError>()
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
            401 -> throw response.body<OAuthError>()
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

        private fun createClient(token: String): HttpClient = HttpClient {
            expectSuccess = false
            install(ContentNegotiation) { json(Json { explicitNulls = false }) }
            install(HttpRequestRetry) {
                maxRetries = 3
                retryIf { _, response ->
                    val status = response.status.value
                    val retryAfter = response.headers["Retry-After"]?.toLongOrNull()
                    // Only the daily chat limit and the hour-long ban wait longer than a
                    // minute. Retrying those is pointless — it blocks the caller for hours,
                    // and an early retry doubles the pause. Hand the response back instead.
                    val waitsTooLong = status == 429 && retryAfter != null && retryAfter > 60L
                    !waitsTooLong && (status == 429 || status in setOf(500, 502, 503, 504))
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
        }
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
