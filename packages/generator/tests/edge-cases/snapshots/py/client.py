from __future__ import annotations

from dataclasses import dataclass

import httpx

from .models import (
    ListEventsParams,
    ListEventsResponse,
    EventFilter,
    Event,
    OAuthScope,
    UploadRequest,
)
from .utils import deserialize, RetryTransport

class EventsService:
    async def list_events(
        self,
        params: ListEventsParams | None = None,
    ) -> ListEventsResponse:
        raise NotImplementedError("Events.listEvents is not implemented")

    async def publish_event(
        self,
        id: int,
        scope: OAuthScope,
    ) -> Event:
        raise NotImplementedError("Events.publishEvent is not implemented")


class EventsServiceImpl(EventsService):
    def __init__(self, client: httpx.AsyncClient) -> None:
        self._client = client

    async def list_events(
        self,
        params: ListEventsParams | None = None,
    ) -> ListEventsResponse:
        query: list[tuple[str, str]] = []
        if params is not None and params.is_active is not None:
            query.append(("is_active", str(params.is_active).lower()))
        if params is not None and params.scopes is not None:
            for v in params.scopes:
                query.append(("scopes[]", str(v)))
        if params is not None and params.filter is not None:
            query.append(("filter", params.filter))
        response = await self._client.get(
            "/events",
            params=query,
        )
        body = response.json()
        match response.status_code:
            case 200:
                return deserialize(ListEventsResponse, body)
            case _:
                raise RuntimeError(
                    f"Unexpected status code: {response.status_code}"
                )

    async def publish_event(
        self,
        id: int,
        scope: OAuthScope,
    ) -> Event:
        response = await self._client.put(
            f"/events/{id}/publish",
            json={"scope": scope},
        )
        body = response.json()
        match response.status_code:
            case 200:
                return deserialize(Event, body["data"])
            case _:
                raise RuntimeError(
                    f"Unexpected status code: {response.status_code}"
                )


class UploadsService:
    async def create_upload(
        self,
        request: UploadRequest,
    ) -> None:
        raise NotImplementedError("Uploads.createUpload is not implemented")


class UploadsServiceImpl(UploadsService):
    def __init__(self, client: httpx.AsyncClient) -> None:
        self._client = client

    async def create_upload(
        self,
        request: UploadRequest,
    ) -> None:
        data: dict[str, str] = {}
        data["Content-Disposition"] = request.content_disposition
        response = await self._client.post(
            "/uploads",
            data=data,
            files={"file": request.file},
        )
        match response.status_code:
            case 201:
                return
            case _:
                raise RuntimeError(
                    f"Unexpected status code: {response.status_code}"
                )


class PachcaClient:
    def __init__(self, token: str, base_url: str, events: EventsService | None = None, uploads: UploadsService | None = None) -> None:
        self._client = httpx.AsyncClient(
            base_url=base_url,
            headers={"Authorization": f"Bearer {token}"},
            transport=RetryTransport(httpx.AsyncHTTPTransport()),
        )
        self.events: EventsService = events or EventsServiceImpl(self._client)
        self.uploads: UploadsService = uploads or UploadsServiceImpl(self._client)

    async def close(self) -> None:
        await self._client.aclose()

    @classmethod
    def stub(
        cls,
        events: EventsService | None = None,
        uploads: UploadsService | None = None,
    ) -> "PachcaClient":
        self = cls.__new__(cls)
        self._client = None
        self.events = events or EventsService()
        self.uploads = uploads or UploadsService()
        return self
