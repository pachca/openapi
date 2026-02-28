from __future__ import annotations

from collections.abc import Mapping
from typing import Any, TypeVar, BinaryIO, TextIO, TYPE_CHECKING, Generator

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..types import UNSET, Unset

from ..models.view_block_input_type import ViewBlockInputType
from ..types import UNSET, Unset






T = TypeVar("T", bound="ViewBlockInput")



@_attrs_define
class ViewBlockInput:
    """ Блок input — текстовое поле ввода

        Attributes:
            type_ (ViewBlockInputType): Тип блока Example: input.
            name (str): Название, которое будет передано в ваше приложение как ключ указанного пользователем значения
                Example: info.
            label (str): Подпись к полю Example: Описание отпуска.
            placeholder (str | Unset): Подсказка внутри поля ввода, пока оно пустое Example: Куда собираетесь и что будете
                делать.
            multiline (bool | Unset): Многострочное поле Example: True.
            initial_value (str | Unset): Начальное значение в поле Example: Начальный текст.
            min_length (int | Unset): Минимальная длина текста, который должен написать пользователь. Если пользователь
                напишет меньше, он получит ошибку. Example: 10.
            max_length (int | Unset): Максимальная длина текста, который должен написать пользователь. Если пользователь
                напишет больше, он получит ошибку. Example: 500.
            required (bool | Unset): Обязательность Example: True.
            hint (str | Unset): Подсказка, которая отображается под полем серым цветом Example: Возможно вам подскаджут,
                какие места лучше посетить.
     """

    type_: ViewBlockInputType
    name: str
    label: str
    placeholder: str | Unset = UNSET
    multiline: bool | Unset = UNSET
    initial_value: str | Unset = UNSET
    min_length: int | Unset = UNSET
    max_length: int | Unset = UNSET
    required: bool | Unset = UNSET
    hint: str | Unset = UNSET
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)





    def to_dict(self) -> dict[str, Any]:
        type_ = self.type_.value

        name = self.name

        label = self.label

        placeholder = self.placeholder

        multiline = self.multiline

        initial_value = self.initial_value

        min_length = self.min_length

        max_length = self.max_length

        required = self.required

        hint = self.hint


        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update({
            "type": type_,
            "name": name,
            "label": label,
        })
        if placeholder is not UNSET:
            field_dict["placeholder"] = placeholder
        if multiline is not UNSET:
            field_dict["multiline"] = multiline
        if initial_value is not UNSET:
            field_dict["initial_value"] = initial_value
        if min_length is not UNSET:
            field_dict["min_length"] = min_length
        if max_length is not UNSET:
            field_dict["max_length"] = max_length
        if required is not UNSET:
            field_dict["required"] = required
        if hint is not UNSET:
            field_dict["hint"] = hint

        return field_dict



    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        d = dict(src_dict)
        type_ = ViewBlockInputType(d.pop("type"))




        name = d.pop("name")

        label = d.pop("label")

        placeholder = d.pop("placeholder", UNSET)

        multiline = d.pop("multiline", UNSET)

        initial_value = d.pop("initial_value", UNSET)

        min_length = d.pop("min_length", UNSET)

        max_length = d.pop("max_length", UNSET)

        required = d.pop("required", UNSET)

        hint = d.pop("hint", UNSET)

        view_block_input = cls(
            type_=type_,
            name=name,
            label=label,
            placeholder=placeholder,
            multiline=multiline,
            initial_value=initial_value,
            min_length=min_length,
            max_length=max_length,
            required=required,
            hint=hint,
        )


        view_block_input.additional_properties = d
        return view_block_input

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
