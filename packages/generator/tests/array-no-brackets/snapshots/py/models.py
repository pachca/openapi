from __future__ import annotations

from dataclasses import dataclass

@dataclass
class MessageResult:
    id: int
    content: str


@dataclass
class PaginationMetaPaginate:
    next_page: str


@dataclass
class PaginationMeta:
    paginate: PaginationMetaPaginate


@dataclass
class OAuthError(Exception):
    error: str | None = None

    def __str__(self) -> str:
        return self.error


@dataclass
class SearchMessagesParams:
    query: str
    chat_ids: list[int]
    user_ids: list[int] | None = None
    limit: int | None = None
    cursor: str | None = None


@dataclass
class SearchMessagesResponse:
    data: list[MessageResult]
    meta: PaginationMeta
