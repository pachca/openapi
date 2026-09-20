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

private let maxRetries = 3
private let retryable5xx: Set<Int> = [500, 502, 503, 504]

// Retry-After is a minimum, not an estimate: waiting less lands the retry
// inside a window that is still closed. Jitter only upwards.
private func jitter(_ delay: UInt64) -> UInt64 {
    return UInt64(Double(delay) * (1 + Double.random(in: 0..<0.25)))
}

// Only the daily chat limit and the hour-long ban wait longer than a minute.
private let maxRetryAfterSeconds: UInt64 = 60

func dataWithRetry(session: URLSession, for request: URLRequest, delegate: (any URLSessionTaskDelegate)? = nil) async throws -> (Data, URLResponse) {
    for attempt in 0...maxRetries {
        let (data, response) = try await session.data(for: request, delegate: delegate)
        if let http = response as? HTTPURLResponse {
            if http.statusCode == 429, attempt < maxRetries {
                let delay: UInt64
                if let ra = http.value(forHTTPHeaderField: "Retry-After"), let secs = UInt64(ra) {
                    // A long pause is the daily chat limit or an hour-long ban. Retrying
                    // it is pointless, and an early retry doubles the pause: hand the
                    // response back so the caller can schedule the work itself.
                    if secs > maxRetryAfterSeconds {
                        return (data, response)
                    }
                    delay = secs * 1_000_000_000
                } else {
                    delay = UInt64(pow(2.0, Double(attempt))) * 1_000_000_000
                }
                try await _Concurrency.Task.sleep(nanoseconds: jitter(delay))
                continue
            }
            if retryable5xx.contains(http.statusCode), attempt < maxRetries {
                let delay = UInt64(attempt + 1) * 1_000_000_000
                try await _Concurrency.Task.sleep(nanoseconds: jitter(delay))
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
