from __future__ import annotations

from collections.abc import Mapping
from typing import Any, TypeVar, BinaryIO, TextIO, TYPE_CHECKING, Generator

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..types import UNSET, Unset

from dateutil.parser import isoparse
from typing import cast
import datetime






T = TypeVar("T", bound="Chat")



@_attrs_define
class Chat:
    """ Чат

        Attributes:
            id (int): Идентификатор созданного чата Example: 334.
            name (str): Название Example: 🤿 aqua.
            created_at (datetime.datetime): Дата и время создания чата (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ
                Example: 2021-08-28T15:56:53.000Z.
            owner_id (int): Идентификатор пользователя, создавшего чат Example: 185.
            member_ids (list[int]): Массив идентификаторов пользователей, участников Example: [185, 186, 187].
            group_tag_ids (list[int]): Массив идентификаторов тегов, участников Example: [9111].
            channel (bool): Является каналом Example: True.
            personal (bool): Является личным чатом
            public (bool): Открытый доступ
            last_message_at (datetime.datetime): Дата и время создания последнего сообщения в чате (ISO-8601, UTC+0) в
                формате YYYY-MM-DDThh:mm:ss.sssZ Example: 2021-08-28T15:56:53.000Z.
            meet_room_url (str): Ссылка на Видеочат Example: https://meet.pachca.com/aqua-94bb21b5.
     """

    id: int
    name: str
    created_at: datetime.datetime
    owner_id: int
    member_ids: list[int]
    group_tag_ids: list[int]
    channel: bool
    personal: bool
    public: bool
    last_message_at: datetime.datetime
    meet_room_url: str
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)





    def to_dict(self) -> dict[str, Any]:
        id = self.id

        name = self.name

        created_at = self.created_at.isoformat()

        owner_id = self.owner_id

        member_ids = self.member_ids



        group_tag_ids = self.group_tag_ids



        channel = self.channel

        personal = self.personal

        public = self.public

        last_message_at = self.last_message_at.isoformat()

        meet_room_url = self.meet_room_url


        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update({
            "id": id,
            "name": name,
            "created_at": created_at,
            "owner_id": owner_id,
            "member_ids": member_ids,
            "group_tag_ids": group_tag_ids,
            "channel": channel,
            "personal": personal,
            "public": public,
            "last_message_at": last_message_at,
            "meet_room_url": meet_room_url,
        })

        return field_dict



    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        d = dict(src_dict)
        id = d.pop("id")

        name = d.pop("name")

        created_at = isoparse(d.pop("created_at"))




        owner_id = d.pop("owner_id")

        member_ids = cast(list[int], d.pop("member_ids"))


        group_tag_ids = cast(list[int], d.pop("group_tag_ids"))


        channel = d.pop("channel")

        personal = d.pop("personal")

        public = d.pop("public")

        last_message_at = isoparse(d.pop("last_message_at"))




        meet_room_url = d.pop("meet_room_url")

        chat = cls(
            id=id,
            name=name,
            created_at=created_at,
            owner_id=owner_id,
            member_ids=member_ids,
            group_tag_ids=group_tag_ids,
            channel=channel,
            personal=personal,
            public=public,
            last_message_at=last_message_at,
            meet_room_url=meet_room_url,
        )


        chat.additional_properties = d
        return chat

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
