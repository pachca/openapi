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

interface CommonService {
    suspend fun downloadExport(id: Int): String {
        throw NotImplementedError("Common.downloadExport is not implemented")
    }
}

class CommonServiceImpl internal constructor(
    private val baseUrl: String,
    private val client: HttpClient,
) : CommonService {
    override suspend fun downloadExport(id: Int): String {
        val response = client.get("$baseUrl/exports/$id")
        return when (response.status.value) {
            302 -> response.headers[HttpHeaders.Location]
                ?: error("Missing Location header in redirect response")
            401 -> throw response.body<OAuthError>()
            else -> throw response.body<ApiError>()
        }
    }
}

const val PACHCA_API_URL = "https://api.pachca.com/api/shared/v1"

class PachcaClient private constructor(
    private val _client: HttpClient?,
    val common: CommonService
) : Closeable {

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

        private fun createClient(token: String): HttpClient = HttpClient {
            expectSuccess = false
            followRedirects = false
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
        common: CommonService? = null
    ) : this(
        _client = client,
        common = common ?: CommonServiceImpl(baseUrl, client)
    )

    override fun close() {
        _client?.close()
    }
}
