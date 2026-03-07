import Foundation

enum SearchSort: String, Codable, CaseIterable {
    /// По релевантности
    case relevance
    /// По дате
    case date
}

struct MessageSearchResult: Codable {
    let id: Int
    let chatId: Int
    let userId: Int
    let content: String
    let createdAt: Date

    enum CodingKeys: String, CodingKey {
        case id
        case chatId = "chat_id"
        case userId = "user_id"
        case content
        case createdAt = "created_at"
    }
}

struct SearchPaginationMeta: Codable {
    let total: Int
    let paginate: Paginate

    struct Paginate: Codable {
        let nextPage: String

        enum CodingKeys: String, CodingKey {
            case nextPage = "next_page"
        }
    }
}

struct OAuthError: Codable, Error {
    let error: String?
}

struct SearchMessagesResponse: Codable {
    let data: [MessageSearchResult]
    let meta: SearchPaginationMeta
}
