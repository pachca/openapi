import Foundation

struct PachcaClient {

    init(baseURL: String, token: String) {
        let headers = ["Authorization": "Bearer \(token)"]
    }
}
