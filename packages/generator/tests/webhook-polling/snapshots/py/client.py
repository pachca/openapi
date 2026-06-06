from __future__ import annotations

import asyncio
from collections import deque
from datetime import datetime, timezone
from typing import AsyncIterator, TypeVar

import httpx

from .models import (
    GetWebhookEventsParams,
    GetWebhookEventsResponse,
    WebhookEvent,
    WebhookPayloadUnion,
)
from .utils import deserialize, RetryTransport

TPayload = TypeVar("TPayload", bound=WebhookPayloadUnion)

class BotsService:
    async def get_webhook_events(
        self,
        params: GetWebhookEventsParams | None = None,
    ) -> GetWebhookEventsResponse:
        raise NotImplementedError("Bots.getWebhookEvents is not implemented")

    async def get_webhook_events_all(
        self,
        params: GetWebhookEventsParams | None = None,
    ) -> list[WebhookEvent]:
        raise NotImplementedError("Bots.getWebhookEventsAll is not implemented")

    async def poll_webhook_events(
        self,
        *,
        limit: int | None = 50,
        interval_seconds: float = 5.0,
        created_after: datetime | None = None,
        max_seen_delivery_ids: int = 5_000,
    ) -> AsyncIterator[WebhookEvent]:
        if max_seen_delivery_ids <= 0:
            raise ValueError("max_seen_delivery_ids must be greater than 0")

        effective_created_after = created_after or datetime.now(timezone.utc)
        seen_id_order: deque[str] = deque()
        seen_ids: set[str] = set()

        def remember(id: str) -> bool:
            if id in seen_ids:
                return False
            seen_ids.add(id)
            seen_id_order.append(id)
            while len(seen_id_order) > max_seen_delivery_ids:
                seen_ids.remove(seen_id_order.popleft())
            return True

        while True:
            cursor: str | None = None
            has_next = True
            while has_next:
                response = await self.get_webhook_events(
                    GetWebhookEventsParams(limit=limit, cursor=cursor),
                )
                page_has_recent_events = False
                for event in reversed(response.data):
                    matches_created_after = event.created_at >= effective_created_after
                    if matches_created_after:
                        page_has_recent_events = True
                    if matches_created_after and remember(event.id):
                        yield event
                reported_has_next = getattr(response.meta.paginate, "has_next", None)
                has_next = (bool(response.data) if reported_has_next is None else reported_has_next) and page_has_recent_events
                cursor = response.meta.paginate.next_page
            await asyncio.sleep(interval_seconds)

    async def poll_webhook_payloads(
        self,
        *,
        payload_type: type[TPayload] | tuple[type[TPayload], ...] | None = None,
        limit: int | None = 50,
        interval_seconds: float = 5.0,
        created_after: datetime | None = None,
        max_seen_delivery_ids: int = 5_000,
    ) -> AsyncIterator[WebhookPayloadUnion | TPayload]:
        async for event in self.poll_webhook_events(
            limit=limit,
            interval_seconds=interval_seconds,
            created_after=created_after,
            max_seen_delivery_ids=max_seen_delivery_ids,
        ):
            if payload_type is None or isinstance(event.payload, payload_type):
                yield event.payload


class BotsServiceImpl(BotsService):
    def __init__(self, client: httpx.AsyncClient) -> None:
        self._client = client

    async def get_webhook_events(
        self,
        params: GetWebhookEventsParams | None = None,
    ) -> GetWebhookEventsResponse:
        query: dict[str, str] = {}
        if params is not None and params.limit is not None:
            query["limit"] = str(params.limit)
        if params is not None and params.cursor is not None:
            query["cursor"] = params.cursor
        response = await self._client.get(
            "/webhooks/events",
            params=query,
        )
        body = response.json()
        match response.status_code:
            case 200:
                return deserialize(GetWebhookEventsResponse, body)
            case _:
                raise RuntimeError(
                    f"Unexpected status code: {response.status_code}"
                )

    async def get_webhook_events_all(
        self,
        params: GetWebhookEventsParams | None = None,
    ) -> list[WebhookEvent]:
        items: list[WebhookEvent] = []
        cursor: str | None = None
        has_next = True
        while has_next:
            if params is None:
                params = GetWebhookEventsParams()
            params.cursor = cursor
            response = await self.get_webhook_events(params=params)
            items.extend(response.data)
            if not response.data:
                break
            cursor = response.meta.paginate.next_page
            reported_has_next = getattr(response.meta.paginate, "has_next", None)
            has_next = True if reported_has_next is None else reported_has_next
        return items


PACHCA_API_URL = "https://api.pachca.com/api/shared/v1"


class PachcaClient:
    def __init__(self, token: str, base_url: str = PACHCA_API_URL, bots: BotsService | None = None) -> None:
        self._client = httpx.AsyncClient(
            base_url=base_url,
            headers={"Authorization": f"Bearer {token}"},
            transport=RetryTransport(httpx.AsyncHTTPTransport()),
        )
        self.bots: BotsService = bots or BotsServiceImpl(self._client)

    async def close(self) -> None:
        await self._client.aclose()

    @classmethod
    def from_client(
        cls,
        client: httpx.AsyncClient,
        bots: BotsService | None = None,
    ) -> "PachcaClient":
        self = cls.__new__(cls)
        self._client = client
        self.bots: BotsService = bots or BotsServiceImpl(client)
        return self

    @classmethod
    def stub(
        cls,
        bots: BotsService | None = None,
    ) -> "PachcaClient":
        self = cls.__new__(cls)
        self._client = None
        self.bots = bots or BotsService()
        return self
