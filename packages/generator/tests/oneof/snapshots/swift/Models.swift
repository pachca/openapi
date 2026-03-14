import Foundation

public struct TextContent: Codable {
    public let kind: String
    public let text: String

    public init(kind: String, text: String) {
        self.kind = kind
        self.text = text
    }
}

public struct ImageContent: Codable {
    public let kind: String
    public let url: String
    public let caption: String?

    public init(kind: String, url: String, caption: String? = nil) {
        self.kind = kind
        self.url = url
        self.caption = caption
    }
}

public struct VideoContent: Codable {
    public let kind: String
    public let url: String
    public let duration: Int?

    public init(kind: String, url: String, duration: Int? = nil) {
        self.kind = kind
        self.url = url
        self.duration = duration
    }
}

public enum ContentBlock: Codable {
    case textContent(TextContent)
    case imageContent(ImageContent)
    case videoContent(VideoContent)

    private enum CodingKeys: String, CodingKey {
        case kind
    }

    public init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        let type = try container.decode(String.self, forKey: .kind)
        switch type {
        case "text":
            self = .textContent(try TextContent(from: decoder))
        case "image":
            self = .imageContent(try ImageContent(from: decoder))
        case "video":
            self = .videoContent(try VideoContent(from: decoder))
        default:
            throw DecodingError.dataCorrupted(
                DecodingError.Context(codingPath: decoder.codingPath, debugDescription: "Unknown type: \(type)")
            )
        }
    }

    public func encode(to encoder: Encoder) throws {
        switch self {
        case .textContent(let value):
            try value.encode(to: encoder)
        case .imageContent(let value):
            try value.encode(to: encoder)
        case .videoContent(let value):
            try value.encode(to: encoder)
        }
    }
}
