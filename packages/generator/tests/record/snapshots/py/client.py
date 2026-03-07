from __future__ import annotations

from dataclasses import asdict

import httpx

from .models import LinkPreviewsRequest, OAuthError, ApiError
from .utils import from_dict

class LinkPreviewsService:
    def __init__(self, client: httpx.AsyncClient) -> None:
        self._client = client

    async def create_link_previews(
        self,
        id: int,
        request: LinkPreviewsRequest,
    ) -> None:
        response = await self._client.post(
            f"/messages/{id}/link_previews",
            json=asdict(request),
        )
        match response.status_code:
            case 201:
                return
            case 401:
                raise from_dict(OAuthError, response.json())
            case _:
                raise from_dict(ApiError, response.json())


class PachcaClient:
    def __init__(self, base_url: str, token: str) -> None:
        self._client = httpx.AsyncClient(
            base_url=base_url,
            headers={"Authorization": f"Bearer {token}"},
        )
        self.link_previews = LinkPreviewsService(self._client)

    async def close(self) -> None:
        await self._client.aclose()
