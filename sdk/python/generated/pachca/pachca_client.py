"""Ergonomic facade for Pachca API. Auto-generated — do not edit."""

from __future__ import annotations

from typing import Any

from .client import AuthenticatedClient
from .types import UNSET, Unset
from .models.api_error import ApiError
from .models.o_auth_error import OAuthError

import httpx

# Operation modules
from .api.bots import bot_operations_delete_webhook_event
from .api.bots import bot_operations_get_webhook_events
from .api.bots import bot_operations_update_bot
from .api.chats import chat_operations_archive_chat
from .api.chats import chat_operations_create_chat
from .api.chats import chat_operations_get_chat
from .api.chats import chat_operations_list_chats
from .api.chats import chat_operations_unarchive_chat
from .api.chats import chat_operations_update_chat
from .api.common import common_operations_list_properties
from .api.common import export_operations_download_export
from .api.common import export_operations_request_export
from .api.common import upload_operations_get_upload_params
from .api.group_tags import group_tag_operations_create_tag
from .api.group_tags import group_tag_operations_delete_tag
from .api.group_tags import group_tag_operations_get_tag
from .api.group_tags import group_tag_operations_get_tag_users
from .api.group_tags import group_tag_operations_list_tags
from .api.group_tags import group_tag_operations_update_tag
from .api.link_previews import link_preview_operations_create_link_previews
from .api.members import chat_member_operations_add_members
from .api.members import chat_member_operations_add_tags
from .api.members import chat_member_operations_leave_chat
from .api.members import chat_member_operations_list_members
from .api.members import chat_member_operations_remove_member
from .api.members import chat_member_operations_remove_tag
from .api.members import chat_member_operations_update_member_role
from .api.messages import chat_message_operations_list_chat_messages
from .api.messages import message_operations_create_message
from .api.messages import message_operations_delete_message
from .api.messages import message_operations_get_message
from .api.messages import message_operations_pin_message
from .api.messages import message_operations_unpin_message
from .api.messages import message_operations_update_message
from .api.profile import o_auth_operations_get_token_info
from .api.profile import profile_operations_delete_status
from .api.profile import profile_operations_get_profile
from .api.profile import profile_operations_get_status
from .api.profile import profile_operations_update_status
from .api.reactions import reaction_operations_add_reaction
from .api.reactions import reaction_operations_list_reactions
from .api.reactions import reaction_operations_remove_reaction
from .api.read_member import read_member_operations_list_read_members
from .api.search import search_operations_search_chats
from .api.search import search_operations_search_messages
from .api.search import search_operations_search_users
from .api.security import security_operations_get_audit_events
from .api.tasks import task_operations_create_task
from .api.tasks import task_operations_delete_task
from .api.tasks import task_operations_get_task
from .api.tasks import task_operations_list_tasks
from .api.tasks import task_operations_update_task
from .api.thread import thread_operations_create_thread
from .api.thread import thread_operations_get_thread
from .api.users import user_operations_create_user
from .api.users import user_operations_delete_user
from .api.users import user_operations_get_user
from .api.users import user_operations_list_users
from .api.users import user_operations_update_user
from .api.users import user_status_operations_delete_user_status
from .api.users import user_status_operations_get_user_status
from .api.users import user_status_operations_update_user_status
from .api.views import form_operations_open_view

