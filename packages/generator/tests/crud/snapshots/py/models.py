from __future__ import annotations

from dataclasses import dataclass
from enum import StrEnum


class SortOrder(StrEnum):
    ASC = "asc"
    DESC = "desc"


class ChatAvailability(StrEnum):
    """Доступность чатов для пользователя"""

    IS_MEMBER = "is_member"  # Чаты, где пользователь является участником
    PUBLIC = "public"  # Все открытые чаты компании


@dataclass
class Chat:
    id: int
    name: str
    is_channel: bool
    is_public: bool
    created_at: str
    member_ids: list[int] | None = None


@dataclass
class ChatCreateRequestChat:
    name: str
    channel: bool | None = None
    public: bool | None = None
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
class ApiErrorItem:
    key: str | None = None
    value: str | None = None


@dataclass
class ApiError(Exception):
    errors: list[ApiErrorItem] | None = None


@dataclass
class OAuthError(Exception):
    error: str | None = None


@dataclass
class PaginationPaginate:
    next_page: str | None = None


@dataclass
class PaginationMeta:
    paginate: PaginationPaginate | None = None


@dataclass
class ListChatsParams:
    availability: ChatAvailability | None = None
    limit: int | None = None
    cursor: str | None = None
    sort_field: str | None = None
    sort_order: SortOrder | None = None


@dataclass
class ListChatsResponse:
    data: list[Chat]
    meta: PaginationMeta | None = None
