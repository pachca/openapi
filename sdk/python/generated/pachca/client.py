from __future__ import annotations

import httpx

from .models import (
    GetAuditEventsParams,
    GetAuditEventsResponse,
    AuditEvent,
    OAuthError,
    ApiError,
    AuditEventKey,
    GetWebhookEventsParams,
    GetWebhookEventsResponse,
    WebhookEvent,
    BotUpdateRequest,
    BotResponse,
    ListChatsParams,
    ListChatsResponse,
    Chat,
    ChatSortField,
    SortOrder,
    ChatAvailability,
    ChatCreateRequest,
    ChatUpdateRequest,
    ListPropertiesParams,
    ListPropertiesResponse,
    SearchEntityType,
    ExportRequest,
    FileUploadRequest,
    UploadParams,
    ListMembersParams,
    ListMembersResponse,
    User,
    ChatMemberRoleFilter,
    AddMembersRequest,
    ChatMemberRole,
    ListTagsParams,
    ListTagsResponse,
    GroupTag,
    GetTagUsersParams,
    GetTagUsersResponse,
    GroupTagRequest,
    ListChatMessagesParams,
    ListChatMessagesResponse,
    Message,
    MessageSortField,
    MessageCreateRequest,
    MessageUpdateRequest,
    LinkPreviewsRequest,
    ListReactionsParams,
    ListReactionsResponse,
    Reaction,
    ReactionRequest,
    RemoveReactionParams,
    ListReadMembersParams,
    Thread,
    AccessTokenInfo,
    AvatarData,
    StatusUpdateRequest,
    UserStatus,
    SearchChatsParams,
    SearchChatsResponse,
    ChatSubtype,
    SearchMessagesParams,
    SearchMessagesResponse,
    SearchUsersParams,
    SearchUsersResponse,
    SearchSortOrder,
    ListTasksParams,
    ListTasksResponse,
    Task,
    TaskCreateRequest,
    TaskUpdateRequest,
    ListUsersParams,
    ListUsersResponse,
    UserCreateRequest,
    UserUpdateRequest,
    OpenViewRequest,
)
from .utils import deserialize, serialize, RetryTransport

class SecurityService:
    async def get_audit_events(
        self,
        params: GetAuditEventsParams | None = None,
    ) -> GetAuditEventsResponse:
        raise NotImplementedError("Security.getAuditEvents is not implemented")

    async def get_audit_events_all(
        self,
        params: GetAuditEventsParams | None = None,
    ) -> list[AuditEvent]:
        raise NotImplementedError("Security.getAuditEventsAll is not implemented")


class SecurityServiceImpl(SecurityService):
    def __init__(self, client: httpx.AsyncClient) -> None:
        self._client = client

    async def get_audit_events(
        self,
        params: GetAuditEventsParams | None = None,
    ) -> GetAuditEventsResponse:
        query: dict[str, str] = {}
        if params is not None and params.start_time is not None:
            query["start_time"] = params.start_time.isoformat()
        if params is not None and params.end_time is not None:
            query["end_time"] = params.end_time.isoformat()
        if params is not None and params.event_key is not None:
            query["event_key"] = params.event_key
        if params is not None and params.actor_id is not None:
            query["actor_id"] = params.actor_id
        if params is not None and params.actor_type is not None:
            query["actor_type"] = params.actor_type
        if params is not None and params.entity_id is not None:
            query["entity_id"] = params.entity_id
        if params is not None and params.entity_type is not None:
            query["entity_type"] = params.entity_type
        if params is not None and params.limit is not None:
            query["limit"] = str(params.limit)
        if params is not None and params.cursor is not None:
            query["cursor"] = params.cursor
        response = await self._client.get(
            "/audit_events",
            params=query,
        )
        body = response.json()
        match response.status_code:
            case 200:
                return deserialize(GetAuditEventsResponse, body)
            case 401:
                raise deserialize(OAuthError, body)
            case _:
                raise deserialize(ApiError, body)

    async def get_audit_events_all(
        self,
        params: GetAuditEventsParams | None = None,
    ) -> list[AuditEvent]:
        items: list[AuditEvent] = []
        cursor: str | None = None
        while True:
            if params is None:
                params = GetAuditEventsParams()
            params.cursor = cursor
            response = await self.get_audit_events(params=params)
            items.extend(response.data)
            if not response.data:
                break
            cursor = response.meta.paginate.next_page
        return items


class BotsService:
    async def get_webhook_events(
        self,
        params: GetWebhookEventsParams | None = None,
    ) -> GetWebhookEventsResponse:
        raise NotImplementedError("Bots.getWebhookEvents is not implemented")

    async def get_webhook_events_all(
        self,
        params: GetWebhookEventsParams | None = None,
    ) -> list[WebhookEvent]:
        raise NotImplementedError("Bots.getWebhookEventsAll is not implemented")

    async def update_bot(
        self,
        id: int,
        request: BotUpdateRequest,
    ) -> BotResponse:
        raise NotImplementedError("Bots.updateBot is not implemented")

    async def delete_webhook_event(
        self,
        id: str,
    ) -> None:
        raise NotImplementedError("Bots.deleteWebhookEvent is not implemented")


class BotsServiceImpl(BotsService):
    def __init__(self, client: httpx.AsyncClient) -> None:
        self._client = client

    async def get_webhook_events(
        self,
        params: GetWebhookEventsParams | None = None,
    ) -> GetWebhookEventsResponse:
        query: dict[str, str] = {}
        if params is not None and params.limit is not None:
            query["limit"] = str(params.limit)
        if params is not None and params.cursor is not None:
            query["cursor"] = params.cursor
        response = await self._client.get(
            "/webhooks/events",
            params=query,
        )
        body = response.json()
        match response.status_code:
            case 200:
                return deserialize(GetWebhookEventsResponse, body)
            case 401:
                raise deserialize(OAuthError, body)
            case _:
                raise deserialize(ApiError, body)

    async def get_webhook_events_all(
        self,
        params: GetWebhookEventsParams | None = None,
    ) -> list[WebhookEvent]:
        items: list[WebhookEvent] = []
        cursor: str | None = None
        while True:
            if params is None:
                params = GetWebhookEventsParams()
            params.cursor = cursor
            response = await self.get_webhook_events(params=params)
            items.extend(response.data)
            if not response.data:
                break
            cursor = response.meta.paginate.next_page
        return items

    async def update_bot(
        self,
        id: int,
        request: BotUpdateRequest,
    ) -> BotResponse:
        response = await self._client.put(
            f"/bots/{id}",
            json=serialize(request),
        )
        body = response.json()
        match response.status_code:
            case 200:
                return deserialize(BotResponse, body["data"])
            case 401:
                raise deserialize(OAuthError, body)
            case _:
                raise deserialize(ApiError, body)

    async def delete_webhook_event(
        self,
        id: str,
    ) -> None:
        response = await self._client.delete(
            f"/webhooks/events/{id}",
        )
        match response.status_code:
            case 204:
                return
            case 401:
                raise deserialize(OAuthError, response.json())
            case _:
                raise deserialize(ApiError, response.json())


