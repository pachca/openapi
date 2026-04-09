import Foundation
#if canImport(FoundationNetworking)
import FoundationNetworking
#endif

private func pachcaNotImplemented(_ method: String) -> Error {
    NSError(domain: "PachcaClient", code: 1, userInfo: [NSLocalizedDescriptionKey: method + " is not implemented"])
}

open class SearchService {
    public init() {}

    open func searchMessages(query: String, chatIds: [Int], userIds: [Int]? = nil, limit: Int? = nil, cursor: String? = nil) async throws -> SearchMessagesResponse {
        throw pachcaNotImplemented("Search.searchMessages")
    }

    open func searchMessagesAll(query: String, chatIds: [Int], userIds: [Int]? = nil, limit: Int? = nil) async throws -> [MessageResult] {
        throw pachcaNotImplemented("Search.searchMessagesAll")
    }
}

public final class SearchServiceImpl: SearchService {
    let baseURL: String
    let headers: [String: String]
    let session: URLSession

    init(baseURL: String, headers: [String: String], session: URLSession = .shared) {
        self.baseURL = baseURL
        self.headers = headers
        self.session = session
        super.init()
    }

    public override func searchMessages(query: String, chatIds: [Int], userIds: [Int]? = nil, limit: Int? = nil, cursor: String? = nil) async throws -> SearchMessagesResponse {
        var components = URLComponents(string: "\(baseURL)/search/messages")!
        var queryItems: [URLQueryItem] = []
        queryItems.append(URLQueryItem(name: "query", value: String(query)))
        chatIds.forEach { queryItems.append(URLQueryItem(name: "chat_ids[]", value: String($0))) }
        if let userIds { userIds.forEach { queryItems.append(URLQueryItem(name: "user_ids[]", value: String($0))) } }
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

    public override func searchMessagesAll(query: String, chatIds: [Int], userIds: [Int]? = nil, limit: Int? = nil) async throws -> [MessageResult] {
        var items: [MessageResult] = []
        var cursor: String? = nil
        repeat {
            let response = try await searchMessages(query: query, chatIds: chatIds, userIds: userIds, limit: limit, cursor: cursor)
            items.append(contentsOf: response.data)
            if response.data.isEmpty { break }
            cursor = response.meta.paginate.nextPage
        } while true
        return items
    }
}

public let pachcaAPIURL = "https://api.pachca.com/api/shared/v1"

public struct PachcaClient {
    public let search: SearchService

    private init(search: SearchService) {
        self.search = search
    }

    public init(token: String, baseURL: String = pachcaAPIURL, search: SearchService? = nil) {
        let headers = ["Authorization": "Bearer \(token)"]
        self.init(
            search: search ?? SearchServiceImpl(baseURL: baseURL, headers: headers)
        )
    }

    public init(baseURL: String = pachcaAPIURL, headers: [String: String], session: URLSession = .shared, search: SearchService? = nil) {
        self.init(
            search: search ?? SearchServiceImpl(baseURL: baseURL, headers: headers, session: session)
        )
    }

    public static func stub(search: SearchService = SearchService()) -> PachcaClient {
        PachcaClient(
            search: search
        )
    }
}
