import Foundation
#if canImport(FoundationNetworking)
import FoundationNetworking
#endif

private func pachcaNotImplemented(_ method: String) -> Error {
    NSError(domain: "PachcaClient", code: 1, userInfo: [NSLocalizedDescriptionKey: method + " is not implemented"])
}

open class SecurityService {
    public init() {}

    open func getAuditEvents(startTime: String? = nil, endTime: String? = nil, eventKey: AuditEventKey? = nil, actorId: String? = nil, actorType: String? = nil, entityId: String? = nil, entityType: String? = nil, limit: Int? = nil, cursor: String? = nil) async throws -> GetAuditEventsResponse {
        throw pachcaNotImplemented("Security.getAuditEvents")
    }

    open func getAuditEventsAll(startTime: String? = nil, endTime: String? = nil, eventKey: AuditEventKey? = nil, actorId: String? = nil, actorType: String? = nil, entityId: String? = nil, entityType: String? = nil, limit: Int? = nil) async throws -> [AuditEvent] {
        throw pachcaNotImplemented("Security.getAuditEventsAll")
    }
}

public final class SecurityServiceImpl: SecurityService {
    let baseURL: String
    let headers: [String: String]
    let session: URLSession

    init(baseURL: String, headers: [String: String], session: URLSession = .shared) {
        self.baseURL = baseURL
        self.headers = headers
        self.session = session
        super.init()
    }

    public override func getAuditEvents(startTime: String? = nil, endTime: String? = nil, eventKey: AuditEventKey? = nil, actorId: String? = nil, actorType: String? = nil, entityId: String? = nil, entityType: String? = nil, limit: Int? = nil, cursor: String? = nil) async throws -> GetAuditEventsResponse {
        var components = URLComponents(string: "\(baseURL)/audit_events")!
        var queryItems: [URLQueryItem] = []
        if let startTime { queryItems.append(URLQueryItem(name: "start_time", value: String(startTime))) }
        if let endTime { queryItems.append(URLQueryItem(name: "end_time", value: String(endTime))) }
        if let eventKey { queryItems.append(URLQueryItem(name: "event_key", value: eventKey.rawValue)) }
        if let actorId { queryItems.append(URLQueryItem(name: "actor_id", value: String(actorId))) }
        if let actorType { queryItems.append(URLQueryItem(name: "actor_type", value: String(actorType))) }
        if let entityId { queryItems.append(URLQueryItem(name: "entity_id", value: String(entityId))) }
        if let entityType { queryItems.append(URLQueryItem(name: "entity_type", value: String(entityType))) }
        if let limit { queryItems.append(URLQueryItem(name: "limit", value: String(limit))) }
        if let cursor { queryItems.append(URLQueryItem(name: "cursor", value: String(cursor))) }
        if !queryItems.isEmpty { components.queryItems = queryItems }
        var request = URLRequest(url: components.url!)
        headers.forEach { request.setValue($1, forHTTPHeaderField: $0) }
        let (data, urlResponse) = try await dataWithRetry(session: session, for: request)
        let statusCode = (urlResponse as! HTTPURLResponse).statusCode
        switch statusCode {
        case 200:
            return try deserialize(GetAuditEventsResponse.self, from: data)
        case 401:
            throw try deserialize(OAuthError.self, from: data)
        default:
            throw try deserialize(ApiError.self, from: data)
        }
    }

    public override func getAuditEventsAll(startTime: String? = nil, endTime: String? = nil, eventKey: AuditEventKey? = nil, actorId: String? = nil, actorType: String? = nil, entityId: String? = nil, entityType: String? = nil, limit: Int? = nil) async throws -> [AuditEvent] {
        var items: [AuditEvent] = []
        var cursor: String? = nil
        repeat {
            let response = try await getAuditEvents(startTime: startTime, endTime: endTime, eventKey: eventKey, actorId: actorId, actorType: actorType, entityId: entityId, entityType: entityType, limit: limit, cursor: cursor)
            items.append(contentsOf: response.data)
            if response.data.isEmpty { break }
            cursor = response.meta.paginate.nextPage
        } while true
        return items
    }
}

open class BotsService {
    public init() {}

    open func getWebhookEvents(limit: Int? = nil, cursor: String? = nil) async throws -> GetWebhookEventsResponse {
        throw pachcaNotImplemented("Bots.getWebhookEvents")
    }

    open func getWebhookEventsAll(limit: Int? = nil) async throws -> [WebhookEvent] {
        throw pachcaNotImplemented("Bots.getWebhookEventsAll")
    }

    open func updateBot(id: Int, request body: BotUpdateRequest) async throws -> BotResponse {
        throw pachcaNotImplemented("Bots.updateBot")
    }

    open func deleteWebhookEvent(id: String) async throws -> Void {
        throw pachcaNotImplemented("Bots.deleteWebhookEvent")
    }
}

public final class BotsServiceImpl: BotsService {
    let baseURL: String
    let headers: [String: String]
    let session: URLSession

    init(baseURL: String, headers: [String: String], session: URLSession = .shared) {
        self.baseURL = baseURL
        self.headers = headers
        self.session = session
        super.init()
    }

    public override func getWebhookEvents(limit: Int? = nil, cursor: String? = nil) async throws -> GetWebhookEventsResponse {
        var components = URLComponents(string: "\(baseURL)/webhooks/events")!
        var queryItems: [URLQueryItem] = []
        if let limit { queryItems.append(URLQueryItem(name: "limit", value: String(limit))) }
        if let cursor { queryItems.append(URLQueryItem(name: "cursor", value: String(cursor))) }
        if !queryItems.isEmpty { components.queryItems = queryItems }
        var request = URLRequest(url: components.url!)
        headers.forEach { request.setValue($1, forHTTPHeaderField: $0) }
        let (data, urlResponse) = try await dataWithRetry(session: session, for: request)
        let statusCode = (urlResponse as! HTTPURLResponse).statusCode
        switch statusCode {
        case 200:
            return try deserialize(GetWebhookEventsResponse.self, from: data)
        case 401:
            throw try deserialize(OAuthError.self, from: data)
        default:
            throw try deserialize(ApiError.self, from: data)
        }
    }

    public override func getWebhookEventsAll(limit: Int? = nil) async throws -> [WebhookEvent] {
        var items: [WebhookEvent] = []
        var cursor: String? = nil
        repeat {
            let response = try await getWebhookEvents(limit: limit, cursor: cursor)
            items.append(contentsOf: response.data)
            if response.data.isEmpty { break }
            cursor = response.meta.paginate.nextPage
        } while true
        return items
    }

    public override func updateBot(id: Int, request body: BotUpdateRequest) async throws -> BotResponse {
        var request = URLRequest(url: URL(string: "\(baseURL)/bots/\(id)")!)
        request.httpMethod = "PUT"
        headers.forEach { request.setValue($1, forHTTPHeaderField: $0) }
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try serialize(body)
        let (data, urlResponse) = try await dataWithRetry(session: session, for: request)
        let statusCode = (urlResponse as! HTTPURLResponse).statusCode
        switch statusCode {
        case 200:
            return try deserialize(BotResponseDataWrapper.self, from: data).data
        case 401:
            throw try deserialize(OAuthError.self, from: data)
        default:
            throw try deserialize(ApiError.self, from: data)
        }
    }

    public override func deleteWebhookEvent(id: String) async throws -> Void {
        var request = URLRequest(url: URL(string: "\(baseURL)/webhooks/events/\(id)")!)
        request.httpMethod = "DELETE"
        headers.forEach { request.setValue($1, forHTTPHeaderField: $0) }
        let (data, urlResponse) = try await dataWithRetry(session: session, for: request)
        let statusCode = (urlResponse as! HTTPURLResponse).statusCode
        switch statusCode {
        case 204:
            return
        case 401:
            throw try deserialize(OAuthError.self, from: data)
        default:
            throw try deserialize(ApiError.self, from: data)
        }
    }
}

open class ChatsService {
    public init() {}

    open func listChats(sort: ChatSortField? = nil, order: SortOrder? = nil, availability: ChatAvailability? = nil, lastMessageAtAfter: String? = nil, lastMessageAtBefore: String? = nil, personal: Bool? = nil, limit: Int? = nil, cursor: String? = nil) async throws -> ListChatsResponse {
        throw pachcaNotImplemented("Chats.listChats")
    }

    open func listChatsAll(sort: ChatSortField? = nil, order: SortOrder? = nil, availability: ChatAvailability? = nil, lastMessageAtAfter: String? = nil, lastMessageAtBefore: String? = nil, personal: Bool? = nil, limit: Int? = nil) async throws -> [Chat] {
        throw pachcaNotImplemented("Chats.listChatsAll")
    }

    open func getChat(id: Int) async throws -> Chat {
        throw pachcaNotImplemented("Chats.getChat")
    }

    open func createChat(request body: ChatCreateRequest) async throws -> Chat {
        throw pachcaNotImplemented("Chats.createChat")
    }

    open func updateChat(id: Int, request body: ChatUpdateRequest) async throws -> Chat {
        throw pachcaNotImplemented("Chats.updateChat")
    }

    open func archiveChat(id: Int) async throws -> Void {
        throw pachcaNotImplemented("Chats.archiveChat")
    }

    open func unarchiveChat(id: Int) async throws -> Void {
        throw pachcaNotImplemented("Chats.unarchiveChat")
    }
}

public final class ChatsServiceImpl: ChatsService {
    let baseURL: String
    let headers: [String: String]
    let session: URLSession

    init(baseURL: String, headers: [String: String], session: URLSession = .shared) {
        self.baseURL = baseURL
        self.headers = headers
        self.session = session
        super.init()
    }

    public override func listChats(sort: ChatSortField? = nil, order: SortOrder? = nil, availability: ChatAvailability? = nil, lastMessageAtAfter: String? = nil, lastMessageAtBefore: String? = nil, personal: Bool? = nil, limit: Int? = nil, cursor: String? = nil) async throws -> ListChatsResponse {
        var components = URLComponents(string: "\(baseURL)/chats")!
        var queryItems: [URLQueryItem] = []
        if let sort { queryItems.append(URLQueryItem(name: "sort", value: sort.rawValue)) }
        if let order { queryItems.append(URLQueryItem(name: "order", value: order.rawValue)) }
        if let availability { queryItems.append(URLQueryItem(name: "availability", value: availability.rawValue)) }
        if let lastMessageAtAfter { queryItems.append(URLQueryItem(name: "last_message_at_after", value: String(lastMessageAtAfter))) }
        if let lastMessageAtBefore { queryItems.append(URLQueryItem(name: "last_message_at_before", value: String(lastMessageAtBefore))) }
        if let personal { queryItems.append(URLQueryItem(name: "personal", value: String(personal))) }
        if let limit { queryItems.append(URLQueryItem(name: "limit", value: String(limit))) }
        if let cursor { queryItems.append(URLQueryItem(name: "cursor", value: String(cursor))) }
        if !queryItems.isEmpty { components.queryItems = queryItems }
        var request = URLRequest(url: components.url!)
        headers.forEach { request.setValue($1, forHTTPHeaderField: $0) }
        let (data, urlResponse) = try await dataWithRetry(session: session, for: request)
        let statusCode = (urlResponse as! HTTPURLResponse).statusCode
        switch statusCode {
        case 200:
            return try deserialize(ListChatsResponse.self, from: data)
        case 401:
            throw try deserialize(OAuthError.self, from: data)
        default:
            throw try deserialize(ApiError.self, from: data)
        }
    }

