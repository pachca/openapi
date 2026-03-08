import Foundation

public struct CommonService {
    let baseURL: String
    let headers: [String: String]
    let session: URLSession

    init(baseURL: String, headers: [String: String], session: URLSession = .shared) {
        self.baseURL = baseURL
        self.headers = headers
        self.session = session
    }

    public func uploadFile(request body: FileUploadRequest) async throws -> Void {
        var request = URLRequest(url: URL(string: "\(baseURL)/uploads")!)
        request.httpMethod = "POST"
        headers.forEach { request.setValue($1, forHTTPHeaderField: $0) }
        let boundary = UUID().uuidString
        request.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")
        var data = Data()
        func appendField(_ name: String, _ value: String) {
            data.append("--\(boundary)\r\n".data(using: .utf8)!)
            data.append("Content-Disposition: form-data; name=\"\(name)\"\r\n\r\n".data(using: .utf8)!)
            data.append("\(value)\r\n".data(using: .utf8)!)
        }
        if let v = body.contentDisposition { appendField("content-disposition", String(describing: v)) }
        if let v = body.acl { appendField("acl", String(describing: v)) }
        if let v = body.policy { appendField("policy", String(describing: v)) }
        if let v = body.xAmzCredential { appendField("x-amz-credential", String(describing: v)) }
        if let v = body.xAmzAlgorithm { appendField("x-amz-algorithm", String(describing: v)) }
        if let v = body.xAmzDate { appendField("x-amz-date", String(describing: v)) }
        if let v = body.xAmzSignature { appendField("x-amz-signature", String(describing: v)) }
        appendField("key", String(describing: body.key))
        data.append("--\(boundary)\r\n".data(using: .utf8)!)
        data.append("Content-Disposition: form-data; name=\"file\"; filename=\"upload\"\r\n".data(using: .utf8)!)
        data.append("Content-Type: application/octet-stream\r\n\r\n".data(using: .utf8)!)
        data.append(body.file)
        data.append("\r\n".data(using: .utf8)!)
        data.append("--\(boundary)--\r\n".data(using: .utf8)!)
        request.httpBody = data
        let (responseData, urlResponse) = try await session.data(for: request)
        let statusCode = (urlResponse as! HTTPURLResponse).statusCode
        switch statusCode {
        case 201:
            return
        case 401:
            throw try pachcaDecoder.decode(OAuthError.self, from: responseData)
        default:
            throw URLError(.badServerResponse)
        }
    }
}

public struct PachcaClient {
    public let common: CommonService

    public init(token: String, baseURL: String = "https://api.pachca.com/api/shared/v1") {
        let headers = ["Authorization": "Bearer \(token)"]
        self.common = CommonService(baseURL: baseURL, headers: headers)
    }
}
