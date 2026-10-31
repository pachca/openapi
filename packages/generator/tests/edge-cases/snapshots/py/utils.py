from __future__ import annotations

import dataclasses
import json
import keyword
import types
from dataclasses import fields
from datetime import datetime
from enum import Enum
from typing import Any, Callable, Type, TypeVar, Union, get_args, get_origin, get_type_hints

import httpx

from .models import (
    MessageNotification,
    NotificationUnion,
    ReactionNotification,
)

T = TypeVar("T")


def parse_datetime(value: str) -> datetime:
    """Parse an ISO 8601 time. Before Python 3.11 `fromisoformat` does not accept the `Z` suffix."""
    return datetime.fromisoformat(value[:-1] + "+00:00" if value.endswith("Z") else value)


def _is_dataclass_type(tp: object) -> bool:
    return isinstance(tp, type) and dataclasses.is_dataclass(tp)


def _resolve_type(tp: object) -> type | None:
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


def _union_members(tp: object) -> list[type]:
    """Dataclass members of a Union, ignoring None and non-dataclass arms."""
    if get_origin(tp) is list:
        return []
    return [arg for arg in get_args(tp) if _is_dataclass_type(arg)]


def _declared_keys(member: type) -> set[str]:
    return {f.name[:-1] if f.name.endswith("_") else f.name for f in fields(member)}


def _rank_union_members(members: list[type], data: dict) -> list[type]:
    """Order the members of a union with no discriminator by how well they fit a payload.

    Ranks by: most payload keys recognised, then fewest unrecognised, then
    fewest declared fields (so an empty member only wins an empty payload).
    A tie keeps the declared order.
    """
    keys = {k.replace("-", "_").lower() for k in data}

    def score(member: type) -> tuple[int, int, int]:
        declared = _declared_keys(member)
        return (-len(keys & declared), len(keys - declared), len(declared))

    return sorted(members, key=score)


def _fits(tp: object, value: object) -> bool:
    """Whether a JSON value has the shape a field type takes.

    A list fits a list, an object fits a model or a dict, a string fits a string,
    an enum or a time, a number fits a number and a boolean a boolean. None fits
    any field. A union member whose field does not fit gives way to the next one.
    """
    if value is None or tp is Any:
        return True
    origin = get_origin(tp)
    if origin is Union or origin is types.UnionType:
        return any(_fits(arg, value) for arg in get_args(tp) if arg is not type(None))
    if origin is list:
        args = get_args(tp)
        return isinstance(value, list) and (not args or all(_fits(args[0], item) for item in value))
    if origin is dict:
        return isinstance(value, dict)
    if not isinstance(tp, type):
        return True
    if _is_dataclass_type(tp) or tp is dict:
        return isinstance(value, dict)
    if tp is list:
        return isinstance(value, list)
    if tp is bool:
        return isinstance(value, bool)
    if issubclass(tp, (str, Enum)) or tp is datetime:
        return isinstance(value, str)
    if tp is int:
        return isinstance(value, int) and not isinstance(value, bool)
    if tp is float:
        return isinstance(value, (int, float)) and not isinstance(value, bool)
    return True


def _resolve_list_item_type(tp: object) -> object | None:
    """Extract the item type from list[X] or list[X] | None."""
    origin = get_origin(tp)
    if origin is list:
        args = get_args(tp)
        return args[0] if args else None
    if origin is Union or origin is types.UnionType:
        for arg in get_args(tp):
            if get_origin(arg) is list and get_args(arg):
                return get_args(arg)[0]
    return None


CustomUnionDeserializer = Callable[[dict], object]