    public override func listChatsAll(sort: ChatSortField? = nil, order: SortOrder? = nil, availability: ChatAvailability? = nil, lastMessageAtAfter: String? = nil, lastMessageAtBefore: String? = nil, personal: Bool? = nil, limit: Int? = nil) async throws -> [Chat] {
        var items: [Chat] = []
        var cursor: String? = nil
        repeat {
            let response = try await listChats(sort: sort, order: order, availability: availability, lastMessageAtAfter: lastMessageAtAfter, lastMessageAtBefore: lastMessageAtBefore, personal: personal, limit: limit, cursor: cursor)
            items.append(contentsOf: response.data)
            if response.data.isEmpty { break }
            cursor = response.meta.paginate.nextPage
        } while true
        return items
    }

    public override func getChat(id: Int) async throws -> Chat {
        var request = URLRequest(url: URL(string: "\(baseURL)/chats/\(id)")!)
        headers.forEach { request.setValue($1, forHTTPHeaderField: $0) }
        let (data, urlResponse) = try await dataWithRetry(session: session, for: request)
        let statusCode = (urlResponse as! HTTPURLResponse).statusCode
        switch statusCode {
        case 200:
            return try deserialize(ChatDataWrapper.self, from: data).data
        case 401:
            throw try deserialize(OAuthError.self, from: data)
        default:
            throw try deserialize(ApiError.self, from: data)
        }
    }

    public override func createChat(request body: ChatCreateRequest) async throws -> Chat {
        var request = URLRequest(url: URL(string: "\(baseURL)/chats")!)
        request.httpMethod = "POST"
        headers.forEach { request.setValue($1, forHTTPHeaderField: $0) }
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try serialize(body)
        let (data, urlResponse) = try await dataWithRetry(session: session, for: request)
        let statusCode = (urlResponse as! HTTPURLResponse).statusCode
        switch statusCode {
        case 201:
            return try deserialize(ChatDataWrapper.self, from: data).data
        case 401:
            throw try deserialize(OAuthError.self, from: data)
        default:
            throw try deserialize(ApiError.self, from: data)
        }
    }

    public override func updateChat(id: Int, request body: ChatUpdateRequest) async throws -> Chat {
        var request = URLRequest(url: URL(string: "\(baseURL)/chats/\(id)")!)
        request.httpMethod = "PUT"
        headers.forEach { request.setValue($1, forHTTPHeaderField: $0) }
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try serialize(body)
        let (data, urlResponse) = try await dataWithRetry(session: session, for: request)
        let statusCode = (urlResponse as! HTTPURLResponse).statusCode
        switch statusCode {
        case 200:
            return try deserialize(ChatDataWrapper.self, from: data).data
        case 401:
            throw try deserialize(OAuthError.self, from: data)
        default:
            throw try deserialize(ApiError.self, from: data)
        }
    }

    public override func archiveChat(id: Int) async throws -> Void {
        var request = URLRequest(url: URL(string: "\(baseURL)/chats/\(id)/archive")!)
        request.httpMethod = "PUT"
        headers.forEach { request.setValue($1, forHTTPHeaderField: $0) }
        let (data, urlResponse) = try await dataWithRetry(session: session, for: request)
        let statusCode = (urlResponse as! HTTPURLResponse).statusCode
        switch statusCode {
        case 204:
            return
        case 401:
            throw try deserialize(OAuthError.self, from: data)
        default:
            throw try deserialize(ApiError.self, from: data)
        }
    }

    public override func unarchiveChat(id: Int) async throws -> Void {
        var request = URLRequest(url: URL(string: "\(baseURL)/chats/\(id)/unarchive")!)
        request.httpMethod = "PUT"
        headers.forEach { request.setValue($1, forHTTPHeaderField: $0) }
        let (data, urlResponse) = try await dataWithRetry(session: session, for: request)
        let statusCode = (urlResponse as! HTTPURLResponse).statusCode
        switch statusCode {
        case 204:
            return
        case 401:
            throw try deserialize(OAuthError.self, from: data)
        default:
            throw try deserialize(ApiError.self, from: data)
        }
    }
}

open class CommonService {
    public init() {}

    open func downloadExport(id: Int) async throws -> String {
        throw pachcaNotImplemented("Common.downloadExport")
    }

    open func listProperties(entityType: SearchEntityType) async throws -> ListPropertiesResponse {
        throw pachcaNotImplemented("Common.listProperties")
    }

    open func requestExport(request body: ExportRequest) async throws -> Void {
        throw pachcaNotImplemented("Common.requestExport")
    }

    open func uploadFile(directUrl: String, request body: FileUploadRequest) async throws -> Void {
        throw pachcaNotImplemented("Common.uploadFile")
    }

    open func getUploadParams() async throws -> UploadParams {
        throw pachcaNotImplemented("Common.getUploadParams")
    }
}

public final class CommonServiceImpl: CommonService {
    let baseURL: String
    let headers: [String: String]
    let session: URLSession

    init(baseURL: String, headers: [String: String], session: URLSession = .shared) {
        self.baseURL = baseURL
        self.headers = headers
        self.session = session
        super.init()
    }

    public override func downloadExport(id: Int) async throws -> String {
        var request = URLRequest(url: URL(string: "\(baseURL)/chats/exports/\(id)")!)
        headers.forEach { request.setValue($1, forHTTPHeaderField: $0) }
        let delegate = RedirectPreventer()
        let (data, urlResponse) = try await dataWithRetry(session: session, for: request, delegate: delegate)
        let statusCode = (urlResponse as! HTTPURLResponse).statusCode
        switch statusCode {
        case 302:
            guard let location = (urlResponse as? HTTPURLResponse)?.value(forHTTPHeaderField: "Location") else {
                throw URLError(.badServerResponse)
            }
            return location
        case 401:
            throw try deserialize(OAuthError.self, from: data)
        default:
            throw try deserialize(ApiError.self, from: data)
        }
    }

    public override func listProperties(entityType: SearchEntityType) async throws -> ListPropertiesResponse {
        var components = URLComponents(string: "\(baseURL)/custom_properties")!
        var queryItems: [URLQueryItem] = []
        queryItems.append(URLQueryItem(name: "entity_type", value: entityType.rawValue))
        if !queryItems.isEmpty { components.queryItems = queryItems }
        var request = URLRequest(url: components.url!)
        headers.forEach { request.setValue($1, forHTTPHeaderField: $0) }
        let (data, urlResponse) = try await dataWithRetry(session: session, for: request)
        let statusCode = (urlResponse as! HTTPURLResponse).statusCode
        switch statusCode {
        case 200:
            return try deserialize(ListPropertiesResponse.self, from: data)
        case 401:
            throw try deserialize(OAuthError.self, from: data)
        default:
            throw try deserialize(ApiError.self, from: data)
        }
    }

    public override func requestExport(request body: ExportRequest) async throws -> Void {
        var request = URLRequest(url: URL(string: "\(baseURL)/chats/exports")!)
        request.httpMethod = "POST"
        headers.forEach { request.setValue($1, forHTTPHeaderField: $0) }
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try serialize(body)
        let (data, urlResponse) = try await dataWithRetry(session: session, for: request)
        let statusCode = (urlResponse as! HTTPURLResponse).statusCode
        switch statusCode {
        case 204:
            return
        case 401:
            throw try deserialize(OAuthError.self, from: data)
        default:
            throw try deserialize(ApiError.self, from: data)
        }
    }

    public override func uploadFile(directUrl: String, request body: FileUploadRequest) async throws -> Void {
        var request = URLRequest(url: URL(string: "\(directUrl)")!)
        request.httpMethod = "POST"
        let boundary = UUID().uuidString
        request.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")
        var data = Data()
        func appendField(_ name: String, _ value: String) {
            data.append("--\(boundary)\r\n".data(using: .utf8)!)
            data.append("Content-Disposition: form-data; name=\"\(name)\"\r\n\r\n".data(using: .utf8)!)
            data.append("\(value)\r\n".data(using: .utf8)!)
        }
        appendField("Content-Disposition", String(describing: body.ContentDisposition))
        appendField("acl", String(describing: body.acl))
        appendField("policy", String(describing: body.policy))
        appendField("x-amz-credential", String(describing: body.xAmzCredential))
        appendField("x-amz-algorithm", String(describing: body.xAmzAlgorithm))
        appendField("x-amz-date", String(describing: body.xAmzDate))
        appendField("x-amz-signature", String(describing: body.xAmzSignature))
        appendField("key", String(describing: body.key))
        data.append("--\(boundary)\r\n".data(using: .utf8)!)
        data.append("Content-Disposition: form-data; name=\"file\"; filename=\"upload\"\r\n".data(using: .utf8)!)
        data.append("Content-Type: application/octet-stream\r\n\r\n".data(using: .utf8)!)
        data.append(body.file)
        data.append("\r\n".data(using: .utf8)!)
        data.append("--\(boundary)--\r\n".data(using: .utf8)!)
        request.httpBody = data
        let (responseData, urlResponse) = try await dataWithRetry(session: session, for: request)
        let statusCode = (urlResponse as! HTTPURLResponse).statusCode
        switch statusCode {
        case 204:
            return
        default:
            throw try deserialize(ApiError.self, from: responseData)
        }
    }

    public override func getUploadParams() async throws -> UploadParams {
        var request = URLRequest(url: URL(string: "\(baseURL)/uploads")!)
        request.httpMethod = "POST"
        headers.forEach { request.setValue($1, forHTTPHeaderField: $0) }
        let (data, urlResponse) = try await dataWithRetry(session: session, for: request)
        let statusCode = (urlResponse as! HTTPURLResponse).statusCode
        switch statusCode {
        case 201:
            return try deserialize(UploadParams.self, from: data)
        case 401:
            throw try deserialize(OAuthError.self, from: data)
        default:
            throw try deserialize(ApiError.self, from: data)
        }
    }
}

open class MembersService {
    public init() {}

    open func listMembers(id: Int, role: ChatMemberRoleFilter? = nil, limit: Int? = nil, cursor: String? = nil) async throws -> ListMembersResponse {
        throw pachcaNotImplemented("Members.listMembers")
    }

    open func listMembersAll(id: Int, role: ChatMemberRoleFilter? = nil, limit: Int? = nil) async throws -> [User] {
        throw pachcaNotImplemented("Members.listMembersAll")
    }

    open func addTags(id: Int, groupTagIds: [Int]) async throws -> Void {
        throw pachcaNotImplemented("Members.addTags")
    }

    open func addMembers(id: Int, request body: AddMembersRequest) async throws -> Void {
        throw pachcaNotImplemented("Members.addMembers")
    }

    open func updateMemberRole(id: Int, userId: Int, role: ChatMemberRole) async throws -> Void {
        throw pachcaNotImplemented("Members.updateMemberRole")
    }

    open func removeTag(id: Int, tagId: Int) async throws -> Void {
        throw pachcaNotImplemented("Members.removeTag")
    }

    open func leaveChat(id: Int) async throws -> Void {
        throw pachcaNotImplemented("Members.leaveChat")
    }

