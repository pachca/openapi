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
        return OAuthError(error = code.content, errorDescription = description?.content ?: "")
    }
    val decoded = runCatching { pachcaJson.decodeFromString(ApiError.serializer(), text) }.getOrNull()
    return decoded?.copy(statusCode = response.status.value)
        ?: ApiError(errors = emptyList(), statusCode = response.status.value)
}

interface ChatsService {
    suspend fun listChats(
        availability: ChatAvailability? = null,
        limit: Int? = null,
        cursor: String? = null,
        sortField: String? = null,
        sortOrder: SortOrder? = null,
    ): ListChatsResponse {
        throw NotImplementedError("Chats.listChats is not implemented")
    }

    suspend fun listChatsAll(
        availability: ChatAvailability? = null,
        limit: Int? = null,
        sortField: String? = null,
        sortOrder: SortOrder? = null,
    ): List<Chat> {
        throw NotImplementedError("Chats.listChatsAll is not implemented")
    }

    suspend fun getChat(id: Int): Chat {
        throw NotImplementedError("Chats.getChat is not implemented")
    }

    suspend fun createChat(request: ChatCreateRequest): Chat {
        throw NotImplementedError("Chats.createChat is not implemented")
    }

    suspend fun updateChat(id: Int, request: ChatUpdateRequest): Chat {
        throw NotImplementedError("Chats.updateChat is not implemented")
    }

    suspend fun archiveChat(id: Int) {
        throw NotImplementedError("Chats.archiveChat is not implemented")
    }

    suspend fun deleteChat(id: Int) {
        throw NotImplementedError("Chats.deleteChat is not implemented")
    }
}

class ChatsServiceImpl internal constructor(
    private val baseUrl: String,
    private val client: HttpClient,
) : ChatsService {
    override suspend fun listChats(
        availability: ChatAvailability?,
        limit: Int?,
        cursor: String?,
        sortField: String?,
        sortOrder: SortOrder?,
    ): ListChatsResponse {
        val response = client.get("$baseUrl/chats") {
            availability?.let { parameter("availability", it.value) }
            limit?.let { parameter("limit", it) }
            cursor?.let { parameter("cursor", it) }
            sortField?.let { parameter("sort[field]", it) }
            sortOrder?.let { parameter("sort[order]", it.value) }
        }
        return when (response.status.value) {
            200 -> response.body()
            else -> throw errorFromResponse(response)
        }
    }

    override suspend fun listChatsAll(
        availability: ChatAvailability?,
        limit: Int?,
        sortField: String?,
        sortOrder: SortOrder?,
    ): List<Chat> {
        val items = mutableListOf<Chat>()
        var cursor: String? = null
        var hasNext = true
        while (hasNext) {
            val response = listChats(
                availability = availability,
                limit = limit,
                cursor = cursor,
                sortField = sortField,
                sortOrder = sortOrder,
            )
            items.addAll(response.data)
            if (response.data.isEmpty()) break
            cursor = response.meta?.paginate?.nextPage
            hasNext = response.meta?.paginate?.hasNext ?: true
        }
        return items
    }

    override suspend fun getChat(id: Int): Chat {
        val response = client.get("$baseUrl/chats/$id")
        return when (response.status.value) {
            200 -> response.body<ChatDataWrapper>().data
            else -> throw errorFromResponse(response)
        }
    }

    override suspend fun createChat(request: ChatCreateRequest): Chat {
        val response = client.post("$baseUrl/chats") {
            contentType(ContentType.Application.Json)
            setBody(request)
        }
        return when (response.status.value) {
            201 -> response.body<ChatDataWrapper>().data
            else -> throw errorFromResponse(response)
        }
    }

    override suspend fun updateChat(id: Int, request: ChatUpdateRequest): Chat {
        val response = client.put("$baseUrl/chats/$id") {
            contentType(ContentType.Application.Json)
            setBody(request)
        }
        return when (response.status.value) {
            200 -> response.body<ChatDataWrapper>().data
            else -> throw errorFromResponse(response)
        }
    }

    override suspend fun archiveChat(id: Int) {
        val response = client.put("$baseUrl/chats/$id/archive")
        when (response.status.value) {
            204 -> return
            else -> throw errorFromResponse(response)
        }
    }

    override suspend fun deleteChat(id: Int) {
        val response = client.delete("$baseUrl/chats/$id")
        when (response.status.value) {
            204 -> return
            else -> throw errorFromResponse(response)
        }
    }
}

const val PACHCA_API_URL = "https://api.pachca.com/api/shared/v1"

class PachcaClient private constructor(
    private val _client: HttpClient?,
    val chats: ChatsService
) : Closeable {

    companion object {
        operator fun invoke(
            token: String,
            baseUrl: String = PACHCA_API_URL,
            chats: ChatsService? = null
        ): PachcaClient {
            val client = createClient(token)
            return PachcaClient(
                _client = client,
                chats = chats ?: ChatsServiceImpl(baseUrl, client)
            )
        }

        fun stub(
            chats: ChatsService = object : ChatsService {}
        ): PachcaClient = PachcaClient(
            _client = null,
            chats = chats
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
                        // Ktor counts retries from 1. A 429 without Retry-After waits 1, 2 and 4 s,
                        // as in the other SDKs, a 5xx and a network error 10, 20 and 40 s.
                        val base = if (response?.status?.value == 429) 1_000L else 10_000L
                        (base * (1L shl (retry - 1)) * jitter).toLong()
                    }
                }
            }
            defaultRequest { bearerAuth(token) }
        }.also(::markQueryTimeouts)
    }

    constructor(
        client: HttpClient,
        baseUrl: String = PACHCA_API_URL,
        chats: ChatsService? = null
    ) : this(
        _client = client,
        chats = chats ?: ChatsServiceImpl(baseUrl, client)
    )

    override fun close() {
        _client?.close()
    }
}
