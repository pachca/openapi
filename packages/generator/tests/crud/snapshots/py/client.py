from __future__ import annotations

from dataclasses import asdict

import httpx

from .models import (
    ApiError,
    Chat,
    ChatCreateRequest,
    ChatUpdateRequest,
    ListChatsParams,
    ListChatsResponse,
    OAuthError,
)
from .utils import from_dict


class ChatsService:
    def __init__(self, client: httpx.AsyncClient) -> None:
        self._client = client

    async def list_chats(
        self, params: ListChatsParams | None = None
    ) -> ListChatsResponse:
        query: dict[str, str] = {}
        if params:
            if params.availability is not None:
                query["availability"] = params.availability
            if params.limit is not None:
                query["limit"] = str(params.limit)
            if params.cursor is not None:
                query["cursor"] = params.cursor
            if params.sort_field is not None:
                query["sort[field]"] = params.sort_field
            if params.sort_order is not None:
                query["sort[order]"] = params.sort_order
        response = await self._client.get("/chats", params=query)
        body = response.json()
        match response.status_code:
            case 200:
                return from_dict(ListChatsResponse, body)
            case 401:
                raise from_dict(OAuthError, body)
            case _:
                raise from_dict(ApiError, body)

    async def get_chat(self, id: int) -> Chat:
        response = await self._client.get(f"/chats/{id}")
        body = response.json()
        match response.status_code:
            case 200:
                return from_dict(Chat, body["data"])
            case 401:
                raise from_dict(OAuthError, body)
            case _:
                raise from_dict(ApiError, body)

    async def create_chat(self, request: ChatCreateRequest) -> Chat:
        response = await self._client.post("/chats", json=asdict(request))
        body = response.json()
        match response.status_code:
            case 201:
                return from_dict(Chat, body["data"])
            case 401:
                raise from_dict(OAuthError, body)
            case _:
                raise from_dict(ApiError, body)

    async def update_chat(
        self, id: int, request: ChatUpdateRequest
    ) -> Chat:
        response = await self._client.put(f"/chats/{id}", json=asdict(request))
        body = response.json()
        match response.status_code:
            case 200:
                return from_dict(Chat, body["data"])
            case 401:
                raise from_dict(OAuthError, body)
            case _:
                raise from_dict(ApiError, body)

    async def delete_chat(self, id: int) -> None:
        response = await self._client.delete(f"/chats/{id}")
        match response.status_code:
            case 204:
                return
            case 401:
                raise from_dict(OAuthError, response.json())
            case _:
                raise from_dict(ApiError, response.json())

    async def archive_chat(self, id: int) -> None:
        response = await self._client.put(f"/chats/{id}/archive")
        match response.status_code:
            case 204:
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
        self.chats = ChatsService(self._client)

    async def close(self) -> None:
        await self._client.aclose()
