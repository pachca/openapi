import Foundation
#if canImport(FoundationNetworking)
import FoundationNetworking
#endif

public struct Task: Codable {
    public let id: Int
    public let title: String
    public let isDone: Bool?

    public init(id: Int, title: String, isDone: Bool? = nil) {
        self.id = id
        self.title = title
        self.isDone = isDone
    }

    enum CodingKeys: String, CodingKey {
        case id
        case title
        case isDone = "is_done"
    }
}

public struct TaskUpdateRequestTask: Codable {
    public let title: String?
    public let isDone: Bool?

    public init(title: String? = nil, isDone: Bool? = nil) {
        self.title = title
        self.isDone = isDone
    }

    enum CodingKeys: String, CodingKey {
        case title
        case isDone = "is_done"
    }
}

public struct TaskUpdateRequest: Codable {
    public let task: TaskUpdateRequestTask

    public init(task: TaskUpdateRequestTask) {
        self.task = task
    }
}

struct TaskDataWrapper: Codable {
    let data: Task
}
