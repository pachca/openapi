from enum import Enum

class ViewBlockRadioType(str, Enum):
    RADIO = "radio"

    def __str__(self) -> str:
        return str(self.value)
