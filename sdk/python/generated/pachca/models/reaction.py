from __future__ import annotations

from collections.abc import Mapping
from typing import Any, TypeVar, BinaryIO, TextIO, TYPE_CHECKING, Generator

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..types import UNSET, Unset

from ..types import UNSET, Unset
from dateutil.parser import isoparse
from typing import cast
import datetime






T = TypeVar("T", bound="Reaction")



@_attrs_define
class Reaction:
    """ Реакция на сообщение

        Attributes:
            user_id (int): Идентификатор пользователя, который добавил реакцию Example: 12.
            created_at (datetime.datetime): Дата и время добавления реакции (ISO-8601, UTC+0) в формате YYYY-MM-
                DDThh:mm:ss.sssZ Example: 2024-01-20T10:30:00.000Z.
            code (str): Emoji символ реакции Example: 👍.
            name (str | Unset): Название emoji реакции Example: :+1::skin-tone-1:.
     """

    user_id: int
    created_at: datetime.datetime
    code: str
    name: str | Unset = UNSET
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)





    def to_dict(self) -> dict[str, Any]:
        user_id = self.user_id

        created_at = self.created_at.isoformat()

        code = self.code

        name = self.name


        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update({
            "user_id": user_id,
            "created_at": created_at,
            "code": code,
        })
        if name is not UNSET:
            field_dict["name"] = name

        return field_dict



    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        d = dict(src_dict)
        user_id = d.pop("user_id")

        created_at = isoparse(d.pop("created_at"))




        code = d.pop("code")

        name = d.pop("name", UNSET)

        reaction = cls(
            user_id=user_id,
            created_at=created_at,
            code=code,
            name=name,
        )


        reaction.additional_properties = d
        return reaction

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