    open func removeMember(id: Int, userId: Int) async throws -> Void {
        throw pachcaNotImplemented("Members.removeMember")
    }
}

public final class MembersServiceImpl: MembersService {
    let baseURL: String
    let headers: [String: String]
    let session: URLSession

    init(baseURL: String, headers: [String: String], session: URLSession = .shared) {
        self.baseURL = baseURL
        self.headers = headers
        self.session = session
        super.init()
    }

    public override func listMembers(id: Int, role: ChatMemberRoleFilter? = nil, limit: Int? = nil, cursor: String? = nil) async throws -> ListMembersResponse {
        var components = URLComponents(string: "\(baseURL)/chats/\(id)/members")!
        var queryItems: [URLQueryItem] = []
        if let role { queryItems.append(URLQueryItem(name: "role", value: role.rawValue)) }
        if let limit { queryItems.append(URLQueryItem(name: "limit", value: String(limit))) }
        if let cursor { queryItems.append(URLQueryItem(name: "cursor", value: String(cursor))) }
        if !queryItems.isEmpty { components.queryItems = queryItems }
        var request = URLRequest(url: components.url!)
        headers.forEach { request.setValue($1, forHTTPHeaderField: $0) }
        let (data, urlResponse) = try await dataWithRetry(session: session, for: request)
        let statusCode = (urlResponse as! HTTPURLResponse).statusCode
        switch statusCode {
        case 200:
            return try deserialize(ListMembersResponse.self, from: data)
        case 401:
            throw try deserialize(OAuthError.self, from: data)
        default:
            throw try deserialize(ApiError.self, from: data)
        }
    }

    public override func listMembersAll(id: Int, role: ChatMemberRoleFilter? = nil, limit: Int? = nil) async throws -> [User] {
        var items: [User] = []
        var cursor: String? = nil
        repeat {
            let response = try await listMembers(id: id, role: role, limit: limit, cursor: cursor)
            items.append(contentsOf: response.data)
            if response.data.isEmpty { break }
            cursor = response.meta.paginate.nextPage
        } while true
        return items
    }

    public override func addTags(id: Int, groupTagIds: [Int]) async throws -> Void {
        var request = URLRequest(url: URL(string: "\(baseURL)/chats/\(id)/group_tags")!)
        request.httpMethod = "POST"
        headers.forEach { request.setValue($1, forHTTPHeaderField: $0) }
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONSerialization.data(withJSONObject: ["group_tag_ids": groupTagIds])
        let (data, urlResponse) = try await dataWithRetry(session: session, for: request)
        let statusCode = (urlResponse as! HTTPURLResponse).statusCode
        switch statusCode {
        case 204:
            return
        case 401:
            throw try deserialize(OAuthError.self, from: data)
        default:
            throw try deserialize(ApiError.self, from: data)
        }
    }

    public override func addMembers(id: Int, request body: AddMembersRequest) async throws -> Void {
        var request = URLRequest(url: URL(string: "\(baseURL)/chats/\(id)/members")!)
        request.httpMethod = "POST"
        headers.forEach { request.setValue($1, forHTTPHeaderField: $0) }
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try serialize(body)
        let (data, urlResponse) = try await dataWithRetry(session: session, for: request)
        let statusCode = (urlResponse as! HTTPURLResponse).statusCode
        switch statusCode {
        case 204:
            return
        case 401:
            throw try deserialize(OAuthError.self, from: data)
        default:
            throw try deserialize(ApiError.self, from: data)
        }
    }

    public override func updateMemberRole(id: Int, userId: Int, role: ChatMemberRole) async throws -> Void {
        var request = URLRequest(url: URL(string: "\(baseURL)/chats/\(id)/members/\(userId)")!)
        request.httpMethod = "PUT"
        headers.forEach { request.setValue($1, forHTTPHeaderField: $0) }
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONSerialization.data(withJSONObject: ["role": role.rawValue])
        let (data, urlResponse) = try await dataWithRetry(session: session, for: request)
        let statusCode = (urlResponse as! HTTPURLResponse).statusCode
        switch statusCode {
        case 204:
            return
        case 401:
            throw try deserialize(OAuthError.self, from: data)
        default:
            throw try deserialize(ApiError.self, from: data)
        }
    }

    public override func removeTag(id: Int, tagId: Int) async throws -> Void {
        var request = URLRequest(url: URL(string: "\(baseURL)/chats/\(id)/group_tags/\(tagId)")!)
        request.httpMethod = "DELETE"
        headers.forEach { request.setValue($1, forHTTPHeaderField: $0) }
        let (data, urlResponse) = try await dataWithRetry(session: session, for: request)
        let statusCode = (urlResponse as! HTTPURLResponse).statusCode
        switch statusCode {
        case 204:
            return
        case 401:
            throw try deserialize(OAuthError.self, from: data)
        default:
            throw try deserialize(ApiError.self, from: data)
        }
    }

    public override func leaveChat(id: Int) async throws -> Void {
        var request = URLRequest(url: URL(string: "\(baseURL)/chats/\(id)/leave")!)
        request.httpMethod = "DELETE"
        headers.forEach { request.setValue($1, forHTTPHeaderField: $0) }
        let (data, urlResponse) = try await dataWithRetry(session: session, for: request)
        let statusCode = (urlResponse as! HTTPURLResponse).statusCode
        switch statusCode {
        case 204:
            return
        case 401:
            throw try deserialize(OAuthError.self, from: data)
        default:
            throw try deserialize(ApiError.self, from: data)
        }
    }

    public override func removeMember(id: Int, userId: Int) async throws -> Void {
        var request = URLRequest(url: URL(string: "\(baseURL)/chats/\(id)/members/\(userId)")!)
        request.httpMethod = "DELETE"
        headers.forEach { request.setValue($1, forHTTPHeaderField: $0) }
        let (data, urlResponse) = try await dataWithRetry(session: session, for: request)
        let statusCode = (urlResponse as! HTTPURLResponse).statusCode
        switch statusCode {
        case 204:
            return
        case 401:
            throw try deserialize(OAuthError.self, from: data)
        default:
            throw try deserialize(ApiError.self, from: data)
        }
    }
}

open class GroupTagsService {
    public init() {}

    open func listTags(names: [String]? = nil, limit: Int? = nil, cursor: String? = nil) async throws -> ListTagsResponse {
        throw pachcaNotImplemented("Group tags.listTags")
    }

    open func listTagsAll(names: [String]? = nil, limit: Int? = nil) async throws -> [GroupTag] {
        throw pachcaNotImplemented("Group tags.listTagsAll")
    }

    open func getTag(id: Int) async throws -> GroupTag {
        throw pachcaNotImplemented("Group tags.getTag")
    }

    open func getTagUsers(id: Int, limit: Int? = nil, cursor: String? = nil) async throws -> GetTagUsersResponse {
        throw pachcaNotImplemented("Group tags.getTagUsers")
    }

    open func getTagUsersAll(id: Int, limit: Int? = nil) async throws -> [User] {
        throw pachcaNotImplemented("Group tags.getTagUsersAll")
    }

    open func createTag(request body: GroupTagRequest) async throws -> GroupTag {
        throw pachcaNotImplemented("Group tags.createTag")
    }

    open func updateTag(id: Int, request body: GroupTagRequest) async throws -> GroupTag {
        throw pachcaNotImplemented("Group tags.updateTag")
    }

    open func deleteTag(id: Int) async throws -> Void {
        throw pachcaNotImplemented("Group tags.deleteTag")
    }
}

public final class GroupTagsServiceImpl: GroupTagsService {
    let baseURL: String
    let headers: [String: String]
    let session: URLSession

    init(baseURL: String, headers: [String: String], session: URLSession = .shared) {
        self.baseURL = baseURL
        self.headers = headers
        self.session = session
        super.init()
    }

    public override func listTags(names: [String]? = nil, limit: Int? = nil, cursor: String? = nil) async throws -> ListTagsResponse {
        var components = URLComponents(string: "\(baseURL)/group_tags")!
        var queryItems: [URLQueryItem] = []
        if let names { names.forEach { queryItems.append(URLQueryItem(name: "names[]", value: String($0))) } }
        if let limit { queryItems.append(URLQueryItem(name: "limit", value: String(limit))) }
        if let cursor { queryItems.append(URLQueryItem(name: "cursor", value: String(cursor))) }
        if !queryItems.isEmpty { components.queryItems = queryItems }
        var request = URLRequest(url: components.url!)
        headers.forEach { request.setValue($1, forHTTPHeaderField: $0) }
        let (data, urlResponse) = try await dataWithRetry(session: session, for: request)
        let statusCode = (urlResponse as! HTTPURLResponse).statusCode
        switch statusCode {
        case 200:
            return try deserialize(ListTagsResponse.self, from: data)
        case 401:
            throw try deserialize(OAuthError.self, from: data)
        default:
            throw try deserialize(ApiError.self, from: data)
        }
    }

    public override func listTagsAll(names: [String]? = nil, limit: Int? = nil) async throws -> [GroupTag] {
        var items: [GroupTag] = []
        var cursor: String? = nil
        repeat {
            let response = try await listTags(names: names, limit: limit, cursor: cursor)
            items.append(contentsOf: response.data)
            if response.data.isEmpty { break }
            cursor = response.meta.paginate.nextPage
        } while true
        return items
    }

    public override func getTag(id: Int) async throws -> GroupTag {
        var request = URLRequest(url: URL(string: "\(baseURL)/group_tags/\(id)")!)
        headers.forEach { request.setValue($1, forHTTPHeaderField: $0) }
        let (data, urlResponse) = try await dataWithRetry(session: session, for: request)
        let statusCode = (urlResponse as! HTTPURLResponse).statusCode
        switch statusCode {
        case 200:
            return try deserialize(GroupTagDataWrapper.self, from: data).data
        case 401:
            throw try deserialize(OAuthError.self, from: data)
        default:
            throw try deserialize(ApiError.self, from: data)
        }
    }

    public override func getTagUsers(id: Int, limit: Int? = nil, cursor: String? = nil) async throws -> GetTagUsersResponse {
        var components = URLComponents(string: "\(baseURL)/group_tags/\(id)/users")!
        var queryItems: [URLQueryItem] = []
        if let limit { queryItems.append(URLQueryItem(name: "limit", value: String(limit))) }
        if let cursor { queryItems.append(URLQueryItem(name: "cursor", value: String(cursor))) }
        if !queryItems.isEmpty { components.queryItems = queryItems }
        var request = URLRequest(url: components.url!)
        headers.forEach { request.setValue($1, forHTTPHeaderField: $0) }
        let (data, urlResponse) = try await dataWithRetry(session: session, for: request)
        let statusCode = (urlResponse as! HTTPURLResponse).statusCode
        switch statusCode {
        case 200:
            return try deserialize(GetTagUsersResponse.self, from: data)
        case 401:
            throw try deserialize(OAuthError.self, from: data)
        default:
            throw try deserialize(ApiError.self, from: data)
        }
    }

    public override func getTagUsersAll(id: Int, limit: Int? = nil) async throws -> [User] {
        var items: [User] = []
        var cursor: String? = nil
        repeat {
            let response = try await getTagUsers(id: id, limit: limit, cursor: cursor)
            items.append(contentsOf: response.data)
            if response.data.isEmpty { break }
            cursor = response.meta.paginate.nextPage
        } while true
        return items
    }

