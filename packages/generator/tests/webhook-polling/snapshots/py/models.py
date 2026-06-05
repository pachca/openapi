from __future__ import annotations

from datetime import datetime
from dataclasses import dataclass
from typing import Union

@dataclass
class WebhookEvent:
    id: str
    event_type: str
    payload: WebhookPayloadUnion
    created_at: datetime


@dataclass
class MessageWebhookPayload:
    type: str  # literal "message_new"
    message_id: int


@dataclass
class ReactionWebhookPayload:
    type: str  # literal "reaction_added"
    reaction: str


@dataclass
class PaginationMetaPaginate:
    next_page: str
    has_next: bool | None = None


@dataclass
class PaginationMeta:
    paginate: PaginationMetaPaginate


WebhookPayloadUnion = Union[MessageWebhookPayload, ReactionWebhookPayload]


@dataclass
class GetWebhookEventsParams:
    limit: int | None = None
    cursor: str | None = None


@dataclass
class GetWebhookEventsResponse:
    data: list[WebhookEvent]
    meta: PaginationMeta
