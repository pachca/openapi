from __future__ import annotations

from dataclasses import dataclass

try:
    from enum import StrEnum
except ImportError:  # Python 3.10
    from enum import Enum

    class StrEnum(str, Enum):  # noqa: UP042
        def __str__(self) -> str:
            return self._value_

        def __format__(self, format_spec: str) -> str:
            return self._value_.__format__(format_spec)


class OpenStrEnum(StrEnum):
    """An enum of responses: a value this SDK does not list yet becomes a member that keeps it, with is_known False."""

    @classmethod
    def _missing_(cls, value: object) -> OpenStrEnum | None:
        if not isinstance(value, str):
            return None
        member = str.__new__(cls, value)
        member._name_ = "UNKNOWN_VALUE" if "UNKNOWN" in cls.__members__ else "UNKNOWN"
        member._value_ = value
        return member

    @property
    def is_known(self) -> bool:
        """Whether this SDK version lists the value."""
        return self._value_ in type(self)._value2member_map_


class SortOrder(StrEnum):
    ASC = "asc"
    DESC = "desc"


class MemberKind(StrEnum):
    REGULAR = "regular"
    GUEST = "guest"
    VALUE = "value"


class MemberRole(OpenStrEnum):
    """Member role"""

    ADMIN = "admin"  # Administrator
    USER = "user"  # Member


class Region(OpenStrEnum):
    EU = "eu"
    US = "us"


class MemberStatus(OpenStrEnum):
    ACTIVE = "active"
    SUSPENDED = "suspended"
    UNKNOWN = "unknown"


class ErrorCode(OpenStrEnum):
    BLANK = "blank"
    TAKEN = "taken"


class OAuthErrorCode(OpenStrEnum):
    """OAuth error code"""

    INVALID_TOKEN = "invalid_token"  # The token is missing or revoked
    INSUFFICIENT_SCOPE = "insufficient_scope"  # The token lacks the scope


class PayloadKind(OpenStrEnum):
    CREATED = "created"
    VALUE = "value"


@dataclass
class Member:
    id: int
    role: MemberRole
    status: MemberStatus
    previous_statuses: list[MemberStatus] | None = None


@dataclass
class MemberUpdateRequest:
    role: MemberRole | None = None
    kind: MemberKind | None = None


@dataclass
class MemberEventPayload:
    kind: PayloadKind


@dataclass
class ApiErrorItem:
    key: str
    message: str
    code: ErrorCode


@dataclass
class ApiError(Exception):
    errors: list[ApiErrorItem]
    # HTTP status code of the answer, set by the client. An empty body or one that is not JSON leaves errors empty.
    status_code: int | None = None


@dataclass
class OAuthError(Exception):
    error: OAuthErrorCode
    error_description: str

    def __str__(self) -> str:
        return str(self.error)


@dataclass
class ListMembersParams:
    sort: SortOrder | None = None
    role: MemberRole | None = None
    roles: list[MemberRole] | None = None
    region: Region | None = None


@dataclass
class ListMembersResponse:
    data: list[Member]
