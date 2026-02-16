from __future__ import annotations

from collections.abc import Mapping
from typing import Any, TypeVar, BinaryIO, TextIO, TYPE_CHECKING, Generator

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..types import UNSET, Unset

from ..models.reaction_event_type import ReactionEventType
from ..models.reaction_webhook_payload_type import ReactionWebhookPayloadType
from dateutil.parser import isoparse
from typing import cast
import datetime






T = TypeVar("T", bound="ReactionWebhookPayload")



@_attrs_define
class ReactionWebhookPayload:
    """ Структура исходящего вебхука о реакции

        Attributes:
            type_ (ReactionWebhookPayloadType): Тип объекта Example: reaction.
            event (ReactionEventType): Тип события webhook для реакций
            message_id (int): Идентификатор сообщения, к которому относится реакция Example: 1245817.
            code (str): Emoji символ реакции Example: 👍.
            name (str): Название реакции Example: thumbsup.
            user_id (int): Идентификатор пользователя, который добавил или удалил реакцию Example: 2345.
            created_at (datetime.datetime): Дата и время создания сообщения (ISO-8601, UTC+0) в формате YYYY-MM-
                DDThh:mm:ss.sssZ Example: 2025-05-15T14:30:00.000Z.
            webhook_timestamp (int): Дата и время отправки вебхука (UTC+0) в формате UNIX Example: 1747574400.
     """

    type_: ReactionWebhookPayloadType
    event: ReactionEventType
    message_id: int
    code: str
    name: str
    user_id: int
    created_at: datetime.datetime
    webhook_timestamp: int
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)





    def to_dict(self) -> dict[str, Any]:
        type_ = self.type_.value

        event = self.event.value

        message_id = self.message_id

        code = self.code

        name = self.name

        user_id = self.user_id

        created_at = self.created_at.isoformat()

        webhook_timestamp = self.webhook_timestamp


        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update({
            "type": type_,
            "event": event,
            "message_id": message_id,
            "code": code,
            "name": name,
            "user_id": user_id,
            "created_at": created_at,
            "webhook_timestamp": webhook_timestamp,
        })

        return field_dict



    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        d = dict(src_dict)
        type_ = ReactionWebhookPayloadType(d.pop("type"))




        event = ReactionEventType(d.pop("event"))




        message_id = d.pop("message_id")

        code = d.pop("code")

        name = d.pop("name")

        user_id = d.pop("user_id")

        created_at = isoparse(d.pop("created_at"))




        webhook_timestamp = d.pop("webhook_timestamp")

        reaction_webhook_payload = cls(
            type_=type_,
            event=event,
            message_id=message_id,
            code=code,
            name=name,
            user_id=user_id,
            created_at=created_at,
            webhook_timestamp=webhook_timestamp,
        )


        reaction_webhook_payload.additional_properties = d
        return reaction_webhook_payload

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
