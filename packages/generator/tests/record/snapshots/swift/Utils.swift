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
