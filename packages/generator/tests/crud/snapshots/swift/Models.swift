import Foundation

enum SortOrder: String, Codable, CaseIterable {
    case asc
    case desc
}

enum ChatAvailability: String, Codable, CaseIterable {
    /// Чаты, где пользователь является участником
    case isMember = "is_member"
    /// Все открытые чаты компании
    case `public`
}

struct Chat: Codable {
    let id: Int
    let name: String
    let isChannel: Bool
    let isPublic: Bool
    let createdAt: Date
    let memberIds: [Int]?

    enum CodingKeys: String, CodingKey {
        case id
        case name
        case isChannel = "is_channel"
        case isPublic = "is_public"
        case createdAt = "created_at"
        case memberIds = "member_ids"
    }
}

struct ChatCreateRequest: Codable {
    let chat: ChatData

    struct ChatData: Codable {
        let name: String
        let channel: Bool?
        let `public`: Bool?
        let memberIds: [Int]?

        enum CodingKeys: String, CodingKey {
            case name
            case channel
            case `public`
            case memberIds = "member_ids"
        }
    }
}

struct ChatUpdateRequest: Codable {
    let chat: ChatData

    struct ChatData: Codable {
        let name: String?
        let `public`: Bool?
    }
}

struct ApiErrorItem: Codable {
    let key: String?
    let value: String?
}

struct ApiError: Codable, Error {
    let errors: [ApiErrorItem]?
}

struct OAuthError: Codable, Error {
    let error: String?
}

struct PaginationMeta: Codable {
    let paginate: Paginate?

    struct Paginate: Codable {
        let nextPage: String?

        enum CodingKeys: String, CodingKey {
            case nextPage = "next_page"
        }
    }
}

struct ListChatsResponse: Codable {
    let data: [Chat]
    let meta: PaginationMeta?
}

struct ChatDataWrapper: Codable {
    let data: Chat
}
