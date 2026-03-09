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

class SearchService internal constructor(
    private val baseUrl: String,
    private val client: HttpClient,
) {
    suspend fun searchMessages(
        query: String,
        chatIds: List<Int>? = null,
        userIds: List<Int>? = null,
        createdFrom: String? = null,
        createdTo: String? = null,
        sort: SearchSort? = null,
        limit: Int? = null,
        cursor: String? = null,
    ): SearchMessagesResponse {
        val response = client.get("$baseUrl/search/messages") {
            parameter("query", query)
            chatIds?.forEach { parameter("chat_ids[]", it) }
            userIds?.forEach { parameter("user_ids[]", it) }
            createdFrom?.let { parameter("created_from", it) }
            createdTo?.let { parameter("created_to", it) }
            sort?.let { parameter("sort", it.value) }
            limit?.let { parameter("limit", it) }
            cursor?.let { parameter("cursor", it) }
        }
        return when (response.status.value) {
            200 -> response.body()
            401 -> throw response.body<OAuthError>()
            else -> throw RuntimeException("Unexpected status code: ${response.status.value}")
        }
    }

    suspend fun searchMessagesAll(
        query: String,
        chatIds: List<Int>? = null,
        userIds: List<Int>? = null,
        createdFrom: String? = null,
        createdTo: String? = null,
        sort: SearchSort? = null,
        limit: Int? = null,
    ): List<MessageSearchResult> {
        val items = mutableListOf<MessageSearchResult>()
        var cursor: String? = null
        do {
            val response = searchMessages(
                query = query,
                chatIds = chatIds,
                userIds = userIds,
                createdFrom = createdFrom,
                createdTo = createdTo,
                sort = sort,
                limit = limit,
                cursor = cursor,
            )
            items.addAll(response.data)
            cursor = response.meta?.paginate?.nextPage
        } while (cursor != null)
        return items
    }
}

class PachcaClient(token: String, baseUrl: String = "https://api.pachca.com/api/shared/v1") : Closeable {
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

    val search = SearchService(baseUrl, client)

    override fun close() {
        client.close()
    }
}
