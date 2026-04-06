import Foundation
#if canImport(FoundationNetworking)
import FoundationNetworking
#endif

public struct ExportService {
    let baseURL: String
    let headers: [String: String]
    let session: URLSession

    init(baseURL: String, headers: [String: String], session: URLSession = .shared) {
        self.baseURL = baseURL
        self.headers = headers
        self.session = session
    }

    public func listEvents(dateFrom: String, dateTo: String? = nil, createdAfter: String? = nil, limit: Int? = nil) async throws -> ListEventsResponse {
        var components = URLComponents(string: "\(baseURL)/events")!
        var queryItems: [URLQueryItem] = []
        queryItems.append(URLQueryItem(name: "date_from", value: String(dateFrom)))
        if let dateTo { queryItems.append(URLQueryItem(name: "date_to", value: String(dateTo))) }
        if let createdAfter { queryItems.append(URLQueryItem(name: "created_after", value: createdAfter)) }
        if let limit { queryItems.append(URLQueryItem(name: "limit", value: String(limit))) }
        if !queryItems.isEmpty { components.queryItems = queryItems }
        var request = URLRequest(url: components.url!)
        headers.forEach { request.setValue($1, forHTTPHeaderField: $0) }
        let (data, urlResponse) = try await dataWithRetry(session: session, for: request)
        let statusCode = (urlResponse as! HTTPURLResponse).statusCode
        switch statusCode {
        case 200:
            return try deserialize(ListEventsResponse.self, from: data)
        default:
            throw URLError(.badServerResponse)
        }
    }

    public func createExport(request body: ExportRequest) async throws -> Export {
        var request = URLRequest(url: URL(string: "\(baseURL)/exports")!)
        request.httpMethod = "POST"
        headers.forEach { request.setValue($1, forHTTPHeaderField: $0) }
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try serialize(body)
        let (data, urlResponse) = try await dataWithRetry(session: session, for: request)
        let statusCode = (urlResponse as! HTTPURLResponse).statusCode
        switch statusCode {
        case 201:
            return try deserialize(ExportDataWrapper.self, from: data).data
        case 401:
            throw try deserialize(OAuthError.self, from: data)
        default:
            throw URLError(.badServerResponse)
        }
    }
}

public struct PachcaClient {
    public let export: ExportService

    public init(token: String, baseURL: String = "https://api.pachca.com/api/shared/v1") {
        let headers = ["Authorization": "Bearer \(token)"]
        self.export = ExportService(baseURL: baseURL, headers: headers)
    }
}