# Models
from .models.access_token_info import AccessTokenInfo
from .models.add_members_request import AddMembersRequest
from .models.add_tags_request import AddTagsRequest
from .models.audit_event import AuditEvent
from .models.bot_operations_get_webhook_events_response_200 import BotOperationsGetWebhookEventsResponse200
from .models.bot_operations_update_bot_response_200 import BotOperationsUpdateBotResponse200
from .models.bot_response import BotResponse
from .models.bot_update_request import BotUpdateRequest
from .models.bot_update_request_bot import BotUpdateRequestBot
from .models.chat import Chat
from .models.chat_create_request import ChatCreateRequest
from .models.chat_create_request_chat import ChatCreateRequestChat
from .models.chat_member_operations_list_members_response_200 import ChatMemberOperationsListMembersResponse200
from .models.chat_message_operations_list_chat_messages_response_200 import ChatMessageOperationsListChatMessagesResponse200
from .models.chat_operations_create_chat_response_201 import ChatOperationsCreateChatResponse201
from .models.chat_operations_get_chat_response_200 import ChatOperationsGetChatResponse200
from .models.chat_operations_list_chats_response_200 import ChatOperationsListChatsResponse200
from .models.chat_operations_update_chat_response_200 import ChatOperationsUpdateChatResponse200
from .models.chat_update_request import ChatUpdateRequest
from .models.chat_update_request_chat import ChatUpdateRequestChat
from .models.common_operations_list_properties_response_200 import CommonOperationsListPropertiesResponse200
from .models.custom_property_definition import CustomPropertyDefinition
from .models.export_request import ExportRequest
from .models.group_tag import GroupTag
from .models.group_tag_operations_create_tag_response_201 import GroupTagOperationsCreateTagResponse201
from .models.group_tag_operations_get_tag_response_200 import GroupTagOperationsGetTagResponse200
from .models.group_tag_operations_get_tag_users_response_200 import GroupTagOperationsGetTagUsersResponse200
from .models.group_tag_operations_list_tags_response_200 import GroupTagOperationsListTagsResponse200
from .models.group_tag_operations_update_tag_response_200 import GroupTagOperationsUpdateTagResponse200
from .models.group_tag_request import GroupTagRequest
from .models.group_tag_request_group_tag import GroupTagRequestGroupTag
from .models.link_previews_request import LinkPreviewsRequest
from .models.message import Message
from .models.message_create_request import MessageCreateRequest
from .models.message_create_request_message import MessageCreateRequestMessage
from .models.message_operations_create_message_response_201 import MessageOperationsCreateMessageResponse201
from .models.message_operations_get_message_response_200 import MessageOperationsGetMessageResponse200
from .models.message_operations_update_message_response_200 import MessageOperationsUpdateMessageResponse200
from .models.message_update_request import MessageUpdateRequest
from .models.message_update_request_message import MessageUpdateRequestMessage
from .models.o_auth_operations_get_token_info_response_200 import OAuthOperationsGetTokenInfoResponse200
from .models.open_view_request import OpenViewRequest
from .models.profile_operations_get_profile_response_200 import ProfileOperationsGetProfileResponse200
from .models.profile_operations_get_status_response_200 import ProfileOperationsGetStatusResponse200
from .models.profile_operations_update_status_response_200 import ProfileOperationsUpdateStatusResponse200
from .models.reaction import Reaction
from .models.reaction_operations_list_reactions_response_200 import ReactionOperationsListReactionsResponse200
from .models.reaction_request import ReactionRequest
from .models.read_member_operations_list_read_members_response_200 import ReadMemberOperationsListReadMembersResponse200
from .models.search_operations_search_chats_response_200 import SearchOperationsSearchChatsResponse200
from .models.search_operations_search_messages_response_200 import SearchOperationsSearchMessagesResponse200
from .models.search_operations_search_users_response_200 import SearchOperationsSearchUsersResponse200
from .models.security_operations_get_audit_events_response_200 import SecurityOperationsGetAuditEventsResponse200
from .models.status_update_request import StatusUpdateRequest
from .models.status_update_request_status import StatusUpdateRequestStatus
from .models.task import Task
from .models.task_create_request import TaskCreateRequest
from .models.task_create_request_task import TaskCreateRequestTask
from .models.task_operations_create_task_response_201 import TaskOperationsCreateTaskResponse201
from .models.task_operations_get_task_response_200 import TaskOperationsGetTaskResponse200
from .models.task_operations_list_tasks_response_200 import TaskOperationsListTasksResponse200
from .models.task_operations_update_task_response_200 import TaskOperationsUpdateTaskResponse200
from .models.task_update_request import TaskUpdateRequest
from .models.task_update_request_task import TaskUpdateRequestTask
from .models.thread import Thread
from .models.thread_operations_create_thread_response_201 import ThreadOperationsCreateThreadResponse201
from .models.thread_operations_get_thread_response_200 import ThreadOperationsGetThreadResponse200
from .models.update_member_role_request import UpdateMemberRoleRequest
from .models.upload_params import UploadParams
from .models.user import User
from .models.user_create_request import UserCreateRequest
from .models.user_operations_create_user_response_201 import UserOperationsCreateUserResponse201
from .models.user_operations_get_user_response_200 import UserOperationsGetUserResponse200
from .models.user_operations_list_users_response_200 import UserOperationsListUsersResponse200
from .models.user_operations_update_user_response_200 import UserOperationsUpdateUserResponse200
from .models.user_status import UserStatus
from .models.user_status_operations_get_user_status_response_200 import UserStatusOperationsGetUserStatusResponse200
from .models.user_status_operations_update_user_status_response_200 import UserStatusOperationsUpdateUserStatusResponse200
from .models.user_update_request import UserUpdateRequest
from .models.user_update_request_user import UserUpdateRequestUser
from .models.webhook_event import WebhookEvent

