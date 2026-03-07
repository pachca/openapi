from __future__ import annotations

from dataclasses import dataclass, field
from enum import StrEnum


class UserRole(StrEnum):
    """Роль пользователя"""

    ADMIN = "admin"  # Администратор
    USER = "user"  # Сотрудник
    MULTI_ADMIN = "multi_admin"  # Мультиадмин
    BOT = "bot"  # Бот


@dataclass
class UserStatus:
    emoji: str | None = None
    title: str | None = None
    expires_at: str | None = None


@dataclass
class CustomProperty:
    id: int
    name: str
    data_type: str
    value: str


@dataclass
class User:
    id: int
    first_name: str
    last_name: str
    email: str
    role: UserRole
    is_active: bool
    created_at: str
    tag_ids: list[int]
    phone_number: str | None = None
    bot_id: int | None = None
    birthday: str | None = None
    custom_properties: list[CustomProperty] | None = None
    status: UserStatus | None = None


@dataclass
class UserCreateRequestUser:
    first_name: str
    last_name: str
    email: str
    role: UserRole | None = None
    is_active: bool = True


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


@dataclass
class PaginationPaginate:
    next_page: str | None = None


@dataclass
class PaginationMeta:
    paginate: PaginationPaginate | None = None


@dataclass
class SearchPaginationPaginate:
    next_page: str


@dataclass
class SearchPaginationMeta:
    total: int
    paginate: SearchPaginationPaginate
