import Foundation

struct CommonService {
    let baseURL: String
    let headers: [String: String]
    let session: URLSession

    init(baseURL: String, headers: [String: String], session: URLSession = .shared) {
        self.baseURL = baseURL
        self.headers = headers
        self.session = session
    }

    func uploadFile(request body: FileUploadRequest) async throws {
        let boundary = UUID().uuidString
        var request = URLRequest(url: URL(string: "\(baseURL)/uploads")!)
        request.httpMethod = "POST"
        request.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")

        var data = Data()
        func appendField(_ name: String, _ value: String) {
            data.append("--\(boundary)\r\n".data(using: .utf8)!)
            data.append("Content-Disposition: form-data; name=\"\(name)\"\r\n\r\n".data(using: .utf8)!)
            data.append("\(value)\r\n".data(using: .utf8)!)
        }

        if let v = body.contentDisposition { appendField("content-disposition", v) }
        if let v = body.acl { appendField("acl", v) }
        if let v = body.policy { appendField("policy", v) }
        if let v = body.xAmzCredential { appendField("x-amz-credential", v) }
        if let v = body.xAmzAlgorithm { appendField("x-amz-algorithm", v) }
        if let v = body.xAmzDate { appendField("x-amz-date", v) }
        if let v = body.xAmzSignature { appendField("x-amz-signature", v) }
        appendField("key", body.key)

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

struct PachcaClient {
    let common: CommonService

    init(baseURL: String, token: String) {
        let headers = ["Authorization": "Bearer \(token)"]
        self.common = CommonService(baseURL: baseURL, headers: headers)
    }
}
