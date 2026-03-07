import Foundation

struct ChatsService {
    let baseURL: String
    let headers: [String: String]
    let session: URLSession

    init(baseURL: String, headers: [String: String], session: URLSession = .shared) {
        self.baseURL = baseURL
        self.headers = headers
        self.session = session
    }

    func listChats(availability: ChatAvailability? = nil, limit: Int? = nil, cursor: String? = nil, sortField: String? = nil, sortOrder: SortOrder? = nil) async throws -> ListChatsResponse {
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
        let (data, urlResponse) = try await session.data(for: request)
        let statusCode = (urlResponse as! HTTPURLResponse).statusCode
        switch statusCode {
        case 200:
            return try pachcaDecoder.decode(ListChatsResponse.self, from: data)
        case 401:
            throw try pachcaDecoder.decode(OAuthError.self, from: data)
        default:
            throw try pachcaDecoder.decode(ApiError.self, from: data)
        }
    }

    func getChat(id: Int) async throws -> Chat {
        var request = URLRequest(url: URL(string: "\(baseURL)/chats/\(id)")!)
        headers.forEach { request.setValue($1, forHTTPHeaderField: $0) }
        let (data, urlResponse) = try await session.data(for: request)
        let statusCode = (urlResponse as! HTTPURLResponse).statusCode
        switch statusCode {
        case 200:
            return try pachcaDecoder.decode(ChatDataWrapper.self, from: data).data
        case 401:
            throw try pachcaDecoder.decode(OAuthError.self, from: data)
        default:
            throw try pachcaDecoder.decode(ApiError.self, from: data)
        }
    }

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

    func updateChat(id: Int, request body: ChatUpdateRequest) async throws -> Chat {
        var request = URLRequest(url: URL(string: "\(baseURL)/chats/\(id)")!)
        request.httpMethod = "PUT"
        headers.forEach { request.setValue($1, forHTTPHeaderField: $0) }
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONEncoder().encode(body)
        let (data, urlResponse) = try await session.data(for: request)
        let statusCode = (urlResponse as! HTTPURLResponse).statusCode
        switch statusCode {
        case 200:
            return try pachcaDecoder.decode(ChatDataWrapper.self, from: data).data
        case 401:
            throw try pachcaDecoder.decode(OAuthError.self, from: data)
        default:
            throw try pachcaDecoder.decode(ApiError.self, from: data)
        }
    }

    func archiveChat(id: Int) async throws -> Void {
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

    func deleteChat(id: Int) async throws -> Void {
        var request = URLRequest(url: URL(string: "\(baseURL)/chats/\(id)")!)
        request.httpMethod = "DELETE"
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
}

struct PachcaClient {
    let chats: ChatsService

    init(baseURL: String, token: String) {
        let headers = ["Authorization": "Bearer \(token)"]
        self.chats = ChatsService(baseURL: baseURL, headers: headers)
    }
}
