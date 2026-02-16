from enum import Enum

class SearchEntityType(str, Enum):
    TASK = "Task"
    USER = "User"

    def __str__(self) -> str:
        return str(self.value)
