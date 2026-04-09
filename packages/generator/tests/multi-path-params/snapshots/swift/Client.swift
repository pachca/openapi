import Foundation
#if canImport(FoundationNetworking)
import FoundationNetworking
#endif

private func pachcaNotImplemented(_ method: String) -> Error {
    NSError(domain: "PachcaClient", code: 1, userInfo: [NSLocalizedDescriptionKey: method + " is not implemented"])
}

open class TasksService {
    public init() {}

    open func getTask(projectId: Int, taskId: Int) async throws -> Task {
        throw pachcaNotImplemented("Tasks.getTask")
    }

    open func updateTask(projectId: Int, taskId: Int, request body: TaskUpdateRequest) async throws -> Task {
        throw pachcaNotImplemented("Tasks.updateTask")
    }

    open func deleteComment(projectId: Int, taskId: Int, commentId: Int) async throws -> Void {
        throw pachcaNotImplemented("Tasks.deleteComment")
    }
}

public final class TasksServiceImpl: TasksService {
    let baseURL: String
    let headers: [String: String]
    let session: URLSession

    init(baseURL: String, headers: [String: String], session: URLSession = .shared) {
        self.baseURL = baseURL
        self.headers = headers
        self.session = session
        super.init()
    }

    public override func getTask(projectId: Int, taskId: Int) async throws -> Task {
        var request = URLRequest(url: URL(string: "\(baseURL)/projects/\(projectId)/tasks/\(taskId)")!)
        headers.forEach { request.setValue($1, forHTTPHeaderField: $0) }
        let (data, urlResponse) = try await dataWithRetry(session: session, for: request)
        let statusCode = (urlResponse as! HTTPURLResponse).statusCode
        switch statusCode {
        case 200:
            return try deserialize(TaskDataWrapper.self, from: data).data
        default:
            throw URLError(.badServerResponse)
        }
    }

    public override func updateTask(projectId: Int, taskId: Int, request body: TaskUpdateRequest) async throws -> Task {
        var request = URLRequest(url: URL(string: "\(baseURL)/projects/\(projectId)/tasks/\(taskId)")!)
        request.httpMethod = "PUT"
        headers.forEach { request.setValue($1, forHTTPHeaderField: $0) }
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try serialize(body)
        let (data, urlResponse) = try await dataWithRetry(session: session, for: request)
        let statusCode = (urlResponse as! HTTPURLResponse).statusCode
        switch statusCode {
        case 200:
            return try deserialize(TaskDataWrapper.self, from: data).data
        default:
            throw URLError(.badServerResponse)
        }
    }

    public override func deleteComment(projectId: Int, taskId: Int, commentId: Int) async throws -> Void {
        var request = URLRequest(url: URL(string: "\(baseURL)/projects/\(projectId)/tasks/\(taskId)/comments/\(commentId)")!)
        request.httpMethod = "DELETE"
        headers.forEach { request.setValue($1, forHTTPHeaderField: $0) }
        let (data, urlResponse) = try await dataWithRetry(session: session, for: request)
        let statusCode = (urlResponse as! HTTPURLResponse).statusCode
        switch statusCode {
        case 204:
            return
        default:
            throw URLError(.badServerResponse)
        }
    }
}

public let pachcaAPIURL = "https://api.example.com/v1"

public struct PachcaClient {
    public let tasks: TasksService

    private init(tasks: TasksService) {
        self.tasks = tasks
    }

    public init(token: String, baseURL: String = pachcaAPIURL, tasks: TasksService? = nil) {
        let headers = ["Authorization": "Bearer \(token)"]
        self.init(
            tasks: tasks ?? TasksServiceImpl(baseURL: baseURL, headers: headers)
        )
    }

    public init(baseURL: String = pachcaAPIURL, headers: [String: String], session: URLSession = .shared, tasks: TasksService? = nil) {
        self.init(
            tasks: tasks ?? TasksServiceImpl(baseURL: baseURL, headers: headers, session: session)
        )
    }

    public static func stub(tasks: TasksService = TasksService()) -> PachcaClient {
        PachcaClient(
            tasks: tasks
        )
    }
}
