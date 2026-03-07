from __future__ import annotations

from dataclasses import fields
from typing import Type, TypeVar

T = TypeVar("T")


def from_dict(cls: Type[T], data: dict) -> T:
    """Create a dataclass instance from a dict, ignoring unknown keys."""
    field_names = {f.name for f in fields(cls)}
    return cls(**{k: v for k, v in data.items() if k in field_names})
