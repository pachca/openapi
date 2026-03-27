import Foundation
#if canImport(FoundationNetworking)
import FoundationNetworking
#endif

private func pachcaNotImplemented(_ method: String) -> Error {
    NSError(domain: "PachcaClient", code: 1, userInfo: [NSLocalizedDescriptionKey: method + " is not implemented"])
}

open class EventsService {
    public init() {}

    open func listEvents(isActive: Bool? = nil, scopes: [OAuthScope]? = nil, filter: EventFilter? = nil) async throws -> ListEventsResponse {
        throw pachcaNotImplemented("Events.listEvents")
    }

    open func publishEvent(id: Int, scope: OAuthScope) async throws -> Event {
        throw pachcaNotImplemented("Events.publishEvent")
    }
}

public final class EventsServiceImpl: EventsService {
    let baseURL: String
    let headers: [String: String]
    let session: URLSession

    init(baseURL: String, headers: [String: String], session: URLSession = .shared) {
        self.baseURL = baseURL
        self.headers = headers
        self.session = session
        super.init()
    }

    public override func listEvents(isActive: Bool? = nil, scopes: [OAuthScope]? = nil, filter: EventFilter? = nil) async throws -> ListEventsResponse {
        var components = URLComponents(string: "\(baseURL)/events")!
        var queryItems: [URLQueryItem] = []
        if let isActive { queryItems.append(URLQueryItem(name: "is_active", value: String(isActive))) }
        if let scopes { scopes.forEach { queryItems.append(URLQueryItem(name: "scopes[]", value: $0.rawValue)) } }
        if let filter { queryItems.append(URLQueryItem(name: "filter", value: String(data: try serialize(filter), encoding: .utf8)!)) }
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

    public override func publishEvent(id: Int, scope: OAuthScope) async throws -> Event {
        var request = URLRequest(url: URL(string: "\(baseURL)/events/\(id)/publish")!)
        request.httpMethod = "PUT"
        headers.forEach { request.setValue($1, forHTTPHeaderField: $0) }
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONSerialization.data(withJSONObject: ["scope": scope.rawValue])
        let (data, urlResponse) = try await dataWithRetry(session: session, for: request)
        let statusCode = (urlResponse as! HTTPURLResponse).statusCode
        switch statusCode {
        case 200:
            return try deserialize(EventDataWrapper.self, from: data).data
        default:
            throw URLError(.badServerResponse)
        }
    }
}

open class UploadsService {
    public init() {}

    open func createUpload(request body: UploadRequest) async throws -> Void {
        throw pachcaNotImplemented("Uploads.createUpload")
    }
}

public final class UploadsServiceImpl: UploadsService {
    let baseURL: String
    let headers: [String: String]
    let session: URLSession

    init(baseURL: String, headers: [String: String], session: URLSession = .shared) {
        self.baseURL = baseURL
        self.headers = headers
        self.session = session
        super.init()
    }

    public override func createUpload(request body: UploadRequest) async throws -> Void {
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
        appendField("Content-Disposition", String(describing: body.ContentDisposition))
        data.append("--\(boundary)\r\n".data(using: .utf8)!)
        data.append("Content-Disposition: form-data; name=\"file\"; filename=\"upload\"\r\n".data(using: .utf8)!)
        data.append("Content-Type: application/octet-stream\r\n\r\n".data(using: .utf8)!)
        data.append(body.file)
        data.append("\r\n".data(using: .utf8)!)
        data.append("--\(boundary)--\r\n".data(using: .utf8)!)
        request.httpBody = data
        let (responseData, urlResponse) = try await dataWithRetry(session: session, for: request)
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

    public init(token: String, baseURL: String, events: EventsService? = nil, uploads: UploadsService? = nil) {
        let headers = ["Authorization": "Bearer \(token)"]
        self.events = events ?? EventsServiceImpl(baseURL: baseURL, headers: headers)
        self.uploads = uploads ?? UploadsServiceImpl(baseURL: baseURL, headers: headers)
    }
}
