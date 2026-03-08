import Foundation

public struct FileUploadRequest: Codable {
    public let contentDisposition: String
    public let acl: String
    public let policy: String
    public let xAmzCredential: String
    public let xAmzAlgorithm: String
    public let xAmzDate: String
    public let xAmzSignature: String
    public let key: String
    public var file: Data

    public init(contentDisposition: String, acl: String, policy: String, xAmzCredential: String, xAmzAlgorithm: String, xAmzDate: String, xAmzSignature: String, key: String, file: Data) {
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

public struct UploadParams: Codable {
    public let Content_Disposition: String
    public let acl: String
    public let policy: String
    public let xAmzCredential: String
    public let xAmzAlgorithm: String
    public let xAmzDate: String
    public let xAmzSignature: String
    public let key: String
    public let directUrl: String

    public init(Content_Disposition: String, acl: String, policy: String, xAmzCredential: String, xAmzAlgorithm: String, xAmzDate: String, xAmzSignature: String, key: String, directUrl: String) {
        self.Content_Disposition = Content_Disposition
        self.acl = acl
        self.policy = policy
        self.xAmzCredential = xAmzCredential
        self.xAmzAlgorithm = xAmzAlgorithm
        self.xAmzDate = xAmzDate
        self.xAmzSignature = xAmzSignature
        self.key = key
        self.directUrl = directUrl
    }

    enum CodingKeys: String, CodingKey {
        case Content_Disposition = "Content-Disposition"
        case acl
        case policy
        case xAmzCredential = "x-amz-credential"
        case xAmzAlgorithm = "x-amz-algorithm"
        case xAmzDate = "x-amz-date"
        case xAmzSignature = "x-amz-signature"
        case key
        case directUrl = "direct_url"
    }
}

public struct OAuthError: Codable, Error {
    public let error: String?

    public init(error: String? = nil) {
        self.error = error
    }
}

struct UploadParamsDataWrapper: Codable {
    let data: UploadParams
}
