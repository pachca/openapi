from enum import Enum

class ReactionWebhookPayloadType(str, Enum):
    REACTION = "reaction"

    def __str__(self) -> str:
        return str(self.value)
