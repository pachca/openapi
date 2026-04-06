import Foundation
#if canImport(FoundationNetworking)
import FoundationNetworking
#endif

public struct BaseEntity: Codable {
    public let id: Int
    public let createdAt: String

    public init(id: Int, createdAt: String) {
        self.id = id
        self.createdAt = createdAt
    }

    enum CodingKeys: String, CodingKey {
        case id
        case createdAt = "created_at"
    }
}

public struct Article: Codable {
    public let id: Int
    public let createdAt: String
    public let title: String
    public let body: String
    public let isPublished: Bool?

    public init(id: Int, createdAt: String, title: String, body: String, isPublished: Bool? = nil) {
        self.id = id
        self.createdAt = createdAt
        self.title = title
        self.body = body
        self.isPublished = isPublished
    }

    enum CodingKeys: String, CodingKey {
        case id
        case createdAt = "created_at"
        case title
        case body
        case isPublished = "is_published"
    }
}
