import Foundation
#if canImport(FoundationNetworking)
import FoundationNetworking
#endif

private func pachcaNotImplemented(_ method: String) -> Error {
    NSError(domain: "PachcaClient", code: 1, userInfo: [NSLocalizedDescriptionKey: method + " is not implemented"])
}

open class EventsService {
    public init() {}

    open func getEvents() async throws -> GetEventsResponse {
        throw pachcaNotImplemented("Events.getEvents")
    }
}

public final class EventsServiceImpl: EventsService {
    let baseURL: String
    let headers: [String: String]
    let session: URLSession

    init(baseURL: String, headers: [String: String], session: URLSession = .shared) {
        self.baseURL = baseURL
        self.headers = headers
        self.session = session
        super.init()
    }

    public override func getEvents() async throws -> GetEventsResponse {
        var request = URLRequest(url: URL(string: "\(baseURL)/events")!)
        headers.forEach { request.setValue($1, forHTTPHeaderField: $0) }
        let (data, urlResponse) = try await dataWithRetry(session: session, for: request)
        let statusCode = (urlResponse as! HTTPURLResponse).statusCode
        switch statusCode {
        case 200:
            return try deserialize(GetEventsResponse.self, from: data)
        default:
            throw URLError(.badServerResponse)
        }
    }
}

public struct PachcaClient {
    public let events: EventsService

    private init(events: EventsService) {
        self.events = events
    }

    public init(token: String, baseURL: String, events: EventsService? = nil) {
        let headers = ["Authorization": "Bearer \(token)"]
        self.init(
            events: events ?? EventsServiceImpl(baseURL: baseURL, headers: headers)
        )
    }

    public init(baseURL: String, headers: [String: String], session: URLSession = .shared, events: EventsService? = nil) {
        self.init(
            events: events ?? EventsServiceImpl(baseURL: baseURL, headers: headers, session: session)
        )
    }

    public static func stub(events: EventsService = EventsService()) -> PachcaClient {
        PachcaClient(
            events: events
        )
    }
}