    public override func createTag(request body: GroupTagRequest) async throws -> GroupTag {
        var request = URLRequest(url: URL(string: "\(baseURL)/group_tags")!)
        request.httpMethod = "POST"
        headers.forEach { request.setValue($1, forHTTPHeaderField: $0) }
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try serialize(body)
        let (data, urlResponse) = try await dataWithRetry(session: session, for: request)
        let statusCode = (urlResponse as! HTTPURLResponse).statusCode
        switch statusCode {
        case 201:
            return try deserialize(GroupTagDataWrapper.self, from: data).data
        case 401:
            throw try deserialize(OAuthError.self, from: data)
        default:
            throw try deserialize(ApiError.self, from: data)
        }
    }

    public override func updateTag(id: Int, request body: GroupTagRequest) async throws -> GroupTag {
        var request = URLRequest(url: URL(string: "\(baseURL)/group_tags/\(id)")!)
        request.httpMethod = "PUT"
        headers.forEach { request.setValue($1, forHTTPHeaderField: $0) }
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try serialize(body)
        let (data, urlResponse) = try await dataWithRetry(session: session, for: request)
        let statusCode = (urlResponse as! HTTPURLResponse).statusCode
        switch statusCode {
        case 200:
            return try deserialize(GroupTagDataWrapper.self, from: data).data
        case 401:
            throw try deserialize(OAuthError.self, from: data)
        default:
            throw try deserialize(ApiError.self, from: data)
        }
    }

    public override func deleteTag(id: Int) async throws -> Void {
        var request = URLRequest(url: URL(string: "\(baseURL)/group_tags/\(id)")!)
        request.httpMethod = "DELETE"
        headers.forEach { request.setValue($1, forHTTPHeaderField: $0) }
        let (data, urlResponse) = try await dataWithRetry(session: session, for: request)
        let statusCode = (urlResponse as! HTTPURLResponse).statusCode
        switch statusCode {
        case 204:
            return
        case 401:
            throw try deserialize(OAuthError.self, from: data)
        default:
            throw try deserialize(ApiError.self, from: data)
        }
    }
}

open class MessagesService {
    public init() {}

    open func listChatMessages(chatId: Int, sort: MessageSortField? = nil, order: SortOrder? = nil, limit: Int? = nil, cursor: String? = nil) async throws -> ListChatMessagesResponse {
        throw pachcaNotImplemented("Messages.listChatMessages")
    }

    open func listChatMessagesAll(chatId: Int, sort: MessageSortField? = nil, order: SortOrder? = nil, limit: Int? = nil) async throws -> [Message] {
        throw pachcaNotImplemented("Messages.listChatMessagesAll")
    }

    open func getMessage(id: Int) async throws -> Message {
        throw pachcaNotImplemented("Messages.getMessage")
    }

    open func createMessage(request body: MessageCreateRequest) async throws -> Message {
        throw pachcaNotImplemented("Messages.createMessage")
    }

    open func pinMessage(id: Int) async throws -> Void {
        throw pachcaNotImplemented("Messages.pinMessage")
    }

    open func updateMessage(id: Int, request body: MessageUpdateRequest) async throws -> Message {
        throw pachcaNotImplemented("Messages.updateMessage")
    }

    open func deleteMessage(id: Int) async throws -> Void {
        throw pachcaNotImplemented("Messages.deleteMessage")
    }

    open func unpinMessage(id: Int) async throws -> Void {
        throw pachcaNotImplemented("Messages.unpinMessage")
    }
}

public final class MessagesServiceImpl: MessagesService {
    let baseURL: String
    let headers: [String: String]
    let session: URLSession

    init(baseURL: String, headers: [String: String], session: URLSession = .shared) {
        self.baseURL = baseURL
        self.headers = headers
        self.session = session
        super.init()
    }

    public override func listChatMessages(chatId: Int, sort: MessageSortField? = nil, order: SortOrder? = nil, limit: Int? = nil, cursor: String? = nil) async throws -> ListChatMessagesResponse {
        var components = URLComponents(string: "\(baseURL)/messages")!
        var queryItems: [URLQueryItem] = []
        queryItems.append(URLQueryItem(name: "chat_id", value: String(chatId)))
        if let sort { queryItems.append(URLQueryItem(name: "sort", value: sort.rawValue)) }
        if let order { queryItems.append(URLQueryItem(name: "order", value: order.rawValue)) }
        if let limit { queryItems.append(URLQueryItem(name: "limit", value: String(limit))) }
        if let cursor { queryItems.append(URLQueryItem(name: "cursor", value: String(cursor))) }
        if !queryItems.isEmpty { components.queryItems = queryItems }
        var request = URLRequest(url: components.url!)
        headers.forEach { request.setValue($1, forHTTPHeaderField: $0) }
        let (data, urlResponse) = try await dataWithRetry(session: session, for: request)
        let statusCode = (urlResponse as! HTTPURLResponse).statusCode
        switch statusCode {
        case 200:
            return try deserialize(ListChatMessagesResponse.self, from: data)
        case 401:
            throw try deserialize(OAuthError.self, from: data)
        default:
            throw try deserialize(ApiError.self, from: data)
        }
    }

    public override func listChatMessagesAll(chatId: Int, sort: MessageSortField? = nil, order: SortOrder? = nil, limit: Int? = nil) async throws -> [Message] {
        var items: [Message] = []
        var cursor: String? = nil
        repeat {
            let response = try await listChatMessages(chatId: chatId, sort: sort, order: order, limit: limit, cursor: cursor)
            items.append(contentsOf: response.data)
            if response.data.isEmpty { break }
            cursor = response.meta.paginate.nextPage
        } while true
        return items
    }

    public override func getMessage(id: Int) async throws -> Message {
        var request = URLRequest(url: URL(string: "\(baseURL)/messages/\(id)")!)
        headers.forEach { request.setValue($1, forHTTPHeaderField: $0) }
        let (data, urlResponse) = try await dataWithRetry(session: session, for: request)
        let statusCode = (urlResponse as! HTTPURLResponse).statusCode
        switch statusCode {
        case 200:
            return try deserialize(MessageDataWrapper.self, from: data).data
        case 401:
            throw try deserialize(OAuthError.self, from: data)
        default:
            throw try deserialize(ApiError.self, from: data)
        }
    }

    public override func createMessage(request body: MessageCreateRequest) async throws -> Message {
        var request = URLRequest(url: URL(string: "\(baseURL)/messages")!)
        request.httpMethod = "POST"
        headers.forEach { request.setValue($1, forHTTPHeaderField: $0) }
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try serialize(body)
        let (data, urlResponse) = try await dataWithRetry(session: session, for: request)
        let statusCode = (urlResponse as! HTTPURLResponse).statusCode
        switch statusCode {
        case 201:
            return try deserialize(MessageDataWrapper.self, from: data).data
        case 401:
            throw try deserialize(OAuthError.self, from: data)
        default:
            throw try deserialize(ApiError.self, from: data)
        }
    }

    public override func pinMessage(id: Int) async throws -> Void {
        var request = URLRequest(url: URL(string: "\(baseURL)/messages/\(id)/pin")!)
        request.httpMethod = "POST"
        headers.forEach { request.setValue($1, forHTTPHeaderField: $0) }
        let (data, urlResponse) = try await dataWithRetry(session: session, for: request)
        let statusCode = (urlResponse as! HTTPURLResponse).statusCode
        switch statusCode {
        case 204:
            return
        case 401:
            throw try deserialize(OAuthError.self, from: data)
        default:
            throw try deserialize(ApiError.self, from: data)
        }
    }

    public override func updateMessage(id: Int, request body: MessageUpdateRequest) async throws -> Message {
        var request = URLRequest(url: URL(string: "\(baseURL)/messages/\(id)")!)
        request.httpMethod = "PUT"
        headers.forEach { request.setValue($1, forHTTPHeaderField: $0) }
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try serialize(body)
        let (data, urlResponse) = try await dataWithRetry(session: session, for: request)
        let statusCode = (urlResponse as! HTTPURLResponse).statusCode
        switch statusCode {
        case 200:
            return try deserialize(MessageDataWrapper.self, from: data).data
        case 401:
            throw try deserialize(OAuthError.self, from: data)
        default:
            throw try deserialize(ApiError.self, from: data)
        }
    }

    public override func deleteMessage(id: Int) async throws -> Void {
        var request = URLRequest(url: URL(string: "\(baseURL)/messages/\(id)")!)
        request.httpMethod = "DELETE"
        headers.forEach { request.setValue($1, forHTTPHeaderField: $0) }
        let (data, urlResponse) = try await dataWithRetry(session: session, for: request)
        let statusCode = (urlResponse as! HTTPURLResponse).statusCode
        switch statusCode {
        case 204:
            return
        case 401:
            throw try deserialize(OAuthError.self, from: data)
        default:
            throw try deserialize(ApiError.self, from: data)
        }
    }

    public override func unpinMessage(id: Int) async throws -> Void {
        var request = URLRequest(url: URL(string: "\(baseURL)/messages/\(id)/pin")!)
        request.httpMethod = "DELETE"
        headers.forEach { request.setValue($1, forHTTPHeaderField: $0) }
        let (data, urlResponse) = try await dataWithRetry(session: session, for: request)
        let statusCode = (urlResponse as! HTTPURLResponse).statusCode
        switch statusCode {
        case 204:
            return
        case 401:
            throw try deserialize(OAuthError.self, from: data)
        default:
            throw try deserialize(ApiError.self, from: data)
        }
    }
}

open class LinkPreviewsService {
    public init() {}

    open func createLinkPreviews(id: Int, request body: LinkPreviewsRequest) async throws -> Void {
        throw pachcaNotImplemented("Link Previews.createLinkPreviews")
    }
}

public final class LinkPreviewsServiceImpl: LinkPreviewsService {
    let baseURL: String
    let headers: [String: String]
    let session: URLSession

    init(baseURL: String, headers: [String: String], session: URLSession = .shared) {
        self.baseURL = baseURL
        self.headers = headers
        self.session = session
        super.init()
    }

    public override func createLinkPreviews(id: Int, request body: LinkPreviewsRequest) async throws -> Void {
        var request = URLRequest(url: URL(string: "\(baseURL)/messages/\(id)/link_previews")!)
        request.httpMethod = "POST"
        headers.forEach { request.setValue($1, forHTTPHeaderField: $0) }
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try serialize(body)
        let (data, urlResponse) = try await dataWithRetry(session: session, for: request)
        let statusCode = (urlResponse as! HTTPURLResponse).statusCode
        switch statusCode {
        case 204:
            return
        case 401:
            throw try deserialize(OAuthError.self, from: data)
        default:
            throw try deserialize(ApiError.self, from: data)
        }
    }
}

open class ReactionsService {
    public init() {}

    open func listReactions(id: Int, limit: Int? = nil, cursor: String? = nil) async throws -> ListReactionsResponse {
        throw pachcaNotImplemented("Reactions.listReactions")
    }

    open func listReactionsAll(id: Int, limit: Int? = nil) async throws -> [Reaction] {
        throw pachcaNotImplemented("Reactions.listReactionsAll")
    }

