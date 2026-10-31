from __future__ import annotations

from dataclasses import dataclass
from typing import Union

@dataclass
class DetailsEmpty:
    pass


@dataclass
class DetailsBot:
    bot_id: int
    webhook_id: int | None = None
    scopes: list[str] | None = None


@dataclass
class DetailsBotTokenUpdated:
    token_kind: str
    resource_owner_id: int
    access_token_id: int
    current_scopes: list[str] | None = None
    bot_id: int | None = None
    webhook_id: int | None = None
    scopes: ScopesChange | None = None


@dataclass
class DetailsToken:
    token_kind: str
    resource_owner_id: int
    scopes: list[str]
    access_token_id: int
    bot_id: int | None = None
    webhook_id: int | None = None
    application_id: int | None = None
    device_name: str | None = None


@dataclass
class ScopesChange:
    previous: list[str]
    new: list[str]


@dataclass
class Event:
    id: int
    event_key: object
    details: EventDetailsUnion


EventDetailsUnion = Union[DetailsEmpty, DetailsBot, DetailsBotTokenUpdated, DetailsToken]


@dataclass
class GetEventsResponse:
    data: list[Event]
