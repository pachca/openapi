from __future__ import annotations

import httpx

from .models import SearchMessagesParams, SearchMessagesResponse, OAuthError
from .utils import from_dict

class SearchService:
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
        if params.user_ids is not None:
            for v in params.user_ids:
                query.append(("user_ids[]", str(v)))
        if params is not None and params.created_from is not None:
            query.append(("created_from", params.created_from))
        if params is not None and params.created_to is not None:
            query.append(("created_to", params.created_to))
        if params is not None and params.sort is not None:
            query.append(("sort", params.sort))
        if params is not None and params.limit is not None:
            query.append(("limit", str(params.limit)))
        if params is not None and params.cursor is not None:
            query.append(("cursor", params.cursor))
        response = await self._client.get(
            f"/search/messages",
            params=query,
        )
        body = response.json()
        match response.status_code:
            case 200:
                return from_dict(SearchMessagesResponse, body)
            case 401:
                raise from_dict(OAuthError, body)
            case _:
                raise RuntimeError(
                    f"Unexpected status code: {response.status_code}"
                )


class PachcaClient:
    def __init__(self, base_url: str, token: str) -> None:
        self._client = httpx.AsyncClient(
            base_url=base_url,
            headers={"Authorization": f"Bearer {token}"},
        )
        self.search = SearchService(self._client)

    async def close(self) -> None:
        await self._client.aclose()
