from __future__ import annotations

from collections.abc import Mapping
from typing import Any, TypeVar, BinaryIO, TextIO, TYPE_CHECKING, Generator

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..types import UNSET, Unset

from typing import cast

if TYPE_CHECKING:
  from ..models.group_tag_request_group_tag import GroupTagRequestGroupTag





T = TypeVar("T", bound="GroupTagRequest")



@_attrs_define
class GroupTagRequest:
    """ Запрос на создание или редактирование тега

        Attributes:
            group_tag (GroupTagRequestGroupTag):
     """

    group_tag: GroupTagRequestGroupTag
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)





    def to_dict(self) -> dict[str, Any]:
        from ..models.group_tag_request_group_tag import GroupTagRequestGroupTag
        group_tag = self.group_tag.to_dict()


        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update({
            "group_tag": group_tag,
        })

        return field_dict



    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        from ..models.group_tag_request_group_tag import GroupTagRequestGroupTag
        d = dict(src_dict)
        group_tag = GroupTagRequestGroupTag.from_dict(d.pop("group_tag"))




        group_tag_request = cls(
            group_tag=group_tag,
        )


        group_tag_request.additional_properties = d
        return group_tag_request

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
