"""
Pachca SDK Echo Bot — 8-step example.

Usage:
    PACHCA_TOKEN=... PACHCA_CHAT_ID=... python examples/main.py
"""

import asyncio
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "generated"))

from pachca.client import PachcaClient
from pachca.models import (
    MessageCreateRequest,
    MessageCreateRequestMessage,
    MessageUpdateRequest,
    MessageUpdateRequestMessage,
    ReactionRequest,
)

token = os.environ["PACHCA_TOKEN"]
chat_id = int(os.environ["PACHCA_CHAT_ID"])


async def main():
    client = PachcaClient(token)

    # 0. Get chat (verifies datetime deserialization)
    chat = await client.chats.get_chat(chat_id)
    print(f"0. Chat: {chat.name}, created_at={chat.created_at} ({type(chat.created_at).__name__}), last_message_at={chat.last_message_at} ({type(chat.last_message_at).__name__})")

    # 1. Create message
    msg = await client.messages.create_message(
        MessageCreateRequest(
            message=MessageCreateRequestMessage(
                entity_id=chat_id,
                content="SDK test Python 🐍",
            )
        )
    )
    print(f"1. Created message #{msg.id}")

    # 2. Get message
    fetched = await client.messages.get_message(msg.id)
    print(f"2. Fetched message: {fetched.content}")

    # 3. Add reaction
    await client.reactions.add_reaction(msg.id, ReactionRequest(code="👀"))
    print("3. Added reaction 👀")

    # 4. Create thread
    thread = await client.threads.create_thread(msg.id)
    print(f"4. Created thread #{thread.id}")

    # 5. Reply in thread
    reply = await client.messages.create_message(
        MessageCreateRequest(
            message=MessageCreateRequestMessage(
                entity_id=thread.id,
                entity_type="thread",
                content=f"Echo: {fetched.content}",
            )
        )
    )
    print(f"5. Replied in thread #{reply.id}")

    # 6. Pin message
    await client.messages.pin_message(msg.id)
    print("6. Pinned message")

    # 7. Update reply
    await client.messages.update_message(
        reply.id,
        MessageUpdateRequest(
            message=MessageUpdateRequestMessage(content=f"{reply.content} (processed)")
        ),
    )
    print("7. Updated reply")

    # 8. Unpin message
    await client.messages.unpin_message(msg.id)
    print("8. Unpinned message")

    print("\nAll 8 steps completed!")


asyncio.run(main())
