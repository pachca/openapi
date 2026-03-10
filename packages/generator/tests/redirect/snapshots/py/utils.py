from __future__ import annotations

import dataclasses
from dataclasses import asdict, fields
from typing import Type, TypeVar, get_args, get_origin

import httpx

T = TypeVar("T")


def _is_dataclass_type(tp: type) -> bool:
    return isinstance(tp, type) and dataclasses.is_dataclass(tp)


def _resolve_type(tp: type) -> type | None:
    """Extract a concrete dataclass type from Optional[X] or X | None."""
    origin = get_origin(tp)
    if origin is list:
        return None  # lists are handled inline
    args = get_args(tp)
    for arg in args:
        if _is_dataclass_type(arg):
            return arg
    if _is_dataclass_type(tp):
        return tp
    return None


def _resolve_list_item_type(tp: type) -> type | None:
    """Extract the item type from list[X]."""
    origin = get_origin(tp)
    if origin is list:
        args = get_args(tp)
        if args:
            return args[0]
    return None


def deserialize(cls: Type[T], data: dict) -> T:
    """Create a dataclass instance from a dict, recursively deserializing nested dataclasses."""
    field_map = {f.name: f for f in fields(cls)}
    norm = {k.replace("-", "_").lower(): v for k, v in data.items()}
    kwargs = {}
    for k, v in norm.items():
        if k not in field_map:
            continue
        f = field_map[k]
        if isinstance(v, dict):
            nested = _resolve_type(f.type)
            if nested is not None:
                v = deserialize(nested, v)
        elif isinstance(v, list) and v:
            item_tp = _resolve_list_item_type(f.type)
            if item_tp is not None and _is_dataclass_type(item_tp):
                v = [deserialize(item_tp, i) if isinstance(i, dict) else i for i in v]
        kwargs[k] = v
    return cls(**kwargs)


def _strip_nones(val: object) -> object:
    if isinstance(val, dict):
        return {k: _strip_nones(v) for k, v in val.items() if v is not None}
    if isinstance(val, list):
        return [_strip_nones(v) for v in val]
    return val


def serialize(obj: object) -> dict:
    """Convert a dataclass to a dict, recursively omitting None values."""
    return _strip_nones(asdict(obj))


_MAX_RETRIES = 3


class RetryTransport(httpx.AsyncBaseTransport):
    """Wraps an httpx transport with retry on 429 Too Many Requests."""

    def __init__(self, transport: httpx.AsyncBaseTransport, max_retries: int = _MAX_RETRIES) -> None:
        self._transport = transport
        self._max_retries = max_retries

    async def handle_async_request(self, request: httpx.Request) -> httpx.Response:
        import asyncio
        for attempt in range(self._max_retries + 1):
            response = await self._transport.handle_async_request(request)
            if response.status_code == 429 and attempt < self._max_retries:
                retry_after = response.headers.get("retry-after")
                delay = int(retry_after) if retry_after and retry_after.isdigit() else 2 ** attempt
                await asyncio.sleep(delay)
                continue
            return response
        return response  # unreachable
