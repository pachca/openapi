import Foundation

public enum SearchSort: String, Codable, CaseIterable {
    /// По релевантности
    case relevance
    /// По дате
    case date
}

public struct MessageSearchResult: Codable {
    public let id: Int
    public let chatId: Int
    public let userId: Int
    public let content: String
    public let createdAt: Date

    public init(id: Int, chatId: Int, userId: Int, content: String, createdAt: Date) {
        self.id = id
        self.chatId = chatId
        self.userId = userId
        self.content = content
        self.createdAt = createdAt
    }

    enum CodingKeys: String, CodingKey {
        case id
        case chatId = "chat_id"
        case userId = "user_id"
        case content
        case createdAt = "created_at"
    }
}

public struct SearchPaginationMetaPaginate: Codable {
    public let nextPage: String

    public init(nextPage: String) {
        self.nextPage = nextPage
    }

    enum CodingKeys: String, CodingKey {
        case nextPage = "next_page"
    }
}

public struct SearchPaginationMeta: Codable {
    public let total: Int
    public let paginate: SearchPaginationMetaPaginate

    public init(total: Int, paginate: SearchPaginationMetaPaginate) {
        self.total = total
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
    public let data: [MessageSearchResult]
    public let meta: SearchPaginationMeta
}
