from __future__ import annotations

from collections.abc import Mapping
from typing import Any, TypeVar, BinaryIO, TextIO, TYPE_CHECKING, Generator

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..types import UNSET, Unset

from ..models.custom_property_data_type import CustomPropertyDataType






T = TypeVar("T", bound="CustomPropertyDefinition")



@_attrs_define
class CustomPropertyDefinition:
    """ Определение дополнительного поля (без значения)

        Attributes:
            id (int): Идентификатор поля Example: 1678.
            name (str): Название поля Example: Город.
            data_type (CustomPropertyDataType): Тип данных дополнительного поля
     """

    id: int
    name: str
    data_type: CustomPropertyDataType
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)





    def to_dict(self) -> dict[str, Any]:
        id = self.id

        name = self.name

        data_type = self.data_type.value


        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update({
            "id": id,
            "name": name,
            "data_type": data_type,
        })

        return field_dict



    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        d = dict(src_dict)
        id = d.pop("id")

        name = d.pop("name")

        data_type = CustomPropertyDataType(d.pop("data_type"))




        custom_property_definition = cls(
            id=id,
            name=name,
            data_type=data_type,
        )


        custom_property_definition.additional_properties = d
        return custom_property_definition

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
