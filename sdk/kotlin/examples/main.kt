/**
 * Echo bot example demonstrating the Pachca Kotlin SDK.
 *
 * Runs 8 steps that exercise the core API patterns:
 * create, read, nested resource, idempotent POST, thread reply, pin, update, unpin.
 *
 * Usage:
 *
 *   PACHCA_TOKEN=your_token PACHCA_CHAT_ID=12345 kotlin main.kt
 */
package examples.echobot

import com.pachca.sdk.PachcaClient
import com.pachca.sdk.MessageCreateRequest
import com.pachca.sdk.MessageCreateRequestMessage
import com.pachca.sdk.MessageUpdateRequest
import com.pachca.sdk.MessageUpdateRequestMessage
import com.pachca.sdk.ReactionRequest
import com.pachca.sdk.MessageEntityType
import kotlinx.coroutines.runBlocking
import java.time.Instant

fun main() = runBlocking {
    val token = System.getenv("PACHCA_TOKEN")
        ?: error("Set PACHCA_TOKEN environment variable")
    val chatId = System.getenv("PACHCA_CHAT_ID")?.toIntOrNull()
        ?: error("Set PACHCA_CHAT_ID environment variable")

    val client = PachcaClient(token)

    // ── Step 0: GET — Fetch chat (verifies datetime deserialization) ─
    println("0. Fetching chat...")
    val chat = client.chats.getChat(chatId)
    println("   Chat: ${chat.name}, createdAt=${chat.createdAt} (${chat.createdAt::class.simpleName}), lastMessageAt=${chat.lastMessageAt} (${chat.lastMessageAt::class.simpleName})")

    // ── Step 1: POST — Create a message ──────────────────────────────
    println("1. Creating message...")
    val created = client.messages.createMessage(
        MessageCreateRequest(
            message = MessageCreateRequestMessage(
                entityId = chatId,
                content = "SDK test Kotlin 🚀",
            )
        )
    )
    val msgId = created.id
    println("   Created message ID: $msgId")

    // ── Step 2: GET — Read the message back ──────────────────────────
    println("2. Reading message...")
    val msg = client.messages.getMessage(msgId)
    println("   Got message: \"${msg.content}\"")

    // ── Step 3: POST — Add a reaction (nested resource) ──────────────
    println("3. Adding reaction...")
    client.reactions.addReaction(msgId, ReactionRequest(code = "👀"))
    println("   Added reaction 👀")

    // ── Step 4: POST — Create a thread (idempotent) ──────────────────
    println("4. Creating thread...")
    val thread = client.threads.createThread(msgId)
    println("   Thread ID: ${thread.id}")

    // ── Step 5: POST — Reply inside the thread ───────────────────────
    println("5. Replying in thread...")
    val reply = client.messages.createMessage(
        MessageCreateRequest(
            message = MessageCreateRequestMessage(
                entityType = MessageEntityType.THREAD,
                entityId = thread.id.toInt(),
                content = "Echo: ${msg.content}",
            )
        )
    )
    val replyId = reply.id
    println("   Reply ID: $replyId")

    // ── Step 6: POST — Pin the original message ──────────────────────
    println("6. Pinning message...")
    client.messages.pinMessage(msgId)
    println("   Pinned")

    // ── Step 7: PUT — Edit the reply ─────────────────────────────────
    println("7. Updating reply...")
    client.messages.updateMessage(
        replyId,
        MessageUpdateRequest(
            message = MessageUpdateRequestMessage(
                content = "${reply.content} (processed at ${Instant.now()})",
            )
        )
    )
    println("   Updated")

    // ── Step 8: DELETE — Unpin the original message ──────────────────
    println("8. Unpinning message...")
    client.messages.unpinMessage(msgId)
    println("   Unpinned")

    println("\nDone! All 8 steps completed.")
    client.close()
}
