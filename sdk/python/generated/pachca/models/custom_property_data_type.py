from enum import Enum

class CustomPropertyDataType(str, Enum):
    DATE = "date"
    LINK = "link"
    NUMBER = "number"
    STRING = "string"

    def __str__(self) -> str:
        return str(self.value)
