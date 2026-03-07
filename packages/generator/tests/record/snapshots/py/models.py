from __future__ import annotations

from dataclasses import dataclass

@dataclass
class LinkPreview:
    title: str
    description: str | None = None
    image_url: str | None = None


@dataclass
class LinkPreviewsRequest:
    link_previews: dict[str, LinkPreview]


@dataclass
class ApiErrorItem:
    key: str | None = None
    value: str | None = None


@dataclass
class ApiError(Exception):
    errors: list[ApiErrorItem] | None = None


@dataclass
class OAuthError(Exception):
    error: str | None = None
