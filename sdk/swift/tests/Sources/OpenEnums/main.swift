import Foundation
#if canImport(FoundationNetworking)
import FoundationNetworking
#endif
import PachcaSDK

// Open enums: a value the SDK does not list yet decodes and keeps the raw string —
// in a response, in the OAuth error body and in the API error body. Every request
// is answered by the next canned response instead of the network.

let tokenInfo = """
{"data":{"id":4827,"token":"cH5kR9mN...x7Qp","name":null,"user_id":12,\
"scopes":["messages:read","brand_new:scope"],"created_at":"2025-01-15T10:30:00.000Z",\
"revoked_at":null,"expires_in":null,"last_used_at":null}}
"""
let unlisted = "A code this SDK does not list"

final class CannedProtocol: URLProtocol {
    static var responses: [(Int, String)] = [
        (200, tokenInfo),
        (401, #"{"error":"brand_new_401","error_description":"\#(unlisted)"}"#),
        (403, #"{"error":"brand_new_403","error_description":"\#(unlisted)"}"#),
        (422, #"{"errors":[{"key":"system","value":null,"message":"\#(unlisted)","code":"brand_new_code","payload":null}]}"#),
    ]

    override class func canInit(with request: URLRequest) -> Bool { true }
    override class func canonicalRequest(for request: URLRequest) -> URLRequest { request }

    override func startLoading() {
        let (status, body) = CannedProtocol.responses.removeFirst()
        let response = HTTPURLResponse(
            url: request.url!, statusCode: status, httpVersion: "HTTP/1.1",
            headerFields: ["Content-Type": "application/json"]
        )!
        client?.urlProtocol(self, didReceive: response, cacheStoragePolicy: .notAllowed)
        client?.urlProtocol(self, didLoad: Data(body.utf8))
        client?.urlProtocolDidFinishLoading(self)
    }

    override func stopLoading() {}
}

func check(_ condition: Bool, _ message: String) {
    if !condition {
        FileHandle.standardError.write(Data("open enums failed: \(message)\n".utf8))
        exit(1)
    }
}

let configuration = URLSessionConfiguration.ephemeral
configuration.protocolClasses = [CannedProtocol.self]
let client = PachcaClient(
    baseURL: "https://pachca.test",
    headers: ["Authorization": "Bearer test-token"],
    session: URLSession(configuration: configuration)
)

let info = try await client.oauth.getTokenInfo()
check(info.scopes[0] == .messagesRead, "a listed scope decodes to its case, got \(info.scopes[0])")
check(info.scopes[1] == .unknown("brand_new:scope"), "an unlisted scope keeps its value, got \(info.scopes[1])")
check(info.scopes.map(\.rawValue) == ["messages:read", "brand_new:scope"], "rawValue gives the values back")

for code in ["brand_new_401", "brand_new_403"] {
    do {
        _ = try await client.oauth.getTokenInfo()
        check(false, "expected OAuthError with \(code)")
    } catch let error as OAuthError {
        check(error.error == OAuthErrorCode(code) && error.localizedDescription == code, "OAuthError keeps the unlisted code \(code), got \(error.error)")
        check(error.error != "insufficient_scope", "the code compares with a string literal")
    } catch {
        check(false, "expected OAuthError with \(code), got \(error)")
    }
}

do {
    _ = try await client.oauth.getTokenInfo()
    check(false, "expected ApiError with brand_new_code")
} catch let error as ApiError {
    check(error.errors[0].code == .unknown("brand_new_code"), "ApiError keeps the unlisted code, got \(error.errors[0].code)")
} catch {
    check(false, "expected ApiError with brand_new_code, got \(error)")
}

check(OAuthErrorCode(rawValue: "insufficient_scope") == .insufficientScope, "a listed code is its case")
check(OAuthErrorCode.insufficientScope == "insufficient_scope", "a listed case equals its string literal")
print("open enums ok")
