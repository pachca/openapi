from enum import Enum

class WebhookEventType(str, Enum):
    DELETE = "delete"
    NEW = "new"
    UPDATE = "update"

    def __str__(self) -> str:
        return str(self.value)
