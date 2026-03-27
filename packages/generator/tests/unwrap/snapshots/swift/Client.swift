import Foundation
#if canImport(FoundationNetworking)
import FoundationNetworking
#endif

private func pachcaNotImplemented(_ method: String) -> Error {
    NSError(domain: "PachcaClient", code: 1, userInfo: [NSLocalizedDescriptionKey: method + " is not implemented"])
}

open class MembersService {
    public init() {}

    open func addMembers(id: Int, memberIds: [Int]) async throws -> Void {
        throw pachcaNotImplemented("Members.addMembers")
    }
}

public final class MembersServiceImpl: MembersService {
    let baseURL: String
    let headers: [String: String]
    let session: URLSession

    init(baseURL: String, headers: [String: String], session: URLSession = .shared) {
        super.init()
        self.baseURL = baseURL
        self.headers = headers
        self.session = session
    }

    public override func addMembers(id: Int, memberIds: [Int]) async throws -> Void {
        var request = URLRequest(url: URL(string: "\(baseURL)/chats/\(id)/members")!)
        request.httpMethod = "POST"
        headers.forEach { request.setValue($1, forHTTPHeaderField: $0) }
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONSerialization.data(withJSONObject: ["member_ids": memberIds])
        let (data, urlResponse) = try await dataWithRetry(session: session, for: request)
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

open class ChatsService {
    public init() {}

    open func createChat(request body: ChatCreateRequest) async throws -> Chat {
        throw pachcaNotImplemented("Chats.createChat")
    }

    open func archiveChat(id: Int) async throws -> Void {
        throw pachcaNotImplemented("Chats.archiveChat")
    }
}

public final class ChatsServiceImpl: ChatsService {
    let baseURL: String
    let headers: [String: String]
    let session: URLSession

    init(baseURL: String, headers: [String: String], session: URLSession = .shared) {
        super.init()
        self.baseURL = baseURL
        self.headers = headers
        self.session = session
    }

    public override func createChat(request body: ChatCreateRequest) async throws -> Chat {
        var request = URLRequest(url: URL(string: "\(baseURL)/chats")!)
        request.httpMethod = "POST"
        headers.forEach { request.setValue($1, forHTTPHeaderField: $0) }
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try serialize(body)
        let (data, urlResponse) = try await dataWithRetry(session: session, for: request)
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

    public override func archiveChat(id: Int) async throws -> Void {
        var request = URLRequest(url: URL(string: "\(baseURL)/chats/\(id)/archive")!)
        request.httpMethod = "PUT"
        headers.forEach { request.setValue($1, forHTTPHeaderField: $0) }
        let (data, urlResponse) = try await dataWithRetry(session: session, for: request)
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

public struct PachcaServices {
    public var chats: ChatsService? = nil
    public var members: MembersService? = nil

    public init() {}
}

public struct PachcaClient {
    public let chats: ChatsService
    public let members: MembersService

    public init(token: String, baseURL: String = "https://api.pachca.com/api/shared/v1", services: PachcaServices = PachcaServices()) {
        let headers = ["Authorization": "Bearer \(token)"]
        self.chats = services.chats ?? ChatsServiceImpl(baseURL: baseURL, headers: headers)
        self.members = services.members ?? MembersServiceImpl(baseURL: baseURL, headers: headers)
    }
}
