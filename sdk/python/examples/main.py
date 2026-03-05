"""
Pachca SDK Echo Bot — 8-step example.

Usage:
    PACHCA_TOKEN=... PACHCA_CHAT_ID=... python examples/main.py
"""

import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "generated"))

from pachca.pachca_client import Pachca
from pachca.models.message_create_request_message import MessageCreateRequestMessage
from pachca.models.message_entity_type import MessageEntityType
from pachca.models.message_update_request_message import MessageUpdateRequestMessage

token = os.environ["PACHCA_TOKEN"]
chat_id = int(os.environ["PACHCA_CHAT_ID"])

client = Pachca(token)

# 1. Create message
msg = client.messages.create_message(
    MessageCreateRequestMessage(
        entity_id=chat_id,
        content="SDK test Python 🐍",
        entity_type=MessageEntityType.DISCUSSION,
    )
)
print(f"1. Created message #{msg.id}")

# 2. Get message
fetched = client.messages.get_message(msg.id)
print(f"2. Fetched message: {fetched.content}")

# 3. Add reaction
client.reactions.add_reaction(msg.id, code="👀")
print("3. Added reaction 👀")

# 4. Create thread
thread = client.threads.create_thread(msg.id)
print(f"4. Created thread #{thread.id}")

# 5. Reply in thread
reply = client.messages.create_message(
    MessageCreateRequestMessage(
        entity_id=thread.id,
        entity_type=MessageEntityType.THREAD,
        content=f"Echo: {fetched.content}",
    )
)
print(f"5. Replied in thread #{reply.id}")

# 6. Pin message
client.messages.pin_message(msg.id)
print("6. Pinned message")

# 7. Update reply
client.messages.update_message(
    reply.id,
    MessageUpdateRequestMessage(content=f"{reply.content} (processed)"),
)
print("7. Updated reply")

# 8. Unpin message
client.messages.unpin_message(msg.id)
print("8. Unpinned message")

print("\nAll 8 steps completed!")
