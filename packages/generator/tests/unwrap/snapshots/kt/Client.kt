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

abstract class MembersService {
    open suspend fun addMembers(id: Int, memberIds: List<Int>) {
        throw NotImplementedError("Members.addMembers is not implemented")
    }
}

class MembersServiceImpl internal constructor(
    private val baseUrl: String,
    private val client: HttpClient,
) : MembersService() {
    override suspend fun addMembers(id: Int, memberIds: List<Int>) {
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

abstract class ChatsService {
    open suspend fun createChat(request: ChatCreateRequest): Chat {
        throw NotImplementedError("Chats.createChat is not implemented")
    }

    open suspend fun archiveChat(id: Int) {
        throw NotImplementedError("Chats.archiveChat is not implemented")
    }
}

class ChatsServiceImpl internal constructor(
    private val baseUrl: String,
    private val client: HttpClient,
) : ChatsService() {
    override suspend fun createChat(request: ChatCreateRequest): Chat {
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

    override suspend fun archiveChat(id: Int) {
        val response = client.put("$baseUrl/chats/$id/archive")
        when (response.status.value) {
            204 -> return
            401 -> throw response.body<OAuthError>()
            else -> throw response.body<ApiError>()
        }
    }
}

data class PachcaServices(
    val chats: ChatsService? = null,
    val members: MembersService? = null
)

class PachcaClient(token: String, baseUrl: String = "https://api.pachca.com/api/shared/v1", services: PachcaServices = PachcaServices()) : Closeable {
    private val client = HttpClient {
        expectSuccess = false
        install(ContentNegotiation) {
            json(Json { explicitNulls = false })
        }
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
        defaultRequest {
            bearerAuth(token)
        }
    }

    val chats: ChatsService = services.chats ?: ChatsServiceImpl(baseUrl, client)
    val members: MembersService = services.members ?: MembersServiceImpl(baseUrl, client)

    override fun close() {
        client.close()
    }
}
