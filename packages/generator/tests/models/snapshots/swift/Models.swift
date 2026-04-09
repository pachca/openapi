import Foundation
#if canImport(FoundationNetworking)
import FoundationNetworking
#endif

public enum UserRole: String, Codable, CaseIterable {
    /// Администратор
    case admin
    /// Сотрудник
    case user
    /// Мультиадмин
    case multiAdmin = "multi_admin"
    /// Бот
    case bot
}

public struct User: Codable {
    public let id: Int
    public let firstName: String
    public let lastName: String
    public let email: String
    public let phoneNumber: String?
    public let role: UserRole
    public let isActive: Bool
    public let botId: Int64?
    public let createdAt: String
    public let birthday: String?
    public let tagIds: [Int]
    public let customProperties: [CustomProperty]?
    public let status: UserStatus?

    public init(id: Int, firstName: String, lastName: String, email: String, phoneNumber: String? = nil, role: UserRole, isActive: Bool, botId: Int64? = nil, createdAt: String, birthday: String? = nil, tagIds: [Int], customProperties: [CustomProperty]? = nil, status: UserStatus? = nil) {
        self.id = id
        self.firstName = firstName
        self.lastName = lastName
        self.email = email
        self.phoneNumber = phoneNumber
        self.role = role
        self.isActive = isActive
        self.botId = botId
        self.createdAt = createdAt
        self.birthday = birthday
        self.tagIds = tagIds
        self.customProperties = customProperties
        self.status = status
    }

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

public struct UserStatus: Codable {
    public let emoji: String?
    public let title: String?
    public let expiresAt: String?

    public init(emoji: String? = nil, title: String? = nil, expiresAt: String? = nil) {
        self.emoji = emoji
        self.title = title
        self.expiresAt = expiresAt
    }

    enum CodingKeys: String, CodingKey {
        case emoji
        case title
        case expiresAt = "expires_at"
    }
}

public struct CustomProperty: Codable {
    public let id: Int
    public let name: String
    public let dataType: String
    public let value: String

    public init(id: Int, name: String, dataType: String, value: String) {
        self.id = id
        self.name = name
        self.dataType = dataType
        self.value = value
    }

    enum CodingKeys: String, CodingKey {
        case id
        case name
        case dataType = "data_type"
        case value
    }
}

public struct UserCreateRequestUser: Codable {
    public let firstName: String
    public let lastName: String
    public let email: String
    public let role: UserRole?
    public let isActive: Bool?

    public init(firstName: String, lastName: String, email: String, role: UserRole? = nil, isActive: Bool? = nil) {
        self.firstName = firstName
        self.lastName = lastName
        self.email = email
        self.role = role
        self.isActive = isActive
    }

    enum CodingKeys: String, CodingKey {
        case firstName = "first_name"
        case lastName = "last_name"
        case email
        case role
        case isActive = "is_active"
    }
}

public struct UserCreateRequest: Codable {
    public let user: UserCreateRequestUser

    public init(user: UserCreateRequestUser) {
        self.user = user
    }
}

public struct UserUpdateRequestUser: Codable {
    public let firstName: String?
    public let lastName: String?
    public let phoneNumber: String?
    public let role: UserRole?

    public init(firstName: String? = nil, lastName: String? = nil, phoneNumber: String? = nil, role: UserRole? = nil) {
        self.firstName = firstName
        self.lastName = lastName
        self.phoneNumber = phoneNumber
        self.role = role
    }

    enum CodingKeys: String, CodingKey {
        case firstName = "first_name"
        case lastName = "last_name"
        case phoneNumber = "phone_number"
        case role
    }
}

public struct UserUpdateRequest: Codable {
    public let user: UserUpdateRequestUser

    public init(user: UserUpdateRequestUser) {
        self.user = user
    }
}

public struct MessageCreateRequestFile: Codable {
    public let key: String
    public let name: String
    public let fileType: String
    public let size: Int

    public init(key: String, name: String, fileType: String, size: Int) {
        self.key = key
        self.name = name
        self.fileType = fileType
        self.size = size
    }

    enum CodingKeys: String, CodingKey {
        case key
        case name
        case fileType = "file_type"
        case size
    }
}

public struct MessageCreateRequestButton: Codable {
    public let text: String
    public let url: String?
    public let data: String?

    public init(text: String, url: String? = nil, data: String? = nil) {
        self.text = text
        self.url = url
        self.data = data
    }
}

public struct MessageCreateRequestMessage: Codable {
    public let entityId: Int
    public let content: String
    public let files: [MessageCreateRequestFile]?
    public let buttons: [[MessageCreateRequestButton]]?

    public init(entityId: Int, content: String, files: [MessageCreateRequestFile]? = nil, buttons: [[MessageCreateRequestButton]]? = nil) {
        self.entityId = entityId
        self.content = content
        self.files = files
        self.buttons = buttons
    }

    enum CodingKeys: String, CodingKey {
        case entityId = "entity_id"
        case content
        case files
        case buttons
    }
}

public struct MessageCreateRequest: Codable {
    public let message: MessageCreateRequestMessage

    public init(message: MessageCreateRequestMessage) {
        self.message = message
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

    public var localizedDescription: String { error }
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
