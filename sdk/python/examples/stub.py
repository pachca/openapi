"""
Stub client example — unit-testing with dependency injection.

Demonstrates PachcaClient.stub() with a custom MessagesService override.

Usage:
    python examples/stub.py
"""

import asyncio
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "generated"))

from pachca.client import PachcaClient, MessagesService
from pachca.models import Message, MessageEntityType
from datetime import datetime


class FakeMessages(MessagesService):
    async def get_message(self, id: int) -> Message:
        return Message(
            id=1,
            entity_type=MessageEntityType.DISCUSSION,
            entity_id=1,
            chat_id=1,
            root_chat_id=1,
            content="fake message",
            user_id=1,
            created_at=datetime.now(),
            url="",
            files=[],
        )


async def main():
    client = PachcaClient.stub(messages=FakeMessages())

    msg = await client.messages.get_message(1)
    print(f'Got: "{msg.content}" (id={msg.id})')


asyncio.run(main())
