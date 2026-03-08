import Foundation

public struct TasksService {
    let baseURL: String
    let headers: [String: String]
    let session: URLSession

    init(baseURL: String, headers: [String: String], session: URLSession = .shared) {
        self.baseURL = baseURL
        self.headers = headers
        self.session = session
    }

    public func getTask(projectId: Int, taskId: Int) async throws -> Task {
        var request = URLRequest(url: URL(string: "\(baseURL)/projects/\(projectId)/tasks/\(taskId)")!)
        headers.forEach { request.setValue($1, forHTTPHeaderField: $0) }
        let (data, urlResponse) = try await session.data(for: request)
        let statusCode = (urlResponse as! HTTPURLResponse).statusCode
        switch statusCode {
        case 200:
            return try deserialize(TaskDataWrapper.self, from: data).data
        default:
            throw URLError(.badServerResponse)
        }
    }

    public func updateTask(projectId: Int, taskId: Int, request body: TaskUpdateRequest) async throws -> Task {
        var request = URLRequest(url: URL(string: "\(baseURL)/projects/\(projectId)/tasks/\(taskId)")!)
        request.httpMethod = "PUT"
        headers.forEach { request.setValue($1, forHTTPHeaderField: $0) }
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try serialize(body)
        let (data, urlResponse) = try await session.data(for: request)
        let statusCode = (urlResponse as! HTTPURLResponse).statusCode
        switch statusCode {
        case 200:
            return try deserialize(TaskDataWrapper.self, from: data).data
        default:
            throw URLError(.badServerResponse)
        }
    }

    public func deleteComment(projectId: Int, taskId: Int, commentId: Int) async throws -> Void {
        var request = URLRequest(url: URL(string: "\(baseURL)/projects/\(projectId)/tasks/\(taskId)/comments/\(commentId)")!)
        request.httpMethod = "DELETE"
        headers.forEach { request.setValue($1, forHTTPHeaderField: $0) }
        let (data, urlResponse) = try await session.data(for: request)
        let statusCode = (urlResponse as! HTTPURLResponse).statusCode
        switch statusCode {
        case 204:
            return
        default:
            throw URLError(.badServerResponse)
        }
    }
}

public struct PachcaClient {
    public let tasks: TasksService

    public init(token: String, baseURL: String = "https://api.example.com/v1") {
        let headers = ["Authorization": "Bearer \(token)"]
        self.tasks = TasksService(baseURL: baseURL, headers: headers)
    }
}
