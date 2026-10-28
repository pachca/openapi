from __future__ import annotations

from datetime import datetime
from dataclasses import dataclass

@dataclass
class ChatCreateRequestChat:
    name: str
    member_ids: list[int] | None = None


@dataclass
class ChatCreateRequest:
    chat: ChatCreateRequestChat


@dataclass
class ChatUpdateRequestChat:
    name: str | None = None
    public: bool | None = None


@dataclass
class ChatUpdateRequest:
    chat: ChatUpdateRequestChat


@dataclass
class ChatUpdateMeta:
    changed_fields: list[str]


@dataclass
class Chat:
    id: int
    name: str
    created_at: datetime


@dataclass
class ApiErrorItem:
    key: str | None = None
    value: str | None = None


@dataclass
class ApiError(Exception):
    errors: list[ApiErrorItem] | None = None
    # HTTP status code of the answer, set by the client. An empty body or one that is not JSON leaves errors empty.
    status_code: int | None = None


@dataclass
class OAuthError(Exception):
    error: str | None = None

    def __str__(self) -> str:
        return self.error


@dataclass
class CreateChatResponseMeta:
    not_found_member_ids: list[int]


@dataclass
class CreateChatResponse:
    data: Chat
    meta: CreateChatResponseMeta


@dataclass
class UpdateChatResponse:
    data: Chat
    meta: ChatUpdateMeta | None = None
