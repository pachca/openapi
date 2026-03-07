import Foundation

enum UserRole: String, Codable, CaseIterable {
    /// Администратор
    case admin
    /// Сотрудник
    case user
    /// Мультиадмин
    case multiAdmin = "multi_admin"
    /// Бот
    case bot
}

struct User: Codable {
    let id: Int
    let firstName: String
    let lastName: String
    let email: String
    let phoneNumber: String?
    let role: UserRole
    let isActive: Bool
    let botId: Int64?
    let createdAt: Date
    let birthday: String?
    let tagIds: [Int]
    let customProperties: [CustomProperty?]?
    let status: UserStatus?

    enum CodingKeys: String, CodingKey {
        case id
        case firstName = "first_name"
        case lastName = "last_name"
        case email
        case phoneNumber = "phone_number"
        case role
        case isActive = "is_active"
        case botId = "bot_id"
        case createdAt = "created_at"
        case birthday
        case tagIds = "tag_ids"
        case customProperties = "custom_properties"
        case status
    }
}

struct UserStatus: Codable {
    let emoji: String?
    let title: String?
    let expiresAt: String?

    enum CodingKeys: String, CodingKey {
        case emoji
        case title
        case expiresAt = "expires_at"
    }
}

struct CustomProperty: Codable {
    let id: Int
    let name: String
    let dataType: String
    let value: String

    enum CodingKeys: String, CodingKey {
        case id
        case name
        case dataType = "data_type"
        case value
    }
}

struct UserCreateRequestUser: Codable {
    let firstName: String
    let lastName: String
    let email: String
    let role: UserRole?
    let isActive: Bool?

    enum CodingKeys: String, CodingKey {
        case firstName = "first_name"
        case lastName = "last_name"
        case email
        case role
        case isActive = "is_active"
    }
}

struct UserCreateRequest: Codable {
    let user: UserCreateRequestUser
}

struct UserUpdateRequestUser: Codable {
    let firstName: String?
    let lastName: String?
    let phoneNumber: String?
    let role: UserRole?

    enum CodingKeys: String, CodingKey {
        case firstName = "first_name"
        case lastName = "last_name"
        case phoneNumber = "phone_number"
        case role
    }
}

struct UserUpdateRequest: Codable {
    let user: UserUpdateRequestUser
}

struct MessageCreateRequestFile: Codable {
    let key: String
    let name: String
    let fileType: String
    let size: Int

    enum CodingKeys: String, CodingKey {
        case key
        case name
        case fileType = "file_type"
        case size
    }
}

struct MessageCreateRequestButton: Codable {
    let text: String
    let url: String?
    let data: String?
}

struct MessageCreateRequestMessage: Codable {
    let entityId: Int
    let content: String
    let files: [MessageCreateRequestFile?]?
    let buttons: [[MessageCreateRequestButton?]?]?

    enum CodingKeys: String, CodingKey {
        case entityId = "entity_id"
        case content
        case files
        case buttons
    }
}

struct MessageCreateRequest: Codable {
    let message: MessageCreateRequestMessage
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

struct SearchPaginationMetaPaginate: Codable {
    let nextPage: String

    enum CodingKeys: String, CodingKey {
        case nextPage = "next_page"
    }
}

struct SearchPaginationMeta: Codable {
    let total: Int
    let paginate: SearchPaginationMetaPaginate
}
