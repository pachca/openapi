import Foundation

struct ViewBlockHeader: Codable {
    let type: String
    let text: String
}

struct ViewBlockPlainText: Codable {
    let type: String
    let text: String
}

struct ViewBlockImage: Codable {
    let type: String
    let url: String
    let alt: String?
}

enum ViewBlockUnion: Codable {
    case viewBlockHeader(ViewBlockHeader)
    case viewBlockPlainText(ViewBlockPlainText)
    case viewBlockImage(ViewBlockImage)

    private enum CodingKeys: String, CodingKey {
        case type
    }

    init(from decoder: Decoder) throws {
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

    func encode(to encoder: Encoder) throws {
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
