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
  from ..models.audit_event_details import AuditEventDetails





T = TypeVar("T", bound="AuditEvent")



@_attrs_define
class AuditEvent:
    """ Событие аудита

        Attributes:
            id (str): Уникальный идентификатор события Example: a1b2c3d4-5e6f-7g8h-9i10-j11k12l13m14.
            created_at (datetime.datetime): Дата и время создания события (ISO-8601, UTC+0) в формате YYYY-MM-
                DDThh:mm:ss.sssZ Example: 2025-05-15T14:30:00.000Z.
            event_key (str): Ключ типа события Example: user_chat_join.
            entity_id (str): Идентификатор затронутой сущности Example: 12345678.
            entity_type (str): Тип затронутой сущности Example: Chat.
            actor_id (str): Идентификатор пользователя, выполнившего действие Example: 98765.
            actor_type (str): Тип актора Example: User.
            details (AuditEventDetails): Дополнительные детали события Example: {'inviter_id': '45678'}.
            ip_address (str): IP-адрес, с которого было выполнено действие Example: 192.168.1.100.
            user_agent (str): User agent клиента Example: Pachca/3.60.0 (co.staply.pachca; build:15; iOS 18.5.0)
                Alamofire/5.0.0.
     """

    id: str
    created_at: datetime.datetime
    event_key: str
    entity_id: str
    entity_type: str
    actor_id: str
    actor_type: str
    details: AuditEventDetails
    ip_address: str
    user_agent: str
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)





    def to_dict(self) -> dict[str, Any]:
        from ..models.audit_event_details import AuditEventDetails
        id = self.id

        created_at = self.created_at.isoformat()

        event_key = self.event_key

        entity_id = self.entity_id

        entity_type = self.entity_type

        actor_id = self.actor_id

        actor_type = self.actor_type

        details = self.details.to_dict()

        ip_address = self.ip_address

        user_agent = self.user_agent


        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update({
            "id": id,
            "created_at": created_at,
            "event_key": event_key,
            "entity_id": entity_id,
            "entity_type": entity_type,
            "actor_id": actor_id,
            "actor_type": actor_type,
            "details": details,
            "ip_address": ip_address,
            "user_agent": user_agent,
        })

        return field_dict



    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        from ..models.audit_event_details import AuditEventDetails
        d = dict(src_dict)
        id = d.pop("id")

        created_at = isoparse(d.pop("created_at"))




        event_key = d.pop("event_key")

        entity_id = d.pop("entity_id")

        entity_type = d.pop("entity_type")

        actor_id = d.pop("actor_id")

        actor_type = d.pop("actor_type")

        details = AuditEventDetails.from_dict(d.pop("details"))




        ip_address = d.pop("ip_address")

        user_agent = d.pop("user_agent")

        audit_event = cls(
            id=id,
            created_at=created_at,
            event_key=event_key,
            entity_id=entity_id,
            entity_type=entity_type,
            actor_id=actor_id,
            actor_type=actor_type,
            details=details,
            ip_address=ip_address,
            user_agent=user_agent,
        )


        audit_event.additional_properties = d
        return audit_event

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
