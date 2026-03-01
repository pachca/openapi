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
    print("Chat #\(chat.id): \(chat.name)")
}
print("Total chats: \(chatsResult.data.count)")
