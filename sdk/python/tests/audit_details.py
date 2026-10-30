"""Audit event details carry no discriminator: the first member that decodes wins.

A record whose keys fit a member that misses a required field, or whose values
do not fit the member's types (scopes as an object where the member takes a
list), decodes into the next member that fits. One record never breaks the page.
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
    AuditDetailsBot,
    AuditDetailsBotTokenUpdated,
    AuditDetailsChatId,
    AuditDetailsToken,
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
# A token record: scopes is a list.
ACCESS_TOKEN_CREATED = {
    "token_kind": "user",
    "token_name": "Отчёты",
    "resource_owner_id": 12,
    "scopes": ["messages:read"],
    "access_token_id": 4828,
    "access_token_preview": "dG9r...a2Vu",
    "actor_id": 12,
}
# A change of the bot token scopes: scopes is an object beside current_scopes.
BOT_TOKEN_SCOPES_UPDATED = {
    "token_kind": "bot",
    "token_name": None,
    "resource_owner_id": 7,
    "current_scopes": ["messages:read", "chats:read"],
    "scopes": {"previous": ["messages:read"], "new": ["messages:read", "chats:read"]},
    "bot_id": 7,
    "actor_id": 12,
    "access_token_id": 4827,
    "access_token_preview": None,
    "webhook_id": 31,
}


def main() -> None:
    page = deserialize(
        GetAuditEventsResponse,
        {
            "data": [
                event("1", "bot_token_updated", OLD_BOT_TOKEN_UPDATED),
                event("2", "bot_token_updated", BOT_TOKEN_UPDATED),
                event("3", "message_deleted", CHAT_AND_MESSAGE),
                event("4", "access_token_created", ACCESS_TOKEN_CREATED),
                event("5", "bot_token_updated", BOT_TOKEN_SCOPES_UPDATED),
            ],
            "meta": {"paginate": {"next_page": "eyJpZCI6M30"}},
        },
    )
    assert len(page.data) == 5, f"the page keeps every record, got {len(page.data)}"
    old = page.data[0].details
    assert not isinstance(old, AuditDetailsBot), f"AuditDetailsBot takes scopes as a list: it must give way, got {old}"
    updated = page.data[1].details
    assert isinstance(updated, AuditDetailsBotTokenUpdated), updated
    assert updated.token_name is None and updated.actor_id is None, updated
    chat = page.data[2].details
    assert isinstance(chat, AuditDetailsChatId) and chat.chat_id == 5, chat
    token = page.data[3].details
    assert isinstance(token, AuditDetailsToken) and token.scopes == ["messages:read"], token
    scopes_updated = page.data[4].details
    assert isinstance(scopes_updated, AuditDetailsBotTokenUpdated), scopes_updated
    assert scopes_updated.current_scopes == ["messages:read", "chats:read"], scopes_updated
    print("audit details ok")


if __name__ == "__main__":
    main()
