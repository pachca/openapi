import Foundation

public enum OAuthScope: String, Codable, CaseIterable {
    case chatsRead = "chats:read"
    case chatsWrite = "chats:write"
    case usersRead = "users:read"
    case usersWrite = "users:write"
}

public enum EventType: String, Codable, CaseIterable {
    case message
    case reaction
}

public struct EventFilter: Codable {
}

public struct Event: Codable {
    public let id: Int
    public let type: EventType

    public init(id: Int, type: EventType) {
        self.id = id
        self.type = type
    }
}

public struct PublishEventRequest: Codable {
    public let scope: OAuthScope

    public init(scope: OAuthScope) {
        self.scope = scope
    }
}

public struct UploadRequest: Codable {
    public var file: Data
    public let Content_Disposition: String

    public init(file: Data, Content_Disposition: String) {
        self.file = file
        self.Content_Disposition = Content_Disposition
    }

    enum CodingKeys: String, CodingKey {
        case file
        case Content_Disposition = "Content-Disposition"
    }
}

public struct Notification: Codable {
    public let kind: String

    public init(kind: String) {
        self.kind = kind
    }
}

public struct MessageNotification: Codable {
    public let kind: String
    public let text: String

    public init(kind: String, text: String) {
        self.kind = kind
        self.text = text
    }
}

public struct ReactionNotification: Codable {
    public let kind: String
    public let emoji: String

    public init(kind: String, emoji: String) {
        self.kind = kind
        self.emoji = emoji
    }
}

public enum NotificationUnion: Codable {
    case messageNotification(MessageNotification)
    case reactionNotification(ReactionNotification)

    private enum CodingKeys: String, CodingKey {
        case kind
    }

    public init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        let type = try container.decode(String.self, forKey: .kind)
        switch type {
        case "message":
            self = .messageNotification(try MessageNotification(from: decoder))
        case "message":
            self = .reactionNotification(try ReactionNotification(from: decoder))
        default:
            throw DecodingError.dataCorrupted(
                DecodingError.Context(codingPath: decoder.codingPath, debugDescription: "Unknown type: \(type)")
            )
        }
    }

    public func encode(to encoder: Encoder) throws {
        switch self {
        case .messageNotification(let value):
            try value.encode(to: encoder)
        case .reactionNotification(let value):
            try value.encode(to: encoder)
        }
    }
}

public struct ListEventsResponse: Codable {
    public let data: [Event]
}

struct EventDataWrapper: Codable {
    let data: Event
}
