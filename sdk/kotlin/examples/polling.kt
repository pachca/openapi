/**
 * Minimal webhook polling example.
 *
 * This example uses the generated Kotlin polling helper and prints each
 * collected event with its default string representation.
 *
 * Usage:
 *
 *   PACHCA_TOKEN=your_bot_token ./gradlew runExample -Dexample=examples.polling.PollingKt -Pversion=0.0.0
 *   PACHCA_TOKEN=your_bot_token ./gradlew runExample -Dexample=examples.polling.PollingKt -Pversion=0.0.0 --args="--payloads"
 */
package examples.polling

import com.pachca.sdk.PachcaClient
import com.pachca.sdk.WebhookPayloadUnion
import com.pachca.sdk.pollWebhookEvents
import com.pachca.sdk.pollWebhookPayloads
import kotlinx.coroutines.flow.collect
import kotlinx.coroutines.runBlocking
import java.time.OffsetDateTime
import kotlin.time.Duration.Companion.seconds

fun main(args: Array<String>) = runBlocking {
    val token = System.getenv("PACHCA_TOKEN")
        ?: error("Set PACHCA_TOKEN environment variable")
    val pollPayloadsOnly = "--payloads" in args

    PachcaClient(token).use { client ->
        val startedAt = OffsetDateTime.now()

        println("Webhook polling worker started")
        println("poll_limit=50 poll_interval=2s")
        println("waiting_for_events_created_after=$startedAt")

        if (pollPayloadsOnly) {
            client.bots.pollWebhookPayloads<WebhookPayloadUnion>(
                limit = 50,
                interval = 2.seconds,
                createdAfter = startedAt,
                maxSeenDeliveryIds = 5_000,
            ).collect { payload ->
                println(payload.toString())
            }
        } else {
            client.bots.pollWebhookEvents(
                limit = 50,
                interval = 2.seconds,
                createdAfter = startedAt,
                maxSeenDeliveryIds = 5_000,
            ).collect { event ->
                println(event.toString())
            }
        }
    }
}
