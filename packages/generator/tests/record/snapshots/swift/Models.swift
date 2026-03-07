import Foundation

struct LinkPreview: Codable {
    let title: String
    let description: String?
    let imageUrl: String?

    enum CodingKeys: String, CodingKey {
        case title
        case description
        case imageUrl = "image_url"
    }
}

struct LinkPreviewsRequest: Codable {
    let linkPreviews: [String: LinkPreview]

    enum CodingKeys: String, CodingKey {
        case linkPreviews = "link_previews"
    }
}

struct ApiErrorItem: Codable {
    let key: String?
    let value: String?
}

struct ApiError: Codable, Error {
    let errors: [ApiErrorItem]?
}

struct OAuthError: Codable, Error {
    let error: String?
}
