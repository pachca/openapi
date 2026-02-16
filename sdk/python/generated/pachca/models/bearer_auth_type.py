from enum import Enum

class BearerAuthType(str, Enum):
    HTTP = "http"

    def __str__(self) -> str:
        return str(self.value)
