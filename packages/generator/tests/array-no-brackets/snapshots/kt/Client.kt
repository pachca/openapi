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
import java.io.Closeable

internal val pachcaJson = Json { explicitNulls = false; ignoreUnknownKeys = true }

/** A 401 body that is empty or not the OAuth form gives a RuntimeException with the status code. */
internal suspend fun oauthErrorFromResponse(response: HttpResponse): Exception {
    val text = response.bodyAsText()
    return runCatching { pachcaJson.decodeFromString(OAuthError.serializer(), text) }
        .getOrElse { RuntimeException("Unexpected status code: ${response.status.value}") }
}

interface SearchService {
    suspend fun searchMessages(
        query: String,
        chatIds: List<Int>,
        userIds: List<Int>? = null,
        limit: Int? = null,
        cursor: String? = null,
    ): SearchMessagesResponse {
        throw NotImplementedError("Search.searchMessages is not implemented")
    }

    suspend fun searchMessagesAll(
        query: String,
        chatIds: List<Int>,
        userIds: List<Int>? = null,
        limit: Int? = null,
    ): List<MessageResult> {
        throw NotImplementedError("Search.searchMessagesAll is not implemented")
    }
}

class SearchServiceImpl internal constructor(
    private val baseUrl: String,
    private val client: HttpClient,
) : SearchService {
    override suspend fun searchMessages(
        query: String,
        chatIds: List<Int>,
        userIds: List<Int>?,
        limit: Int?,
        cursor: String?,
    ): SearchMessagesResponse {
        val response = client.get("$baseUrl/search/messages") {
            parameter("query", query)
            chatIds.forEach { parameter("chat_ids[]", it) }
            userIds?.forEach { parameter("user_ids", it) }
            limit?.let { parameter("limit", it) }
            cursor?.let { parameter("cursor", it) }
        }
        return when (response.status.value) {
            200 -> response.body()
            401 -> throw oauthErrorFromResponse(response)
            else -> throw RuntimeException("Unexpected status code: ${response.status.value}")
        }
    }

    override suspend fun searchMessagesAll(
        query: String,
        chatIds: List<Int>,
        userIds: List<Int>?,
        limit: Int?,
    ): List<MessageResult> {
        val items = mutableListOf<MessageResult>()
        var cursor: String? = null
        do {
            val response = searchMessages(
                query = query,
                chatIds = chatIds,
                userIds = userIds,
                limit = limit,
                cursor = cursor,
            )
            items.addAll(response.data)
            if (response.data.isEmpty()) break
            cursor = response.meta.paginate.nextPage
        } while (true)
        return items
    }
}

const val PACHCA_API_URL = "https://api.pachca.com/api/shared/v1"

class PachcaClient private constructor(
    private val _client: HttpClient?,
    val search: SearchService
) : Closeable {

    companion object {
        operator fun invoke(
            token: String,
            baseUrl: String = PACHCA_API_URL,
            search: SearchService? = null
        ): PachcaClient {
            val client = createClient(token)
            return PachcaClient(
                _client = client,
                search = search ?: SearchServiceImpl(baseUrl, client)
            )
        }

        fun stub(
            search: SearchService = object : SearchService {}
        ): PachcaClient = PachcaClient(
            _client = null,
            search = search
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
        search: SearchService? = null
    ) : this(
        _client = client,
        search = search ?: SearchServiceImpl(baseUrl, client)
    )

    override fun close() {
        _client?.close()
    }
}
