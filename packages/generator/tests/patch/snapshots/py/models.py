from __future__ import annotations

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
