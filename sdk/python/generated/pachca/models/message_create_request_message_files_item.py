from __future__ import annotations

from collections.abc import Mapping
from typing import Any, TypeVar, BinaryIO, TextIO, TYPE_CHECKING, Generator

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..types import UNSET, Unset

from ..models.file_type import FileType
from ..types import UNSET, Unset






T = TypeVar("T", bound="MessageCreateRequestMessageFilesItem")



@_attrs_define
class MessageCreateRequestMessageFilesItem:
    """ 
        Attributes:
            key (str): Путь к файлу, полученный в результате [загрузки файла](POST /direct_url) Example:
                attaches/files/93746/e354fd79-4f3e-4b5a-9c8d-1a2b3c4d5e6f/logo.png.
            name (str): Название файла, которое вы хотите отображать пользователю (рекомендуется писать вместе с
                расширением) Example: logo.png.
            file_type (FileType): Тип файла
            size (int): Размер файла в байтах, отображаемый пользователю Example: 12345.
            width (int | Unset): Ширина изображения в px (используется в случае, если file_type указан как image) Example:
                800.
            height (int | Unset): Высота изображения в px (используется в случае, если file_type указан как image) Example:
                600.
     """

    key: str
    name: str
    file_type: FileType
    size: int
    width: int | Unset = UNSET
    height: int | Unset = UNSET
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)





    def to_dict(self) -> dict[str, Any]:
        key = self.key

        name = self.name

        file_type = self.file_type.value

        size = self.size

        width = self.width

        height = self.height


        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update({
            "key": key,
            "name": name,
            "file_type": file_type,
            "size": size,
        })
        if width is not UNSET:
            field_dict["width"] = width
        if height is not UNSET:
            field_dict["height"] = height

        return field_dict



    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        d = dict(src_dict)
        key = d.pop("key")

        name = d.pop("name")

        file_type = FileType(d.pop("file_type"))




        size = d.pop("size")

        width = d.pop("width", UNSET)

        height = d.pop("height", UNSET)

        message_create_request_message_files_item = cls(
            key=key,
            name=name,
            file_type=file_type,
            size=size,
            width=width,
            height=height,
        )


        message_create_request_message_files_item.additional_properties = d
        return message_create_request_message_files_item

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
