/**
 * Echo bot example demonstrating the Pachca Kotlin SDK.
 *
 * Covers 8 steps: create → read → reaction → thread → reply → pin → update → unpin
 *
 * Usage:
 *
 *   PACHCA_TOKEN=your_token PACHCA_CHAT_ID=12345 kotlin main.kt
 */

import com.pachca.PachcaClient
import com.pachca.models.*
import io.ktor.client.plugins.*
import io.ktor.client.request.*
import kotlinx.coroutines.runBlocking

fun main() = runBlocking {
    val token = System.getenv("PACHCA_TOKEN")
        ?: error("Set PACHCA_TOKEN environment variable")
    val chatId = System.getenv("PACHCA_CHAT_ID")?.toIntOrNull()
        ?: error("Set PACHCA_CHAT_ID environment variable")

    val client = PachcaClient(
        httpClientConfig = {
            it.defaultRequest {
                header("Authorization", "Bearer $token")
            }
        }
    )

    // ── Step 1: Create a message ─────────────────────────────────────
    println("1. Creating message...")
    val created = client.messages.createMessage(
        MessageCreateRequest(
            message = MessageCreateRequestMessage(
                entityType = MessageEntityType.discussion,
                entityId = chatId,
                content = "SDK test 🚀",
            )
        )
    ).body()
    val msgId = created.data.id
    println("   Message ID: $msgId")

    // ── Step 2: Read message back ────────────────────────────────────
    println("2. Reading message...")
    val msg = client.messages.getMessage(msgId).body()
    println("   Content: ${msg.data.content}")

    // ── Step 3: Add reaction ─────────────────────────────────────────
    println("3. Adding reaction...")
    client.reactions.addReaction(msgId, ReactionRequest(code = "👀"))
    println("   Reaction added")

    // ── Step 4: Create thread ────────────────────────────────────────
    println("4. Creating thread...")
    val thread = client.threads.createThread(msgId).body()
    println("   Thread ID: ${thread.data.id}")

    // ── Step 5: Reply in thread ──────────────────────────────────────
    println("5. Replying in thread...")
    val reply = client.messages.createMessage(
        MessageCreateRequest(
            message = MessageCreateRequestMessage(
                entityType = MessageEntityType.thread,
                entityId = thread.data.id,
                content = "Echo: ${msg.data.content}",
            )
        )
    ).body()
    println("   Reply ID: ${reply.data.id}")

    // ── Step 6: Pin message ──────────────────────────────────────────
    println("6. Pinning message...")
    client.messages.pinMessage(msgId)
    println("   Pinned")

    // ── Step 7: Update reply ─────────────────────────────────────────
    println("7. Updating reply...")
    client.messages.updateMessage(
        reply.data.id,
        MessageUpdateRequest(
            message = MessageUpdateRequestMessage(
                content = "${reply.data.content} (processed)",
            )
        )
    )
    println("   Updated")

    // ── Step 8: Unpin message ────────────────────────────────────────
    println("8. Unpinning message...")
    client.messages.unpinMessage(msgId)
    println("   Unpinned")

    println("\nDone! All 8 steps completed.")
}
