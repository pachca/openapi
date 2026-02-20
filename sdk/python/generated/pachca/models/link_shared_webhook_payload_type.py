from enum import Enum

class LinkSharedWebhookPayloadType(str, Enum):
    MESSAGE = "message"

    def __str__(self) -> str:
        return str(self.value)
