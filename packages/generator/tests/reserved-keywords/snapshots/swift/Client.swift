import Foundation
#if canImport(FoundationNetworking)
import FoundationNetworking
#endif

public struct PachcaClient {

    private init() {
    }

    public init(token: String, baseURL: String = "https://api.example.com/api/v1") {
        let headers = ["Authorization": "Bearer \(token)"]
        self.init(
        )
    }

    public static func stub() -> PachcaClient {
        PachcaClient(
        )
    }
}
