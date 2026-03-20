import Foundation

public struct SecurityService {
    let baseURL: String
    let headers: [String: String]
    let session: URLSession

    init(baseURL: String, headers: [String: String], session: URLSession = .shared) {
        self.baseURL = baseURL
        self.headers = headers
        self.session = session
    }

    public func getAuditEvents(startTime: String? = nil, endTime: String? = nil, eventKey: AuditEventKey? = nil, actorId: String? = nil, actorType: String? = nil, entityId: String? = nil, entityType: String? = nil, limit: Int? = nil, cursor: String? = nil) async throws -> GetAuditEventsResponse {
        var components = URLComponents(string: "\(baseURL)/audit_events")!
        var queryItems: [URLQueryItem] = []
        if let startTime { queryItems.append(URLQueryItem(name: "start_time", value: startTime)) }
        if let endTime { queryItems.append(URLQueryItem(name: "end_time", value: endTime)) }
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

    public func getAuditEventsAll(startTime: String? = nil, endTime: String? = nil, eventKey: AuditEventKey? = nil, actorId: String? = nil, actorType: String? = nil, entityId: String? = nil, entityType: String? = nil, limit: Int? = nil) async throws -> [AuditEvent] {
        var items: [AuditEvent] = []
        var cursor: String? = nil
        repeat {
            let response = try await getAuditEvents(startTime: startTime, endTime: endTime, eventKey: eventKey, actorId: actorId, actorType: actorType, entityId: entityId, entityType: entityType, limit: limit, cursor: cursor)
            items.append(contentsOf: response.data)
            cursor = response.meta?.paginate?.nextPage
        } while cursor != nil
        return items
    }
}

public struct BotsService {
    let baseURL: String
    let headers: [String: String]
    let session: URLSession

    init(baseURL: String, headers: [String: String], session: URLSession = .shared) {
        self.baseURL = baseURL
        self.headers = headers
        self.session = session
    }

