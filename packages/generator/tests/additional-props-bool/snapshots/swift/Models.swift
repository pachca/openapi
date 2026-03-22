import Foundation
#if canImport(FoundationNetworking)
import FoundationNetworking
#endif

public struct Metadata: Codable {
}

public struct Event: Codable {
    public let id: Int
    public let type: String
    public let metadata: [String: AnyCodable]?

    public init(id: Int, type: String, metadata: [String: AnyCodable]? = nil) {
        self.id = id
        self.type = type
        self.metadata = metadata
    }
}