def _deserialize_instance(tp: object, value: object, strict: bool = False) -> object:
    """Decode a JSON value into a field type. With strict, a nested model or a list
    of models checks its value types too, so a union member gives way to the next
    one when a value deep inside it has another type."""
    custom = _CUSTOM_UNION_DESERIALIZERS.get(tp)
    if custom is not None and isinstance(value, dict):
        return custom(value)
    if isinstance(value, dict):
        members = _union_members(tp)
        if len(members) > 1:
            # Multi-member union: pick by discriminator when the spec has one,
            # otherwise by which member best matches the payload shape. Taking
            # the first member (the old behaviour) silently dropped the data.
            disc = _UNION_DISCRIMINATORS.get(tp)
            if disc is not None:
                field_name, by_value = disc
                chosen = by_value.get(value.get(field_name))
                if chosen is not None:
                    return _deserialize_dataclass(chosen, value, strict)
            # The first member that decodes wins: one that fits the keys best but
            # misses a required field, or holds a value of another type (a list
            # where it takes an object), gives way to the next.
            errors: list[Exception] = []
            for member in _rank_union_members(members, value):
                try:
                    return _deserialize_dataclass(member, value, strict=True)
                except (TypeError, ValueError) as error:
                    errors.append(error)
            raise errors[0]
        nested = _resolve_type(tp)
        if nested is not None:
            return _deserialize_dataclass(nested, value, strict)
    if isinstance(value, list):
        item_tp = _resolve_list_item_type(tp)
        if item_tp is not None:
            return [_deserialize_instance(item_tp, item, strict) for item in value]
    if isinstance(value, str):
        raw_tp = tp
        if get_origin(tp) is not None:
            for arg in get_args(tp):
                if arg is not type(None):
                    raw_tp = arg
                    break
        if raw_tp is datetime:
            return parse_datetime(value)
        if isinstance(raw_tp, type) and issubclass(raw_tp, Enum):
            # An open enum keeps a value it does not list in a member with is_known False;
            # a closed one refuses it, and the raw string is kept as is.
            try:
                return raw_tp(value)
            except ValueError:
                return value
    return value


def _deserialize_dataclass(cls: Type[T], data: dict, strict: bool = False) -> T:
    """Build a dataclass from a dict. With strict, a value whose type does not
    fit its field raises TypeError, here or in a nested model, so a union tries
    its next member."""
    field_map = {f.name: f for f in fields(cls)}
    hints = get_type_hints(cls)
    norm = {k.replace("-", "_").lower(): v for k, v in data.items()}
    kwargs = {}
    for k, v in norm.items():
        if k not in field_map:
            k = f"{k}_"
            if k not in field_map:
                continue
        f = field_map[k]
        if strict and not _fits(hints[f.name], v):
            raise TypeError(f"{cls.__name__}.{f.name} does not take {type(v).__name__}")
        kwargs[k] = _deserialize_instance(hints[f.name], v, strict)
    return cls(**kwargs)

_CUSTOM_UNION_DESERIALIZERS: dict[object, CustomUnionDeserializer] = {
}

# Unions the spec discriminates by a literal field: {union: (field, {value: member})}.
# Unions absent here have no discriminator and are matched by payload shape.
_UNION_DISCRIMINATORS: dict[object, tuple[str, dict[str, type]]] = {
    NotificationUnion: ("kind", {"message": MessageNotification, "message": ReactionNotification}),
}


def deserialize(cls: Type[T], data: dict) -> T:
    """Create a typed instance from a dict, recursively deserializing nested values."""
    return _deserialize_instance(cls, data)


# Fields of a request model the caller can send as null, by name in null_fields.
_NULLABLE_FIELDS: dict[type, frozenset[str]] = {
}


def _json_key(name: str) -> str:
    return name[:-1] if name.endswith("_") and keyword.iskeyword(name[:-1]) else name


