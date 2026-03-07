import Foundation

struct FileUploadRequest: Codable {
    let contentDisposition: String?
    let acl: String?
    let policy: String?
    let xAmzCredential: String?
    let xAmzAlgorithm: String?
    let xAmzDate: String?
    let xAmzSignature: String?
    let key: String
    var file: Data

    enum CodingKeys: String, CodingKey {
        case contentDisposition = "content-disposition"
        case acl
        case policy
        case xAmzCredential = "x-amz-credential"
        case xAmzAlgorithm = "x-amz-algorithm"
        case xAmzDate = "x-amz-date"
        case xAmzSignature = "x-amz-signature"
        case key
        case file
    }
}

struct OAuthError: Codable, Error {
    let error: String?
}
