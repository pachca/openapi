package com.pachca.sdk

import io.ktor.client.*
import io.ktor.client.call.*
import io.ktor.client.plugins.*
import io.ktor.client.plugins.auth.*
import io.ktor.client.plugins.auth.providers.*
import io.ktor.client.plugins.contentnegotiation.*
import io.ktor.client.request.*
import io.ktor.client.request.forms.*
import io.ktor.client.statement.*
import io.ktor.http.*
import io.ktor.serialization.kotlinx.json.*
import kotlinx.serialization.json.Json
import java.io.Closeable
import java.time.OffsetDateTime

interface SecurityService {
    suspend fun getAuditEvents(
        startTime: OffsetDateTime? = null,
        endTime: OffsetDateTime? = null,
        eventKey: AuditEventKey? = null,
        actorId: String? = null,
        actorType: String? = null,
        entityId: String? = null,
        entityType: String? = null,
        limit: Int? = null,
        cursor: String? = null,
    ): GetAuditEventsResponse {
        throw NotImplementedError("Security.getAuditEvents is not implemented")
    }

    suspend fun getAuditEventsAll(
        startTime: OffsetDateTime? = null,
        endTime: OffsetDateTime? = null,
        eventKey: AuditEventKey? = null,
        actorId: String? = null,
        actorType: String? = null,
        entityId: String? = null,
        entityType: String? = null,
        limit: Int? = null,
    ): List<AuditEvent> {
        throw NotImplementedError("Security.getAuditEventsAll is not implemented")
    }
}

class SecurityServiceImpl internal constructor(
    private val baseUrl: String,
    private val client: HttpClient,
) : SecurityService {
    override suspend fun getAuditEvents(
        startTime: OffsetDateTime?,
        endTime: OffsetDateTime?,
        eventKey: AuditEventKey?,
        actorId: String?,
        actorType: String?,
        entityId: String?,
        entityType: String?,
        limit: Int?,
        cursor: String?,
    ): GetAuditEventsResponse {
        val response = client.get("$baseUrl/audit_events") {
            startTime?.let { parameter("start_time", it.toString()) }
            endTime?.let { parameter("end_time", it.toString()) }
            eventKey?.let { parameter("event_key", it.value) }
            actorId?.let { parameter("actor_id", it) }
            actorType?.let { parameter("actor_type", it) }
            entityId?.let { parameter("entity_id", it) }
            entityType?.let { parameter("entity_type", it) }
            limit?.let { parameter("limit", it) }
            cursor?.let { parameter("cursor", it) }
        }
        return when (response.status.value) {
            200 -> response.body()
            401 -> throw response.body<OAuthError>()
            else -> throw response.body<ApiError>()
        }
    }

    override suspend fun getAuditEventsAll(
        startTime: OffsetDateTime?,
        endTime: OffsetDateTime?,
        eventKey: AuditEventKey?,
        actorId: String?,
        actorType: String?,
        entityId: String?,
        entityType: String?,
        limit: Int?,
    ): List<AuditEvent> {
        val items = mutableListOf<AuditEvent>()
        var cursor: String? = null
        do {
            val response = getAuditEvents(
                startTime = startTime,
                endTime = endTime,
                eventKey = eventKey,
                actorId = actorId,
                actorType = actorType,
                entityId = entityId,
                entityType = entityType,
                limit = limit,
                cursor = cursor,
            )
            items.addAll(response.data)
            if (response.data.isEmpty()) break
            cursor = response.meta.paginate.nextPage
        } while (true)
        return items
    }
}

interface BotsService {
    suspend fun getWebhookEvents(limit: Int? = null, cursor: String? = null): GetWebhookEventsResponse {
        throw NotImplementedError("Bots.getWebhookEvents is not implemented")
    }

    suspend fun getWebhookEventsAll(limit: Int? = null): List<WebhookEvent> {
        throw NotImplementedError("Bots.getWebhookEventsAll is not implemented")
    }

    suspend fun updateBot(id: Int, request: BotUpdateRequest): BotResponse {
        throw NotImplementedError("Bots.updateBot is not implemented")
    }

    suspend fun deleteWebhookEvent(id: String) {
        throw NotImplementedError("Bots.deleteWebhookEvent is not implemented")
    }
}

class BotsServiceImpl internal constructor(
    private val baseUrl: String,
    private val client: HttpClient,
) : BotsService {
    override suspend fun getWebhookEvents(limit: Int?, cursor: String?): GetWebhookEventsResponse {
        val response = client.get("$baseUrl/webhooks/events") {
            limit?.let { parameter("limit", it) }
            cursor?.let { parameter("cursor", it) }
        }
        return when (response.status.value) {
            200 -> response.body()
            401 -> throw response.body<OAuthError>()
            else -> throw response.body<ApiError>()
        }
    }

    override suspend fun getWebhookEventsAll(limit: Int?): List<WebhookEvent> {
        val items = mutableListOf<WebhookEvent>()
        var cursor: String? = null
        do {
            val response = getWebhookEvents(limit = limit, cursor = cursor)
            items.addAll(response.data)
            if (response.data.isEmpty()) break
            cursor = response.meta.paginate.nextPage
        } while (true)
        return items
    }

    override suspend fun updateBot(id: Int, request: BotUpdateRequest): BotResponse {
        val response = client.put("$baseUrl/bots/$id") {
            contentType(ContentType.Application.Json)
            setBody(request)
        }
        return when (response.status.value) {
            200 -> response.body<BotResponseDataWrapper>().data
            401 -> throw response.body<OAuthError>()
            else -> throw response.body<ApiError>()
        }
    }

    override suspend fun deleteWebhookEvent(id: String) {
        val response = client.delete("$baseUrl/webhooks/events/$id")
        when (response.status.value) {
            204 -> return
            401 -> throw response.body<OAuthError>()
            else -> throw response.body<ApiError>()
        }
    }
}

interface ChatsService {
    suspend fun listChats(
        sort: ChatSortField? = null,
        order: SortOrder? = null,
        availability: ChatAvailability? = null,
        lastMessageAtAfter: OffsetDateTime? = null,
        lastMessageAtBefore: OffsetDateTime? = null,
        personal: Boolean? = null,
        limit: Int? = null,
        cursor: String? = null,
    ): ListChatsResponse {
        throw NotImplementedError("Chats.listChats is not implemented")
    }

    suspend fun listChatsAll(
        sort: ChatSortField? = null,
        order: SortOrder? = null,
        availability: ChatAvailability? = null,
        lastMessageAtAfter: OffsetDateTime? = null,
        lastMessageAtBefore: OffsetDateTime? = null,
        personal: Boolean? = null,
        limit: Int? = null,
    ): List<Chat> {
        throw NotImplementedError("Chats.listChatsAll is not implemented")
    }

    suspend fun getChat(id: Int): Chat {
        throw NotImplementedError("Chats.getChat is not implemented")
    }

    suspend fun createChat(request: ChatCreateRequest): Chat {
        throw NotImplementedError("Chats.createChat is not implemented")
    }

    suspend fun updateChat(id: Int, request: ChatUpdateRequest): Chat {
        throw NotImplementedError("Chats.updateChat is not implemented")
    }

    suspend fun archiveChat(id: Int) {
        throw NotImplementedError("Chats.archiveChat is not implemented")
    }

    suspend fun unarchiveChat(id: Int) {
        throw NotImplementedError("Chats.unarchiveChat is not implemented")
    }
}

