from __future__ import annotations

import httpx

from .models import (
    ListChatsParams,
    ListChatsResponse,
    OAuthError,
    ApiError,
    Chat,
    ChatCreateRequest,
    ChatUpdateRequest,
)
from .utils import deserialize, serialize

class ChatsService:
    def __init__(self, client: httpx.AsyncClient) -> None:
        self._client = client

    async def list_chats(
        self,
        params: ListChatsParams | None = None,
    ) -> ListChatsResponse:
        query: dict[str, str] = {}
        if params is not None and params.availability is not None:
            query["availability"] = params.availability
        if params is not None and params.limit is not None:
            query["limit"] = str(params.limit)
        if params is not None and params.cursor is not None:
            query["cursor"] = params.cursor
        if params is not None and params.sort_field is not None:
            query["sort[field]"] = params.sort_field
        if params is not None and params.sort_order is not None:
            query["sort[order]"] = params.sort_order
        response = await self._client.get(
            "/chats",
            params=query,
        )
        body = response.json()
        match response.status_code:
            case 200:
                return deserialize(ListChatsResponse, body)
            case 401:
                raise deserialize(OAuthError, body)
            case _:
                raise deserialize(ApiError, body)

    async def get_chat(
        self,
        id: int,
    ) -> Chat:
        response = await self._client.get(
            f"/chats/{id}",
        )
        body = response.json()
        match response.status_code:
            case 200:
                return deserialize(Chat, body["data"])
            case 401:
                raise deserialize(OAuthError, body)
            case _:
                raise deserialize(ApiError, body)

    async def create_chat(
        self,
        request: ChatCreateRequest,
    ) -> Chat:
        response = await self._client.post(
            "/chats",
            json=serialize(request),
        )
        body = response.json()
        match response.status_code:
            case 201:
                return deserialize(Chat, body["data"])
            case 401:
                raise deserialize(OAuthError, body)
            case _:
                raise deserialize(ApiError, body)

    async def update_chat(
        self,
        id: int,
        request: ChatUpdateRequest,
    ) -> Chat:
        response = await self._client.put(
            f"/chats/{id}",
            json=serialize(request),
        )
        body = response.json()
        match response.status_code:
            case 200:
                return deserialize(Chat, body["data"])
            case 401:
                raise deserialize(OAuthError, body)
            case _:
                raise deserialize(ApiError, body)

    async def archive_chat(
        self,
        id: int,
    ) -> None:
        response = await self._client.put(
            f"/chats/{id}/archive",
        )
        match response.status_code:
            case 204:
                return
            case 401:
                raise deserialize(OAuthError, response.json())
            case _:
                raise deserialize(ApiError, response.json())

    async def delete_chat(
        self,
        id: int,
    ) -> None:
        response = await self._client.delete(
            f"/chats/{id}",
        )
        match response.status_code:
            case 204:
                return
            case 401:
                raise deserialize(OAuthError, response.json())
            case _:
                raise deserialize(ApiError, response.json())


class PachcaClient:
    def __init__(self, token: str, base_url: str = "https://api.pachca.com/api/shared/v1") -> None:
        self._client = httpx.AsyncClient(
            base_url=base_url,
            headers={"Authorization": f"Bearer {token}"},
        )
        self.chats = ChatsService(self._client)

    async def close(self) -> None:
        await self._client.aclose()
