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


def _error_body(response: httpx.Response) -> object:
    # The body of an error answer, or None when it is empty or not JSON (a 404 without a body, a proxy page).
    try:
        return response.json()
    except ValueError:
        return None


def _oauth_error_from_response(response: httpx.Response) -> Exception:
    # A 401 body that is empty or not the OAuth form gives a RuntimeError with the status code.
    body = _error_body(response)
    if isinstance(body, dict) and isinstance(body.get("error"), str):
        return OAuthError(error=body["error"])
    return RuntimeError(f"Unexpected status code: {response.status_code}")

class ExportService:
    async def list_events(
        self,
        params: ListEventsParams,
    ) -> ListEventsResponse:
        raise NotImplementedError("Export.listEvents is not implemented")

    async def create_export(
        self,
        request: ExportRequest,
    ) -> Export:
        raise NotImplementedError("Export.createExport is not implemented")


class ExportServiceImpl(ExportService):
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
        match response.status_code:
            case 200:
                return deserialize(ListEventsResponse, response.json())
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
        match response.status_code:
            case 201:
                return deserialize(Export, response.json()["data"])
            case 401:
                raise _oauth_error_from_response(response)
            case _:
                raise RuntimeError(
                    f"Unexpected status code: {response.status_code}"
                )


PACHCA_API_URL = "https://api.pachca.com/api/shared/v1"


class PachcaClient:
    def __init__(self, token: str, base_url: str = PACHCA_API_URL, export: ExportService | None = None) -> None:
        self._client = httpx.AsyncClient(
            base_url=base_url,
            headers={"Authorization": f"Bearer {token}"},
            transport=RetryTransport(httpx.AsyncHTTPTransport()),
        )
        self.export: ExportService = export or ExportServiceImpl(self._client)

    async def close(self) -> None:
        await self._client.aclose()

    @classmethod
    def from_client(
        cls,
        client: httpx.AsyncClient,
        export: ExportService | None = None,
    ) -> "PachcaClient":
        self = cls.__new__(cls)
        self._client = client
        self.export: ExportService = export or ExportServiceImpl(client)
        return self

    @classmethod
    def stub(
        cls,
        export: ExportService | None = None,
    ) -> "PachcaClient":
        self = cls.__new__(cls)
        self._client = None
        self.export = export or ExportService()
        return self
