from __future__ import annotations

import httpx

from .models import GetEventsResponse
from .utils import deserialize, RetryTransport

class EventsService:
    async def get_events(
        self) -> GetEventsResponse:
        raise NotImplementedError("Events.getEvents is not implemented")


class EventsServiceImpl(EventsService):
    def __init__(self, client: httpx.AsyncClient) -> None:
        self._client = client

    async def get_events(
        self) -> GetEventsResponse:
        response = await self._client.get(
            "/events",
        )
        body = response.json()
        match response.status_code:
            case 200:
                return deserialize(GetEventsResponse, body)
            case _:
                raise RuntimeError(
                    f"Unexpected status code: {response.status_code}"
                )


class PachcaClient:
    def __init__(self, token: str, base_url: str, events: EventsService | None = None) -> None:
        self._client = httpx.AsyncClient(
            base_url=base_url,
            headers={"Authorization": f"Bearer {token}"},
            transport=RetryTransport(httpx.AsyncHTTPTransport()),
        )
        self.events: EventsService = events or EventsServiceImpl(self._client)

    async def close(self) -> None:
        await self._client.aclose()

    @classmethod
    def from_client(
        cls,
        client: httpx.AsyncClient,
        events: EventsService | None = None,
    ) -> "PachcaClient":
        self = cls.__new__(cls)
        self._client = client
        self.events: EventsService = events or EventsServiceImpl(client)
        return self

    @classmethod
    def stub(
        cls,
        events: EventsService | None = None,
    ) -> "PachcaClient":
        self = cls.__new__(cls)
        self._client = None
        self.events = events or EventsService()
        return self
