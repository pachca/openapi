import Foundation

public struct FileUploadRequest: Codable {
    public let contentDisposition: String?
    public let acl: String?
    public let policy: String?
    public let xAmzCredential: String?
    public let xAmzAlgorithm: String?
    public let xAmzDate: String?
    public let xAmzSignature: String?
    public let key: String
    public var file: Data

    public init(contentDisposition: String? = nil, acl: String? = nil, policy: String? = nil, xAmzCredential: String? = nil, xAmzAlgorithm: String? = nil, xAmzDate: String? = nil, xAmzSignature: String? = nil, key: String, file: Data) {
        self.contentDisposition = contentDisposition
        self.acl = acl
        self.policy = policy
        self.xAmzCredential = xAmzCredential
        self.xAmzAlgorithm = xAmzAlgorithm
        self.xAmzDate = xAmzDate
        self.xAmzSignature = xAmzSignature
        self.key = key
        self.file = file
    }

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

public struct OAuthError: Codable, Error {
    public let error: String?

    public init(error: String? = nil) {
        self.error = error
    }
}
