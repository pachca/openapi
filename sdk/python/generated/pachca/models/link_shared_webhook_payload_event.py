from enum import Enum

class LinkSharedWebhookPayloadEvent(str, Enum):
    LINK_SHARED = "link_shared"

    def __str__(self) -> str:
        return str(self.value)
