from enum import Enum

class ChatSubtype(str, Enum):
    DISCUSSION = "discussion"
    THREAD = "thread"

    def __str__(self) -> str:
        return str(self.value)
