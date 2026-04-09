import Foundation
#if canImport(FoundationNetworking)
import FoundationNetworking
#endif

public struct PachcaClient {

    private init() {
    }

    public init(token: String, baseURL: String) {
        let headers = ["Authorization": "Bearer \(token)"]
        self.init(
        )
    }

    public init(baseURL: String, headers: [String: String], session: URLSession = .shared) {
        self.init(
        )
    }

    public static func stub() -> PachcaClient {
        PachcaClient(
        )
    }
}
