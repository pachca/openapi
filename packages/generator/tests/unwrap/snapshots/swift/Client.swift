import Foundation

private struct ChatDataWrapper: Codable {
    let data: Chat
}

/// D1: addMembers — 1 field unwrapped into function params
struct MembersService {
    let baseURL: String
    let headers: [String: String]
    let session: URLSession

    init(baseURL: String, headers: [String: String], session: URLSession = .shared) {
        self.baseURL = baseURL
        self.headers = headers
        self.session = session
    }

    func addMembers(id: Int, memberIds: [Int]) async throws {
        var request = URLRequest(url: URL(string: "\(baseURL)/chats/\(id)/members")!)
        request.httpMethod = "POST"
        headers.forEach { request.setValue($1, forHTTPHeaderField: $0) }
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONEncoder().encode(AddMembersRequest(memberIds: memberIds))
        let (data, urlResponse) = try await session.data(for: request)
        let statusCode = (urlResponse as! HTTPURLResponse).statusCode
        switch statusCode {
        case 204:
            return
        case 401:
            throw try pachcaDecoder.decode(OAuthError.self, from: data)
        default:
            throw try pachcaDecoder.decode(ApiError.self, from: data)
        }
    }
}

struct ChatsService {
    let baseURL: String
    let headers: [String: String]
    let session: URLSession

    init(baseURL: String, headers: [String: String], session: URLSession = .shared) {
        self.baseURL = baseURL
        self.headers = headers
        self.session = session
    }

    /// D2: archiveChat — void action, no body
    func archiveChat(id: Int) async throws {
        var request = URLRequest(url: URL(string: "\(baseURL)/chats/\(id)/archive")!)
        request.httpMethod = "PUT"
        headers.forEach { request.setValue($1, forHTTPHeaderField: $0) }
        let (data, urlResponse) = try await session.data(for: request)
        let statusCode = (urlResponse as! HTTPURLResponse).statusCode
        switch statusCode {
        case 204:
            return
        case 401:
            throw try pachcaDecoder.decode(OAuthError.self, from: data)
        default:
            throw try pachcaDecoder.decode(ApiError.self, from: data)
        }
    }

    /// D3: createChat — 2+ fields, pass as object
    func createChat(request body: ChatCreateRequest) async throws -> Chat {
        var request = URLRequest(url: URL(string: "\(baseURL)/chats")!)
        request.httpMethod = "POST"
        headers.forEach { request.setValue($1, forHTTPHeaderField: $0) }
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONEncoder().encode(body)
        let (data, urlResponse) = try await session.data(for: request)
        let statusCode = (urlResponse as! HTTPURLResponse).statusCode
        switch statusCode {
        case 201:
            return try pachcaDecoder.decode(ChatDataWrapper.self, from: data).data
        case 401:
            throw try pachcaDecoder.decode(OAuthError.self, from: data)
        default:
            throw try pachcaDecoder.decode(ApiError.self, from: data)
        }
    }
}

struct PachcaClient {
    let chats: ChatsService
    let members: MembersService

    init(baseURL: String, token: String) {
        let headers = ["Authorization": "Bearer \(token)"]
        self.chats = ChatsService(baseURL: baseURL, headers: headers)
        self.members = MembersService(baseURL: baseURL, headers: headers)
    }
}
