from __future__ import annotations

from dataclasses import dataclass

@dataclass
class ExportRequest:
    start_at: str
    end_at: str
    webhook_url: str


@dataclass
class Export:
    id: int
    start_at: str
    end_at: str
    status: str
    created_at: str


@dataclass
class Event:
    id: int
    type: str
    occurred_at: str


@dataclass
class OAuthError(Exception):
    error: str | None = None


@dataclass
class ListEventsParams:
    date_from: str
    date_to: str | None = None
    created_after: str | None = None
    limit: int | None = None


@dataclass
class ListEventsResponse:
    data: list[Event]
