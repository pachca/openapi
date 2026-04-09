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

interface EventsService {
    suspend fun listEvents(
        isActive: Boolean? = null,
        scopes: List<OAuthScope>? = null,
        filter: EventFilter? = null,
    ): ListEventsResponse {
        throw NotImplementedError("Events.listEvents is not implemented")
    }

    suspend fun publishEvent(id: Int, scope: OAuthScope): Event {
        throw NotImplementedError("Events.publishEvent is not implemented")
    }
}

class EventsServiceImpl internal constructor(
    private val baseUrl: String,
    private val client: HttpClient,
) : EventsService {
    override suspend fun listEvents(
        isActive: Boolean?,
        scopes: List<OAuthScope>?,
        filter: EventFilter?,
    ): ListEventsResponse {
        val response = client.get("$baseUrl/events") {
            isActive?.let { parameter("is_active", it) }
            scopes?.forEach { parameter("scopes[]", it.value) }
            filter?.let { parameter("filter", it) }
        }
        return when (response.status.value) {
            200 -> response.body()
            else -> throw RuntimeException("Unexpected status code: ${response.status.value}")
        }
    }

    override suspend fun publishEvent(id: Int, scope: OAuthScope): Event {
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

interface UploadsService {
    suspend fun createUpload(request: UploadRequest) {
        throw NotImplementedError("Uploads.createUpload is not implemented")
    }
}

class UploadsServiceImpl internal constructor(
    private val baseUrl: String,
    private val client: HttpClient,
) : UploadsService {
    override suspend fun createUpload(request: UploadRequest) {
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

class PachcaClient private constructor(
    private val _client: HttpClient?,
    val events: EventsService,
    val uploads: UploadsService
) : Closeable {

    companion object {
        operator fun invoke(
            token: String,
            baseUrl: String,
            events: EventsService? = null,
            uploads: UploadsService? = null
        ): PachcaClient {
            val client = createClient(token)
            return PachcaClient(
                _client = client,
                events = events ?: EventsServiceImpl(baseUrl, client),
                uploads = uploads ?: UploadsServiceImpl(baseUrl, client)
            )
        }

        fun stub(
            events: EventsService = object : EventsService {},
            uploads: UploadsService = object : UploadsService {}
        ): PachcaClient = PachcaClient(
            _client = null,
            events = events,
            uploads = uploads
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
        baseUrl: String,
        events: EventsService? = null,
        uploads: UploadsService? = null
    ) : this(
        _client = client,
        events = events ?: EventsServiceImpl(baseUrl, client),
        uploads = uploads ?: UploadsServiceImpl(baseUrl, client)
    )

    override fun close() {
        _client?.close()
    }
}
