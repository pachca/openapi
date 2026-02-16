from enum import Enum

class OpenViewRequestType(str, Enum):
    MODAL = "modal"

    def __str__(self) -> str:
        return str(self.value)
