from enum import Enum

class InviteStatus(str, Enum):
    CONFIRMED = "confirmed"
    SENT = "sent"

    def __str__(self) -> str:
        return str(self.value)
