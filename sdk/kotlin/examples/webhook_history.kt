/**
 * Webhook history example — fetch recent webhook deliveries and inspect payload variants.
 *
 * Usage:
 *
 *   PACHCA_TOKEN=your_token kotlin webhook_history.kt
 */
package examples.webhookhistory

import com.pachca.sdk.*
import kotlinx.coroutines.runBlocking

fun main() = runBlocking {
    val token = System.getenv("PACHCA_TOKEN")
        ?: error("Set PACHCA_TOKEN environment variable")

    val client = PachcaClient(token)
    val response = client.bots.getWebhookEvents(limit = 5)

    println("Fetched ${response.data.size} webhook events")
    response.data.forEachIndexed { index, event ->
        println("${index + 1}. id=${event.id} created_at=${event.createdAt} payload=${summarizePayload(event.payload)}")
    }

    println("has_next=${response.meta.paginate.hasNext} next_page=${response.meta.paginate.nextPage}")
    client.close()
}

private fun summarizePayload(payload: WebhookPayloadUnion): String = when (payload) {
    is LinkSharedWebhookPayload -> "link_shared message_id=${payload.messageId} links=${payload.links.size} user_id=${payload.userId}"
    is MessageWebhookPayload -> "message event=${payload.event} id=${payload.id} chat_id=${payload.chatId}"
    is ReactionWebhookPayload -> "reaction event=${payload.event} message_id=${payload.messageId} code=${payload.code}"
    is ButtonWebhookPayload -> "button message_id=${payload.messageId} user_id=${payload.userId}"
    is ViewSubmitWebhookPayload -> "view user_id=${payload.userId} fields=${payload.data.size}"
    is ChatMemberWebhookPayload -> "chat_member event=${payload.event} chat_id=${payload.chatId} users=${payload.userIds.size}"
    is CompanyMemberWebhookPayload -> "company_member event=${payload.event} users=${payload.userIds.size}"
}