class ChatsServiceImpl internal constructor(
    private val baseUrl: String,
    private val client: HttpClient,
) : ChatsService {
    override suspend fun listChats(
        sort: ChatSortField?,
        order: SortOrder?,
        availability: ChatAvailability?,
        lastMessageAtAfter: OffsetDateTime?,
        lastMessageAtBefore: OffsetDateTime?,
        personal: Boolean?,
        limit: Int?,
        cursor: String?,
    ): ListChatsResponse {
        val response = client.get("$baseUrl/chats") {
            sort?.let { parameter("sort", it.value) }
            order?.let { parameter("order", it.value) }
            availability?.let { parameter("availability", it.value) }
            lastMessageAtAfter?.let { parameter("last_message_at_after", it.toString()) }
            lastMessageAtBefore?.let { parameter("last_message_at_before", it.toString()) }
            personal?.let { parameter("personal", it) }
            limit?.let { parameter("limit", it) }
            cursor?.let { parameter("cursor", it) }
        }
        return when (response.status.value) {
            200 -> response.body()
            401 -> throw response.body<OAuthError>()
            else -> throw response.body<ApiError>()
        }
    }

    override suspend fun listChatsAll(
        sort: ChatSortField?,
        order: SortOrder?,
        availability: ChatAvailability?,
        lastMessageAtAfter: OffsetDateTime?,
        lastMessageAtBefore: OffsetDateTime?,
        personal: Boolean?,
        limit: Int?,
    ): List<Chat> {
        val items = mutableListOf<Chat>()
        var cursor: String? = null
        do {
            val response = listChats(
                sort = sort,
                order = order,
                availability = availability,
                lastMessageAtAfter = lastMessageAtAfter,
                lastMessageAtBefore = lastMessageAtBefore,
                personal = personal,
                limit = limit,
                cursor = cursor,
            )
            items.addAll(response.data)
            if (response.data.isEmpty()) break
            cursor = response.meta.paginate.nextPage
        } while (true)
        return items
    }

    override suspend fun getChat(id: Int): Chat {
        val response = client.get("$baseUrl/chats/$id")
        return when (response.status.value) {
            200 -> response.body<ChatDataWrapper>().data
            401 -> throw response.body<OAuthError>()
            else -> throw response.body<ApiError>()
        }
    }

    override suspend fun createChat(request: ChatCreateRequest): Chat {
        val response = client.post("$baseUrl/chats") {
            contentType(ContentType.Application.Json)
            setBody(request)
        }
        return when (response.status.value) {
            201 -> response.body<ChatDataWrapper>().data
            401 -> throw response.body<OAuthError>()
            else -> throw response.body<ApiError>()
        }
    }

    override suspend fun updateChat(id: Int, request: ChatUpdateRequest): Chat {
        val response = client.put("$baseUrl/chats/$id") {
            contentType(ContentType.Application.Json)
            setBody(request)
        }
        return when (response.status.value) {
            200 -> response.body<ChatDataWrapper>().data
            401 -> throw response.body<OAuthError>()
            else -> throw response.body<ApiError>()
        }
    }

    override suspend fun archiveChat(id: Int) {
        val response = client.put("$baseUrl/chats/$id/archive")
        when (response.status.value) {
            204 -> return
            401 -> throw response.body<OAuthError>()
            else -> throw response.body<ApiError>()
        }
    }

    override suspend fun unarchiveChat(id: Int) {
        val response = client.put("$baseUrl/chats/$id/unarchive")
        when (response.status.value) {
            204 -> return
            401 -> throw response.body<OAuthError>()
            else -> throw response.body<ApiError>()
        }
    }
}

interface CommonService {
    suspend fun downloadExport(id: Int): String {
        throw NotImplementedError("Common.downloadExport is not implemented")
    }

    suspend fun listProperties(entityType: SearchEntityType): ListPropertiesResponse {
        throw NotImplementedError("Common.listProperties is not implemented")
    }

    suspend fun requestExport(request: ExportRequest) {
        throw NotImplementedError("Common.requestExport is not implemented")
    }

    suspend fun uploadFile(directUrl: String, request: FileUploadRequest) {
        throw NotImplementedError("Common.uploadFile is not implemented")
    }

    suspend fun getUploadParams(): UploadParams {
        throw NotImplementedError("Common.getUploadParams is not implemented")
    }
}

class CommonServiceImpl internal constructor(
    private val baseUrl: String,
    private val client: HttpClient,
) : CommonService {
    override suspend fun downloadExport(id: Int): String {
        val response = client.get("$baseUrl/chats/exports/$id")
        return when (response.status.value) {
            302 -> response.headers[HttpHeaders.Location]
                ?: error("Missing Location header in redirect response")
            401 -> throw response.body<OAuthError>()
            else -> throw response.body<ApiError>()
        }
    }

    override suspend fun listProperties(entityType: SearchEntityType): ListPropertiesResponse {
        val response = client.get("$baseUrl/custom_properties") {
            parameter("entity_type", entityType.value)
        }
        return when (response.status.value) {
            200 -> response.body()
            401 -> throw response.body<OAuthError>()
            else -> throw response.body<ApiError>()
        }
    }

    override suspend fun requestExport(request: ExportRequest) {
        val response = client.post("$baseUrl/chats/exports") {
            contentType(ContentType.Application.Json)
            setBody(request)
        }
        when (response.status.value) {
            204 -> return
            401 -> throw response.body<OAuthError>()
            else -> throw response.body<ApiError>()
        }
    }

    override suspend fun uploadFile(directUrl: String, request: FileUploadRequest) {
        val response = client.submitFormWithBinaryData(
            directUrl,
            formData {
                append("Content-Disposition", request.contentDisposition)
                append("acl", request.acl)
                append("policy", request.policy)
                append("x-amz-credential", request.xAmzCredential)
                append("x-amz-algorithm", request.xAmzAlgorithm)
                append("x-amz-date", request.xAmzDate)
                append("x-amz-signature", request.xAmzSignature)
                append("key", request.key)
                append("file", request.file, Headers.build {
                    append(HttpHeaders.ContentDisposition, "filename=\"file\"")
                })
            },
        ) {
            headers.remove(HttpHeaders.Authorization)
        }
        when (response.status.value) {
            204 -> return
            else -> throw response.body<ApiError>()
        }
    }

    override suspend fun getUploadParams(): UploadParams {
        val response = client.post("$baseUrl/uploads")
        return when (response.status.value) {
            201 -> response.body()
            401 -> throw response.body<OAuthError>()
            else -> throw response.body<ApiError>()
        }
    }
}

interface MembersService {
    suspend fun listMembers(
        id: Int,
        role: ChatMemberRoleFilter? = null,
        limit: Int? = null,
        cursor: String? = null,
    ): ListMembersResponse {
        throw NotImplementedError("Members.listMembers is not implemented")
    }

    suspend fun listMembersAll(
        id: Int,
        role: ChatMemberRoleFilter? = null,
        limit: Int? = null,
    ): List<User> {
        throw NotImplementedError("Members.listMembersAll is not implemented")
    }

    suspend fun addTags(id: Int, groupTagIds: List<Int>) {
        throw NotImplementedError("Members.addTags is not implemented")
    }

    suspend fun addMembers(id: Int, request: AddMembersRequest) {
        throw NotImplementedError("Members.addMembers is not implemented")
    }

    suspend fun updateMemberRole(
        id: Int,
        userId: Int,
        role: ChatMemberRole,
    ) {
        throw NotImplementedError("Members.updateMemberRole is not implemented")
    }

    suspend fun removeTag(id: Int, tagId: Int) {
        throw NotImplementedError("Members.removeTag is not implemented")
    }

