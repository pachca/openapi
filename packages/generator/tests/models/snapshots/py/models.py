from __future__ import annotations

from datetime import datetime
from dataclasses import dataclass
from enum import StrEnum

class OpenStrEnum(StrEnum):
    """An enum of responses: a value this SDK does not list yet becomes a member that keeps it, with is_known False."""

    @classmethod
    def _missing_(cls, value: object) -> OpenStrEnum | None:
        if not isinstance(value, str):
            return None
        member = str.__new__(cls, value)
        member._name_ = "UNKNOWN_VALUE" if "UNKNOWN" in cls.__members__ else "UNKNOWN"
        member._value_ = value
        return member

    @property
    def is_known(self) -> bool:
        """Whether this SDK version lists the value."""
        return self._value_ in type(self)._value2member_map_


class UserRole(OpenStrEnum):
    """Роль пользователя"""

    ADMIN = "admin"  # Администратор
    USER = "user"  # Сотрудник
    MULTI_ADMIN = "multi_admin"  # Мультиадмин
    BOT = "bot"  # Бот


@dataclass
class User:
    id: int
    first_name: str
    last_name: str
    email: str
    role: UserRole
    is_active: bool
    created_at: datetime
    tag_ids: list[int]
    phone_number: str | None = None
    bot_id: int | None = None
    birthday: str | None = None
    custom_properties: list[CustomProperty] | None = None
    status: UserStatus | None = None


@dataclass
class UserStatus:
    emoji: str | None = None
    title: str | None = None
    expires_at: datetime | None = None


@dataclass
class CustomProperty:
    id: int
    name: str
    data_type: str
    value: str


@dataclass
class UserCreateRequestUser:
    first_name: str
    last_name: str
    email: str
    role: UserRole | None = None
    is_active: bool | None = True


@dataclass
class UserCreateRequest:
    user: UserCreateRequestUser


@dataclass
class UserUpdateRequestUser:
    first_name: str | None = None
    last_name: str | None = None
    phone_number: str | None = None
    role: UserRole | None = None


@dataclass
class UserUpdateRequest:
    user: UserUpdateRequestUser


@dataclass
class MessageCreateRequestFile:
    key: str
    name: str
    file_type: str
    size: int


@dataclass
class MessageCreateRequestButton:
    text: str
    url: str | None = None
    data: str | None = None


@dataclass
class MessageCreateRequestMessage:
    entity_id: int
    content: str
    files: list[MessageCreateRequestFile] | None = None
    buttons: list[list[MessageCreateRequestButton]] | None = None


@dataclass
class MessageCreateRequest:
    message: MessageCreateRequestMessage


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

    def __str__(self) -> str:
        return self.error


@dataclass
class PaginationMetaPaginate:
    next_page: str | None = None


@dataclass
class PaginationMeta:
    paginate: PaginationMetaPaginate | None = None


@dataclass
class SearchPaginationMetaPaginate:
    next_page: str


@dataclass
class SearchPaginationMeta:
    total: int
    paginate: SearchPaginationMetaPaginate
