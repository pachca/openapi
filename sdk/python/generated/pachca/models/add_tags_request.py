from __future__ import annotations

from collections.abc import Mapping
from typing import Any, TypeVar, BinaryIO, TextIO, TYPE_CHECKING, Generator

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..types import UNSET, Unset

from typing import cast






T = TypeVar("T", bound="AddTagsRequest")



@_attrs_define
class AddTagsRequest:
    """ Запрос на добавление тегов в чат

        Attributes:
            group_tag_ids (list[int]): Массив идентификаторов тегов, которые станут участниками Example: [86, 18].
     """

    group_tag_ids: list[int]
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)





    def to_dict(self) -> dict[str, Any]:
        group_tag_ids = self.group_tag_ids




        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update({
            "group_tag_ids": group_tag_ids,
        })

        return field_dict



    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        d = dict(src_dict)
        group_tag_ids = cast(list[int], d.pop("group_tag_ids"))


        add_tags_request = cls(
            group_tag_ids=group_tag_ids,
        )


        add_tags_request.additional_properties = d
        return add_tags_request

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
