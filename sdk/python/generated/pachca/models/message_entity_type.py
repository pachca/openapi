from enum import Enum

class MessageEntityType(str, Enum):
    DISCUSSION = "discussion"
    THREAD = "thread"
    USER = "user"

    def __str__(self) -> str:
        return str(self.value)