    open func addReaction(id: Int, request body: ReactionRequest) async throws -> Reaction {
        throw pachcaNotImplemented("Reactions.addReaction")
    }

    open func removeReaction(id: Int, code: String, name: String? = nil) async throws -> Void {
        throw pachcaNotImplemented("Reactions.removeReaction")
    }
}

public final class ReactionsServiceImpl: ReactionsService {
    let baseURL: String
    let headers: [String: String]
    let session: URLSession

    init(baseURL: String, headers: [String: String], session: URLSession = .shared) {
        self.baseURL = baseURL
        self.headers = headers
        self.session = session
        super.init()
    }

    public override func listReactions(id: Int, limit: Int? = nil, cursor: String? = nil) async throws -> ListReactionsResponse {
        var components = URLComponents(string: "\(baseURL)/messages/\(id)/reactions")!
        var queryItems: [URLQueryItem] = []
        if let limit { queryItems.append(URLQueryItem(name: "limit", value: String(limit))) }
        if let cursor { queryItems.append(URLQueryItem(name: "cursor", value: String(cursor))) }
        if !queryItems.isEmpty { components.queryItems = queryItems }
        var request = URLRequest(url: components.url!)
        headers.forEach { request.setValue($1, forHTTPHeaderField: $0) }
        let (data, urlResponse) = try await dataWithRetry(session: session, for: request)
        let statusCode = (urlResponse as! HTTPURLResponse).statusCode
        switch statusCode {
        case 200:
            return try deserialize(ListReactionsResponse.self, from: data)
        case 401:
            throw try deserialize(OAuthError.self, from: data)
        default:
            throw try deserialize(ApiError.self, from: data)
        }
    }

    public override func listReactionsAll(id: Int, limit: Int? = nil) async throws -> [Reaction] {
        var items: [Reaction] = []
        var cursor: String? = nil
        repeat {
            let response = try await listReactions(id: id, limit: limit, cursor: cursor)
            items.append(contentsOf: response.data)
            if response.data.isEmpty { break }
            cursor = response.meta.paginate.nextPage
        } while true
        return items
    }

    public override func addReaction(id: Int, request body: ReactionRequest) async throws -> Reaction {
        var request = URLRequest(url: URL(string: "\(baseURL)/messages/\(id)/reactions")!)
        request.httpMethod = "POST"
        headers.forEach { request.setValue($1, forHTTPHeaderField: $0) }
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try serialize(body)
        let (data, urlResponse) = try await dataWithRetry(session: session, for: request)
        let statusCode = (urlResponse as! HTTPURLResponse).statusCode
        switch statusCode {
        case 201:
            return try deserialize(Reaction.self, from: data)
        case 401:
            throw try deserialize(OAuthError.self, from: data)
        default:
            throw try deserialize(ApiError.self, from: data)
        }
    }

    public override func removeReaction(id: Int, code: String, name: String? = nil) async throws -> Void {
        var components = URLComponents(string: "\(baseURL)/messages/\(id)/reactions")!
        var queryItems: [URLQueryItem] = []
        queryItems.append(URLQueryItem(name: "code", value: String(code)))
        if let name { queryItems.append(URLQueryItem(name: "name", value: String(name))) }
        if !queryItems.isEmpty { components.queryItems = queryItems }
        var request = URLRequest(url: components.url!)
        request.httpMethod = "DELETE"
        headers.forEach { request.setValue($1, forHTTPHeaderField: $0) }
        let (data, urlResponse) = try await dataWithRetry(session: session, for: request)
        let statusCode = (urlResponse as! HTTPURLResponse).statusCode
        switch statusCode {
        case 204:
            return
        case 401:
            throw try deserialize(OAuthError.self, from: data)
        default:
            throw try deserialize(ApiError.self, from: data)
        }
    }
}

open class ReadMembersService {
    public init() {}

    open func listReadMembers(id: Int, limit: Int? = nil, cursor: String? = nil) async throws -> String {
        throw pachcaNotImplemented("Read members.listReadMembers")
    }
}

public final class ReadMembersServiceImpl: ReadMembersService {
    let baseURL: String
    let headers: [String: String]
    let session: URLSession

    init(baseURL: String, headers: [String: String], session: URLSession = .shared) {
        self.baseURL = baseURL
        self.headers = headers
        self.session = session
        super.init()
    }

    public override func listReadMembers(id: Int, limit: Int? = nil, cursor: String? = nil) async throws -> String {
        var components = URLComponents(string: "\(baseURL)/messages/\(id)/read_member_ids")!
        var queryItems: [URLQueryItem] = []
        if let limit { queryItems.append(URLQueryItem(name: "limit", value: String(limit))) }
        if let cursor { queryItems.append(URLQueryItem(name: "cursor", value: String(cursor))) }
        if !queryItems.isEmpty { components.queryItems = queryItems }
        var request = URLRequest(url: components.url!)
        headers.forEach { request.setValue($1, forHTTPHeaderField: $0) }
        let (data, urlResponse) = try await dataWithRetry(session: session, for: request)
        let statusCode = (urlResponse as! HTTPURLResponse).statusCode
        switch statusCode {
        case 200:
            return try deserialize(String.self, from: data)
        case 401:
            throw try deserialize(OAuthError.self, from: data)
        default:
            throw try deserialize(ApiError.self, from: data)
        }
    }
}

open class ThreadsService {
    public init() {}

    open func getThread(id: Int) async throws -> Thread {
        throw pachcaNotImplemented("Threads.getThread")
    }

    open func createThread(id: Int) async throws -> Thread {
        throw pachcaNotImplemented("Threads.createThread")
    }
}

public final class ThreadsServiceImpl: ThreadsService {
    let baseURL: String
    let headers: [String: String]
    let session: URLSession

    init(baseURL: String, headers: [String: String], session: URLSession = .shared) {
        self.baseURL = baseURL
        self.headers = headers
        self.session = session
        super.init()
    }

    public override func getThread(id: Int) async throws -> Thread {
        var request = URLRequest(url: URL(string: "\(baseURL)/threads/\(id)")!)
        headers.forEach { request.setValue($1, forHTTPHeaderField: $0) }
        let (data, urlResponse) = try await dataWithRetry(session: session, for: request)
        let statusCode = (urlResponse as! HTTPURLResponse).statusCode
        switch statusCode {
        case 200:
            return try deserialize(ThreadDataWrapper.self, from: data).data
        case 401:
            throw try deserialize(OAuthError.self, from: data)
        default:
            throw try deserialize(ApiError.self, from: data)
        }
    }

    public override func createThread(id: Int) async throws -> Thread {
        var request = URLRequest(url: URL(string: "\(baseURL)/messages/\(id)/thread")!)
        request.httpMethod = "POST"
        headers.forEach { request.setValue($1, forHTTPHeaderField: $0) }
        let (data, urlResponse) = try await dataWithRetry(session: session, for: request)
        let statusCode = (urlResponse as! HTTPURLResponse).statusCode
        switch statusCode {
        case 201:
            return try deserialize(ThreadDataWrapper.self, from: data).data
        case 401:
            throw try deserialize(OAuthError.self, from: data)
        default:
            throw try deserialize(ApiError.self, from: data)
        }
    }
}

open class ProfileService {
    public init() {}

    open func getTokenInfo() async throws -> AccessTokenInfo {
        throw pachcaNotImplemented("Profile.getTokenInfo")
    }

    open func getProfile() async throws -> User {
        throw pachcaNotImplemented("Profile.getProfile")
    }

    open func getStatus() async throws -> String {
        throw pachcaNotImplemented("Profile.getStatus")
    }

    open func updateProfileAvatar(image: Data) async throws -> AvatarData {
        throw pachcaNotImplemented("Profile.updateProfileAvatar")
    }

    open func updateStatus(request body: StatusUpdateRequest) async throws -> UserStatus {
        throw pachcaNotImplemented("Profile.updateStatus")
    }

    open func deleteProfileAvatar() async throws -> Void {
        throw pachcaNotImplemented("Profile.deleteProfileAvatar")
    }

    open func deleteStatus() async throws -> Void {
        throw pachcaNotImplemented("Profile.deleteStatus")
    }
}

public final class ProfileServiceImpl: ProfileService {
    let baseURL: String
    let headers: [String: String]
    let session: URLSession

    init(baseURL: String, headers: [String: String], session: URLSession = .shared) {
        self.baseURL = baseURL
        self.headers = headers
        self.session = session
        super.init()
    }

    public override func getTokenInfo() async throws -> AccessTokenInfo {
        var request = URLRequest(url: URL(string: "\(baseURL)/oauth/token/info")!)
        headers.forEach { request.setValue($1, forHTTPHeaderField: $0) }
        let (data, urlResponse) = try await dataWithRetry(session: session, for: request)
        let statusCode = (urlResponse as! HTTPURLResponse).statusCode
        switch statusCode {
        case 200:
            return try deserialize(AccessTokenInfoDataWrapper.self, from: data).data
        case 401:
            throw try deserialize(OAuthError.self, from: data)
        default:
            throw try deserialize(ApiError.self, from: data)
        }
    }

    public override func getProfile() async throws -> User {
        var request = URLRequest(url: URL(string: "\(baseURL)/profile")!)
        headers.forEach { request.setValue($1, forHTTPHeaderField: $0) }
        let (data, urlResponse) = try await dataWithRetry(session: session, for: request)
        let statusCode = (urlResponse as! HTTPURLResponse).statusCode
        switch statusCode {
        case 200:
            return try deserialize(UserDataWrapper.self, from: data).data
        case 401:
            throw try deserialize(OAuthError.self, from: data)
        default:
            throw try deserialize(ApiError.self, from: data)
        }
    }

    public override func getStatus() async throws -> String {
        var request = URLRequest(url: URL(string: "\(baseURL)/profile/status")!)
        headers.forEach { request.setValue($1, forHTTPHeaderField: $0) }
        let (data, urlResponse) = try await dataWithRetry(session: session, for: request)
        let statusCode = (urlResponse as! HTTPURLResponse).statusCode
        switch statusCode {
        case 200:
            return try deserialize(String.self, from: data)
        case 401:
            throw try deserialize(OAuthError.self, from: data)
        default:
            throw try deserialize(ApiError.self, from: data)
        }
    }

    public override func updateProfileAvatar(image: Data) async throws -> AvatarData {
        var request = URLRequest(url: URL(string: "\(baseURL)/profile/avatar")!)
        request.httpMethod = "PUT"
        headers.forEach { request.setValue($1, forHTTPHeaderField: $0) }
        let boundary = UUID().uuidString
        request.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")
        var data = Data()
        func appendField(_ name: String, _ value: String) {
            data.append("--\(boundary)\r\n".data(using: .utf8)!)
            data.append("Content-Disposition: form-data; name=\"\(name)\"\r\n\r\n".data(using: .utf8)!)
            data.append("\(value)\r\n".data(using: .utf8)!)
        }
        data.append("--\(boundary)\r\n".data(using: .utf8)!)
        data.append("Content-Disposition: form-data; name=\"image\"; filename=\"upload\"\r\n".data(using: .utf8)!)
        data.append("Content-Type: application/octet-stream\r\n\r\n".data(using: .utf8)!)
        data.append(image)
        data.append("\r\n".data(using: .utf8)!)
        data.append("--\(boundary)--\r\n".data(using: .utf8)!)
        request.httpBody = data
        let (responseData, urlResponse) = try await dataWithRetry(session: session, for: request)
        let statusCode = (urlResponse as! HTTPURLResponse).statusCode
        switch statusCode {
        case 200:
            return try deserialize(AvatarDataDataWrapper.self, from: responseData).data
        case 401:
            throw try deserialize(OAuthError.self, from: responseData)
        default:
            throw try deserialize(ApiError.self, from: responseData)
        }
    }

