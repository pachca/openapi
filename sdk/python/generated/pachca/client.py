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
    TagNamesFilter,
    GetTagUsersParams,
    GroupTagRequest,
    ListChatMessagesParams,
    ListChatMessagesResponse,
    Message,
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
    StatusUpdateRequest,
    UserStatus,
    SearchChatsParams,
    ChatSubtype,
    SearchMessagesParams,
    SearchUsersParams,
    SearchSortOrder,
    ListTasksParams,
    ListTasksResponse,
    Task,
    TaskCreateRequest,
    TaskUpdateRequest,
    ListUsersParams,
    UserCreateRequest,
    UserUpdateRequest,
    OpenViewRequest,
)
from .utils import deserialize, serialize, RetryTransport

class SecurityService:
    def __init__(self, client: httpx.AsyncClient) -> None:
        self._client = client

    async def get_audit_events(
        self,
        params: GetAuditEventsParams,
    ) -> GetAuditEventsResponse:
        query: list[tuple[str, str]] = []
        query.append(("start_time", params.start_time))
        query.append(("end_time", params.end_time))
        if params is not None and params.event_key is not None:
            query.append(("event_key", params.event_key))
        if params is not None and params.actor_id is not None:
            query.append(("actor_id", params.actor_id))
        if params is not None and params.actor_type is not None:
            query.append(("actor_type", params.actor_type))
        if params is not None and params.entity_id is not None:
            query.append(("entity_id", params.entity_id))
        if params is not None and params.entity_type is not None:
            query.append(("entity_type", params.entity_type))
        if params is not None and params.limit is not None:
            query.append(("limit", str(params.limit)))
        if params is not None and params.cursor is not None:
            query.append(("cursor", params.cursor))
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
        params: GetAuditEventsParams,
    ) -> list[AuditEvent]:
        items: list[AuditEvent] = []
        cursor: str | None = None
        while True:
            if params is None:
                params = GetAuditEventsParams()
            params.cursor = cursor
            response = await self.get_audit_events(params=params)
            items.extend(response.data)
            cursor = response.meta.paginate.next_page if response.meta and response.meta.paginate else None
            if not cursor:
                break
        return items


