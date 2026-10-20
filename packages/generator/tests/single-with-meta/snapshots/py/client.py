from __future__ import annotations

import httpx

from .models import (
    Chat,
    OAuthError,
    ApiError,
    ChatCreateRequest,
    CreateChatResponse,
    ChatUpdateRequest,
    UpdateChatResponse,
)
from .utils import deserialize, serialize, RetryTransport


def _error_from_body(body: object) -> Exception:
    # An error body is either {"errors": [...]} or the OAuth form {"error", "error_description"},
    # which also comes with 400 and 403 (insufficient_scope, invalid_grant). The body decides the class.
    if isinstance(body, dict) and isinstance(body.get("error"), str) and "errors" not in body:
        return OAuthError(body["error"], str(body.get("error_description") or ""))
    return deserialize(ApiError, body)

class ChatsService:
    async def get_chat(
        self,
        id: int,
    ) -> Chat:
        raise NotImplementedError("Chats.getChat is not implemented")

    async def create_chat(
        self,
        request: ChatCreateRequest,
    ) -> CreateChatResponse:
        raise NotImplementedError("Chats.createChat is not implemented")

    async def update_chat(
        self,
        id: int,
        request: ChatUpdateRequest,
    ) -> UpdateChatResponse:
        raise NotImplementedError("Chats.updateChat is not implemented")


class ChatsServiceImpl(ChatsService):
    def __init__(self, client: httpx.AsyncClient) -> None:
        self._client = client

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
                raise _error_from_body(body)

    async def create_chat(
        self,
        request: ChatCreateRequest,
    ) -> CreateChatResponse:
        response = await self._client.post(
            "/chats",
            json=serialize(request),
        )
        body = response.json()
        match response.status_code:
            case 201:
                return deserialize(CreateChatResponse, body)
            case 401:
                raise deserialize(OAuthError, body)
            case _:
                raise _error_from_body(body)

    async def update_chat(
        self,
        id: int,
        request: ChatUpdateRequest,
    ) -> UpdateChatResponse:
        response = await self._client.put(
            f"/chats/{id}",
            json=serialize(request),
        )
        body = response.json()
        match response.status_code:
            case 200:
                return deserialize(UpdateChatResponse, body)
            case 401:
                raise deserialize(OAuthError, body)
            case _:
                raise _error_from_body(body)


PACHCA_API_URL = "https://api.pachca.com/api/shared/v1"


class PachcaClient:
    def __init__(self, token: str, base_url: str = PACHCA_API_URL, chats: ChatsService | None = None) -> None:
        self._client = httpx.AsyncClient(
            base_url=base_url,
            headers={"Authorization": f"Bearer {token}"},
            transport=RetryTransport(httpx.AsyncHTTPTransport()),
        )
        self.chats: ChatsService = chats or ChatsServiceImpl(self._client)

    async def close(self) -> None:
        await self._client.aclose()

    @classmethod
    def from_client(
        cls,
        client: httpx.AsyncClient,
        chats: ChatsService | None = None,
    ) -> "PachcaClient":
        self = cls.__new__(cls)
        self._client = client
        self.chats: ChatsService = chats or ChatsServiceImpl(client)
        return self

    @classmethod
    def stub(
        cls,
        chats: ChatsService | None = None,
    ) -> "PachcaClient":
        self = cls.__new__(cls)
        self._client = None
        self.chats = chats or ChatsService()
        return self
