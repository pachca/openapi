from __future__ import annotations

from dataclasses import dataclass
from typing import Any

@dataclass
class Metadata:
    pass


@dataclass
class Event:
    id: int
    type: str
    metadata: dict[str, Any] | None = None
