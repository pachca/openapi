import Foundation

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

    public init(errors: [ApiErrorItem]? = nil) {
        self.errors = errors
    }
}

struct ItemDataWrapper: Codable {
    let data: Item
}
