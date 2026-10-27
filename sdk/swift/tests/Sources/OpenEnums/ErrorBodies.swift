import Foundation
#if canImport(FoundationNetworking)
import FoundationNetworking
#endif
import PachcaSDK

// Error bodies: an error answer whose body is empty or not JSON is an ApiError
// with the status code and no errors, not a decoding error. The event stream
// answers 404 with no body when the event history is off, and a proxy answers
// 502 with an HTML page. Every request is answered by one canned response
// instead of the network. Run from main.swift.

final class RawProtocol: URLProtocol {
    static var answer: (status: Int, body: String, contentType: String?) = (200, "{}", nil)

    override class func canInit(with request: URLRequest) -> Bool { true }
    override class func canonicalRequest(for request: URLRequest) -> URLRequest { request }

    override func startLoading() {
        let answer = RawProtocol.answer
        let response = HTTPURLResponse(
            url: request.url!, statusCode: answer.status, httpVersion: "HTTP/1.1",
            headerFields: answer.contentType.map { ["Content-Type": $0] } ?? [:]
        )!
        client?.urlProtocol(self, didReceive: response, cacheStoragePolicy: .notAllowed)
        if !answer.body.isEmpty { client?.urlProtocol(self, didLoad: Data(answer.body.utf8)) }
        client?.urlProtocolDidFinishLoading(self)
    }

    override func stopLoading() {}
}

private func checkErrorBody(_ condition: Bool, _ message: String) {
    if !condition {
        FileHandle.standardError.write(Data("error bodies failed: \(message)\n".utf8))
        exit(1)
    }
}

private func failure(_ status: Int, _ body: String, _ contentType: String? = nil, _ call: () async throws -> Void) async -> Error {
    RawProtocol.answer = (status, body, contentType)
    do {
        try await call()
    } catch {
        return error
    }
    checkErrorBody(false, "the call did not fail for \(status)")
    fatalError()
}

@discardableResult
private func checkApiError(_ error: Error, _ status: Int, _ what: String) -> ApiError {
    guard let apiError = error as? ApiError else {
        checkErrorBody(false, "\(what) is an ApiError, got \(error)")
        fatalError()
    }
    checkErrorBody(apiError.statusCode == status, "\(what) keeps the status code \(status), got \(String(describing: apiError.statusCode))")
    return apiError
}

func checkErrorBodies() async {
    let configuration = URLSessionConfiguration.ephemeral
    configuration.protocolClasses = [RawProtocol.self]
    let client = PachcaClient(
        baseURL: "https://pachca.test",
        headers: ["Authorization": "Bearer test-token"],
        session: URLSession(configuration: configuration)
    )

    let empty = checkApiError(await failure(404, "") { _ = try await client.bots.getWebhookEventsStream() }, 404, "a 404 with no body")
    checkErrorBody(empty.errors.isEmpty, "an empty body gives no errors, got \(empty.errors)")
    checkErrorBody(empty.localizedDescription == "HTTP 404", "the message names the status, got \(empty.localizedDescription)")

    // POST is not repeated after a 5xx: one request, the page comes back at once.
    checkApiError(await failure(502, "<html><body>502 Bad Gateway</body></html>", "text/html") { _ = try await client.bots.selfRecreateBotToken() }, 502, "a proxy page")
    checkApiError(await failure(404, "<html>Not Found</html>", "text/html") { try await client.messages.deleteMessage(id: 1) }, 404, "a call with no answer body")

    let invalidBody = #"{"errors":[{"key":"name","value":null,"message":"Name is blank","code":"blank","payload":null}]}"#
    let invalid = checkApiError(await failure(422, invalidBody, "application/json") { _ = try await client.bots.selfRecreateBotToken() }, 422, "a JSON error")
    checkErrorBody(invalid.errors.count == 1 && invalid.localizedDescription == "Name is blank", "a JSON error keeps its errors, got \(invalid.localizedDescription)")

    let oauthBody = #"{"error":"invalid_token","error_description":"Access token is missing"}"#
    let oauth = await failure(401, oauthBody, "application/json") { _ = try await client.bots.getWebhookEventsStream() }
    checkErrorBody((oauth as? OAuthError)?.error == .invalidToken, "the OAuth form is an OAuthError, got \(oauth)")
    checkApiError(await failure(401, "") { _ = try await client.bots.getWebhookEventsStream() }, 401, "a 401 with no body")

    print("error bodies ok")
}
