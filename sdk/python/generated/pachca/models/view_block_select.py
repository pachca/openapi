from __future__ import annotations

from collections.abc import Mapping
from typing import Any, TypeVar, BinaryIO, TextIO, TYPE_CHECKING, Generator

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..types import UNSET, Unset

from ..models.view_block_select_type import ViewBlockSelectType
from ..types import UNSET, Unset
from typing import cast

if TYPE_CHECKING:
  from ..models.view_block_selectable_option import ViewBlockSelectableOption





T = TypeVar("T", bound="ViewBlockSelect")



@_attrs_define
class ViewBlockSelect:
    """ Блок select — выпадающий список

        Attributes:
            type_ (ViewBlockSelectType): Тип блока Example: select.
            name (str): Название, которое будет передано в ваше приложение как ключ указанного пользователем выбора Example:
                team.
            label (str): Подпись к выпадающему списку Example: Выберите команду.
            options (list[ViewBlockSelectableOption] | Unset): Массив доступных пунктов в выпадающем списке
            required (bool | Unset): Обязательность
            hint (str | Unset): Подсказка, которая отображается под выпадающим списком серым цветом
     """

    type_: ViewBlockSelectType
    name: str
    label: str
    options: list[ViewBlockSelectableOption] | Unset = UNSET
    required: bool | Unset = UNSET
    hint: str | Unset = UNSET
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)





    def to_dict(self) -> dict[str, Any]:
        from ..models.view_block_selectable_option import ViewBlockSelectableOption
        type_ = self.type_.value

        name = self.name

        label = self.label

        options: list[dict[str, Any]] | Unset = UNSET
        if not isinstance(self.options, Unset):
            options = []
            for options_item_data in self.options:
                options_item = options_item_data.to_dict()
                options.append(options_item)



        required = self.required

        hint = self.hint


        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update({
            "type": type_,
            "name": name,
            "label": label,
        })
        if options is not UNSET:
            field_dict["options"] = options
        if required is not UNSET:
            field_dict["required"] = required
        if hint is not UNSET:
            field_dict["hint"] = hint

        return field_dict



    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        from ..models.view_block_selectable_option import ViewBlockSelectableOption
        d = dict(src_dict)
        type_ = ViewBlockSelectType(d.pop("type"))




        name = d.pop("name")

        label = d.pop("label")

        _options = d.pop("options", UNSET)
        options: list[ViewBlockSelectableOption] | Unset = UNSET
        if _options is not UNSET:
            options = []
            for options_item_data in _options:
                options_item = ViewBlockSelectableOption.from_dict(options_item_data)



                options.append(options_item)


        required = d.pop("required", UNSET)

        hint = d.pop("hint", UNSET)

        view_block_select = cls(
            type_=type_,
            name=name,
            label=label,
            options=options,
            required=required,
            hint=hint,
        )


        view_block_select.additional_properties = d
        return view_block_select

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
