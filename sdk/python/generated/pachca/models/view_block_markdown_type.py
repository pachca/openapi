from enum import Enum

class ViewBlockMarkdownType(str, Enum):
    MARKDOWN = "markdown"

    def __str__(self) -> str:
        return str(self.value)
