from __future__ import annotations

from dataclasses import dataclass
from typing import Union

try:
    from enum import StrEnum
except ImportError:  # Python 3.10
    from enum import Enum

    class StrEnum(str, Enum):  # noqa: UP042
        def __str__(self) -> str:
            return self._value_

        def __format__(self, format_spec: str) -> str:
            return self._value_.__format__(format_spec)


class FileType(StrEnum):
    FILE = "file"
    IMAGE = "image"
    VOICE = "voice"


@dataclass
class MessageFile:
    key: str
    name: str
    file_type: FileType
    width: int | None = None
    height: int | None = None
    duration_ms: int | None = None
    waveform: str | None = None


@dataclass
class UrlButton:
    text: str
    url: str


@dataclass
class DataButton:
    text: str
    data: str


@dataclass
class MessageCreateRequestMessage:
    entity_id: int
    content: str | None = None
    files: list[MessageFile] | None = None
    buttons: list[list[Button]] | None = None
    display_name: str | None = None


@dataclass
class MessageCreateRequest:
    message: MessageCreateRequestMessage
    link_preview: bool | None = False


@dataclass
class MessageUpdateRequestMessage:
    content: str | None = None
    files: list[MessageFile] | None = None


@dataclass
class MessageUpdateRequest:
    message: MessageUpdateRequestMessage


@dataclass
class Message:
    id: int
    content: str


@dataclass
class ApiErrorItem:
    key: str | None = None
    value: str | None = None


@dataclass
class ApiError(Exception):
    errors: list[ApiErrorItem] | None = None
    # HTTP status code of the answer, set by the client. An empty body or one that is not JSON leaves errors empty.
    status_code: int | None = None


@dataclass
class OAuthError(Exception):
    error: str | None = None

    def __str__(self) -> str:
        return self.error


Button = Union[UrlButton, DataButton]
