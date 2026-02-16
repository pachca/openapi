from __future__ import annotations

from collections.abc import Mapping
from typing import Any, TypeVar, BinaryIO, TextIO, TYPE_CHECKING, Generator

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..types import UNSET, Unset

from ..models.view_block_time_type import ViewBlockTimeType
from ..types import UNSET, Unset






T = TypeVar("T", bound="ViewBlockTime")



@_attrs_define
class ViewBlockTime:
    """ Блок time — выбор времени

        Attributes:
            type_ (ViewBlockTimeType): Тип блока Example: time.
            name (str): Название, которое будет передано в ваше приложение как ключ указанного пользователем значения
                Example: newsletter_time.
            label (str): Подпись к полю Example: Время рассылки.
            initial_time (str | Unset): Начальное значение в поле в формате HH:mm Example: 11:00.
            required (bool | Unset): Обязательность
            hint (str | Unset): Подсказка, которая отображается под полем серым цветом Example: Укажите, в какое время
                присылать выбранные рассылки.
     """

    type_: ViewBlockTimeType
    name: str
    label: str
    initial_time: str | Unset = UNSET
    required: bool | Unset = UNSET
    hint: str | Unset = UNSET
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)





    def to_dict(self) -> dict[str, Any]:
        type_ = self.type_.value

        name = self.name

        label = self.label

        initial_time = self.initial_time

        required = self.required

        hint = self.hint


        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update({
            "type": type_,
            "name": name,
            "label": label,
        })
        if initial_time is not UNSET:
            field_dict["initial_time"] = initial_time
        if required is not UNSET:
            field_dict["required"] = required
        if hint is not UNSET:
            field_dict["hint"] = hint

        return field_dict



    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        d = dict(src_dict)
        type_ = ViewBlockTimeType(d.pop("type"))




        name = d.pop("name")

        label = d.pop("label")

        initial_time = d.pop("initial_time", UNSET)

        required = d.pop("required", UNSET)

        hint = d.pop("hint", UNSET)

        view_block_time = cls(
            type_=type_,
            name=name,
            label=label,
            initial_time=initial_time,
            required=required,
            hint=hint,
        )


        view_block_time.additional_properties = d
        return view_block_time

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
