"""
HTTP client example — using a pre-configured httpx.AsyncClient with optional proxy.

Demonstrates PachcaClient.from_client() with custom httpx client.

Usage:
    PACHCA_TOKEN=your_token PACHCA_CHAT_ID=12345 python examples/httpclient.py
    HTTP_PROXY=http://proxy:8080 PACHCA_TOKEN=... PACHCA_CHAT_ID=... python examples/httpclient.py
"""

import asyncio
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "generated"))

import httpx
from pachca.client import PachcaClient, PACHCA_API_URL


async def main():
    token = os.environ["PACHCA_TOKEN"]
    chat_id = int(os.environ["PACHCA_CHAT_ID"])

    http = httpx.AsyncClient(
        base_url=PACHCA_API_URL,
        headers={"Authorization": f"Bearer {token}"},
        proxy=os.environ.get("HTTP_PROXY"),
    )
    client = PachcaClient.from_client(http)

    chat = await client.chats.get_chat(chat_id)
    print(f"Chat: {chat.name} (id={chat.id})")

    await client.close()


asyncio.run(main())
