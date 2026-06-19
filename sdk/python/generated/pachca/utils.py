from __future__ import annotations

import dataclasses
import keyword
from dataclasses import asdict, fields
from datetime import datetime
from typing import Callable, Type, TypeVar, get_args, get_origin, get_type_hints

import httpx

from .models import (
    ButtonWebhookPayload,
    ChatMemberWebhookPayload,
    CompanyMemberWebhookPayload,
    LinkSharedWebhookPayload,
    MessageWebhookPayload,
    ReactionWebhookPayload,
    ViewSubmitWebhookPayload,
    WebhookPayloadUnion,
)

T = TypeVar("T")


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


def _resolve_list_item_type(tp: object) -> object | None:
    """Extract the item type from list[X]."""
    origin = get_origin(tp)
    if origin is list:
        args = get_args(tp)
        if args:
            return args[0]
    return None


CustomUnionDeserializer = Callable[[dict], object]


def _deserialize_instance(tp: object, value: object) -> object:
    custom = _CUSTOM_UNION_DESERIALIZERS.get(tp)
    if custom is not None and isinstance(value, dict):
        return custom(value)
    if isinstance(value, dict):
        nested = _resolve_type(tp)
        if nested is not None:
            return _deserialize_dataclass(nested, value)
    if isinstance(value, list):
        item_tp = _resolve_list_item_type(tp)
        if item_tp is not None:
            return [_deserialize_instance(item_tp, item) for item in value]
    if isinstance(value, str):
        raw_tp = tp
        if get_origin(tp) is not None:
            for arg in get_args(tp):
                if arg is not type(None):
                    raw_tp = arg
                    break
        if raw_tp is datetime:
            return datetime.fromisoformat(value)
    return value


def _deserialize_dataclass(cls: Type[T], data: dict) -> T:
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
        kwargs[k] = _deserialize_instance(hints[f.name], v)
    return cls(**kwargs)

def _webhook_payload_union_deserialize(data: dict) -> WebhookPayloadUnion:
    match (data.get("type"), data.get("event")):
        case ("message", "link_shared"):
            return _deserialize_instance(LinkSharedWebhookPayload, data)
        case ("message", _):
            return _deserialize_instance(MessageWebhookPayload, data)
        case ("reaction", _):
            return _deserialize_instance(ReactionWebhookPayload, data)
        case ("button", _):
            return _deserialize_instance(ButtonWebhookPayload, data)
        case ("view", _):
            return _deserialize_instance(ViewSubmitWebhookPayload, data)
        case ("chat_member", _):
            return _deserialize_instance(ChatMemberWebhookPayload, data)
        case ("company_member", _):
            return _deserialize_instance(CompanyMemberWebhookPayload, data)
        case _:
            raise ValueError(f"Unknown WebhookPayloadUnion discriminator: {data.get('type')}")

_CUSTOM_UNION_DESERIALIZERS: dict[object, CustomUnionDeserializer] = {
    WebhookPayloadUnion: _webhook_payload_union_deserialize,
}


def deserialize(cls: Type[T], data: dict) -> T:
    """Create a typed instance from a dict, recursively deserializing nested values."""
    return _deserialize_instance(cls, data)


def _strip_nones(val: object) -> object:
    if isinstance(val, dict):
        return {
            (k[:-1] if k.endswith("_") and keyword.iskeyword(k[:-1]) else k): _strip_nones(v)
            for k, v in val.items() if v is not None
        }
    if isinstance(val, list):
        return [_strip_nones(v) for v in val]
    if isinstance(val, datetime):
        return val.isoformat()
    return val


def serialize(obj: object) -> dict:
    """Convert a dataclass to a dict, recursively omitting None values."""
    return _strip_nones(asdict(obj))


_MAX_RETRIES = 3
_RETRYABLE_5XX = {500, 502, 503, 504}


def _add_jitter(delay: float) -> float:
    import random
    return delay * (0.5 + random.random() * 0.5)


class RetryTransport(httpx.AsyncBaseTransport):
    """Wraps an httpx transport with retry on 429 Too Many Requests and 5xx errors."""

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
                await asyncio.sleep(_add_jitter(delay))
                continue
            if response.status_code in _RETRYABLE_5XX and attempt < self._max_retries:
                delay = attempt + 1
                await asyncio.sleep(_add_jitter(delay))
                continue
            return response
        return response  # unreachable
