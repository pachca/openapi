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

let baseURL = ProcessInfo.processInfo.environment["PACHCA_BASE_URL"]
    .flatMap { URL(string: $0) }
let pachca = try PachcaClient(token, serverURL: baseURL)
print("Echo Bot started for chat \(chatId)")
fflush(stdout)

// ── Step 1: Send a message ─────────────────────────────────────

print("Step 1: Sending message...")
fflush(stdout)
let created = try await pachca.message.createMessage(.init(
    body: .json(.init(message: .init(
        entity_type: .init(value1: .discussion),
        entity_id: chatId,
        content: "SDK test Swift 🦅"
    )))
))
let messageId = created.data.id
print("  ✓ Created message #\(messageId)")

// ── Step 2: Fetch the message back ─────────────────────────────

print("Step 2: Fetching message...")
let fetched = try await pachca.message.getMessage(.init(path: .init(id: messageId)))
print("  ✓ Fetched: \"\(fetched.data.content)\"")

// ── Step 3: Add a reaction ─────────────────────────────────────

print("Step 3: Adding reaction...")
let reaction = try await pachca.reaction.addReaction(.init(
    path: .init(id: messageId),
    body: .json(.init(code: "👀"))
))
print("  ✓ Added reaction: \(reaction.code)")

// ── Step 4: Create a thread ────────────────────────────────────

print("Step 4: Creating thread...")
let thread = try await pachca.thread.createThread(.init(path: .init(id: messageId)))
print("  ✓ Created thread #\(thread.data.id) (chat_id: \(thread.data.chat_id))")

// ── Step 5: Reply in thread ────────────────────────────────────

print("Step 5: Replying in thread...")
let reply = try await pachca.message.createMessage(.init(
    body: .json(.init(message: .init(
        entity_type: .init(value1: .thread),
        entity_id: Int32(thread.data.id),
        content: "Echo: \(fetched.data.content)"
    )))
))
let replyId = reply.data.id
print("  ✓ Reply #\(replyId): \"\(reply.data.content)\"")

// ── Step 6: Pin the original message ───────────────────────────

print("Step 6: Pinning message...")
try await pachca.message.pinMessage(.init(path: .init(id: messageId)))
print("  ✓ Message pinned")

// ── Step 7: Edit the reply ─────────────────────────────────────

let timestamp = ISO8601DateFormatter().string(from: Date())
print("Step 7: Editing reply...")
let edited = try await pachca.message.updateMessage(.init(
    path: .init(id: replyId),
    body: .json(.init(message: .init(
        content: "Echo: \(fetched.data.content) (processed at \(timestamp))"
    )))
))
print("  ✓ Edited: \"\(edited.data.content)\"")

// ── Step 8: Unpin the message ──────────────────────────────────

print("Step 8: Unpinning message...")
try await pachca.message.unpinMessage(.init(path: .init(id: messageId)))
print("  ✓ Message unpinned")

print("\nEcho Bot completed all 8 steps ✓")