class ChatsService:
    async def list_chats(
        self,
        params: ListChatsParams | None = None,
    ) -> ListChatsResponse:
        raise NotImplementedError("Chats.listChats is not implemented")

    async def list_chats_all(
        self,
        params: ListChatsParams | None = None,
    ) -> list[Chat]:
        raise NotImplementedError("Chats.listChatsAll is not implemented")

    async def get_chat(
        self,
        id: int,
    ) -> Chat:
        raise NotImplementedError("Chats.getChat is not implemented")

    async def create_chat(
        self,
        request: ChatCreateRequest,
    ) -> Chat:
        raise NotImplementedError("Chats.createChat is not implemented")

    async def update_chat(
        self,
        id: int,
        request: ChatUpdateRequest,
    ) -> Chat:
        raise NotImplementedError("Chats.updateChat is not implemented")

    async def archive_chat(
        self,
        id: int,
    ) -> None:
        raise NotImplementedError("Chats.archiveChat is not implemented")

    async def unarchive_chat(
        self,
        id: int,
    ) -> None:
        raise NotImplementedError("Chats.unarchiveChat is not implemented")


class ChatsServiceImpl(ChatsService):
    def __init__(self, client: httpx.AsyncClient) -> None:
        self._client = client

    async def list_chats(
        self,
        params: ListChatsParams | None = None,
    ) -> ListChatsResponse:
        query: dict[str, str] = {}
        if params is not None and params.sort is not None:
            query["sort"] = params.sort
        if params is not None and params.order is not None:
            query["order"] = params.order
        if params is not None and params.availability is not None:
            query["availability"] = params.availability
        if params is not None and params.last_message_at_after is not None:
            query["last_message_at_after"] = params.last_message_at_after.isoformat()
        if params is not None and params.last_message_at_before is not None:
            query["last_message_at_before"] = params.last_message_at_before.isoformat()
        if params is not None and params.personal is not None:
            query["personal"] = str(params.personal).lower()
        if params is not None and params.limit is not None:
            query["limit"] = str(params.limit)
        if params is not None and params.cursor is not None:
            query["cursor"] = params.cursor
        response = await self._client.get(
            "/chats",
            params=query,
        )
        body = response.json()
        match response.status_code:
            case 200:
                return deserialize(ListChatsResponse, body)
            case 401:
                raise deserialize(OAuthError, body)
            case _:
                raise deserialize(ApiError, body)

    async def list_chats_all(
        self,
        params: ListChatsParams | None = None,
    ) -> list[Chat]:
        items: list[Chat] = []
        cursor: str | None = None
        while True:
            if params is None:
                params = ListChatsParams()
            params.cursor = cursor
            response = await self.list_chats(params=params)
            items.extend(response.data)
            if not response.data:
                break
            cursor = response.meta.paginate.next_page
        return items

    async def get_chat(
        self,
        id: int,
    ) -> Chat:
        response = await self._client.get(
            f"/chats/{id}",
        )
        body = response.json()
        match response.status_code:
            case 200:
                return deserialize(Chat, body["data"])
            case 401:
                raise deserialize(OAuthError, body)
            case _:
                raise deserialize(ApiError, body)

    async def create_chat(
        self,
        request: ChatCreateRequest,
    ) -> Chat:
        response = await self._client.post(
            "/chats",
            json=serialize(request),
        )
        body = response.json()
        match response.status_code:
            case 201:
                return deserialize(Chat, body["data"])
            case 401:
                raise deserialize(OAuthError, body)
            case _:
                raise deserialize(ApiError, body)

    async def update_chat(
        self,
        id: int,
        request: ChatUpdateRequest,
    ) -> Chat:
        response = await self._client.put(
            f"/chats/{id}",
            json=serialize(request),
        )
        body = response.json()
        match response.status_code:
            case 200:
                return deserialize(Chat, body["data"])
            case 401:
                raise deserialize(OAuthError, body)
            case _:
                raise deserialize(ApiError, body)

    async def archive_chat(
        self,
        id: int,
    ) -> None:
        response = await self._client.put(
            f"/chats/{id}/archive",
        )
        match response.status_code:
            case 204:
                return
            case 401:
                raise deserialize(OAuthError, response.json())
            case _:
                raise deserialize(ApiError, response.json())

    async def unarchive_chat(
        self,
        id: int,
    ) -> None:
        response = await self._client.put(
            f"/chats/{id}/unarchive",
        )
        match response.status_code:
            case 204:
                return
            case 401:
                raise deserialize(OAuthError, response.json())
            case _:
                raise deserialize(ApiError, response.json())


class CommonService:
    async def download_export(
        self,
        id: int,
    ) -> str:
        raise NotImplementedError("Common.downloadExport is not implemented")

    async def list_properties(
        self,
        params: ListPropertiesParams,
    ) -> ListPropertiesResponse:
        raise NotImplementedError("Common.listProperties is not implemented")

    async def request_export(
        self,
        request: ExportRequest,
    ) -> None:
        raise NotImplementedError("Common.requestExport is not implemented")

    async def upload_file(
        self,
        direct_url: str,
        request: FileUploadRequest,
    ) -> None:
        raise NotImplementedError("Common.uploadFile is not implemented")

    async def get_upload_params(
        self) -> UploadParams:
        raise NotImplementedError("Common.getUploadParams is not implemented")


class CommonServiceImpl(CommonService):
    def __init__(self, client: httpx.AsyncClient) -> None:
        self._client = client

    async def download_export(
        self,
        id: int,
    ) -> str:
        response = await self._client.get(
            f"/chats/exports/{id}",
            follow_redirects=False,
        )
        match response.status_code:
            case 302:
                location = response.headers.get("location")
                if not location:
                    raise RuntimeError(
                        "Missing Location header in redirect response"
                    )
                return location
            case 401:
                raise deserialize(OAuthError, response.json())
            case _:
                raise deserialize(ApiError, response.json())

    async def list_properties(
        self,
        params: ListPropertiesParams,
    ) -> ListPropertiesResponse:
        query: list[tuple[str, str]] = []
        query.append(("entity_type", params.entity_type))
        response = await self._client.get(
            "/custom_properties",
            params=query,
        )
        body = response.json()
        match response.status_code:
            case 200:
                return deserialize(ListPropertiesResponse, body)
            case 401:
                raise deserialize(OAuthError, body)
            case _:
                raise deserialize(ApiError, body)

    async def request_export(
        self,
        request: ExportRequest,
    ) -> None:
        response = await self._client.post(
            "/chats/exports",
            json=serialize(request),
        )
        match response.status_code:
            case 204:
                return
            case 401:
                raise deserialize(OAuthError, response.json())
            case _:
                raise deserialize(ApiError, response.json())

    async def upload_file(
        self,
        direct_url: str,
        request: FileUploadRequest,
    ) -> None:
        data: dict[str, str] = {}
        data["Content-Disposition"] = request.content_disposition
        data["acl"] = request.acl
        data["policy"] = request.policy
        data["x-amz-credential"] = request.x_amz_credential
        data["x-amz-algorithm"] = request.x_amz_algorithm
        data["x-amz-date"] = request.x_amz_date
        data["x-amz-signature"] = request.x_amz_signature
        data["key"] = request.key
        async with httpx.AsyncClient() as _no_auth:
            response = await _no_auth.post(
                direct_url,
                data=data,
                files={"file": request.file},
            )
        match response.status_code:
            case 204:
                return
            case _:
                raise deserialize(ApiError, response.json())

    async def get_upload_params(
        self) -> UploadParams:
        response = await self._client.post(
            "/uploads",
        )
        body = response.json()
        match response.status_code:
            case 201:
                return deserialize(UploadParams, body)
            case 401:
                raise deserialize(OAuthError, body)
            case _:
                raise deserialize(ApiError, body)


