import Foundation
#if canImport(FoundationNetworking)
import FoundationNetworking
#endif

public struct ChatCreateRequestChat: Codable {
    public let name: String
    public let memberIds: [Int]?

    public init(name: String, memberIds: [Int]? = nil) {
        self.name = name
        self.memberIds = memberIds
    }

    enum CodingKeys: String, CodingKey {
        case name
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

public struct ChatUpdateMeta: Codable {
    public let changedFields: [String]

    public init(changedFields: [String]) {
        self.changedFields = changedFields
    }

    enum CodingKeys: String, CodingKey {
        case changedFields = "changed_fields"
    }
}

public struct Chat: Codable {
    public let id: Int
    public let name: String
    public let createdAt: String

    public init(id: Int, name: String, createdAt: String) {
        self.id = id
        self.name = name
        self.createdAt = createdAt
    }

    enum CodingKeys: String, CodingKey {
        case id
        case name
        case createdAt = "created_at"
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
    /// HTTP status code of the answer, set by the client. An empty body or one that is not JSON leaves errors empty.
    public var statusCode: Int?

    public init(errors: [ApiErrorItem]? = nil, statusCode: Int? = nil) {
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

public struct CreateChatResponseMeta: Codable {
    public let notFoundMemberIds: [Int]

    public init(notFoundMemberIds: [Int]) {
        self.notFoundMemberIds = notFoundMemberIds
    }

    enum CodingKeys: String, CodingKey {
        case notFoundMemberIds = "not_found_member_ids"
    }
}

public struct CreateChatResponse: Codable {
    public let data: Chat
    public let meta: CreateChatResponseMeta

    public init(data: Chat, meta: CreateChatResponseMeta) {
        self.data = data
        self.meta = meta
    }
}

public struct UpdateChatResponse: Codable {
    public let data: Chat
    public let meta: ChatUpdateMeta?

    public init(data: Chat, meta: ChatUpdateMeta? = nil) {
        self.data = data
        self.meta = meta
    }
}

struct ChatDataWrapper: Codable {
    let data: Chat
}