    suspend fun leaveChat(id: Int) {
        throw NotImplementedError("Members.leaveChat is not implemented")
    }

    suspend fun removeMember(id: Int, userId: Int) {
        throw NotImplementedError("Members.removeMember is not implemented")
    }
}

class MembersServiceImpl internal constructor(
    private val baseUrl: String,
    private val client: HttpClient,
) : MembersService {
    override suspend fun listMembers(
        id: Int,
        role: ChatMemberRoleFilter?,
        limit: Int?,
        cursor: String?,
    ): ListMembersResponse {
        val response = client.get("$baseUrl/chats/$id/members") {
            role?.let { parameter("role", it.value) }
            limit?.let { parameter("limit", it) }
            cursor?.let { parameter("cursor", it) }
        }
        return when (response.status.value) {
            200 -> response.body()
            401 -> throw response.body<OAuthError>()
            else -> throw response.body<ApiError>()
        }
    }

    override suspend fun listMembersAll(
        id: Int,
        role: ChatMemberRoleFilter?,
        limit: Int?,
    ): List<User> {
        val items = mutableListOf<User>()
        var cursor: String? = null
        do {
            val response = listMembers(
                id = id,
                role = role,
                limit = limit,
                cursor = cursor,
            )
            items.addAll(response.data)
            if (response.data.isEmpty()) break
            cursor = response.meta.paginate.nextPage
        } while (true)
        return items
    }

    override suspend fun addTags(id: Int, groupTagIds: List<Int>) {
        val response = client.post("$baseUrl/chats/$id/group_tags") {
            contentType(ContentType.Application.Json)
            setBody(AddTagsRequest(groupTagIds = groupTagIds))
        }
        when (response.status.value) {
            204 -> return
            401 -> throw response.body<OAuthError>()
            else -> throw response.body<ApiError>()
        }
    }

    override suspend fun addMembers(id: Int, request: AddMembersRequest) {
        val response = client.post("$baseUrl/chats/$id/members") {
            contentType(ContentType.Application.Json)
            setBody(request)
        }
        when (response.status.value) {
            204 -> return
            401 -> throw response.body<OAuthError>()
            else -> throw response.body<ApiError>()
        }
    }

    override suspend fun updateMemberRole(
        id: Int,
        userId: Int,
        role: ChatMemberRole,
    ) {
        val response = client.put("$baseUrl/chats/$id/members/$userId") {
            contentType(ContentType.Application.Json)
            setBody(UpdateMemberRoleRequest(role = role))
        }
        when (response.status.value) {
            204 -> return
            401 -> throw response.body<OAuthError>()
            else -> throw response.body<ApiError>()
        }
    }

    override suspend fun removeTag(id: Int, tagId: Int) {
        val response = client.delete("$baseUrl/chats/$id/group_tags/$tagId")
        when (response.status.value) {
            204 -> return
            401 -> throw response.body<OAuthError>()
            else -> throw response.body<ApiError>()
        }
    }

    override suspend fun leaveChat(id: Int) {
        val response = client.delete("$baseUrl/chats/$id/leave")
        when (response.status.value) {
            204 -> return
            401 -> throw response.body<OAuthError>()
            else -> throw response.body<ApiError>()
        }
    }

    override suspend fun removeMember(id: Int, userId: Int) {
        val response = client.delete("$baseUrl/chats/$id/members/$userId")
        when (response.status.value) {
            204 -> return
            401 -> throw response.body<OAuthError>()
            else -> throw response.body<ApiError>()
        }
    }
}

interface GroupTagsService {
    suspend fun listTags(
        names: List<String>? = null,
        limit: Int? = null,
        cursor: String? = null,
    ): ListTagsResponse {
        throw NotImplementedError("Group tags.listTags is not implemented")
    }

    suspend fun listTagsAll(names: List<String>? = null, limit: Int? = null): List<GroupTag> {
        throw NotImplementedError("Group tags.listTagsAll is not implemented")
    }

    suspend fun getTag(id: Int): GroupTag {
        throw NotImplementedError("Group tags.getTag is not implemented")
    }

    suspend fun getTagUsers(
        id: Int,
        limit: Int? = null,
        cursor: String? = null,
    ): GetTagUsersResponse {
        throw NotImplementedError("Group tags.getTagUsers is not implemented")
    }

    suspend fun getTagUsersAll(id: Int, limit: Int? = null): List<User> {
        throw NotImplementedError("Group tags.getTagUsersAll is not implemented")
    }

    suspend fun createTag(request: GroupTagRequest): GroupTag {
        throw NotImplementedError("Group tags.createTag is not implemented")
    }

    suspend fun updateTag(id: Int, request: GroupTagRequest): GroupTag {
        throw NotImplementedError("Group tags.updateTag is not implemented")
    }

    suspend fun deleteTag(id: Int) {
        throw NotImplementedError("Group tags.deleteTag is not implemented")
    }
}

class GroupTagsServiceImpl internal constructor(
    private val baseUrl: String,
    private val client: HttpClient,
) : GroupTagsService {
    override suspend fun listTags(
        names: List<String>?,
        limit: Int?,
        cursor: String?,
    ): ListTagsResponse {
        val response = client.get("$baseUrl/group_tags") {
            names?.forEach { parameter("names[]", it) }
            limit?.let { parameter("limit", it) }
            cursor?.let { parameter("cursor", it) }
        }
        return when (response.status.value) {
            200 -> response.body()
            401 -> throw response.body<OAuthError>()
            else -> throw response.body<ApiError>()
        }
    }

    override suspend fun listTagsAll(names: List<String>?, limit: Int?): List<GroupTag> {
        val items = mutableListOf<GroupTag>()
        var cursor: String? = null
        do {
            val response = listTags(names = names, limit = limit, cursor = cursor)
            items.addAll(response.data)
            if (response.data.isEmpty()) break
            cursor = response.meta.paginate.nextPage
        } while (true)
        return items
    }

    override suspend fun getTag(id: Int): GroupTag {
        val response = client.get("$baseUrl/group_tags/$id")
        return when (response.status.value) {
            200 -> response.body<GroupTagDataWrapper>().data
            401 -> throw response.body<OAuthError>()
            else -> throw response.body<ApiError>()
        }
    }

    override suspend fun getTagUsers(
        id: Int,
        limit: Int?,
        cursor: String?,
    ): GetTagUsersResponse {
        val response = client.get("$baseUrl/group_tags/$id/users") {
            limit?.let { parameter("limit", it) }
            cursor?.let { parameter("cursor", it) }
        }
        return when (response.status.value) {
            200 -> response.body()
            401 -> throw response.body<OAuthError>()
            else -> throw response.body<ApiError>()
        }
    }

    override suspend fun getTagUsersAll(id: Int, limit: Int?): List<User> {
        val items = mutableListOf<User>()
        var cursor: String? = null
        do {
            val response = getTagUsers(id = id, limit = limit, cursor = cursor)
            items.addAll(response.data)
            if (response.data.isEmpty()) break
            cursor = response.meta.paginate.nextPage
        } while (true)
        return items
    }

    override suspend fun createTag(request: GroupTagRequest): GroupTag {
        val response = client.post("$baseUrl/group_tags") {
            contentType(ContentType.Application.Json)
            setBody(request)
        }
        return when (response.status.value) {
            201 -> response.body<GroupTagDataWrapper>().data
            401 -> throw response.body<OAuthError>()
            else -> throw response.body<ApiError>()
        }
    }

    override suspend fun updateTag(id: Int, request: GroupTagRequest): GroupTag {
        val response = client.put("$baseUrl/group_tags/$id") {
            contentType(ContentType.Application.Json)
            setBody(request)
        }
        return when (response.status.value) {
            200 -> response.body<GroupTagDataWrapper>().data
            401 -> throw response.body<OAuthError>()
            else -> throw response.body<ApiError>()
        }
    }

    override suspend fun deleteTag(id: Int) {
        val response = client.delete("$baseUrl/group_tags/$id")
        when (response.status.value) {
            204 -> return
            401 -> throw response.body<OAuthError>()
            else -> throw response.body<ApiError>()
        }
    }
}

