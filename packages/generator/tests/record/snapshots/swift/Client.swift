import Foundation

struct LinkPreviewsService {
    let baseURL: String
    let headers: [String: String]
    let session: URLSession

    init(baseURL: String, headers: [String: String], session: URLSession = .shared) {
        self.baseURL = baseURL
        self.headers = headers
        self.session = session
    }

    func createLinkPreviews(id: Int, request body: LinkPreviewsRequest) async throws -> Void {
        var request = URLRequest(url: URL(string: "\(baseURL)/messages/\(id)/link_previews")!)
        request.httpMethod = "POST"
        headers.forEach { request.setValue($1, forHTTPHeaderField: $0) }
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONEncoder().encode(body)
        let (data, urlResponse) = try await session.data(for: request)
        let statusCode = (urlResponse as! HTTPURLResponse).statusCode
        switch statusCode {
        case 201:
            return
        case 401:
            throw try pachcaDecoder.decode(OAuthError.self, from: data)
        default:
            throw try pachcaDecoder.decode(ApiError.self, from: data)
        }
    }
}

struct PachcaClient {
    let linkPreviews: LinkPreviewsService

    init(baseURL: String, token: String) {
        let headers = ["Authorization": "Bearer \(token)"]
        self.linkPreviews = LinkPreviewsService(baseURL: baseURL, headers: headers)
    }
}