# Enums
from .models.audit_event_key import AuditEventKey
from .models.chat_availability import ChatAvailability
from .models.chat_member_role import ChatMemberRole
from .models.chat_member_role_filter import ChatMemberRoleFilter
from .models.chat_subtype import ChatSubtype
from .models.search_entity_type import SearchEntityType
from .models.search_sort_order import SearchSortOrder
from .models.sort_order import SortOrder


# ── Exceptions ──────────────────────────────────────────────────────────────────


class PachcaAPIError(Exception):
    """Raised on 4xx/5xx API errors."""

    def __init__(self, *, errors: list[dict[str, str]] | None = None, message: str | None = None):
        self.errors = errors or []
        self.message = message or (self.errors[0]["message"] if self.errors else "API error")
        super().__init__(self.message)


class PachcaAuthError(Exception):
    """Raised on 401/403 OAuth errors."""

    def __init__(self, *, message: str = "Auth error"):
        self.message = message
        super().__init__(self.message)


# ── Helpers ─────────────────────────────────────────────────────────────────────


def _raise_for_error(result: Any) -> None:
    """Check sync() result and raise on API/OAuth errors."""
    if isinstance(result, ApiError):
        errors = [{"key": e.key, "message": e.message} for e in result.errors] if result.errors else []
        raise PachcaAPIError(errors=errors)
    if isinstance(result, OAuthError):
        raise PachcaAuthError(message=result.error_description or result.error or "Auth error")


def _get_cursor(result: Any) -> str | None:
    """Extract pagination cursor from response meta."""
    meta = getattr(result, "meta", UNSET)
    if isinstance(meta, Unset):
        return None
    paginate = getattr(meta, "paginate", UNSET)
    if isinstance(paginate, Unset):
        return None
    next_page = getattr(paginate, "next_page", UNSET)
    if isinstance(next_page, Unset):
        return None
    return next_page


class PaginatedResponse(list):
    """List subclass with pagination metadata."""

    def __init__(self, data: list, next_cursor: str | None = None):
        super().__init__(data)
        self.next_cursor = next_cursor


# ── Services ────────────────────────────────────────────────────────────────────


class BotsService:
    def __init__(self, client: AuthenticatedClient):
        self._client = client

    def delete_webhook_event(self, id: str) -> None:
        result = bot_operations_delete_webhook_event.sync(id, client=self._client)
        _raise_for_error(result)

    def get_webhook_events(self, limit: int | Unset = 50, cursor: str | Unset = UNSET) -> PaginatedResponse[WebhookEvent]:
        result = bot_operations_get_webhook_events.sync(client=self._client, limit=limit, cursor=cursor)
        _raise_for_error(result)
        return PaginatedResponse(data=result.data, next_cursor=_get_cursor(result))

    def update_bot(self, id: int, bot: BotUpdateRequestBot) -> BotResponse:
        result = bot_operations_update_bot.sync(id, client=self._client, body=BotUpdateRequest(bot=bot))
        _raise_for_error(result)
        return result.data


class ChatsService:
    def __init__(self, client: AuthenticatedClient):
        self._client = client

    def archive_chat(self, id: int) -> None:
        result = chat_operations_archive_chat.sync(id, client=self._client)
        _raise_for_error(result)

    def create_chat(self, chat: ChatCreateRequestChat) -> Chat:
        result = chat_operations_create_chat.sync(client=self._client, body=ChatCreateRequest(chat=chat))
        _raise_for_error(result)
        return result.data

    def get_chat(self, id: int) -> Chat:
        result = chat_operations_get_chat.sync(id, client=self._client)
        _raise_for_error(result)
        return result.data

    def list_chats(self, sortfield: SortOrder | Unset = SortOrder.DESC, availability: ChatAvailability | Unset = ChatAvailability.IS_MEMBER, last_message_at_after: datetime.datetime | Unset = UNSET, last_message_at_before: datetime.datetime | Unset = UNSET, personal: bool | Unset = UNSET, limit: int | Unset = 50, cursor: str | Unset = UNSET) -> PaginatedResponse[Chat]:
        result = chat_operations_list_chats.sync(client=self._client, sortfield=sortfield, availability=availability, last_message_at_after=last_message_at_after, last_message_at_before=last_message_at_before, personal=personal, limit=limit, cursor=cursor)
        _raise_for_error(result)
        return PaginatedResponse(data=result.data, next_cursor=_get_cursor(result))

    def unarchive_chat(self, id: int) -> None:
        result = chat_operations_unarchive_chat.sync(id, client=self._client)
        _raise_for_error(result)

    def update_chat(self, id: int, chat: ChatUpdateRequestChat) -> Chat:
        result = chat_operations_update_chat.sync(id, client=self._client, body=ChatUpdateRequest(chat=chat))
        _raise_for_error(result)
        return result.data