interface MessagesService {
    suspend fun listChatMessages(
        chatId: Int,
        sort: MessageSortField? = null,
        order: SortOrder? = null,
        limit: Int? = null,
        cursor: String? = null,
    ): ListChatMessagesResponse {
        throw NotImplementedError("Messages.listChatMessages is not implemented")
    }

    suspend fun listChatMessagesAll(
        chatId: Int,
        sort: MessageSortField? = null,
        order: SortOrder? = null,
        limit: Int? = null,
    ): List<Message> {
        throw NotImplementedError("Messages.listChatMessagesAll is not implemented")
    }

    suspend fun getMessage(id: Int): Message {
        throw NotImplementedError("Messages.getMessage is not implemented")
    }

    suspend fun createMessage(request: MessageCreateRequest): Message {
        throw NotImplementedError("Messages.createMessage is not implemented")
    }

    suspend fun pinMessage(id: Int) {
        throw NotImplementedError("Messages.pinMessage is not implemented")
    }

    suspend fun updateMessage(id: Int, request: MessageUpdateRequest): Message {
        throw NotImplementedError("Messages.updateMessage is not implemented")
    }

    suspend fun deleteMessage(id: Int) {
        throw NotImplementedError("Messages.deleteMessage is not implemented")
    }

    suspend fun unpinMessage(id: Int) {
        throw NotImplementedError("Messages.unpinMessage is not implemented")
    }
}

class MessagesServiceImpl internal constructor(
    private val baseUrl: String,
    private val client: HttpClient,
) : MessagesService {
    override suspend fun listChatMessages(
        chatId: Int,
        sort: MessageSortField?,
        order: SortOrder?,
        limit: Int?,
        cursor: String?,
    ): ListChatMessagesResponse {
        val response = client.get("$baseUrl/messages") {
            parameter("chat_id", chatId)
            sort?.let { parameter("sort", it.value) }
            order?.let { parameter("order", it.value) }
            limit?.let { parameter("limit", it) }
            cursor?.let { parameter("cursor", it) }
        }
        return when (response.status.value) {
            200 -> response.body()
            401 -> throw response.body<OAuthError>()
            else -> throw response.body<ApiError>()
        }
    }

    override suspend fun listChatMessagesAll(
        chatId: Int,
        sort: MessageSortField?,
        order: SortOrder?,
        limit: Int?,
    ): List<Message> {
        val items = mutableListOf<Message>()
        var cursor: String? = null
        do {
            val response = listChatMessages(
                chatId = chatId,
                sort = sort,
                order = order,
                limit = limit,
                cursor = cursor,
            )
            items.addAll(response.data)
            if (response.data.isEmpty()) break
            cursor = response.meta.paginate.nextPage
        } while (true)
        return items
    }

    override suspend fun getMessage(id: Int): Message {
        val response = client.get("$baseUrl/messages/$id")
        return when (response.status.value) {
            200 -> response.body<MessageDataWrapper>().data
            401 -> throw response.body<OAuthError>()
            else -> throw response.body<ApiError>()
        }
    }

    override suspend fun createMessage(request: MessageCreateRequest): Message {
        val response = client.post("$baseUrl/messages") {
            contentType(ContentType.Application.Json)
            setBody(request)
        }
        return when (response.status.value) {
            201 -> response.body<MessageDataWrapper>().data
            401 -> throw response.body<OAuthError>()
            else -> throw response.body<ApiError>()
        }
    }

    override suspend fun pinMessage(id: Int) {
        val response = client.post("$baseUrl/messages/$id/pin")
        when (response.status.value) {
            204 -> return
            401 -> throw response.body<OAuthError>()
            else -> throw response.body<ApiError>()
        }
    }

    override suspend fun updateMessage(id: Int, request: MessageUpdateRequest): Message {
        val response = client.put("$baseUrl/messages/$id") {
            contentType(ContentType.Application.Json)
            setBody(request)
        }
        return when (response.status.value) {
            200 -> response.body<MessageDataWrapper>().data
            401 -> throw response.body<OAuthError>()
            else -> throw response.body<ApiError>()
        }
    }

    override suspend fun deleteMessage(id: Int) {
        val response = client.delete("$baseUrl/messages/$id")
        when (response.status.value) {
            204 -> return
            401 -> throw response.body<OAuthError>()
            else -> throw response.body<ApiError>()
        }
    }

    override suspend fun unpinMessage(id: Int) {
        val response = client.delete("$baseUrl/messages/$id/pin")
        when (response.status.value) {
            204 -> return
            401 -> throw response.body<OAuthError>()
            else -> throw response.body<ApiError>()
        }
    }
}

interface LinkPreviewsService {
    suspend fun createLinkPreviews(id: Int, request: LinkPreviewsRequest) {
        throw NotImplementedError("Link Previews.createLinkPreviews is not implemented")
    }
}

class LinkPreviewsServiceImpl internal constructor(
    private val baseUrl: String,
    private val client: HttpClient,
) : LinkPreviewsService {
    override suspend fun createLinkPreviews(id: Int, request: LinkPreviewsRequest) {
        val response = client.post("$baseUrl/messages/$id/link_previews") {
            contentType(ContentType.Application.Json)
            setBody(request)
        }
        when (response.status.value) {
            204 -> return
            401 -> throw response.body<OAuthError>()
            else -> throw response.body<ApiError>()
        }
    }
}

interface ReactionsService {
    suspend fun listReactions(
        id: Int,
        limit: Int? = null,
        cursor: String? = null,
    ): ListReactionsResponse {
        throw NotImplementedError("Reactions.listReactions is not implemented")
    }

    suspend fun listReactionsAll(id: Int, limit: Int? = null): List<Reaction> {
        throw NotImplementedError("Reactions.listReactionsAll is not implemented")
    }

    suspend fun addReaction(id: Int, request: ReactionRequest): Reaction {
        throw NotImplementedError("Reactions.addReaction is not implemented")
    }

    suspend fun removeReaction(
        id: Int,
        code: String,
        name: String? = null,
    ) {
        throw NotImplementedError("Reactions.removeReaction is not implemented")
    }
}

class ReactionsServiceImpl internal constructor(
    private val baseUrl: String,
    private val client: HttpClient,
) : ReactionsService {
    override suspend fun listReactions(
        id: Int,
        limit: Int?,
        cursor: String?,
    ): ListReactionsResponse {
        val response = client.get("$baseUrl/messages/$id/reactions") {
            limit?.let { parameter("limit", it) }
            cursor?.let { parameter("cursor", it) }
        }
        return when (response.status.value) {
            200 -> response.body()
            401 -> throw response.body<OAuthError>()
            else -> throw response.body<ApiError>()
        }
    }

    override suspend fun listReactionsAll(id: Int, limit: Int?): List<Reaction> {
        val items = mutableListOf<Reaction>()
        var cursor: String? = null
        do {
            val response = listReactions(id = id, limit = limit, cursor = cursor)
            items.addAll(response.data)
            if (response.data.isEmpty()) break
            cursor = response.meta.paginate.nextPage
        } while (true)
        return items
    }

    override suspend fun addReaction(id: Int, request: ReactionRequest): Reaction {
        val response = client.post("$baseUrl/messages/$id/reactions") {
            contentType(ContentType.Application.Json)
            setBody(request)
        }
        return when (response.status.value) {
            201 -> response.body()
            401 -> throw response.body<OAuthError>()
            else -> throw response.body<ApiError>()
        }
    }

    override suspend fun removeReaction(
        id: Int,
        code: String,
        name: String?,
    ) {
        val response = client.delete("$baseUrl/messages/$id/reactions") {
            parameter("code", code)
            name?.let { parameter("name", it) }
        }
        when (response.status.value) {
            204 -> return
            401 -> throw response.body<OAuthError>()
            else -> throw response.body<ApiError>()
        }
    }
}

