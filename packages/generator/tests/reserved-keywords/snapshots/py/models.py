from __future__ import annotations

from dataclasses import dataclass

@dataclass
class Entity:
    class_: str
    type: str
    import_: bool
    return_: str | None = None
    val: int | None = None
