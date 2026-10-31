from __future__ import annotations

from dataclasses import dataclass
from typing import Union

@dataclass
class DetailsEmpty:
    pass


@dataclass
class DetailsBot:
    bot_id: int
    actor_id: int | None = None
    webhook_id: int | None = None
    scopes: list[str] | ScopesChange | None = None


@dataclass
class DetailsBotScopes:
    bot_id: int
    scopes: list[str]


@dataclass
class DetailsBotTokenUpdated:
    token_kind: str
    resource_owner_id: int
    access_token_id: int
    bot_id: int | None = None
    webhook_id: int | None = None
    scopes: ScopesChange | None = None


@dataclass
class DetailsToken:
    token_kind: str
    resource_owner_id: int
    scopes: list[str]
    access_token_id: int


@dataclass
class ScopesChange:
    previous: list[str]
    new: list[str]


@dataclass
class Actor:
    id: int
    name: str | None = None


@dataclass
class Event:
    id: int
    event_key: str
    details: EventDetailsUnion
    actor: str | Actor | None = None


EventDetailsUnion = Union[DetailsEmpty, DetailsBot, DetailsBotScopes, DetailsBotTokenUpdated, DetailsToken]


@dataclass
class GetEventsResponse:
    data: list[Event]
