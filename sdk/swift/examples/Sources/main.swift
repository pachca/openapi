import Foundation
import PachcaSDK

guard let token = ProcessInfo.processInfo.environment["PACHCA_TOKEN"] else {
    print("Set PACHCA_TOKEN environment variable")
    exit(1)
}

let pachca = try PachcaClient(token)

// List chats
let chatsResult = try await pachca.chat.listChats(.init())
for chat in chatsResult.data {
    print("Chat: \(chat.name)")
}

// Send a message
let chatId = chatsResult.data.first!.id
let messageResult = try await pachca.message.createMessage(.init(
    body: .json(.init(message: .init(
        entity_type: .init(value1: .discussion),
        entity_id: chatId,
        content: "Hello from Swift SDK!"
    )))
))
print("Sent message #\(messageResult.data.id)")

// Add a reaction
_ = try await pachca.reaction.addReaction(.init(
    path: .init(id: messageResult.data.id),
    body: .json(.init(code: "👍"))
))
print("Reaction added")

// List users
let usersResult = try await pachca.user.listUsers(.init())
print("Users: \(usersResult.data.count)")