    public override func updateStatus(request body: StatusUpdateRequest) async throws -> UserStatus {
        var request = URLRequest(url: URL(string: "\(baseURL)/profile/status")!)
        request.httpMethod = "PUT"
        headers.forEach { request.setValue($1, forHTTPHeaderField: $0) }
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try serialize(body)
        let (data, urlResponse) = try await dataWithRetry(session: session, for: request)
        let statusCode = (urlResponse as! HTTPURLResponse).statusCode
        switch statusCode {
        case 200:
            return try deserialize(UserStatusDataWrapper.self, from: data).data
        case 401:
            throw try deserialize(OAuthError.self, from: data)
        default:
            throw try deserialize(ApiError.self, from: data)
        }
    }

    public override func deleteProfileAvatar() async throws -> Void {
        var request = URLRequest(url: URL(string: "\(baseURL)/profile/avatar")!)
        request.httpMethod = "DELETE"
        headers.forEach { request.setValue($1, forHTTPHeaderField: $0) }
        let (data, urlResponse) = try await dataWithRetry(session: session, for: request)
        let statusCode = (urlResponse as! HTTPURLResponse).statusCode
        switch statusCode {
        case 204:
            return
        case 401:
            throw try deserialize(OAuthError.self, from: data)
        default:
            throw try deserialize(ApiError.self, from: data)
        }
    }

    public override func deleteStatus() async throws -> Void {
        var request = URLRequest(url: URL(string: "\(baseURL)/profile/status")!)
        request.httpMethod = "DELETE"
        headers.forEach { request.setValue($1, forHTTPHeaderField: $0) }
        let (data, urlResponse) = try await dataWithRetry(session: session, for: request)
        let statusCode = (urlResponse as! HTTPURLResponse).statusCode
        switch statusCode {
        case 204:
            return
        case 401:
            throw try deserialize(OAuthError.self, from: data)
        default:
            throw try deserialize(ApiError.self, from: data)
        }
    }
}

open class SearchService {
    public init() {}

    open func searchChats(query: String? = nil, limit: Int? = nil, cursor: String? = nil, order: SortOrder? = nil, createdFrom: String? = nil, createdTo: String? = nil, active: Bool? = nil, chatSubtype: ChatSubtype? = nil, personal: Bool? = nil) async throws -> SearchChatsResponse {
        throw pachcaNotImplemented("Search.searchChats")
    }

    open func searchChatsAll(query: String? = nil, limit: Int? = nil, order: SortOrder? = nil, createdFrom: String? = nil, createdTo: String? = nil, active: Bool? = nil, chatSubtype: ChatSubtype? = nil, personal: Bool? = nil) async throws -> [Chat] {
        throw pachcaNotImplemented("Search.searchChatsAll")
    }

    open func searchMessages(query: String? = nil, limit: Int? = nil, cursor: String? = nil, order: SortOrder? = nil, createdFrom: String? = nil, createdTo: String? = nil, chatIds: [Int]? = nil, userIds: [Int]? = nil, active: Bool? = nil) async throws -> SearchMessagesResponse {
        throw pachcaNotImplemented("Search.searchMessages")
    }

    open func searchMessagesAll(query: String? = nil, limit: Int? = nil, order: SortOrder? = nil, createdFrom: String? = nil, createdTo: String? = nil, chatIds: [Int]? = nil, userIds: [Int]? = nil, active: Bool? = nil) async throws -> [Message] {
        throw pachcaNotImplemented("Search.searchMessagesAll")
    }

    open func searchUsers(query: String? = nil, limit: Int? = nil, cursor: String? = nil, sort: SearchSortOrder? = nil, order: SortOrder? = nil, createdFrom: String? = nil, createdTo: String? = nil, companyRoles: [UserRole]? = nil) async throws -> SearchUsersResponse {
        throw pachcaNotImplemented("Search.searchUsers")
    }

    open func searchUsersAll(query: String? = nil, limit: Int? = nil, sort: SearchSortOrder? = nil, order: SortOrder? = nil, createdFrom: String? = nil, createdTo: String? = nil, companyRoles: [UserRole]? = nil) async throws -> [User] {
        throw pachcaNotImplemented("Search.searchUsersAll")
    }
}

public final class SearchServiceImpl: SearchService {
    let baseURL: String
    let headers: [String: String]
    let session: URLSession

    init(baseURL: String, headers: [String: String], session: URLSession = .shared) {
        self.baseURL = baseURL
        self.headers = headers
        self.session = session
        super.init()
    }

    public override func searchChats(query: String? = nil, limit: Int? = nil, cursor: String? = nil, order: SortOrder? = nil, createdFrom: String? = nil, createdTo: String? = nil, active: Bool? = nil, chatSubtype: ChatSubtype? = nil, personal: Bool? = nil) async throws -> SearchChatsResponse {
        var components = URLComponents(string: "\(baseURL)/search/chats")!
        var queryItems: [URLQueryItem] = []
        if let query { queryItems.append(URLQueryItem(name: "query", value: String(query))) }
        if let limit { queryItems.append(URLQueryItem(name: "limit", value: String(limit))) }
        if let cursor { queryItems.append(URLQueryItem(name: "cursor", value: String(cursor))) }
        if let order { queryItems.append(URLQueryItem(name: "order", value: order.rawValue)) }
        if let createdFrom { queryItems.append(URLQueryItem(name: "created_from", value: String(createdFrom))) }
        if let createdTo { queryItems.append(URLQueryItem(name: "created_to", value: String(createdTo))) }
        if let active { queryItems.append(URLQueryItem(name: "active", value: String(active))) }
        if let chatSubtype { queryItems.append(URLQueryItem(name: "chat_subtype", value: chatSubtype.rawValue)) }
        if let personal { queryItems.append(URLQueryItem(name: "personal", value: String(personal))) }
        if !queryItems.isEmpty { components.queryItems = queryItems }
        var request = URLRequest(url: components.url!)
        headers.forEach { request.setValue($1, forHTTPHeaderField: $0) }
        let (data, urlResponse) = try await dataWithRetry(session: session, for: request)
        let statusCode = (urlResponse as! HTTPURLResponse).statusCode
        switch statusCode {
        case 200:
            return try deserialize(SearchChatsResponse.self, from: data)
        case 401:
            throw try deserialize(OAuthError.self, from: data)
        default:
            throw try deserialize(ApiError.self, from: data)
        }
    }

    public override func searchChatsAll(query: String? = nil, limit: Int? = nil, order: SortOrder? = nil, createdFrom: String? = nil, createdTo: String? = nil, active: Bool? = nil, chatSubtype: ChatSubtype? = nil, personal: Bool? = nil) async throws -> [Chat] {
        var items: [Chat] = []
        var cursor: String? = nil
        repeat {
            let response = try await searchChats(query: query, limit: limit, cursor: cursor, order: order, createdFrom: createdFrom, createdTo: createdTo, active: active, chatSubtype: chatSubtype, personal: personal)
            items.append(contentsOf: response.data)
            if response.data.isEmpty { break }
            cursor = response.meta.paginate.nextPage
        } while true
        return items
    }

    public override func searchMessages(query: String? = nil, limit: Int? = nil, cursor: String? = nil, order: SortOrder? = nil, createdFrom: String? = nil, createdTo: String? = nil, chatIds: [Int]? = nil, userIds: [Int]? = nil, active: Bool? = nil) async throws -> SearchMessagesResponse {
        var components = URLComponents(string: "\(baseURL)/search/messages")!
        var queryItems: [URLQueryItem] = []
        if let query { queryItems.append(URLQueryItem(name: "query", value: String(query))) }
        if let limit { queryItems.append(URLQueryItem(name: "limit", value: String(limit))) }
        if let cursor { queryItems.append(URLQueryItem(name: "cursor", value: String(cursor))) }
        if let order { queryItems.append(URLQueryItem(name: "order", value: order.rawValue)) }
        if let createdFrom { queryItems.append(URLQueryItem(name: "created_from", value: String(createdFrom))) }
        if let createdTo { queryItems.append(URLQueryItem(name: "created_to", value: String(createdTo))) }
        if let chatIds { chatIds.forEach { queryItems.append(URLQueryItem(name: "chat_ids[]", value: String($0))) } }
        if let userIds { userIds.forEach { queryItems.append(URLQueryItem(name: "user_ids[]", value: String($0))) } }
        if let active { queryItems.append(URLQueryItem(name: "active", value: String(active))) }
        if !queryItems.isEmpty { components.queryItems = queryItems }
        var request = URLRequest(url: components.url!)
        headers.forEach { request.setValue($1, forHTTPHeaderField: $0) }
        let (data, urlResponse) = try await dataWithRetry(session: session, for: request)
        let statusCode = (urlResponse as! HTTPURLResponse).statusCode
        switch statusCode {
        case 200:
            return try deserialize(SearchMessagesResponse.self, from: data)
        case 401:
            throw try deserialize(OAuthError.self, from: data)
        default:
            throw try deserialize(ApiError.self, from: data)
        }
    }

    public override func searchMessagesAll(query: String? = nil, limit: Int? = nil, order: SortOrder? = nil, createdFrom: String? = nil, createdTo: String? = nil, chatIds: [Int]? = nil, userIds: [Int]? = nil, active: Bool? = nil) async throws -> [Message] {
        var items: [Message] = []
        var cursor: String? = nil
        repeat {
            let response = try await searchMessages(query: query, limit: limit, cursor: cursor, order: order, createdFrom: createdFrom, createdTo: createdTo, chatIds: chatIds, userIds: userIds, active: active)
            items.append(contentsOf: response.data)
            if response.data.isEmpty { break }
            cursor = response.meta.paginate.nextPage
        } while true
        return items
    }

    public override func searchUsers(query: String? = nil, limit: Int? = nil, cursor: String? = nil, sort: SearchSortOrder? = nil, order: SortOrder? = nil, createdFrom: String? = nil, createdTo: String? = nil, companyRoles: [UserRole]? = nil) async throws -> SearchUsersResponse {
        var components = URLComponents(string: "\(baseURL)/search/users")!
        var queryItems: [URLQueryItem] = []
        if let query { queryItems.append(URLQueryItem(name: "query", value: String(query))) }
        if let limit { queryItems.append(URLQueryItem(name: "limit", value: String(limit))) }
        if let cursor { queryItems.append(URLQueryItem(name: "cursor", value: String(cursor))) }
        if let sort { queryItems.append(URLQueryItem(name: "sort", value: sort.rawValue)) }
        if let order { queryItems.append(URLQueryItem(name: "order", value: order.rawValue)) }
        if let createdFrom { queryItems.append(URLQueryItem(name: "created_from", value: String(createdFrom))) }
        if let createdTo { queryItems.append(URLQueryItem(name: "created_to", value: String(createdTo))) }
        if let companyRoles { companyRoles.forEach { queryItems.append(URLQueryItem(name: "company_roles[]", value: $0.rawValue)) } }
        if !queryItems.isEmpty { components.queryItems = queryItems }
        var request = URLRequest(url: components.url!)
        headers.forEach { request.setValue($1, forHTTPHeaderField: $0) }
        let (data, urlResponse) = try await dataWithRetry(session: session, for: request)
        let statusCode = (urlResponse as! HTTPURLResponse).statusCode
        switch statusCode {
        case 200:
            return try deserialize(SearchUsersResponse.self, from: data)
        case 401:
            throw try deserialize(OAuthError.self, from: data)
        default:
            throw try deserialize(ApiError.self, from: data)
        }
    }

