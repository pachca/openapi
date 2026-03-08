from __future__ import annotations

from dataclasses import asdict, fields
from typing import Type, TypeVar

T = TypeVar("T")


def deserialize(cls: Type[T], data: dict) -> T:
    """Create a dataclass instance from a dict, ignoring unknown keys."""
    field_names = {f.name for f in fields(cls)}
    norm = {k.replace("-", "_").lower(): v for k, v in data.items()}
    return cls(**{k: v for k, v in norm.items() if k in field_names})


def serialize(obj: object) -> dict:
    """Convert a dataclass to a dict, omitting None values."""
    return {k: v for k, v in asdict(obj).items() if v is not None}
