from __future__ import annotations

from dataclasses import asdict, fields
from typing import Type, TypeVar

T = TypeVar("T")


def deserialize(cls: Type[T], data: dict) -> T:
    """Create a dataclass instance from a dict, ignoring unknown keys."""
    field_names = {f.name for f in fields(cls)}
    norm = {k.replace("-", "_").lower(): v for k, v in data.items()}
    return cls(**{k: v for k, v in norm.items() if k in field_names})


def _strip_nones(val: object) -> object:
    if isinstance(val, dict):
        return {k: _strip_nones(v) for k, v in val.items() if v is not None}
    if isinstance(val, list):
        return [_strip_nones(v) for v in val]
    return val


def serialize(obj: object) -> dict:
    """Convert a dataclass to a dict, recursively omitting None values."""
    return _strip_nones(asdict(obj))