class MembersService:
    async def list_members(
        self,
        id: int,
        params: ListMembersParams | None = None,
    ) -> ListMembersResponse:
        raise NotImplementedError("Members.listMembers is not implemented")

    async def list_members_all(
        self,
        id: int,
        params: ListMembersParams | None = None,
    ) -> list[User]:
        raise NotImplementedError("Members.listMembersAll is not implemented")

    async def add_tags(
        self,
        id: int,
        group_tag_ids: list[int],
    ) -> None:
        raise NotImplementedError("Members.addTags is not implemented")

    async def add_members(
        self,
        id: int,
        request: AddMembersRequest,
    ) -> None:
        raise NotImplementedError("Members.addMembers is not implemented")

    async def update_member_role(
        self,
        id: int,
        user_id: int,
        role: ChatMemberRole,
    ) -> None:
        raise NotImplementedError("Members.updateMemberRole is not implemented")

    async def remove_tag(
        self,
        id: int,
        tag_id: int,
    ) -> None:
        raise NotImplementedError("Members.removeTag is not implemented")

    async def leave_chat(
        self,
        id: int,
    ) -> None:
        raise NotImplementedError("Members.leaveChat is not implemented")

    async def remove_member(
        self,
        id: int,
        user_id: int,
    ) -> None:
        raise NotImplementedError("Members.removeMember is not implemented")


class MembersServiceImpl(MembersService):
    def __init__(self, client: httpx.AsyncClient) -> None:
        self._client = client

    async def list_members(
        self,
        id: int,
        params: ListMembersParams | None = None,
    ) -> ListMembersResponse:
        query: dict[str, str] = {}
        if params is not None and params.role is not None:
            query["role"] = params.role
        if params is not None and params.limit is not None:
            query["limit"] = str(params.limit)
        if params is not None and params.cursor is not None:
            query["cursor"] = params.cursor
        response = await self._client.get(
            f"/chats/{id}/members",
            params=query,
        )
        body = response.json()
        match response.status_code:
            case 200:
                return deserialize(ListMembersResponse, body)
            case 401:
                raise deserialize(OAuthError, body)
            case _:
                raise deserialize(ApiError, body)

    async def list_members_all(
        self,
        id: int,
        params: ListMembersParams | None = None,
    ) -> list[User]:
        items: list[User] = []
        cursor: str | None = None
        while True:
            if params is None:
                params = ListMembersParams()
            params.cursor = cursor
            response = await self.list_members(id, params=params)
            items.extend(response.data)
            if not response.data:
                break
            cursor = response.meta.paginate.next_page
        return items

    async def add_tags(
        self,
        id: int,
        group_tag_ids: list[int],
    ) -> None:
        response = await self._client.post(
            f"/chats/{id}/group_tags",
            json={"group_tag_ids": group_tag_ids},
        )
        match response.status_code:
            case 204:
                return
            case 401:
                raise deserialize(OAuthError, response.json())
            case _:
                raise deserialize(ApiError, response.json())

    async def add_members(
        self,
        id: int,
        request: AddMembersRequest,
    ) -> None:
        response = await self._client.post(
            f"/chats/{id}/members",
            json=serialize(request),
        )
        match response.status_code:
            case 204:
                return
            case 401:
                raise deserialize(OAuthError, response.json())
            case _:
                raise deserialize(ApiError, response.json())

    async def update_member_role(
        self,
        id: int,
        user_id: int,
        role: ChatMemberRole,
    ) -> None:
        response = await self._client.put(
            f"/chats/{id}/members/{user_id}",
            json={"role": role},
        )
        match response.status_code:
            case 204:
                return
            case 401:
                raise deserialize(OAuthError, response.json())
            case _:
                raise deserialize(ApiError, response.json())

    async def remove_tag(
        self,
        id: int,
        tag_id: int,
    ) -> None:
        response = await self._client.delete(
            f"/chats/{id}/group_tags/{tag_id}",
        )
        match response.status_code:
            case 204:
                return
            case 401:
                raise deserialize(OAuthError, response.json())
            case _:
                raise deserialize(ApiError, response.json())

    async def leave_chat(
        self,
        id: int,
    ) -> None:
        response = await self._client.delete(
            f"/chats/{id}/leave",
        )
        match response.status_code:
            case 204:
                return
            case 401:
                raise deserialize(OAuthError, response.json())
            case _:
                raise deserialize(ApiError, response.json())

    async def remove_member(
        self,
        id: int,
        user_id: int,
    ) -> None:
        response = await self._client.delete(
            f"/chats/{id}/members/{user_id}",
        )
        match response.status_code:
            case 204:
                return
            case 401:
                raise deserialize(OAuthError, response.json())
            case _:
                raise deserialize(ApiError, response.json())


class GroupTagsService:
    async def list_tags(
        self,
        params: ListTagsParams | None = None,
    ) -> ListTagsResponse:
        raise NotImplementedError("Group tags.listTags is not implemented")

    async def list_tags_all(
        self,
        params: ListTagsParams | None = None,
    ) -> list[GroupTag]:
        raise NotImplementedError("Group tags.listTagsAll is not implemented")

    async def get_tag(
        self,
        id: int,
    ) -> GroupTag:
        raise NotImplementedError("Group tags.getTag is not implemented")

    async def get_tag_users(
        self,
        id: int,
        params: GetTagUsersParams | None = None,
    ) -> GetTagUsersResponse:
        raise NotImplementedError("Group tags.getTagUsers is not implemented")

    async def get_tag_users_all(
        self,
        id: int,
        params: GetTagUsersParams | None = None,
    ) -> list[User]:
        raise NotImplementedError("Group tags.getTagUsersAll is not implemented")

    async def create_tag(
        self,
        request: GroupTagRequest,
    ) -> GroupTag:
        raise NotImplementedError("Group tags.createTag is not implemented")

    async def update_tag(
        self,
        id: int,
        request: GroupTagRequest,
    ) -> GroupTag:
        raise NotImplementedError("Group tags.updateTag is not implemented")

    async def delete_tag(
        self,
        id: int,
    ) -> None:
        raise NotImplementedError("Group tags.deleteTag is not implemented")


