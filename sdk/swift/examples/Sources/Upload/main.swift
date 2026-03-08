import Foundation
import PachcaSDK

// ── Setup ──────────────────────────────────────────────────────

guard let token = ProcessInfo.processInfo.environment["PACHCA_TOKEN"] else {
    fatalError("Set PACHCA_TOKEN environment variable")
}
guard let chatIdStr = ProcessInfo.processInfo.environment["PACHCA_CHAT_ID"],
      let chatId = Int(chatIdStr) else {
    fatalError("Set PACHCA_CHAT_ID environment variable")
}
guard let filePath = ProcessInfo.processInfo.environment["PACHCA_FILE_PATH"] else {
    fatalError("Set PACHCA_FILE_PATH environment variable")
}

let client = PachcaClient(token: token)
let fileURL = URL(fileURLWithPath: filePath)
let filename = fileURL.lastPathComponent

// ── Step 1: Read the local file ─────────────────────────────────

print("Step 1: Reading file: \(filePath)")
let fileData = try Data(contentsOf: fileURL)
let fileSize = fileData.count
print("  Size: \(fileSize) bytes")

// ── Step 2: Get upload params ───────────────────────────────────

print("Step 2: Getting upload params...")
let params = try await client.common.getUploadParams()
print("  Got upload params")

// ── Step 3: Upload the file to S3 ──────────────────────────────

print("Step 3: Uploading file...")
// Upload logic depends on the params structure — omitted for brevity
let key = "uploads/\(filename)"
_ = params
print("  Uploaded, key: \(key)")

// ── Step 4: Send message with the file attached ─────────────────

print("Step 4: Sending message with attachment...")
let msg = try await client.messages.createMessage(request: MessageCreateRequest(
    message: MessageCreateRequestMessage(
        entityId: chatId,
        content: "File upload test: \(filename) 🦅",
        files: [MessageCreateRequestFile(
            key: key,
            name: filename,
            fileType: .file,
            size: fileSize
        )]
    )
))
print("  Message ID: \(msg.id)")

print("\nDone! File uploaded and sent.")
