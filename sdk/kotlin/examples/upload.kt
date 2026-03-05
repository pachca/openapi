/**
 * File upload example demonstrating the Pachca Kotlin SDK.
 *
 * Uploads a local file and sends it as a message attachment.
 *
 * Usage:
 *
 *   PACHCA_TOKEN=your_token PACHCA_CHAT_ID=12345 PACHCA_FILE_PATH=./photo.png kotlin upload.kt
 */

import com.pachca.PachcaClient
import com.pachca.models.FileType
import com.pachca.models.MessageCreateRequest
import com.pachca.models.MessageCreateRequestMessage
import com.pachca.models.MessageCreateRequestMessageFilesInner
import com.pachca.models.MessageEntityType
import kotlinx.coroutines.runBlocking

fun main() = runBlocking {
    val token = System.getenv("PACHCA_TOKEN")
        ?: error("Set PACHCA_TOKEN environment variable")
    val chatId = System.getenv("PACHCA_CHAT_ID")?.toIntOrNull()
        ?: error("Set PACHCA_CHAT_ID environment variable")
    val filePath = System.getenv("PACHCA_FILE_PATH")
        ?: error("Set PACHCA_FILE_PATH environment variable")

    val file = java.io.File(filePath)
    val filename = file.name

    val client = PachcaClient()
    client.common.setBearerToken(token)
    client.messages.setBearerToken(token)

    // ── Step 1: Read the local file ─────────────────────────────────
    println("1. Reading file: $filePath")
    val fileBytes = file.readBytes()
    val fileSize = fileBytes.size
    println("   Size: $fileSize bytes")

    // ── Step 2: Get upload params ───────────────────────────────────
    println("2. Getting upload params...")
    val params = client.common.getUploadParams().body()
    println("   Got direct_url: ${params.directUrl}")

    // ── Step 3: Upload the file to S3 ──────────────────────────────
    println("3. Uploading file...")
    val key = client.uploadFile(params, fileBytes, filename)
    println("   Uploaded, key: $key")

    // ── Step 4: Send message with the file attached ─────────────────
    println("4. Sending message with attachment...")
    val msg = client.messages.createMessage(
        MessageCreateRequest(
            message = MessageCreateRequestMessage(
                entityType = MessageEntityType.discussion,
                entityId = chatId,
                content = "File upload test: $filename 🚀",
                files = listOf(
                    MessageCreateRequestMessageFilesInner(
                        key = key,
                        name = filename,
                        fileType = FileType.file,
                        propertySize = fileSize,
                    )
                ),
            )
        )
    ).body()
    println("   Message ID: ${msg.data.id}")

    println("\nDone! File uploaded and sent.")
}
