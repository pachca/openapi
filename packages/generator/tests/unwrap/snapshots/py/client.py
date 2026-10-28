from __future__ import annotations

import httpx

from .models import (
    OAuthError,
    ApiError,
    ChatCreateRequest,
    Chat,
)
from .utils import deserialize, serialize, RetryTransport


def _error_body(response: httpx.Response) -> object:
    # The body of an error answer, or None when it is empty or not JSON (a 404 without a body, a proxy page).
    try:
        return response.json()
    except ValueError:
        return None


def _error_from_response(response: httpx.Response) -> Exception:
    # An error body is either {"errors": [...]} or the OAuth form {"error", "error_description"},
    # which also comes with 400 and 403 (insufficient_scope, invalid_grant). The body decides the class.
    # An empty body or one that is not JSON gives an ApiError with no errors. The status code stays in status_code.
    body = _error_body(response)
    if isinstance(body, dict) and isinstance(body.get("error"), str) and "errors" not in body:
        return OAuthError(error=body["error"])
    error = ApiError(errors=[])
    errors = body.get("errors") if isinstance(body, dict) else None
    if isinstance(errors, list) and all(isinstance(item, dict) for item in errors):
        try:
            error = deserialize(ApiError, body)
        except (TypeError, ValueError):
            pass  # errors of another shape: the status code still says what happened
    error.status_code = response.status_code
    return error

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
            case _:
                raise _error_from_response(response)


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
        match response.status_code:
            case 201:
                return deserialize(Chat, response.json()["data"])
            case _:
                raise _error_from_response(response)

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
            case _:
                raise _error_from_response(response)


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