class CommonService:
    def __init__(self, client: AuthenticatedClient):
        self._client = client

    def list_properties(self, entity_type: SearchEntityType) -> PaginatedResponse[CustomPropertyDefinition]:
        result = common_operations_list_properties.sync(client=self._client, entity_type=entity_type)
        _raise_for_error(result)
        return PaginatedResponse(data=result.data, next_cursor=_get_cursor(result))

    def download_export(self, id: int) -> None:
        result = export_operations_download_export.sync(id, client=self._client)
        _raise_for_error(result)

    def request_export(self, body: ExportRequest) -> None:
        result = export_operations_request_export.sync(client=self._client, body=body)
        _raise_for_error(result)

    def get_upload_params(self) -> UploadParams:
        result = upload_operations_get_upload_params.sync(client=self._client)
        _raise_for_error(result)
        return result


class GroupTagsService:
    def __init__(self, client: AuthenticatedClient):
        self._client = client

    def create_tag(self, group_tag: GroupTagRequestGroupTag) -> GroupTag:
        result = group_tag_operations_create_tag.sync(client=self._client, body=GroupTagRequest(group_tag=group_tag))
        _raise_for_error(result)
        return result.data

    def delete_tag(self, id: int) -> None:
        result = group_tag_operations_delete_tag.sync(id, client=self._client)
        _raise_for_error(result)

    def get_tag(self, id: int) -> GroupTag:
        result = group_tag_operations_get_tag.sync(id, client=self._client)
        _raise_for_error(result)
        return result.data

    def get_tag_users(self, id: int, limit: int | Unset = 50, cursor: str | Unset = UNSET) -> PaginatedResponse[User]:
        result = group_tag_operations_get_tag_users.sync(id, client=self._client, limit=limit, cursor=cursor)
        _raise_for_error(result)
        return PaginatedResponse(data=result.data, next_cursor=_get_cursor(result))

    def list_tags(self, names: list[str] | Unset = UNSET, limit: int | Unset = 50, cursor: str | Unset = UNSET) -> PaginatedResponse[GroupTag]:
        result = group_tag_operations_list_tags.sync(client=self._client, names=names, limit=limit, cursor=cursor)
        _raise_for_error(result)
        return PaginatedResponse(data=result.data, next_cursor=_get_cursor(result))

    def update_tag(self, id: int, group_tag: GroupTagRequestGroupTag) -> GroupTag:
        result = group_tag_operations_update_tag.sync(id, client=self._client, body=GroupTagRequest(group_tag=group_tag))
        _raise_for_error(result)
        return result.data


class LinkPreviewsService:
    def __init__(self, client: AuthenticatedClient):
        self._client = client

    def create_link_previews(self, id: int, link_previews: LinkPreviewsRequestLinkPreviews) -> None:
        result = link_preview_operations_create_link_previews.sync(id, client=self._client, body=LinkPreviewsRequest(link_previews=link_previews))
        _raise_for_error(result)


