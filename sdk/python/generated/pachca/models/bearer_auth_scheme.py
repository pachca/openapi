from enum import Enum

class BearerAuthScheme(str, Enum):
    BASIC = "Basic"

    def __str__(self) -> str:
        return str(self.value)
