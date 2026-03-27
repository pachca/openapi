from __future__ import annotations

from dataclasses import dataclass

import httpx

from .models import (
    SearchMessagesParams,
    SearchMessagesResponse,
    MessageSearchResult,
    OAuthError,
    SearchSort,
)
from .utils import deserialize, RetryTransport

class SearchService:
    async def search_messages(
        self,
        params: SearchMessagesParams,
    ) -> SearchMessagesResponse:
        raise NotImplementedError("Search.searchMessages is not implemented")

    async def search_messages_all(
        self,
        params: SearchMessagesParams,
    ) -> list[MessageSearchResult]:
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
        if params is not None and params.chat_ids is not None:
            for v in params.chat_ids:
                query.append(("chat_ids[]", str(v)))
        if params is not None and params.user_ids is not None:
            for v in params.user_ids:
                query.append(("user_ids[]", str(v)))
        if params is not None and params.created_from is not None:
            query.append(("created_from", params.created_from.isoformat()))
        if params is not None and params.created_to is not None:
            query.append(("created_to", params.created_to.isoformat()))
        if params is not None and params.sort is not None:
            query.append(("sort", params.sort))
        if params is not None and params.limit is not None:
            query.append(("limit", str(params.limit)))
        if params is not None and params.cursor is not None:
            query.append(("cursor", params.cursor))
        response = await self._client.get(
            "/search/messages",
            params=query,
        )
        body = response.json()
        match response.status_code:
            case 200:
                return deserialize(SearchMessagesResponse, body)
            case 401:
                raise deserialize(OAuthError, body)
            case _:
                raise RuntimeError(
                    f"Unexpected status code: {response.status_code}"
                )

    async def search_messages_all(
        self,
        params: SearchMessagesParams,
    ) -> list[MessageSearchResult]:
        items: list[MessageSearchResult] = []
        cursor: str | None = None
        while True:
            if params is None:
                params = SearchMessagesParams()
            params.cursor = cursor
            response = await self.search_messages(params=params)
            items.extend(response.data)
            if not response.data:
                break
            cursor = response.meta.paginate.next_page
        return items


class PachcaClient:
    def __init__(self, token: str, base_url: str = "https://api.pachca.com/api/shared/v1", search: SearchService | None = None) -> None:
        self._client = httpx.AsyncClient(
            base_url=base_url,
            headers={"Authorization": f"Bearer {token}"},
            transport=RetryTransport(httpx.AsyncHTTPTransport()),
        )
        self.search: SearchService = search or SearchServiceImpl(self._client)

    async def close(self) -> None:
        await self._client.aclose()

    @classmethod
    def stub(
        cls,
        search: SearchService | None = None,
    ) -> "PachcaClient":
        self = cls.__new__(cls)
        self._client = None
        self.search = search or SearchService()
        return self
