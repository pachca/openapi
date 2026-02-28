from __future__ import annotations

from collections.abc import Mapping
from typing import Any, TypeVar, BinaryIO, TextIO, TYPE_CHECKING, Generator

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..types import UNSET, Unset







T = TypeVar("T", bound="AuditDetailsKms")



@_attrs_define
class AuditDetailsKms:
    """ При: kms_encrypt, kms_decrypt

        Attributes:
            chat_id (int): Идентификатор чата
            message_id (int): Идентификатор сообщения
            reason (str): Причина операции
     """

    chat_id: int
    message_id: int
    reason: str
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)





    def to_dict(self) -> dict[str, Any]:
        chat_id = self.chat_id

        message_id = self.message_id

        reason = self.reason


        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update({
            "chat_id": chat_id,
            "message_id": message_id,
            "reason": reason,
        })

        return field_dict



    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        d = dict(src_dict)
        chat_id = d.pop("chat_id")

        message_id = d.pop("message_id")

        reason = d.pop("reason")

        audit_details_kms = cls(
            chat_id=chat_id,
            message_id=message_id,
            reason=reason,
        )


        audit_details_kms.additional_properties = d
        return audit_details_kms

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