    public override func searchUsersAll(query: String? = nil, limit: Int? = nil, sort: SearchSortOrder? = nil, order: SortOrder? = nil, createdFrom: String? = nil, createdTo: String? = nil, companyRoles: [UserRole]? = nil) async throws -> [User] {
        var items: [User] = []
        var cursor: String? = nil
        repeat {
            let response = try await searchUsers(query: query, limit: limit, cursor: cursor, sort: sort, order: order, createdFrom: createdFrom, createdTo: createdTo, companyRoles: companyRoles)
            items.append(contentsOf: response.data)
            if response.data.isEmpty { break }
            cursor = response.meta.paginate.nextPage
        } while true
        return items
    }
}

open class TasksService {
    public init() {}

    open func listTasks(limit: Int? = nil, cursor: String? = nil) async throws -> ListTasksResponse {
        throw pachcaNotImplemented("Tasks.listTasks")
    }

    open func listTasksAll(limit: Int? = nil) async throws -> [Task] {
        throw pachcaNotImplemented("Tasks.listTasksAll")
    }

    open func getTask(id: Int) async throws -> Task {
        throw pachcaNotImplemented("Tasks.getTask")
    }

    open func createTask(request body: TaskCreateRequest) async throws -> Task {
        throw pachcaNotImplemented("Tasks.createTask")
    }

    open func updateTask(id: Int, request body: TaskUpdateRequest) async throws -> Task {
        throw pachcaNotImplemented("Tasks.updateTask")
    }

    open func deleteTask(id: Int) async throws -> Void {
        throw pachcaNotImplemented("Tasks.deleteTask")
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

    public override func listTasks(limit: Int? = nil, cursor: String? = nil) async throws -> ListTasksResponse {
        var components = URLComponents(string: "\(baseURL)/tasks")!
        var queryItems: [URLQueryItem] = []
        if let limit { queryItems.append(URLQueryItem(name: "limit", value: String(limit))) }
        if let cursor { queryItems.append(URLQueryItem(name: "cursor", value: String(cursor))) }
        if !queryItems.isEmpty { components.queryItems = queryItems }
        var request = URLRequest(url: components.url!)
        headers.forEach { request.setValue($1, forHTTPHeaderField: $0) }
        let (data, urlResponse) = try await dataWithRetry(session: session, for: request)
        let statusCode = (urlResponse as! HTTPURLResponse).statusCode
        switch statusCode {
        case 200:
            return try deserialize(ListTasksResponse.self, from: data)
        case 401:
            throw try deserialize(OAuthError.self, from: data)
        default:
            throw try deserialize(ApiError.self, from: data)
        }
    }

    public override func listTasksAll(limit: Int? = nil) async throws -> [Task] {
        var items: [Task] = []
        var cursor: String? = nil
        repeat {
            let response = try await listTasks(limit: limit, cursor: cursor)
            items.append(contentsOf: response.data)
            if response.data.isEmpty { break }
            cursor = response.meta.paginate.nextPage
        } while true
        return items
    }

    public override func getTask(id: Int) async throws -> Task {
        var request = URLRequest(url: URL(string: "\(baseURL)/tasks/\(id)")!)
        headers.forEach { request.setValue($1, forHTTPHeaderField: $0) }
        let (data, urlResponse) = try await dataWithRetry(session: session, for: request)
        let statusCode = (urlResponse as! HTTPURLResponse).statusCode
        switch statusCode {
        case 200:
            return try deserialize(TaskDataWrapper.self, from: data).data
        case 401:
            throw try deserialize(OAuthError.self, from: data)
        default:
            throw try deserialize(ApiError.self, from: data)
        }
    }

    public override func createTask(request body: TaskCreateRequest) async throws -> Task {
        var request = URLRequest(url: URL(string: "\(baseURL)/tasks")!)
        request.httpMethod = "POST"
        headers.forEach { request.setValue($1, forHTTPHeaderField: $0) }
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try serialize(body)
        let (data, urlResponse) = try await dataWithRetry(session: session, for: request)
        let statusCode = (urlResponse as! HTTPURLResponse).statusCode
        switch statusCode {
        case 201:
            return try deserialize(TaskDataWrapper.self, from: data).data
        case 401:
            throw try deserialize(OAuthError.self, from: data)
        default:
            throw try deserialize(ApiError.self, from: data)
        }
    }

    public override func updateTask(id: Int, request body: TaskUpdateRequest) async throws -> Task {
        var request = URLRequest(url: URL(string: "\(baseURL)/tasks/\(id)")!)
        request.httpMethod = "PUT"
        headers.forEach { request.setValue($1, forHTTPHeaderField: $0) }
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try serialize(body)
        let (data, urlResponse) = try await dataWithRetry(session: session, for: request)
        let statusCode = (urlResponse as! HTTPURLResponse).statusCode
        switch statusCode {
        case 200:
            return try deserialize(TaskDataWrapper.self, from: data).data
        case 401:
            throw try deserialize(OAuthError.self, from: data)
        default:
            throw try deserialize(ApiError.self, from: data)
        }
    }

    public override func deleteTask(id: Int) async throws -> Void {
        var request = URLRequest(url: URL(string: "\(baseURL)/tasks/\(id)")!)
        request.httpMethod = "DELETE"
        headers.forEach { request.setValue($1, forHTTPHeaderField: $0) }
        let (data, urlResponse) = try await dataWithRetry(session: session, for: request)
        let statusCode = (urlResponse as! HTTPURLResponse).statusCode
        switch statusCode {
        case 204:
            return
        case 401:
            throw try deserialize(OAuthError.self, from: data)
        default:
            throw try deserialize(ApiError.self, from: data)
        }
    }
}

open class UsersService {
    public init() {}

    open func listUsers(query: String? = nil, limit: Int? = nil, cursor: String? = nil) async throws -> ListUsersResponse {
        throw pachcaNotImplemented("Users.listUsers")
    }

    open func listUsersAll(query: String? = nil, limit: Int? = nil) async throws -> [User] {
        throw pachcaNotImplemented("Users.listUsersAll")
    }

    open func getUser(id: Int) async throws -> User {
        throw pachcaNotImplemented("Users.getUser")
    }

    open func getUserStatus(userId: Int) async throws -> String {
        throw pachcaNotImplemented("Users.getUserStatus")
    }

    open func createUser(request body: UserCreateRequest) async throws -> User {
        throw pachcaNotImplemented("Users.createUser")
    }

    open func updateUser(id: Int, request body: UserUpdateRequest) async throws -> User {
        throw pachcaNotImplemented("Users.updateUser")
    }

    open func updateUserAvatar(userId: Int, image: Data) async throws -> AvatarData {
        throw pachcaNotImplemented("Users.updateUserAvatar")
    }

    open func updateUserStatus(userId: Int, request body: StatusUpdateRequest) async throws -> UserStatus {
        throw pachcaNotImplemented("Users.updateUserStatus")
    }

    open func deleteUser(id: Int) async throws -> Void {
        throw pachcaNotImplemented("Users.deleteUser")
    }

    open func deleteUserAvatar(userId: Int) async throws -> Void {
        throw pachcaNotImplemented("Users.deleteUserAvatar")
    }

    open func deleteUserStatus(userId: Int) async throws -> Void {
        throw pachcaNotImplemented("Users.deleteUserStatus")
    }
}

public final class UsersServiceImpl: UsersService {
    let baseURL: String
    let headers: [String: String]
    let session: URLSession

    init(baseURL: String, headers: [String: String], session: URLSession = .shared) {
        self.baseURL = baseURL
        self.headers = headers
        self.session = session
        super.init()
    }

    public override func listUsers(query: String? = nil, limit: Int? = nil, cursor: String? = nil) async throws -> ListUsersResponse {
        var components = URLComponents(string: "\(baseURL)/users")!
        var queryItems: [URLQueryItem] = []
        if let query { queryItems.append(URLQueryItem(name: "query", value: String(query))) }
        if let limit { queryItems.append(URLQueryItem(name: "limit", value: String(limit))) }
        if let cursor { queryItems.append(URLQueryItem(name: "cursor", value: String(cursor))) }
        if !queryItems.isEmpty { components.queryItems = queryItems }
        var request = URLRequest(url: components.url!)
        headers.forEach { request.setValue($1, forHTTPHeaderField: $0) }
        let (data, urlResponse) = try await dataWithRetry(session: session, for: request)
        let statusCode = (urlResponse as! HTTPURLResponse).statusCode
        switch statusCode {
        case 200:
            return try deserialize(ListUsersResponse.self, from: data)
        case 401:
            throw try deserialize(OAuthError.self, from: data)
        default:
            throw try deserialize(ApiError.self, from: data)
        }
    }

    public override func listUsersAll(query: String? = nil, limit: Int? = nil) async throws -> [User] {
        var items: [User] = []
        var cursor: String? = nil
        repeat {
            let response = try await listUsers(query: query, limit: limit, cursor: cursor)
            items.append(contentsOf: response.data)
            if response.data.isEmpty { break }
            cursor = response.meta.paginate.nextPage
        } while true
        return items
    }

    public override func getUser(id: Int) async throws -> User {
        var request = URLRequest(url: URL(string: "\(baseURL)/users/\(id)")!)
        headers.forEach { request.setValue($1, forHTTPHeaderField: $0) }
        let (data, urlResponse) = try await dataWithRetry(session: session, for: request)
        let statusCode = (urlResponse as! HTTPURLResponse).statusCode
        switch statusCode {
        case 200:
            return try deserialize(UserDataWrapper.self, from: data).data
        case 401:
            throw try deserialize(OAuthError.self, from: data)
        default:
            throw try deserialize(ApiError.self, from: data)
        }
    }

    public override func getUserStatus(userId: Int) async throws -> String {
        var request = URLRequest(url: URL(string: "\(baseURL)/users/\(userId)/status")!)
        headers.forEach { request.setValue($1, forHTTPHeaderField: $0) }
        let (data, urlResponse) = try await dataWithRetry(session: session, for: request)
        let statusCode = (urlResponse as! HTTPURLResponse).statusCode
        switch statusCode {
        case 200:
            return try deserialize(String.self, from: data)
        case 401:
            throw try deserialize(OAuthError.self, from: data)
        default:
            throw try deserialize(ApiError.self, from: data)
        }
    }

    public override func createUser(request body: UserCreateRequest) async throws -> User {
        var request = URLRequest(url: URL(string: "\(baseURL)/users")!)
        request.httpMethod = "POST"
        headers.forEach { request.setValue($1, forHTTPHeaderField: $0) }
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try serialize(body)
        let (data, urlResponse) = try await dataWithRetry(session: session, for: request)
        let statusCode = (urlResponse as! HTTPURLResponse).statusCode
        switch statusCode {
        case 201:
            return try deserialize(UserDataWrapper.self, from: data).data
        case 401:
            throw try deserialize(OAuthError.self, from: data)
        default:
            throw try deserialize(ApiError.self, from: data)
        }
    }

