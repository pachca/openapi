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
import kotlinx.serialization.json.Json
import java.io.Closeable

class EventsService internal constructor(
    private val baseUrl: String,
    private val client: HttpClient,
) {
    suspend fun listEvents(
        isActive: Boolean? = null,
        scopes: List<OAuthScope>? = null,
        filter: EventFilter? = null,
    ): ListEventsResponse {
        val response = client.get("$baseUrl/events") {
            isActive?.let { parameter("is_active", it) }
            scopes?.let { parameter("scopes", it) }
            filter?.let { parameter("filter", it) }
        }
        return when (response.status.value) {
            200 -> response.body()
            else -> throw RuntimeException("Unexpected status code: ${response.status.value}")
        }
    }

    suspend fun publishEvent(id: Int, scope: OAuthScope): Event {
        val response = client.put("$baseUrl/events/$id/publish") {
            contentType(ContentType.Application.Json)
            setBody(PublishEventRequest(scope = scope))
        }
        return when (response.status.value) {
            200 -> response.body<EventDataWrapper>().data
            else -> throw RuntimeException("Unexpected status code: ${response.status.value}")
        }
    }
}

class UploadsService internal constructor(
    private val baseUrl: String,
    private val client: HttpClient,
) {
    suspend fun createUpload(request: UploadRequest) {
        val response = client.submitFormWithBinaryData(
            "$baseUrl/uploads",
            formData {
                append("Content-Disposition", request.contentDisposition)
                append("file", request.file, Headers.build {
                    append(HttpHeaders.ContentDisposition, "filename=\"file\"")
                })
            },
        )
        when (response.status.value) {
            201 -> return
            else -> throw RuntimeException("Unexpected status code: ${response.status.value}")
        }
    }
}

class PachcaClient(token: String, baseUrl: String) : Closeable {
    private val client = HttpClient {
        expectSuccess = false
        install(ContentNegotiation) {
            json(Json { explicitNulls = false })
        }
        install(HttpRequestRetry) {
            retryOnServerErrors(maxRetries = 3)
            retryIf { _, response -> response.status.value == 429 }
            delayMillis { retry, response ->
                val retryAfter = response?.headers?.get("Retry-After")?.toLongOrNull()
                if (retryAfter != null) retryAfter * 1000L else retry * 1000L
            }
        }
        defaultRequest {
            bearerAuth(token)
        }
    }

    val events = EventsService(baseUrl, client)
    val uploads = UploadsService(baseUrl, client)

    override fun close() {
        client.close()
    }
}
