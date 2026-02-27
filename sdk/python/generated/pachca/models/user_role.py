from enum import Enum

class UserRole(str, Enum):
    ADMIN = "admin"
    GUEST = "guest"
    MULTI_GUEST = "multi_guest"
    USER = "user"

    def __str__(self) -> str:
        return str(self.value)
