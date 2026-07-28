import Foundation
#if canImport(FoundationNetworking)
import FoundationNetworking
#endif

public struct DetailsEmpty: Codable {
}

public struct DetailsChat: Codable {
    public let chatId: Int

    public init(chatId: Int) {
        self.chatId = chatId
    }

    enum CodingKeys: String, CodingKey {
        case chatId = "chat_id"
    }
}

public struct DetailsCall: Codable {
    public let chatId: Int
    public let duration: Int
    public let recordingSize: Int64?

    public init(chatId: Int, duration: Int, recordingSize: Int64? = nil) {
        self.chatId = chatId
        self.duration = duration
        self.recordingSize = recordingSize
    }

    enum CodingKeys: String, CodingKey {
        case chatId = "chat_id"
        case duration
        case recordingSize = "recording_size"
    }
}

public struct DetailsRename: Codable {
    public let oldName: String
    public let newName: String

    public init(oldName: String, newName: String) {
        self.oldName = oldName
        self.newName = newName
    }

    enum CodingKeys: String, CodingKey {
        case oldName = "old_name"
        case newName = "new_name"
    }
}

public struct Event: Codable {
    public let id: Int
    public let eventKey: String
    public let details: EventDetailsUnion

    public init(id: Int, eventKey: String, details: EventDetailsUnion) {
        self.id = id
        self.eventKey = eventKey
        self.details = details
    }

    enum CodingKeys: String, CodingKey {
        case id
        case eventKey = "event_key"
        case details
    }
}

public enum EventDetailsUnion: Codable {
    case detailsEmpty(DetailsEmpty)
    case detailsChat(DetailsChat)
    case detailsCall(DetailsCall)
    case detailsRename(DetailsRename)

    public init(from decoder: Decoder) throws {
        // EventDetailsUnion carries no discriminator field: members are tried from most
        // to least demanding, so the loosest one only wins when nothing else fits.
        if let value = try? DetailsCall(from: decoder) {
            self = .detailsCall(value)
            return
        }
        if let value = try? DetailsRename(from: decoder) {
            self = .detailsRename(value)
            return
        }
        if let value = try? DetailsChat(from: decoder) {
            self = .detailsChat(value)
            return
        }
        if let value = try? DetailsEmpty(from: decoder) {
            self = .detailsEmpty(value)
            return
        }
        throw DecodingError.dataCorrupted(
            DecodingError.Context(codingPath: decoder.codingPath, debugDescription: "No EventDetailsUnion member matched the payload")
        )
    }

    public func encode(to encoder: Encoder) throws {
        switch self {
        case .detailsEmpty(let value):
            try value.encode(to: encoder)
        case .detailsChat(let value):
            try value.encode(to: encoder)
        case .detailsCall(let value):
            try value.encode(to: encoder)
        case .detailsRename(let value):
            try value.encode(to: encoder)
        }
    }
}

public struct GetEventsResponse: Codable {
    public let data: [Event]
}
