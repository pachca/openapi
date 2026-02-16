from __future__ import annotations

from collections.abc import Mapping
from typing import Any, TypeVar, BinaryIO, TextIO, TYPE_CHECKING, Generator

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..types import UNSET, Unset

from typing import cast

if TYPE_CHECKING:
  from ..models.link_preview import LinkPreview





T = TypeVar("T", bound="LinkPreviewsRequestLinkPreviews")



@_attrs_define
class LinkPreviewsRequestLinkPreviews:
    """ `JSON` карта предпросмотров ссылок, где каждый ключ — `URL`, который был получен в исходящем вебхуке о новом
    сообщении.

     """

    additional_properties: dict[str, LinkPreview] = _attrs_field(init=False, factory=dict)





    def to_dict(self) -> dict[str, Any]:
        from ..models.link_preview import LinkPreview
        
        field_dict: dict[str, Any] = {}
        for prop_name, prop in self.additional_properties.items():
            field_dict[prop_name] = prop.to_dict()


        return field_dict



    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        from ..models.link_preview import LinkPreview
        d = dict(src_dict)
        link_previews_request_link_previews = cls(
        )


        from ..models.link_preview_image import LinkPreviewImage
        additional_properties = {}
        for prop_name, prop_dict in d.items():
            additional_property = LinkPreview.from_dict(prop_dict)



            additional_properties[prop_name] = additional_property

        link_previews_request_link_previews.additional_properties = additional_properties
        return link_previews_request_link_previews

    @property
    def additional_keys(self) -> list[str]:
        return list(self.additional_properties.keys())

    def __getitem__(self, key: str) -> LinkPreview:
        return self.additional_properties[key]

    def __setitem__(self, key: str, value: LinkPreview) -> None:
        self.additional_properties[key] = value

    def __delitem__(self, key: str) -> None:
        del self.additional_properties[key]

    def __contains__(self, key: str) -> bool:
        return key in self.additional_properties
