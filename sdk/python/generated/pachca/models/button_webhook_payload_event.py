from enum import Enum

class ButtonWebhookPayloadEvent(str, Enum):
    CLICK = "click"

    def __str__(self) -> str:
        return str(self.value)
