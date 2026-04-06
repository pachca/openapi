import Foundation
#if canImport(FoundationNetworking)
import FoundationNetworking
#endif

public struct ExportRequest: Codable {
    public let startAt: String
    public let endAt: String
    public let webhookUrl: String

    public init(startAt: String, endAt: String, webhookUrl: String) {
        self.startAt = startAt
        self.endAt = endAt
        self.webhookUrl = webhookUrl
    }

    enum CodingKeys: String, CodingKey {
        case startAt = "start_at"
        case endAt = "end_at"
        case webhookUrl = "webhook_url"
    }
}

public struct Export: Codable {
    public let id: Int
    public let startAt: String
    public let endAt: String
    public let status: String
    public let createdAt: Date

    public init(id: Int, startAt: String, endAt: String, status: String, createdAt: Date) {
        self.id = id
        self.startAt = startAt
        self.endAt = endAt
        self.status = status
        self.createdAt = createdAt
    }

    enum CodingKeys: String, CodingKey {
        case id
        case startAt = "start_at"
        case endAt = "end_at"
        case status
        case createdAt = "created_at"
    }
}

public struct Event: Codable {
    public let id: Int
    public let type: String
    public let occurredAt: Date

    public init(id: Int, type: String, occurredAt: Date) {
        self.id = id
        self.type = type
        self.occurredAt = occurredAt
    }

    enum CodingKeys: String, CodingKey {
        case id
        case type
        case occurredAt = "occurred_at"
    }
}

public struct OAuthError: Codable, Error {
    public let error: String?

    public init(error: String? = nil) {
        self.error = error
    }
}

public struct ListEventsResponse: Codable {
    public let data: [Event]
}

struct ExportDataWrapper: Codable {
    let data: Export
}
