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
import java.io.Closeable

class SecurityService internal constructor(
    private val baseUrl: String,
    private val client: HttpClient,
) {
    suspend fun getAuditEvents(
        startTime: String,
        endTime: String,
        eventKey: AuditEventKey? = null,
        actorId: String? = null,
        actorType: String? = null,
        entityId: String? = null,
        entityType: String? = null,
        limit: Int? = null,
        cursor: String? = null,
    ): GetAuditEventsResponse {
        val response = client.get("$baseUrl/audit_events") {
            parameter("start_time", startTime)
            parameter("end_time", endTime)
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
}

class BotsService internal constructor(
    private val baseUrl: String,
    private val client: HttpClient,
) {
    suspend fun getWebhookEvents(limit: Int? = null, cursor: String? = null): GetWebhookEventsResponse {
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

    suspend fun updateBot(id: Int, request: BotUpdateRequest): BotResponse {
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

    suspend fun deleteWebhookEvent(id: String) {
        val response = client.delete("$baseUrl/webhooks/events/$id")
        when (response.status.value) {
            204 -> return
            401 -> throw response.body<OAuthError>()
            else -> throw response.body<ApiError>()
        }
    }
}

class ChatsService internal constructor(
    private val baseUrl: String,
    private val client: HttpClient,
) {
    suspend fun listChats(
        sortId: SortOrder? = null,
        availability: ChatAvailability? = null,
        lastMessageAtAfter: String? = null,
        lastMessageAtBefore: String? = null,
        personal: Boolean? = null,
        limit: Int? = null,
        cursor: String? = null,
    ): ListChatsResponse {
        val response = client.get("$baseUrl/chats") {
            sortId?.let { parameter("sort[{field}]", it.value) }
            availability?.let { parameter("availability", it.value) }
            lastMessageAtAfter?.let { parameter("last_message_at_after", it) }
            lastMessageAtBefore?.let { parameter("last_message_at_before", it) }
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

    suspend fun getChat(id: Int): Chat {
        val response = client.get("$baseUrl/chats/$id")
        return when (response.status.value) {
            200 -> response.body<ChatDataWrapper>().data
            401 -> throw response.body<OAuthError>()
            else -> throw response.body<ApiError>()
        }
    }

    suspend fun createChat(request: ChatCreateRequest): Chat {
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

    suspend fun updateChat(id: Int, request: ChatUpdateRequest): Chat {
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

    suspend fun archiveChat(id: Int) {
        val response = client.put("$baseUrl/chats/$id/archive")
        when (response.status.value) {
            204 -> return
            401 -> throw response.body<OAuthError>()
            else -> throw response.body<ApiError>()
        }
    }

    suspend fun unarchiveChat(id: Int) {
        val response = client.put("$baseUrl/chats/$id/unarchive")
        when (response.status.value) {
            204 -> return
            401 -> throw response.body<OAuthError>()
            else -> throw response.body<ApiError>()
        }
    }
}

class CommonService internal constructor(
    private val baseUrl: String,
    private val client: HttpClient,
) {
    suspend fun downloadExport(id: Int): String {
        val response = client.get("$baseUrl/chats/exports/$id")
        return when (response.status.value) {
            302 -> response.headers[HttpHeaders.Location]
                ?: error("Missing Location header in redirect response")
            401 -> throw response.body<OAuthError>()
            else -> throw response.body<ApiError>()
        }
    }

    suspend fun listProperties(entityType: SearchEntityType): ListPropertiesResponse {
        val response = client.get("$baseUrl/custom_properties") {
            parameter("entity_type", entityType.value)
        }
        return when (response.status.value) {
            200 -> response.body()
            401 -> throw response.body<OAuthError>()
            else -> throw response.body<ApiError>()
        }
    }

    suspend fun requestExport(request: ExportRequest) {
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

    suspend fun uploadFile(directUrl: String, request: FileUploadRequest) {
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

    suspend fun getUploadParams(): UploadParams {
        val response = client.post("$baseUrl/uploads")
        return when (response.status.value) {
            201 -> response.body()
            401 -> throw response.body<OAuthError>()
            else -> throw response.body<ApiError>()
        }
    }
}

class MembersService internal constructor(
    private val baseUrl: String,
    private val client: HttpClient,
) {
    suspend fun listMembers(
        id: Int,
        role: ChatMemberRoleFilter? = null,
        limit: Int? = null,
        cursor: String? = null,
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

    suspend fun addTags(id: Int, groupTagIds: List<Int>) {
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

    suspend fun addMembers(id: Int, request: AddMembersRequest) {
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

    suspend fun updateMemberRole(
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

    suspend fun removeTag(id: Int, tagId: Int) {
        val response = client.delete("$baseUrl/chats/$id/group_tags/$tagId")
        when (response.status.value) {
            204 -> return
            401 -> throw response.body<OAuthError>()
            else -> throw response.body<ApiError>()
        }
    }

    suspend fun leaveChat(id: Int) {
        val response = client.delete("$baseUrl/chats/$id/leave")
        when (response.status.value) {
            204 -> return
            401 -> throw response.body<OAuthError>()
            else -> throw response.body<ApiError>()
        }
    }

    suspend fun removeMember(id: Int, userId: Int) {
        val response = client.delete("$baseUrl/chats/$id/members/$userId")
        when (response.status.value) {
            204 -> return
            401 -> throw response.body<OAuthError>()
            else -> throw response.body<ApiError>()
        }
    }
}

class GroupTagsService internal constructor(
    private val baseUrl: String,
    private val client: HttpClient,
) {
    suspend fun listTags(
        names: TagNamesFilter? = null,
        limit: Int? = null,
        cursor: String? = null,
    ): ListTagsResponse {
        val response = client.get("$baseUrl/group_tags") {
            names?.let { parameter("names", it) }
            limit?.let { parameter("limit", it) }
            cursor?.let { parameter("cursor", it) }
        }
        return when (response.status.value) {
            200 -> response.body()
            401 -> throw response.body<OAuthError>()
            else -> throw response.body<ApiError>()
        }
    }

    suspend fun getTag(id: Int): GroupTag {
        val response = client.get("$baseUrl/group_tags/$id")
        return when (response.status.value) {
            200 -> response.body<GroupTagDataWrapper>().data
            401 -> throw response.body<OAuthError>()
            else -> throw response.body<ApiError>()
        }
    }

    suspend fun getTagUsers(
        id: Int,
        limit: Int? = null,
        cursor: String? = null,
    ): ListMembersResponse {
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

    suspend fun createTag(request: GroupTagRequest): GroupTag {
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

    suspend fun updateTag(id: Int, request: GroupTagRequest): GroupTag {
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

    suspend fun deleteTag(id: Int) {
        val response = client.delete("$baseUrl/group_tags/$id")
        when (response.status.value) {
            204 -> return
            401 -> throw response.body<OAuthError>()
            else -> throw response.body<ApiError>()
        }
    }
}

class MessagesService internal constructor(
    private val baseUrl: String,
    private val client: HttpClient,
) {
    suspend fun listChatMessages(
        chatId: Int,
        sortId: SortOrder? = null,
        limit: Int? = null,
        cursor: String? = null,
    ): ListChatMessagesResponse {
        val response = client.get("$baseUrl/messages") {
            parameter("chat_id", chatId)
            sortId?.let { parameter("sort[{field}]", it.value) }
            limit?.let { parameter("limit", it) }
            cursor?.let { parameter("cursor", it) }
        }
        return when (response.status.value) {
            200 -> response.body()
            401 -> throw response.body<OAuthError>()
            else -> throw response.body<ApiError>()
        }
    }

    suspend fun getMessage(id: Int): Message {
        val response = client.get("$baseUrl/messages/$id")
        return when (response.status.value) {
            200 -> response.body<MessageDataWrapper>().data
            401 -> throw response.body<OAuthError>()
            else -> throw response.body<ApiError>()
        }
    }

    suspend fun createMessage(request: MessageCreateRequest): Message {
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

    suspend fun pinMessage(id: Int) {
        val response = client.post("$baseUrl/messages/$id/pin")
        when (response.status.value) {
            201 -> return
            401 -> throw response.body<OAuthError>()
            else -> throw response.body<ApiError>()
        }
    }

    suspend fun updateMessage(id: Int, request: MessageUpdateRequest): Message {
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

    suspend fun deleteMessage(id: Int) {
        val response = client.delete("$baseUrl/messages/$id")
        when (response.status.value) {
            204 -> return
            401 -> throw response.body<OAuthError>()
            else -> throw response.body<ApiError>()
        }
    }

    suspend fun unpinMessage(id: Int) {
        val response = client.delete("$baseUrl/messages/$id/pin")
        when (response.status.value) {
            204 -> return
            401 -> throw response.body<OAuthError>()
            else -> throw response.body<ApiError>()
        }
    }
}

class LinkPreviewsService internal constructor(
    private val baseUrl: String,
    private val client: HttpClient,
) {
    suspend fun createLinkPreviews(id: Int, request: LinkPreviewsRequest) {
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

class ReactionsService internal constructor(
    private val baseUrl: String,
    private val client: HttpClient,
) {
    suspend fun listReactions(
        id: Int,
        limit: Int? = null,
        cursor: String? = null,
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

    suspend fun addReaction(id: Int, request: ReactionRequest): Reaction {
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

    suspend fun removeReaction(
        id: Int,
        code: String,
        name: String? = null,
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

class ReadMembersService internal constructor(
    private val baseUrl: String,
    private val client: HttpClient,
) {
    suspend fun listReadMembers(
        id: Int,
        limit: Int? = null,
        cursor: String? = null,
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

class ThreadsService internal constructor(
    private val baseUrl: String,
    private val client: HttpClient,
) {
    suspend fun getThread(id: Int): Thread {
        val response = client.get("$baseUrl/threads/$id")
        return when (response.status.value) {
            200 -> response.body<ThreadDataWrapper>().data
            401 -> throw response.body<OAuthError>()
            else -> throw response.body<ApiError>()
        }
    }

    suspend fun createThread(id: Int): Thread {
        val response = client.post("$baseUrl/messages/$id/thread")
        return when (response.status.value) {
            201 -> response.body<ThreadDataWrapper>().data
            401 -> throw response.body<OAuthError>()
            else -> throw response.body<ApiError>()
        }
    }
}

class ProfileService internal constructor(
    private val baseUrl: String,
    private val client: HttpClient,
) {
    suspend fun getTokenInfo(): AccessTokenInfo {
        val response = client.get("$baseUrl/oauth/token/info")
        return when (response.status.value) {
            200 -> response.body<AccessTokenInfoDataWrapper>().data
            401 -> throw response.body<OAuthError>()
            else -> throw response.body<ApiError>()
        }
    }

    suspend fun getProfile(): User {
        val response = client.get("$baseUrl/profile")
        return when (response.status.value) {
            200 -> response.body<UserDataWrapper>().data
            401 -> throw response.body<OAuthError>()
            else -> throw response.body<ApiError>()
        }
    }

    suspend fun getStatus(): Any {
        val response = client.get("$baseUrl/profile/status")
        return when (response.status.value) {
            200 -> response.body()
            401 -> throw response.body<OAuthError>()
            else -> throw response.body<ApiError>()
        }
    }

    suspend fun updateStatus(request: StatusUpdateRequest): UserStatus {
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

    suspend fun deleteStatus() {
        val response = client.delete("$baseUrl/profile/status")
        when (response.status.value) {
            204 -> return
            401 -> throw response.body<OAuthError>()
            else -> throw response.body<ApiError>()
        }
    }
}

class SearchService internal constructor(
    private val baseUrl: String,
    private val client: HttpClient,
) {
    suspend fun searchChats(
        query: String? = null,
        limit: Int? = null,
        cursor: String? = null,
        order: SortOrder? = null,
        createdFrom: String? = null,
        createdTo: String? = null,
        active: Boolean? = null,
        chatSubtype: ChatSubtype? = null,
        personal: Boolean? = null,
    ): ListChatsResponse {
        val response = client.get("$baseUrl/search/chats") {
            query?.let { parameter("query", it) }
            limit?.let { parameter("limit", it) }
            cursor?.let { parameter("cursor", it) }
            order?.let { parameter("order", it.value) }
            createdFrom?.let { parameter("created_from", it) }
            createdTo?.let { parameter("created_to", it) }
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

    suspend fun searchMessages(
        query: String? = null,
        limit: Int? = null,
        cursor: String? = null,
        order: SortOrder? = null,
        createdFrom: String? = null,
        createdTo: String? = null,
        chatIds: List<Int>? = null,
        userIds: List<Int>? = null,
        active: Boolean? = null,
    ): ListChatMessagesResponse {
        val response = client.get("$baseUrl/search/messages") {
            query?.let { parameter("query", it) }
            limit?.let { parameter("limit", it) }
            cursor?.let { parameter("cursor", it) }
            order?.let { parameter("order", it.value) }
            createdFrom?.let { parameter("created_from", it) }
            createdTo?.let { parameter("created_to", it) }
            chatIds?.let { parameter("chat_ids", it) }
            userIds?.let { parameter("user_ids", it) }
            active?.let { parameter("active", it) }
        }
        return when (response.status.value) {
            200 -> response.body()
            401 -> throw response.body<OAuthError>()
            else -> throw response.body<ApiError>()
        }
    }

    suspend fun searchUsers(
        query: String? = null,
        limit: Int? = null,
        cursor: String? = null,
        sort: SearchSortOrder? = null,
        order: SortOrder? = null,
        createdFrom: String? = null,
        createdTo: String? = null,
        companyRoles: List<UserRole>? = null,
    ): ListMembersResponse {
        val response = client.get("$baseUrl/search/users") {
            query?.let { parameter("query", it) }
            limit?.let { parameter("limit", it) }
            cursor?.let { parameter("cursor", it) }
            sort?.let { parameter("sort", it.value) }
            order?.let { parameter("order", it.value) }
            createdFrom?.let { parameter("created_from", it) }
            createdTo?.let { parameter("created_to", it) }
            companyRoles?.let { parameter("company_roles", it) }
        }
        return when (response.status.value) {
            200 -> response.body()
            401 -> throw response.body<OAuthError>()
            else -> throw response.body<ApiError>()
        }
    }
}

class TasksService internal constructor(
    private val baseUrl: String,
    private val client: HttpClient,
) {
    suspend fun listTasks(limit: Int? = null, cursor: String? = null): ListTasksResponse {
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

    suspend fun getTask(id: Int): Task {
        val response = client.get("$baseUrl/tasks/$id")
        return when (response.status.value) {
            200 -> response.body<TaskDataWrapper>().data
            401 -> throw response.body<OAuthError>()
            else -> throw response.body<ApiError>()
        }
    }

    suspend fun createTask(request: TaskCreateRequest): Task {
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

    suspend fun updateTask(id: Int, request: TaskUpdateRequest): Task {
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

    suspend fun deleteTask(id: Int) {
        val response = client.delete("$baseUrl/tasks/$id")
        when (response.status.value) {
            204 -> return
            401 -> throw response.body<OAuthError>()
            else -> throw response.body<ApiError>()
        }
    }
}

class UsersService internal constructor(
    private val baseUrl: String,
    private val client: HttpClient,
) {
    suspend fun listUsers(
        query: String? = null,
        limit: Int? = null,
        cursor: String? = null,
    ): ListMembersResponse {
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

    suspend fun getUser(id: Int): User {
        val response = client.get("$baseUrl/users/$id")
        return when (response.status.value) {
            200 -> response.body<UserDataWrapper>().data
            401 -> throw response.body<OAuthError>()
            else -> throw response.body<ApiError>()
        }
    }

    suspend fun getUserStatus(userId: Int): Any {
        val response = client.get("$baseUrl/users/$userId/status")
        return when (response.status.value) {
            200 -> response.body()
            401 -> throw response.body<OAuthError>()
            else -> throw response.body<ApiError>()
        }
    }

    suspend fun createUser(request: UserCreateRequest): User {
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

    suspend fun updateUser(id: Int, request: UserUpdateRequest): User {
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

    suspend fun updateUserStatus(userId: Int, request: StatusUpdateRequest): UserStatus {
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

    suspend fun deleteUser(id: Int) {
        val response = client.delete("$baseUrl/users/$id")
        when (response.status.value) {
            204 -> return
            401 -> throw response.body<OAuthError>()
            else -> throw response.body<ApiError>()
        }
    }

    suspend fun deleteUserStatus(userId: Int) {
        val response = client.delete("$baseUrl/users/$userId/status")
        when (response.status.value) {
            204 -> return
            401 -> throw response.body<OAuthError>()
            else -> throw response.body<ApiError>()
        }
    }
}

class ViewsService internal constructor(
    private val baseUrl: String,
    private val client: HttpClient,
) {
    suspend fun openView(request: OpenViewRequest) {
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

class PachcaClient(token: String, baseUrl: String = "https://api.pachca.com/api/shared/v1") : Closeable {
    private val client = HttpClient {
        expectSuccess = false
        followRedirects = false
        install(ContentNegotiation) {
            json()
        }
        defaultRequest {
            bearerAuth(token)
        }
    }

    val bots = BotsService(baseUrl, client)
    val chats = ChatsService(baseUrl, client)
    val common = CommonService(baseUrl, client)
    val groupTags = GroupTagsService(baseUrl, client)
    val linkPreviews = LinkPreviewsService(baseUrl, client)
    val members = MembersService(baseUrl, client)
    val messages = MessagesService(baseUrl, client)
    val profile = ProfileService(baseUrl, client)
    val reactions = ReactionsService(baseUrl, client)
    val readMembers = ReadMembersService(baseUrl, client)
    val search = SearchService(baseUrl, client)
    val security = SecurityService(baseUrl, client)
    val tasks = TasksService(baseUrl, client)
    val threads = ThreadsService(baseUrl, client)
    val users = UsersService(baseUrl, client)
    val views = ViewsService(baseUrl, client)

    override fun close() {
        client.close()
    }
}
