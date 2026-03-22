import Foundation
#if canImport(FoundationNetworking)
import FoundationNetworking
#endif

public struct ViewBlockHeader: Codable {
    public let type: String
    public let text: String

    public init(type: String, text: String) {
        self.type = type
        self.text = text
    }
}

public struct ViewBlockPlainText: Codable {
    public let type: String
    public let text: String

    public init(type: String, text: String) {
        self.type = type
        self.text = text
    }
}

public struct ViewBlockImage: Codable {
    public let type: String
    public let url: String
    public let alt: String?

    public init(type: String, url: String, alt: String? = nil) {
        self.type = type
        self.url = url
        self.alt = alt
    }
}

public enum ViewBlockUnion: Codable {
    case viewBlockHeader(ViewBlockHeader)
    case viewBlockPlainText(ViewBlockPlainText)
    case viewBlockImage(ViewBlockImage)

    private enum CodingKeys: String, CodingKey {
        case type
    }

    public init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        let type = try container.decode(String.self, forKey: .type)
        switch type {
        case "header":
            self = .viewBlockHeader(try ViewBlockHeader(from: decoder))
        case "plain_text":
            self = .viewBlockPlainText(try ViewBlockPlainText(from: decoder))
        case "image":
            self = .viewBlockImage(try ViewBlockImage(from: decoder))
        default:
            throw DecodingError.dataCorrupted(
                DecodingError.Context(codingPath: decoder.codingPath, debugDescription: "Unknown type: \(type)")
            )
        }
    }

    public func encode(to encoder: Encoder) throws {
        switch self {
        case .viewBlockHeader(let value):
            try value.encode(to: encoder)
        case .viewBlockPlainText(let value):
            try value.encode(to: encoder)
        case .viewBlockImage(let value):
            try value.encode(to: encoder)
        }
    }
}
