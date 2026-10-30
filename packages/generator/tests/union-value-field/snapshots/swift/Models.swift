import Foundation
#if canImport(FoundationNetworking)
import FoundationNetworking
#endif

public struct DetailsEmpty: Codable {
}

public struct DetailsBot: Codable {
    public let botId: Int
    public let actorId: Int?
    public let webhookId: Int?
    public let scopes: DetailsBotScopesValue?

    public init(botId: Int, actorId: Int? = nil, webhookId: Int? = nil, scopes: DetailsBotScopesValue? = nil) {
        self.botId = botId
        self.actorId = actorId
        self.webhookId = webhookId
        self.scopes = scopes
    }

    enum CodingKeys: String, CodingKey {
        case botId = "bot_id"
        case actorId = "actor_id"
        case webhookId = "webhook_id"
        case scopes
    }
}

public struct DetailsBotScopes: Codable {
    public let botId: Int
    public let scopes: [String]

    public init(botId: Int, scopes: [String]) {
        self.botId = botId
        self.scopes = scopes
    }

    enum CodingKeys: String, CodingKey {
        case botId = "bot_id"
        case scopes
    }
}

public struct DetailsBotTokenUpdated: Codable {
    public let tokenKind: String
    public let resourceOwnerId: Int
    public let accessTokenId: Int
    public let botId: Int?
    public let webhookId: Int?
    public let scopes: ScopesChange?

    public init(tokenKind: String, resourceOwnerId: Int, accessTokenId: Int, botId: Int? = nil, webhookId: Int? = nil, scopes: ScopesChange? = nil) {
        self.tokenKind = tokenKind
        self.resourceOwnerId = resourceOwnerId
        self.accessTokenId = accessTokenId
        self.botId = botId
        self.webhookId = webhookId
        self.scopes = scopes
    }

    enum CodingKeys: String, CodingKey {
        case tokenKind = "token_kind"
        case resourceOwnerId = "resource_owner_id"
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

    public init(tokenKind: String, resourceOwnerId: Int, scopes: [String], accessTokenId: Int) {
        self.tokenKind = tokenKind
        self.resourceOwnerId = resourceOwnerId
        self.scopes = scopes
        self.accessTokenId = accessTokenId
    }

    enum CodingKeys: String, CodingKey {
        case tokenKind = "token_kind"
        case resourceOwnerId = "resource_owner_id"
        case scopes
        case accessTokenId = "access_token_id"
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

public struct Actor: Codable {
    public let id: Int
    public let name: String?

    public init(id: Int, name: String? = nil) {
        self.id = id
        self.name = name
    }
}

public struct Event: Codable {
    public let id: Int
    public let eventKey: String
    public let actor: EventActor?
    public let details: EventDetailsUnion

    public init(id: Int, eventKey: String, actor: EventActor? = nil, details: EventDetailsUnion) {
        self.id = id
        self.eventKey = eventKey
        self.actor = actor
        self.details = details
    }

    enum CodingKeys: String, CodingKey {
        case id
        case eventKey = "event_key"
        case actor
        case details
    }
}

public enum EventDetailsUnion: Codable {
    case detailsEmpty(DetailsEmpty)
    case detailsBot(DetailsBot)
    case detailsBotScopes(DetailsBotScopes)
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
            (["bot_id", "actor_id", "webhook_id", "scopes"], { .detailsBot(try DetailsBot(from: $0)) }),
            (["bot_id", "scopes"], { .detailsBotScopes(try DetailsBotScopes(from: $0)) }),
            (["token_kind", "resource_owner_id", "access_token_id", "bot_id", "webhook_id", "scopes"], { .detailsBotTokenUpdated(try DetailsBotTokenUpdated(from: $0)) }),
            (["token_kind", "resource_owner_id", "scopes", "access_token_id"], { .detailsToken(try DetailsToken(from: $0)) }),
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
        case .detailsBotScopes(let value):
            try value.encode(to: encoder)
        case .detailsBotTokenUpdated(let value):
            try value.encode(to: encoder)
        case .detailsToken(let value):
            try value.encode(to: encoder)
        }
    }
}

/// Права токена у bot_token_created, изменение прав у bot_token_updated в старых записях.
public enum DetailsBotScopesValue: Codable {
    case stringList([String])
    case scopesChange(ScopesChange)

    private struct AnyKey: CodingKey {
        let stringValue: String
        var intValue: Int? { nil }
        init?(stringValue: String) { self.stringValue = stringValue }
        init?(intValue: Int) { nil }
    }

    public init(from decoder: Decoder) throws {
        if (try? decoder.unkeyedContainer()) != nil {
            self = .stringList(try [String](from: decoder))
            return
        }
        if (try? decoder.container(keyedBy: AnyKey.self)) != nil {
            self = .scopesChange(try ScopesChange(from: decoder))
            return
        }
        throw DecodingError.typeMismatch(
            DetailsBotScopesValue.self,
            DecodingError.Context(codingPath: decoder.codingPath, debugDescription: "Expected [String] or ScopesChange")
        )
    }

    public func encode(to encoder: Encoder) throws {
        switch self {
        case .stringList(let value):
            try value.encode(to: encoder)
        case .scopesChange(let value):
            try value.encode(to: encoder)
        }
    }
}

/// Автор события. Строка у системных событий.
public enum EventActor: Codable {
    case string(String)
    case actor(Actor)

    private struct AnyKey: CodingKey {
        let stringValue: String
        var intValue: Int? { nil }
        init?(stringValue: String) { self.stringValue = stringValue }
        init?(intValue: Int) { nil }
    }

    public init(from decoder: Decoder) throws {
        if (try? decoder.container(keyedBy: AnyKey.self)) != nil {
            self = .actor(try Actor(from: decoder))
            return
        }
        let container = try decoder.singleValueContainer()
        if let value = try? container.decode(String.self) {
            self = .string(value)
            return
        }
        throw DecodingError.typeMismatch(
            EventActor.self,
            DecodingError.Context(codingPath: decoder.codingPath, debugDescription: "Expected String or Actor")
        )
    }

    public func encode(to encoder: Encoder) throws {
        switch self {
        case .string(let value):
            try value.encode(to: encoder)
        case .actor(let value):
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
