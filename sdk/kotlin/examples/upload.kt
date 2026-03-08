/**
 * File upload example demonstrating the Pachca Kotlin SDK.
 *
 * Uploads a local file and sends it as a message attachment.
 *
 * Usage:
 *
 *   PACHCA_TOKEN=your_token PACHCA_CHAT_ID=12345 PACHCA_FILE_PATH=./photo.png gradle runExample -Dexample=examples.upload.MainKt
 */
package examples.upload

import com.pachca.sdk.PachcaClient
import com.pachca.sdk.FileUploadRequest
import com.pachca.sdk.MessageCreateRequest
import com.pachca.sdk.MessageCreateRequestMessage
import com.pachca.sdk.MessageCreateRequestFile
import com.pachca.sdk.FileType
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

    val client = PachcaClient(token)

    // ── Step 1: Read the local file ─────────────────────────────────
    println("1. Reading file: $filePath")
    val fileBytes = file.readBytes()
    val fileSize = fileBytes.size
    println("   Size: $fileSize bytes")

    // ── Step 2: Get upload params ───────────────────────────────────
    println("2. Getting upload params...")
    val params = client.common.getUploadParams()
    val key = params.key.replace("\${filename}", filename)
    println("   Got direct_url: ${params.directUrl}")

    // ── Step 3: Upload the file via SDK ─────────────────────────────
    println("3. Uploading file...")
    client.common.uploadFile(
        FileUploadRequest(
            contentDisposition = params.contentDisposition,
            acl = params.acl,
            policy = params.policy,
            xAmzCredential = params.xAmzCredential,
            xAmzAlgorithm = params.xAmzAlgorithm,
            xAmzDate = params.xAmzDate,
            xAmzSignature = params.xAmzSignature,
            key = key,
            file = fileBytes,
        ),
        url = params.directUrl,
    )
    println("   Uploaded, key: $key")

    // ── Step 4: Send message with the file attached ─────────────────
    println("4. Sending message with attachment...")
    val msg = client.messages.createMessage(
        MessageCreateRequest(
            message = MessageCreateRequestMessage(
                entityId = chatId,
                content = "File upload test: $filename 🚀",
                files = listOf(
                    MessageCreateRequestFile(
                        key = key,
                        name = filename,
                        fileType = FileType.FILE,
                        size = fileSize,
                    )
                ),
            )
        )
    )
    println("   Message ID: ${msg.id}")

    println("\nDone! File uploaded and sent.")
    client.close()
}
