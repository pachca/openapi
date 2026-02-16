from __future__ import annotations

from collections.abc import Mapping
from typing import Any, TypeVar, BinaryIO, TextIO, TYPE_CHECKING, Generator

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..types import UNSET, Unset

from dateutil.parser import isoparse
from typing import cast
import datetime

if TYPE_CHECKING:
  from ..models.button_webhook_payload import ButtonWebhookPayload
  from ..models.chat_member_webhook_payload import ChatMemberWebhookPayload
  from ..models.company_member_webhook_payload import CompanyMemberWebhookPayload
  from ..models.message_webhook_payload import MessageWebhookPayload
  from ..models.reaction_webhook_payload import ReactionWebhookPayload





T = TypeVar("T", bound="WebhookEvent")



@_attrs_define
class WebhookEvent:
    """ Событие исходящего вебхука

        Attributes:
            id (str): Идентификатор события Example: a1b2c3d4-5e6f-7g8h-9i10-j11k12l13m14.
            event_type (str): Тип события Example: message_new.
            payload (ButtonWebhookPayload | ChatMemberWebhookPayload | CompanyMemberWebhookPayload | MessageWebhookPayload |
                ReactionWebhookPayload): Объединение всех типов payload вебхуков
            created_at (datetime.datetime): Дата и время создания события (ISO-8601, UTC+0) в формате YYYY-MM-
                DDThh:mm:ss.sssZ Example: 2025-05-15T14:30:00.000Z.
     """

    id: str
    event_type: str
    payload: ButtonWebhookPayload | ChatMemberWebhookPayload | CompanyMemberWebhookPayload | MessageWebhookPayload | ReactionWebhookPayload
    created_at: datetime.datetime
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)





    def to_dict(self) -> dict[str, Any]:
        from ..models.chat_member_webhook_payload import ChatMemberWebhookPayload
        from ..models.button_webhook_payload import ButtonWebhookPayload
        from ..models.message_webhook_payload import MessageWebhookPayload
        from ..models.reaction_webhook_payload import ReactionWebhookPayload
        from ..models.company_member_webhook_payload import CompanyMemberWebhookPayload
        id = self.id

        event_type = self.event_type

        payload: dict[str, Any]
        if isinstance(self.payload, MessageWebhookPayload):
            payload = self.payload.to_dict()
        elif isinstance(self.payload, ReactionWebhookPayload):
            payload = self.payload.to_dict()
        elif isinstance(self.payload, ButtonWebhookPayload):
            payload = self.payload.to_dict()
        elif isinstance(self.payload, ChatMemberWebhookPayload):
            payload = self.payload.to_dict()
        else:
            payload = self.payload.to_dict()


        created_at = self.created_at.isoformat()


        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update({
            "id": id,
            "event_type": event_type,
            "payload": payload,
            "created_at": created_at,
        })

        return field_dict



    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        from ..models.button_webhook_payload import ButtonWebhookPayload
        from ..models.chat_member_webhook_payload import ChatMemberWebhookPayload
        from ..models.company_member_webhook_payload import CompanyMemberWebhookPayload
        from ..models.message_webhook_payload import MessageWebhookPayload
        from ..models.reaction_webhook_payload import ReactionWebhookPayload
        d = dict(src_dict)
        id = d.pop("id")

        event_type = d.pop("event_type")

        def _parse_payload(data: object) -> ButtonWebhookPayload | ChatMemberWebhookPayload | CompanyMemberWebhookPayload | MessageWebhookPayload | ReactionWebhookPayload:
            try:
                if not isinstance(data, dict):
                    raise TypeError()
                componentsschemas_webhook_payload_union_type_0 = MessageWebhookPayload.from_dict(data)



                return componentsschemas_webhook_payload_union_type_0
            except (TypeError, ValueError, AttributeError, KeyError):
                pass
            try:
                if not isinstance(data, dict):
                    raise TypeError()
                componentsschemas_webhook_payload_union_type_1 = ReactionWebhookPayload.from_dict(data)



                return componentsschemas_webhook_payload_union_type_1
            except (TypeError, ValueError, AttributeError, KeyError):
                pass
            try:
                if not isinstance(data, dict):
                    raise TypeError()
                componentsschemas_webhook_payload_union_type_2 = ButtonWebhookPayload.from_dict(data)



                return componentsschemas_webhook_payload_union_type_2
            except (TypeError, ValueError, AttributeError, KeyError):
                pass
            try:
                if not isinstance(data, dict):
                    raise TypeError()
                componentsschemas_webhook_payload_union_type_3 = ChatMemberWebhookPayload.from_dict(data)



                return componentsschemas_webhook_payload_union_type_3
            except (TypeError, ValueError, AttributeError, KeyError):
                pass
            if not isinstance(data, dict):
                raise TypeError()
            componentsschemas_webhook_payload_union_type_4 = CompanyMemberWebhookPayload.from_dict(data)



            return componentsschemas_webhook_payload_union_type_4

        payload = _parse_payload(d.pop("payload"))


        created_at = isoparse(d.pop("created_at"))




        webhook_event = cls(
            id=id,
            event_type=event_type,
            payload=payload,
            created_at=created_at,
        )


        webhook_event.additional_properties = d
        return webhook_event

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
