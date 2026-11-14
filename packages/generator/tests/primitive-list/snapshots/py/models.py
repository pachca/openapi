from __future__ import annotations

from dataclasses import dataclass

@dataclass
class PaginationMetaPaginate:
    next_page: str


@dataclass
class PaginationMeta:
    paginate: PaginationMetaPaginate


@dataclass
class ApiErrorItem:
    message: str
    key: str | None = None


@dataclass
class ApiError(Exception):
    errors: list[ApiErrorItem]
    # HTTP status code of the answer, set by the client. An empty body or one that is not JSON leaves errors empty.
    status_code: int | None = None


@dataclass
class OAuthError(Exception):
    error: str | None = None

    def __str__(self) -> str:
        return self.error


@dataclass
class ListReadMembersParams:
    limit: int | None = None
    cursor: str | None = None


@dataclass
class ListReadMembersResponse:
    data: list[int]
    meta: PaginationMeta
