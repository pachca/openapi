from __future__ import annotations

from dataclasses import dataclass

@dataclass
class FileUploadRequest:
    content_disposition: str
    acl: str
    policy: str
    x_amz_credential: str
    x_amz_algorithm: str
    x_amz_date: str
    x_amz_signature: str
    key: str
    file: bytes


@dataclass
class UploadParams:
    content_disposition: str
    acl: str
    policy: str
    x_amz_credential: str
    x_amz_algorithm: str
    x_amz_date: str
    x_amz_signature: str
    key: str
    direct_url: str


@dataclass
class OAuthError(Exception):
    error: str | None = None
