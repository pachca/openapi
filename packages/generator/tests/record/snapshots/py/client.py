from __future__ import annotations

import httpx

from .models import LinkPreviewsRequest, OAuthError, ApiError
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
            case _:
                raise _error_from_response(response)


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
