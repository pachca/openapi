import Foundation
#if canImport(FoundationNetworking)
import FoundationNetworking
#endif

private func pachcaNotImplemented(_ method: String) -> Error {
    NSError(domain: "PachcaClient", code: 1, userInfo: [NSLocalizedDescriptionKey: method + " is not implemented"])
}

/// An error body is either {"errors": [...]} or the OAuth form {"error", "error_description"},
/// which also comes with 400 and 403 (insufficient_scope, invalid_grant). The body decides the type.
/// An empty body or one that is not JSON gives an ApiError with no errors. The status code stays in statusCode.
func pachcaErrorFromResponse(_ statusCode: Int, _ data: Data) -> Error {
    if let object = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
       object["errors"] == nil, let code = object["error"] as? String {
        return OAuthError(error: code, errorDescription: object["error_description"] as? String ?? "")
    }
    var apiError = (try? deserialize(ApiError.self, from: data)) ?? ApiError(errors: [])
    apiError.statusCode = statusCode
    return apiError
}

open class MessagesService {
    public init() {}

    open func createMessage(request body: MessageCreateRequest) async throws -> Message {
        throw pachcaNotImplemented("Messages.createMessage")
    }

    open func updateMessage(id: Int, request body: MessageUpdateRequest) async throws -> Message {
        throw pachcaNotImplemented("Messages.updateMessage")
    }
}

public final class MessagesServiceImpl: MessagesService {
    let baseURL: String
    let headers: [String: String]
    let session: URLSession

    init(baseURL: String, headers: [String: String], session: URLSession = .shared) {
        self.baseURL = baseURL
        self.headers = headers
        self.session = session
        super.init()
    }

    public override func createMessage(request body: MessageCreateRequest) async throws -> Message {
        var request = URLRequest(url: URL(string: "\(baseURL)/messages")!)
        request.httpMethod = "POST"
        headers.forEach { request.setValue($1, forHTTPHeaderField: $0) }
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try serialize(body)
        let (data, urlResponse) = try await dataWithRetry(session: session, for: request)
        let statusCode = (urlResponse as! HTTPURLResponse).statusCode
        switch statusCode {
        case 201:
            return try deserialize(MessageDataWrapper.self, from: data).data
        default:
            throw pachcaErrorFromResponse(statusCode, data)
        }
    }

    public override func updateMessage(id: Int, request body: MessageUpdateRequest) async throws -> Message {
        var request = URLRequest(url: URL(string: "\(baseURL)/messages/\(id)")!)
        request.httpMethod = "PUT"
        headers.forEach { request.setValue($1, forHTTPHeaderField: $0) }
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try serialize(body)
        let (data, urlResponse) = try await dataWithRetry(session: session, for: request)
        let statusCode = (urlResponse as! HTTPURLResponse).statusCode
        switch statusCode {
        case 200:
            return try deserialize(MessageDataWrapper.self, from: data).data
        default:
            throw pachcaErrorFromResponse(statusCode, data)
        }
    }
}

public let pachcaAPIURL = "https://api.pachca.com/api/shared/v1"

public struct PachcaClient {
    public let messages: MessagesService

    private init(messages: MessagesService) {
        self.messages = messages
    }

    public init(token: String, baseURL: String = pachcaAPIURL, messages: MessagesService? = nil) {
        let headers = ["Authorization": "Bearer \(token)"]
        self.init(
            messages: messages ?? MessagesServiceImpl(baseURL: baseURL, headers: headers)
        )
    }

    public init(baseURL: String = pachcaAPIURL, headers: [String: String], session: URLSession = .shared, messages: MessagesService? = nil) {
        self.init(
            messages: messages ?? MessagesServiceImpl(baseURL: baseURL, headers: headers, session: session)
        )
    }

    public static func stub(messages: MessagesService = MessagesService()) -> PachcaClient {
        PachcaClient(
            messages: messages
        )
    }
}
