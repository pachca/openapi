from __future__ import annotations

from dataclasses import dataclass
from typing import Union

@dataclass
class TextContent:
    kind: str  # literal "text"
    text: str


@dataclass
class ImageContent:
    kind: str  # literal "image"
    url: str
    caption: str | None = None


@dataclass
class VideoContent:
    kind: str  # literal "video"
    url: str
    duration: int | None = None


ContentBlock = Union[TextContent, ImageContent, VideoContent]
