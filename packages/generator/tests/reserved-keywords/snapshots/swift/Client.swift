import Foundation
#if canImport(FoundationNetworking)
import FoundationNetworking
#endif

public struct PachcaClient {

    public init(token: String, baseURL: String = "https://api.example.com/api/v1") {
        let headers = ["Authorization": "Bearer \(token)"]
    }
}
