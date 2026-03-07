from __future__ import annotations

from dataclasses import asdict

import httpx

from .models import ApiError, Chat, ChatCreateRequest, OAuthError
from .utils import from_dict


class MembersService:
    """D1: addMembers — 1 field unwrapped into function params."""

    def __init__(self, client: httpx.AsyncClient) -> None:
        self._client = client

    async def add_members(self, id: int, member_ids: list[int]) -> None:
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

    async def archive_chat(self, id: int) -> None:
        """D2: archiveChat — void action, no body."""
        response = await self._client.put(f"/chats/{id}/archive")
        match response.status_code:
            case 204:
                return
            case 401:
                raise from_dict(OAuthError, response.json())
            case _:
                raise from_dict(ApiError, response.json())

    async def create_chat(self, request: ChatCreateRequest) -> Chat:
        """D3: createChat — 2+ fields, pass as object."""
        response = await self._client.post("/chats", json=asdict(request))
        body = response.json()
        match response.status_code:
            case 201:
                return from_dict(Chat, body["data"])
            case 401:
                raise from_dict(OAuthError, body)
            case _:
                raise from_dict(ApiError, body)


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
