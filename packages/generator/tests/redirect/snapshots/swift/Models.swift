import Foundation

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
