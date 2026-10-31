from __future__ import annotations

from datetime import datetime
from dataclasses import dataclass

try:
    from enum import StrEnum
except ImportError:  # Python 3.10
    from enum import Enum

    class StrEnum(str, Enum):  # noqa: UP042
        def __str__(self) -> str:
            return self._value_

        def __format__(self, format_spec: str) -> str:
            return self._value_.__format__(format_spec)


class SortOrder(StrEnum):
    ASC = "asc"
    DESC = "desc"


class ChatAvailability(StrEnum):
    IS_MEMBER = "is_member"  # Чаты, где пользователь является участником
    PUBLIC = "public"  # Все открытые чаты компании


@dataclass
class Chat:
    id: int
    name: str
    is_channel: bool
    is_public: bool
    created_at: datetime
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
    # HTTP status code of the answer, set by the client. An empty body or one that is not JSON leaves errors empty.
    status_code: int | None = None


@dataclass
class OAuthError(Exception):
    error: str | None = None

    def __str__(self) -> str:
        return self.error


@dataclass
class PaginationMetaPaginate:
    next_page: str | None = None


@dataclass
class PaginationMeta:
    paginate: PaginationMetaPaginate | None = None


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
