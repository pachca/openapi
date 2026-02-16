from enum import Enum

class UserEventType(str, Enum):
    ACTIVATE = "activate"
    CONFIRM = "confirm"
    DELETE = "delete"
    INVITE = "invite"
    SUSPEND = "suspend"
    UPDATE = "update"

    def __str__(self) -> str:
        return str(self.value)
