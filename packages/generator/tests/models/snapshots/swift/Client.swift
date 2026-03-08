import Foundation

public struct PachcaClient {

    public init(token: String, baseURL: String) {
        let headers = ["Authorization": "Bearer \(token)"]
    }
}
