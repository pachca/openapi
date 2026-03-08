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

let client = PachcaClient(token: token)
print("Echo Bot started for chat \(chatId)")

// ── Step 1: Send a message ─────────────────────────────────────

print("Step 1: Sending message...")
let created = try await client.messages.createMessage(request: MessageCreateRequest(
    message: MessageCreateRequestMessage(
        entityId: chatId,
        content: "SDK test Swift 🦅"
    )
))
let messageId = created.id
print("  Created message #\(messageId)")

// ── Step 2: Fetch the message back ─────────────────────────────

print("Step 2: Fetching message...")
let fetched = try await client.messages.getMessage(id: messageId)
print("  Fetched: \"\(fetched.content)\"")

// ── Step 3: Add a reaction ─────────────────────────────────────

print("Step 3: Adding reaction...")
_ = try await client.reactions.addReaction(id: messageId, request: ReactionRequest(code: "👀"))
print("  Added reaction 👀")

// ── Step 4: Create a thread ────────────────────────────────────

print("Step 4: Creating thread...")
let thread = try await client.threads.createThread(id: messageId)
print("  Created thread #\(thread.id)")

// ── Step 5: Reply in thread ────────────────────────────────────

print("Step 5: Replying in thread...")
let reply = try await client.messages.createMessage(request: MessageCreateRequest(
    message: MessageCreateRequestMessage(
        entityType: .thread,
        entityId: Int(thread.id),
        content: "Echo: \(fetched.content)"
    )
))
let replyId = reply.id
print("  Reply #\(replyId): \"\(reply.content)\"")

// ── Step 6: Pin the original message ───────────────────────────

print("Step 6: Pinning message...")
try await client.messages.pinMessage(id: messageId)
print("  Message pinned")

// ── Step 7: Edit the reply ─────────────────────────────────────

let timestamp = ISO8601DateFormatter().string(from: Date())
print("Step 7: Editing reply...")
let edited = try await client.messages.updateMessage(id: replyId, request: MessageUpdateRequest(
    message: MessageUpdateRequestMessage(
        content: "Echo: \(fetched.content) (processed at \(timestamp))"
    )
))
print("  Edited: \"\(edited.content)\"")

// ── Step 8: Unpin the message ──────────────────────────────────

print("Step 8: Unpinning message...")
try await client.messages.unpinMessage(id: messageId)
print("  Message unpinned")

print("\nEcho Bot completed all 8 steps")
