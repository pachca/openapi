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

open class ReadMembersService {
    public init() {}

    open func listReadMembers(id: Int, limit: Int? = nil, cursor: String? = nil) async throws -> ListReadMembersResponse {
        throw pachcaNotImplemented("Read members.listReadMembers")
    }

    open func listReadMembersAll(id: Int, limit: Int? = nil) async throws -> [Int] {
        throw pachcaNotImplemented("Read members.listReadMembersAll")
    }
}

public final class ReadMembersServiceImpl: ReadMembersService {
    let baseURL: String
    let headers: [String: String]
    let session: URLSession

    init(baseURL: String, headers: [String: String], session: URLSession = .shared) {
        self.baseURL = baseURL
        self.headers = headers
        self.session = session
        super.init()
    }

    public override func listReadMembers(id: Int, limit: Int? = nil, cursor: String? = nil) async throws -> ListReadMembersResponse {
        var components = URLComponents(string: "\(baseURL)/messages/\(id)/read_member_ids")!
        var queryItems: [URLQueryItem] = []
        if let limit { queryItems.append(URLQueryItem(name: "limit", value: String(limit))) }
        if let cursor { queryItems.append(URLQueryItem(name: "cursor", value: String(cursor))) }
        if !queryItems.isEmpty { components.queryItems = queryItems }
        var request = URLRequest(url: components.url!)
        headers.forEach { request.setValue($1, forHTTPHeaderField: $0) }
        let (data, urlResponse) = try await dataWithRetry(session: session, for: request)
        let statusCode = (urlResponse as! HTTPURLResponse).statusCode
        switch statusCode {
        case 200:
            return try deserialize(ListReadMembersResponse.self, from: data)
        default:
            throw pachcaErrorFromResponse(statusCode, data)
        }
    }

    public override func listReadMembersAll(id: Int, limit: Int? = nil) async throws -> [Int] {
        var items: [Int] = []
        var cursor: String? = nil
        repeat {
            let response = try await listReadMembers(id: id, limit: limit, cursor: cursor)
            items.append(contentsOf: response.data)
            if response.data.isEmpty { break }
            cursor = response.meta.paginate.nextPage
        } while true
        return items
    }
}

public let pachcaAPIURL = "https://api.pachca.com/api/shared/v1"

public struct PachcaClient {
    public let readMembers: ReadMembersService

    private init(readMembers: ReadMembersService) {
        self.readMembers = readMembers
    }

    public init(token: String, baseURL: String = pachcaAPIURL, readMembers: ReadMembersService? = nil) {
        let headers = ["Authorization": "Bearer \(token)"]
        self.init(
            readMembers: readMembers ?? ReadMembersServiceImpl(baseURL: baseURL, headers: headers)
        )
    }

    public init(baseURL: String = pachcaAPIURL, headers: [String: String], session: URLSession = .shared, readMembers: ReadMembersService? = nil) {
        self.init(
            readMembers: readMembers ?? ReadMembersServiceImpl(baseURL: baseURL, headers: headers, session: session)
        )
    }

    public static func stub(readMembers: ReadMembersService = ReadMembersService()) -> PachcaClient {
        PachcaClient(
            readMembers: readMembers
        )
    }
}
