import Foundation
#if canImport(FoundationNetworking)
import FoundationNetworking
#endif

private func pachcaNotImplemented(_ method: String) -> Error {
    NSError(domain: "PachcaClient", code: 1, userInfo: [NSLocalizedDescriptionKey: method + " is not implemented"])
}

open class CommonService {
    public init() {}

    open func uploadFile(directUrl: String, request body: FileUploadRequest) async throws -> Void {
        throw pachcaNotImplemented("Common.uploadFile")
    }

    open func getUploadParams() async throws -> UploadParams {
        throw pachcaNotImplemented("Common.getUploadParams")
    }
}

public final class CommonServiceImpl: CommonService {
    let baseURL: String
    let headers: [String: String]
    let session: URLSession

    init(baseURL: String, headers: [String: String], session: URLSession = .shared) {
        self.baseURL = baseURL
        self.headers = headers
        self.session = session
        super.init()
    }

    public override func uploadFile(directUrl: String, request body: FileUploadRequest) async throws -> Void {
        var request = URLRequest(url: URL(string: "\(directUrl)")!)
        request.httpMethod = "POST"
        let boundary = UUID().uuidString
        request.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")
        var data = Data()
        func appendField(_ name: String, _ value: String) {
            data.append("--\(boundary)\r\n".data(using: .utf8)!)
            data.append("Content-Disposition: form-data; name=\"\(name)\"\r\n\r\n".data(using: .utf8)!)
            data.append("\(value)\r\n".data(using: .utf8)!)
        }
        appendField("content-disposition", String(describing: body.contentDisposition))
        appendField("acl", String(describing: body.acl))
        appendField("policy", String(describing: body.policy))
        appendField("x-amz-credential", String(describing: body.xAmzCredential))
        appendField("x-amz-algorithm", String(describing: body.xAmzAlgorithm))
        appendField("x-amz-date", String(describing: body.xAmzDate))
        appendField("x-amz-signature", String(describing: body.xAmzSignature))
        appendField("key", String(describing: body.key))
        data.append("--\(boundary)\r\n".data(using: .utf8)!)
        data.append("Content-Disposition: form-data; name=\"file\"; filename=\"upload\"\r\n".data(using: .utf8)!)
        data.append("Content-Type: application/octet-stream\r\n\r\n".data(using: .utf8)!)
        data.append(body.file)
        data.append("\r\n".data(using: .utf8)!)
        data.append("--\(boundary)--\r\n".data(using: .utf8)!)
        request.httpBody = data
        let (responseData, urlResponse) = try await dataWithRetry(session: session, for: request)
        let statusCode = (urlResponse as! HTTPURLResponse).statusCode
        switch statusCode {
        case 204:
            return
        case 401:
            throw try deserialize(OAuthError.self, from: responseData)
        default:
            throw URLError(.badServerResponse)
        }
    }

    public override func getUploadParams() async throws -> UploadParams {
        var request = URLRequest(url: URL(string: "\(baseURL)/uploads")!)
        request.httpMethod = "POST"
        headers.forEach { request.setValue($1, forHTTPHeaderField: $0) }
        let (data, urlResponse) = try await dataWithRetry(session: session, for: request)
        let statusCode = (urlResponse as! HTTPURLResponse).statusCode
        switch statusCode {
        case 201:
            return try deserialize(UploadParamsDataWrapper.self, from: data).data
        case 401:
            throw try deserialize(OAuthError.self, from: data)
        default:
            throw URLError(.badServerResponse)
        }
    }
}

public let pachcaAPIURL = "https://api.pachca.com/api/shared/v1"

public struct PachcaClient {
    public let common: CommonService

    private init(common: CommonService) {
        self.common = common
    }

    public init(token: String, baseURL: String = pachcaAPIURL, common: CommonService? = nil) {
        let headers = ["Authorization": "Bearer \(token)"]
        self.init(
            common: common ?? CommonServiceImpl(baseURL: baseURL, headers: headers)
        )
    }

    public init(baseURL: String = pachcaAPIURL, headers: [String: String], session: URLSession = .shared, common: CommonService? = nil) {
        self.init(
            common: common ?? CommonServiceImpl(baseURL: baseURL, headers: headers, session: session)
        )
    }

    public static func stub(common: CommonService = CommonService()) -> PachcaClient {
        PachcaClient(
            common: common
        )
    }
}
