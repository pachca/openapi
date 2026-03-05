"""
File upload example demonstrating the Pachca Python SDK.

Uploads a local file and sends it as a message attachment.

Usage:
    PACHCA_TOKEN=... PACHCA_CHAT_ID=... PACHCA_FILE_PATH=./photo.png python examples/upload.py
"""

import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "generated"))

from pachca.pachca_client import Pachca
from pachca.models.file_type import FileType
from pachca.models.message_create_request_message import MessageCreateRequestMessage
from pachca.models.message_create_request_message_files_item import (
    MessageCreateRequestMessageFilesItem,
)
from pachca.models.message_entity_type import MessageEntityType

token = os.environ["PACHCA_TOKEN"]
chat_id = int(os.environ["PACHCA_CHAT_ID"])
file_path = os.environ["PACHCA_FILE_PATH"]

filename = os.path.basename(file_path)
client = Pachca(token)

# 1. Read file
print(f"1. Reading file: {file_path}")
with open(file_path, "rb") as f:
    file_bytes = f.read()
file_size = len(file_bytes)
print(f"   Size: {file_size} bytes")

# 2. Get upload params
print("2. Getting upload params...")
params = client.common.get_upload_params()
print(f"   Got direct_url: {params.direct_url}")

# 3. Upload to S3
print("3. Uploading file...")
key = client.common.upload_file(params, file_bytes, filename)
print(f"   Uploaded, key: {key}")

# 4. Send message with attachment
print("4. Sending message with attachment...")
msg = client.messages.create_message(
    MessageCreateRequestMessage(
        entity_id=chat_id,
        entity_type=MessageEntityType.DISCUSSION,
        content=f"File upload test: {filename} 🐍",
        files=[
            MessageCreateRequestMessageFilesItem(
                key=key,
                name=filename,
                file_type=FileType.FILE,
                size=file_size,
            )
        ],
    )
)
print(f"   Message ID: {msg.id}")

print("\nDone! File uploaded and sent.")
