import Foundation

struct ViewBlockHeader: Codable {
    let type: String // always "header"
    let text: String
}

struct ViewBlockPlainText: Codable {
    let type: String // always "plain_text"
    let text: String
}

struct ViewBlockImage: Codable {
    let type: String // always "image"
    let url: String
    let alt: String?
}

enum ViewBlockUnion: Codable {
    case header(ViewBlockHeader)
    case plainText(ViewBlockPlainText)
    case image(ViewBlockImage)

    private enum CodingKeys: String, CodingKey {
        case type
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        let type = try container.decode(String.self, forKey: .type)
        switch type {
        case "header":
            self = .header(try ViewBlockHeader(from: decoder))
        case "plain_text":
            self = .plainText(try ViewBlockPlainText(from: decoder))
        case "image":
            self = .image(try ViewBlockImage(from: decoder))
        default:
            throw DecodingError.dataCorrupted(
                DecodingError.Context(
                    codingPath: decoder.codingPath,
                    debugDescription: "Unknown type: \(type)"
                )
            )
        }
    }

    func encode(to encoder: Encoder) throws {
        switch self {
        case .header(let value):
            try value.encode(to: encoder)
        case .plainText(let value):
            try value.encode(to: encoder)
        case .image(let value):
            try value.encode(to: encoder)
        }
    }
}
