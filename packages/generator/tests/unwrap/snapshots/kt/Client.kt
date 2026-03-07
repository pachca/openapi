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

/** D1: addMembers — 1 field unwrapped into function params */
class MembersService internal constructor(
    private val baseUrl: String,
    private val client: HttpClient,
) {
    suspend fun addMembers(id: Int, memberIds: List<Int>) {
        val response = client.post("$baseUrl/chats/$id/members") {
            contentType(ContentType.Application.Json)
            setBody(AddMembersRequest(memberIds = memberIds))
        }
        when (response.status.value) {
            204 -> return
            401 -> throw response.body<OAuthError>()
            else -> throw response.body<ApiError>()
        }
    }
}

class ChatsService internal constructor(
    private val baseUrl: String,
    private val client: HttpClient,
) {
    /** D2: archiveChat — void action, no body */
    suspend fun archiveChat(id: Int) {
        val response = client.put("$baseUrl/chats/$id/archive")
        when (response.status.value) {
            204 -> return
            401 -> throw response.body<OAuthError>()
            else -> throw response.body<ApiError>()
        }
    }

    /** D3: createChat — 2+ fields, pass as object */
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
}

class PachcaClient(baseUrl: String, token: String) : Closeable {
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
    val members = MembersService(baseUrl, client)

    override fun close() {
        client.close()
    }
}
