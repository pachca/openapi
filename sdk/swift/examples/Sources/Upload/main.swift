import Foundation
import PachcaSDK

// ── Setup ──────────────────────────────────────────────────────

guard let token = ProcessInfo.processInfo.environment["PACHCA_TOKEN"] else {
    fatalError("Set PACHCA_TOKEN environment variable")
}
guard let chatIdStr = ProcessInfo.processInfo.environment["PACHCA_CHAT_ID"],
      let chatId = Int32(chatIdStr) else {
    fatalError("Set PACHCA_CHAT_ID environment variable")
}
guard let filePath = ProcessInfo.processInfo.environment["PACHCA_FILE_PATH"] else {
    fatalError("Set PACHCA_FILE_PATH environment variable")
}

let pachca = try PachcaClient(token)

let fileURL = URL(fileURLWithPath: filePath)
let filename = fileURL.lastPathComponent

// ── Step 1: Read the local file ─────────────────────────────────

print("Step 1: Reading file: \(filePath)")
fflush(stdout)
let fileData = try Data(contentsOf: fileURL)
let fileSize = Int32(fileData.count)
print("  Size: \(fileSize) bytes")

// ── Step 2: Get upload params ───────────────────────────────────

print("Step 2: Getting upload params...")
fflush(stdout)
let params = try await pachca.upload.getUploadParams(.init())
print("  Got direct_url: \(params.direct_url)")

// ── Step 3: Upload the file to S3 ──────────────────────────────

print("Step 3: Uploading file...")
fflush(stdout)
let key = try await pachca.uploadFile(params, file: fileData, filename: filename)
print("  Uploaded, key: \(key)")

// ── Step 4: Send message with the file attached ─────────────────

print("Step 4: Sending message with attachment...")
fflush(stdout)
let msg = try await pachca.message.createMessage(.init(
    body: .json(.init(message: .init(
        entity_type: .init(value1: .discussion),
        entity_id: chatId,
        content: "File upload test: \(filename) 🦅",
        files: [.init(
            key: key,
            name: filename,
            file_type: .init(value1: .file),
            size: fileSize
        )]
    )))
))
print("  Message ID: \(msg.data.id)")

print("\nDone! File uploaded and sent.")
