import Foundation
import PachcaSDK

// Stub client example — unit-testing with dependency injection.
//
// Demonstrates PachcaClient.stub() with a custom MessagesService override.

class FakeMessages: MessagesService {
    override func getMessage(id: Int) async throws -> Message {
        return Message(
            id: 1,
            entityType: .discussion,
            entityId: 1,
            chatId: 1,
            rootChatId: 1,
            content: "fake message",
            userId: 1,
            createdAt: "",
            url: "",
            files: [],
            buttons: nil,
            thread: nil,
            forwarding: nil,
            parentMessageId: nil,
            displayAvatarUrl: nil
        )
    }
}

let client = PachcaClient.stub(messages: FakeMessages())

let msg = try await client.messages.getMessage(id: 1)
print("Got: \"\(msg.content)\" (id=\(msg.id))")
