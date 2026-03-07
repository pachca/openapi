from __future__ import annotations

from dataclasses import dataclass
from typing import Union


@dataclass
class ViewBlockHeader:
    type: str  # literal "header"
    text: str


@dataclass
class ViewBlockPlainText:
    type: str  # literal "plain_text"
    text: str


@dataclass
class ViewBlockImage:
    type: str  # literal "image"
    url: str
    alt: str | None = None


ViewBlockUnion = Union[ViewBlockHeader, ViewBlockPlainText, ViewBlockImage]
