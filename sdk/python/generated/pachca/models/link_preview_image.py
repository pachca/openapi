from __future__ import annotations

from collections.abc import Mapping
from typing import Any, TypeVar, BinaryIO, TextIO, TYPE_CHECKING, Generator

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..types import UNSET, Unset







T = TypeVar("T", bound="LinkPreviewImage")



@_attrs_define
class LinkPreviewImage:
    """ Изображение

        Attributes:
            key (str): Путь к изображению, полученный в результате [загрузки файла](POST /direct_url) Example:
                attaches/files/93746/e354fd79-9jh6-f2hd-fj83-709dae24c763/$filename.
            name (str): Название изображения (рекомендуется писать вместе с расширением) Example: files-to-server.jpg.
            size (int): Размер изображения в байтах Example: 695604.
     """

    key: str
    name: str
    size: int
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)





    def to_dict(self) -> dict[str, Any]:
        key = self.key

        name = self.name

        size = self.size


        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update({
            "key": key,
            "name": name,
            "size": size,
        })

        return field_dict



    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        d = dict(src_dict)
        key = d.pop("key")

        name = d.pop("name")

        size = d.pop("size")

        link_preview_image = cls(
            key=key,
            name=name,
            size=size,
        )


        link_preview_image.additional_properties = d
        return link_preview_image

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
