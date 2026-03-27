import Foundation
#if canImport(FoundationNetworking)
import FoundationNetworking
#endif

private func pachcaNotImplemented(_ method: String) -> Error {
    NSError(domain: "PachcaClient", code: 1, userInfo: [NSLocalizedDescriptionKey: method + " is not implemented"])
}

open class LinkPreviewsService {
    public init() {}

    open func createLinkPreviews(id: Int, request body: LinkPreviewsRequest) async throws -> Void {
        throw pachcaNotImplemented("Link Previews.createLinkPreviews")
    }
}

public final class LinkPreviewsServiceImpl: LinkPreviewsService {
    let baseURL: String
    let headers: [String: String]
    let session: URLSession

    init(baseURL: String, headers: [String: String], session: URLSession = .shared) {
        self.baseURL = baseURL
        self.headers = headers
        self.session = session
        super.init()
    }

    public override func createLinkPreviews(id: Int, request body: LinkPreviewsRequest) async throws -> Void {
        var request = URLRequest(url: URL(string: "\(baseURL)/messages/\(id)/link_previews")!)
        request.httpMethod = "POST"
        headers.forEach { request.setValue($1, forHTTPHeaderField: $0) }
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try serialize(body)
        let (data, urlResponse) = try await dataWithRetry(session: session, for: request)
        let statusCode = (urlResponse as! HTTPURLResponse).statusCode
        switch statusCode {
        case 201:
            return
        case 401:
            throw try deserialize(OAuthError.self, from: data)
        default:
            throw try deserialize(ApiError.self, from: data)
        }
    }
}

public struct PachcaClient {
    public let linkPreviews: LinkPreviewsService

    private init(linkPreviews: LinkPreviewsService) {
        self.linkPreviews = linkPreviews
    }

    public init(token: String, baseURL: String = "https://api.pachca.com/api/shared/v1", linkPreviews: LinkPreviewsService? = nil) {
        let headers = ["Authorization": "Bearer \(token)"]
        self.init(
            linkPreviews: linkPreviews ?? LinkPreviewsServiceImpl(baseURL: baseURL, headers: headers)
        )
    }

    public static func stub(linkPreviews: LinkPreviewsService = LinkPreviewsService()) -> PachcaClient {
        PachcaClient(
            linkPreviews: linkPreviews
        )
    }
}
