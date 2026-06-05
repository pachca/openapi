import Foundation
import PachcaSDK

// HTTP client example — using pre-configured headers and URLSession with optional proxy.
//
// Demonstrates the headers-based initializer.
//
// Usage:
//   PACHCA_TOKEN=your_token PACHCA_CHAT_ID=12345 swift run HttpClient

guard let token = ProcessInfo.processInfo.environment["PACHCA_TOKEN"] else {
    fatalError("Set PACHCA_TOKEN environment variable")
}
guard let chatIdStr = ProcessInfo.processInfo.environment["PACHCA_CHAT_ID"],
      let chatId = Int(chatIdStr) else {
    fatalError("Set PACHCA_CHAT_ID environment variable")
}

let config = URLSessionConfiguration.default
if let proxy = ProcessInfo.processInfo.environment["HTTP_PROXY"],
   let proxyURL = URL(string: proxy) {
    config.connectionProxyDictionary = [
        kCFNetworkProxiesHTTPEnable: true,
        kCFNetworkProxiesHTTPProxy: proxyURL.host ?? "",
        kCFNetworkProxiesHTTPPort: proxyURL.port ?? 8080,
    ]
}
let session = URLSession(configuration: config)

let headers = ["Authorization": "Bearer \(token)"]
let client = PachcaClient(headers: headers, session: session)

let chat = try await client.chats.getChat(id: chatId)
print("Chat: \(chat.name) (id=\(chat.id))")
