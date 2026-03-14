import Foundation

public struct CommonService {
    let baseURL: String
    let headers: [String: String]
    let session: URLSession

    init(baseURL: String, headers: [String: String], session: URLSession = .shared) {
        self.baseURL = baseURL
        self.headers = headers
        self.session = session
    }

    public func downloadExport(id: Int) async throws -> String {
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
            throw try deserialize(ApiError.self, from: data)
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

public struct PachcaClient {
    public let common: CommonService

    public init(token: String, baseURL: String = "https://api.pachca.com/api/shared/v1") {
        let headers = ["Authorization": "Bearer \(token)"]
        self.common = CommonService(baseURL: baseURL, headers: headers)
    }
}