interface ReadMembersService {
    suspend fun listReadMembers(
        id: Int,
        limit: Int? = null,
        cursor: String? = null,
    ): Any {
        throw NotImplementedError("Read members.listReadMembers is not implemented")
    }
}

class ReadMembersServiceImpl internal constructor(
    private val baseUrl: String,
    private val client: HttpClient,
) : ReadMembersService {
    override suspend fun listReadMembers(
        id: Int,
        limit: Int?,
        cursor: String?,
    ): Any {
        val response = client.get("$baseUrl/messages/$id/read_member_ids") {
            limit?.let { parameter("limit", it) }
            cursor?.let { parameter("cursor", it) }
        }
        return when (response.status.value) {
            200 -> response.body()
            401 -> throw response.body<OAuthError>()
            else -> throw response.body<ApiError>()
        }
    }
}

interface ThreadsService {
    suspend fun getThread(id: Int): Thread {
        throw NotImplementedError("Threads.getThread is not implemented")
    }

    suspend fun createThread(id: Int): Thread {
        throw NotImplementedError("Threads.createThread is not implemented")
    }
}

class ThreadsServiceImpl internal constructor(
    private val baseUrl: String,
    private val client: HttpClient,
) : ThreadsService {
    override suspend fun getThread(id: Int): Thread {
        val response = client.get("$baseUrl/threads/$id")
        return when (response.status.value) {
            200 -> response.body<ThreadDataWrapper>().data
            401 -> throw response.body<OAuthError>()
            else -> throw response.body<ApiError>()
        }
    }

    override suspend fun createThread(id: Int): Thread {
        val response = client.post("$baseUrl/messages/$id/thread")
        return when (response.status.value) {
            201 -> response.body<ThreadDataWrapper>().data
            401 -> throw response.body<OAuthError>()
            else -> throw response.body<ApiError>()
        }
    }
}

interface ProfileService {
    suspend fun getTokenInfo(): AccessTokenInfo {
        throw NotImplementedError("Profile.getTokenInfo is not implemented")
    }

    suspend fun getProfile(): User {
        throw NotImplementedError("Profile.getProfile is not implemented")
    }

    suspend fun getStatus(): Any {
        throw NotImplementedError("Profile.getStatus is not implemented")
    }

    suspend fun updateProfileAvatar(image: ByteArray): AvatarData {
        throw NotImplementedError("Profile.updateProfileAvatar is not implemented")
    }

    suspend fun updateStatus(request: StatusUpdateRequest): UserStatus {
        throw NotImplementedError("Profile.updateStatus is not implemented")
    }

    suspend fun deleteProfileAvatar() {
        throw NotImplementedError("Profile.deleteProfileAvatar is not implemented")
    }

    suspend fun deleteStatus() {
        throw NotImplementedError("Profile.deleteStatus is not implemented")
    }
}

class ProfileServiceImpl internal constructor(
    private val baseUrl: String,
    private val client: HttpClient,
) : ProfileService {
    override suspend fun getTokenInfo(): AccessTokenInfo {
        val response = client.get("$baseUrl/oauth/token/info")
        return when (response.status.value) {
            200 -> response.body<AccessTokenInfoDataWrapper>().data
            401 -> throw response.body<OAuthError>()
            else -> throw response.body<ApiError>()
        }
    }

    override suspend fun getProfile(): User {
        val response = client.get("$baseUrl/profile")
        return when (response.status.value) {
            200 -> response.body<UserDataWrapper>().data
            401 -> throw response.body<OAuthError>()
            else -> throw response.body<ApiError>()
        }
    }

    override suspend fun getStatus(): Any {
        val response = client.get("$baseUrl/profile/status")
        return when (response.status.value) {
            200 -> response.body()
            401 -> throw response.body<OAuthError>()
            else -> throw response.body<ApiError>()
        }
    }

    override suspend fun updateProfileAvatar(image: ByteArray): AvatarData {
        val response = client.submitFormWithBinaryData(
            "$baseUrl/profile/avatar",
            formData {
                append("image", image, Headers.build {
                    append(HttpHeaders.ContentDisposition, "filename=\"image\"")
                })
            },
        )
        return when (response.status.value) {
            200 -> response.body<AvatarDataDataWrapper>().data
            401 -> throw response.body<OAuthError>()
            else -> throw response.body<ApiError>()
        }
    }

    override suspend fun updateStatus(request: StatusUpdateRequest): UserStatus {
        val response = client.put("$baseUrl/profile/status") {
            contentType(ContentType.Application.Json)
            setBody(request)
        }
        return when (response.status.value) {
            200 -> response.body<UserStatusDataWrapper>().data
            401 -> throw response.body<OAuthError>()
            else -> throw response.body<ApiError>()
        }
    }

    override suspend fun deleteProfileAvatar() {
        val response = client.delete("$baseUrl/profile/avatar")
        when (response.status.value) {
            204 -> return
            401 -> throw response.body<OAuthError>()
            else -> throw response.body<ApiError>()
        }
    }

    override suspend fun deleteStatus() {
        val response = client.delete("$baseUrl/profile/status")
        when (response.status.value) {
            204 -> return
            401 -> throw response.body<OAuthError>()
            else -> throw response.body<ApiError>()
        }
    }
}

interface SearchService {
    suspend fun searchChats(
        query: String? = null,
        limit: Int? = null,
        cursor: String? = null,
        order: SortOrder? = null,
        createdFrom: OffsetDateTime? = null,
        createdTo: OffsetDateTime? = null,
        active: Boolean? = null,
        chatSubtype: ChatSubtype? = null,
        personal: Boolean? = null,
    ): SearchChatsResponse {
        throw NotImplementedError("Search.searchChats is not implemented")
    }

    suspend fun searchChatsAll(
        query: String? = null,
        limit: Int? = null,
        order: SortOrder? = null,
        createdFrom: OffsetDateTime? = null,
        createdTo: OffsetDateTime? = null,
        active: Boolean? = null,
        chatSubtype: ChatSubtype? = null,
        personal: Boolean? = null,
    ): List<Chat> {
        throw NotImplementedError("Search.searchChatsAll is not implemented")
    }

    suspend fun searchMessages(
        query: String? = null,
        limit: Int? = null,
        cursor: String? = null,
        order: SortOrder? = null,
        createdFrom: OffsetDateTime? = null,
        createdTo: OffsetDateTime? = null,
        chatIds: List<Int>? = null,
        userIds: List<Int>? = null,
        active: Boolean? = null,
    ): SearchMessagesResponse {
        throw NotImplementedError("Search.searchMessages is not implemented")
    }

    suspend fun searchMessagesAll(
        query: String? = null,
        limit: Int? = null,
        order: SortOrder? = null,
        createdFrom: OffsetDateTime? = null,
        createdTo: OffsetDateTime? = null,
        chatIds: List<Int>? = null,
        userIds: List<Int>? = null,
        active: Boolean? = null,
    ): List<Message> {
        throw NotImplementedError("Search.searchMessagesAll is not implemented")
    }