def _to_json(val: object) -> object:
    if dataclasses.is_dataclass(val) and not isinstance(val, type):
        nullable = _NULLABLE_FIELDS.get(type(val))
        null_fields: frozenset[str] = frozenset()
        if nullable is not None:
            names = getattr(val, "null_fields", ())
            # A single name passed as a string is one field, not its letters.
            null_fields = frozenset((names,) if isinstance(names, str) else names)
            unknown = sorted(null_fields - nullable)
            if unknown:
                raise ValueError(f"{type(val).__name__}: field {unknown[0]!r} cannot be sent as null")
        out: dict[str, object] = {}
        for f in fields(val):
            if nullable is not None and f.name == "null_fields":
                continue
            if f.name in null_fields:
                out[_json_key(f.name)] = None
                continue
            v = getattr(val, f.name)
            if v is not None:
                out[_json_key(f.name)] = _to_json(v)
        return out
    if isinstance(val, dict):
        return {_json_key(k): _to_json(v) for k, v in val.items() if v is not None}
    if isinstance(val, (list, tuple)):
        return [_to_json(v) for v in val]
    if isinstance(val, datetime):
        return val.isoformat()
    return val


def serialize(obj: object) -> dict:
    """Convert a dataclass to a dict for the request body.

    A field that is None stays out of the body. A field named in null_fields
    goes out as null, whatever value it holds, and a name the model does not
    take as null raises ValueError before the request is sent.
    """
    result = _to_json(obj)
    if not isinstance(result, dict):
        raise TypeError(f"serialize takes a dataclass, got {type(obj).__name__}")
    return result


_MAX_RETRIES = 3
_RETRYABLE_5XX = {500, 502, 503, 504}
# A 5xx says nothing about whether the server already applied the request.
# These methods are safe to repeat. A retried POST or PATCH could apply
# twice: POST /messages would send the message again, and the API has no
# idempotency key. 429 is safe for any method: the request was rejected
# before it was processed.
_IDEMPOTENT_METHODS = {"GET", "HEAD", "OPTIONS", "PUT", "DELETE"}
# Only the daily chat limit and the hour-long ban wait longer than a minute.
_MAX_RETRY_AFTER = 60


# Retry-After is a minimum, not an estimate: waiting less lands the retry
# inside a window that is still closed. Jitter only upwards.
def _add_jitter(delay: float) -> float:
    import random
    return delay * (1 + random.random() * 0.25)


async def _is_query_timeout(response: httpx.Response) -> bool:
    """A 504 with the code timeout is a search the server stopped because the
    query is too heavy: the same query would time out again, so it goes back to
    the caller at once. A 504 from a proxy has no such code and is retried. The
    body stays on the response, so the caller can still read it."""
    if response.status_code != 504:
        return False
    try:
        body = json.loads(await response.aread())
    except ValueError:
        return False
    errors = body.get("errors") if isinstance(body, dict) else None
    return isinstance(errors, list) and any(
        isinstance(error, dict) and error.get("code") == "timeout" for error in errors
    )


class RetryTransport(httpx.AsyncBaseTransport):
    """Wraps an httpx transport with retry on 429, and on 5xx for idempotent methods."""

    def __init__(self, transport: httpx.AsyncBaseTransport, max_retries: int = _MAX_RETRIES) -> None:
        self._transport = transport
        self._max_retries = max_retries

    async def handle_async_request(self, request: httpx.Request) -> httpx.Response:
        import asyncio
        for attempt in range(self._max_retries + 1):
            response = await self._transport.handle_async_request(request)
            if response.status_code == 429 and attempt < self._max_retries:
                retry_after = response.headers.get("retry-after")
                seconds = int(retry_after) if retry_after and retry_after.isdigit() else None
                # A long pause is the daily chat limit or an hour-long ban. Retrying
                # it is pointless, and an early retry doubles the pause: hand the
                # response back so the caller can schedule the work itself.
                if seconds is not None and seconds > _MAX_RETRY_AFTER:
                    return response
                delay = seconds if seconds is not None else 2 ** attempt
                await asyncio.sleep(_add_jitter(delay))
                continue
            if (
                response.status_code in _RETRYABLE_5XX
                and request.method in _IDEMPOTENT_METHODS
                and attempt < self._max_retries
                and not await _is_query_timeout(response)
            ):
                delay = attempt + 1
                await asyncio.sleep(_add_jitter(delay))
                continue
            return response
        return response  # unreachable