class MembersService:
    def __init__(self, client: AuthenticatedClient):
        self._client = client

    def add_members(self, id: int, member_ids: list[int], silent: bool | Unset = UNSET) -> None:
        result = chat_member_operations_add_members.sync(id, client=self._client, body=AddMembersRequest(member_ids=member_ids, silent=silent))
        _raise_for_error(result)

    def add_tags(self, id: int, group_tag_ids: list[int]) -> None:
        result = chat_member_operations_add_tags.sync(id, client=self._client, body=AddTagsRequest(group_tag_ids=group_tag_ids))
        _raise_for_error(result)

    def leave_chat(self, id: int) -> None:
        result = chat_member_operations_leave_chat.sync(id, client=self._client)
        _raise_for_error(result)

    def list_members(self, id: int, role: ChatMemberRoleFilter | Unset = ChatMemberRoleFilter.ALL, limit: int | Unset = 50, cursor: str | Unset = UNSET) -> PaginatedResponse[User]:
        result = chat_member_operations_list_members.sync(id, client=self._client, role=role, limit=limit, cursor=cursor)
        _raise_for_error(result)
        return PaginatedResponse(data=result.data, next_cursor=_get_cursor(result))

    def remove_member(self, id: int, user_id: int) -> None:
        result = chat_member_operations_remove_member.sync(id, user_id, client=self._client)
        _raise_for_error(result)

    def remove_tag(self, id: int, tag_id: int) -> None:
        result = chat_member_operations_remove_tag.sync(id, tag_id, client=self._client)
        _raise_for_error(result)

    def update_member_role(self, id: int, user_id: int, role: ChatMemberRole) -> None:
        result = chat_member_operations_update_member_role.sync(id, user_id, client=self._client, body=UpdateMemberRoleRequest(role=role))
        _raise_for_error(result)


class MessagesService:
    def __init__(self, client: AuthenticatedClient):
        self._client = client

    def list_chat_messages(self, chat_id: int, sortfield: SortOrder | Unset = SortOrder.DESC, limit: int | Unset = 50, cursor: str | Unset = UNSET) -> PaginatedResponse[Message]:
        result = chat_message_operations_list_chat_messages.sync(client=self._client, chat_id=chat_id, sortfield=sortfield, limit=limit, cursor=cursor)
        _raise_for_error(result)
        return PaginatedResponse(data=result.data, next_cursor=_get_cursor(result))

    def create_message(self, message: MessageCreateRequestMessage) -> Message:
        result = message_operations_create_message.sync(client=self._client, body=MessageCreateRequest(message=message))
        _raise_for_error(result)
        return result.data

    def delete_message(self, id: int) -> None:
        result = message_operations_delete_message.sync(id, client=self._client)
        _raise_for_error(result)

    def get_message(self, id: int) -> Message:
        result = message_operations_get_message.sync(id, client=self._client)
        _raise_for_error(result)
        return result.data

    def pin_message(self, id: int) -> None:
        result = message_operations_pin_message.sync(id, client=self._client)
        _raise_for_error(result)

    def unpin_message(self, id: int) -> None:
        result = message_operations_unpin_message.sync(id, client=self._client)
        _raise_for_error(result)

    def update_message(self, id: int, message: MessageUpdateRequestMessage) -> Message:
        result = message_operations_update_message.sync(id, client=self._client, body=MessageUpdateRequest(message=message))
        _raise_for_error(result)
        return result.data


class ProfileService:
    def __init__(self, client: AuthenticatedClient):
        self._client = client

    def get_token_info(self) -> AccessTokenInfo:
        result = o_auth_operations_get_token_info.sync(client=self._client)
        _raise_for_error(result)
        return result.data

    def delete_status(self) -> None:
        result = profile_operations_delete_status.sync(client=self._client)
        _raise_for_error(result)

    def get_profile(self) -> User:
        result = profile_operations_get_profile.sync(client=self._client)
        _raise_for_error(result)
        return result.data

    def get_status(self) -> UserStatus:
        result = profile_operations_get_status.sync(client=self._client)
        _raise_for_error(result)
        return result.data

    def update_status(self, status: StatusUpdateRequestStatus) -> UserStatus:
        result = profile_operations_update_status.sync(client=self._client, body=StatusUpdateRequest(status=status))
        _raise_for_error(result)
        return result.data


class ReactionsService:
    def __init__(self, client: AuthenticatedClient):
        self._client = client

    def add_reaction(self, id: int, code: str, name: str | Unset = UNSET) -> Reaction:
        result = reaction_operations_add_reaction.sync(id, client=self._client, body=ReactionRequest(code=code, name=name))
        _raise_for_error(result)
        return result

    def list_reactions(self, id: int, limit: int | Unset = 50, cursor: str | Unset = UNSET) -> PaginatedResponse[Reaction]:
        result = reaction_operations_list_reactions.sync(id, client=self._client, limit=limit, cursor=cursor)
        _raise_for_error(result)
        return PaginatedResponse(data=result.data, next_cursor=_get_cursor(result))

    def remove_reaction(self, id: int, code: str, name: str | Unset = UNSET) -> None:
        result = reaction_operations_remove_reaction.sync(id, client=self._client, code=code, name=name)
        _raise_for_error(result)


