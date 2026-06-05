import Foundation
#if canImport(FoundationNetworking)
import FoundationNetworking
#endif

public struct WebhookEvent: Codable {
    public let id: String
    public let eventType: String
    public let payload: WebhookPayloadUnion
    public let createdAt: String

    public init(id: String, eventType: String, payload: WebhookPayloadUnion, createdAt: String) {
        self.id = id
        self.eventType = eventType
        self.payload = payload
        self.createdAt = createdAt
    }

    enum CodingKeys: String, CodingKey {
        case id
        case eventType = "event_type"
        case payload
        case createdAt = "created_at"
    }
}

public struct MessageWebhookPayload: Codable {
    public let type: String
    public let messageId: Int

    public init(type: String, messageId: Int) {
        self.type = type
        self.messageId = messageId
    }

    enum CodingKeys: String, CodingKey {
        case type
        case messageId = "message_id"
    }
}

public struct ReactionWebhookPayload: Codable {
    public let type: String
    public let reaction: String

    public init(type: String, reaction: String) {
        self.type = type
        self.reaction = reaction
    }
}

public struct PaginationMetaPaginate: Codable {
    public let nextPage: String
    public let hasNext: Bool?

    public init(nextPage: String, hasNext: Bool? = nil) {
        self.nextPage = nextPage
        self.hasNext = hasNext
    }

    enum CodingKeys: String, CodingKey {
        case nextPage = "next_page"
        case hasNext = "has_next"
    }
}

public struct PaginationMeta: Codable {
    public let paginate: PaginationMetaPaginate

    public init(paginate: PaginationMetaPaginate) {
        self.paginate = paginate
    }
}

public enum WebhookPayloadUnion: Codable {
    case messageWebhookPayload(MessageWebhookPayload)
    case reactionWebhookPayload(ReactionWebhookPayload)

    private enum CodingKeys: String, CodingKey {
        case type
    }

    public init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        let type = try container.decode(String.self, forKey: .type)
        switch type {
        case "message_new":
            self = .messageWebhookPayload(try MessageWebhookPayload(from: decoder))
        case "reaction_added":
            self = .reactionWebhookPayload(try ReactionWebhookPayload(from: decoder))
        default:
            throw DecodingError.dataCorrupted(
                DecodingError.Context(codingPath: decoder.codingPath, debugDescription: "Unknown type: \(type)")
            )
        }
    }

    public func encode(to encoder: Encoder) throws {
        switch self {
        case .messageWebhookPayload(let value):
            try value.encode(to: encoder)
        case .reactionWebhookPayload(let value):
            try value.encode(to: encoder)
        }
    }
}

public struct GetWebhookEventsResponse: Codable {
    public let data: [WebhookEvent]
    public let meta: PaginationMeta
}
