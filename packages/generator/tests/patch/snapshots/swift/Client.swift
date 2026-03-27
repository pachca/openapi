import Foundation
#if canImport(FoundationNetworking)
import FoundationNetworking
#endif

private func pachcaNotImplemented(_ method: String) -> Error {
    NSError(domain: "PachcaClient", code: 1, userInfo: [NSLocalizedDescriptionKey: method + " is not implemented"])
}

open class ItemsService {
    public init() {}

    open func patchItem(id: Int, request body: ItemPatchRequest) async throws -> Item {
        throw pachcaNotImplemented("Items.patchItem")
    }
}

public final class ItemsServiceImpl: ItemsService {
    let baseURL: String
    let headers: [String: String]
    let session: URLSession

    init(baseURL: String, headers: [String: String], session: URLSession = .shared) {
        self.baseURL = baseURL
        self.headers = headers
        self.session = session
        super.init()
    }

    public override func patchItem(id: Int, request body: ItemPatchRequest) async throws -> Item {
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

    public init(token: String, baseURL: String = "https://api.example.com/v1", items: ItemsService? = nil) {
        let headers = ["Authorization": "Bearer \(token)"]
        self.items = items ?? ItemsServiceImpl(baseURL: baseURL, headers: headers)
    }
}
