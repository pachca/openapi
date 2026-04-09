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
import java.time.OffsetDateTime

interface SearchService {
    suspend fun searchMessages(
        query: String,
        chatIds: List<Int>? = null,
        userIds: List<Int>? = null,
        createdFrom: OffsetDateTime? = null,
        createdTo: OffsetDateTime? = null,
        sort: SearchSort? = null,
        limit: Int? = null,
        cursor: String? = null,
    ): SearchMessagesResponse {
        throw NotImplementedError("Search.searchMessages is not implemented")
    }

    suspend fun searchMessagesAll(
        query: String,
        chatIds: List<Int>? = null,
        userIds: List<Int>? = null,
        createdFrom: OffsetDateTime? = null,
        createdTo: OffsetDateTime? = null,
        sort: SearchSort? = null,
        limit: Int? = null,
    ): List<MessageSearchResult> {
        throw NotImplementedError("Search.searchMessagesAll is not implemented")
    }
}

class SearchServiceImpl internal constructor(
    private val baseUrl: String,
    private val client: HttpClient,
) : SearchService {
    override suspend fun searchMessages(
        query: String,
        chatIds: List<Int>?,
        userIds: List<Int>?,
        createdFrom: OffsetDateTime?,
        createdTo: OffsetDateTime?,
        sort: SearchSort?,
        limit: Int?,
        cursor: String?,
    ): SearchMessagesResponse {
        val response = client.get("$baseUrl/search/messages") {
            parameter("query", query)
            chatIds?.forEach { parameter("chat_ids[]", it) }
            userIds?.forEach { parameter("user_ids[]", it) }
            createdFrom?.let { parameter("created_from", it.toString()) }
            createdTo?.let { parameter("created_to", it.toString()) }
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

    override suspend fun searchMessagesAll(
        query: String,
        chatIds: List<Int>?,
        userIds: List<Int>?,
        createdFrom: OffsetDateTime?,
        createdTo: OffsetDateTime?,
        sort: SearchSort?,
        limit: Int?,
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
        search: SearchService? = null
    ) : this(
        _client = client,
        search = search ?: SearchServiceImpl(baseUrl, client)
    )

    override fun close() {
        _client?.close()
    }
}