class GroupTagsServiceImpl(GroupTagsService):
    def __init__(self, client: httpx.AsyncClient) -> None:
        self._client = client

    async def list_tags(
        self,
        params: ListTagsParams | None = None,
    ) -> ListTagsResponse:
        query: list[tuple[str, str]] = []
        if params is not None and params.names is not None:
            for v in params.names:
                query.append(("names[]", str(v)))
        if params is not None and params.limit is not None:
            query.append(("limit", str(params.limit)))
        if params is not None and params.cursor is not None:
            query.append(("cursor", params.cursor))
        response = await self._client.get(
            "/group_tags",
            params=query,
        )
        body = response.json()
        match response.status_code:
            case 200:
                return deserialize(ListTagsResponse, body)
            case 401:
                raise deserialize(OAuthError, body)
            case _:
                raise deserialize(ApiError, body)

    async def list_tags_all(
        self,
        params: ListTagsParams | None = None,
    ) -> list[GroupTag]:
        items: list[GroupTag] = []
        cursor: str | None = None
        while True:
            if params is None:
                params = ListTagsParams()
            params.cursor = cursor
            response = await self.list_tags(params=params)
            items.extend(response.data)
            if not response.data:
                break
            cursor = response.meta.paginate.next_page
        return items

    async def get_tag(
        self,
        id: int,
    ) -> GroupTag:
        response = await self._client.get(
            f"/group_tags/{id}",
        )
        body = response.json()
        match response.status_code:
            case 200:
                return deserialize(GroupTag, body["data"])
            case 401:
                raise deserialize(OAuthError, body)
            case _:
                raise deserialize(ApiError, body)

    async def get_tag_users(
        self,
        id: int,
        params: GetTagUsersParams | None = None,
    ) -> GetTagUsersResponse:
        query: dict[str, str] = {}
        if params is not None and params.limit is not None:
            query["limit"] = str(params.limit)
        if params is not None and params.cursor is not None:
            query["cursor"] = params.cursor
        response = await self._client.get(
            f"/group_tags/{id}/users",
            params=query,
        )
        body = response.json()
        match response.status_code:
            case 200:
                return deserialize(GetTagUsersResponse, body)
            case 401:
                raise deserialize(OAuthError, body)
            case _:
                raise deserialize(ApiError, body)

    async def get_tag_users_all(
        self,
        id: int,
        params: GetTagUsersParams | None = None,
    ) -> list[User]:
        items: list[User] = []
        cursor: str | None = None
        while True:
            if params is None:
                params = GetTagUsersParams()
            params.cursor = cursor
            response = await self.get_tag_users(id, params=params)
            items.extend(response.data)
            if not response.data:
                break
            cursor = response.meta.paginate.next_page
        return items

    async def create_tag(
        self,
        request: GroupTagRequest,
    ) -> GroupTag:
        response = await self._client.post(
            "/group_tags",
            json=serialize(request),
        )
        body = response.json()
        match response.status_code:
            case 201:
                return deserialize(GroupTag, body["data"])
            case 401:
                raise deserialize(OAuthError, body)
            case _:
                raise deserialize(ApiError, body)

    async def update_tag(
        self,
        id: int,
        request: GroupTagRequest,
    ) -> GroupTag:
        response = await self._client.put(
            f"/group_tags/{id}",
            json=serialize(request),
        )
        body = response.json()
        match response.status_code:
            case 200:
                return deserialize(GroupTag, body["data"])
            case 401:
                raise deserialize(OAuthError, body)
            case _:
                raise deserialize(ApiError, body)

    async def delete_tag(
        self,
        id: int,
    ) -> None:
        response = await self._client.delete(
            f"/group_tags/{id}",
        )
        match response.status_code:
            case 204:
                return
            case 401:
                raise deserialize(OAuthError, response.json())
            case _:
                raise deserialize(ApiError, response.json())


class MessagesService:
    async def list_chat_messages(
        self,
        params: ListChatMessagesParams,
    ) -> ListChatMessagesResponse:
        raise NotImplementedError("Messages.listChatMessages is not implemented")

    async def list_chat_messages_all(
        self,
        params: ListChatMessagesParams,
    ) -> list[Message]:
        raise NotImplementedError("Messages.listChatMessagesAll is not implemented")

    async def get_message(
        self,
        id: int,
    ) -> Message:
        raise NotImplementedError("Messages.getMessage is not implemented")

    async def create_message(
        self,
        request: MessageCreateRequest,
    ) -> Message:
        raise NotImplementedError("Messages.createMessage is not implemented")

    async def pin_message(
        self,
        id: int,
    ) -> None:
        raise NotImplementedError("Messages.pinMessage is not implemented")

    async def update_message(
        self,
        id: int,
        request: MessageUpdateRequest,
    ) -> Message:
        raise NotImplementedError("Messages.updateMessage is not implemented")

    async def delete_message(
        self,
        id: int,
    ) -> None:
        raise NotImplementedError("Messages.deleteMessage is not implemented")

    async def unpin_message(
        self,
        id: int,
    ) -> None:
        raise NotImplementedError("Messages.unpinMessage is not implemented")


class MessagesServiceImpl(MessagesService):
    def __init__(self, client: httpx.AsyncClient) -> None:
        self._client = client

    async def list_chat_messages(
        self,
        params: ListChatMessagesParams,
    ) -> ListChatMessagesResponse:
        query: list[tuple[str, str]] = []
        query.append(("chat_id", str(params.chat_id)))
        if params is not None and params.sort is not None:
            query.append(("sort", params.sort))
        if params is not None and params.order is not None:
            query.append(("order", params.order))
        if params is not None and params.limit is not None:
            query.append(("limit", str(params.limit)))
        if params is not None and params.cursor is not None:
            query.append(("cursor", params.cursor))
        response = await self._client.get(
            "/messages",
            params=query,
        )
        body = response.json()
        match response.status_code:
            case 200:
                return deserialize(ListChatMessagesResponse, body)
            case 401:
                raise deserialize(OAuthError, body)
            case _:
                raise deserialize(ApiError, body)

    async def list_chat_messages_all(
        self,
        params: ListChatMessagesParams,
    ) -> list[Message]:
        items: list[Message] = []
        cursor: str | None = None
        while True:
            if params is None:
                params = ListChatMessagesParams()
            params.cursor = cursor
            response = await self.list_chat_messages(params=params)
            items.extend(response.data)
            if not response.data:
                break
            cursor = response.meta.paginate.next_page
        return items

    async def get_message(
        self,
        id: int,
    ) -> Message:
        response = await self._client.get(
            f"/messages/{id}",
        )
        body = response.json()
        match response.status_code:
            case 200:
                return deserialize(Message, body["data"])
            case 401:
                raise deserialize(OAuthError, body)
            case _:
                raise deserialize(ApiError, body)

    async def create_message(
        self,
        request: MessageCreateRequest,
    ) -> Message:
        response = await self._client.post(
            "/messages",
            json=serialize(request),
        )
        body = response.json()
        match response.status_code:
            case 201:
                return deserialize(Message, body["data"])
            case 401:
                raise deserialize(OAuthError, body)
            case _:
                raise deserialize(ApiError, body)

    async def pin_message(
        self,
        id: int,
    ) -> None:
        response = await self._client.post(
            f"/messages/{id}/pin",
        )
        match response.status_code:
            case 204:
                return
            case 401:
                raise deserialize(OAuthError, response.json())
            case _:
                raise deserialize(ApiError, response.json())

    async def update_message(
        self,
        id: int,
        request: MessageUpdateRequest,
    ) -> Message:
        response = await self._client.put(
            f"/messages/{id}",
            json=serialize(request),
        )
        body = response.json()
        match response.status_code:
            case 200:
                return deserialize(Message, body["data"])
            case 401:
                raise deserialize(OAuthError, body)
            case _:
                raise deserialize(ApiError, body)

    async def delete_message(
        self,
        id: int,
    ) -> None:
        response = await self._client.delete(
            f"/messages/{id}",
        )
        match response.status_code:
            case 204:
                return
            case 401:
                raise deserialize(OAuthError, response.json())
            case _:
                raise deserialize(ApiError, response.json())

    async def unpin_message(
        self,
        id: int,
    ) -> None:
        response = await self._client.delete(
            f"/messages/{id}/pin",
        )
        match response.status_code:
            case 204:
                return
            case 401:
                raise deserialize(OAuthError, response.json())
            case _:
                raise deserialize(ApiError, response.json())


