import Foundation

public struct ItemsService {
    let baseURL: String
    let headers: [String: String]
    let session: URLSession

    init(baseURL: String, headers: [String: String], session: URLSession = .shared) {
        self.baseURL = baseURL
        self.headers = headers
        self.session = session
    }

    public func patchItem(id: Int, request body: ItemPatchRequest) async throws -> Item {
        var request = URLRequest(url: URL(string: "\(baseURL)/items/\(id)")!)
        request.httpMethod = "PATCH"
        headers.forEach { request.setValue($1, forHTTPHeaderField: $0) }
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try serialize(body)
        let (data, urlResponse) = try await dataWithRetry(session: session, for: request)
        let statusCode = (urlResponse as! HTTPURLResponse).statusCode
        switch statusCode {
        case 200:
            return try deserialize(ItemDataWrapper.self, from: data).data
        default:
            throw try deserialize(ApiError.self, from: data)
        }
    }
}

public struct PachcaClient {
    public let items: ItemsService

    public init(token: String, baseURL: String = "https://api.example.com/v1") {
        let headers = ["Authorization": "Bearer \(token)"]
        self.items = ItemsService(baseURL: baseURL, headers: headers)
    }
}