    suspend fun searchUsers(
        query: String? = null,
        limit: Int? = null,
        cursor: String? = null,
        sort: SearchSortOrder? = null,
        order: SortOrder? = null,
        createdFrom: OffsetDateTime? = null,
        createdTo: OffsetDateTime? = null,
        companyRoles: List<UserRole>? = null,
    ): SearchUsersResponse {
        throw NotImplementedError("Search.searchUsers is not implemented")
    }

    suspend fun searchUsersAll(
        query: String? = null,
        limit: Int? = null,
        sort: SearchSortOrder? = null,
        order: SortOrder? = null,
        createdFrom: OffsetDateTime? = null,
        createdTo: OffsetDateTime? = null,
        companyRoles: List<UserRole>? = null,
    ): List<User> {
        throw NotImplementedError("Search.searchUsersAll is not implemented")
    }
}

class SearchServiceImpl internal constructor(
    private val baseUrl: String,
    private val client: HttpClient,
) : SearchService {
    override suspend fun searchChats(
        query: String?,
        limit: Int?,
        cursor: String?,
        order: SortOrder?,
        createdFrom: OffsetDateTime?,
        createdTo: OffsetDateTime?,
        active: Boolean?,
        chatSubtype: ChatSubtype?,
        personal: Boolean?,
    ): SearchChatsResponse {
        val response = client.get("$baseUrl/search/chats") {
            query?.let { parameter("query", it) }
            limit?.let { parameter("limit", it) }
            cursor?.let { parameter("cursor", it) }
            order?.let { parameter("order", it.value) }
            createdFrom?.let { parameter("created_from", it.toString()) }
            createdTo?.let { parameter("created_to", it.toString()) }
            active?.let { parameter("active", it) }
            chatSubtype?.let { parameter("chat_subtype", it.value) }
            personal?.let { parameter("personal", it) }
        }
        return when (response.status.value) {
            200 -> response.body()
            401 -> throw response.body<OAuthError>()
            else -> throw response.body<ApiError>()
        }
    }

    override suspend fun searchChatsAll(
        query: String?,
        limit: Int?,
        order: SortOrder?,
        createdFrom: OffsetDateTime?,
        createdTo: OffsetDateTime?,
        active: Boolean?,
        chatSubtype: ChatSubtype?,
        personal: Boolean?,
    ): List<Chat> {
        val items = mutableListOf<Chat>()
        var cursor: String? = null
        do {
            val response = searchChats(
                query = query,
                limit = limit,
                cursor = cursor,
                order = order,
                createdFrom = createdFrom,
                createdTo = createdTo,
                active = active,
                chatSubtype = chatSubtype,
                personal = personal,
            )
            items.addAll(response.data)
            if (response.data.isEmpty()) break
            cursor = response.meta.paginate.nextPage
        } while (true)
        return items
    }

    override suspend fun searchMessages(
        query: String?,
        limit: Int?,
        cursor: String?,
        order: SortOrder?,
        createdFrom: OffsetDateTime?,
        createdTo: OffsetDateTime?,
        chatIds: List<Int>?,
        userIds: List<Int>?,
        active: Boolean?,
    ): SearchMessagesResponse {
        val response = client.get("$baseUrl/search/messages") {
            query?.let { parameter("query", it) }
            limit?.let { parameter("limit", it) }
            cursor?.let { parameter("cursor", it) }
            order?.let { parameter("order", it.value) }
            createdFrom?.let { parameter("created_from", it.toString()) }
            createdTo?.let { parameter("created_to", it.toString()) }
            chatIds?.forEach { parameter("chat_ids[]", it) }
            userIds?.forEach { parameter("user_ids[]", it) }
            active?.let { parameter("active", it) }
        }
        return when (response.status.value) {
            200 -> response.body()
            401 -> throw response.body<OAuthError>()
            else -> throw response.body<ApiError>()
        }
    }

    override suspend fun searchMessagesAll(
        query: String?,
        limit: Int?,
        order: SortOrder?,
        createdFrom: OffsetDateTime?,
        createdTo: OffsetDateTime?,
        chatIds: List<Int>?,
        userIds: List<Int>?,
        active: Boolean?,
    ): List<Message> {
        val items = mutableListOf<Message>()
        var cursor: String? = null
        do {
            val response = searchMessages(
                query = query,
                limit = limit,
                cursor = cursor,
                order = order,
                createdFrom = createdFrom,
                createdTo = createdTo,
                chatIds = chatIds,
                userIds = userIds,
                active = active,
            )
            items.addAll(response.data)
            if (response.data.isEmpty()) break
            cursor = response.meta.paginate.nextPage
        } while (true)
        return items
    }

    override suspend fun searchUsers(
        query: String?,
        limit: Int?,
        cursor: String?,
        sort: SearchSortOrder?,
        order: SortOrder?,
        createdFrom: OffsetDateTime?,
        createdTo: OffsetDateTime?,
        companyRoles: List<UserRole>?,
    ): SearchUsersResponse {
        val response = client.get("$baseUrl/search/users") {
            query?.let { parameter("query", it) }
            limit?.let { parameter("limit", it) }
            cursor?.let { parameter("cursor", it) }
            sort?.let { parameter("sort", it.value) }
            order?.let { parameter("order", it.value) }
            createdFrom?.let { parameter("created_from", it.toString()) }
            createdTo?.let { parameter("created_to", it.toString()) }
            companyRoles?.forEach { parameter("company_roles[]", it.value) }
        }
        return when (response.status.value) {
            200 -> response.body()
            401 -> throw response.body<OAuthError>()
            else -> throw response.body<ApiError>()
        }
    }

    override suspend fun searchUsersAll(
        query: String?,
        limit: Int?,
        sort: SearchSortOrder?,
        order: SortOrder?,
        createdFrom: OffsetDateTime?,
        createdTo: OffsetDateTime?,
        companyRoles: List<UserRole>?,
    ): List<User> {
        val items = mutableListOf<User>()
        var cursor: String? = null
        do {
            val response = searchUsers(
                query = query,
                limit = limit,
                cursor = cursor,
                sort = sort,
                order = order,
                createdFrom = createdFrom,
                createdTo = createdTo,
                companyRoles = companyRoles,
            )
            items.addAll(response.data)
            if (response.data.isEmpty()) break
            cursor = response.meta.paginate.nextPage
        } while (true)
        return items
    }
}

interface TasksService {
    suspend fun listTasks(limit: Int? = null, cursor: String? = null): ListTasksResponse {
        throw NotImplementedError("Tasks.listTasks is not implemented")
    }

    suspend fun listTasksAll(limit: Int? = null): List<Task> {
        throw NotImplementedError("Tasks.listTasksAll is not implemented")
    }

    suspend fun getTask(id: Int): Task {
        throw NotImplementedError("Tasks.getTask is not implemented")
    }

    suspend fun createTask(request: TaskCreateRequest): Task {
        throw NotImplementedError("Tasks.createTask is not implemented")
    }

    suspend fun updateTask(id: Int, request: TaskUpdateRequest): Task {
        throw NotImplementedError("Tasks.updateTask is not implemented")
    }

    suspend fun deleteTask(id: Int) {
        throw NotImplementedError("Tasks.deleteTask is not implemented")
    }
}