class LinkPreviewsService:
    async def create_link_previews(
        self,
        id: int,
        request: LinkPreviewsRequest,
    ) -> None:
        raise NotImplementedError("Link Previews.createLinkPreviews is not implemented")


class LinkPreviewsServiceImpl(LinkPreviewsService):
    def __init__(self, client: httpx.AsyncClient) -> None:
        self._client = client

    async def create_link_previews(
        self,
        id: int,
        request: LinkPreviewsRequest,
    ) -> None:
        response = await self._client.post(
            f"/messages/{id}/link_previews",
            json=serialize(request),
        )
        match response.status_code:
            case 204:
                return
            case 401:
                raise deserialize(OAuthError, response.json())
            case _:
                raise deserialize(ApiError, response.json())


class ReactionsService:
    async def list_reactions(
        self,
        id: int,
        params: ListReactionsParams | None = None,
    ) -> ListReactionsResponse:
        raise NotImplementedError("Reactions.listReactions is not implemented")

    async def list_reactions_all(
        self,
        id: int,
        params: ListReactionsParams | None = None,
    ) -> list[Reaction]:
        raise NotImplementedError("Reactions.listReactionsAll is not implemented")

    async def add_reaction(
        self,
        id: int,
        request: ReactionRequest,
    ) -> Reaction:
        raise NotImplementedError("Reactions.addReaction is not implemented")

    async def remove_reaction(
        self,
        id: int,
        params: RemoveReactionParams,
    ) -> None:
        raise NotImplementedError("Reactions.removeReaction is not implemented")


class ReactionsServiceImpl(ReactionsService):
    def __init__(self, client: httpx.AsyncClient) -> None:
        self._client = client

    async def list_reactions(
        self,
        id: int,
        params: ListReactionsParams | None = None,
    ) -> ListReactionsResponse:
        query: dict[str, str] = {}
        if params is not None and params.limit is not None:
            query["limit"] = str(params.limit)
        if params is not None and params.cursor is not None:
            query["cursor"] = params.cursor
        response = await self._client.get(
            f"/messages/{id}/reactions",
            params=query,
        )
        body = response.json()
        match response.status_code:
            case 200:
                return deserialize(ListReactionsResponse, body)
            case 401:
                raise deserialize(OAuthError, body)
            case _:
                raise deserialize(ApiError, body)

    async def list_reactions_all(
        self,
        id: int,
        params: ListReactionsParams | None = None,
    ) -> list[Reaction]:
        items: list[Reaction] = []
        cursor: str | None = None
        while True:
            if params is None:
                params = ListReactionsParams()
            params.cursor = cursor
            response = await self.list_reactions(id, params=params)
            items.extend(response.data)
            if not response.data:
                break
            cursor = response.meta.paginate.next_page
        return items

    async def add_reaction(
        self,
        id: int,
        request: ReactionRequest,
    ) -> Reaction:
        response = await self._client.post(
            f"/messages/{id}/reactions",
            json=serialize(request),
        )
        body = response.json()
        match response.status_code:
            case 201:
                return deserialize(Reaction, body)
            case 401:
                raise deserialize(OAuthError, body)
            case _:
                raise deserialize(ApiError, body)

    async def remove_reaction(
        self,
        id: int,
        params: RemoveReactionParams,
    ) -> None:
        query: list[tuple[str, str]] = []
        query.append(("code", params.code))
        if params is not None and params.name is not None:
            query.append(("name", params.name))
        response = await self._client.delete(
            f"/messages/{id}/reactions",
            params=query,
        )
        match response.status_code:
            case 204:
                return
            case 401:
                raise deserialize(OAuthError, response.json())
            case _:
                raise deserialize(ApiError, response.json())


class ReadMembersService:
    async def list_read_members(
        self,
        id: int,
        params: ListReadMembersParams | None = None,
    ) -> object:
        raise NotImplementedError("Read members.listReadMembers is not implemented")


class ReadMembersServiceImpl(ReadMembersService):
    def __init__(self, client: httpx.AsyncClient) -> None:
        self._client = client

    async def list_read_members(
        self,
        id: int,
        params: ListReadMembersParams | None = None,
    ) -> object:
        query: dict[str, str] = {}
        if params is not None and params.limit is not None:
            query["limit"] = str(params.limit)
        if params is not None and params.cursor is not None:
            query["cursor"] = params.cursor
        response = await self._client.get(
            f"/messages/{id}/read_member_ids",
            params=query,
        )
        body = response.json()
        match response.status_code:
            case 200:
                return deserialize(object, body)
            case 401:
                raise deserialize(OAuthError, body)
            case _:
                raise deserialize(ApiError, body)


class ThreadsService:
    async def get_thread(
        self,
        id: int,
    ) -> Thread:
        raise NotImplementedError("Threads.getThread is not implemented")

    async def create_thread(
        self,
        id: int,
    ) -> Thread:
        raise NotImplementedError("Threads.createThread is not implemented")


class ThreadsServiceImpl(ThreadsService):
    def __init__(self, client: httpx.AsyncClient) -> None:
        self._client = client

    async def get_thread(
        self,
        id: int,
    ) -> Thread:
        response = await self._client.get(
            f"/threads/{id}",
        )
        body = response.json()
        match response.status_code:
            case 200:
                return deserialize(Thread, body["data"])
            case 401:
                raise deserialize(OAuthError, body)
            case _:
                raise deserialize(ApiError, body)

    async def create_thread(
        self,
        id: int,
    ) -> Thread:
        response = await self._client.post(
            f"/messages/{id}/thread",
        )
        body = response.json()
        match response.status_code:
            case 201:
                return deserialize(Thread, body["data"])
            case 401:
                raise deserialize(OAuthError, body)
            case _:
                raise deserialize(ApiError, body)


class ProfileService:
    async def get_token_info(
        self) -> AccessTokenInfo:
        raise NotImplementedError("Profile.getTokenInfo is not implemented")

    async def get_profile(
        self) -> User:
        raise NotImplementedError("Profile.getProfile is not implemented")

    async def get_status(
        self) -> object:
        raise NotImplementedError("Profile.getStatus is not implemented")

    async def update_profile_avatar(
        self,
        image: bytes,
    ) -> AvatarData:
        raise NotImplementedError("Profile.updateProfileAvatar is not implemented")

    async def update_status(
        self,
        request: StatusUpdateRequest,
    ) -> UserStatus:
        raise NotImplementedError("Profile.updateStatus is not implemented")

    async def delete_profile_avatar(
        self) -> None:
        raise NotImplementedError("Profile.deleteProfileAvatar is not implemented")

    async def delete_status(
        self) -> None:
        raise NotImplementedError("Profile.deleteStatus is not implemented")


