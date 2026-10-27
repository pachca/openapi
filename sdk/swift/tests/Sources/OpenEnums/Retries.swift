import Foundation
#if canImport(FoundationNetworking)
import FoundationNetworking
#endif
import PachcaSDK

// Retries: a 504 with the error code timeout is a search the server stopped
// because the query is too heavy, so the client hands it back at once with its
// body intact, while a 504 from a proxy is retried. Every request is answered by
// the same canned response instead of the network. Run from main.swift.

private let searchTimeout = #"{"errors":[{"key":"system","value":null,"message":"Search timed out","code":"timeout","payload":null}]}"#

final class RepeatingProtocol: URLProtocol {
    static var answer: (Int, String) = (200, "{}")
    static var requests = 0

    override class func canInit(with request: URLRequest) -> Bool { true }
    override class func canonicalRequest(for request: URLRequest) -> URLRequest { request }

    override func startLoading() {
        RepeatingProtocol.requests += 1
        let (status, body) = RepeatingProtocol.answer
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

private func checkRetry(_ condition: Bool, _ message: String) {
    if !condition {
        FileHandle.standardError.write(Data("retries failed: \(message)\n".utf8))
        exit(1)
    }
}

func checkRetries() async {
    let configuration = URLSessionConfiguration.ephemeral
    configuration.protocolClasses = [RepeatingProtocol.self]
    let client = PachcaClient(
        baseURL: "https://pachca.test",
        headers: ["Authorization": "Bearer test-token"],
        session: URLSession(configuration: configuration)
    )

    // The search timed out: one request, and the error keeps its code.
    RepeatingProtocol.answer = (504, searchTimeout)
    RepeatingProtocol.requests = 0
    let started = Date()
    do {
        _ = try await client.search.searchMessages(query: "report")
        checkRetry(false, "expected ApiError with timeout")
    } catch let error as ApiError {
        checkRetry(error.errors[0].code == .timeout, "the body reaches the caller, got \(error.errors[0].code)")
    } catch {
        checkRetry(false, "expected ApiError with timeout, got \(error)")
    }
    checkRetry(RepeatingProtocol.requests == 1, "a 504 with the code timeout is not repeated, got \(RepeatingProtocol.requests) requests")
    checkRetry(Date().timeIntervalSince(started) < 5, "a 504 with the code timeout comes back at once")

    // The retry after a 5xx waits about a second: a call cancelled while waiting,
    // with one request made, was waiting for it.
    for body in ["<html>Gateway Timeout</html>", #"{"errors":[{"code":"unavailable","message":"Try later"}]}"#] {
        RepeatingProtocol.answer = (504, body)
        RepeatingProtocol.requests = 0
        let call = _Concurrency.Task { try await client.chats.listChats() }
        try? await _Concurrency.Task.sleep(nanoseconds: 500_000_000)
        call.cancel()
        let result = await call.result
        if case .failure(let error) = result {
            checkRetry(error is CancellationError, "a 504 without the code timeout is retried, the call failed with \(error) for \(body)")
        } else {
            checkRetry(false, "a 504 without the code timeout is retried, the call returned for \(body)")
        }
        checkRetry(RepeatingProtocol.requests == 1, "one request before the pause, got \(RepeatingProtocol.requests) for \(body)")
    }
    print("retries ok")
}
