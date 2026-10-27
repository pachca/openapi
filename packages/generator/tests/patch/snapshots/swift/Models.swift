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

    public init(name: String? = nil, description: String? = nil, priority: Int? = nil) {
        self.name = name
        self.description = description
        self.priority = priority
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
