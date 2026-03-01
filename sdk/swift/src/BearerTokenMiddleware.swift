import Foundation
import HTTPTypes
import OpenAPIRuntime

public struct BearerTokenMiddleware: ClientMiddleware, Sendable {
    private let headerValue: String

    public init(token: String) {
        self.headerValue = "Bearer \(token)"
    }

    public func intercept(
        _ request: HTTPRequest,
        body: HTTPBody?,
        baseURL: URL,
        operationID: String,
        next: @Sendable (HTTPRequest, HTTPBody?, URL) async throws -> (HTTPResponse, HTTPBody?)
    ) async throws -> (HTTPResponse, HTTPBody?) {
        var request = request
        request.headerFields[.authorization] = headerValue
        return try await next(request, body, baseURL)
    }
}
