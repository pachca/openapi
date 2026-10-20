import Foundation
#if canImport(FoundationNetworking)
import FoundationNetworking
#endif

private func pachcaNotImplemented(_ method: String) -> Error {
    NSError(domain: "PachcaClient", code: 1, userInfo: [NSLocalizedDescriptionKey: method + " is not implemented"])
}

/// An error body is either {"errors": [...]} or the OAuth form {"error", "error_description"},
/// which also comes with 400 and 403 (insufficient_scope, invalid_grant). The body decides the type.
func pachcaErrorFromBody(_ data: Data) -> Error {
    if let object = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
       object["errors"] == nil, let code = object["error"] as? String {
        return OAuthError(error: code, errorDescription: object["error_description"] as? String ?? "")
    }
    if let apiError = try? deserialize(ApiError.self, from: data) { return apiError }
    return URLError(.badServerResponse)
}

open class CommonService {
    public init() {}

    open func downloadExport(id: Int) async throws -> String {
        throw pachcaNotImplemented("Common.downloadExport")
    }
}

public final class CommonServiceImpl: CommonService {
    let baseURL: String
    let headers: [String: String]
    let session: URLSession

    init(baseURL: String, headers: [String: String], session: URLSession = .shared) {
        self.baseURL = baseURL
        self.headers = headers
        self.session = session
        super.init()
    }

    public override func downloadExport(id: Int) async throws -> String {
        var request = URLRequest(url: URL(string: "\(baseURL)/exports/\(id)")!)
        headers.forEach { request.setValue($1, forHTTPHeaderField: $0) }
        let delegate = RedirectPreventer()
        let (data, urlResponse) = try await dataWithRetry(session: session, for: request, delegate: delegate)
        let statusCode = (urlResponse as! HTTPURLResponse).statusCode
        switch statusCode {
        case 302:
            guard let location = (urlResponse as? HTTPURLResponse)?.value(forHTTPHeaderField: "Location") else {
                throw URLError(.badServerResponse)
            }
            return location
        case 401:
            throw try deserialize(OAuthError.self, from: data)
        default:
            throw pachcaErrorFromBody(data)
        }
    }
}

private final class RedirectPreventer: NSObject, URLSessionTaskDelegate {
    func urlSession(
        _ session: URLSession,
        task: URLSessionTask,
        willPerformHTTPRedirection response: HTTPURLResponse,
        newRequest request: URLRequest,
        completionHandler: @escaping (URLRequest?) -> Void
    ) {
        completionHandler(nil)
    }
}

public let pachcaAPIURL = "https://api.pachca.com/api/shared/v1"

public struct PachcaClient {
    public let common: CommonService

    private init(common: CommonService) {
        self.common = common
    }

    public init(token: String, baseURL: String = pachcaAPIURL, common: CommonService? = nil) {
        let headers = ["Authorization": "Bearer \(token)"]
        self.init(
            common: common ?? CommonServiceImpl(baseURL: baseURL, headers: headers)
        )
    }

    public init(baseURL: String = pachcaAPIURL, headers: [String: String], session: URLSession = .shared, common: CommonService? = nil) {
        self.init(
            common: common ?? CommonServiceImpl(baseURL: baseURL, headers: headers, session: session)
        )
    }

    public static func stub(common: CommonService = CommonService()) -> PachcaClient {
        PachcaClient(
            common: common
        )
    }
}
