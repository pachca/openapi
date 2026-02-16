from enum import Enum

class ViewBlockCheckboxType(str, Enum):
    CHECKBOX = "checkbox"

    def __str__(self) -> str:
        return str(self.value)
