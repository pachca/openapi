from __future__ import annotations

import httpx

from .models import (
    ListEventsParams,
    ListEventsResponse,
    OAuthError,
    ExportRequest,
    Export,
)
from .utils import deserialize, serialize, RetryTransport

class ExportService:
    def __init__(self, client: httpx.AsyncClient) -> None:
        self._client = client

    async def list_events(
        self,
        params: ListEventsParams,
    ) -> ListEventsResponse:
        query: list[tuple[str, str]] = []
        query.append(("date_from", params.date_from))
        if params is not None and params.date_to is not None:
            query.append(("date_to", params.date_to))
        if params is not None and params.created_after is not None:
            query.append(("created_after", params.created_after.isoformat()))
        if params is not None and params.limit is not None:
            query.append(("limit", str(params.limit)))
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

    async def create_export(
        self,
        request: ExportRequest,
    ) -> Export:
        response = await self._client.post(
            "/exports",
            json=serialize(request),
        )
        body = response.json()
        match response.status_code:
            case 201:
                return deserialize(Export, body["data"])
            case 401:
                raise deserialize(OAuthError, body)
            case _:
                raise RuntimeError(
                    f"Unexpected status code: {response.status_code}"
                )


class PachcaClient:
    def __init__(self, token: str, base_url: str = "https://api.pachca.com/api/shared/v1") -> None:
        self._client = httpx.AsyncClient(
            base_url=base_url,
            headers={"Authorization": f"Bearer {token}"},
            transport=RetryTransport(httpx.AsyncHTTPTransport()),
        )
        self.export = ExportService(self._client)

    async def close(self) -> None:
        await self._client.aclose()
