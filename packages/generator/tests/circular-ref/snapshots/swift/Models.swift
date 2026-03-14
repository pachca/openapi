import Foundation

public class Category: Codable {
    public let id: Int
    public let name: String
    public let parent: Category?
    public let children: [Category]?

    public init(id: Int, name: String, parent: Category? = nil, children: [Category]? = nil) {
        self.id = id
        self.name = name
        self.parent = parent
        self.children = children
    }
}

public class TreeNode: Codable {
    public let value: String
    public let left: TreeNode?
    public let right: TreeNode?

    public init(value: String, left: TreeNode? = nil, right: TreeNode? = nil) {
        self.value = value
        self.left = left
        self.right = right
    }
}
