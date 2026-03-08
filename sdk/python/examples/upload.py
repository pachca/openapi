"""
File upload example demonstrating the Pachca Python SDK.

Uploads a local file and sends it as a message attachment.

Usage:
    PACHCA_TOKEN=... PACHCA_CHAT_ID=... PACHCA_FILE_PATH=./photo.png python examples/upload.py
"""

import asyncio
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "generated"))

from pachca.client import PachcaClient
from pachca.models import (
    FileUploadRequest,
    MessageCreateRequest,
    MessageCreateRequestMessage,
    MessageCreateRequestFile,
)

token = os.environ["PACHCA_TOKEN"]
chat_id = int(os.environ["PACHCA_CHAT_ID"])
file_path = os.environ["PACHCA_FILE_PATH"]

filename = os.path.basename(file_path)


async def main():
    client = PachcaClient(token)

    # 1. Read file
    print(f"1. Reading file: {file_path}")
    with open(file_path, "rb") as f:
        file_bytes = f.read()
    file_size = len(file_bytes)
    print(f"   Size: {file_size} bytes")

    # 2. Get upload params
    print("2. Getting upload params...")
    params = await client.common.get_upload_params()
    key = params.key.replace("${filename}", filename)
    print(f"   Got direct_url: {params.direct_url}")

    # 3. Upload file via SDK
    print("3. Uploading file...")
    await client.common.upload_file(
        params.direct_url,
        FileUploadRequest(
            Content_Disposition=params.Content_Disposition,
            acl=params.acl,
            policy=params.policy,
            x_amz_credential=params.x_amz_credential,
            x_amz_algorithm=params.x_amz_algorithm,
            x_amz_date=params.x_amz_date,
            x_amz_signature=params.x_amz_signature,
            key=key,
            file=file_bytes,
        ),
    )
    print(f"   Uploaded, key: {key}")

    # 4. Send message with attachment
    print("4. Sending message with attachment...")
    msg = await client.messages.create_message(
        MessageCreateRequest(
            message=MessageCreateRequestMessage(
                entity_id=chat_id,
                content=f"File upload test: {filename} 🐍",
                files=[
                    MessageCreateRequestFile(
                        key=key,
                        name=filename,
                        file_type="file",
                        size=file_size,
                    )
                ],
            )
        )
    )
    print(f"   Message ID: {msg.id}")

    print("\nDone! File uploaded and sent.")


asyncio.run(main())
