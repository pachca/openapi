import Foundation
#if canImport(FoundationNetworking)
import FoundationNetworking
#endif

public struct MessageResult: Codable {
    public let id: Int
    public let content: String

    public init(id: Int, content: String) {
        self.id = id
        self.content = content
    }
}

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

public struct OAuthError: Codable, Error {
    public let error: String?

    public init(error: String? = nil) {
        self.error = error
    }
}

public struct SearchMessagesResponse: Codable {
    public let data: [MessageResult]
    public let meta: PaginationMeta
}
