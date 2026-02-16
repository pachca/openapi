from __future__ import annotations

from collections.abc import Mapping
from typing import Any, TypeVar, BinaryIO, TextIO, TYPE_CHECKING, Generator

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..types import UNSET, Unset

from ..models.message_entity_type import MessageEntityType
from ..models.message_webhook_payload_type import MessageWebhookPayloadType
from ..models.webhook_event_type import WebhookEventType
from ..types import UNSET, Unset
from dateutil.parser import isoparse
from typing import cast
import datetime

if TYPE_CHECKING:
  from ..models.webhook_message_thread import WebhookMessageThread





T = TypeVar("T", bound="MessageWebhookPayload")



@_attrs_define
class MessageWebhookPayload:
    """ Структура исходящего вебхука о сообщении

        Attributes:
            type_ (MessageWebhookPayloadType): Тип объекта Example: message.
            id (int): Идентификатор сообщения Example: 1245817.
            event (WebhookEventType): Тип события webhook
            entity_type (MessageEntityType): Тип сущности для сообщений
            entity_id (int): Идентификатор сущности, к которой относится сообщение Example: 5678.
            content (str): Текст сообщения Example: Текст сообщения.
            user_id (int): Идентификатор отправителя сообщения Example: 2345.
            created_at (datetime.datetime): Дата и время создания сообщения (ISO-8601, UTC+0) в формате YYYY-MM-
                DDThh:mm:ss.sssZ Example: 2025-05-15T14:30:00.000Z.
            url (str): Прямая ссылка на сообщение Example: https://pachca.com/chats/1245817/messages/5678.
            chat_id (int): Идентификатор чата, в котором находится сообщение Example: 9012.
            webhook_timestamp (int): Дата и время отправки вебхука (UTC+0) в формате UNIX Example: 1747574400.
            parent_message_id (int | None | Unset): Идентификатор сообщения, к которому написан ответ Example: 3456.
            thread (WebhookMessageThread | Unset): Объект треда в вебхуке сообщения
     """

    type_: MessageWebhookPayloadType
    id: int
    event: WebhookEventType
    entity_type: MessageEntityType
    entity_id: int
    content: str
    user_id: int
    created_at: datetime.datetime
    url: str
    chat_id: int
    webhook_timestamp: int
    parent_message_id: int | None | Unset = UNSET
    thread: WebhookMessageThread | Unset = UNSET
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)





    def to_dict(self) -> dict[str, Any]:
        from ..models.webhook_message_thread import WebhookMessageThread
        type_ = self.type_.value

        id = self.id

        event = self.event.value

        entity_type = self.entity_type.value

        entity_id = self.entity_id

        content = self.content

        user_id = self.user_id

        created_at = self.created_at.isoformat()

        url = self.url

        chat_id = self.chat_id

        webhook_timestamp = self.webhook_timestamp

        parent_message_id: int | None | Unset
        if isinstance(self.parent_message_id, Unset):
            parent_message_id = UNSET
        else:
            parent_message_id = self.parent_message_id

        thread: dict[str, Any] | Unset = UNSET
        if not isinstance(self.thread, Unset):
            thread = self.thread.to_dict()


        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update({
            "type": type_,
            "id": id,
            "event": event,
            "entity_type": entity_type,
            "entity_id": entity_id,
            "content": content,
            "user_id": user_id,
            "created_at": created_at,
            "url": url,
            "chat_id": chat_id,
            "webhook_timestamp": webhook_timestamp,
        })
        if parent_message_id is not UNSET:
            field_dict["parent_message_id"] = parent_message_id
        if thread is not UNSET:
            field_dict["thread"] = thread

        return field_dict



    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        from ..models.webhook_message_thread import WebhookMessageThread
        d = dict(src_dict)
        type_ = MessageWebhookPayloadType(d.pop("type"))




        id = d.pop("id")

        event = WebhookEventType(d.pop("event"))




        entity_type = MessageEntityType(d.pop("entity_type"))




        entity_id = d.pop("entity_id")

        content = d.pop("content")

        user_id = d.pop("user_id")

        created_at = isoparse(d.pop("created_at"))




        url = d.pop("url")

        chat_id = d.pop("chat_id")

        webhook_timestamp = d.pop("webhook_timestamp")

        def _parse_parent_message_id(data: object) -> int | None | Unset:
            if data is None:
                return data
            if isinstance(data, Unset):
                return data
            return cast(int | None | Unset, data)

        parent_message_id = _parse_parent_message_id(d.pop("parent_message_id", UNSET))


        _thread = d.pop("thread", UNSET)
        thread: WebhookMessageThread | Unset
        if isinstance(_thread,  Unset):
            thread = UNSET
        else:
            thread = WebhookMessageThread.from_dict(_thread)




        message_webhook_payload = cls(
            type_=type_,
            id=id,
            event=event,
            entity_type=entity_type,
            entity_id=entity_id,
            content=content,
            user_id=user_id,
            created_at=created_at,
            url=url,
            chat_id=chat_id,
            webhook_timestamp=webhook_timestamp,
            parent_message_id=parent_message_id,
            thread=thread,
        )


        message_webhook_payload.additional_properties = d
        return message_webhook_payload

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
