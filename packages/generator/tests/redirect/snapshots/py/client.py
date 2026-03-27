from __future__ import annotations

from dataclasses import dataclass

import httpx

from .models import OAuthError, ApiError
from .utils import deserialize, RetryTransport

class CommonService:
    async def download_export(
        self,
        id: int,
    ) -> str:
        raise NotImplementedError("Common.downloadExport is not implemented")


class CommonServiceImpl(CommonService):
    def __init__(self, client: httpx.AsyncClient) -> None:
        self._client = client

    async def download_export(
        self,
        id: int,
    ) -> str:
        response = await self._client.get(
            f"/exports/{id}",
            follow_redirects=False,
        )
        match response.status_code:
            case 302:
                location = response.headers.get("location")
                if not location:
                    raise RuntimeError(
                        "Missing Location header in redirect response"
                    )
                return location
            case 401:
                raise deserialize(OAuthError, response.json())
            case _:
                raise deserialize(ApiError, response.json())


class PachcaClient:
    def __init__(self, token: str, base_url: str = "https://api.pachca.com/api/shared/v1", common: CommonService | None = None) -> None:
        self._client = httpx.AsyncClient(
            base_url=base_url,
            headers={"Authorization": f"Bearer {token}"},
            transport=RetryTransport(httpx.AsyncHTTPTransport()),
        )
        self.common: CommonService = common or CommonServiceImpl(self._client)

    async def close(self) -> None:
        await self._client.aclose()
