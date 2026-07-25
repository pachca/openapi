from __future__ import annotations

from dataclasses import dataclass
from typing import Union

@dataclass
class DetailsEmpty:
    pass


@dataclass
class DetailsChat:
    chat_id: int


@dataclass
class DetailsCall:
    chat_id: int
    duration: int
    recording_size: int | None = None


@dataclass
class DetailsRename:
    old_name: str
    new_name: str


@dataclass
class Event:
    id: int
    event_key: object
    details: EventDetailsUnion


EventDetailsUnion = Union[DetailsEmpty, DetailsChat, DetailsCall, DetailsRename]


@dataclass
class GetEventsResponse:
    data: list[Event]
