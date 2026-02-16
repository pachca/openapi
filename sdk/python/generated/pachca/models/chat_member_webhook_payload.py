from __future__ import annotations

from collections.abc import Mapping
from typing import Any, TypeVar, BinaryIO, TextIO, TYPE_CHECKING, Generator

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..types import UNSET, Unset

from ..models.chat_member_webhook_payload_type import ChatMemberWebhookPayloadType
from ..models.member_event_type import MemberEventType
from ..types import UNSET, Unset
from dateutil.parser import isoparse
from typing import cast
import datetime






T = TypeVar("T", bound="ChatMemberWebhookPayload")



@_attrs_define
class ChatMemberWebhookPayload:
    """ Структура исходящего вебхука об участниках чата

        Attributes:
            type_ (ChatMemberWebhookPayloadType): Тип объекта Example: chat_member.
            event (MemberEventType): Тип события webhook для участников
            chat_id (int): Идентификатор чата, в котором изменился состав участников Example: 9012.
            user_ids (list[int]): Массив идентификаторов пользователей, с которыми произошло событие Example: [2345, 6789].
            created_at (datetime.datetime): Дата и время события (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ
                Example: 2025-05-15T14:30:00.000Z.
            webhook_timestamp (int): Дата и время отправки вебхука (UTC+0) в формате UNIX Example: 1747574400.
            thread_id (int | None | Unset): Идентификатор треда Example: 5678.
     """

    type_: ChatMemberWebhookPayloadType
    event: MemberEventType
    chat_id: int
    user_ids: list[int]
    created_at: datetime.datetime
    webhook_timestamp: int
    thread_id: int | None | Unset = UNSET
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)





    def to_dict(self) -> dict[str, Any]:
        type_ = self.type_.value

        event = self.event.value

        chat_id = self.chat_id

        user_ids = self.user_ids



        created_at = self.created_at.isoformat()

        webhook_timestamp = self.webhook_timestamp

        thread_id: int | None | Unset
        if isinstance(self.thread_id, Unset):
            thread_id = UNSET
        else:
            thread_id = self.thread_id


        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update({
            "type": type_,
            "event": event,
            "chat_id": chat_id,
            "user_ids": user_ids,
            "created_at": created_at,
            "webhook_timestamp": webhook_timestamp,
        })
        if thread_id is not UNSET:
            field_dict["thread_id"] = thread_id

        return field_dict



    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        d = dict(src_dict)
        type_ = ChatMemberWebhookPayloadType(d.pop("type"))




        event = MemberEventType(d.pop("event"))




        chat_id = d.pop("chat_id")

        user_ids = cast(list[int], d.pop("user_ids"))


        created_at = isoparse(d.pop("created_at"))




        webhook_timestamp = d.pop("webhook_timestamp")

        def _parse_thread_id(data: object) -> int | None | Unset:
            if data is None:
                return data
            if isinstance(data, Unset):
                return data
            return cast(int | None | Unset, data)

        thread_id = _parse_thread_id(d.pop("thread_id", UNSET))


        chat_member_webhook_payload = cls(
            type_=type_,
            event=event,
            chat_id=chat_id,
            user_ids=user_ids,
            created_at=created_at,
            webhook_timestamp=webhook_timestamp,
            thread_id=thread_id,
        )


        chat_member_webhook_payload.additional_properties = d
        return chat_member_webhook_payload

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
