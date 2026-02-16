from enum import Enum

class UserUpdateRequestUserRole(str, Enum):
    ADMIN = "admin"
    MULTI_GUEST = "multi_guest"
    USER = "user"

    def __str__(self) -> str:
        return str(self.value)
