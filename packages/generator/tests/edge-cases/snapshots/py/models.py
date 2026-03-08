from __future__ import annotations

from dataclasses import dataclass
from enum import StrEnum
from typing import Union

class OAuthScope(StrEnum):
    CHATS_READ = "chats:read"
    CHATS_WRITE = "chats:write"
    USERS_READ = "users:read"
    USERS_WRITE = "users:write"


class EventType(StrEnum):
    MESSAGE = "message"
    REACTION = "reaction"


@dataclass
class EventFilter:
    pass


@dataclass
class Event:
    id: int
    type: EventType


@dataclass
class PublishEventRequest:
    scope: OAuthScope


@dataclass
class UploadRequest:
    file: bytes
    Content_Disposition: str


@dataclass
class Notification:
    kind: str


@dataclass
class MessageNotification:
    pass


@dataclass
class ReactionNotification:
    pass


NotificationUnion = Union[MessageNotification, ReactionNotification]


@dataclass
class ListEventsParams:
    is_active: bool | None = None
    scopes: list[OAuthScope] | None = None
    filter: EventFilter | None = None


@dataclass
class ListEventsResponse:
    data: list[Event]
