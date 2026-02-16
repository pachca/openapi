from enum import Enum

class ChatMemberWebhookPayloadType(str, Enum):
    CHAT_MEMBER = "chat_member"

    def __str__(self) -> str:
        return str(self.value)
