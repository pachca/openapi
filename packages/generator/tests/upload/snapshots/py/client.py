from __future__ import annotations

import httpx

from .models import FileUploadRequest, OAuthError
from .utils import from_dict

class CommonService:
    def __init__(self, client: httpx.AsyncClient) -> None:
        self._client = client

    async def upload_file(
        self,
        request: FileUploadRequest,
    ) -> None:
        data: dict[str, str] = {}
        data["key"] = request.key
        if request.content_disposition is not None:
            data["content-disposition"] = request.content_disposition
        if request.acl is not None:
            data["acl"] = request.acl
        if request.policy is not None:
            data["policy"] = request.policy
        if request.x_amz_credential is not None:
            data["x-amz-credential"] = request.x_amz_credential
        if request.x_amz_algorithm is not None:
            data["x-amz-algorithm"] = request.x_amz_algorithm
        if request.x_amz_date is not None:
            data["x-amz-date"] = request.x_amz_date
        if request.x_amz_signature is not None:
            data["x-amz-signature"] = request.x_amz_signature
        response = await self._client.post(
            f"/uploads",
            data=data,
            files={"file": request.file},
        )
        match response.status_code:
            case 201:
                return
            case 401:
                raise from_dict(OAuthError, response.json())
            case _:
                raise RuntimeError(
                    f"Unexpected status code: {response.status_code}"
                )


class PachcaClient:
    def __init__(self, base_url: str, token: str) -> None:
        self._client = httpx.AsyncClient(
            base_url=base_url,
            headers={"Authorization": f"Bearer {token}"},
        )
        self.common = CommonService(self._client)

    async def close(self) -> None:
        await self._client.aclose()
