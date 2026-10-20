import Foundation
#if canImport(FoundationNetworking)
import FoundationNetworking
#endif

public enum SortOrder: Codable, Hashable, RawRepresentable, CaseIterable, ExpressibleByStringLiteral, Sendable {
    case asc
    case desc
    /// A value this SDK version does not list yet
    case unknown(String)

    /// Every value this SDK version lists
    public static let allCases: [SortOrder] = [.asc, .desc]

    public init(_ rawValue: String) {
        switch rawValue {
        case "asc": self = .asc
        case "desc": self = .desc
        default: self = .unknown(rawValue)
        }
    }

    public init?(rawValue: String) { self.init(rawValue) }

    public init(stringLiteral value: String) { self.init(value) }

    public var rawValue: String {
        switch self {
        case .asc: return "asc"
        case .desc: return "desc"
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

public enum UserRole: Codable, Hashable, RawRepresentable, CaseIterable, ExpressibleByStringLiteral, Sendable {
    /// Администратор
    case admin
    /// Сотрудник
    case user
    /// Мультиадмин
    case multiAdmin
    /// Бот
    case bot
    /// A value this SDK version does not list yet
    case unknown(String)

    /// Every value this SDK version lists
    public static let allCases: [UserRole] = [.admin, .user, .multiAdmin, .bot]

    public init(_ rawValue: String) {
        switch rawValue {
        case "admin": self = .admin
        case "user": self = .user
        case "multi_admin": self = .multiAdmin
        case "bot": self = .bot
        default: self = .unknown(rawValue)
        }
    }

    public init?(rawValue: String) { self.init(rawValue) }

    public init(stringLiteral value: String) { self.init(value) }

    public var rawValue: String {
        switch self {
        case .admin: return "admin"
        case .user: return "user"
        case .multiAdmin: return "multi_admin"
        case .bot: return "bot"
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

public enum ViewBlockHeaderType: Codable, Hashable, RawRepresentable, CaseIterable, ExpressibleByStringLiteral, Sendable {
    /// Для заголовков всегда header
    case header
    /// A value this SDK version does not list yet
    case unknown(String)

    /// Every value this SDK version lists
    public static let allCases: [ViewBlockHeaderType] = [.header]

    public init(_ rawValue: String) {
        switch rawValue {
        case "header": self = .header
        default: self = .unknown(rawValue)
        }
    }

    public init?(rawValue: String) { self.init(rawValue) }

    public init(stringLiteral value: String) { self.init(value) }

    public var rawValue: String {
        switch self {
        case .header: return "header"
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
