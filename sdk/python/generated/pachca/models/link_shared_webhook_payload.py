from __future__ import annotations

from collections.abc import Mapping
from typing import Any, TypeVar, BinaryIO, TextIO, TYPE_CHECKING, Generator

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..types import UNSET, Unset

from ..models.link_shared_webhook_payload_event import LinkSharedWebhookPayloadEvent
from ..models.link_shared_webhook_payload_type import LinkSharedWebhookPayloadType
from dateutil.parser import isoparse
from typing import cast
import datetime

if TYPE_CHECKING:
  from ..models.webhook_link import WebhookLink





T = TypeVar("T", bound="LinkSharedWebhookPayload")



@_attrs_define
class LinkSharedWebhookPayload:
    """ Структура исходящего вебхука о разворачивании ссылок

        Attributes:
            type_ (LinkSharedWebhookPayloadType): Тип объекта Example: message.
            event (LinkSharedWebhookPayloadEvent): Тип события Example: link_shared.
            chat_id (int): Идентификатор чата, в котором обнаружена ссылка Example: 23438.
            message_id (int): Идентификатор сообщения, содержащего ссылку Example: 268092.
            links (list[WebhookLink]): Массив обнаруженных ссылок на отслеживаемые домены
            created_at (datetime.datetime): Дата и время создания сообщения (ISO-8601, UTC+0) в формате YYYY-MM-
                DDThh:mm:ss.sssZ Example: 2024-09-18T19:53:14.000Z.
            webhook_timestamp (int): Дата и время отправки вебхука (UTC+0) в формате UNIX Example: 1726685594.
     """

    type_: LinkSharedWebhookPayloadType
    event: LinkSharedWebhookPayloadEvent
    chat_id: int
    message_id: int
    links: list[WebhookLink]
    created_at: datetime.datetime
    webhook_timestamp: int
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)





    def to_dict(self) -> dict[str, Any]:
        from ..models.webhook_link import WebhookLink
        type_ = self.type_.value

        event = self.event.value

        chat_id = self.chat_id

        message_id = self.message_id

        links = []
        for links_item_data in self.links:
            links_item = links_item_data.to_dict()
            links.append(links_item)



        created_at = self.created_at.isoformat()

        webhook_timestamp = self.webhook_timestamp


        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update({
            "type": type_,
            "event": event,
            "chat_id": chat_id,
            "message_id": message_id,
            "links": links,
            "created_at": created_at,
            "webhook_timestamp": webhook_timestamp,
        })

        return field_dict



    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        from ..models.webhook_link import WebhookLink
        d = dict(src_dict)
        type_ = LinkSharedWebhookPayloadType(d.pop("type"))




        event = LinkSharedWebhookPayloadEvent(d.pop("event"))




        chat_id = d.pop("chat_id")

        message_id = d.pop("message_id")

        links = []
        _links = d.pop("links")
        for links_item_data in (_links):
            links_item = WebhookLink.from_dict(links_item_data)



            links.append(links_item)


        created_at = isoparse(d.pop("created_at"))




        webhook_timestamp = d.pop("webhook_timestamp")

        link_shared_webhook_payload = cls(
            type_=type_,
            event=event,
            chat_id=chat_id,
            message_id=message_id,
            links=links,
            created_at=created_at,
            webhook_timestamp=webhook_timestamp,
        )


        link_shared_webhook_payload.additional_properties = d
        return link_shared_webhook_payload

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
