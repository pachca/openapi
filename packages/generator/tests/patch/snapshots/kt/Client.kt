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

class ItemsService internal constructor(
    private val baseUrl: String,
    private val client: HttpClient,
) {
    suspend fun patchItem(id: Int, request: ItemPatchRequest): Item {
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

class PachcaClient(token: String, baseUrl: String = "https://api.example.com/v1") : Closeable {
    private val client = HttpClient {
        expectSuccess = false
        install(ContentNegotiation) {
            json(Json { explicitNulls = false })
        }
        install(HttpRequestRetry) {
            retryOnServerErrors(maxRetries = 3)
            retryIf { _, response -> response.status.value == 429 }
            delayMillis { retry ->
                retry * 1000L
            }
        }
        defaultRequest {
            bearerAuth(token)
        }
    }

    val items = ItemsService(baseUrl, client)

    override fun close() {
        client.close()
    }
}