class TasksServiceImpl internal constructor(
    private val baseUrl: String,
    private val client: HttpClient,
) : TasksService {
    override suspend fun listTasks(limit: Int?, cursor: String?): ListTasksResponse {
        val response = client.get("$baseUrl/tasks") {
            limit?.let { parameter("limit", it) }
            cursor?.let { parameter("cursor", it) }
        }
        return when (response.status.value) {
            200 -> response.body()
            401 -> throw response.body<OAuthError>()
            else -> throw response.body<ApiError>()
        }
    }

    override suspend fun listTasksAll(limit: Int?): List<Task> {
        val items = mutableListOf<Task>()
        var cursor: String? = null
        do {
            val response = listTasks(limit = limit, cursor = cursor)
            items.addAll(response.data)
            if (response.data.isEmpty()) break
            cursor = response.meta.paginate.nextPage
        } while (true)
        return items
    }

    override suspend fun getTask(id: Int): Task {
        val response = client.get("$baseUrl/tasks/$id")
        return when (response.status.value) {
            200 -> response.body<TaskDataWrapper>().data
            401 -> throw response.body<OAuthError>()
            else -> throw response.body<ApiError>()
        }
    }

    override suspend fun createTask(request: TaskCreateRequest): Task {
        val response = client.post("$baseUrl/tasks") {
            contentType(ContentType.Application.Json)
            setBody(request)
        }
        return when (response.status.value) {
            201 -> response.body<TaskDataWrapper>().data
            401 -> throw response.body<OAuthError>()
            else -> throw response.body<ApiError>()
        }
    }

    override suspend fun updateTask(id: Int, request: TaskUpdateRequest): Task {
        val response = client.put("$baseUrl/tasks/$id") {
            contentType(ContentType.Application.Json)
            setBody(request)
        }
        return when (response.status.value) {
            200 -> response.body<TaskDataWrapper>().data
            401 -> throw response.body<OAuthError>()
            else -> throw response.body<ApiError>()
        }
    }

    override suspend fun deleteTask(id: Int) {
        val response = client.delete("$baseUrl/tasks/$id")
        when (response.status.value) {
            204 -> return
            401 -> throw response.body<OAuthError>()
            else -> throw response.body<ApiError>()
        }
    }
}

interface UsersService {
    suspend fun listUsers(
        query: String? = null,
        limit: Int? = null,
        cursor: String? = null,
    ): ListUsersResponse {
        throw NotImplementedError("Users.listUsers is not implemented")
    }

    suspend fun listUsersAll(query: String? = null, limit: Int? = null): List<User> {
        throw NotImplementedError("Users.listUsersAll is not implemented")
    }

    suspend fun getUser(id: Int): User {
        throw NotImplementedError("Users.getUser is not implemented")
    }

    suspend fun getUserStatus(userId: Int): Any {
        throw NotImplementedError("Users.getUserStatus is not implemented")
    }

    suspend fun createUser(request: UserCreateRequest): User {
        throw NotImplementedError("Users.createUser is not implemented")
    }

    suspend fun updateUser(id: Int, request: UserUpdateRequest): User {
        throw NotImplementedError("Users.updateUser is not implemented")
    }

    suspend fun updateUserAvatar(userId: Int, image: ByteArray): AvatarData {
        throw NotImplementedError("Users.updateUserAvatar is not implemented")
    }

    suspend fun updateUserStatus(userId: Int, request: StatusUpdateRequest): UserStatus {
        throw NotImplementedError("Users.updateUserStatus is not implemented")
    }

    suspend fun deleteUser(id: Int) {
        throw NotImplementedError("Users.deleteUser is not implemented")
    }

    suspend fun deleteUserAvatar(userId: Int) {
        throw NotImplementedError("Users.deleteUserAvatar is not implemented")
    }

    suspend fun deleteUserStatus(userId: Int) {
        throw NotImplementedError("Users.deleteUserStatus is not implemented")
    }
}

class UsersServiceImpl internal constructor(
    private val baseUrl: String,
    private val client: HttpClient,
) : UsersService {
    override suspend fun listUsers(
        query: String?,
        limit: Int?,
        cursor: String?,
    ): ListUsersResponse {
        val response = client.get("$baseUrl/users") {
            query?.let { parameter("query", it) }
            limit?.let { parameter("limit", it) }
            cursor?.let { parameter("cursor", it) }
        }
        return when (response.status.value) {
            200 -> response.body()
            401 -> throw response.body<OAuthError>()
            else -> throw response.body<ApiError>()
        }
    }

    override suspend fun listUsersAll(query: String?, limit: Int?): List<User> {
        val items = mutableListOf<User>()
        var cursor: String? = null
        do {
            val response = listUsers(query = query, limit = limit, cursor = cursor)
            items.addAll(response.data)
            if (response.data.isEmpty()) break
            cursor = response.meta.paginate.nextPage
        } while (true)
        return items
    }

    override suspend fun getUser(id: Int): User {
        val response = client.get("$baseUrl/users/$id")
        return when (response.status.value) {
            200 -> response.body<UserDataWrapper>().data
            401 -> throw response.body<OAuthError>()
            else -> throw response.body<ApiError>()
        }
    }

    override suspend fun getUserStatus(userId: Int): Any {
        val response = client.get("$baseUrl/users/$userId/status")
        return when (response.status.value) {
            200 -> response.body()
            401 -> throw response.body<OAuthError>()
            else -> throw response.body<ApiError>()
        }
    }

    override suspend fun createUser(request: UserCreateRequest): User {
        val response = client.post("$baseUrl/users") {
            contentType(ContentType.Application.Json)
            setBody(request)
        }
        return when (response.status.value) {
            201 -> response.body<UserDataWrapper>().data
            401 -> throw response.body<OAuthError>()
            else -> throw response.body<ApiError>()
        }
    }

    override suspend fun updateUser(id: Int, request: UserUpdateRequest): User {
        val response = client.put("$baseUrl/users/$id") {
            contentType(ContentType.Application.Json)
            setBody(request)
        }
        return when (response.status.value) {
            200 -> response.body<UserDataWrapper>().data
            401 -> throw response.body<OAuthError>()
            else -> throw response.body<ApiError>()
        }
    }

    override suspend fun updateUserAvatar(userId: Int, image: ByteArray): AvatarData {
        val response = client.submitFormWithBinaryData(
            "$baseUrl/users/$userId/avatar",
            formData {
                append("image", image, Headers.build {
                    append(HttpHeaders.ContentDisposition, "filename=\"image\"")
                })
            },
        )
        return when (response.status.value) {
            200 -> response.body<AvatarDataDataWrapper>().data
            401 -> throw response.body<OAuthError>()
            else -> throw response.body<ApiError>()
        }
    }

    override suspend fun updateUserStatus(userId: Int, request: StatusUpdateRequest): UserStatus {
        val response = client.put("$baseUrl/users/$userId/status") {
            contentType(ContentType.Application.Json)
            setBody(request)
        }
        return when (response.status.value) {
            200 -> response.body<UserStatusDataWrapper>().data
            401 -> throw response.body<OAuthError>()
            else -> throw response.body<ApiError>()
        }
    }

    override suspend fun deleteUser(id: Int) {
        val response = client.delete("$baseUrl/users/$id")
        when (response.status.value) {
            204 -> return
            401 -> throw response.body<OAuthError>()
            else -> throw response.body<ApiError>()
        }
    }

    override suspend fun deleteUserAvatar(userId: Int) {
        val response = client.delete("$baseUrl/users/$userId/avatar")
        when (response.status.value) {
            204 -> return
            401 -> throw response.body<OAuthError>()
            else -> throw response.body<ApiError>()
        }
    }

    override suspend fun deleteUserStatus(userId: Int) {
        val response = client.delete("$baseUrl/users/$userId/status")
        when (response.status.value) {
            204 -> return
            401 -> throw response.body<OAuthError>()
            else -> throw response.body<ApiError>()
        }
    }
}

