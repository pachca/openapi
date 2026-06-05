/**
 * Stub client example — unit-testing with dependency injection.
 *
 * Demonstrates PachcaClient.stub() with a custom MessagesService override.
 *
 * Usage:
 *
 *   kotlin stub.kt
 */
package examples.stub

import com.pachca.sdk.PachcaClient
import com.pachca.sdk.MessagesService
import com.pachca.sdk.Message
import com.pachca.sdk.MessageEntityType
import kotlinx.coroutines.runBlocking
import java.time.OffsetDateTime

class FakeMessages : MessagesService {
    override suspend fun getMessage(id: Int): Message {
        return Message(
            id = 1,
            entityType = MessageEntityType.DISCUSSION,
            entityId = 1,
            chatId = 1,
            rootChatId = 1,
            content = "fake message",
            userId = 1,
            createdAt = OffsetDateTime.now(),
            url = "",
            files = emptyList(),
        )
    }
}

fun main() = runBlocking {
    val client = PachcaClient.stub(messages = FakeMessages())

    val msg = client.messages.getMessage(1)
    println("Got: \"${msg.content}\" (id=${msg.id})")

    client.close()
}
