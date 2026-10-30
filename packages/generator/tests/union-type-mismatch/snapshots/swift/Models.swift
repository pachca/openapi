import Foundation
#if canImport(FoundationNetworking)
import FoundationNetworking
#endif

public struct DetailsEmpty: Codable {
}

public struct DetailsBot: Codable {
    public let botId: Int
    public let webhookId: Int?
    public let scopes: [String]?

    public init(botId: Int, webhookId: Int? = nil, scopes: [String]? = nil) {
        self.botId = botId
        self.webhookId = webhookId
        self.scopes = scopes
    }

    enum CodingKeys: String, CodingKey {
        case botId = "bot_id"
        case webhookId = "webhook_id"
        case scopes
    }
}

public struct DetailsBotTokenUpdated: Codable {
    public let tokenKind: String
    public let resourceOwnerId: Int
    public let currentScopes: [String]?
    public let accessTokenId: Int
    public let botId: Int?
    public let webhookId: Int?
    public let scopes: ScopesChange?

    public init(tokenKind: String, resourceOwnerId: Int, currentScopes: [String]? = nil, accessTokenId: Int, botId: Int? = nil, webhookId: Int? = nil, scopes: ScopesChange? = nil) {
        self.tokenKind = tokenKind
        self.resourceOwnerId = resourceOwnerId
        self.currentScopes = currentScopes
        self.accessTokenId = accessTokenId
        self.botId = botId
        self.webhookId = webhookId
        self.scopes = scopes
    }

    enum CodingKeys: String, CodingKey {
        case tokenKind = "token_kind"
        case resourceOwnerId = "resource_owner_id"
        case currentScopes = "current_scopes"
        case accessTokenId = "access_token_id"
        case botId = "bot_id"
        case webhookId = "webhook_id"
        case scopes
    }
}

public struct DetailsToken: Codable {
    public let tokenKind: String
    public let resourceOwnerId: Int
    public let scopes: [String]
    public let accessTokenId: Int
    public let botId: Int?
    public let webhookId: Int?
    public let applicationId: Int?
    public let deviceName: String?

    public init(tokenKind: String, resourceOwnerId: Int, scopes: [String], accessTokenId: Int, botId: Int? = nil, webhookId: Int? = nil, applicationId: Int? = nil, deviceName: String? = nil) {
        self.tokenKind = tokenKind
        self.resourceOwnerId = resourceOwnerId
        self.scopes = scopes
        self.accessTokenId = accessTokenId
        self.botId = botId
        self.webhookId = webhookId
        self.applicationId = applicationId
        self.deviceName = deviceName
    }

    enum CodingKeys: String, CodingKey {
        case tokenKind = "token_kind"
        case resourceOwnerId = "resource_owner_id"
        case scopes
        case accessTokenId = "access_token_id"
        case botId = "bot_id"
        case webhookId = "webhook_id"
        case applicationId = "application_id"
        case deviceName = "device_name"
    }
}

public struct ScopesChange: Codable {
    public let previous: [String]
    public let new: [String]

    public init(previous: [String], new: [String]) {
        self.previous = previous
        self.new = new
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
    case detailsBot(DetailsBot)
    case detailsBotTokenUpdated(DetailsBotTokenUpdated)
    case detailsToken(DetailsToken)

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
            (["bot_id", "webhook_id", "scopes"], { .detailsBot(try DetailsBot(from: $0)) }),
            (["token_kind", "resource_owner_id", "current_scopes", "access_token_id", "bot_id", "webhook_id", "scopes"], { .detailsBotTokenUpdated(try DetailsBotTokenUpdated(from: $0)) }),
            (["token_kind", "resource_owner_id", "scopes", "access_token_id", "bot_id", "webhook_id", "application_id", "device_name"], { .detailsToken(try DetailsToken(from: $0)) }),
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
        case .detailsBot(let value):
            try value.encode(to: encoder)
        case .detailsBotTokenUpdated(let value):
            try value.encode(to: encoder)
        case .detailsToken(let value):
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
