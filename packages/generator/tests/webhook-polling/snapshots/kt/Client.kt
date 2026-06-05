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
import kotlinx.coroutines.currentCoroutineContext
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.isActive
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.flow.mapNotNull
import kotlinx.serialization.json.Json
import java.io.Closeable
import kotlin.time.Duration
import kotlin.time.Duration.Companion.seconds

interface BotsService {
    suspend fun getWebhookEvents(limit: Int? = null, cursor: String? = null): GetWebhookEventsResponse {
        throw NotImplementedError("Bots.getWebhookEvents is not implemented")
    }

    suspend fun getWebhookEventsAll(limit: Int? = null): List<WebhookEvent> {
        throw NotImplementedError("Bots.getWebhookEventsAll is not implemented")
    }
}

class BotsServiceImpl internal constructor(
    private val baseUrl: String,
    private val client: HttpClient,
) : BotsService {
    override suspend fun getWebhookEvents(limit: Int?, cursor: String?): GetWebhookEventsResponse {
        val response = client.get("$baseUrl/webhooks/events") {
            limit?.let { parameter("limit", it) }
            cursor?.let { parameter("cursor", it) }
        }
        return when (response.status.value) {
            200 -> response.body()
            else -> throw RuntimeException("Unexpected status code: ${response.status.value}")
        }
    }

    override suspend fun getWebhookEventsAll(limit: Int?): List<WebhookEvent> {
        val items = mutableListOf<WebhookEvent>()
        var cursor: String? = null
        var hasNext = true
        while (hasNext) {
            val response = getWebhookEvents(limit = limit, cursor = cursor)
            items.addAll(response.data)
            if (response.data.isEmpty()) break
            cursor = response.meta.paginate.nextPage
            hasNext = response.meta.paginate.hasNext ?: true
        }
        return items
    }
}

fun BotsService.pollWebhookEvents(
    limit: Int? = 50,
    interval: Duration = 5.seconds,
    createdAfter: OffsetDateTime? = null,
    maxSeenDeliveryIds: Int = 5_000,
): Flow<WebhookEvent> = flow {
    require(maxSeenDeliveryIds > 0) { "maxSeenDeliveryIds must be greater than 0" }

    val effectiveCreatedAfter = createdAfter ?: OffsetDateTime.now()
    val seenIdOrder = ArrayDeque<String>()
    val seenIds = mutableSetOf<String>()

    fun remember(id: String): Boolean {
        if (!seenIds.add(id)) return false
        seenIdOrder.addLast(id)
        while (seenIdOrder.size > maxSeenDeliveryIds) {
            seenIds.remove(seenIdOrder.removeFirst())
        }
        return true
    }

    while (currentCoroutineContext().isActive) {
        var cursor: String? = null
        do {
            val response = getWebhookEvents(limit = limit, cursor = cursor)
            var pageHasRecentEvents = false
            for (event in response.data.asReversed()) {
                val matchesCreatedAfter = !event.createdAt.isBefore(effectiveCreatedAfter)
                if (matchesCreatedAfter) pageHasRecentEvents = true
                if (matchesCreatedAfter && remember(event.id)) emit(event)
            }
            val hasNext = (response.meta.paginate.hasNext ?: response.data.isNotEmpty()) && pageHasRecentEvents
            cursor = response.meta.paginate.nextPage
        } while (currentCoroutineContext().isActive && hasNext)
        delay(interval)
    }
}

inline fun <reified T : WebhookPayloadUnion> BotsService.pollWebhookPayloads(
    limit: Int? = 50,
    interval: Duration = 5.seconds,
    createdAfter: OffsetDateTime? = null,
    maxSeenDeliveryIds: Int = 5_000,
): Flow<T> = pollWebhookEvents(
    limit = limit,
    interval = interval,
    createdAfter = createdAfter,
    maxSeenDeliveryIds = maxSeenDeliveryIds,
)
    .mapNotNull { it.payload as? T }

const val PACHCA_API_URL = "https://api.pachca.com/api/shared/v1"

class PachcaClient private constructor(
    private val _client: HttpClient?,
    val bots: BotsService
) : Closeable {

    companion object {
        operator fun invoke(
            token: String,
            baseUrl: String = PACHCA_API_URL,
            bots: BotsService? = null
        ): PachcaClient {
            val client = createClient(token)
            return PachcaClient(
                _client = client,
                bots = bots ?: BotsServiceImpl(baseUrl, client)
            )
        }

        fun stub(
            bots: BotsService = object : BotsService {}
        ): PachcaClient = PachcaClient(
            _client = null,
            bots = bots
        )

        private fun createClient(token: String): HttpClient = HttpClient {
            expectSuccess = false
            install(ContentNegotiation) { json(Json { explicitNulls = false; ignoreUnknownKeys = true }) }
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
        bots: BotsService? = null
    ) : this(
        _client = client,
        bots = bots ?: BotsServiceImpl(baseUrl, client)
    )

    override fun close() {
        _client?.close()
    }
}
