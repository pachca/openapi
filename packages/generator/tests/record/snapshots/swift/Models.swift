import Foundation
#if canImport(FoundationNetworking)
import FoundationNetworking
#endif

public struct LinkPreview: Codable {
    public let title: String
    public let description: String?
    public let imageUrl: String?

    public init(title: String, description: String? = nil, imageUrl: String? = nil) {
        self.title = title
        self.description = description
        self.imageUrl = imageUrl
    }

    enum CodingKeys: String, CodingKey {
        case title
        case description
        case imageUrl = "image_url"
    }
}

public struct LinkPreviewsRequest: Codable {
    public let linkPreviews: [String: LinkPreview]

    public init(linkPreviews: [String: LinkPreview]) {
        self.linkPreviews = linkPreviews
    }

    enum CodingKeys: String, CodingKey {
        case linkPreviews = "link_previews"
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
