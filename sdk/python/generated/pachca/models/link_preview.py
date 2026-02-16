from __future__ import annotations

from collections.abc import Mapping
from typing import Any, TypeVar, BinaryIO, TextIO, TYPE_CHECKING, Generator

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..types import UNSET, Unset

from ..types import UNSET, Unset
from typing import cast

if TYPE_CHECKING:
  from ..models.link_preview_image import LinkPreviewImage





T = TypeVar("T", bound="LinkPreview")



@_attrs_define
class LinkPreview:
    """ Данные для предпросмотра ссылки

        Attributes:
            title (str): Заголовок Example: Статья: Отправка файлов.
            description (str): Описание Example: Пример отправки файлов на удаленный сервер.
            image_url (str | Unset): Публичная ссылка на изображение (если вы хотите загрузить файл изображения в Пачку, то
                используйте параметр image) Example: https://website.com/img/landing.png.
            image (LinkPreviewImage | Unset): Изображение
     """

    title: str
    description: str
    image_url: str | Unset = UNSET
    image: LinkPreviewImage | Unset = UNSET
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)





    def to_dict(self) -> dict[str, Any]:
        from ..models.link_preview_image import LinkPreviewImage
        title = self.title

        description = self.description

        image_url = self.image_url

        image: dict[str, Any] | Unset = UNSET
        if not isinstance(self.image, Unset):
            image = self.image.to_dict()


        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update({
            "title": title,
            "description": description,
        })
        if image_url is not UNSET:
            field_dict["image_url"] = image_url
        if image is not UNSET:
            field_dict["image"] = image

        return field_dict



    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        from ..models.link_preview_image import LinkPreviewImage
        d = dict(src_dict)
        title = d.pop("title")

        description = d.pop("description")

        image_url = d.pop("image_url", UNSET)

        _image = d.pop("image", UNSET)
        image: LinkPreviewImage | Unset
        if isinstance(_image,  Unset):
            image = UNSET
        else:
            image = LinkPreviewImage.from_dict(_image)




        link_preview = cls(
            title=title,
            description=description,
            image_url=image_url,
            image=image,
        )


        link_preview.additional_properties = d
        return link_preview

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
