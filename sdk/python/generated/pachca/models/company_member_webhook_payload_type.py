from enum import Enum

class CompanyMemberWebhookPayloadType(str, Enum):
    COMPANY_MEMBER = "company_member"

    def __str__(self) -> str:
        return str(self.value)
