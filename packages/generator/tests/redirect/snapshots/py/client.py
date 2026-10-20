from __future__ import annotations

import httpx

from .models import OAuthError, ApiError
from .utils import deserialize, RetryTransport


def _error_from_body(body: object) -> Exception:
    # An error body is either {"errors": [...]} or the OAuth form {"error", "error_description"},
    # which also comes with 400 and 403 (insufficient_scope, invalid_grant). The body decides the class.
    if isinstance(body, dict) and isinstance(body.get("error"), str) and "errors" not in body:
        return OAuthError(body["error"], str(body.get("error_description") or ""))
    return deserialize(ApiError, body)

class CommonService:
    async def download_export(
        self,
        id: int,
    ) -> str:
        raise NotImplementedError("Common.downloadExport is not implemented")


class CommonServiceImpl(CommonService):
    def __init__(self, client: httpx.AsyncClient) -> None:
        self._client = client

    async def download_export(
        self,
        id: int,
    ) -> str:
        response = await self._client.get(
            f"/exports/{id}",
            follow_redirects=False,
        )
        match response.status_code:
            case 302:
                location = response.headers.get("location")
                if not location:
                    raise RuntimeError(
                        "Missing Location header in redirect response"
                    )
                return location
            case 401:
                raise deserialize(OAuthError, response.json())
            case _:
                raise _error_from_body(response.json())


PACHCA_API_URL = "https://api.pachca.com/api/shared/v1"


class PachcaClient:
    def __init__(self, token: str, base_url: str = PACHCA_API_URL, common: CommonService | None = None) -> None:
        self._client = httpx.AsyncClient(
            base_url=base_url,
            headers={"Authorization": f"Bearer {token}"},
            transport=RetryTransport(httpx.AsyncHTTPTransport()),
        )
        self.common: CommonService = common or CommonServiceImpl(self._client)

    async def close(self) -> None:
        await self._client.aclose()

    @classmethod
    def from_client(
        cls,
        client: httpx.AsyncClient,
        common: CommonService | None = None,
    ) -> "PachcaClient":
        self = cls.__new__(cls)
        self._client = client
        self.common: CommonService = common or CommonServiceImpl(client)
        return self

    @classmethod
    def stub(
        cls,
        common: CommonService | None = None,
    ) -> "PachcaClient":
        self = cls.__new__(cls)
        self._client = None
        self.common = common or CommonService()
        return self
