from __future__ import annotations

from collections.abc import Mapping
from typing import Any, TypeVar, BinaryIO, TextIO, TYPE_CHECKING, Generator

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..types import UNSET, Unset

from ..types import UNSET, Unset
from typing import cast






T = TypeVar("T", bound="AddMembersRequest")



@_attrs_define
class AddMembersRequest:
    """ Запрос на добавление участников в чат

        Attributes:
            member_ids (list[int]): Массив идентификаторов пользователей, которые станут участниками Example: [186, 187].
            silent (bool | Unset): Не создавать в чате системное сообщение о добавлении участника Example: True.
     """

    member_ids: list[int]
    silent: bool | Unset = UNSET
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)





    def to_dict(self) -> dict[str, Any]:
        member_ids = self.member_ids



        silent = self.silent


        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update({
            "member_ids": member_ids,
        })
        if silent is not UNSET:
            field_dict["silent"] = silent

        return field_dict



    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        d = dict(src_dict)
        member_ids = cast(list[int], d.pop("member_ids"))


        silent = d.pop("silent", UNSET)

        add_members_request = cls(
            member_ids=member_ids,
            silent=silent,
        )


        add_members_request.additional_properties = d
        return add_members_request

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
