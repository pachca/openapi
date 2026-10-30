import Foundation
#if canImport(FoundationNetworking)
import FoundationNetworking
#endif

public struct Item: Codable {
    public let id: Int
    public let name: String
    public let description: String?
    public let priority: Int?

    public init(id: Int, name: String, description: String? = nil, priority: Int? = nil) {
        self.id = id
        self.name = name
        self.description = description
        self.priority = priority
    }
}

public struct ItemPatchRequestItem: Codable {
    public let name: String?
    public let description: String?
    public let priority: Int?
    /// Fields to send as null: description. An unset field stays out of the body.
    public var nullFields: Set<String> = []

    public init(name: String? = nil, description: String? = nil, priority: Int? = nil, nullFields: Set<String> = []) {
        self.name = name
        self.description = description
        self.priority = priority
        self.nullFields = nullFields
    }

    public func encode(to encoder: Encoder) throws {
        if let unknown = nullFields.subtracting(["description"]).sorted().first {
            throw EncodingError.invalidValue(nullFields, EncodingError.Context(
                codingPath: encoder.codingPath,
                debugDescription: "ItemPatchRequestItem: field \"\(unknown)\" cannot be sent as null"
            ))
        }
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encodeIfPresent(name, forKey: .name)
        if nullFields.contains("description") {
            try container.encodeNil(forKey: .description)
        } else {
            try container.encodeIfPresent(description, forKey: .description)
        }
        try container.encodeIfPresent(priority, forKey: .priority)
    }

    enum CodingKeys: String, CodingKey {
        case name
        case description
        case priority
    }
}

public struct ItemPatchRequest: Codable {
    public let item: ItemPatchRequestItem

    public init(item: ItemPatchRequestItem) {
        self.item = item
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
    /// HTTP status code of the answer, set by the client. An empty body or one that is not JSON leaves errors empty.
    public var statusCode: Int?

    public init(errors: [ApiErrorItem]? = nil, statusCode: Int? = nil) {
        self.errors = errors
        self.statusCode = statusCode
    }

    enum CodingKeys: String, CodingKey {
        case errors
    }
}

struct ItemDataWrapper: Codable {
    let data: Item
}