interface ViewsService {
    suspend fun openView(request: OpenViewRequest) {
        throw NotImplementedError("Views.openView is not implemented")
    }
}

class ViewsServiceImpl internal constructor(
    private val baseUrl: String,
    private val client: HttpClient,
) : ViewsService {
    override suspend fun openView(request: OpenViewRequest) {
        val response = client.post("$baseUrl/views/open") {
            contentType(ContentType.Application.Json)
            setBody(request)
        }
        when (response.status.value) {
            201 -> return
            401 -> throw response.body<OAuthError>()
            else -> throw response.body<ApiError>()
        }
    }
}

const val PACHCA_API_URL = "https://api.pachca.com/api/shared/v1"

class PachcaClient private constructor(
    private val _client: HttpClient?,
    val bots: BotsService,
    val chats: ChatsService,
    val common: CommonService,
    val groupTags: GroupTagsService,
    val linkPreviews: LinkPreviewsService,
    val members: MembersService,
    val messages: MessagesService,
    val profile: ProfileService,
    val reactions: ReactionsService,
    val readMembers: ReadMembersService,
    val search: SearchService,
    val security: SecurityService,
    val tasks: TasksService,
    val threads: ThreadsService,
    val users: UsersService,
    val views: ViewsService
) : Closeable {

    companion object {
        operator fun invoke(
            token: String,
            baseUrl: String = PACHCA_API_URL,
            bots: BotsService? = null,
            chats: ChatsService? = null,
            common: CommonService? = null,
            groupTags: GroupTagsService? = null,
            linkPreviews: LinkPreviewsService? = null,
            members: MembersService? = null,
            messages: MessagesService? = null,
            profile: ProfileService? = null,
            reactions: ReactionsService? = null,
            readMembers: ReadMembersService? = null,
            search: SearchService? = null,
            security: SecurityService? = null,
            tasks: TasksService? = null,
            threads: ThreadsService? = null,
            users: UsersService? = null,
            views: ViewsService? = null
        ): PachcaClient {
            val client = createClient(token)
            return PachcaClient(
                _client = client,
                bots = bots ?: BotsServiceImpl(baseUrl, client),
                chats = chats ?: ChatsServiceImpl(baseUrl, client),
                common = common ?: CommonServiceImpl(baseUrl, client),
                groupTags = groupTags ?: GroupTagsServiceImpl(baseUrl, client),
                linkPreviews = linkPreviews ?: LinkPreviewsServiceImpl(baseUrl, client),
                members = members ?: MembersServiceImpl(baseUrl, client),
                messages = messages ?: MessagesServiceImpl(baseUrl, client),
                profile = profile ?: ProfileServiceImpl(baseUrl, client),
                reactions = reactions ?: ReactionsServiceImpl(baseUrl, client),
                readMembers = readMembers ?: ReadMembersServiceImpl(baseUrl, client),
                search = search ?: SearchServiceImpl(baseUrl, client),
                security = security ?: SecurityServiceImpl(baseUrl, client),
                tasks = tasks ?: TasksServiceImpl(baseUrl, client),
                threads = threads ?: ThreadsServiceImpl(baseUrl, client),
                users = users ?: UsersServiceImpl(baseUrl, client),
                views = views ?: ViewsServiceImpl(baseUrl, client)
            )
        }

        fun stub(
            bots: BotsService = object : BotsService {},
            chats: ChatsService = object : ChatsService {},
            common: CommonService = object : CommonService {},
            groupTags: GroupTagsService = object : GroupTagsService {},
            linkPreviews: LinkPreviewsService = object : LinkPreviewsService {},
            members: MembersService = object : MembersService {},
            messages: MessagesService = object : MessagesService {},
            profile: ProfileService = object : ProfileService {},
            reactions: ReactionsService = object : ReactionsService {},
            readMembers: ReadMembersService = object : ReadMembersService {},
            search: SearchService = object : SearchService {},
            security: SecurityService = object : SecurityService {},
            tasks: TasksService = object : TasksService {},
            threads: ThreadsService = object : ThreadsService {},
            users: UsersService = object : UsersService {},
            views: ViewsService = object : ViewsService {}
        ): PachcaClient = PachcaClient(
            _client = null,
            bots = bots,
            chats = chats,
            common = common,
            groupTags = groupTags,
            linkPreviews = linkPreviews,
            members = members,
            messages = messages,
            profile = profile,
            reactions = reactions,
            readMembers = readMembers,
            search = search,
            security = security,
            tasks = tasks,
            threads = threads,
            users = users,
            views = views
        )

        private fun createClient(token: String): HttpClient = HttpClient {
            expectSuccess = false
            followRedirects = false
            install(ContentNegotiation) { json(Json { explicitNulls = false }) }
            install(HttpRequestRetry) {
                maxRetries = 3
                retryIf { _, response ->
                    response.status.value == 429 || response.status.value in setOf(500, 502, 503, 504)
                }
                delayMillis { retry ->
                    val retryAfter = response?.headers?.get("Retry-After")?.toLongOrNull()
                    if (retryAfter != null && response?.status?.value == 429) {
                        retryAfter * 1000L
                    } else {
                        val base = 10_000L * (1L shl retry)
                        val jitter = 0.5 + kotlin.random.Random.nextDouble() * 0.5
                        (base * jitter).toLong()
                    }
                }
            }
            defaultRequest { bearerAuth(token) }
        }
    }

    constructor(
        client: HttpClient,
        baseUrl: String = PACHCA_API_URL,
        bots: BotsService? = null,
        chats: ChatsService? = null,
        common: CommonService? = null,
        groupTags: GroupTagsService? = null,
        linkPreviews: LinkPreviewsService? = null,
        members: MembersService? = null,
        messages: MessagesService? = null,
        profile: ProfileService? = null,
        reactions: ReactionsService? = null,
        readMembers: ReadMembersService? = null,
        search: SearchService? = null,
        security: SecurityService? = null,
        tasks: TasksService? = null,
        threads: ThreadsService? = null,
        users: UsersService? = null,
        views: ViewsService? = null
    ) : this(
        _client = client,
        bots = bots ?: BotsServiceImpl(baseUrl, client),
        chats = chats ?: ChatsServiceImpl(baseUrl, client),
        common = common ?: CommonServiceImpl(baseUrl, client),
        groupTags = groupTags ?: GroupTagsServiceImpl(baseUrl, client),
        linkPreviews = linkPreviews ?: LinkPreviewsServiceImpl(baseUrl, client),
        members = members ?: MembersServiceImpl(baseUrl, client),
        messages = messages ?: MessagesServiceImpl(baseUrl, client),
        profile = profile ?: ProfileServiceImpl(baseUrl, client),
        reactions = reactions ?: ReactionsServiceImpl(baseUrl, client),
        readMembers = readMembers ?: ReadMembersServiceImpl(baseUrl, client),
        search = search ?: SearchServiceImpl(baseUrl, client),
        security = security ?: SecurityServiceImpl(baseUrl, client),
        tasks = tasks ?: TasksServiceImpl(baseUrl, client),
        threads = threads ?: ThreadsServiceImpl(baseUrl, client),
        users = users ?: UsersServiceImpl(baseUrl, client),
        views = views ?: ViewsServiceImpl(baseUrl, client)
    )

    override fun close() {
        _client?.close()
    }
}
