from __future__ import annotations

from dataclasses import dataclass

@dataclass
class BaseEntity:
    id: int
    created_at: str


@dataclass
class Article:
    id: int
    created_at: str
    title: str
    body: str
    is_published: bool | None = None
