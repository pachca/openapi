from __future__ import annotations

import httpx

from .models import ItemPatchRequest, Item, ApiError
from .utils import deserialize, serialize, RetryTransport


def _error_body(response: httpx.Response) -> object:
    # The body of an error answer, or None when it is empty or not JSON (a 404 without a body, a proxy page).
    try:
        return response.json()
    except ValueError:
        return None


def _error_from_response(response: httpx.Response) -> Exception:
    # An empty body or one that is not JSON gives an ApiError with no errors. The status code stays in status_code.
    body = _error_body(response)
    error = ApiError(errors=[])
    errors = body.get("errors") if isinstance(body, dict) else None
    if isinstance(errors, list) and all(isinstance(item, dict) for item in errors):
        try:
            error = deserialize(ApiError, body)
        except (TypeError, ValueError):
            pass  # errors of another shape: the status code still says what happened
    error.status_code = response.status_code
    return error

class ItemsService:
    async def patch_item(
        self,
        id: int,
        request: ItemPatchRequest,
    ) -> Item:
        raise NotImplementedError("Items.patchItem is not implemented")


class ItemsServiceImpl(ItemsService):
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
        match response.status_code:
            case 200:
                return deserialize(Item, response.json()["data"])
            case _:
                raise _error_from_response(response)


PACHCA_API_URL = "https://api.example.com/v1"


class PachcaClient:
    def __init__(self, token: str, base_url: str = PACHCA_API_URL, items: ItemsService | None = None) -> None:
        self._client = httpx.AsyncClient(
            base_url=base_url,
            headers={"Authorization": f"Bearer {token}"},
            transport=RetryTransport(httpx.AsyncHTTPTransport()),
        )
        self.items: ItemsService = items or ItemsServiceImpl(self._client)

    async def close(self) -> None:
        await self._client.aclose()

    @classmethod
    def from_client(
        cls,
        client: httpx.AsyncClient,
        items: ItemsService | None = None,
    ) -> "PachcaClient":
        self = cls.__new__(cls)
        self._client = client
        self.items: ItemsService = items or ItemsServiceImpl(client)
        return self

    @classmethod
    def stub(
        cls,
        items: ItemsService | None = None,
    ) -> "PachcaClient":
        self = cls.__new__(cls)
        self._client = None
        self.items = items or ItemsService()
        return self
