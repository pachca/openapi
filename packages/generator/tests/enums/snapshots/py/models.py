from __future__ import annotations

from enum import StrEnum

class SortOrder(StrEnum):
    ASC = "asc"
    DESC = "desc"


class UserRole(StrEnum):
    """Роль пользователя"""

    ADMIN = "admin"  # Администратор
    USER = "user"  # Сотрудник
    MULTI_ADMIN = "multi_admin"  # Мультиадмин
    BOT = "bot"  # Бот


class ViewBlockHeaderType(StrEnum):
    HEADER = "header"  # Для заголовков всегда header
