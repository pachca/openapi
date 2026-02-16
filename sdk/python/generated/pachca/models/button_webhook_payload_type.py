from enum import Enum

class ButtonWebhookPayloadType(str, Enum):
    BUTTON = "button"

    def __str__(self) -> str:
        return str(self.value)
