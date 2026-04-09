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

interface LinkPreviewsService {
    suspend fun createLinkPreviews(id: Int, request: LinkPreviewsRequest) {
        throw NotImplementedError("Link Previews.createLinkPreviews is not implemented")
    }
}

class LinkPreviewsServiceImpl internal constructor(
    private val baseUrl: String,
    private val client: HttpClient,
) : LinkPreviewsService {
    override suspend fun createLinkPreviews(id: Int, request: LinkPreviewsRequest) {
        val response = client.post("$baseUrl/messages/$id/link_previews") {
            contentType(ContentType.Application.Json)
            setBody(request)
        }
        when (response.status.value) {
            201 -> return
            401 -> throw response.body<OAuthError>()
            else -> throw response.body<ApiError>()
        }
    }
}

const val PACHCA_API_URL = "https://api.pachca.com/api/shared/v1"

class PachcaClient private constructor(
    private val _client: HttpClient?,
    val linkPreviews: LinkPreviewsService
) : Closeable {

    companion object {
        operator fun invoke(
            token: String,
            baseUrl: String = PACHCA_API_URL,
            linkPreviews: LinkPreviewsService? = null
        ): PachcaClient {
            val client = createClient(token)
            return PachcaClient(
                _client = client,
                linkPreviews = linkPreviews ?: LinkPreviewsServiceImpl(baseUrl, client)
            )
        }

        fun stub(
            linkPreviews: LinkPreviewsService = object : LinkPreviewsService {}
        ): PachcaClient = PachcaClient(
            _client = null,
            linkPreviews = linkPreviews
        )

        private fun createClient(token: String): HttpClient = HttpClient {
            expectSuccess = false
            install(ContentNegotiation) { json(Json { explicitNulls = false }) }
            install(HttpRequestRetry) {
                maxRetries = 3
                retryIf { _, response ->
                    response.status.value == 429 || response.status.value in setOf(500, 502, 503, 504)
                }
                delayMillis { retry ->
                    val retryAfter = response?.headers?.get("Retry-After")?.toLongOrNull()
                    if (retryAfter != null && response?.status?.value == 429) {
                        retryAfter * 1000L
                    } else {
                        val base = 10_000L * (1L shl retry)
                        val jitter = 0.5 + kotlin.random.Random.nextDouble() * 0.5
                        (base * jitter).toLong()
                    }
                }
            }
            defaultRequest { bearerAuth(token) }
        }
    }

    constructor(
        client: HttpClient,
        baseUrl: String = PACHCA_API_URL,
        linkPreviews: LinkPreviewsService? = null
    ) : this(
        _client = client,
        linkPreviews = linkPreviews ?: LinkPreviewsServiceImpl(baseUrl, client)
    )

    override fun close() {
        _client?.close()
    }
}
