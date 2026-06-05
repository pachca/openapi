from __future__ import annotations

from datetime import datetime
from dataclasses import dataclass

@dataclass
class BaseEntity:
    id: int
    created_at: datetime


@dataclass
class Article:
    id: int
    created_at: datetime
    title: str
    body: str
    is_published: bool | None = None
