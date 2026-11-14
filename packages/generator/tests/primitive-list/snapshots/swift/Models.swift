import Foundation
#if canImport(FoundationNetworking)
import FoundationNetworking
#endif

public struct PaginationMetaPaginate: Codable {
    public let nextPage: String

    public init(nextPage: String) {
        self.nextPage = nextPage
    }

    enum CodingKeys: String, CodingKey {
        case nextPage = "next_page"
    }
}

public struct PaginationMeta: Codable {
    public let paginate: PaginationMetaPaginate

    public init(paginate: PaginationMetaPaginate) {
        self.paginate = paginate
    }
}

public struct ApiErrorItem: Codable {
    public let key: String?
    public let message: String

    public init(key: String? = nil, message: String) {
        self.key = key
        self.message = message
    }
}

public struct ApiError: Codable, Error {
    public let errors: [ApiErrorItem]
    /// HTTP status code of the answer, set by the client. An empty body or one that is not JSON leaves errors empty.
    public var statusCode: Int?

    public init(errors: [ApiErrorItem], statusCode: Int? = nil) {
        self.errors = errors
        self.statusCode = statusCode
    }

    enum CodingKeys: String, CodingKey {
        case errors
    }
}

public struct OAuthError: Codable, Error {
    public let error: String?

    public init(error: String? = nil) {
        self.error = error
    }

    public var localizedDescription: String { error }
}

public struct ListReadMembersResponse: Codable {
    public let data: [Int]
    public let meta: PaginationMeta

    public init(data: [Int], meta: PaginationMeta) {
        self.data = data
        self.meta = meta
    }
}
