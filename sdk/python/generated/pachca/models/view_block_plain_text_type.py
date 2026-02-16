from enum import Enum

class ViewBlockPlainTextType(str, Enum):
    PLAIN_TEXT = "plain_text"

    def __str__(self) -> str:
        return str(self.value)
