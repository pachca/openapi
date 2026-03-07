import Foundation

struct AddMembersRequest: Codable {
    let memberIds: [Int]

    enum CodingKeys: String, CodingKey {
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

struct Chat: Codable {
    let id: Int
    let name: String
    let isChannel: Bool
    let isPublic: Bool
    let createdAt: Date

    enum CodingKeys: String, CodingKey {
        case id
        case name
        case isChannel = "is_channel"
        case isPublic = "is_public"
        case createdAt = "created_at"
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

struct ChatDataWrapper: Codable {
    let data: Chat
}
