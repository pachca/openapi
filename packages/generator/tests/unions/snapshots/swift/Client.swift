import Foundation
#if canImport(FoundationNetworking)
import FoundationNetworking
#endif

public struct PachcaClient {

    public init(token: String, baseURL: String) {
        let headers = ["Authorization": "Bearer \(token)"]
    }
}
