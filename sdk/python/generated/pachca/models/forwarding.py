from __future__ import annotations

from collections.abc import Mapping
from typing import Any, TypeVar, BinaryIO, TextIO, TYPE_CHECKING, Generator

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..types import UNSET, Unset

from dateutil.parser import isoparse
from typing import cast
import datetime






T = TypeVar("T", bound="Forwarding")



@_attrs_define
class Forwarding:
    """ Информация о пересланном сообщении

        Attributes:
            original_message_id (int): Идентификатор оригинального сообщения Example: 194275.
            original_chat_id (int): Идентификатор чата, в котором находится оригинальное сообщение Example: 334.
            author_id (int): Идентификатор пользователя, создавшего оригинальное сообщение Example: 12.
            original_created_at (datetime.datetime): Дата и время создания оригинального сообщения (ISO-8601, UTC+0) в
                формате YYYY-MM-DDThh:mm:ss.sssZ Example: 2025-01-15T10:30:00.000Z.
            original_thread_id (int | None): Идентификатор треда, в котором находится оригинальное сообщение
            original_thread_message_id (int | None): Идентификатор сообщения, к которому был создан тред, в котором
                находится оригинальное сообщение
            original_thread_parent_chat_id (int | None): Идентификатор чата сообщения, к которому был создан тред, в котором
                находится оригинальное сообщение
     """

    original_message_id: int
    original_chat_id: int
    author_id: int
    original_created_at: datetime.datetime
    original_thread_id: int | None
    original_thread_message_id: int | None
    original_thread_parent_chat_id: int | None
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)





    def to_dict(self) -> dict[str, Any]:
        original_message_id = self.original_message_id

        original_chat_id = self.original_chat_id

        author_id = self.author_id

        original_created_at = self.original_created_at.isoformat()

        original_thread_id: int | None
        original_thread_id = self.original_thread_id

        original_thread_message_id: int | None
        original_thread_message_id = self.original_thread_message_id

        original_thread_parent_chat_id: int | None
        original_thread_parent_chat_id = self.original_thread_parent_chat_id


        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update({
            "original_message_id": original_message_id,
            "original_chat_id": original_chat_id,
            "author_id": author_id,
            "original_created_at": original_created_at,
            "original_thread_id": original_thread_id,
            "original_thread_message_id": original_thread_message_id,
            "original_thread_parent_chat_id": original_thread_parent_chat_id,
        })

        return field_dict



    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        d = dict(src_dict)
        original_message_id = d.pop("original_message_id")

        original_chat_id = d.pop("original_chat_id")

        author_id = d.pop("author_id")

        original_created_at = isoparse(d.pop("original_created_at"))




        def _parse_original_thread_id(data: object) -> int | None:
            if data is None:
                return data
            return cast(int | None, data)

        original_thread_id = _parse_original_thread_id(d.pop("original_thread_id"))


        def _parse_original_thread_message_id(data: object) -> int | None:
            if data is None:
                return data
            return cast(int | None, data)

        original_thread_message_id = _parse_original_thread_message_id(d.pop("original_thread_message_id"))


        def _parse_original_thread_parent_chat_id(data: object) -> int | None:
            if data is None:
                return data
            return cast(int | None, data)

        original_thread_parent_chat_id = _parse_original_thread_parent_chat_id(d.pop("original_thread_parent_chat_id"))


        forwarding = cls(
            original_message_id=original_message_id,
            original_chat_id=original_chat_id,
            author_id=author_id,
            original_created_at=original_created_at,
            original_thread_id=original_thread_id,
            original_thread_message_id=original_thread_message_id,
            original_thread_parent_chat_id=original_thread_parent_chat_id,
        )


        forwarding.additional_properties = d
        return forwarding

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
