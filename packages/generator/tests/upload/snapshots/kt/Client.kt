package com.pachca.sdk

import io.ktor.client.*
import io.ktor.client.call.*
import io.ktor.client.plugins.*
import io.ktor.client.plugins.auth.*
import io.ktor.client.plugins.auth.providers.*
import io.ktor.client.plugins.contentnegotiation.*
import io.ktor.client.request.*
import io.ktor.client.request.forms.*
import io.ktor.client.statement.*
import io.ktor.http.*
import io.ktor.serialization.kotlinx.json.*
import io.ktor.util.AttributeKey
import kotlinx.serialization.json.Json
import java.io.Closeable

internal val pachcaJson = Json { explicitNulls = false; ignoreUnknownKeys = true }

/** A 401 body that is empty or not the OAuth form gives a RuntimeException with the status code. */
internal suspend fun oauthErrorFromResponse(response: HttpResponse): Exception {
    val text = response.bodyAsText()
    return runCatching { pachcaJson.decodeFromString(OAuthError.serializer(), text) }
        .getOrElse { RuntimeException("Unexpected status code: ${response.status.value}") }
}

/** Marks a request that takes no token, such as the upload to storage. */
internal val PachcaNoAuth = AttributeKey<Unit>("PachcaNoAuth")

private val PachcaNoAuthInstalled = AttributeKey<Unit>("PachcaNoAuthInstalled")

/**
 * A request marked [PachcaNoAuth] goes without `Authorization`, whoever set it: `defaultRequest`
 * adds the header after the request block, so it is taken off in the send pipeline.
 */
internal fun dropAuthorizationOfNoAuthRequests(client: HttpClient) {
    if (client.attributes.contains(PachcaNoAuthInstalled)) return
    client.attributes.put(PachcaNoAuthInstalled, Unit)
    client.sendPipeline.intercept(HttpSendPipeline.Before) {
        if (context.attributes.contains(PachcaNoAuth)) context.headers.remove(HttpHeaders.Authorization)
    }
}

interface CommonService {
    suspend fun uploadFile(directUrl: String, request: FileUploadRequest) {
        throw NotImplementedError("Common.uploadFile is not implemented")
    }

    suspend fun getUploadParams(): UploadParams {
        throw NotImplementedError("Common.getUploadParams is not implemented")
    }
}

class CommonServiceImpl internal constructor(
    private val baseUrl: String,
    private val client: HttpClient,
) : CommonService {
    override suspend fun uploadFile(directUrl: String, request: FileUploadRequest) {
        val response = client.submitFormWithBinaryData(
            directUrl,
            formData {
                append("content-disposition", request.contentDisposition)
                append("acl", request.acl)
                append("policy", request.policy)
                append("x-amz-credential", request.xAmzCredential)
                append("x-amz-algorithm", request.xAmzAlgorithm)
                append("x-amz-date", request.xAmzDate)
                append("x-amz-signature", request.xAmzSignature)
                append("key", request.key)
                append("file", request.file, Headers.build {
                    append(HttpHeaders.ContentDisposition, "filename=\"file\"")
                })
            },
        ) {
            attributes.put(PachcaNoAuth, Unit)
        }
        when (response.status.value) {
            204 -> return
            401 -> throw oauthErrorFromResponse(response)
            else -> throw RuntimeException("Unexpected status code: ${response.status.value}")
        }
    }

    override suspend fun getUploadParams(): UploadParams {
        val response = client.post("$baseUrl/uploads")
        return when (response.status.value) {
            201 -> response.body<UploadParamsDataWrapper>().data
            401 -> throw oauthErrorFromResponse(response)
            else -> throw RuntimeException("Unexpected status code: ${response.status.value}")
        }
    }
}

const val PACHCA_API_URL = "https://api.pachca.com/api/shared/v1"

class PachcaClient private constructor(
    private val _client: HttpClient?,
    val common: CommonService
) : Closeable {

    init {
        _client?.let(::dropAuthorizationOfNoAuthRequests)
    }

    companion object {
        operator fun invoke(
            token: String,
            baseUrl: String = PACHCA_API_URL,
            common: CommonService? = null
        ): PachcaClient {
            val client = createClient(token)
            return PachcaClient(
                _client = client,
                common = common ?: CommonServiceImpl(baseUrl, client)
            )
        }

        fun stub(
            common: CommonService = object : CommonService {}
        ): PachcaClient = PachcaClient(
            _client = null,
            common = common
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
        baseUrl: String = PACHCA_API_URL,
        common: CommonService? = null
    ) : this(
        _client = client,
        common = common ?: CommonServiceImpl(baseUrl, client)
    )

    override fun close() {
        _client?.close()
    }
}
