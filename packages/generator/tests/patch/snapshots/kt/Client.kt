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

interface ItemsService {
    suspend fun patchItem(id: Int, request: ItemPatchRequest): Item {
        throw NotImplementedError("Items.patchItem is not implemented")
    }
}

class ItemsServiceImpl internal constructor(
    private val baseUrl: String,
    private val client: HttpClient,
) : ItemsService {
    override suspend fun patchItem(id: Int, request: ItemPatchRequest): Item {
        val response = client.patch("$baseUrl/items/$id") {
            contentType(ContentType.Application.Json)
            setBody(request)
        }
        return when (response.status.value) {
            200 -> response.body<ItemDataWrapper>().data
            else -> throw response.body<ApiError>()
        }
    }
}

const val PACHCA_API_URL = "https://api.example.com/v1"

class PachcaClient private constructor(
    private val _client: HttpClient?,
    val items: ItemsService
) : Closeable {

    companion object {
        operator fun invoke(
            token: String,
            baseUrl: String = PACHCA_API_URL,
            items: ItemsService? = null
        ): PachcaClient {
            val client = createClient(token)
            return PachcaClient(
                _client = client,
                items = items ?: ItemsServiceImpl(baseUrl, client)
            )
        }

        fun stub(
            items: ItemsService = object : ItemsService {}
        ): PachcaClient = PachcaClient(
            _client = null,
            items = items
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
        items: ItemsService? = null
    ) : this(
        _client = client,
        items = items ?: ItemsServiceImpl(baseUrl, client)
    )

    override fun close() {
        _client?.close()
    }
}
