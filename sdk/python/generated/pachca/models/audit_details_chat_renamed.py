from __future__ import annotations

from collections.abc import Mapping
from typing import Any, TypeVar, BinaryIO, TextIO, TYPE_CHECKING, Generator

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..types import UNSET, Unset







T = TypeVar("T", bound="AuditDetailsChatRenamed")



@_attrs_define
class AuditDetailsChatRenamed:
    """ При: chat_renamed

        Attributes:
            old_name (str): Прежнее название чата
            new_name (str): Новое название чата
     """

    old_name: str
    new_name: str
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)





    def to_dict(self) -> dict[str, Any]:
        old_name = self.old_name

        new_name = self.new_name


        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update({
            "old_name": old_name,
            "new_name": new_name,
        })

        return field_dict



    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        d = dict(src_dict)
        old_name = d.pop("old_name")

        new_name = d.pop("new_name")

        audit_details_chat_renamed = cls(
            old_name=old_name,
            new_name=new_name,
        )


        audit_details_chat_renamed.additional_properties = d
        return audit_details_chat_renamed

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
