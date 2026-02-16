from __future__ import annotations

from collections.abc import Mapping
from typing import Any, TypeVar, BinaryIO, TextIO, TYPE_CHECKING, Generator

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..types import UNSET, Unset

from ..types import UNSET, Unset
from typing import cast






T = TypeVar("T", bound="ChatCreateRequestChat")



@_attrs_define
class ChatCreateRequestChat:
    """ Собранный объект параметров создаваемого чата

        Attributes:
            name (str): Название
            member_ids (list[int] | Unset): Массив идентификаторов пользователей, которые станут участниками
            group_tag_ids (list[int] | Unset): Массив идентификаторов тегов, которые станут участниками
            channel (bool | Unset): Является каналом Default: False.
            public (bool | Unset): Открытый доступ Default: False.
     """

    name: str
    member_ids: list[int] | Unset = UNSET
    group_tag_ids: list[int] | Unset = UNSET
    channel: bool | Unset = False
    public: bool | Unset = False
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)





    def to_dict(self) -> dict[str, Any]:
        name = self.name

        member_ids: list[int] | Unset = UNSET
        if not isinstance(self.member_ids, Unset):
            member_ids = self.member_ids



        group_tag_ids: list[int] | Unset = UNSET
        if not isinstance(self.group_tag_ids, Unset):
            group_tag_ids = self.group_tag_ids



        channel = self.channel

        public = self.public


        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update({
            "name": name,
        })
        if member_ids is not UNSET:
            field_dict["member_ids"] = member_ids
        if group_tag_ids is not UNSET:
            field_dict["group_tag_ids"] = group_tag_ids
        if channel is not UNSET:
            field_dict["channel"] = channel
        if public is not UNSET:
            field_dict["public"] = public

        return field_dict



    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        d = dict(src_dict)
        name = d.pop("name")

        member_ids = cast(list[int], d.pop("member_ids", UNSET))


        group_tag_ids = cast(list[int], d.pop("group_tag_ids", UNSET))


        channel = d.pop("channel", UNSET)

        public = d.pop("public", UNSET)

        chat_create_request_chat = cls(
            name=name,
            member_ids=member_ids,
            group_tag_ids=group_tag_ids,
            channel=channel,
            public=public,
        )


        chat_create_request_chat.additional_properties = d
        return chat_create_request_chat

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
