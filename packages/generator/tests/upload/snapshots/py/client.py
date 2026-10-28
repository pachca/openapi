from __future__ import annotations

import httpx

from .models import FileUploadRequest, OAuthError, UploadParams
from .utils import deserialize, RetryTransport


def _error_body(response: httpx.Response) -> object:
    # The body of an error answer, or None when it is empty or not JSON (a 404 without a body, a proxy page).
    try:
        return response.json()
    except ValueError:
        return None


def _oauth_error_from_response(response: httpx.Response) -> Exception:
    # A 401 body that is empty or not the OAuth form gives a RuntimeError with the status code.
    body = _error_body(response)
    if isinstance(body, dict) and isinstance(body.get("error"), str):
        return OAuthError(error=body["error"])
    return RuntimeError(f"Unexpected status code: {response.status_code}")

class CommonService:
    async def upload_file(
        self,
        direct_url: str,
        request: FileUploadRequest,
    ) -> None:
        raise NotImplementedError("Common.uploadFile is not implemented")

    async def get_upload_params(
        self) -> UploadParams:
        raise NotImplementedError("Common.getUploadParams is not implemented")


class CommonServiceImpl(CommonService):
    def __init__(self, client: httpx.AsyncClient) -> None:
        self._client = client

    async def upload_file(
        self,
        direct_url: str,
        request: FileUploadRequest,
    ) -> None:
        data: dict[str, str] = {}
        data["content-disposition"] = request.content_disposition
        data["acl"] = request.acl
        data["policy"] = request.policy
        data["x-amz-credential"] = request.x_amz_credential
        data["x-amz-algorithm"] = request.x_amz_algorithm
        data["x-amz-date"] = request.x_amz_date
        data["x-amz-signature"] = request.x_amz_signature
        data["key"] = request.key
        async with httpx.AsyncClient() as _no_auth:
            response = await _no_auth.post(
                direct_url,
                data=data,
                files={"file": request.file},
            )
        match response.status_code:
            case 204:
                return
            case 401:
                raise _oauth_error_from_response(response)
            case _:
                raise RuntimeError(
                    f"Unexpected status code: {response.status_code}"
                )

    async def get_upload_params(
        self) -> UploadParams:
        response = await self._client.post(
            "/uploads",
        )
        match response.status_code:
            case 201:
                return deserialize(UploadParams, response.json()["data"])
            case 401:
                raise _oauth_error_from_response(response)
            case _:
                raise RuntimeError(
                    f"Unexpected status code: {response.status_code}"
                )


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
