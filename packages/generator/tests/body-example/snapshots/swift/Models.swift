import Foundation
#if canImport(FoundationNetworking)
import FoundationNetworking
#endif

public enum FileType: String, Codable, CaseIterable {
    case file
    case image
    case voice
}

public struct MessageFile: Codable {
    public let key: String
    public let name: String
    public let fileType: FileType
    public let width: Int?
    public let height: Int?
    public let durationMs: Int?
    public let waveform: String?

    public init(key: String, name: String, fileType: FileType, width: Int? = nil, height: Int? = nil, durationMs: Int? = nil, waveform: String? = nil) {
        self.key = key
        self.name = name
        self.fileType = fileType
        self.width = width
        self.height = height
        self.durationMs = durationMs
        self.waveform = waveform
    }

    enum CodingKeys: String, CodingKey {
        case key
        case name
        case fileType = "file_type"
        case width
        case height
        case durationMs = "duration_ms"
        case waveform
    }
}

public struct UrlButton: Codable {
    public let text: String
    public let url: String

    public init(text: String, url: String) {
        self.text = text
        self.url = url
    }
}

public struct DataButton: Codable {
    public let text: String
    public let data: String

    public init(text: String, data: String) {
        self.text = text
        self.data = data
    }
}

public struct MessageCreateRequestMessage: Codable {
    public let entityId: Int
    public let content: String?
    public let files: [MessageFile]?
    public let buttons: [[Button]]?
    public let displayName: String?

    public init(entityId: Int, content: String? = nil, files: [MessageFile]? = nil, buttons: [[Button]]? = nil, displayName: String? = nil) {
        self.entityId = entityId
        self.content = content
        self.files = files
        self.buttons = buttons
        self.displayName = displayName
    }

    enum CodingKeys: String, CodingKey {
        case entityId = "entity_id"
        case content
        case files
        case buttons
        case displayName = "display_name"
    }
}

public struct MessageCreateRequest: Codable {
    public let message: MessageCreateRequestMessage
    public let linkPreview: Bool?

    public init(message: MessageCreateRequestMessage, linkPreview: Bool? = nil) {
        self.message = message
        self.linkPreview = linkPreview
    }

    enum CodingKeys: String, CodingKey {
        case message
        case linkPreview = "link_preview"
    }
}

public struct MessageUpdateRequestMessage: Codable {
    public let content: String?
    public let files: [MessageFile]?

    public init(content: String? = nil, files: [MessageFile]? = nil) {
        self.content = content
        self.files = files
    }
}

public struct MessageUpdateRequest: Codable {
    public let message: MessageUpdateRequestMessage

    public init(message: MessageUpdateRequestMessage) {
        self.message = message
    }
}

public struct Message: Codable {
    public let id: Int
    public let content: String

    public init(id: Int, content: String) {
        self.id = id
        self.content = content
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

public struct OAuthError: Codable, Error {
    public let error: String?

    public init(error: String? = nil) {
        self.error = error
    }

    public var localizedDescription: String { error }
}

public enum Button: Codable {
    case urlButton(UrlButton)
    case dataButton(DataButton)

    private struct AnyKey: CodingKey {
        let stringValue: String
        var intValue: Int? { nil }
        init?(stringValue: String) { self.stringValue = stringValue }
        init?(intValue: Int) { nil }
    }

    public init(from decoder: Decoder) throws {
        // Button carries no discriminator field: members are tried in the order
        // they match the payload keys, and the first one that decodes wins.
        let shapes: [(keys: Set<String>, decode: (Decoder) throws -> Button)] = [
            (["text", "url"], { .urlButton(try UrlButton(from: $0)) }),
            (["text", "data"], { .dataButton(try DataButton(from: $0)) }),
        ]
        let keys = Set((try? decoder.container(keyedBy: AnyKey.self))?.allKeys.map(\.stringValue) ?? [])
        let ranked = shapes.indices.sorted { a, b in
            let matchedA = keys.intersection(shapes[a].keys).count
            let matchedB = keys.intersection(shapes[b].keys).count
            if matchedA != matchedB { return matchedA > matchedB }
            if shapes[a].keys.count != shapes[b].keys.count { return shapes[a].keys.count < shapes[b].keys.count }
            return a < b
        }
        var firstError: Error?
        for index in ranked {
            do {
                self = try shapes[index].decode(decoder)
                return
            } catch {
                if firstError == nil { firstError = error }
            }
        }
        throw firstError ?? DecodingError.dataCorrupted(
            DecodingError.Context(codingPath: decoder.codingPath, debugDescription: "No Button member matched the payload")
        )
    }

    public func encode(to encoder: Encoder) throws {
        switch self {
        case .urlButton(let value):
            try value.encode(to: encoder)
        case .dataButton(let value):
            try value.encode(to: encoder)
        }
    }
}

struct MessageDataWrapper: Codable {
    let data: Message
}
