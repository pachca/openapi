from __future__ import annotations

import httpx

from .models import (
    ListReadMembersParams,
    ListReadMembersResponse,
    OAuthError,
    ApiError,
)
from .utils import deserialize, RetryTransport


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

class ReadMembersService:
    async def list_read_members(
        self,
        id: int,
        params: ListReadMembersParams | None = None,
    ) -> ListReadMembersResponse:
        raise NotImplementedError("Read members.listReadMembers is not implemented")

    async def list_read_members_all(
        self,
        id: int,
        params: ListReadMembersParams | None = None,
    ) -> list[int]:
        raise NotImplementedError("Read members.listReadMembersAll is not implemented")


class ReadMembersServiceImpl(ReadMembersService):
    def __init__(self, client: httpx.AsyncClient) -> None:
        self._client = client

    async def list_read_members(
        self,
        id: int,
        params: ListReadMembersParams | None = None,
    ) -> ListReadMembersResponse:
        query: dict[str, str] = {}
        if params is not None and params.limit is not None:
            query["limit"] = str(params.limit)
        if params is not None and params.cursor is not None:
            query["cursor"] = params.cursor
        response = await self._client.get(
            f"/messages/{id}/read_member_ids",
            params=query,
        )
        match response.status_code:
            case 200:
                return deserialize(ListReadMembersResponse, response.json())
            case _:
                raise _error_from_response(response)

    async def list_read_members_all(
        self,
        id: int,
        params: ListReadMembersParams | None = None,
    ) -> list[int]:
        items: list[int] = []
        cursor: str | None = None
        while True:
            if params is None:
                params = ListReadMembersParams()
            params.cursor = cursor
            response = await self.list_read_members(id, params=params)
            items.extend(response.data)
            if not response.data:
                break
            cursor = response.meta.paginate.next_page
        return items


PACHCA_API_URL = "https://api.pachca.com/api/shared/v1"


class PachcaClient:
    def __init__(self, token: str, base_url: str = PACHCA_API_URL, read_members: ReadMembersService | None = None) -> None:
        self._client = httpx.AsyncClient(
            base_url=base_url,
            headers={"Authorization": f"Bearer {token}"},
            transport=RetryTransport(httpx.AsyncHTTPTransport()),
        )
        self.read_members: ReadMembersService = read_members or ReadMembersServiceImpl(self._client)

    async def close(self) -> None:
        await self._client.aclose()

    @classmethod
    def from_client(
        cls,
        client: httpx.AsyncClient,
        read_members: ReadMembersService | None = None,
    ) -> "PachcaClient":
        self = cls.__new__(cls)
        self._client = client
        self.read_members: ReadMembersService = read_members or ReadMembersServiceImpl(client)
        return self

    @classmethod
    def stub(
        cls,
        read_members: ReadMembersService | None = None,
    ) -> "PachcaClient":
        self = cls.__new__(cls)
        self._client = None
        self.read_members = read_members or ReadMembersService()
        return self
