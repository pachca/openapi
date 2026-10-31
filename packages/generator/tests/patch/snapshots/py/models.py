from __future__ import annotations

from collections.abc import Sequence
from dataclasses import dataclass

@dataclass
class Item:
    id: int
    name: str
    description: str | None = None
    priority: int | None = None


@dataclass
class ItemPatchRequestItem:
    name: str | None = None
    description: str | None = None
    priority: int | None = None
    # Fields to send as null: description
    null_fields: Sequence[str] = ()


@dataclass
class ItemPatchRequest:
    item: ItemPatchRequestItem


@dataclass
class ApiErrorItem:
    key: str | None = None
    value: str | None = None


@dataclass
class ApiError(Exception):
    errors: list[ApiErrorItem] | None = None
    # HTTP status code of the answer, set by the client. An empty body or one that is not JSON leaves errors empty.
    status_code: int | None = None
