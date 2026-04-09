import Foundation
#if canImport(FoundationNetworking)
import FoundationNetworking
#endif

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

    public init(errors: [ApiErrorItem]? = nil) {
        self.errors = errors
    }
}

public struct OAuthError: Codable, Error {
    public let error: String?

    public init(error: String? = nil) {
        self.error = error
    }

    public var localizedDescription: String { error }
}
