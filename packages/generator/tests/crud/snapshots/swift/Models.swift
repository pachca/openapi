import Foundation
#if canImport(FoundationNetworking)
import FoundationNetworking
#endif

public enum SortOrder: String, Codable, CaseIterable {
    case asc
    case desc
}

public enum ChatAvailability: String, Codable, CaseIterable {
    /// Чаты, где пользователь является участником
    case isMember = "is_member"
    /// Все открытые чаты компании
    case `public` = "public"
}

public struct Chat: Codable {
    public let id: Int
    public let name: String
    public let isChannel: Bool
    public let isPublic: Bool
    public let createdAt: Date
    public let memberIds: [Int]?

    public init(id: Int, name: String, isChannel: Bool, isPublic: Bool, createdAt: Date, memberIds: [Int]? = nil) {
        self.id = id
        self.name = name
        self.isChannel = isChannel
        self.isPublic = isPublic
        self.createdAt = createdAt
        self.memberIds = memberIds
    }

    enum CodingKeys: String, CodingKey {
        case id
        case name
        case isChannel = "is_channel"
        case isPublic = "is_public"
        case createdAt = "created_at"
        case memberIds = "member_ids"
    }
}

public struct ChatCreateRequestChat: Codable {
    public let name: String
    public let channel: Bool?
    public let `public`: Bool?
    public let memberIds: [Int]?

    public init(name: String, channel: Bool? = nil, `public`: Bool? = nil, memberIds: [Int]? = nil) {
        self.name = name
        self.channel = channel
        self.`public` = `public`
        self.memberIds = memberIds
    }

    enum CodingKeys: String, CodingKey {
        case name
        case channel
        case `public` = "public"
        case memberIds = "member_ids"
    }
}

public struct ChatCreateRequest: Codable {
    public let chat: ChatCreateRequestChat

    public init(chat: ChatCreateRequestChat) {
        self.chat = chat
    }
}

public struct ChatUpdateRequestChat: Codable {
    public let name: String?
    public let `public`: Bool?

    public init(name: String? = nil, `public`: Bool? = nil) {
        self.name = name
        self.`public` = `public`
    }

    enum CodingKeys: String, CodingKey {
        case name
        case `public` = "public"
    }
}

public struct ChatUpdateRequest: Codable {
    public let chat: ChatUpdateRequestChat

    public init(chat: ChatUpdateRequestChat) {
        self.chat = chat
    }
}

public struct ApiErrorItem: Codable {
    public let key: String?
    public let value: String?

    public init(key: String? = nil, value: String? = nil) {
        self.key = key
        self.value = value
    }
}

public struct ApiError: Codable, Error {
    public let errors: [ApiErrorItem]?

    public init(errors: [ApiErrorItem]? = nil) {
        self.errors = errors
    }
}

public struct OAuthError: Codable, Error {
    public let error: String?

    public init(error: String? = nil) {
        self.error = error
    }
}

public struct PaginationMetaPaginate: Codable {
    public let nextPage: String?

    public init(nextPage: String? = nil) {
        self.nextPage = nextPage
    }

    enum CodingKeys: String, CodingKey {
        case nextPage = "next_page"
    }
}

public struct PaginationMeta: Codable {
    public let paginate: PaginationMetaPaginate?

    public init(paginate: PaginationMetaPaginate? = nil) {
        self.paginate = paginate
    }
}

public struct ListChatsResponse: Codable {
    public let data: [Chat]
    public var meta: PaginationMeta? = nil
}

struct ChatDataWrapper: Codable {
    let data: Chat
}
