import Foundation

public struct EventsService {
    let baseURL: String
    let headers: [String: String]
    let session: URLSession

    init(baseURL: String, headers: [String: String], session: URLSession = .shared) {
        self.baseURL = baseURL
        self.headers = headers
        self.session = session
    }

    public func listEvents(isActive: Bool? = nil, scopes: [OAuthScope]? = nil, filter: EventFilter? = nil) async throws -> ListEventsResponse {
        var components = URLComponents(string: "\(baseURL)/events")!
        var queryItems: [URLQueryItem] = []
        if let isActive { queryItems.append(URLQueryItem(name: "is_active", value: String(isActive))) }
        if let scopes { scopes.forEach { queryItems.append(URLQueryItem(name: "scopes", value: $0.rawValue)) } }
        if let filter { queryItems.append(URLQueryItem(name: "filter", value: String(data: try! pachcaEncoder.encode(filter), encoding: .utf8)!)) }
        if !queryItems.isEmpty { components.queryItems = queryItems }
        var request = URLRequest(url: components.url!)
        headers.forEach { request.setValue($1, forHTTPHeaderField: $0) }
        let (data, urlResponse) = try await session.data(for: request)
        let statusCode = (urlResponse as! HTTPURLResponse).statusCode
        switch statusCode {
        case 200:
            return try pachcaDecoder.decode(ListEventsResponse.self, from: data)
        default:
            throw URLError(.badServerResponse)
        }
    }

    public func publishEvent(id: Int, scope: OAuthScope) async throws -> Event {
        var request = URLRequest(url: URL(string: "\(baseURL)/events/\(id)/publish")!)
        request.httpMethod = "PUT"
        headers.forEach { request.setValue($1, forHTTPHeaderField: $0) }
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONSerialization.data(withJSONObject: ["scope": scope])
        let (data, urlResponse) = try await session.data(for: request)
        let statusCode = (urlResponse as! HTTPURLResponse).statusCode
        switch statusCode {
        case 200:
            return try pachcaDecoder.decode(EventDataWrapper.self, from: data).data
        default:
            throw URLError(.badServerResponse)
        }
    }
}

public struct UploadsService {
    let baseURL: String
    let headers: [String: String]
    let session: URLSession

    init(baseURL: String, headers: [String: String], session: URLSession = .shared) {
        self.baseURL = baseURL
        self.headers = headers
        self.session = session
    }

    public func createUpload(request body: UploadRequest) async throws -> Void {
        var request = URLRequest(url: URL(string: "\(baseURL)/uploads")!)
        request.httpMethod = "POST"
        headers.forEach { request.setValue($1, forHTTPHeaderField: $0) }
        let boundary = UUID().uuidString
        request.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")
        var data = Data()
        func appendField(_ name: String, _ value: String) {
            data.append("--\(boundary)\r\n".data(using: .utf8)!)
            data.append("Content-Disposition: form-data; name=\"\(name)\"\r\n\r\n".data(using: .utf8)!)
            data.append("\(value)\r\n".data(using: .utf8)!)
        }
        appendField("Content-Disposition", String(describing: body.Content_Disposition))
        data.append("--\(boundary)\r\n".data(using: .utf8)!)
        data.append("Content-Disposition: form-data; name=\"file\"; filename=\"upload\"\r\n".data(using: .utf8)!)
        data.append("Content-Type: application/octet-stream\r\n\r\n".data(using: .utf8)!)
        data.append(body.file)
        data.append("\r\n".data(using: .utf8)!)
        data.append("--\(boundary)--\r\n".data(using: .utf8)!)
        request.httpBody = data
        let (responseData, urlResponse) = try await session.data(for: request)
        let statusCode = (urlResponse as! HTTPURLResponse).statusCode
        switch statusCode {
        case 201:
            return
        default:
            throw URLError(.badServerResponse)
        }
    }
}

public struct PachcaClient {
    public let events: EventsService
    public let uploads: UploadsService

    public init(token: String, baseURL: String) {
        let headers = ["Authorization": "Bearer \(token)"]
        self.events = EventsService(baseURL: baseURL, headers: headers)
        self.uploads = UploadsService(baseURL: baseURL, headers: headers)
    }
}