class ProfileServiceImpl(ProfileService):
    def __init__(self, client: httpx.AsyncClient) -> None:
        self._client = client

    async def get_token_info(
        self) -> AccessTokenInfo:
        response = await self._client.get(
            "/oauth/token/info",
        )
        body = response.json()
        match response.status_code:
            case 200:
                return deserialize(AccessTokenInfo, body["data"])
            case 401:
                raise deserialize(OAuthError, body)
            case _:
                raise deserialize(ApiError, body)

    async def get_profile(
        self) -> User:
        response = await self._client.get(
            "/profile",
        )
        body = response.json()
        match response.status_code:
            case 200:
                return deserialize(User, body["data"])
            case 401:
                raise deserialize(OAuthError, body)
            case _:
                raise deserialize(ApiError, body)

    async def get_status(
        self) -> object:
        response = await self._client.get(
            "/profile/status",
        )
        body = response.json()
        match response.status_code:
            case 200:
                return deserialize(object, body)
            case 401:
                raise deserialize(OAuthError, body)
            case _:
                raise deserialize(ApiError, body)

    async def update_profile_avatar(
        self,
        image: bytes,
    ) -> AvatarData:
        data: dict[str, str] = {}
        response = await self._client.post(
            "/profile/avatar",
            data=data,
            files={"image": image},
        )
        body = response.json()
        match response.status_code:
            case 200:
                return deserialize(AvatarData, body["data"])
            case 401:
                raise deserialize(OAuthError, body)
            case _:
                raise deserialize(ApiError, body)

    async def update_status(
        self,
        request: StatusUpdateRequest,
    ) -> UserStatus:
        response = await self._client.put(
            "/profile/status",
            json=serialize(request),
        )
        body = response.json()
        match response.status_code:
            case 200:
                return deserialize(UserStatus, body["data"])
            case 401:
                raise deserialize(OAuthError, body)
            case _:
                raise deserialize(ApiError, body)

    async def delete_profile_avatar(
        self) -> None:
        response = await self._client.delete(
            "/profile/avatar",
        )
        match response.status_code:
            case 204:
                return
            case 401:
                raise deserialize(OAuthError, response.json())
            case _:
                raise deserialize(ApiError, response.json())

    async def delete_status(
        self) -> None:
        response = await self._client.delete(
            "/profile/status",
        )
        match response.status_code:
            case 204:
                return
            case 401:
                raise deserialize(OAuthError, response.json())
            case _:
                raise deserialize(ApiError, response.json())


class SearchService:
    async def search_chats(
        self,
        params: SearchChatsParams | None = None,
    ) -> SearchChatsResponse:
        raise NotImplementedError("Search.searchChats is not implemented")

    async def search_chats_all(
        self,
        params: SearchChatsParams | None = None,
    ) -> list[Chat]:
        raise NotImplementedError("Search.searchChatsAll is not implemented")

    async def search_messages(
        self,
        params: SearchMessagesParams | None = None,
    ) -> SearchMessagesResponse:
        raise NotImplementedError("Search.searchMessages is not implemented")

    async def search_messages_all(
        self,
        params: SearchMessagesParams | None = None,
    ) -> list[Message]:
        raise NotImplementedError("Search.searchMessagesAll is not implemented")

    async def search_users(
        self,
        params: SearchUsersParams | None = None,
    ) -> SearchUsersResponse:
        raise NotImplementedError("Search.searchUsers is not implemented")

    async def search_users_all(
        self,
        params: SearchUsersParams | None = None,
    ) -> list[User]:
        raise NotImplementedError("Search.searchUsersAll is not implemented")


class SearchServiceImpl(SearchService):
    def __init__(self, client: httpx.AsyncClient) -> None:
        self._client = client

    async def search_chats(
        self,
        params: SearchChatsParams | None = None,
    ) -> SearchChatsResponse:
        query: dict[str, str] = {}
        if params is not None and params.query is not None:
            query["query"] = params.query
        if params is not None and params.limit is not None:
            query["limit"] = str(params.limit)
        if params is not None and params.cursor is not None:
            query["cursor"] = params.cursor
        if params is not None and params.order is not None:
            query["order"] = params.order
        if params is not None and params.created_from is not None:
            query["created_from"] = params.created_from.isoformat()
        if params is not None and params.created_to is not None:
            query["created_to"] = params.created_to.isoformat()
        if params is not None and params.active is not None:
            query["active"] = str(params.active).lower()
        if params is not None and params.chat_subtype is not None:
            query["chat_subtype"] = params.chat_subtype
        if params is not None and params.personal is not None:
            query["personal"] = str(params.personal).lower()
        response = await self._client.get(
            "/search/chats",
            params=query,
        )
        body = response.json()
        match response.status_code:
            case 200:
                return deserialize(SearchChatsResponse, body)
            case 401:
                raise deserialize(OAuthError, body)
            case _:
                raise deserialize(ApiError, body)

    async def search_chats_all(
        self,
        params: SearchChatsParams | None = None,
    ) -> list[Chat]:
        items: list[Chat] = []
        cursor: str | None = None
        while True:
            if params is None:
                params = SearchChatsParams()
            params.cursor = cursor
            response = await self.search_chats(params=params)
            items.extend(response.data)
            if not response.data:
                break
            cursor = response.meta.paginate.next_page
        return items

    async def search_messages(
        self,
        params: SearchMessagesParams | None = None,
    ) -> SearchMessagesResponse:
        query: list[tuple[str, str]] = []
        if params is not None and params.query is not None:
            query.append(("query", params.query))
        if params is not None and params.limit is not None:
            query.append(("limit", str(params.limit)))
        if params is not None and params.cursor is not None:
            query.append(("cursor", params.cursor))
        if params is not None and params.order is not None:
            query.append(("order", params.order))
        if params is not None and params.created_from is not None:
            query.append(("created_from", params.created_from.isoformat()))
        if params is not None and params.created_to is not None:
            query.append(("created_to", params.created_to.isoformat()))
        if params is not None and params.chat_ids is not None:
            for v in params.chat_ids:
                query.append(("chat_ids[]", str(v)))
        if params is not None and params.user_ids is not None:
            for v in params.user_ids:
                query.append(("user_ids[]", str(v)))
        if params is not None and params.active is not None:
            query.append(("active", str(params.active).lower()))
        response = await self._client.get(
            "/search/messages",
            params=query,
        )
        body = response.json()
        match response.status_code:
            case 200:
                return deserialize(SearchMessagesResponse, body)
            case 401:
                raise deserialize(OAuthError, body)
            case _:
                raise deserialize(ApiError, body)

    async def search_messages_all(
        self,
        params: SearchMessagesParams | None = None,
    ) -> list[Message]:
        items: list[Message] = []
        cursor: str | None = None
        while True:
            if params is None:
                params = SearchMessagesParams()
            params.cursor = cursor
            response = await self.search_messages(params=params)
            items.extend(response.data)
            if not response.data:
                break
            cursor = response.meta.paginate.next_page
        return items

    async def search_users(
        self,
        params: SearchUsersParams | None = None,
    ) -> SearchUsersResponse:
        query: list[tuple[str, str]] = []
        if params is not None and params.query is not None:
            query.append(("query", params.query))
        if params is not None and params.limit is not None:
            query.append(("limit", str(params.limit)))
        if params is not None and params.cursor is not None:
            query.append(("cursor", params.cursor))
        if params is not None and params.sort is not None:
            query.append(("sort", params.sort))
        if params is not None and params.order is not None:
            query.append(("order", params.order))
        if params is not None and params.created_from is not None:
            query.append(("created_from", params.created_from.isoformat()))
        if params is not None and params.created_to is not None:
            query.append(("created_to", params.created_to.isoformat()))
        if params is not None and params.company_roles is not None:
            for v in params.company_roles:
                query.append(("company_roles[]", str(v)))
        response = await self._client.get(
            "/search/users",
            params=query,
        )
        body = response.json()
        match response.status_code:
            case 200:
                return deserialize(SearchUsersResponse, body)
            case 401:
                raise deserialize(OAuthError, body)
            case _:
                raise deserialize(ApiError, body)

    async def search_users_all(
        self,
        params: SearchUsersParams | None = None,
    ) -> list[User]:
        items: list[User] = []
        cursor: str | None = None
        while True:
            if params is None:
                params = SearchUsersParams()
            params.cursor = cursor
            response = await self.search_users(params=params)
            items.extend(response.data)
            if not response.data:
                break
            cursor = response.meta.paginate.next_page
        return items


