from __future__ import annotations

from collections.abc import Mapping
from typing import Any, TypeVar, BinaryIO, TextIO, TYPE_CHECKING, Generator

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..types import UNSET, Unset

from typing import cast

if TYPE_CHECKING:
  from ..models.link_previews_request_link_previews import LinkPreviewsRequestLinkPreviews





T = TypeVar("T", bound="LinkPreviewsRequest")



@_attrs_define
class LinkPreviewsRequest:
    """ Запрос на разворачивание ссылок

        Attributes:
            link_previews (LinkPreviewsRequestLinkPreviews): `JSON` карта предпросмотров ссылок, где каждый ключ — `URL`,
                который был получен в исходящем вебхуке о новом сообщении.
     """

    link_previews: LinkPreviewsRequestLinkPreviews
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)





    def to_dict(self) -> dict[str, Any]:
        from ..models.link_previews_request_link_previews import LinkPreviewsRequestLinkPreviews
        link_previews = self.link_previews.to_dict()


        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update({
            "link_previews": link_previews,
        })

        return field_dict



    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        from ..models.link_previews_request_link_previews import LinkPreviewsRequestLinkPreviews
        d = dict(src_dict)
        link_previews = LinkPreviewsRequestLinkPreviews.from_dict(d.pop("link_previews"))




        link_previews_request = cls(
            link_previews=link_previews,
        )


        link_previews_request.additional_properties = d
        return link_previews_request

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
