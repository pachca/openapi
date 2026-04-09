import Foundation
#if canImport(FoundationNetworking)
import FoundationNetworking
#endif

let pachcaDecoder: JSONDecoder = {
    let decoder = JSONDecoder()
    return decoder
}()

let pachcaEncoder: JSONEncoder = {
    let encoder = JSONEncoder()
    return encoder
}()

func serialize<T: Encodable>(_ value: T) throws -> Data {
    let data = try pachcaEncoder.encode(value)
    let json = try JSONSerialization.jsonObject(with: data)
    return try JSONSerialization.data(withJSONObject: stripNulls(json))
}

func deserialize<T: Decodable>(_ type: T.Type, from data: Data) throws -> T {
    return try pachcaDecoder.decode(type, from: data)
}

public struct AnyCodable: Codable {
    public let value: Any

    public init(_ value: Any) { self.value = value }

    public init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()
        if container.decodeNil() { value = NSNull() }
        else if let b = try? container.decode(Bool.self) { value = b }
        else if let i = try? container.decode(Int.self) { value = i }
        else if let d = try? container.decode(Double.self) { value = d }
        else if let s = try? container.decode(String.self) { value = s }
        else if let a = try? container.decode([AnyCodable].self) { value = a.map { $0.value } }
        else if let o = try? container.decode([String: AnyCodable].self) { value = o.mapValues { $0.value } }
        else { value = NSNull() }
    }

    public func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        switch value {
        case is NSNull: try container.encodeNil()
        case let b as Bool: try container.encode(b)
        case let i as Int: try container.encode(i)
        case let d as Double: try container.encode(d)
        case let s as String: try container.encode(s)
        case let a as [Any]: try container.encode(a.map { AnyCodable($0) })
        case let o as [String: Any]: try container.encode(o.mapValues { AnyCodable($0) })
        default: try container.encodeNil()
        }
    }
}

private let maxRetries = 3
private let retryable5xx: Set<Int> = [500, 502, 503, 504]

private func jitter(_ delay: UInt64) -> UInt64 {
    return UInt64(Double(delay) * (0.5 + Double.random(in: 0..<0.5)))
}

func dataWithRetry(session: URLSession, for request: URLRequest, delegate: (any URLSessionTaskDelegate)? = nil) async throws -> (Data, URLResponse) {
    for attempt in 0...maxRetries {
        let (data, response) = try await session.data(for: request, delegate: delegate)
        if let http = response as? HTTPURLResponse {
            if http.statusCode == 429, attempt < maxRetries {
                let delay: UInt64
                if let ra = http.value(forHTTPHeaderField: "Retry-After"), let secs = UInt64(ra) {
                    delay = secs * 1_000_000_000
                } else {
                    delay = UInt64(pow(2.0, Double(attempt))) * 1_000_000_000
                }
                try await _Concurrency.Task.sleep(nanoseconds: addJitter(delay))
                continue
            }
            if retryable5xx.contains(http.statusCode), attempt < maxRetries {
                let delay = UInt64(attempt + 1) * 1_000_000_000
                try await _Concurrency.Task.sleep(nanoseconds: addJitter(delay))
                continue
            }
        }
        return (data, response)
    }
    return try await session.data(for: request, delegate: delegate) // unreachable
}

private func stripNulls(_ value: Any) -> Any {
    if let dict = value as? [String: Any] {
        return dict.compactMapValues { v -> Any? in
            if v is NSNull { return nil }
            return stripNulls(v)
        }
    }
    if let arr = value as? [Any] {
        return arr.map(stripNulls)
    }
    return value
}
