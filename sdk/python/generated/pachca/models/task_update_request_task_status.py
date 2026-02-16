from enum import Enum

class TaskUpdateRequestTaskStatus(str, Enum):
    DONE = "done"
    UNDONE = "undone"

    def __str__(self) -> str:
        return str(self.value)
