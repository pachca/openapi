from enum import Enum

class ChatMemberRoleFilter(str, Enum):
    ADMIN = "admin"
    ALL = "all"
    EDITOR = "editor"
    MEMBER = "member"
    OWNER = "owner"

    def __str__(self) -> str:
        return str(self.value)