class BotsService:
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
            cursor = response.meta.paginate.next_page if response.meta and response.meta.paginate else None
            if not cursor:
                break
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
    def __init__(self, client: httpx.AsyncClient) -> None:
        self._client = client

    async def list_chats(
        self,
        params: ListChatsParams | None = None,
    ) -> ListChatsResponse:
        query: dict[str, str] = {}
        if params is not None and params.sort_id is not None:
            query["sort[{field}]"] = params.sort_id
        if params is not None and params.availability is not None:
            query["availability"] = params.availability
        if params is not None and params.last_message_at_after is not None:
            query["last_message_at_after"] = params.last_message_at_after
        if params is not None and params.last_message_at_before is not None:
            query["last_message_at_before"] = params.last_message_at_before
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
            cursor = response.meta.paginate.next_page if response.meta and response.meta.paginate else None
            if not cursor:
                break
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
            cursor = response.meta.paginate.next_page if response.meta and response.meta.paginate else None
            if not cursor:
                break
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
    def __init__(self, client: httpx.AsyncClient) -> None:
        self._client = client

    async def list_tags(
        self,
        params: ListTagsParams | None = None,
    ) -> ListTagsResponse:
        query: dict[str, str] = {}
        if params is not None and params.names is not None:
            query["names"] = params.names
        if params is not None and params.limit is not None:
            query["limit"] = str(params.limit)
        if params is not None and params.cursor is not None:
            query["cursor"] = params.cursor
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
            cursor = response.meta.paginate.next_page if response.meta and response.meta.paginate else None
            if not cursor:
                break
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
    ) -> ListMembersResponse:
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
                return deserialize(ListMembersResponse, body)
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
            cursor = response.meta.paginate.next_page if response.meta and response.meta.paginate else None
            if not cursor:
                break
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
    def __init__(self, client: httpx.AsyncClient) -> None:
        self._client = client

    async def list_chat_messages(
        self,
        params: ListChatMessagesParams,
    ) -> ListChatMessagesResponse:
        query: list[tuple[str, str]] = []
        query.append(("chat_id", str(params.chat_id)))
        if params is not None and params.sort_id is not None:
            query.append(("sort[{field}]", params.sort_id))
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
            cursor = response.meta.paginate.next_page if response.meta and response.meta.paginate else None
            if not cursor:
                break
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
            case 201:
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
            cursor = response.meta.paginate.next_page if response.meta and response.meta.paginate else None
            if not cursor:
                break
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
    def __init__(self, client: httpx.AsyncClient) -> None:
        self._client = client

    async def search_chats(
        self,
        params: SearchChatsParams | None = None,
    ) -> ListChatsResponse:
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
            query["created_from"] = params.created_from
        if params is not None and params.created_to is not None:
            query["created_to"] = params.created_to
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
                return deserialize(ListChatsResponse, body)
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
            cursor = response.meta.paginate.next_page if response.meta and response.meta.paginate else None
            if not cursor:
                break
        return items

    async def search_messages(
        self,
        params: SearchMessagesParams | None = None,
    ) -> ListChatMessagesResponse:
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
            query["created_from"] = params.created_from
        if params is not None and params.created_to is not None:
            query["created_to"] = params.created_to
        if params is not None and params.chat_ids is not None:
            query["chat_ids"] = params.chat_ids
        if params is not None and params.user_ids is not None:
            query["user_ids"] = params.user_ids
        if params is not None and params.active is not None:
            query["active"] = str(params.active).lower()
        response = await self._client.get(
            "/search/messages",
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
            cursor = response.meta.paginate.next_page if response.meta and response.meta.paginate else None
            if not cursor:
                break
        return items

    async def search_users(
        self,
        params: SearchUsersParams | None = None,
    ) -> ListMembersResponse:
        query: dict[str, str] = {}
        if params is not None and params.query is not None:
            query["query"] = params.query
        if params is not None and params.limit is not None:
            query["limit"] = str(params.limit)
        if params is not None and params.cursor is not None:
            query["cursor"] = params.cursor
        if params is not None and params.sort is not None:
            query["sort"] = params.sort
        if params is not None and params.order is not None:
            query["order"] = params.order
        if params is not None and params.created_from is not None:
            query["created_from"] = params.created_from
        if params is not None and params.created_to is not None:
            query["created_to"] = params.created_to
        if params is not None and params.company_roles is not None:
            query["company_roles"] = params.company_roles
        response = await self._client.get(
            "/search/users",
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
            cursor = response.meta.paginate.next_page if response.meta and response.meta.paginate else None
            if not cursor:
                break
        return items


class TasksService:
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
            cursor = response.meta.paginate.next_page if response.meta and response.meta.paginate else None
            if not cursor:
                break
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
    def __init__(self, client: httpx.AsyncClient) -> None:
        self._client = client

    async def list_users(
        self,
        params: ListUsersParams | None = None,
    ) -> ListMembersResponse:
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
                return deserialize(ListMembersResponse, body)
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
            cursor = response.meta.paginate.next_page if response.meta and response.meta.paginate else None
            if not cursor:
                break
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
    def __init__(self, token: str, base_url: str = "https://api.pachca.com/api/shared/v1") -> None:
        self._client = httpx.AsyncClient(
            base_url=base_url,
            headers={"Authorization": f"Bearer {token}"},
            transport=RetryTransport(httpx.AsyncHTTPTransport()),
        )
        self.bots = BotsService(self._client)
        self.chats = ChatsService(self._client)
        self.common = CommonService(self._client)
        self.group_tags = GroupTagsService(self._client)
        self.link_previews = LinkPreviewsService(self._client)
        self.members = MembersService(self._client)
        self.messages = MessagesService(self._client)
        self.profile = ProfileService(self._client)
        self.reactions = ReactionsService(self._client)
        self.read_members = ReadMembersService(self._client)
        self.search = SearchService(self._client)
        self.security = SecurityService(self._client)
        self.tasks = TasksService(self._client)
        self.threads = ThreadsService(self._client)
        self.users = UsersService(self._client)
        self.views = ViewsService(self._client)

    async def close(self) -> None:
        await self._client.aclose()
