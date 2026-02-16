from __future__ import annotations

from collections.abc import Mapping
from typing import Any, TypeVar, BinaryIO, TextIO, TYPE_CHECKING, Generator

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..types import UNSET, Unset

from dateutil.parser import isoparse
from typing import cast
import datetime






T = TypeVar("T", bound="Thread")



@_attrs_define
class Thread:
    """ Тред

        Attributes:
            id (int): Идентификатор созданного треда (используется для отправки [новых комментариев](POST /messages) в тред)
                Example: 265142.
            chat_id (int): Идентификатор чата треда (используется для отправки [новых комментариев](POST /messages) в тред и
                получения [списка комментариев](GET /messages)) Example: 2637266155.
            message_id (int): Идентификатор сообщения, к которому был создан тред Example: 154332686.
            message_chat_id (int): Идентификатор чата сообщения Example: 2637266154.
            updated_at (datetime.datetime): Дата и время обновления треда (ISO-8601, UTC+0) в формате YYYY-MM-
                DDThh:mm:ss.sssZ Example: 2023-02-01T19:20:47.204Z.
     """

    id: int
    chat_id: int
    message_id: int
    message_chat_id: int
    updated_at: datetime.datetime
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)





    def to_dict(self) -> dict[str, Any]:
        id = self.id

        chat_id = self.chat_id

        message_id = self.message_id

        message_chat_id = self.message_chat_id

        updated_at = self.updated_at.isoformat()


        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update({
            "id": id,
            "chat_id": chat_id,
            "message_id": message_id,
            "message_chat_id": message_chat_id,
            "updated_at": updated_at,
        })

        return field_dict



    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        d = dict(src_dict)
        id = d.pop("id")

        chat_id = d.pop("chat_id")

        message_id = d.pop("message_id")

        message_chat_id = d.pop("message_chat_id")

        updated_at = isoparse(d.pop("updated_at"))




        thread = cls(
            id=id,
            chat_id=chat_id,
            message_id=message_id,
            message_chat_id=message_chat_id,
            updated_at=updated_at,
        )


        thread.additional_properties = d
        return thread

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
