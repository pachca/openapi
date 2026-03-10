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
let key = params.key.replacingOccurrences(of: "${filename}", with: filename)
print("  Got direct_url: \(params.directUrl)")

// ── Step 3: Upload the file via SDK ─────────────────────────────

print("Step 3: Uploading file...")
var uploadRequest = FileUploadRequest(
    Content_Disposition: params.Content_Disposition,
    acl: params.acl,
    policy: params.policy,
    xAmzCredential: params.xAmzCredential,
    xAmzAlgorithm: params.xAmzAlgorithm,
    xAmzDate: params.xAmzDate,
    xAmzSignature: params.xAmzSignature,
    key: key,
    file: fileData
)
try await client.common.uploadFile(directUrl: params.directUrl, request: uploadRequest)
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
