from __future__ import annotations

import httpx

from .models import LinkPreviewsRequest, OAuthError, ApiError
from .utils import deserialize, serialize, RetryTransport


def _error_from_body(body: object) -> Exception:
    # An error body is either {"errors": [...]} or the OAuth form {"error", "error_description"},
    # which also comes with 400 and 403 (insufficient_scope, invalid_grant). The body decides the class.
    if isinstance(body, dict) and isinstance(body.get("error"), str) and "errors" not in body:
        return OAuthError(body["error"], str(body.get("error_description") or ""))
    return deserialize(ApiError, body)

class LinkPreviewsService:
    async def create_link_previews(
        self,
        id: int,
        request: LinkPreviewsRequest,
    ) -> None:
        raise NotImplementedError("Link Previews.createLinkPreviews is not implemented")


class LinkPreviewsServiceImpl(LinkPreviewsService):
    def __init__(self, client: httpx.AsyncClient) -> None:
        self._client = client

    async def create_link_previews(
        self,
        id: int,
        request: LinkPreviewsRequest,
    ) -> None:
        response = await self._client.post(
            f"/messages/{id}/link_previews",
            json=serialize(request),
        )
        match response.status_code:
            case 201:
                return
            case 401:
                raise deserialize(OAuthError, response.json())
            case _:
                raise _error_from_body(response.json())


PACHCA_API_URL = "https://api.pachca.com/api/shared/v1"


class PachcaClient:
    def __init__(self, token: str, base_url: str = PACHCA_API_URL, link_previews: LinkPreviewsService | None = None) -> None:
        self._client = httpx.AsyncClient(
            base_url=base_url,
            headers={"Authorization": f"Bearer {token}"},
            transport=RetryTransport(httpx.AsyncHTTPTransport()),
        )
        self.link_previews: LinkPreviewsService = link_previews or LinkPreviewsServiceImpl(self._client)

    async def close(self) -> None:
        await self._client.aclose()

    @classmethod
    def from_client(
        cls,
        client: httpx.AsyncClient,
        link_previews: LinkPreviewsService | None = None,
    ) -> "PachcaClient":
        self = cls.__new__(cls)
        self._client = client
        self.link_previews: LinkPreviewsService = link_previews or LinkPreviewsServiceImpl(client)
        return self

    @classmethod
    def stub(
        cls,
        link_previews: LinkPreviewsService | None = None,
    ) -> "PachcaClient":
        self = cls.__new__(cls)
        self._client = None
        self.link_previews = link_previews or LinkPreviewsService()
        return self
