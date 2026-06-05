"""
Webhook polling example — continuously process new webhook deliveries.

Usage:
    PACHCA_TOKEN=... python examples/polling.py
    PACHCA_TOKEN=... python examples/polling.py --payloads
"""

import argparse
import asyncio
import os
import sys
from datetime import datetime, timezone

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "generated"))

from pachca.client import PachcaClient


async def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--payloads", action="store_true", help="poll payloads instead of full webhook events")
    args = parser.parse_args()

    token = os.environ["PACHCA_TOKEN"]
    client = PachcaClient(token)
    started_at = datetime.now(timezone.utc)

    print("Webhook polling worker started", flush=True)
    print("poll_limit=50 poll_interval=2s", flush=True)
    print(f"waiting_for_events_created_after={started_at.isoformat()}", flush=True)

    try:
        if args.payloads:
            async for payload in client.bots.poll_webhook_payloads(
                limit=50,
                interval_seconds=2,
                created_after=started_at,
                max_seen_delivery_ids=5_000,
            ):
                print(payload, flush=True)
        else:
            async for event in client.bots.poll_webhook_events(
                limit=50,
                interval_seconds=2,
                created_after=started_at,
                max_seen_delivery_ids=5_000,
            ):
                print(event, flush=True)
    finally:
        await client.close()


asyncio.run(main())
