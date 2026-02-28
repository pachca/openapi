from __future__ import annotations

from collections.abc import Mapping
from typing import Any, TypeVar, BinaryIO, TextIO, TYPE_CHECKING, Generator

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..types import UNSET, Unset

from ..models.view_block_date_type import ViewBlockDateType
from ..types import UNSET, Unset
from dateutil.parser import isoparse
from typing import cast
import datetime






T = TypeVar("T", bound="ViewBlockDate")



@_attrs_define
class ViewBlockDate:
    """ Блок date — выбор даты

        Attributes:
            type_ (ViewBlockDateType): Тип блока Example: date.
            name (str): Название, которое будет передано в ваше приложение как ключ указанного пользователем значения
                Example: date_start.
            label (str): Подпись к полю Example: Дата начала отпуска.
            initial_date (datetime.date | Unset): Начальное значение в поле в формате YYYY-MM-DD Example: 2025-07-01.
            required (bool | Unset): Обязательность Example: True.
            hint (str | Unset): Подсказка, которая отображается под полем серым цветом Example: Укажите дату начала отпуска.
     """

    type_: ViewBlockDateType
    name: str
    label: str
    initial_date: datetime.date | Unset = UNSET
    required: bool | Unset = UNSET
    hint: str | Unset = UNSET
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)





    def to_dict(self) -> dict[str, Any]:
        type_ = self.type_.value

        name = self.name

        label = self.label

        initial_date: str | Unset = UNSET
        if not isinstance(self.initial_date, Unset):
            initial_date = self.initial_date.isoformat()

        required = self.required

        hint = self.hint


        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update({
            "type": type_,
            "name": name,
            "label": label,
        })
        if initial_date is not UNSET:
            field_dict["initial_date"] = initial_date
        if required is not UNSET:
            field_dict["required"] = required
        if hint is not UNSET:
            field_dict["hint"] = hint

        return field_dict



    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        d = dict(src_dict)
        type_ = ViewBlockDateType(d.pop("type"))




        name = d.pop("name")

        label = d.pop("label")

        _initial_date = d.pop("initial_date", UNSET)
        initial_date: datetime.date | Unset
        if isinstance(_initial_date,  Unset):
            initial_date = UNSET
        else:
            initial_date = isoparse(_initial_date).date()




        required = d.pop("required", UNSET)

        hint = d.pop("hint", UNSET)

        view_block_date = cls(
            type_=type_,
            name=name,
            label=label,
            initial_date=initial_date,
            required=required,
            hint=hint,
        )


        view_block_date.additional_properties = d
        return view_block_date

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
