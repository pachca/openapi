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






T = TypeVar("T", bound="ViewBlock")



@_attrs_define
class ViewBlock:
    """ Блок представления для форм (базовая модель, используйте конкретные типы блоков)

        Attributes:
            type_ (str): Тип блока
            text (str | Unset): Текст блока
            name (str | Unset): Имя поля
            label (str | Unset): Метка поля
            initial_date (datetime.datetime | Unset): Начальная дата
     """

    type_: str
    text: str | Unset = UNSET
    name: str | Unset = UNSET
    label: str | Unset = UNSET
    initial_date: datetime.datetime | Unset = UNSET
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)





    def to_dict(self) -> dict[str, Any]:
        type_ = self.type_

        text = self.text

        name = self.name

        label = self.label

        initial_date: str | Unset = UNSET
        if not isinstance(self.initial_date, Unset):
            initial_date = self.initial_date.isoformat()


        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update({
            "type": type_,
        })
        if text is not UNSET:
            field_dict["text"] = text
        if name is not UNSET:
            field_dict["name"] = name
        if label is not UNSET:
            field_dict["label"] = label
        if initial_date is not UNSET:
            field_dict["initial_date"] = initial_date

        return field_dict



    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        d = dict(src_dict)
        type_ = d.pop("type")

        text = d.pop("text", UNSET)

        name = d.pop("name", UNSET)

        label = d.pop("label", UNSET)

        _initial_date = d.pop("initial_date", UNSET)
        initial_date: datetime.datetime | Unset
        if isinstance(_initial_date,  Unset):
            initial_date = UNSET
        else:
            initial_date = isoparse(_initial_date)




        view_block = cls(
            type_=type_,
            text=text,
            name=name,
            label=label,
            initial_date=initial_date,
        )


        view_block.additional_properties = d
        return view_block

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
