from __future__ import annotations

from collections.abc import Mapping
from typing import Any, TypeVar, BinaryIO, TextIO, TYPE_CHECKING, Generator

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..types import UNSET, Unset

from dateutil.parser import isoparse
from typing import cast
import datetime

if TYPE_CHECKING:
  from ..models.user_status_away_message_type_0 import UserStatusAwayMessageType0





T = TypeVar("T", bound="UserStatus")



@_attrs_define
class UserStatus:
    """ Статус пользователя

        Attributes:
            emoji (str): Emoji символ статуса Example: 🎮.
            title (str): Текст статуса Example: Очень занят.
            expires_at (datetime.datetime | None): Срок жизни статуса (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ
                Example: 2024-04-08T10:00:00.000Z.
            is_away (bool): Режим «Нет на месте»
            away_message (None | UserStatusAwayMessageType0): Сообщение при режиме «Нет на месте». Отображается в профиле
                пользователя, а также при отправке ему личного сообщения или упоминании в чате.
     """

    emoji: str
    title: str
    expires_at: datetime.datetime | None
    is_away: bool
    away_message: None | UserStatusAwayMessageType0
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)





    def to_dict(self) -> dict[str, Any]:
        from ..models.user_status_away_message_type_0 import UserStatusAwayMessageType0
        emoji = self.emoji

        title = self.title

        expires_at: None | str
        if isinstance(self.expires_at, datetime.datetime):
            expires_at = self.expires_at.isoformat()
        else:
            expires_at = self.expires_at

        is_away = self.is_away

        away_message: dict[str, Any] | None
        if isinstance(self.away_message, UserStatusAwayMessageType0):
            away_message = self.away_message.to_dict()
        else:
            away_message = self.away_message


        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update({
            "emoji": emoji,
            "title": title,
            "expires_at": expires_at,
            "is_away": is_away,
            "away_message": away_message,
        })

        return field_dict



    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        from ..models.user_status_away_message_type_0 import UserStatusAwayMessageType0
        d = dict(src_dict)
        emoji = d.pop("emoji")

        title = d.pop("title")

        def _parse_expires_at(data: object) -> datetime.datetime | None:
            if data is None:
                return data
            try:
                if not isinstance(data, str):
                    raise TypeError()
                expires_at_type_0 = isoparse(data)



                return expires_at_type_0
            except (TypeError, ValueError, AttributeError, KeyError):
                pass
            return cast(datetime.datetime | None, data)

        expires_at = _parse_expires_at(d.pop("expires_at"))


        is_away = d.pop("is_away")

        def _parse_away_message(data: object) -> None | UserStatusAwayMessageType0:
            if data is None:
                return data
            try:
                if not isinstance(data, dict):
                    raise TypeError()
                away_message_type_0 = UserStatusAwayMessageType0.from_dict(data)



                return away_message_type_0
            except (TypeError, ValueError, AttributeError, KeyError):
                pass
            return cast(None | UserStatusAwayMessageType0, data)

        away_message = _parse_away_message(d.pop("away_message"))


        user_status = cls(
            emoji=emoji,
            title=title,
            expires_at=expires_at,
            is_away=is_away,
            away_message=away_message,
        )


        user_status.additional_properties = d
        return user_status

    @property
    def additional_keys(self) -> list[str]:
        return list(self.additional_properties.keys())

    def __getitem__(self, key: str) -> Any:
        return self.additional_properties[key]

    def __setitem__(self, key: str, value: Any) -> None:
        self.additional_properties[key] = value

    def __delitem__(self, key: str) -> None:
        del self.additional_properties[key]

    def __contains__(self, key: str) -> bool:
        return key in self.additional_properties
