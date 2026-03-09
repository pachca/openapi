import Foundation

let pachcaDecoder: JSONDecoder = {
    let decoder = JSONDecoder()
    decoder.dateDecodingStrategy = .iso8601
    return decoder
}()

let pachcaEncoder: JSONEncoder = {
    let encoder = JSONEncoder()
    encoder.dateEncodingStrategy = .iso8601
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

func dataWithRetry(session: URLSession, for request: URLRequest, delegate: (any URLSessionTaskDelegate)? = nil) async throws -> (Data, URLResponse) {
    for attempt in 0...maxRetries {
        let (data, response) = try await session.data(for: request, delegate: delegate)
        if let http = response as? HTTPURLResponse, http.statusCode == 429, attempt < maxRetries {
            let delay: UInt64
            if let ra = http.value(forHTTPHeaderField: "Retry-After"), let secs = UInt64(ra) {
                delay = secs * 1_000_000_000
            } else {
                delay = UInt64(pow(2.0, Double(attempt))) * 1_000_000_000
            }
            try await Task.sleep(nanoseconds: delay)
            continue
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
