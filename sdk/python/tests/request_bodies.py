"""Request bodies: an optional field the caller left unset stays out of the body,
a nullable one too (null switches a setting off or deletes an object), and a
field named in null_fields goes out as null. Run by open_enums.py, or on its own:

    python3 sdk/python/tests/request_bodies.py
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
    BotUpdateRequest,
    BotUpdateRequestWebhook,
    DraftUpdateRequest,
    DraftUpdateRequestDraft,
)
from pachca.utils import serialize  # noqa: E402


def main() -> None:
    body = serialize(BotUpdateRequest(webhook=BotUpdateRequestWebhook(name="Бот напоминаний")))
    assert body == {"webhook": {"name": "Бот напоминаний"}}, f"unset fields stay out: {body}"

    body = serialize(DraftUpdateRequest(draft=DraftUpdateRequestDraft(content="Отчёт за неделю")))
    assert body == {"draft": {"content": "Отчёт за неделю"}}, f"unset fields stay out: {body}"

    body = serialize(BotUpdateRequest(null_fields=["oauth_client"]))
    assert body == {"oauth_client": None}, f"oauth_client in null_fields: {body}"

    body = serialize(BotUpdateRequest(webhook=BotUpdateRequestWebhook(null_fields=["kind"])))
    assert body == {"webhook": {"kind": None}}, f"kind in null_fields: {body}"

    body = serialize(BotUpdateRequest(webhook=BotUpdateRequestWebhook(null_fields="kind")))
    assert body == {"webhook": {"kind": None}}, f"a single name as a string: {body}"

    body = serialize(
        DraftUpdateRequest(draft=DraftUpdateRequestDraft(parent_message_id=7, null_fields=["parent_message_id"]))
    )
    assert body == {"draft": {"parent_message_id": None}}, f"null_fields wins over a value: {body}"

    try:
        serialize(BotUpdateRequest(null_fields=["promo"]))
    except ValueError:
        pass
    else:
        raise AssertionError("a field the API does not take as null must be refused")
    print("request bodies ok")


if __name__ == "__main__":
    main()