class ReadMemberService:
    def __init__(self, client: AuthenticatedClient):
        self._client = client

    def list_read_members(self, id: int, limit: int | Unset = 300, cursor: str | Unset = UNSET) -> PaginatedResponse[int]:
        result = read_member_operations_list_read_members.sync(id, client=self._client, limit=limit, cursor=cursor)
        _raise_for_error(result)
        return PaginatedResponse(data=result.data, next_cursor=_get_cursor(result))


class SearchService:
    def __init__(self, client: AuthenticatedClient):
        self._client = client

    def search_chats(self, query: str | Unset = UNSET, limit: int | Unset = 100, cursor: str | Unset = UNSET, order: SortOrder | Unset = UNSET, created_from: datetime.datetime | Unset = UNSET, created_to: datetime.datetime | Unset = UNSET, active: bool | Unset = UNSET, chat_subtype: ChatSubtype | Unset = UNSET, personal: bool | Unset = UNSET) -> PaginatedResponse[Chat]:
        result = search_operations_search_chats.sync(client=self._client, query=query, limit=limit, cursor=cursor, order=order, created_from=created_from, created_to=created_to, active=active, chat_subtype=chat_subtype, personal=personal)
        _raise_for_error(result)
        return PaginatedResponse(data=result.data, next_cursor=_get_cursor(result))

    def search_messages(self, query: str | Unset = UNSET, limit: int | Unset = 200, cursor: str | Unset = UNSET, order: SortOrder | Unset = UNSET, created_from: datetime.datetime | Unset = UNSET, created_to: datetime.datetime | Unset = UNSET, chat_ids: list[int] | Unset = UNSET, user_ids: list[int] | Unset = UNSET, active: bool | Unset = UNSET) -> PaginatedResponse[Message]:
        result = search_operations_search_messages.sync(client=self._client, query=query, limit=limit, cursor=cursor, order=order, created_from=created_from, created_to=created_to, chat_ids=chat_ids, user_ids=user_ids, active=active)
        _raise_for_error(result)
        return PaginatedResponse(data=result.data, next_cursor=_get_cursor(result))

    def search_users(self, query: str | Unset = UNSET, limit: int | Unset = 200, cursor: str | Unset = UNSET, sort: SearchSortOrder | Unset = UNSET, order: SortOrder | Unset = UNSET, created_from: datetime.datetime | Unset = UNSET, created_to: datetime.datetime | Unset = UNSET, company_roles: list[UserRole] | Unset = UNSET) -> PaginatedResponse[User]:
        result = search_operations_search_users.sync(client=self._client, query=query, limit=limit, cursor=cursor, sort=sort, order=order, created_from=created_from, created_to=created_to, company_roles=company_roles)
        _raise_for_error(result)
        return PaginatedResponse(data=result.data, next_cursor=_get_cursor(result))


class SecurityService:
    def __init__(self, client: AuthenticatedClient):
        self._client = client

    def get_audit_events(self, start_time: datetime.datetime, end_time: datetime.datetime, event_key: AuditEventKey | Unset = UNSET, actor_id: str | Unset = UNSET, actor_type: str | Unset = UNSET, entity_id: str | Unset = UNSET, entity_type: str | Unset = UNSET, limit: int | Unset = 50, cursor: str | Unset = UNSET) -> PaginatedResponse[AuditEvent]:
        result = security_operations_get_audit_events.sync(client=self._client, start_time=start_time, end_time=end_time, event_key=event_key, actor_id=actor_id, actor_type=actor_type, entity_id=entity_id, entity_type=entity_type, limit=limit, cursor=cursor)
        _raise_for_error(result)
        return PaginatedResponse(data=result.data, next_cursor=_get_cursor(result))


