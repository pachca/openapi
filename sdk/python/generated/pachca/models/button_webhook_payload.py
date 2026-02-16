from __future__ import annotations

from collections.abc import Mapping
from typing import Any, TypeVar, BinaryIO, TextIO, TYPE_CHECKING, Generator

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..types import UNSET, Unset

from ..models.button_webhook_payload_event import ButtonWebhookPayloadEvent
from ..models.button_webhook_payload_type import ButtonWebhookPayloadType






T = TypeVar("T", bound="ButtonWebhookPayload")



@_attrs_define
class ButtonWebhookPayload:
    """ Структура исходящего вебхука о нажатии кнопки

        Attributes:
            type_ (ButtonWebhookPayloadType): Тип объекта Example: button.
            event (ButtonWebhookPayloadEvent): Тип события Example: click.
            message_id (int): Идентификатор сообщения, к которому относится кнопка Example: 1245817.
            trigger_id (str): Уникальный идентификатор события. Время жизни — 3 секунды. Может быть использован, например,
                для открытия представления пользователю Example: a1b2c3d4-5e6f-7g8h-9i10-j11k12l13m14.
            data (str): Данные нажатой кнопки Example: button_data.
            user_id (int): Идентификатор пользователя, который нажал кнопку Example: 2345.
            chat_id (int): Идентификатор чата, в котором была нажата кнопка Example: 9012.
            webhook_timestamp (int): Дата и время отправки вебхука (UTC+0) в формате UNIX Example: 1747574400.
     """

    type_: ButtonWebhookPayloadType
    event: ButtonWebhookPayloadEvent
    message_id: int
    trigger_id: str
    data: str
    user_id: int
    chat_id: int
    webhook_timestamp: int
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)





    def to_dict(self) -> dict[str, Any]:
        type_ = self.type_.value

        event = self.event.value

        message_id = self.message_id

        trigger_id = self.trigger_id

        data = self.data

        user_id = self.user_id

        chat_id = self.chat_id

        webhook_timestamp = self.webhook_timestamp


        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update({
            "type": type_,
            "event": event,
            "message_id": message_id,
            "trigger_id": trigger_id,
            "data": data,
            "user_id": user_id,
            "chat_id": chat_id,
            "webhook_timestamp": webhook_timestamp,
        })

        return field_dict



    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        d = dict(src_dict)
        type_ = ButtonWebhookPayloadType(d.pop("type"))




        event = ButtonWebhookPayloadEvent(d.pop("event"))




        message_id = d.pop("message_id")

        trigger_id = d.pop("trigger_id")

        data = d.pop("data")

        user_id = d.pop("user_id")

        chat_id = d.pop("chat_id")

        webhook_timestamp = d.pop("webhook_timestamp")

        button_webhook_payload = cls(
            type_=type_,
            event=event,
            message_id=message_id,
            trigger_id=trigger_id,
            data=data,
            user_id=user_id,
            chat_id=chat_id,
            webhook_timestamp=webhook_timestamp,
        )


        button_webhook_payload.additional_properties = d
        return button_webhook_payload

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
