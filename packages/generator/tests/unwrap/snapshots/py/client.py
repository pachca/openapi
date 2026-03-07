from __future__ import annotations

from dataclasses import asdict

import httpx

from .models import (
    OAuthError,
    ApiError,
    ChatCreateRequest,
    Chat,
)
from .utils import from_dict

class MembersService:
    def __init__(self, client: httpx.AsyncClient) -> None:
        self._client = client

    async def add_members(
        self,
        id: int,
        member_ids: list[int],
    ) -> None:
        response = await self._client.post(
            f"/chats/{id}/members",
            json={"member_ids": member_ids},
        )
        match response.status_code:
            case 204:
                return
            case 401:
                raise from_dict(OAuthError, response.json())
            case _:
                raise from_dict(ApiError, response.json())


class ChatsService:
    def __init__(self, client: httpx.AsyncClient) -> None:
        self._client = client

    async def create_chat(
        self,
        request: ChatCreateRequest,
    ) -> Chat:
        response = await self._client.post(
            "/chats",
            json=asdict(request),
        )
        body = response.json()
        match response.status_code:
            case 201:
                return from_dict(Chat, body["data"])
            case 401:
                raise from_dict(OAuthError, body)
            case _:
                raise from_dict(ApiError, body)

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
        self.members = MembersService(self._client)

    async def close(self) -> None:
        await self._client.aclose()
