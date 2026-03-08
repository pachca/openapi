import Foundation

public struct MembersService {
    let baseURL: String
    let headers: [String: String]
    let session: URLSession

    init(baseURL: String, headers: [String: String], session: URLSession = .shared) {
        self.baseURL = baseURL
        self.headers = headers
        self.session = session
    }

    public func addMembers(id: Int, memberIds: [Int]) async throws -> Void {
        var request = URLRequest(url: URL(string: "\(baseURL)/chats/\(id)/members")!)
        request.httpMethod = "POST"
        headers.forEach { request.setValue($1, forHTTPHeaderField: $0) }
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONSerialization.data(withJSONObject: ["member_ids": memberIds])
        let (data, urlResponse) = try await session.data(for: request)
        let statusCode = (urlResponse as! HTTPURLResponse).statusCode
        switch statusCode {
        case 204:
            return
        case 401:
            throw try deserialize(OAuthError.self, from: data)
        default:
            throw try deserialize(ApiError.self, from: data)
        }
    }
}

public struct ChatsService {
    let baseURL: String
    let headers: [String: String]
    let session: URLSession

    init(baseURL: String, headers: [String: String], session: URLSession = .shared) {
        self.baseURL = baseURL
        self.headers = headers
        self.session = session
    }

    public func createChat(request body: ChatCreateRequest) async throws -> Chat {
        var request = URLRequest(url: URL(string: "\(baseURL)/chats")!)
        request.httpMethod = "POST"
        headers.forEach { request.setValue($1, forHTTPHeaderField: $0) }
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try serialize(body)
        let (data, urlResponse) = try await session.data(for: request)
        let statusCode = (urlResponse as! HTTPURLResponse).statusCode
        switch statusCode {
        case 201:
            return try deserialize(ChatDataWrapper.self, from: data).data
        case 401:
            throw try deserialize(OAuthError.self, from: data)
        default:
            throw try deserialize(ApiError.self, from: data)
        }
    }

    public func archiveChat(id: Int) async throws -> Void {
        var request = URLRequest(url: URL(string: "\(baseURL)/chats/\(id)/archive")!)
        request.httpMethod = "PUT"
        headers.forEach { request.setValue($1, forHTTPHeaderField: $0) }
        let (data, urlResponse) = try await session.data(for: request)
        let statusCode = (urlResponse as! HTTPURLResponse).statusCode
        switch statusCode {
        case 204:
            return
        case 401:
            throw try deserialize(OAuthError.self, from: data)
        default:
            throw try deserialize(ApiError.self, from: data)
        }
    }
}

public struct PachcaClient {
    public let chats: ChatsService
    public let members: MembersService

    public init(token: String, baseURL: String = "https://api.pachca.com/api/shared/v1") {
        let headers = ["Authorization": "Bearer \(token)"]
        self.chats = ChatsService(baseURL: baseURL, headers: headers)
        self.members = MembersService(baseURL: baseURL, headers: headers)
    }
}
