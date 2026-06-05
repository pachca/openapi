"""
Webhook history example — fetch recent webhook deliveries and inspect payload variants.

Usage:
    PACHCA_TOKEN=... python examples/webhook_history.py
"""

import asyncio
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "generated"))

from pachca.client import PachcaClient
from pachca.models import (
    ButtonWebhookPayload,
    ChatMemberWebhookPayload,
    CompanyMemberWebhookPayload,
    GetWebhookEventsParams,
    LinkSharedWebhookPayload,
    MessageWebhookPayload,
    ReactionWebhookPayload,
    ViewSubmitWebhookPayload,
    WebhookPayloadUnion,
)


def summarize_payload(payload: WebhookPayloadUnion) -> str:
    match payload:
        case LinkSharedWebhookPayload():
            return f"link_shared message_id={payload.message_id} links={len(payload.links)} user_id={payload.user_id}"
        case MessageWebhookPayload():
            return f"message event={payload.event} id={payload.id} chat_id={payload.chat_id}"
        case ReactionWebhookPayload():
            return f"reaction event={payload.event} message_id={payload.message_id} code={payload.code}"
        case ButtonWebhookPayload():
            return f"button message_id={payload.message_id} user_id={payload.user_id}"
        case ViewSubmitWebhookPayload():
            return f"view user_id={payload.user_id} fields={len(payload.data)}"
        case ChatMemberWebhookPayload():
            return f"chat_member event={payload.event} chat_id={payload.chat_id} users={len(payload.user_ids)}"
        case CompanyMemberWebhookPayload():
            return f"company_member event={payload.event} users={len(payload.user_ids)}"
        case _:
            return f"unknown type={type(payload).__name__}"


async def main():
    token = os.environ["PACHCA_TOKEN"]

    client = PachcaClient(token)
    response = await client.bots.get_webhook_events(GetWebhookEventsParams(limit=5))

    print(f"Fetched {len(response.data)} webhook events")
    for index, event in enumerate(response.data, start=1):
        print(
            f"{index}. id={event.id} created_at={event.created_at.isoformat()} payload={summarize_payload(event.payload)}"
        )

    print(
        f'has_next={response.meta.paginate.has_next} next_page="{response.meta.paginate.next_page}"'
    )

    await client.close()


asyncio.run(main())
