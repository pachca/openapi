from __future__ import annotations

from collections.abc import Mapping
from typing import Any, TypeVar, BinaryIO, TextIO, TYPE_CHECKING, Generator

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..types import UNSET, Unset







T = TypeVar("T", bound="AuditDetailsDlp")



@_attrs_define
class AuditDetailsDlp:
    """ При: dlp_violation_detected

        Attributes:
            dlp_rule_id (int): Идентификатор правила DLP
            dlp_rule_name (str): Название правила DLP
            message_id (int): Идентификатор сообщения
            chat_id (int): Идентификатор чата
            user_id (int): Идентификатор пользователя
            action_message (str): Описание действия
            conditions_matched (bool): Результат проверки условий правила (true — условия сработали)
     """

    dlp_rule_id: int
    dlp_rule_name: str
    message_id: int
    chat_id: int
    user_id: int
    action_message: str
    conditions_matched: bool
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)





    def to_dict(self) -> dict[str, Any]:
        dlp_rule_id = self.dlp_rule_id

        dlp_rule_name = self.dlp_rule_name

        message_id = self.message_id

        chat_id = self.chat_id

        user_id = self.user_id

        action_message = self.action_message

        conditions_matched = self.conditions_matched


        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update({
            "dlp_rule_id": dlp_rule_id,
            "dlp_rule_name": dlp_rule_name,
            "message_id": message_id,
            "chat_id": chat_id,
            "user_id": user_id,
            "action_message": action_message,
            "conditions_matched": conditions_matched,
        })

        return field_dict



    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        d = dict(src_dict)
        dlp_rule_id = d.pop("dlp_rule_id")

        dlp_rule_name = d.pop("dlp_rule_name")

        message_id = d.pop("message_id")

        chat_id = d.pop("chat_id")

        user_id = d.pop("user_id")

        action_message = d.pop("action_message")

        conditions_matched = d.pop("conditions_matched")

        audit_details_dlp = cls(
            dlp_rule_id=dlp_rule_id,
            dlp_rule_name=dlp_rule_name,
            message_id=message_id,
            chat_id=chat_id,
            user_id=user_id,
            action_message=action_message,
            conditions_matched=conditions_matched,
        )


        audit_details_dlp.additional_properties = d
        return audit_details_dlp

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
