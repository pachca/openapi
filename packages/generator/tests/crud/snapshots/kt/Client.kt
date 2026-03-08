package com.pachca.sdk

import io.ktor.client.*
import io.ktor.client.call.*
import io.ktor.client.plugins.*
import io.ktor.client.plugins.contentnegotiation.*
import io.ktor.client.request.*
import io.ktor.client.statement.*
import io.ktor.http.*
import io.ktor.serialization.kotlinx.json.*
import java.io.Closeable

class ChatsService internal constructor(
    private val baseUrl: String,
    private val client: HttpClient,
) {
    suspend fun listChats(
        availability: ChatAvailability? = null,
        limit: Int? = null,
        cursor: String? = null,
        sortField: String? = null,
        sortOrder: SortOrder? = null,
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
            401 -> throw response.body<OAuthError>()
            else -> throw response.body<ApiError>()
        }
    }

    suspend fun getChat(id: Int): Chat {
        val response = client.get("$baseUrl/chats/$id")
        return when (response.status.value) {
            200 -> response.body<ChatDataWrapper>().data
            401 -> throw response.body<OAuthError>()
            else -> throw response.body<ApiError>()
        }
    }

    suspend fun createChat(request: ChatCreateRequest): Chat {
        val response = client.post("$baseUrl/chats") {
            contentType(ContentType.Application.Json)
            setBody(request)
        }
        return when (response.status.value) {
            201 -> response.body<ChatDataWrapper>().data
            401 -> throw response.body<OAuthError>()
            else -> throw response.body<ApiError>()
        }
    }

    suspend fun updateChat(id: Int, request: ChatUpdateRequest): Chat {
        val response = client.put("$baseUrl/chats/$id") {
            contentType(ContentType.Application.Json)
            setBody(request)
        }
        return when (response.status.value) {
            200 -> response.body<ChatDataWrapper>().data
            401 -> throw response.body<OAuthError>()
            else -> throw response.body<ApiError>()
        }
    }

    suspend fun archiveChat(id: Int) {
        val response = client.put("$baseUrl/chats/$id/archive")
        when (response.status.value) {
            204 -> return
            401 -> throw response.body<OAuthError>()
            else -> throw response.body<ApiError>()
        }
    }

    suspend fun deleteChat(id: Int) {
        val response = client.delete("$baseUrl/chats/$id")
        when (response.status.value) {
            204 -> return
            401 -> throw response.body<OAuthError>()
            else -> throw response.body<ApiError>()
        }
    }
}

class PachcaClient(token: String, baseUrl: String = "https://api.pachca.com/api/shared/v1") : Closeable {
    private val client = HttpClient {
        expectSuccess = false
        install(ContentNegotiation) {
            json()
        }
        defaultRequest {
            bearerAuth(token)
        }
    }

    val chats = ChatsService(baseUrl, client)

    override fun close() {
        client.close()
    }
}
