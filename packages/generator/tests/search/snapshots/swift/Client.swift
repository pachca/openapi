import Foundation
#if canImport(FoundationNetworking)
import FoundationNetworking
#endif

public struct SearchService {
    let baseURL: String
    let headers: [String: String]
    let session: URLSession

    init(baseURL: String, headers: [String: String], session: URLSession = .shared) {
        self.baseURL = baseURL
        self.headers = headers
        self.session = session
    }

    public func searchMessages(query: String, chatIds: [Int]? = nil, userIds: [Int]? = nil, createdFrom: String? = nil, createdTo: String? = nil, sort: SearchSort? = nil, limit: Int? = nil, cursor: String? = nil) async throws -> SearchMessagesResponse {
        var components = URLComponents(string: "\(baseURL)/search/messages")!
        var queryItems: [URLQueryItem] = []
        queryItems.append(URLQueryItem(name: "query", value: String(query)))
        if let chatIds { chatIds.forEach { queryItems.append(URLQueryItem(name: "chat_ids[]", value: String($0))) } }
        if let userIds { userIds.forEach { queryItems.append(URLQueryItem(name: "user_ids[]", value: String($0))) } }
        if let createdFrom { queryItems.append(URLQueryItem(name: "created_from", value: createdFrom)) }
        if let createdTo { queryItems.append(URLQueryItem(name: "created_to", value: createdTo)) }
        if let sort { queryItems.append(URLQueryItem(name: "sort", value: sort.rawValue)) }
        if let limit { queryItems.append(URLQueryItem(name: "limit", value: String(limit))) }
        if let cursor { queryItems.append(URLQueryItem(name: "cursor", value: String(cursor))) }
        if !queryItems.isEmpty { components.queryItems = queryItems }
        var request = URLRequest(url: components.url!)
        headers.forEach { request.setValue($1, forHTTPHeaderField: $0) }
        let (data, urlResponse) = try await dataWithRetry(session: session, for: request)
        let statusCode = (urlResponse as! HTTPURLResponse).statusCode
        switch statusCode {
        case 200:
            return try deserialize(SearchMessagesResponse.self, from: data)
        case 401:
            throw try deserialize(OAuthError.self, from: data)
        default:
            throw URLError(.badServerResponse)
        }
    }

    public func searchMessagesAll(query: String, chatIds: [Int]? = nil, userIds: [Int]? = nil, createdFrom: String? = nil, createdTo: String? = nil, sort: SearchSort? = nil, limit: Int? = nil) async throws -> [MessageSearchResult] {
        var items: [MessageSearchResult] = []
        var cursor: String? = nil
        repeat {
            let response = try await searchMessages(query: query, chatIds: chatIds, userIds: userIds, createdFrom: createdFrom, createdTo: createdTo, sort: sort, limit: limit, cursor: cursor)
            items.append(contentsOf: response.data)
            if response.data.isEmpty { break }
            cursor = response.meta.paginate.nextPage
        } while true
        return items
    }
}

public struct PachcaClient {
    public let search: SearchService

    public init(token: String, baseURL: String = "https://api.pachca.com/api/shared/v1") {
        let headers = ["Authorization": "Bearer \(token)"]
        self.search = SearchService(baseURL: baseURL, headers: headers)
    }
}
