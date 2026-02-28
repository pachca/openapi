from __future__ import annotations

from collections.abc import Mapping
from typing import Any, TypeVar, BinaryIO, TextIO, TYPE_CHECKING, Generator

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..types import UNSET, Unset







T = TypeVar("T", bound="AuditDetailsRoleChanged")



@_attrs_define
class AuditDetailsRoleChanged:
    """ При: user_role_changed

        Attributes:
            new_company_role (str): Новая роль
            previous_company_role (str): Предыдущая роль
            initiator_id (int): Идентификатор инициатора
     """

    new_company_role: str
    previous_company_role: str
    initiator_id: int
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)





    def to_dict(self) -> dict[str, Any]:
        new_company_role = self.new_company_role

        previous_company_role = self.previous_company_role

        initiator_id = self.initiator_id


        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update({
            "new_company_role": new_company_role,
            "previous_company_role": previous_company_role,
            "initiator_id": initiator_id,
        })

        return field_dict



    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        d = dict(src_dict)
        new_company_role = d.pop("new_company_role")

        previous_company_role = d.pop("previous_company_role")

        initiator_id = d.pop("initiator_id")

        audit_details_role_changed = cls(
            new_company_role=new_company_role,
            previous_company_role=previous_company_role,
            initiator_id=initiator_id,
        )


        audit_details_role_changed.additional_properties = d
        return audit_details_role_changed

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