    public override func updateUser(id: Int, request body: UserUpdateRequest) async throws -> User {
        var request = URLRequest(url: URL(string: "\(baseURL)/users/\(id)")!)
        request.httpMethod = "PUT"
        headers.forEach { request.setValue($1, forHTTPHeaderField: $0) }
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try serialize(body)
        let (data, urlResponse) = try await dataWithRetry(session: session, for: request)
        let statusCode = (urlResponse as! HTTPURLResponse).statusCode
        switch statusCode {
        case 200:
            return try deserialize(UserDataWrapper.self, from: data).data
        case 401:
            throw try deserialize(OAuthError.self, from: data)
        default:
            throw try deserialize(ApiError.self, from: data)
        }
    }

    public override func updateUserAvatar(userId: Int, image: Data) async throws -> AvatarData {
        var request = URLRequest(url: URL(string: "\(baseURL)/users/\(userId)/avatar")!)
        request.httpMethod = "PUT"
        headers.forEach { request.setValue($1, forHTTPHeaderField: $0) }
        let boundary = UUID().uuidString
        request.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")
        var data = Data()
        func appendField(_ name: String, _ value: String) {
            data.append("--\(boundary)\r\n".data(using: .utf8)!)
            data.append("Content-Disposition: form-data; name=\"\(name)\"\r\n\r\n".data(using: .utf8)!)
            data.append("\(value)\r\n".data(using: .utf8)!)
        }
        data.append("--\(boundary)\r\n".data(using: .utf8)!)
        data.append("Content-Disposition: form-data; name=\"image\"; filename=\"upload\"\r\n".data(using: .utf8)!)
        data.append("Content-Type: application/octet-stream\r\n\r\n".data(using: .utf8)!)
        data.append(image)
        data.append("\r\n".data(using: .utf8)!)
        data.append("--\(boundary)--\r\n".data(using: .utf8)!)
        request.httpBody = data
        let (responseData, urlResponse) = try await dataWithRetry(session: session, for: request)
        let statusCode = (urlResponse as! HTTPURLResponse).statusCode
        switch statusCode {
        case 200:
            return try deserialize(AvatarDataDataWrapper.self, from: responseData).data
        case 401:
            throw try deserialize(OAuthError.self, from: responseData)
        default:
            throw try deserialize(ApiError.self, from: responseData)
        }
    }

    public override func updateUserStatus(userId: Int, request body: StatusUpdateRequest) async throws -> UserStatus {
        var request = URLRequest(url: URL(string: "\(baseURL)/users/\(userId)/status")!)
        request.httpMethod = "PUT"
        headers.forEach { request.setValue($1, forHTTPHeaderField: $0) }
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try serialize(body)
        let (data, urlResponse) = try await dataWithRetry(session: session, for: request)
        let statusCode = (urlResponse as! HTTPURLResponse).statusCode
        switch statusCode {
        case 200:
            return try deserialize(UserStatusDataWrapper.self, from: data).data
        case 401:
            throw try deserialize(OAuthError.self, from: data)
        default:
            throw try deserialize(ApiError.self, from: data)
        }
    }

    public override func deleteUser(id: Int) async throws -> Void {
        var request = URLRequest(url: URL(string: "\(baseURL)/users/\(id)")!)
        request.httpMethod = "DELETE"
        headers.forEach { request.setValue($1, forHTTPHeaderField: $0) }
        let (data, urlResponse) = try await dataWithRetry(session: session, for: request)
        let statusCode = (urlResponse as! HTTPURLResponse).statusCode
        switch statusCode {
        case 204:
            return
        case 401:
            throw try deserialize(OAuthError.self, from: data)
        default:
            throw try deserialize(ApiError.self, from: data)
        }
    }

    public override func deleteUserAvatar(userId: Int) async throws -> Void {
        var request = URLRequest(url: URL(string: "\(baseURL)/users/\(userId)/avatar")!)
        request.httpMethod = "DELETE"
        headers.forEach { request.setValue($1, forHTTPHeaderField: $0) }
        let (data, urlResponse) = try await dataWithRetry(session: session, for: request)
        let statusCode = (urlResponse as! HTTPURLResponse).statusCode
        switch statusCode {
        case 204:
            return
        case 401:
            throw try deserialize(OAuthError.self, from: data)
        default:
            throw try deserialize(ApiError.self, from: data)
        }
    }

    public override func deleteUserStatus(userId: Int) async throws -> Void {
        var request = URLRequest(url: URL(string: "\(baseURL)/users/\(userId)/status")!)
        request.httpMethod = "DELETE"
        headers.forEach { request.setValue($1, forHTTPHeaderField: $0) }
        let (data, urlResponse) = try await dataWithRetry(session: session, for: request)
        let statusCode = (urlResponse as! HTTPURLResponse).statusCode
        switch statusCode {
        case 204:
            return
        case 401:
            throw try deserialize(OAuthError.self, from: data)
        default:
            throw try deserialize(ApiError.self, from: data)
        }
    }
}

open class ViewsService {
    public init() {}

    open func openView(request body: OpenViewRequest) async throws -> Void {
        throw pachcaNotImplemented("Views.openView")
    }
}

public final class ViewsServiceImpl: ViewsService {
    let baseURL: String
    let headers: [String: String]
    let session: URLSession

    init(baseURL: String, headers: [String: String], session: URLSession = .shared) {
        self.baseURL = baseURL
        self.headers = headers
        self.session = session
        super.init()
    }

    public override func openView(request body: OpenViewRequest) async throws -> Void {
        var request = URLRequest(url: URL(string: "\(baseURL)/views/open")!)
        request.httpMethod = "POST"
        headers.forEach { request.setValue($1, forHTTPHeaderField: $0) }
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try serialize(body)
        let (data, urlResponse) = try await dataWithRetry(session: session, for: request)
        let statusCode = (urlResponse as! HTTPURLResponse).statusCode
        switch statusCode {
        case 201:
            return
        case 401:
            throw try deserialize(OAuthError.self, from: data)
        default:
            throw try deserialize(ApiError.self, from: data)
        }
    }
}

private final class RedirectPreventer: NSObject, URLSessionTaskDelegate {
    func urlSession(
        _ session: URLSession,
        task: URLSessionTask,
        willPerformHTTPRedirection response: HTTPURLResponse,
        newRequest request: URLRequest,
        completionHandler: @escaping (URLRequest?) -> Void
    ) {
        completionHandler(nil)
    }
}

public struct PachcaClient {
    public let bots: BotsService
    public let chats: ChatsService
    public let common: CommonService
    public let groupTags: GroupTagsService
    public let linkPreviews: LinkPreviewsService
    public let members: MembersService
    public let messages: MessagesService
    public let profile: ProfileService
    public let reactions: ReactionsService
    public let readMembers: ReadMembersService
    public let search: SearchService
    public let security: SecurityService
    public let tasks: TasksService
    public let threads: ThreadsService
    public let users: UsersService
    public let views: ViewsService

    private init(bots: BotsService, chats: ChatsService, common: CommonService, groupTags: GroupTagsService, linkPreviews: LinkPreviewsService, members: MembersService, messages: MessagesService, profile: ProfileService, reactions: ReactionsService, readMembers: ReadMembersService, search: SearchService, security: SecurityService, tasks: TasksService, threads: ThreadsService, users: UsersService, views: ViewsService) {
        self.bots = bots
        self.chats = chats
        self.common = common
        self.groupTags = groupTags
        self.linkPreviews = linkPreviews
        self.members = members
        self.messages = messages
        self.profile = profile
        self.reactions = reactions
        self.readMembers = readMembers
        self.search = search
        self.security = security
        self.tasks = tasks
        self.threads = threads
        self.users = users
        self.views = views
    }

    public init(token: String, baseURL: String = "https://api.pachca.com/api/shared/v1", bots: BotsService? = nil, chats: ChatsService? = nil, common: CommonService? = nil, groupTags: GroupTagsService? = nil, linkPreviews: LinkPreviewsService? = nil, members: MembersService? = nil, messages: MessagesService? = nil, profile: ProfileService? = nil, reactions: ReactionsService? = nil, readMembers: ReadMembersService? = nil, search: SearchService? = nil, security: SecurityService? = nil, tasks: TasksService? = nil, threads: ThreadsService? = nil, users: UsersService? = nil, views: ViewsService? = nil) {
        let headers = ["Authorization": "Bearer \(token)"]
        self.init(
            bots: bots ?? BotsServiceImpl(baseURL: baseURL, headers: headers),
            chats: chats ?? ChatsServiceImpl(baseURL: baseURL, headers: headers),
            common: common ?? CommonServiceImpl(baseURL: baseURL, headers: headers),
            groupTags: groupTags ?? GroupTagsServiceImpl(baseURL: baseURL, headers: headers),
            linkPreviews: linkPreviews ?? LinkPreviewsServiceImpl(baseURL: baseURL, headers: headers),
            members: members ?? MembersServiceImpl(baseURL: baseURL, headers: headers),
            messages: messages ?? MessagesServiceImpl(baseURL: baseURL, headers: headers),
            profile: profile ?? ProfileServiceImpl(baseURL: baseURL, headers: headers),
            reactions: reactions ?? ReactionsServiceImpl(baseURL: baseURL, headers: headers),
            readMembers: readMembers ?? ReadMembersServiceImpl(baseURL: baseURL, headers: headers),
            search: search ?? SearchServiceImpl(baseURL: baseURL, headers: headers),
            security: security ?? SecurityServiceImpl(baseURL: baseURL, headers: headers),
            tasks: tasks ?? TasksServiceImpl(baseURL: baseURL, headers: headers),
            threads: threads ?? ThreadsServiceImpl(baseURL: baseURL, headers: headers),
            users: users ?? UsersServiceImpl(baseURL: baseURL, headers: headers),
            views: views ?? ViewsServiceImpl(baseURL: baseURL, headers: headers)
        )
    }

    public static func stub(bots: BotsService = BotsService(), chats: ChatsService = ChatsService(), common: CommonService = CommonService(), groupTags: GroupTagsService = GroupTagsService(), linkPreviews: LinkPreviewsService = LinkPreviewsService(), members: MembersService = MembersService(), messages: MessagesService = MessagesService(), profile: ProfileService = ProfileService(), reactions: ReactionsService = ReactionsService(), readMembers: ReadMembersService = ReadMembersService(), search: SearchService = SearchService(), security: SecurityService = SecurityService(), tasks: TasksService = TasksService(), threads: ThreadsService = ThreadsService(), users: UsersService = UsersService(), views: ViewsService = ViewsService()) -> PachcaClient {
        PachcaClient(
            bots: bots,
            chats: chats,
            common: common,
            groupTags: groupTags,
            linkPreviews: linkPreviews,
            members: members,
            messages: messages,
            profile: profile,
            reactions: reactions,
            readMembers: readMembers,
            search: search,
            security: security,
            tasks: tasks,
            threads: threads,
            users: users,
            views: views
        )
    }
}
