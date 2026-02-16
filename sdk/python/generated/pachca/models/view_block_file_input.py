from __future__ import annotations

from collections.abc import Mapping
from typing import Any, TypeVar, BinaryIO, TextIO, TYPE_CHECKING, Generator

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..types import UNSET, Unset

from ..models.view_block_file_input_type import ViewBlockFileInputType
from ..types import UNSET, Unset
from typing import cast






T = TypeVar("T", bound="ViewBlockFileInput")



@_attrs_define
class ViewBlockFileInput:
    """ Блок file_input — загрузка файлов

        Attributes:
            type_ (ViewBlockFileInputType): Тип блока Example: file_input.
            name (str): Название, которое будет передано в ваше приложение как ключ указанного пользователем значения
                Example: request_doc.
            label (str): Подпись к полю Example: Заявление.
            filetypes (list[str] | Unset): Массив допустимых расширений файлов, указанные в виде строк (например,
                ["png","jpg","gif"]). Если это поле не указано, все расширения файлов будут приняты. Example: ['pdf', 'jpg',
                'png'].
            max_files (int | Unset): Максимальное количество файлов, которое может загрузить пользователь в это поле.
                Default: 10. Example: 1.
            required (bool | Unset): Обязательность Example: True.
            hint (str | Unset): Подсказка, которая отображается под полем серым цветом Example: Загрузите заполненное
                заявление с электронной подписью (в формате pdf, jpg или png).
     """

    type_: ViewBlockFileInputType
    name: str
    label: str
    filetypes: list[str] | Unset = UNSET
    max_files: int | Unset = 10
    required: bool | Unset = UNSET
    hint: str | Unset = UNSET
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)





    def to_dict(self) -> dict[str, Any]:
        type_ = self.type_.value

        name = self.name

        label = self.label

        filetypes: list[str] | Unset = UNSET
        if not isinstance(self.filetypes, Unset):
            filetypes = self.filetypes



        max_files = self.max_files

        required = self.required

        hint = self.hint


        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update({
            "type": type_,
            "name": name,
            "label": label,
        })
        if filetypes is not UNSET:
            field_dict["filetypes"] = filetypes
        if max_files is not UNSET:
            field_dict["max_files"] = max_files
        if required is not UNSET:
            field_dict["required"] = required
        if hint is not UNSET:
            field_dict["hint"] = hint

        return field_dict



    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        d = dict(src_dict)
        type_ = ViewBlockFileInputType(d.pop("type"))




        name = d.pop("name")

        label = d.pop("label")

        filetypes = cast(list[str], d.pop("filetypes", UNSET))


        max_files = d.pop("max_files", UNSET)

        required = d.pop("required", UNSET)

        hint = d.pop("hint", UNSET)

        view_block_file_input = cls(
            type_=type_,
            name=name,
            label=label,
            filetypes=filetypes,
            max_files=max_files,
            required=required,
            hint=hint,
        )


        view_block_file_input.additional_properties = d
        return view_block_file_input

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
