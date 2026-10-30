from __future__ import annotations


try:
    from enum import StrEnum
except ImportError:  # Python 3.10
    from enum import Enum

    class StrEnum(str, Enum):  # noqa: UP042
        def __str__(self) -> str:
            return self._value_

        def __format__(self, format_spec: str) -> str:
            return self._value_.__format__(format_spec)


class OpenStrEnum(StrEnum):
    """An enum of responses: a value this SDK does not list yet becomes a member that keeps it, with is_known False."""

    @classmethod
    def _missing_(cls, value: object) -> OpenStrEnum | None:
        if not isinstance(value, str):
            return None
        member = str.__new__(cls, value)
        member._name_ = "UNKNOWN_VALUE" if "UNKNOWN" in cls.__members__ else "UNKNOWN"
        member._value_ = value
        return member

    @property
    def is_known(self) -> bool:
        """Whether this SDK version lists the value."""
        return self._value_ in type(self)._value2member_map_


class SortOrder(OpenStrEnum):
    ASC = "asc"
    DESC = "desc"


class UserRole(OpenStrEnum):
    """Роль пользователя"""

    ADMIN = "admin"  # Администратор
    USER = "user"  # Сотрудник
    MULTI_ADMIN = "multi_admin"  # Мультиадмин
    BOT = "bot"  # Бот


class ViewBlockHeaderType(OpenStrEnum):
    HEADER = "header"  # Для заголовков всегда header
