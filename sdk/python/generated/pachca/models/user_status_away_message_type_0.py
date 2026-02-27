from __future__ import annotations

from collections.abc import Mapping
from typing import Any, TypeVar, BinaryIO, TextIO, TYPE_CHECKING, Generator

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..types import UNSET, Unset







T = TypeVar("T", bound="UserStatusAwayMessageType0")



@_attrs_define
class UserStatusAwayMessageType0:
    """ Сообщение при режиме «Нет на месте». Отображается в профиле пользователя, а также при отправке ему личного сообщения
    или упоминании в чате.

        Attributes:
            text (str): Текст сообщения Example: Я в отпуске до 15 апреля. По срочным вопросам обращайтесь к @ivanov..
     """

    text: str
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)





    def to_dict(self) -> dict[str, Any]:
        text = self.text


        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update({
            "text": text,
        })

        return field_dict



    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        d = dict(src_dict)
        text = d.pop("text")

        user_status_away_message_type_0 = cls(
            text=text,
        )


        user_status_away_message_type_0.additional_properties = d
        return user_status_away_message_type_0

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
