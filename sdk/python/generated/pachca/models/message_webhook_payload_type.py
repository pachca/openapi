from enum import Enum

class MessageWebhookPayloadType(str, Enum):
    MESSAGE = "message"

    def __str__(self) -> str:
        return str(self.value)
