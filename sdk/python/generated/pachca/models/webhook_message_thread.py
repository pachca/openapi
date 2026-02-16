from __future__ import annotations

from collections.abc import Mapping
from typing import Any, TypeVar, BinaryIO, TextIO, TYPE_CHECKING, Generator

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..types import UNSET, Unset







T = TypeVar("T", bound="WebhookMessageThread")



@_attrs_define
class WebhookMessageThread:
    """ Объект треда в вебхуке сообщения

        Attributes:
            message_id (int): Идентификатор сообщения, к которому был создан тред Example: 12345.
            message_chat_id (int): Идентификатор чата сообщения, к которому был создан тред Example: 67890.
     """

    message_id: int
    message_chat_id: int
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)





    def to_dict(self) -> dict[str, Any]:
        message_id = self.message_id

        message_chat_id = self.message_chat_id


        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update({
            "message_id": message_id,
            "message_chat_id": message_chat_id,
        })

        return field_dict



    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        d = dict(src_dict)
        message_id = d.pop("message_id")

        message_chat_id = d.pop("message_chat_id")

        webhook_message_thread = cls(
            message_id=message_id,
            message_chat_id=message_chat_id,
        )


        webhook_message_thread.additional_properties = d
        return webhook_message_thread

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
