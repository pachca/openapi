import Foundation
#if canImport(FoundationNetworking)
import FoundationNetworking
#endif

private func pachcaNotImplemented(_ method: String) -> Error {
    NSError(domain: "PachcaClient", code: 1, userInfo: [NSLocalizedDescriptionKey: method + " is not implemented"])
}

private func pachcaParseWebhookDate(_ value: String) -> Date? {
    let fractionalFormatter = ISO8601DateFormatter()
    fractionalFormatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
    if let date = fractionalFormatter.date(from: value) { return date }
    return ISO8601DateFormatter().date(from: value)
}

open class BotsService {
    public init() {}

    open func getWebhookEvents(limit: Int? = nil, cursor: String? = nil) async throws -> GetWebhookEventsResponse {
        throw pachcaNotImplemented("Bots.getWebhookEvents")
    }

    open func getWebhookEventsAll(limit: Int? = nil) async throws -> [WebhookEvent] {
        throw pachcaNotImplemented("Bots.getWebhookEventsAll")
    }

    open func pollWebhookEvents(
        limit: Int? = 50,
        interval: TimeInterval = 5,
        createdAfter: Date? = nil,
        maxSeenDeliveryIds: Int = 5_000
    ) -> AsyncThrowingStream<WebhookEvent, Error> {
        AsyncThrowingStream { continuation in
            let task = Swift.Task {
                do {
                    guard maxSeenDeliveryIds > 0 else {
                        throw NSError(domain: "PachcaClient", code: 1, userInfo: [NSLocalizedDescriptionKey: "maxSeenDeliveryIds must be greater than 0"])
                    }

                    let effectiveCreatedAfter = createdAfter ?? Date()
                    var seenIdOrder: [String] = []
                    var seenIds = Set<String>()

                    func remember(_ id: String) -> Bool {
                        guard seenIds.insert(id).inserted else { return false }
                        seenIdOrder.append(id)
                        while seenIdOrder.count > maxSeenDeliveryIds {
                            seenIds.remove(seenIdOrder.removeFirst())
                        }
                        return true
                    }

                    while !Swift.Task.isCancelled {
                        var cursor: String? = nil
                        var hasNext = true
                        while hasNext && !Swift.Task.isCancelled {
                            let response = try await getWebhookEvents(limit: limit, cursor: cursor)
                            var pageHasRecentEvents = false
                            for event in response.data.reversed() {
                                let matchesCreatedAfter = pachcaParseWebhookDate(event.createdAt).map { $0 >= effectiveCreatedAfter } == true
                                if matchesCreatedAfter {
                                    pageHasRecentEvents = true
                                }
                                if matchesCreatedAfter && remember(event.id) {
                                    continuation.yield(event)
                                }
                            }
                            hasNext = (response.meta.paginate.hasNext ?? !response.data.isEmpty) && pageHasRecentEvents
                            cursor = response.meta.paginate.nextPage
                        }
                        try await Swift.Task.sleep(nanoseconds: UInt64(max(interval, 0) * 1_000_000_000))
                    }
                    continuation.finish()
                } catch {
                    continuation.finish(throwing: error)
                }
            }
            continuation.onTermination = { _ in task.cancel() }
        }
    }

    open func pollWebhookPayloads(
        limit: Int? = 50,
        interval: TimeInterval = 5,
        createdAfter: Date? = nil,
        maxSeenDeliveryIds: Int = 5_000,
        includePayload: @escaping (WebhookPayloadUnion) -> Bool = { _ in true }
    ) -> AsyncThrowingStream<WebhookPayloadUnion, Error> {
        AsyncThrowingStream { continuation in
            let task = Swift.Task {
                do {
                    for try await event in pollWebhookEvents(
                        limit: limit,
                        interval: interval,
                        createdAfter: createdAfter,
                        maxSeenDeliveryIds: maxSeenDeliveryIds
                    ) {
                        if includePayload(event.payload) {
                            continuation.yield(event.payload)
                        }
                    }
                    continuation.finish()
                } catch {
                    continuation.finish(throwing: error)
                }
            }
            continuation.onTermination = { _ in task.cancel() }
        }
    }
}

public final class BotsServiceImpl: BotsService {
    let baseURL: String
    let headers: [String: String]
    let session: URLSession

    init(baseURL: String, headers: [String: String], session: URLSession = .shared) {
        self.baseURL = baseURL
        self.headers = headers
        self.session = session
        super.init()
    }

    public override func getWebhookEvents(limit: Int? = nil, cursor: String? = nil) async throws -> GetWebhookEventsResponse {
        var components = URLComponents(string: "\(baseURL)/webhooks/events")!
        var queryItems: [URLQueryItem] = []
        if let limit { queryItems.append(URLQueryItem(name: "limit", value: String(limit))) }
        if let cursor { queryItems.append(URLQueryItem(name: "cursor", value: String(cursor))) }
        if !queryItems.isEmpty { components.queryItems = queryItems }
        var request = URLRequest(url: components.url!)
        headers.forEach { request.setValue($1, forHTTPHeaderField: $0) }
        let (data, urlResponse) = try await dataWithRetry(session: session, for: request)
        let statusCode = (urlResponse as! HTTPURLResponse).statusCode
        switch statusCode {
        case 200:
            return try deserialize(GetWebhookEventsResponse.self, from: data)
        default:
            throw URLError(.badServerResponse)
        }
    }

    public override func getWebhookEventsAll(limit: Int? = nil) async throws -> [WebhookEvent] {
        var items: [WebhookEvent] = []
        var cursor: String? = nil
        var hasNext = true
        while hasNext {
            let response = try await getWebhookEvents(limit: limit, cursor: cursor)
            items.append(contentsOf: response.data)
            if response.data.isEmpty { break }
            cursor = response.meta.paginate.nextPage
            hasNext = response.meta.paginate.hasNext ?? true
        }
        return items
    }
}

public let pachcaAPIURL = "https://api.pachca.com/api/shared/v1"

public struct PachcaClient {
    public let bots: BotsService

    private init(bots: BotsService) {
        self.bots = bots
    }

    public init(token: String, baseURL: String = pachcaAPIURL, bots: BotsService? = nil) {
        let headers = ["Authorization": "Bearer \(token)"]
        self.init(
            bots: bots ?? BotsServiceImpl(baseURL: baseURL, headers: headers)
        )
    }

    public init(baseURL: String = pachcaAPIURL, headers: [String: String], session: URLSession = .shared, bots: BotsService? = nil) {
        self.init(
            bots: bots ?? BotsServiceImpl(baseURL: baseURL, headers: headers, session: session)
        )
    }

    public static func stub(bots: BotsService = BotsService()) -> PachcaClient {
        PachcaClient(
            bots: bots
        )
    }
}
