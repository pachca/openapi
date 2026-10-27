from __future__ import annotations

import httpx

from .models import (
    SearchMessagesParams,
    SearchMessagesResponse,
    MessageResult,
    OAuthError,
)
from .utils import deserialize, RetryTransport


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

class SearchService:
    async def search_messages(
        self,
        params: SearchMessagesParams,
    ) -> SearchMessagesResponse:
        raise NotImplementedError("Search.searchMessages is not implemented")

    async def search_messages_all(
        self,
        params: SearchMessagesParams,
    ) -> list[MessageResult]:
        raise NotImplementedError("Search.searchMessagesAll is not implemented")


class SearchServiceImpl(SearchService):
    def __init__(self, client: httpx.AsyncClient) -> None:
        self._client = client

    async def search_messages(
        self,
        params: SearchMessagesParams,
    ) -> SearchMessagesResponse:
        query: list[tuple[str, str]] = []
        query.append(("query", params.query))
        if params.chat_ids is not None:
            for v in params.chat_ids:
                query.append(("chat_ids[]", str(v)))
        if params is not None and params.user_ids is not None:
            for v in params.user_ids:
                query.append(("user_ids", str(v)))
        if params is not None and params.limit is not None:
            query.append(("limit", str(params.limit)))
        if params is not None and params.cursor is not None:
            query.append(("cursor", params.cursor))
        response = await self._client.get(
            "/search/messages",
            params=query,
        )
        match response.status_code:
            case 200:
                return deserialize(SearchMessagesResponse, response.json())
            case 401:
                raise _oauth_error_from_response(response)
            case _:
                raise RuntimeError(
                    f"Unexpected status code: {response.status_code}"
                )

    async def search_messages_all(
        self,
        params: SearchMessagesParams,
    ) -> list[MessageResult]:
        items: list[MessageResult] = []
        cursor: str | None = None
        has_next = True
        while has_next:
            if params is None:
                params = SearchMessagesParams()
            params.cursor = cursor
            response = await self.search_messages(params=params)
            items.extend(response.data)
            if not response.data:
                break
            cursor = response.meta.paginate.next_page
            reported_has_next = getattr(response.meta.paginate, "has_next", None)
            has_next = True if reported_has_next is None else reported_has_next
        return items


PACHCA_API_URL = "https://api.pachca.com/api/shared/v1"


class PachcaClient:
    def __init__(self, token: str, base_url: str = PACHCA_API_URL, search: SearchService | None = None) -> None:
        self._client = httpx.AsyncClient(
            base_url=base_url,
            headers={"Authorization": f"Bearer {token}"},
            transport=RetryTransport(httpx.AsyncHTTPTransport()),
        )
        self.search: SearchService = search or SearchServiceImpl(self._client)

    async def close(self) -> None:
        await self._client.aclose()

    @classmethod
    def from_client(
        cls,
        client: httpx.AsyncClient,
        search: SearchService | None = None,
    ) -> "PachcaClient":
        self = cls.__new__(cls)
        self._client = client
        self.search: SearchService = search or SearchServiceImpl(client)
        return self

    @classmethod
    def stub(
        cls,
        search: SearchService | None = None,
    ) -> "PachcaClient":
        self = cls.__new__(cls)
        self._client = None
        self.search = search or SearchService()
        return self
