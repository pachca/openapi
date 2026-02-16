from enum import Enum

class ViewBlockTimeType(str, Enum):
    TIME = "time"

    def __str__(self) -> str:
        return str(self.value)