    public func getWebhookEvents(limit: Int? = nil, cursor: String? = nil) async throws -> GetWebhookEventsResponse {
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

    public func getWebhookEventsAll(limit: Int? = nil) async throws -> [WebhookEvent] {
        var items: [WebhookEvent] = []
        var cursor: String? = nil
        repeat {
            let response = try await getWebhookEvents(limit: limit, cursor: cursor)
            items.append(contentsOf: response.data)
            cursor = response.meta?.paginate?.nextPage
        } while cursor != nil
        return items
    }

    public func updateBot(id: Int, request body: BotUpdateRequest) async throws -> BotResponse {
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

    public func deleteWebhookEvent(id: String) async throws -> Void {
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

public struct ChatsService {
    let baseURL: String
    let headers: [String: String]
    let session: URLSession

    init(baseURL: String, headers: [String: String], session: URLSession = .shared) {
        self.baseURL = baseURL
        self.headers = headers
        self.session = session
    }

    public func listChats(sortId: SortOrder? = nil, availability: ChatAvailability? = nil, lastMessageAtAfter: String? = nil, lastMessageAtBefore: String? = nil, personal: Bool? = nil, limit: Int? = nil, cursor: String? = nil) async throws -> ListChatsResponse {
        var components = URLComponents(string: "\(baseURL)/chats")!
        var queryItems: [URLQueryItem] = []
        if let sortId { queryItems.append(URLQueryItem(name: "sort[{field}]", value: sortId.rawValue)) }
        if let availability { queryItems.append(URLQueryItem(name: "availability", value: availability.rawValue)) }
        if let lastMessageAtAfter { queryItems.append(URLQueryItem(name: "last_message_at_after", value: lastMessageAtAfter)) }
        if let lastMessageAtBefore { queryItems.append(URLQueryItem(name: "last_message_at_before", value: lastMessageAtBefore)) }
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

    public func listChatsAll(sortId: SortOrder? = nil, availability: ChatAvailability? = nil, lastMessageAtAfter: String? = nil, lastMessageAtBefore: String? = nil, personal: Bool? = nil, limit: Int? = nil) async throws -> [Chat] {
        var items: [Chat] = []
        var cursor: String? = nil
        repeat {
            let response = try await listChats(sortId: sortId, availability: availability, lastMessageAtAfter: lastMessageAtAfter, lastMessageAtBefore: lastMessageAtBefore, personal: personal, limit: limit, cursor: cursor)
            items.append(contentsOf: response.data)
            cursor = response.meta?.paginate?.nextPage
        } while cursor != nil
        return items
    }

    public func getChat(id: Int) async throws -> Chat {
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

    public func createChat(request body: ChatCreateRequest) async throws -> Chat {
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

    public func updateChat(id: Int, request body: ChatUpdateRequest) async throws -> Chat {
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

    public func archiveChat(id: Int) async throws -> Void {
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

    public func unarchiveChat(id: Int) async throws -> Void {
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

public struct CommonService {
    let baseURL: String
    let headers: [String: String]
    let session: URLSession

    init(baseURL: String, headers: [String: String], session: URLSession = .shared) {
        self.baseURL = baseURL
        self.headers = headers
        self.session = session
    }

    public func downloadExport(id: Int) async throws -> String {
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

    public func listProperties(entityType: SearchEntityType) async throws -> ListPropertiesResponse {
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

    public func requestExport(request body: ExportRequest) async throws -> Void {
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

    public func uploadFile(directUrl: String, request body: FileUploadRequest) async throws -> Void {
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

    public func getUploadParams() async throws -> UploadParams {
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

public struct MembersService {
    let baseURL: String
    let headers: [String: String]
    let session: URLSession

    init(baseURL: String, headers: [String: String], session: URLSession = .shared) {
        self.baseURL = baseURL
        self.headers = headers
        self.session = session
    }

    public func listMembers(id: Int, role: ChatMemberRoleFilter? = nil, limit: Int? = nil, cursor: String? = nil) async throws -> ListMembersResponse {
        var components = URLComponents(string: "\(baseURL)/chats/{id}/members")!
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

    public func listMembersAll(id: Int, role: ChatMemberRoleFilter? = nil, limit: Int? = nil) async throws -> [User] {
        var items: [User] = []
        var cursor: String? = nil
        repeat {
            let response = try await listMembers(id: id, role: role, limit: limit, cursor: cursor)
            items.append(contentsOf: response.data)
            cursor = response.meta?.paginate?.nextPage
        } while cursor != nil
        return items
    }

    public func addTags(id: Int, groupTagIds: [Int]) async throws -> Void {
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

    public func addMembers(id: Int, request body: AddMembersRequest) async throws -> Void {
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

    public func updateMemberRole(id: Int, userId: Int, role: ChatMemberRole) async throws -> Void {
        var request = URLRequest(url: URL(string: "\(baseURL)/chats/\(id)/members/\(userId)")!)
        request.httpMethod = "PUT"
        headers.forEach { request.setValue($1, forHTTPHeaderField: $0) }
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONSerialization.data(withJSONObject: ["role": role])
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

    public func removeTag(id: Int, tagId: Int) async throws -> Void {
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

    public func leaveChat(id: Int) async throws -> Void {
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

    public func removeMember(id: Int, userId: Int) async throws -> Void {
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

public struct GroupTagsService {
    let baseURL: String
    let headers: [String: String]
    let session: URLSession

    init(baseURL: String, headers: [String: String], session: URLSession = .shared) {
        self.baseURL = baseURL
        self.headers = headers
        self.session = session
    }

    public func listTags(names: TagNamesFilter? = nil, limit: Int? = nil, cursor: String? = nil) async throws -> ListTagsResponse {
        var components = URLComponents(string: "\(baseURL)/group_tags")!
        var queryItems: [URLQueryItem] = []
        if let names { queryItems.append(URLQueryItem(name: "names", value: String(data: try serialize(names), encoding: .utf8)!)) }
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

    public func listTagsAll(names: TagNamesFilter? = nil, limit: Int? = nil) async throws -> [GroupTag] {
        var items: [GroupTag] = []
        var cursor: String? = nil
        repeat {
            let response = try await listTags(names: names, limit: limit, cursor: cursor)
            items.append(contentsOf: response.data)
            cursor = response.meta?.paginate?.nextPage
        } while cursor != nil
        return items
    }

    public func getTag(id: Int) async throws -> GroupTag {
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

    public func getTagUsers(id: Int, limit: Int? = nil, cursor: String? = nil) async throws -> ListMembersResponse {
        var components = URLComponents(string: "\(baseURL)/group_tags/{id}/users")!
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
            return try deserialize(ListMembersResponse.self, from: data)
        case 401:
            throw try deserialize(OAuthError.self, from: data)
        default:
            throw try deserialize(ApiError.self, from: data)
        }
    }

    public func getTagUsersAll(id: Int, limit: Int? = nil) async throws -> [User] {
        var items: [User] = []
        var cursor: String? = nil
        repeat {
            let response = try await getTagUsers(id: id, limit: limit, cursor: cursor)
            items.append(contentsOf: response.data)
            cursor = response.meta?.paginate?.nextPage
        } while cursor != nil
        return items
    }

    public func createTag(request body: GroupTagRequest) async throws -> GroupTag {
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

    public func updateTag(id: Int, request body: GroupTagRequest) async throws -> GroupTag {
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

    public func deleteTag(id: Int) async throws -> Void {
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

public struct MessagesService {
    let baseURL: String
    let headers: [String: String]
    let session: URLSession

    init(baseURL: String, headers: [String: String], session: URLSession = .shared) {
        self.baseURL = baseURL
        self.headers = headers
        self.session = session
    }

    public func listChatMessages(chatId: Int, sortId: SortOrder? = nil, limit: Int? = nil, cursor: String? = nil) async throws -> ListChatMessagesResponse {
        var components = URLComponents(string: "\(baseURL)/messages")!
        var queryItems: [URLQueryItem] = []
        queryItems.append(URLQueryItem(name: "chat_id", value: String(chatId)))
        if let sortId { queryItems.append(URLQueryItem(name: "sort[{field}]", value: sortId.rawValue)) }
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

    public func listChatMessagesAll(chatId: Int, sortId: SortOrder? = nil, limit: Int? = nil) async throws -> [Message] {
        var items: [Message] = []
        var cursor: String? = nil
        repeat {
            let response = try await listChatMessages(chatId: chatId, sortId: sortId, limit: limit, cursor: cursor)
            items.append(contentsOf: response.data)
            cursor = response.meta?.paginate?.nextPage
        } while cursor != nil
        return items
    }

    public func getMessage(id: Int) async throws -> Message {
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

    public func createMessage(request body: MessageCreateRequest) async throws -> Message {
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

    public func pinMessage(id: Int) async throws -> Void {
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

    public func updateMessage(id: Int, request body: MessageUpdateRequest) async throws -> Message {
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

    public func deleteMessage(id: Int) async throws -> Void {
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

    public func unpinMessage(id: Int) async throws -> Void {
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

public struct LinkPreviewsService {
    let baseURL: String
    let headers: [String: String]
    let session: URLSession

    init(baseURL: String, headers: [String: String], session: URLSession = .shared) {
        self.baseURL = baseURL
        self.headers = headers
        self.session = session
    }

    public func createLinkPreviews(id: Int, request body: LinkPreviewsRequest) async throws -> Void {
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

public struct ReactionsService {
    let baseURL: String
    let headers: [String: String]
    let session: URLSession

    init(baseURL: String, headers: [String: String], session: URLSession = .shared) {
        self.baseURL = baseURL
        self.headers = headers
        self.session = session
    }

    public func listReactions(id: Int, limit: Int? = nil, cursor: String? = nil) async throws -> ListReactionsResponse {
        var components = URLComponents(string: "\(baseURL)/messages/{id}/reactions")!
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

    public func listReactionsAll(id: Int, limit: Int? = nil) async throws -> [Reaction] {
        var items: [Reaction] = []
        var cursor: String? = nil
        repeat {
            let response = try await listReactions(id: id, limit: limit, cursor: cursor)
            items.append(contentsOf: response.data)
            cursor = response.meta?.paginate?.nextPage
        } while cursor != nil
        return items
    }

    public func addReaction(id: Int, request body: ReactionRequest) async throws -> Reaction {
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

    public func removeReaction(id: Int, code: String, name: String? = nil) async throws -> Void {
        var components = URLComponents(string: "\(baseURL)/messages/{id}/reactions")!
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

public struct ReadMembersService {
    let baseURL: String
    let headers: [String: String]
    let session: URLSession

    init(baseURL: String, headers: [String: String], session: URLSession = .shared) {
        self.baseURL = baseURL
        self.headers = headers
        self.session = session
    }

    public func listReadMembers(id: Int, limit: Int? = nil, cursor: String? = nil) async throws -> String {
        var components = URLComponents(string: "\(baseURL)/messages/{id}/read_member_ids")!
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

public struct ThreadsService {
    let baseURL: String
    let headers: [String: String]
    let session: URLSession

    init(baseURL: String, headers: [String: String], session: URLSession = .shared) {
        self.baseURL = baseURL
        self.headers = headers
        self.session = session
    }

    public func getThread(id: Int) async throws -> Thread {
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

    public func createThread(id: Int) async throws -> Thread {
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

public struct ProfileService {
    let baseURL: String
    let headers: [String: String]
    let session: URLSession

    init(baseURL: String, headers: [String: String], session: URLSession = .shared) {
        self.baseURL = baseURL
        self.headers = headers
        self.session = session
    }

    public func getTokenInfo() async throws -> AccessTokenInfo {
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

    public func getProfile() async throws -> User {
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

    public func getStatus() async throws -> String {
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

    public func updateStatus(request body: StatusUpdateRequest) async throws -> UserStatus {
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

    public func deleteStatus() async throws -> Void {
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

public struct SearchService {
    let baseURL: String
    let headers: [String: String]
    let session: URLSession

    init(baseURL: String, headers: [String: String], session: URLSession = .shared) {
        self.baseURL = baseURL
        self.headers = headers
        self.session = session
    }

    public func searchChats(query: String? = nil, limit: Int? = nil, cursor: String? = nil, order: SortOrder? = nil, createdFrom: String? = nil, createdTo: String? = nil, active: Bool? = nil, chatSubtype: ChatSubtype? = nil, personal: Bool? = nil) async throws -> ListChatsResponse {
        var components = URLComponents(string: "\(baseURL)/search/chats")!
        var queryItems: [URLQueryItem] = []
        if let query { queryItems.append(URLQueryItem(name: "query", value: String(query))) }
        if let limit { queryItems.append(URLQueryItem(name: "limit", value: String(limit))) }
        if let cursor { queryItems.append(URLQueryItem(name: "cursor", value: String(cursor))) }
        if let order { queryItems.append(URLQueryItem(name: "order", value: order.rawValue)) }
        if let createdFrom { queryItems.append(URLQueryItem(name: "created_from", value: createdFrom)) }
        if let createdTo { queryItems.append(URLQueryItem(name: "created_to", value: createdTo)) }
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
            return try deserialize(ListChatsResponse.self, from: data)
        case 401:
            throw try deserialize(OAuthError.self, from: data)
        default:
            throw try deserialize(ApiError.self, from: data)
        }
    }

    public func searchChatsAll(query: String? = nil, limit: Int? = nil, order: SortOrder? = nil, createdFrom: String? = nil, createdTo: String? = nil, active: Bool? = nil, chatSubtype: ChatSubtype? = nil, personal: Bool? = nil) async throws -> [Chat] {
        var items: [Chat] = []
        var cursor: String? = nil
        repeat {
            let response = try await searchChats(query: query, limit: limit, cursor: cursor, order: order, createdFrom: createdFrom, createdTo: createdTo, active: active, chatSubtype: chatSubtype, personal: personal)
            items.append(contentsOf: response.data)
            cursor = response.meta?.paginate?.nextPage
        } while cursor != nil
        return items
    }

    public func searchMessages(query: String? = nil, limit: Int? = nil, cursor: String? = nil, order: SortOrder? = nil, createdFrom: String? = nil, createdTo: String? = nil, chatIds: [Int]? = nil, userIds: [Int]? = nil, active: Bool? = nil) async throws -> ListChatMessagesResponse {
        var components = URLComponents(string: "\(baseURL)/search/messages")!
        var queryItems: [URLQueryItem] = []
        if let query { queryItems.append(URLQueryItem(name: "query", value: String(query))) }
        if let limit { queryItems.append(URLQueryItem(name: "limit", value: String(limit))) }
        if let cursor { queryItems.append(URLQueryItem(name: "cursor", value: String(cursor))) }
        if let order { queryItems.append(URLQueryItem(name: "order", value: order.rawValue)) }
        if let createdFrom { queryItems.append(URLQueryItem(name: "created_from", value: createdFrom)) }
        if let createdTo { queryItems.append(URLQueryItem(name: "created_to", value: createdTo)) }
        if let chatIds { chatIds.forEach { queryItems.append(URLQueryItem(name: "chat_ids", value: String($0))) } }
        if let userIds { userIds.forEach { queryItems.append(URLQueryItem(name: "user_ids", value: String($0))) } }
        if let active { queryItems.append(URLQueryItem(name: "active", value: String(active))) }
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

    public func searchMessagesAll(query: String? = nil, limit: Int? = nil, order: SortOrder? = nil, createdFrom: String? = nil, createdTo: String? = nil, chatIds: [Int]? = nil, userIds: [Int]? = nil, active: Bool? = nil) async throws -> [Message] {
        var items: [Message] = []
        var cursor: String? = nil
        repeat {
            let response = try await searchMessages(query: query, limit: limit, cursor: cursor, order: order, createdFrom: createdFrom, createdTo: createdTo, chatIds: chatIds, userIds: userIds, active: active)
            items.append(contentsOf: response.data)
            cursor = response.meta?.paginate?.nextPage
        } while cursor != nil
        return items
    }

    public func searchUsers(query: String? = nil, limit: Int? = nil, cursor: String? = nil, sort: SearchSortOrder? = nil, order: SortOrder? = nil, createdFrom: String? = nil, createdTo: String? = nil, companyRoles: [UserRole]? = nil) async throws -> ListMembersResponse {
        var components = URLComponents(string: "\(baseURL)/search/users")!
        var queryItems: [URLQueryItem] = []
        if let query { queryItems.append(URLQueryItem(name: "query", value: String(query))) }
        if let limit { queryItems.append(URLQueryItem(name: "limit", value: String(limit))) }
        if let cursor { queryItems.append(URLQueryItem(name: "cursor", value: String(cursor))) }
        if let sort { queryItems.append(URLQueryItem(name: "sort", value: sort.rawValue)) }
        if let order { queryItems.append(URLQueryItem(name: "order", value: order.rawValue)) }
        if let createdFrom { queryItems.append(URLQueryItem(name: "created_from", value: createdFrom)) }
        if let createdTo { queryItems.append(URLQueryItem(name: "created_to", value: createdTo)) }
        if let companyRoles { companyRoles.forEach { queryItems.append(URLQueryItem(name: "company_roles", value: $0.rawValue)) } }
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

    public func searchUsersAll(query: String? = nil, limit: Int? = nil, sort: SearchSortOrder? = nil, order: SortOrder? = nil, createdFrom: String? = nil, createdTo: String? = nil, companyRoles: [UserRole]? = nil) async throws -> [User] {
        var items: [User] = []
        var cursor: String? = nil
        repeat {
            let response = try await searchUsers(query: query, limit: limit, cursor: cursor, sort: sort, order: order, createdFrom: createdFrom, createdTo: createdTo, companyRoles: companyRoles)
            items.append(contentsOf: response.data)
            cursor = response.meta?.paginate?.nextPage
        } while cursor != nil
        return items
    }
}

public struct TasksService {
    let baseURL: String
    let headers: [String: String]
    let session: URLSession

    init(baseURL: String, headers: [String: String], session: URLSession = .shared) {
        self.baseURL = baseURL
        self.headers = headers
        self.session = session
    }

    public func listTasks(limit: Int? = nil, cursor: String? = nil) async throws -> ListTasksResponse {
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

    public func listTasksAll(limit: Int? = nil) async throws -> [Task] {
        var items: [Task] = []
        var cursor: String? = nil
        repeat {
            let response = try await listTasks(limit: limit, cursor: cursor)
            items.append(contentsOf: response.data)
            cursor = response.meta?.paginate?.nextPage
        } while cursor != nil
        return items
    }

    public func getTask(id: Int) async throws -> Task {
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

    public func createTask(request body: TaskCreateRequest) async throws -> Task {
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

    public func updateTask(id: Int, request body: TaskUpdateRequest) async throws -> Task {
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

    public func deleteTask(id: Int) async throws -> Void {
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

public struct UsersService {
    let baseURL: String
    let headers: [String: String]
    let session: URLSession

    init(baseURL: String, headers: [String: String], session: URLSession = .shared) {
        self.baseURL = baseURL
        self.headers = headers
        self.session = session
    }

    public func listUsers(query: String? = nil, limit: Int? = nil, cursor: String? = nil) async throws -> ListMembersResponse {
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
            return try deserialize(ListMembersResponse.self, from: data)
        case 401:
            throw try deserialize(OAuthError.self, from: data)
        default:
            throw try deserialize(ApiError.self, from: data)
        }
    }

    public func listUsersAll(query: String? = nil, limit: Int? = nil) async throws -> [User] {
        var items: [User] = []
        var cursor: String? = nil
        repeat {
            let response = try await listUsers(query: query, limit: limit, cursor: cursor)
            items.append(contentsOf: response.data)
            cursor = response.meta?.paginate?.nextPage
        } while cursor != nil
        return items
    }

    public func getUser(id: Int) async throws -> User {
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

    public func getUserStatus(userId: Int) async throws -> String {
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

    public func createUser(request body: UserCreateRequest) async throws -> User {
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

    public func updateUser(id: Int, request body: UserUpdateRequest) async throws -> User {
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

    public func updateUserStatus(userId: Int, request body: StatusUpdateRequest) async throws -> UserStatus {
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

    public func deleteUser(id: Int) async throws -> Void {
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

    public func deleteUserStatus(userId: Int) async throws -> Void {
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

public struct ViewsService {
    let baseURL: String
    let headers: [String: String]
    let session: URLSession

    init(baseURL: String, headers: [String: String], session: URLSession = .shared) {
        self.baseURL = baseURL
        self.headers = headers
        self.session = session
    }

    public func openView(request body: OpenViewRequest) async throws -> Void {
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

    public init(token: String, baseURL: String = "https://api.pachca.com/api/shared/v1") {
        let headers = ["Authorization": "Bearer \(token)"]
        self.bots = BotsService(baseURL: baseURL, headers: headers)
        self.chats = ChatsService(baseURL: baseURL, headers: headers)
        self.common = CommonService(baseURL: baseURL, headers: headers)
        self.groupTags = GroupTagsService(baseURL: baseURL, headers: headers)
        self.linkPreviews = LinkPreviewsService(baseURL: baseURL, headers: headers)
        self.members = MembersService(baseURL: baseURL, headers: headers)
        self.messages = MessagesService(baseURL: baseURL, headers: headers)
        self.profile = ProfileService(baseURL: baseURL, headers: headers)
        self.reactions = ReactionsService(baseURL: baseURL, headers: headers)
        self.readMembers = ReadMembersService(baseURL: baseURL, headers: headers)
        self.search = SearchService(baseURL: baseURL, headers: headers)
        self.security = SecurityService(baseURL: baseURL, headers: headers)
        self.tasks = TasksService(baseURL: baseURL, headers: headers)
        self.threads = ThreadsService(baseURL: baseURL, headers: headers)
        self.users = UsersService(baseURL: baseURL, headers: headers)
        self.views = ViewsService(baseURL: baseURL, headers: headers)
    }
}
