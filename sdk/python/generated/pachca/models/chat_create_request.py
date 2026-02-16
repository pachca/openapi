from __future__ import annotations

from collections.abc import Mapping
from typing import Any, TypeVar, BinaryIO, TextIO, TYPE_CHECKING, Generator

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..types import UNSET, Unset

from typing import cast

if TYPE_CHECKING:
  from ..models.chat_create_request_chat import ChatCreateRequestChat





T = TypeVar("T", bound="ChatCreateRequest")



@_attrs_define
class ChatCreateRequest:
    """ Запрос на создание чата

        Attributes:
            chat (ChatCreateRequestChat): Собранный объект параметров создаваемого чата
     """

    chat: ChatCreateRequestChat
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)





    def to_dict(self) -> dict[str, Any]:
        from ..models.chat_create_request_chat import ChatCreateRequestChat
        chat = self.chat.to_dict()


        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update({
            "chat": chat,
        })

        return field_dict



    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        from ..models.chat_create_request_chat import ChatCreateRequestChat
        d = dict(src_dict)
        chat = ChatCreateRequestChat.from_dict(d.pop("chat"))




        chat_create_request = cls(
            chat=chat,
        )


        chat_create_request.additional_properties = d
        return chat_create_request

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
