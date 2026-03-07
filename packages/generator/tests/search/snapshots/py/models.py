from __future__ import annotations

from dataclasses import dataclass
from enum import StrEnum


class SearchSort(StrEnum):
    """Сортировка"""

    RELEVANCE = "relevance"  # По релевантности
    DATE = "date"  # По дате


@dataclass
class MessageSearchResult:
    id: int
    chat_id: int
    user_id: int
    content: str
    created_at: str


@dataclass
class SearchPaginationPaginate:
    next_page: str


@dataclass
class SearchPaginationMeta:
    total: int
    paginate: SearchPaginationPaginate


@dataclass
class OAuthError(Exception):
    error: str | None = None


@dataclass
class SearchMessagesParams:
    query: str
    chat_ids: list[int] | None = None
    user_ids: list[int] | None = None
    created_from: str | None = None
    created_to: str | None = None
    sort: SearchSort | None = None
    limit: int | None = None
    cursor: str | None = None


@dataclass
class SearchMessagesResponse:
    data: list[MessageSearchResult]
    meta: SearchPaginationMeta
