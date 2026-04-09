import Foundation
#if canImport(FoundationNetworking)
import FoundationNetworking
#endif

private func pachcaNotImplemented(_ method: String) -> Error {
    NSError(domain: "PachcaClient", code: 1, userInfo: [NSLocalizedDescriptionKey: method + " is not implemented"])
}

open class ChatsService {
    public init() {}

    open func listChats(availability: ChatAvailability? = nil, limit: Int? = nil, cursor: String? = nil, sortField: String? = nil, sortOrder: SortOrder? = nil) async throws -> ListChatsResponse {
        throw pachcaNotImplemented("Chats.listChats")
    }

    open func listChatsAll(availability: ChatAvailability? = nil, limit: Int? = nil, sortField: String? = nil, sortOrder: SortOrder? = nil) async throws -> [Chat] {
        throw pachcaNotImplemented("Chats.listChatsAll")
    }

    open func getChat(id: Int) async throws -> Chat {
        throw pachcaNotImplemented("Chats.getChat")
    }

    open func createChat(request body: ChatCreateRequest) async throws -> Chat {
        throw pachcaNotImplemented("Chats.createChat")
    }

    open func updateChat(id: Int, request body: ChatUpdateRequest) async throws -> Chat {
        throw pachcaNotImplemented("Chats.updateChat")
    }

    open func archiveChat(id: Int) async throws -> Void {
        throw pachcaNotImplemented("Chats.archiveChat")
    }

    open func deleteChat(id: Int) async throws -> Void {
        throw pachcaNotImplemented("Chats.deleteChat")
    }
}

public final class ChatsServiceImpl: ChatsService {
    let baseURL: String
    let headers: [String: String]
    let session: URLSession

    init(baseURL: String, headers: [String: String], session: URLSession = .shared) {
        self.baseURL = baseURL
        self.headers = headers
        self.session = session
        super.init()
    }

    public override func listChats(availability: ChatAvailability? = nil, limit: Int? = nil, cursor: String? = nil, sortField: String? = nil, sortOrder: SortOrder? = nil) async throws -> ListChatsResponse {
        var components = URLComponents(string: "\(baseURL)/chats")!
        var queryItems: [URLQueryItem] = []
        if let availability { queryItems.append(URLQueryItem(name: "availability", value: availability.rawValue)) }
        if let limit { queryItems.append(URLQueryItem(name: "limit", value: String(limit))) }
        if let cursor { queryItems.append(URLQueryItem(name: "cursor", value: String(cursor))) }
        if let sortField { queryItems.append(URLQueryItem(name: "sort[field]", value: String(sortField))) }
        if let sortOrder { queryItems.append(URLQueryItem(name: "sort[order]", value: sortOrder.rawValue)) }
        if !queryItems.isEmpty { components.queryItems = queryItems }
        var request = URLRequest(url: components.url!)
        headers.forEach { request.setValue($1, forHTTPHeaderField: $0) }
        let (data, urlResponse) = try await dataWithRetry(session: session, for: request)
        let statusCode = (urlResponse as! HTTPURLResponse).statusCode
        switch statusCode {
        case 200:
            return try deserialize(ListChatsResponse.self, from: data)
        case 401:
            throw try deserialize(OAuthError.self, from: data)
        default:
            throw try deserialize(ApiError.self, from: data)
        }
    }

    public override func listChatsAll(availability: ChatAvailability? = nil, limit: Int? = nil, sortField: String? = nil, sortOrder: SortOrder? = nil) async throws -> [Chat] {
        var items: [Chat] = []
        var cursor: String? = nil
        repeat {
            let response = try await listChats(availability: availability, limit: limit, cursor: cursor, sortField: sortField, sortOrder: sortOrder)
            items.append(contentsOf: response.data)
            if response.data.isEmpty { break }
            cursor = response.meta?.paginate.nextPage
        } while cursor != nil
        return items
    }

    public override func getChat(id: Int) async throws -> Chat {
        var request = URLRequest(url: URL(string: "\(baseURL)/chats/\(id)")!)
        headers.forEach { request.setValue($1, forHTTPHeaderField: $0) }
        let (data, urlResponse) = try await dataWithRetry(session: session, for: request)
        let statusCode = (urlResponse as! HTTPURLResponse).statusCode
        switch statusCode {
        case 200:
            return try deserialize(ChatDataWrapper.self, from: data).data
        case 401:
            throw try deserialize(OAuthError.self, from: data)
        default:
            throw try deserialize(ApiError.self, from: data)
        }
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

    public override func updateChat(id: Int, request body: ChatUpdateRequest) async throws -> Chat {
        var request = URLRequest(url: URL(string: "\(baseURL)/chats/\(id)")!)
        request.httpMethod = "PUT"
        headers.forEach { request.setValue($1, forHTTPHeaderField: $0) }
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try serialize(body)
        let (data, urlResponse) = try await dataWithRetry(session: session, for: request)
        let statusCode = (urlResponse as! HTTPURLResponse).statusCode
        switch statusCode {
        case 200:
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

    public override func deleteChat(id: Int) async throws -> Void {
        var request = URLRequest(url: URL(string: "\(baseURL)/chats/\(id)")!)
        request.httpMethod = "DELETE"
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

public let pachcaAPIURL = "https://api.pachca.com/api/shared/v1"

public struct PachcaClient {
    public let chats: ChatsService

    private init(chats: ChatsService) {
        self.chats = chats
    }

    public init(token: String, baseURL: String = pachcaAPIURL, chats: ChatsService? = nil) {
        let headers = ["Authorization": "Bearer \(token)"]
        self.init(
            chats: chats ?? ChatsServiceImpl(baseURL: baseURL, headers: headers)
        )
    }

    public init(baseURL: String = pachcaAPIURL, headers: [String: String], session: URLSession = .shared, chats: ChatsService? = nil) {
        self.init(
            chats: chats ?? ChatsServiceImpl(baseURL: baseURL, headers: headers, session: session)
        )
    }

    public static func stub(chats: ChatsService = ChatsService()) -> PachcaClient {
        PachcaClient(
            chats: chats
        )
    }
}
