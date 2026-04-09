import Foundation
#if canImport(FoundationNetworking)
import FoundationNetworking
#endif

public let pachcaAPIURL = "https://api.example.com/api/v1"

public struct PachcaClient {

    private init() {
    }

    public init(token: String, baseURL: String = pachcaAPIURL) {
        let headers = ["Authorization": "Bearer \(token)"]
        self.init(
        )
    }

    public init(baseURL: String = pachcaAPIURL, headers: [String: String], session: URLSession = .shared) {
        self.init(
        )
    }

    public static func stub() -> PachcaClient {
        PachcaClient(
        )
    }
}
