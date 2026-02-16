from enum import Enum

class ReactionEventType(str, Enum):
    DELETE = "delete"
    NEW = "new"

    def __str__(self) -> str:
        return str(self.value)