class TasksService:
    async def list_tasks(
        self,
        params: ListTasksParams | None = None,
    ) -> ListTasksResponse:
        raise NotImplementedError("Tasks.listTasks is not implemented")

    async def list_tasks_all(
        self,
        params: ListTasksParams | None = None,
    ) -> list[Task]:
        raise NotImplementedError("Tasks.listTasksAll is not implemented")

    async def get_task(
        self,
        id: int,
    ) -> Task:
        raise NotImplementedError("Tasks.getTask is not implemented")

    async def create_task(
        self,
        request: TaskCreateRequest,
    ) -> Task:
        raise NotImplementedError("Tasks.createTask is not implemented")

    async def update_task(
        self,
        id: int,
        request: TaskUpdateRequest,
    ) -> Task:
        raise NotImplementedError("Tasks.updateTask is not implemented")

    async def delete_task(
        self,
        id: int,
    ) -> None:
        raise NotImplementedError("Tasks.deleteTask is not implemented")


class TasksServiceImpl(TasksService):
    def __init__(self, client: httpx.AsyncClient) -> None:
        self._client = client

    async def list_tasks(
        self,
        params: ListTasksParams | None = None,
    ) -> ListTasksResponse:
        query: dict[str, str] = {}
        if params is not None and params.limit is not None:
            query["limit"] = str(params.limit)
        if params is not None and params.cursor is not None:
            query["cursor"] = params.cursor
        response = await self._client.get(
            "/tasks",
            params=query,
        )
        body = response.json()
        match response.status_code:
            case 200:
                return deserialize(ListTasksResponse, body)
            case 401:
                raise deserialize(OAuthError, body)
            case _:
                raise deserialize(ApiError, body)

    async def list_tasks_all(
        self,
        params: ListTasksParams | None = None,
    ) -> list[Task]:
        items: list[Task] = []
        cursor: str | None = None
        while True:
            if params is None:
                params = ListTasksParams()
            params.cursor = cursor
            response = await self.list_tasks(params=params)
            items.extend(response.data)
            if not response.data:
                break
            cursor = response.meta.paginate.next_page
        return items

    async def get_task(
        self,
        id: int,
    ) -> Task:
        response = await self._client.get(
            f"/tasks/{id}",
        )
        body = response.json()
        match response.status_code:
            case 200:
                return deserialize(Task, body["data"])
            case 401:
                raise deserialize(OAuthError, body)
            case _:
                raise deserialize(ApiError, body)

    async def create_task(
        self,
        request: TaskCreateRequest,
    ) -> Task:
        response = await self._client.post(
            "/tasks",
            json=serialize(request),
        )
        body = response.json()
        match response.status_code:
            case 201:
                return deserialize(Task, body["data"])
            case 401:
                raise deserialize(OAuthError, body)
            case _:
                raise deserialize(ApiError, body)

    async def update_task(
        self,
        id: int,
        request: TaskUpdateRequest,
    ) -> Task:
        response = await self._client.put(
            f"/tasks/{id}",
            json=serialize(request),
        )
        body = response.json()
        match response.status_code:
            case 200:
                return deserialize(Task, body["data"])
            case 401:
                raise deserialize(OAuthError, body)
            case _:
                raise deserialize(ApiError, body)

    async def delete_task(
        self,
        id: int,
    ) -> None:
        response = await self._client.delete(
            f"/tasks/{id}",
        )
        match response.status_code:
            case 204:
                return
            case 401:
                raise deserialize(OAuthError, response.json())
            case _:
                raise deserialize(ApiError, response.json())


class UsersService:
    async def list_users(
        self,
        params: ListUsersParams | None = None,
    ) -> ListUsersResponse:
        raise NotImplementedError("Users.listUsers is not implemented")

    async def list_users_all(
        self,
        params: ListUsersParams | None = None,
    ) -> list[User]:
        raise NotImplementedError("Users.listUsersAll is not implemented")

    async def get_user(
        self,
        id: int,
    ) -> User:
        raise NotImplementedError("Users.getUser is not implemented")

    async def get_user_status(
        self,
        user_id: int,
    ) -> object:
        raise NotImplementedError("Users.getUserStatus is not implemented")

    async def create_user(
        self,
        request: UserCreateRequest,
    ) -> User:
        raise NotImplementedError("Users.createUser is not implemented")

    async def update_user(
        self,
        id: int,
        request: UserUpdateRequest,
    ) -> User:
        raise NotImplementedError("Users.updateUser is not implemented")

    async def update_user_avatar(
        self,
        user_id: int,
        image: bytes,
    ) -> AvatarData:
        raise NotImplementedError("Users.updateUserAvatar is not implemented")

    async def update_user_status(
        self,
        user_id: int,
        request: StatusUpdateRequest,
    ) -> UserStatus:
        raise NotImplementedError("Users.updateUserStatus is not implemented")

    async def delete_user(
        self,
        id: int,
    ) -> None:
        raise NotImplementedError("Users.deleteUser is not implemented")

    async def delete_user_avatar(
        self,
        user_id: int,
    ) -> None:
        raise NotImplementedError("Users.deleteUserAvatar is not implemented")

    async def delete_user_status(
        self,
        user_id: int,
    ) -> None:
        raise NotImplementedError("Users.deleteUserStatus is not implemented")


