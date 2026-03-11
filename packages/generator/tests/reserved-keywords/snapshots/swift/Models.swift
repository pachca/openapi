import Foundation

public struct Entity: Codable {
    public let `class`: String
    public let type: String
    public let `import`: Bool
    public let `return`: String?
    public let val: Int?

    public init(`class`: String, type: String, `import`: Bool, `return`: String? = nil, val: Int? = nil) {
        self.`class` = `class`
        self.type = type
        self.`import` = `import`
        self.`return` = `return`
        self.val = val
    }

    enum CodingKeys: String, CodingKey {
        case `class` = "class"
        case type
        case `import` = "import"
        case `return` = "return"
        case val
    }
}
