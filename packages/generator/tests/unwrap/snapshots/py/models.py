from __future__ import annotations

from dataclasses import dataclass


@dataclass
class AddMembersRequest:
    member_ids: list[int]


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
class Chat:
    id: int
    name: str
    is_channel: bool
    is_public: bool
    created_at: str


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
