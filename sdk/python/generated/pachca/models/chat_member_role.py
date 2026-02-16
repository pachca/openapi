from enum import Enum

class ChatMemberRole(str, Enum):
    ADMIN = "admin"
    EDITOR = "editor"
    MEMBER = "member"

    def __str__(self) -> str:
        return str(self.value)
