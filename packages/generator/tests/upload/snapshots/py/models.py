from __future__ import annotations

from dataclasses import dataclass

@dataclass
class FileUploadRequest:
    key: str
    file: bytes
    content_disposition: str | None = None
    acl: str | None = None
    policy: str | None = None
    x_amz_credential: str | None = None
    x_amz_algorithm: str | None = None
    x_amz_date: str | None = None
    x_amz_signature: str | None = None


@dataclass
class OAuthError(Exception):
    error: str | None = None
