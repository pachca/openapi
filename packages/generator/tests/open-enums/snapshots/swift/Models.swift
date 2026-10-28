import Foundation
#if canImport(FoundationNetworking)
import FoundationNetworking
#endif

public enum SortOrder: String, Codable, CaseIterable {
    case asc
    case desc
}

public enum MemberKind: String, Codable, CaseIterable {
    case regular
    case guest
    case value
}

public enum MemberRole: Codable, Hashable, RawRepresentable, CaseIterable, ExpressibleByStringLiteral, Sendable {
    /// Administrator
    case admin
    /// Member
    case user
    /// A value this SDK version does not list yet
    case unknown(String)

    /// Every value this SDK version lists
    public static let allCases: [MemberRole] = [.admin, .user]

    public init(_ rawValue: String) {
        switch rawValue {
        case "admin": self = .admin
        case "user": self = .user
        default: self = .unknown(rawValue)
        }
    }

    public init?(rawValue: String) { self.init(rawValue) }

    public init(stringLiteral value: String) { self.init(value) }

    public var rawValue: String {
        switch self {
        case .admin: return "admin"
        case .user: return "user"
        case .unknown(let value): return value
        }
    }

    public init(from decoder: Decoder) throws {
        self.init(try decoder.singleValueContainer().decode(String.self))
    }

    public func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        try container.encode(rawValue)
    }
}

public enum Region: Codable, Hashable, RawRepresentable, CaseIterable, ExpressibleByStringLiteral, Sendable {
    case eu
    case us
    /// A value this SDK version does not list yet
    case unknown(String)

    /// Every value this SDK version lists
    public static let allCases: [Region] = [.eu, .us]

    public init(_ rawValue: String) {
        switch rawValue {
        case "eu": self = .eu
        case "us": self = .us
        default: self = .unknown(rawValue)
        }
    }

    public init?(rawValue: String) { self.init(rawValue) }

    public init(stringLiteral value: String) { self.init(value) }

    public var rawValue: String {
        switch self {
        case .eu: return "eu"
        case .us: return "us"
        case .unknown(let value): return value
        }
    }

    public init(from decoder: Decoder) throws {
        self.init(try decoder.singleValueContainer().decode(String.self))
    }

    public func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        try container.encode(rawValue)
    }
}

public enum MemberStatus: Codable, Hashable, RawRepresentable, CaseIterable, ExpressibleByStringLiteral, Sendable {
    case active
    case suspended
    case unknown
    /// A value this SDK version does not list yet
    case unknownValue(String)

    /// Every value this SDK version lists
    public static let allCases: [MemberStatus] = [.active, .suspended, .unknown]

    public init(_ rawValue: String) {
        switch rawValue {
        case "active": self = .active
        case "suspended": self = .suspended
        case "unknown": self = .unknown
        default: self = .unknownValue(rawValue)
        }
    }

    public init?(rawValue: String) { self.init(rawValue) }

    public init(stringLiteral value: String) { self.init(value) }

    public var rawValue: String {
        switch self {
        case .active: return "active"
        case .suspended: return "suspended"
        case .unknown: return "unknown"
        case .unknownValue(let value): return value
        }
    }

    public init(from decoder: Decoder) throws {
        self.init(try decoder.singleValueContainer().decode(String.self))
    }

    public func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        try container.encode(rawValue)
    }
}

public enum ErrorCode: Codable, Hashable, RawRepresentable, CaseIterable, ExpressibleByStringLiteral, Sendable {
    case blank
    case taken
    /// A value this SDK version does not list yet
    case unknown(String)

    /// Every value this SDK version lists
    public static let allCases: [ErrorCode] = [.blank, .taken]

    public init(_ rawValue: String) {
        switch rawValue {
        case "blank": self = .blank
        case "taken": self = .taken
        default: self = .unknown(rawValue)
        }
    }

    public init?(rawValue: String) { self.init(rawValue) }

    public init(stringLiteral value: String) { self.init(value) }

    public var rawValue: String {
        switch self {
        case .blank: return "blank"
        case .taken: return "taken"
        case .unknown(let value): return value
        }
    }

    public init(from decoder: Decoder) throws {
        self.init(try decoder.singleValueContainer().decode(String.self))
    }

