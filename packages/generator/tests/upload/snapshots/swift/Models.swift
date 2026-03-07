import Foundation

struct FileUploadRequest {
    var contentDisposition: String?
    var acl: String?
    var policy: String?
    var xAmzCredential: String?
    var xAmzAlgorithm: String?
    var xAmzDate: String?
    var xAmzSignature: String?
    var key: String
    var file: Data
}

struct OAuthError: Codable, Error {
    let error: String?
}
