from __future__ import annotations

import httpx

from .models import FileUploadRequest, OAuthError, UploadParams
from .utils import deserialize

class CommonService:
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
            case 201:
                return
            case 401:
                raise deserialize(OAuthError, response.json())
            case _:
                raise RuntimeError(
                    f"Unexpected status code: {response.status_code}"
                )

    async def get_upload_params(
        self) -> UploadParams:
        response = await self._client.post(
            "/uploads",
        )
        body = response.json()
        match response.status_code:
            case 201:
                return deserialize(UploadParams, body["data"])
            case 401:
                raise deserialize(OAuthError, body)
            case _:
                raise RuntimeError(
                    f"Unexpected status code: {response.status_code}"
                )


class PachcaClient:
    def __init__(self, token: str, base_url: str = "https://api.pachca.com/api/shared/v1") -> None:
        self._client = httpx.AsyncClient(
            base_url=base_url,
            headers={"Authorization": f"Bearer {token}"},
        )
        self.common = CommonService(self._client)

    async def close(self) -> None:
        await self._client.aclose()
