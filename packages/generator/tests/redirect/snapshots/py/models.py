from __future__ import annotations

from dataclasses import dataclass


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
