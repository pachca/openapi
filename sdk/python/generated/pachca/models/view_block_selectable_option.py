from __future__ import annotations

from collections.abc import Mapping
from typing import Any, TypeVar, BinaryIO, TextIO, TYPE_CHECKING, Generator

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..types import UNSET, Unset

from ..types import UNSET, Unset






T = TypeVar("T", bound="ViewBlockSelectableOption")



@_attrs_define
class ViewBlockSelectableOption:
    """ Опция для блоков select, radio и checkbox

        Attributes:
            text (str): Отображаемый текст Example: Ничего.
            value (str): Уникальное строковое значение, которое будет передано в ваше приложение при выборе этого пункта
                Example: nothing.
            description (str | Unset): Пояснение, которое будет указано серым цветом в этом пункте под отображаемым текстом
                Example: Каждый день бот будет присылать список новых задач в вашей команде.
            selected (bool | Unset): Изначально выбранный пункт. Только один пункт может быть выбран. Example: True.
     """

    text: str
    value: str
    description: str | Unset = UNSET
    selected: bool | Unset = UNSET
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)





    def to_dict(self) -> dict[str, Any]:
        text = self.text

        value = self.value

        description = self.description

        selected = self.selected


        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update({
            "text": text,
            "value": value,
        })
        if description is not UNSET:
            field_dict["description"] = description
        if selected is not UNSET:
            field_dict["selected"] = selected

        return field_dict



    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        d = dict(src_dict)
        text = d.pop("text")

        value = d.pop("value")

        description = d.pop("description", UNSET)

        selected = d.pop("selected", UNSET)

        view_block_selectable_option = cls(
            text=text,
            value=value,
            description=description,
            selected=selected,
        )


        view_block_selectable_option.additional_properties = d
        return view_block_selectable_option

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