    public func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        try container.encode(rawValue)
    }
}

public enum OAuthErrorCode: Codable, Hashable, RawRepresentable, CaseIterable, ExpressibleByStringLiteral, Sendable {
    /// The token is missing or revoked
    case invalidToken
    /// The token lacks the scope
    case insufficientScope
    /// A value this SDK version does not list yet
    case unknown(String)

    /// Every value this SDK version lists
    public static let allCases: [OAuthErrorCode] = [.invalidToken, .insufficientScope]

    public init(_ rawValue: String) {
        switch rawValue {
        case "invalid_token": self = .invalidToken
        case "insufficient_scope": self = .insufficientScope
        default: self = .unknown(rawValue)
        }
    }

    public init?(rawValue: String) { self.init(rawValue) }

    public init(stringLiteral value: String) { self.init(value) }

    public var rawValue: String {
        switch self {
        case .invalidToken: return "invalid_token"
        case .insufficientScope: return "insufficient_scope"
        case .unknown(let value): return value
        }
    }

    public init(from decoder: Decoder) throws {
        self.init(try decoder.singleValueContainer().decode(String.self))
    }

    public func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        try container.encode(rawValue)
    }
}

public enum PayloadKind: Codable, Hashable, RawRepresentable, CaseIterable, ExpressibleByStringLiteral, Sendable {
    case created
    case value
    /// A value this SDK version does not list yet
    case unknown(String)

    /// Every value this SDK version lists
    public static let allCases: [PayloadKind] = [.created, .value]

    public init(_ rawValue: String) {
        switch rawValue {
        case "created": self = .created
        case "value": self = .value
        default: self = .unknown(rawValue)
        }
    }

    public init?(rawValue: String) { self.init(rawValue) }

    public init(stringLiteral value: String) { self.init(value) }

    public var rawValue: String {
        switch self {
        case .created: return "created"
        case .value: return "value"
        case .unknown(let value): return value
        }
    }

    public init(from decoder: Decoder) throws {
        self.init(try decoder.singleValueContainer().decode(String.self))
    }

    public func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        try container.encode(rawValue)
    }
}

public struct Member: Codable {
    public let id: Int
    public let role: MemberRole
    public let status: MemberStatus
    public let previousStatuses: [MemberStatus]?

    public init(id: Int, role: MemberRole, status: MemberStatus, previousStatuses: [MemberStatus]? = nil) {
        self.id = id
        self.role = role
        self.status = status
        self.previousStatuses = previousStatuses
    }

    enum CodingKeys: String, CodingKey {
        case id
        case role
        case status
        case previousStatuses = "previous_statuses"
    }
}

public struct MemberUpdateRequest: Codable {
    public let role: MemberRole?
    public let kind: MemberKind?

    public init(role: MemberRole? = nil, kind: MemberKind? = nil) {
        self.role = role
        self.kind = kind
    }
}

public struct MemberEventPayload: Codable {
    public let kind: PayloadKind

    public init(kind: PayloadKind) {
        self.kind = kind
    }
}

public struct ApiErrorItem: Codable {
    public let key: String
    public let message: String
    public let code: ErrorCode

    public init(key: String, message: String, code: ErrorCode) {
        self.key = key
        self.message = message
        self.code = code
    }
}

public struct ApiError: Codable, Error {
    public let errors: [ApiErrorItem]
    /// HTTP status code of the answer, set by the client. An empty body or one that is not JSON leaves errors empty.
    public var statusCode: Int?

    public init(errors: [ApiErrorItem], statusCode: Int? = nil) {
        self.errors = errors
        self.statusCode = statusCode
    }

    enum CodingKeys: String, CodingKey {
        case errors
    }
}

public struct OAuthError: Codable, Error {
    public let error: OAuthErrorCode
    public let errorDescription: String

    public init(error: OAuthErrorCode, errorDescription: String) {
        self.error = error
        self.errorDescription = errorDescription
    }

    public var localizedDescription: String { error.rawValue }

    enum CodingKeys: String, CodingKey {
        case error
        case errorDescription = "error_description"
    }
}

public struct ListMembersResponse: Codable {
    public let data: [Member]

    public init(data: [Member]) {
        self.data = data
    }
}

struct MemberDataWrapper: Codable {
    let data: Member
}
