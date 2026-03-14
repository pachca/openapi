from __future__ import annotations

import httpx

from .models import ItemPatchRequest, Item, ApiError
from .utils import deserialize, serialize, RetryTransport

class ItemsService:
    def __init__(self, client: httpx.AsyncClient) -> None:
        self._client = client

    async def patch_item(
        self,
        id: int,
        request: ItemPatchRequest,
    ) -> Item:
        response = await self._client.patch(
            f"/items/{id}",
            json=serialize(request),
        )
        body = response.json()
        match response.status_code:
            case 200:
                return deserialize(Item, body["data"])
            case _:
                raise deserialize(ApiError, body)


class PachcaClient:
    def __init__(self, token: str, base_url: str = "https://api.example.com/v1") -> None:
        self._client = httpx.AsyncClient(
            base_url=base_url,
            headers={"Authorization": f"Bearer {token}"},
            transport=RetryTransport(httpx.AsyncHTTPTransport()),
        )
        self.items = ItemsService(self._client)

    async def close(self) -> None:
        await self._client.aclose()