class UsersServiceImpl(UsersService):
    def __init__(self, client: httpx.AsyncClient) -> None:
        self._client = client

    async def list_users(
        self,
        params: ListUsersParams | None = None,
    ) -> ListUsersResponse:
        query: dict[str, str] = {}
        if params is not None and params.query is not None:
            query["query"] = params.query
        if params is not None and params.limit is not None:
            query["limit"] = str(params.limit)
        if params is not None and params.cursor is not None:
            query["cursor"] = params.cursor
        response = await self._client.get(
            "/users",
            params=query,
        )
        body = response.json()
        match response.status_code:
            case 200:
                return deserialize(ListUsersResponse, body)
            case 401:
                raise deserialize(OAuthError, body)
            case _:
                raise deserialize(ApiError, body)

    async def list_users_all(
        self,
        params: ListUsersParams | None = None,
    ) -> list[User]:
        items: list[User] = []
        cursor: str | None = None
        while True:
            if params is None:
                params = ListUsersParams()
            params.cursor = cursor
            response = await self.list_users(params=params)
            items.extend(response.data)
            if not response.data:
                break
            cursor = response.meta.paginate.next_page
        return items

    async def get_user(
        self,
        id: int,
    ) -> User:
        response = await self._client.get(
            f"/users/{id}",
        )
        body = response.json()
        match response.status_code:
            case 200:
                return deserialize(User, body["data"])
            case 401:
                raise deserialize(OAuthError, body)
            case _:
                raise deserialize(ApiError, body)

    async def get_user_status(
        self,
        user_id: int,
    ) -> object:
        response = await self._client.get(
            f"/users/{user_id}/status",
        )
        body = response.json()
        match response.status_code:
            case 200:
                return deserialize(object, body)
            case 401:
                raise deserialize(OAuthError, body)
            case _:
                raise deserialize(ApiError, body)

    async def create_user(
        self,
        request: UserCreateRequest,
    ) -> User:
        response = await self._client.post(
            "/users",
            json=serialize(request),
        )
        body = response.json()
        match response.status_code:
            case 201:
                return deserialize(User, body["data"])
            case 401:
                raise deserialize(OAuthError, body)
            case _:
                raise deserialize(ApiError, body)

    async def update_user(
        self,
        id: int,
        request: UserUpdateRequest,
    ) -> User:
        response = await self._client.put(
            f"/users/{id}",
            json=serialize(request),
        )
        body = response.json()
        match response.status_code:
            case 200:
                return deserialize(User, body["data"])
            case 401:
                raise deserialize(OAuthError, body)
            case _:
                raise deserialize(ApiError, body)

    async def update_user_avatar(
        self,
        user_id: int,
        image: bytes,
    ) -> AvatarData:
        data: dict[str, str] = {}
        response = await self._client.post(
            f"/users/{user_id}/avatar",
            data=data,
            files={"image": image},
        )
        body = response.json()
        match response.status_code:
            case 200:
                return deserialize(AvatarData, body["data"])
            case 401:
                raise deserialize(OAuthError, body)
            case _:
                raise deserialize(ApiError, body)

    async def update_user_status(
        self,
        user_id: int,
        request: StatusUpdateRequest,
    ) -> UserStatus:
        response = await self._client.put(
            f"/users/{user_id}/status",
            json=serialize(request),
        )
        body = response.json()
        match response.status_code:
            case 200:
                return deserialize(UserStatus, body["data"])
            case 401:
                raise deserialize(OAuthError, body)
            case _:
                raise deserialize(ApiError, body)

    async def delete_user(
        self,
        id: int,
    ) -> None:
        response = await self._client.delete(
            f"/users/{id}",
        )
        match response.status_code:
            case 204:
                return
            case 401:
                raise deserialize(OAuthError, response.json())
            case _:
                raise deserialize(ApiError, response.json())

    async def delete_user_avatar(
        self,
        user_id: int,
    ) -> None:
        response = await self._client.delete(
            f"/users/{user_id}/avatar",
        )
        match response.status_code:
            case 204:
                return
            case 401:
                raise deserialize(OAuthError, response.json())
            case _:
                raise deserialize(ApiError, response.json())

    async def delete_user_status(
        self,
        user_id: int,
    ) -> None:
        response = await self._client.delete(
            f"/users/{user_id}/status",
        )
        match response.status_code:
            case 204:
                return
            case 401:
                raise deserialize(OAuthError, response.json())
            case _:
                raise deserialize(ApiError, response.json())


class ViewsService:
    async def open_view(
        self,
        request: OpenViewRequest,
    ) -> None:
        raise NotImplementedError("Views.openView is not implemented")


class ViewsServiceImpl(ViewsService):
    def __init__(self, client: httpx.AsyncClient) -> None:
        self._client = client

    async def open_view(
        self,
        request: OpenViewRequest,
    ) -> None:
        response = await self._client.post(
            "/views/open",
            json=serialize(request),
        )
        match response.status_code:
            case 201:
                return
            case 401:
                raise deserialize(OAuthError, response.json())
            case _:
                raise deserialize(ApiError, response.json())


class PachcaClient:
    def __init__(self, token: str, base_url: str = "https://api.pachca.com/api/shared/v1", bots: BotsService | None = None, chats: ChatsService | None = None, common: CommonService | None = None, group_tags: GroupTagsService | None = None, link_previews: LinkPreviewsService | None = None, members: MembersService | None = None, messages: MessagesService | None = None, profile: ProfileService | None = None, reactions: ReactionsService | None = None, read_members: ReadMembersService | None = None, search: SearchService | None = None, security: SecurityService | None = None, tasks: TasksService | None = None, threads: ThreadsService | None = None, users: UsersService | None = None, views: ViewsService | None = None) -> None:
        self._client = httpx.AsyncClient(
            base_url=base_url,
            headers={"Authorization": f"Bearer {token}"},
            transport=RetryTransport(httpx.AsyncHTTPTransport()),
        )
        self.bots: BotsService = bots or BotsServiceImpl(self._client)
        self.chats: ChatsService = chats or ChatsServiceImpl(self._client)
        self.common: CommonService = common or CommonServiceImpl(self._client)
        self.group_tags: GroupTagsService = group_tags or GroupTagsServiceImpl(self._client)
        self.link_previews: LinkPreviewsService = link_previews or LinkPreviewsServiceImpl(self._client)
        self.members: MembersService = members or MembersServiceImpl(self._client)
        self.messages: MessagesService = messages or MessagesServiceImpl(self._client)
        self.profile: ProfileService = profile or ProfileServiceImpl(self._client)
        self.reactions: ReactionsService = reactions or ReactionsServiceImpl(self._client)
        self.read_members: ReadMembersService = read_members or ReadMembersServiceImpl(self._client)
        self.search: SearchService = search or SearchServiceImpl(self._client)
        self.security: SecurityService = security or SecurityServiceImpl(self._client)
        self.tasks: TasksService = tasks or TasksServiceImpl(self._client)
        self.threads: ThreadsService = threads or ThreadsServiceImpl(self._client)
        self.users: UsersService = users or UsersServiceImpl(self._client)
        self.views: ViewsService = views or ViewsServiceImpl(self._client)

    async def close(self) -> None:
        await self._client.aclose()

    @classmethod
    def stub(
        cls,
        bots: BotsService | None = None,
        chats: ChatsService | None = None,
        common: CommonService | None = None,
        group_tags: GroupTagsService | None = None,
        link_previews: LinkPreviewsService | None = None,
        members: MembersService | None = None,
        messages: MessagesService | None = None,
        profile: ProfileService | None = None,
        reactions: ReactionsService | None = None,
        read_members: ReadMembersService | None = None,
        search: SearchService | None = None,
        security: SecurityService | None = None,
        tasks: TasksService | None = None,
        threads: ThreadsService | None = None,
        users: UsersService | None = None,
        views: ViewsService | None = None,
    ) -> "PachcaClient":
        self = cls.__new__(cls)
        self._client = None
        self.bots = bots or BotsService()
        self.chats = chats or ChatsService()
        self.common = common or CommonService()
        self.group_tags = group_tags or GroupTagsService()
        self.link_previews = link_previews or LinkPreviewsService()
        self.members = members or MembersService()
        self.messages = messages or MessagesService()
        self.profile = profile or ProfileService()
        self.reactions = reactions or ReactionsService()
        self.read_members = read_members or ReadMembersService()
        self.search = search or SearchService()
        self.security = security or SecurityService()
        self.tasks = tasks or TasksService()
        self.threads = threads or ThreadsService()
        self.users = users or UsersService()
        self.views = views or ViewsService()
        return self
