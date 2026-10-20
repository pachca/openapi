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


def _error_from_body(body: object) -> Exception:
    # An error body is either {"errors": [...]} or the OAuth form {"error", "error_description"},
    # which also comes with 400 and 403 (insufficient_scope, invalid_grant). The body decides the class.
    if isinstance(body, dict) and isinstance(body.get("error"), str) and "errors" not in body:
        return OAuthError(OAuthErrorCode(body["error"]), str(body.get("error_description") or ""))
    return deserialize(ApiError, body)

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
        body = response.json()
        match response.status_code:
            case 200:
                return deserialize(ListMembersResponse, body)
            case 401:
                raise deserialize(OAuthError, body)
            case _:
                raise _error_from_body(body)

    async def update_member(
        self,
        id: int,
        request: MemberUpdateRequest,
    ) -> Member:
        response = await self._client.put(
            f"/members/{id}",
            json=serialize(request),
        )
        body = response.json()
        match response.status_code:
            case 200:
                return deserialize(Member, body["data"])
            case 401:
                raise deserialize(OAuthError, body)
            case _:
                raise _error_from_body(body)


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
