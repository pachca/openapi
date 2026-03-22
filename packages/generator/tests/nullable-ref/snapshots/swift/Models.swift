import Foundation
#if canImport(FoundationNetworking)
import FoundationNetworking
#endif

public struct Address: Codable {
    public let city: String
    public let zip: String?

    public init(city: String, zip: String? = nil) {
        self.city = city
        self.zip = zip
    }
}

public struct Person: Codable {
    public let id: Int
    public let name: String
    public let homeAddress: Address?
    public let workAddress: Address?

    public init(id: Int, name: String, homeAddress: Address? = nil, workAddress: Address? = nil) {
        self.id = id
        self.name = name
        self.homeAddress = homeAddress
        self.workAddress = workAddress
    }

    enum CodingKeys: String, CodingKey {
        case id
        case name
        case homeAddress = "home_address"
        case workAddress = "work_address"
    }
}
