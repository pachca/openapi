from enum import Enum

class TaskKind(str, Enum):
    CALL = "call"
    EMAIL = "email"
    EVENT = "event"
    MEETING = "meeting"
    REMINDER = "reminder"

    def __str__(self) -> str:
        return str(self.value)