class TasksService:
    def __init__(self, client: AuthenticatedClient):
        self._client = client

    def create_task(self, task: TaskCreateRequestTask) -> Task:
        result = task_operations_create_task.sync(client=self._client, body=TaskCreateRequest(task=task))
        _raise_for_error(result)
        return result.data

    def delete_task(self, id: int) -> None:
        result = task_operations_delete_task.sync(id, client=self._client)
        _raise_for_error(result)

    def get_task(self, id: int) -> Task:
        result = task_operations_get_task.sync(id, client=self._client)
        _raise_for_error(result)
        return result.data

    def list_tasks(self, limit: int | Unset = 50, cursor: str | Unset = UNSET) -> PaginatedResponse[Task]:
        result = task_operations_list_tasks.sync(client=self._client, limit=limit, cursor=cursor)
        _raise_for_error(result)
        return PaginatedResponse(data=result.data, next_cursor=_get_cursor(result))

    def update_task(self, id: int, task: TaskUpdateRequestTask) -> Task:
        result = task_operations_update_task.sync(id, client=self._client, body=TaskUpdateRequest(task=task))
        _raise_for_error(result)
        return result.data


class ThreadService:
    def __init__(self, client: AuthenticatedClient):
        self._client = client

    def create_thread(self, id: int) -> Thread:
        result = thread_operations_create_thread.sync(id, client=self._client)
        _raise_for_error(result)
        return result.data

    def get_thread(self, id: int) -> Thread:
        result = thread_operations_get_thread.sync(id, client=self._client)
        _raise_for_error(result)
        return result.data


class UsersService:
    def __init__(self, client: AuthenticatedClient):
        self._client = client

    def create_user(self, user: UserCreateRequestUser, skip_email_notify: bool | Unset = UNSET) -> User:
        result = user_operations_create_user.sync(client=self._client, body=UserCreateRequest(user=user, skip_email_notify=skip_email_notify))
        _raise_for_error(result)
        return result.data

    def delete_user(self, id: int) -> None:
        result = user_operations_delete_user.sync(id, client=self._client)
        _raise_for_error(result)

    def get_user(self, id: int) -> User:
        result = user_operations_get_user.sync(id, client=self._client)
        _raise_for_error(result)
        return result.data

    def list_users(self, query: str | Unset = UNSET, limit: int | Unset = 50, cursor: str | Unset = UNSET) -> PaginatedResponse[User]:
        result = user_operations_list_users.sync(client=self._client, query=query, limit=limit, cursor=cursor)
        _raise_for_error(result)
        return PaginatedResponse(data=result.data, next_cursor=_get_cursor(result))

    def update_user(self, id: int, user: UserUpdateRequestUser) -> User:
        result = user_operations_update_user.sync(id, client=self._client, body=UserUpdateRequest(user=user))
        _raise_for_error(result)
        return result.data

    def delete_user_status(self, user_id: int) -> None:
        result = user_status_operations_delete_user_status.sync(user_id, client=self._client)
        _raise_for_error(result)

    def get_user_status(self, user_id: int) -> UserStatus:
        result = user_status_operations_get_user_status.sync(user_id, client=self._client)
        _raise_for_error(result)
        return result.data

    def update_user_status(self, user_id: int, status: StatusUpdateRequestStatus) -> UserStatus:
        result = user_status_operations_update_user_status.sync(user_id, client=self._client, body=StatusUpdateRequest(status=status))
        _raise_for_error(result)
        return result.data


class ViewsService:
    def __init__(self, client: AuthenticatedClient):
        self._client = client

    def open_view(self, body: OpenViewRequest) -> None:
        result = form_operations_open_view.sync(client=self._client, body=body)
        _raise_for_error(result)


# ── Client ──────────────────────────────────────────────────────────────────────


class Pachca:
    """Ergonomic Pachca API client."""

    def __init__(self, token: str, *, base_url: str = "https://api.pachca.com/api/shared/v1", timeout: float = 30.0):
        self._client = AuthenticatedClient(
            base_url=base_url,
            token=token,
            timeout=httpx.Timeout(timeout),
            raise_on_unexpected_status=True,
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
        self.read_member = ReadMemberService(self._client)
        self.search = SearchService(self._client)
        self.security = SecurityService(self._client)
        self.tasks = TasksService(self._client)
        self.thread = ThreadService(self._client)
        self.users = UsersService(self._client)
        self.views = ViewsService(self._client)

    def close(self) -> None:
        self._client.__exit__(None, None, None)

    def __enter__(self) -> Pachca:
        self._client.__enter__()
        return self

    def __exit__(self, *args: Any) -> None:
        self._client.__exit__(*args)
