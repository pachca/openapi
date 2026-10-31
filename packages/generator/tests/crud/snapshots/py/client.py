from __future__ import annotations

import httpx

from .models import (
    ListChatsParams,
    ListChatsResponse,
    Chat,
    OAuthError,
    ApiError,
    ChatAvailability,
    SortOrder,
    ChatCreateRequest,
    ChatUpdateRequest,
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

class ChatsService:
    async def list_chats(
        self,
        params: ListChatsParams | None = None,
    ) -> ListChatsResponse:
        raise NotImplementedError("Chats.listChats is not implemented")

    async def list_chats_all(
        self,
        params: ListChatsParams | None = None,
    ) -> list[Chat]:
        raise NotImplementedError("Chats.listChatsAll is not implemented")

    async def get_chat(
        self,
        id: int,
    ) -> Chat:
        raise NotImplementedError("Chats.getChat is not implemented")

    async def create_chat(
        self,
        request: ChatCreateRequest,
    ) -> Chat:
        raise NotImplementedError("Chats.createChat is not implemented")

    async def update_chat(
        self,
        id: int,
        request: ChatUpdateRequest,
    ) -> Chat:
        raise NotImplementedError("Chats.updateChat is not implemented")

    async def archive_chat(
        self,
        id: int,
    ) -> None:
        raise NotImplementedError("Chats.archiveChat is not implemented")

    async def delete_chat(
        self,
        id: int,
    ) -> None:
        raise NotImplementedError("Chats.deleteChat is not implemented")


class ChatsServiceImpl(ChatsService):
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
        match response.status_code:
            case 200:
                return deserialize(ListChatsResponse, response.json())
            case _:
                raise _error_from_response(response)

    async def list_chats_all(
        self,
        params: ListChatsParams | None = None,
    ) -> list[Chat]:
        items: list[Chat] = []
        cursor: str | None = None
        while True:
            if params is None:
                params = ListChatsParams()
            params.cursor = cursor
            response = await self.list_chats(params=params)
            items.extend(response.data)
            if not response.data:
                break
            cursor = response.meta.paginate.next_page if response.meta else None
            if not cursor:
                break
        return items

    async def get_chat(
        self,
        id: int,
    ) -> Chat:
        response = await self._client.get(
            f"/chats/{id}",
        )
        match response.status_code:
            case 200:
                return deserialize(Chat, response.json()["data"])
            case _:
                raise _error_from_response(response)

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

    async def update_chat(
        self,
        id: int,
        request: ChatUpdateRequest,
    ) -> Chat:
        response = await self._client.put(
            f"/chats/{id}",
            json=serialize(request),
        )
        match response.status_code:
            case 200:
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
            case _:
                raise _error_from_response(response)


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
