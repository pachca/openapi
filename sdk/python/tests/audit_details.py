"""Audit event details carry no discriminator: the first member that decodes wins.

A record whose keys fit a member that misses a required field decodes into the
next member that fits, and an older record (bot_token_updated before 7 October
2026, scopes as an object) decodes too. One record never breaks the page.
Run by open_enums.py, or on its own:

    python3 sdk/python/tests/audit_details.py
"""

import pathlib
import sys
import types

if "httpx" not in sys.modules:
    stub = types.ModuleType("httpx")
    stub.__getattr__ = lambda name: type(name, (), {})
    sys.modules["httpx"] = stub
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent / "generated"))

from pachca.models import (  # noqa: E402
    AuditDetailsBotTokenUpdated,
    AuditDetailsChatId,
    GetAuditEventsResponse,
)
from pachca.utils import deserialize  # noqa: E402


def event(id_: str, key: str, details: dict) -> dict:
    return {
        "id": id_,
        "created_at": "2026-10-01T10:00:00.000Z",
        "event_key": key,
        "entity_id": "7",
        "entity_type": "Bot",
        "actor_id": "12",
        "actor_type": "User",
        "details": details,
        "ip_address": None,
        "user_agent": None,
    }


OLD_BOT_TOKEN_UPDATED = {
    "actor_id": 12,
    "bot_id": 7,
    "webhook_id": 31,
    "application_id": None,
    "access_token_id": 4827,
    "access_token_preview": "cH5k...x7Qp",
    "scopes": {"previous": ["messages:read"], "new": ["messages:read", "chats:read"]},
}
BOT_TOKEN_UPDATED = {
    "token_kind": "bot",
    "token_name": None,
    "resource_owner_id": 7,
    "current_scopes": ["messages:read"],
    "bot_id": 7,
    "actor_id": None,
    "access_token_id": 4827,
    "access_token_preview": None,
    "webhook_id": 31,
}
# Fits AuditDetailsKms by keys, but reason is missing: AuditDetailsChatId takes it.
CHAT_AND_MESSAGE = {"chat_id": 5, "message_id": 1}


def main() -> None:
    page = deserialize(
        GetAuditEventsResponse,
        {
            "data": [
                event("1", "bot_token_updated", OLD_BOT_TOKEN_UPDATED),
                event("2", "bot_token_updated", BOT_TOKEN_UPDATED),
                event("3", "message_deleted", CHAT_AND_MESSAGE),
            ],
            "meta": {"paginate": {"next_page": "eyJpZCI6M30"}},
        },
    )
    assert len(page.data) == 3, f"the page keeps every record, got {len(page.data)}"
    assert page.data[0].details.scopes == OLD_BOT_TOKEN_UPDATED["scopes"], page.data[0].details
    updated = page.data[1].details
    assert isinstance(updated, AuditDetailsBotTokenUpdated), updated
    assert updated.token_name is None and updated.actor_id is None, updated
    chat = page.data[2].details
    assert isinstance(chat, AuditDetailsChatId) and chat.chat_id == 5, chat
    print("audit details ok")


if __name__ == "__main__":
    main()
