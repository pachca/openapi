from __future__ import annotations

import httpx

from .models import (
    OAuthError,
    ApiError,
    ChatCreateRequest,
    Chat,
)
from .utils import deserialize, serialize, RetryTransport


def _error_from_body(body: object) -> Exception:
    # An error body is either {"errors": [...]} or the OAuth form {"error", "error_description"},
    # which also comes with 400 and 403 (insufficient_scope, invalid_grant). The body decides the class.
    if isinstance(body, dict) and isinstance(body.get("error"), str) and "errors" not in body:
        return OAuthError(body["error"], str(body.get("error_description") or ""))
    return deserialize(ApiError, body)

class MembersService:
    async def add_members(
        self,
        id: int,
        member_ids: list[int],
    ) -> None:
        raise NotImplementedError("Members.addMembers is not implemented")


class MembersServiceImpl(MembersService):
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
                raise deserialize(OAuthError, response.json())
            case _:
                raise _error_from_body(response.json())


class ChatsService:
    async def create_chat(
        self,
        request: ChatCreateRequest,
    ) -> Chat:
        raise NotImplementedError("Chats.createChat is not implemented")

    async def archive_chat(
        self,
        id: int,
    ) -> None:
        raise NotImplementedError("Chats.archiveChat is not implemented")


class ChatsServiceImpl(ChatsService):
    def __init__(self, client: httpx.AsyncClient) -> None:
        self._client = client

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
                raise _error_from_body(body)

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
                raise _error_from_body(response.json())


PACHCA_API_URL = "https://api.pachca.com/api/shared/v1"


class PachcaClient:
    def __init__(self, token: str, base_url: str = PACHCA_API_URL, chats: ChatsService | None = None, members: MembersService | None = None) -> None:
        self._client = httpx.AsyncClient(
            base_url=base_url,
            headers={"Authorization": f"Bearer {token}"},
            transport=RetryTransport(httpx.AsyncHTTPTransport()),
        )
        self.chats: ChatsService = chats or ChatsServiceImpl(self._client)
        self.members: MembersService = members or MembersServiceImpl(self._client)

    async def close(self) -> None:
        await self._client.aclose()

    @classmethod
    def from_client(
        cls,
        client: httpx.AsyncClient,
        chats: ChatsService | None = None,
        members: MembersService | None = None,
    ) -> "PachcaClient":
        self = cls.__new__(cls)
        self._client = client
        self.chats: ChatsService = chats or ChatsServiceImpl(client)
        self.members: MembersService = members or MembersServiceImpl(client)
        return self

    @classmethod
    def stub(
        cls,
        chats: ChatsService | None = None,
        members: MembersService | None = None,
    ) -> "PachcaClient":
        self = cls.__new__(cls)
        self._client = None
        self.chats = chats or ChatsService()
        self.members = members or MembersService()
        return self
