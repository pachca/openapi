from enum import Enum

class ViewBlockDividerType(str, Enum):
    DIVIDER = "divider"

    def __str__(self) -> str:
        return str(self.value)
