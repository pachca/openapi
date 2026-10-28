from __future__ import annotations

import httpx

from .models import (
    ListMembersParams,
    ListMembersResponse,
    OAuthError,
    OAuthErrorCode,
    ApiError,
    SortOrder,
    MemberRole,
    Region,
    MemberUpdateRequest,
    Member,
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
        return OAuthError(error=OAuthErrorCode(body["error"]), error_description=str(body.get("error_description") or ""))
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
    async def list_members(
        self,
        params: ListMembersParams | None = None,
    ) -> ListMembersResponse:
        raise NotImplementedError("Members.listMembers is not implemented")

    async def update_member(
        self,
        id: int,
        request: MemberUpdateRequest,
    ) -> Member:
        raise NotImplementedError("Members.updateMember is not implemented")


class MembersServiceImpl(MembersService):
    def __init__(self, client: httpx.AsyncClient) -> None:
        self._client = client

    async def list_members(
        self,
        params: ListMembersParams | None = None,
    ) -> ListMembersResponse:
        query: list[tuple[str, str]] = []
        if params is not None and params.sort is not None:
            query.append(("sort", params.sort))
        if params is not None and params.role is not None:
            query.append(("role", params.role))
        if params is not None and params.roles is not None:
            for v in params.roles:
                query.append(("roles[]", str(v)))
        if params is not None and params.region is not None:
            query.append(("region", params.region))
        response = await self._client.get(
            "/members",
            params=query,
        )
        match response.status_code:
            case 200:
                return deserialize(ListMembersResponse, response.json())
            case _:
                raise _error_from_response(response)

    async def update_member(
        self,
        id: int,
        request: MemberUpdateRequest,
    ) -> Member:
        response = await self._client.put(
            f"/members/{id}",
            json=serialize(request),
        )
        match response.status_code:
            case 200:
                return deserialize(Member, response.json()["data"])
            case _:
                raise _error_from_response(response)


class PachcaClient:
    def __init__(self, token: str, base_url: str, members: MembersService | None = None) -> None:
        self._client = httpx.AsyncClient(
            base_url=base_url,
            headers={"Authorization": f"Bearer {token}"},
            transport=RetryTransport(httpx.AsyncHTTPTransport()),
        )
        self.members: MembersService = members or MembersServiceImpl(self._client)

    async def close(self) -> None:
        await self._client.aclose()

    @classmethod
    def from_client(
        cls,
        client: httpx.AsyncClient,
        members: MembersService | None = None,
    ) -> "PachcaClient":
        self = cls.__new__(cls)
        self._client = client
        self.members: MembersService = members or MembersServiceImpl(client)
        return self

    @classmethod
    def stub(
        cls,
        members: MembersService | None = None,
    ) -> "PachcaClient":
        self = cls.__new__(cls)
        self._client = None
        self.members = members or MembersService()
        return self
