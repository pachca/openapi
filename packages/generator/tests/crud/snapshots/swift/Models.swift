import Foundation

enum SortOrder: String, Codable, CaseIterable {
    case asc
    case desc
}

enum ChatAvailability: String, Codable, CaseIterable {
    /// Чаты, где пользователь является участником
    case isMember = "is_member"
    /// Все открытые чаты компании
    case `public` = "public"
}

struct Chat: Codable {
    let id: Int
    let name: String
    let isChannel: Bool
    let isPublic: Bool
    let createdAt: Date
    let memberIds: [Int?]?

    enum CodingKeys: String, CodingKey {
        case id
        case name
        case isChannel = "is_channel"
        case isPublic = "is_public"
        case createdAt = "created_at"
        case memberIds = "member_ids"
    }
}

struct ChatCreateRequestChat: Codable {
    let name: String
    let channel: Bool?
    let `public`: Bool?
    let memberIds: [Int?]?

    enum CodingKeys: String, CodingKey {
        case name
        case channel
        case `public` = "public"
        case memberIds = "member_ids"
    }
}

struct ChatCreateRequest: Codable {
    let chat: ChatCreateRequestChat
}

struct ChatUpdateRequestChat: Codable {
    let name: String?
    let `public`: Bool?

    enum CodingKeys: String, CodingKey {
        case name
        case `public` = "public"
    }
}

struct ChatUpdateRequest: Codable {
    let chat: ChatUpdateRequestChat
}

struct ApiErrorItem: Codable {
    let key: String?
    let value: String?
}

struct ApiError: Codable, Error {
    let errors: [ApiErrorItem?]?
}

struct OAuthError: Codable, Error {
    let error: String?
}

struct PaginationMetaPaginate: Codable {
    let nextPage: String?

    enum CodingKeys: String, CodingKey {
        case nextPage = "next_page"
    }
}

struct PaginationMeta: Codable {
    let paginate: PaginationMetaPaginate?
}

struct ListChatsResponse: Codable {
    let data: [Chat]
    let meta: PaginationMeta? = nil
}

struct ChatDataWrapper: Codable {
    let data: Chat
}
