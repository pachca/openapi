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
        return OAuthError(error: OAuthErrorCode(code), errorDescription: object["error_description"] as? String ?? "")
    }
    var apiError = (try? deserialize(ApiError.self, from: data)) ?? ApiError(errors: [])
    apiError.statusCode = statusCode
    return apiError
}

open class MembersService {
    public init() {}

    open func listMembers(sort: SortOrder? = nil, role: MemberRole? = nil, roles: [MemberRole]? = nil, region: Region? = nil) async throws -> ListMembersResponse {
        throw pachcaNotImplemented("Members.listMembers")
    }

    open func updateMember(id: Int, request body: MemberUpdateRequest) async throws -> Member {
        throw pachcaNotImplemented("Members.updateMember")
    }
}

public final class MembersServiceImpl: MembersService {
    let baseURL: String
    let headers: [String: String]
    let session: URLSession

    init(baseURL: String, headers: [String: String], session: URLSession = .shared) {
        self.baseURL = baseURL
        self.headers = headers
        self.session = session
        super.init()
    }

    public override func listMembers(sort: SortOrder? = nil, role: MemberRole? = nil, roles: [MemberRole]? = nil, region: Region? = nil) async throws -> ListMembersResponse {
        var components = URLComponents(string: "\(baseURL)/members")!
        var queryItems: [URLQueryItem] = []
        if let sort { queryItems.append(URLQueryItem(name: "sort", value: sort.rawValue)) }
        if let role { queryItems.append(URLQueryItem(name: "role", value: role.rawValue)) }
        if let roles { roles.forEach { queryItems.append(URLQueryItem(name: "roles[]", value: $0.rawValue)) } }
        if let region { queryItems.append(URLQueryItem(name: "region", value: region.rawValue)) }
        if !queryItems.isEmpty { components.queryItems = queryItems }
        var request = URLRequest(url: components.url!)
        headers.forEach { request.setValue($1, forHTTPHeaderField: $0) }
        let (data, urlResponse) = try await dataWithRetry(session: session, for: request)
        let statusCode = (urlResponse as! HTTPURLResponse).statusCode
        switch statusCode {
        case 200:
            return try deserialize(ListMembersResponse.self, from: data)
        default:
            throw pachcaErrorFromResponse(statusCode, data)
        }
    }

    public override func updateMember(id: Int, request body: MemberUpdateRequest) async throws -> Member {
        var request = URLRequest(url: URL(string: "\(baseURL)/members/\(id)")!)
        request.httpMethod = "PUT"
        headers.forEach { request.setValue($1, forHTTPHeaderField: $0) }
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try serialize(body)
        let (data, urlResponse) = try await dataWithRetry(session: session, for: request)
        let statusCode = (urlResponse as! HTTPURLResponse).statusCode
        switch statusCode {
        case 200:
            return try deserialize(MemberDataWrapper.self, from: data).data
        default:
            throw pachcaErrorFromResponse(statusCode, data)
        }
    }
}

public struct PachcaClient {
    public let members: MembersService

    private init(members: MembersService) {
        self.members = members
    }

    public init(token: String, baseURL: String, members: MembersService? = nil) {
        let headers = ["Authorization": "Bearer \(token)"]
        self.init(
            members: members ?? MembersServiceImpl(baseURL: baseURL, headers: headers)
        )
    }

    public init(baseURL: String, headers: [String: String], session: URLSession = .shared, members: MembersService? = nil) {
        self.init(
            members: members ?? MembersServiceImpl(baseURL: baseURL, headers: headers, session: session)
        )
    }

    public static func stub(members: MembersService = MembersService()) -> PachcaClient {
        PachcaClient(
            members: members
        )
    }
}
