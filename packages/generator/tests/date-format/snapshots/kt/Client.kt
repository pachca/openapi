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

interface ExportService {
    suspend fun listEvents(
        dateFrom: String,
        dateTo: String? = null,
        createdAfter: OffsetDateTime? = null,
        limit: Int? = null,
    ): ListEventsResponse =
        throw NotImplementedError("Export.listEvents is not implemented")

    suspend fun createExport(request: ExportRequest): Export =
        throw NotImplementedError("Export.createExport is not implemented")
}

class ExportServiceImpl internal constructor(
    private val baseUrl: String,
    private val client: HttpClient,
) : ExportService {
    override suspend fun listEvents(
        dateFrom: String,
        dateTo: String?,
        createdAfter: OffsetDateTime?,
        limit: Int?,
    ): ListEventsResponse {
        val response = client.get("$baseUrl/events") {
            parameter("date_from", dateFrom)
            dateTo?.let { parameter("date_to", it) }
            createdAfter?.let { parameter("created_after", it.toString()) }
            limit?.let { parameter("limit", it) }
        }
        return when (response.status.value) {
            200 -> response.body()
            else -> throw RuntimeException("Unexpected status code: ${response.status.value}")
        }
    }

    override suspend fun createExport(request: ExportRequest): Export {
        val response = client.post("$baseUrl/exports") {
            contentType(ContentType.Application.Json)
            setBody(request)
        }
        return when (response.status.value) {
            201 -> response.body<ExportDataWrapper>().data
            401 -> throw response.body<OAuthError>()
            else -> throw RuntimeException("Unexpected status code: ${response.status.value}")
        }
    }
}

class PachcaClient private constructor(
    private val client: HttpClient?,
    val export: ExportService
) : Closeable {

    companion object {
        operator fun invoke(
            token: String,
            baseUrl: String = "https://api.pachca.com/api/shared/v1",
            export: ExportService? = null
        ): PachcaClient {
            val client = createClient(token)
            return PachcaClient(
                client = client,
                export = export ?: ExportServiceImpl(baseUrl, client)
            )
        }

        fun stub(
            export: ExportService = object : ExportService {}
        ): PachcaClient = PachcaClient(
            client = null,
            export = export
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

    override fun close() {
        client?.close()
    }
}
