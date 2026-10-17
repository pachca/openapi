from __future__ import annotations

from dataclasses import dataclass
from enum import StrEnum
from typing import Any, Union

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


class OAuthScope(StrEnum):
    CHATS_READ = "chats:read"
    CHATS_WRITE = "chats:write"
    USERS_READ = "users:read"
    USERS_WRITE = "users:write"


class EventType(OpenStrEnum):
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
    content_disposition: str


@dataclass
class Notification:
    kind: str


@dataclass
class MessageNotification:
    kind: str  # literal "message"
    text: str


@dataclass
class ReactionNotification:
    kind: str  # literal "message"
    emoji: str


@dataclass
class Schedule:
    days: list[int]
    value: Any | None = None


NotificationUnion = Union[MessageNotification, ReactionNotification]


@dataclass
class ListEventsParams:
    is_active: bool | None = None
    scopes: list[OAuthScope] | None = None
    filter: EventFilter | None = None


@dataclass
class ListEventsResponse:
    data: list[Event]
