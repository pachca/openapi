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

    private struct AnyKey: CodingKey {
        let stringValue: String
        var intValue: Int? { nil }
        init?(stringValue: String) { self.stringValue = stringValue }
        init?(intValue: Int) { nil }
    }

    public init(from decoder: Decoder) throws {
        // EventDetailsUnion carries no discriminator field: members are tried in the order
        // they match the payload keys, and the first one that decodes wins.
        let shapes: [(keys: Set<String>, decode: (Decoder) throws -> EventDetailsUnion)] = [
            ([], { .detailsEmpty(try DetailsEmpty(from: $0)) }),
            (["chat_id"], { .detailsChat(try DetailsChat(from: $0)) }),
            (["chat_id", "duration", "recording_size"], { .detailsCall(try DetailsCall(from: $0)) }),
            (["old_name", "new_name"], { .detailsRename(try DetailsRename(from: $0)) }),
        ]
        let keys = Set((try? decoder.container(keyedBy: AnyKey.self))?.allKeys.map(\.stringValue) ?? [])
        let ranked = shapes.indices.sorted { a, b in
            let matchedA = keys.intersection(shapes[a].keys).count
            let matchedB = keys.intersection(shapes[b].keys).count
            if matchedA != matchedB { return matchedA > matchedB }
            if shapes[a].keys.count != shapes[b].keys.count { return shapes[a].keys.count < shapes[b].keys.count }
            return a < b
        }
        var firstError: Error?
        for index in ranked {
            do {
                self = try shapes[index].decode(decoder)
                return
            } catch {
                if firstError == nil { firstError = error }
            }
        }
        throw firstError ?? DecodingError.dataCorrupted(
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

    public init(data: [Event]) {
        self.data = data
    }
}
