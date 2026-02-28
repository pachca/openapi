from __future__ import annotations

from collections.abc import Mapping
from typing import Any, TypeVar, BinaryIO, TextIO, TYPE_CHECKING, Generator

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..types import UNSET, Unset

from ..models.audit_event_key import AuditEventKey
from dateutil.parser import isoparse
from typing import cast
import datetime

if TYPE_CHECKING:
  from ..models.audit_details_chat_id import AuditDetailsChatId
  from ..models.audit_details_chat_permission import AuditDetailsChatPermission
  from ..models.audit_details_chat_renamed import AuditDetailsChatRenamed
  from ..models.audit_details_dlp import AuditDetailsDlp
  from ..models.audit_details_empty import AuditDetailsEmpty
  from ..models.audit_details_initiator import AuditDetailsInitiator
  from ..models.audit_details_inviter import AuditDetailsInviter
  from ..models.audit_details_kms import AuditDetailsKms
  from ..models.audit_details_role_changed import AuditDetailsRoleChanged
  from ..models.audit_details_search import AuditDetailsSearch
  from ..models.audit_details_tag_chat import AuditDetailsTagChat
  from ..models.audit_details_tag_name import AuditDetailsTagName
  from ..models.audit_details_token_scopes import AuditDetailsTokenScopes
  from ..models.audit_details_user_updated import AuditDetailsUserUpdated





T = TypeVar("T", bound="AuditEvent")



@_attrs_define
class AuditEvent:
    """ Событие аудита

        Attributes:
            id (str): Уникальный идентификатор события Example: a1b2c3d4-5e6f-7g8h-9i10-j11k12l13m14.
            created_at (datetime.datetime): Дата и время создания события (ISO-8601, UTC+0) в формате YYYY-MM-
                DDThh:mm:ss.sssZ Example: 2025-05-15T14:30:00.000Z.
            event_key (AuditEventKey): Тип аудит-события
            entity_id (str): Идентификатор затронутой сущности Example: 98765.
            entity_type (str): Тип затронутой сущности Example: User.
            actor_id (str): Идентификатор пользователя, выполнившего действие Example: 98765.
            actor_type (str): Тип актора Example: User.
            details (AuditDetailsChatId | AuditDetailsChatPermission | AuditDetailsChatRenamed | AuditDetailsDlp |
                AuditDetailsEmpty | AuditDetailsInitiator | AuditDetailsInviter | AuditDetailsKms | AuditDetailsRoleChanged |
                AuditDetailsSearch | AuditDetailsTagChat | AuditDetailsTagName | AuditDetailsTokenScopes |
                AuditDetailsUserUpdated): Дополнительные детали события аудита. Структура зависит от значения event_key
            ip_address (str): IP-адрес, с которого было выполнено действие Example: 192.168.1.100.
            user_agent (str): User agent клиента Example: Pachca/3.60.0 (co.staply.pachca; build:15; iOS 18.5.0)
                Alamofire/5.0.0.
     """

    id: str
    created_at: datetime.datetime
    event_key: AuditEventKey
    entity_id: str
    entity_type: str
    actor_id: str
    actor_type: str
    details: AuditDetailsChatId | AuditDetailsChatPermission | AuditDetailsChatRenamed | AuditDetailsDlp | AuditDetailsEmpty | AuditDetailsInitiator | AuditDetailsInviter | AuditDetailsKms | AuditDetailsRoleChanged | AuditDetailsSearch | AuditDetailsTagChat | AuditDetailsTagName | AuditDetailsTokenScopes | AuditDetailsUserUpdated
    ip_address: str
    user_agent: str
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)





    def to_dict(self) -> dict[str, Any]:
        from ..models.audit_details_chat_permission import AuditDetailsChatPermission
        from ..models.audit_details_token_scopes import AuditDetailsTokenScopes
        from ..models.audit_details_user_updated import AuditDetailsUserUpdated
        from ..models.audit_details_inviter import AuditDetailsInviter
        from ..models.audit_details_tag_name import AuditDetailsTagName
        from ..models.audit_details_chat_renamed import AuditDetailsChatRenamed
        from ..models.audit_details_kms import AuditDetailsKms
        from ..models.audit_details_tag_chat import AuditDetailsTagChat
        from ..models.audit_details_empty import AuditDetailsEmpty
        from ..models.audit_details_chat_id import AuditDetailsChatId
        from ..models.audit_details_dlp import AuditDetailsDlp
        from ..models.audit_details_search import AuditDetailsSearch
        from ..models.audit_details_role_changed import AuditDetailsRoleChanged
        from ..models.audit_details_initiator import AuditDetailsInitiator
        id = self.id

        created_at = self.created_at.isoformat()

        event_key = self.event_key.value

        entity_id = self.entity_id

        entity_type = self.entity_type

        actor_id = self.actor_id

        actor_type = self.actor_type

        details: dict[str, Any]
        if isinstance(self.details, AuditDetailsEmpty):
            details = self.details.to_dict()
        elif isinstance(self.details, AuditDetailsUserUpdated):
            details = self.details.to_dict()
        elif isinstance(self.details, AuditDetailsRoleChanged):
            details = self.details.to_dict()
        elif isinstance(self.details, AuditDetailsTagName):
            details = self.details.to_dict()
        elif isinstance(self.details, AuditDetailsInitiator):
            details = self.details.to_dict()
        elif isinstance(self.details, AuditDetailsInviter):
            details = self.details.to_dict()
        elif isinstance(self.details, AuditDetailsChatRenamed):
            details = self.details.to_dict()
        elif isinstance(self.details, AuditDetailsChatPermission):
            details = self.details.to_dict()
        elif isinstance(self.details, AuditDetailsTagChat):
            details = self.details.to_dict()
        elif isinstance(self.details, AuditDetailsChatId):
            details = self.details.to_dict()
        elif isinstance(self.details, AuditDetailsTokenScopes):
            details = self.details.to_dict()
        elif isinstance(self.details, AuditDetailsKms):
            details = self.details.to_dict()
        elif isinstance(self.details, AuditDetailsDlp):
            details = self.details.to_dict()
        else:
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
        from ..models.audit_details_chat_id import AuditDetailsChatId
        from ..models.audit_details_chat_permission import AuditDetailsChatPermission
        from ..models.audit_details_chat_renamed import AuditDetailsChatRenamed
        from ..models.audit_details_dlp import AuditDetailsDlp
        from ..models.audit_details_empty import AuditDetailsEmpty
        from ..models.audit_details_initiator import AuditDetailsInitiator
        from ..models.audit_details_inviter import AuditDetailsInviter
        from ..models.audit_details_kms import AuditDetailsKms
        from ..models.audit_details_role_changed import AuditDetailsRoleChanged
        from ..models.audit_details_search import AuditDetailsSearch
        from ..models.audit_details_tag_chat import AuditDetailsTagChat
        from ..models.audit_details_tag_name import AuditDetailsTagName
        from ..models.audit_details_token_scopes import AuditDetailsTokenScopes
        from ..models.audit_details_user_updated import AuditDetailsUserUpdated
        d = dict(src_dict)
        id = d.pop("id")

        created_at = isoparse(d.pop("created_at"))




        event_key = AuditEventKey(d.pop("event_key"))




        entity_id = d.pop("entity_id")

        entity_type = d.pop("entity_type")

        actor_id = d.pop("actor_id")

        actor_type = d.pop("actor_type")

        def _parse_details(data: object) -> AuditDetailsChatId | AuditDetailsChatPermission | AuditDetailsChatRenamed | AuditDetailsDlp | AuditDetailsEmpty | AuditDetailsInitiator | AuditDetailsInviter | AuditDetailsKms | AuditDetailsRoleChanged | AuditDetailsSearch | AuditDetailsTagChat | AuditDetailsTagName | AuditDetailsTokenScopes | AuditDetailsUserUpdated:
            try:
                if not isinstance(data, dict):
                    raise TypeError()
                componentsschemas_audit_event_details_union_type_0 = AuditDetailsEmpty.from_dict(data)



                return componentsschemas_audit_event_details_union_type_0
            except (TypeError, ValueError, AttributeError, KeyError):
                pass
            try:
                if not isinstance(data, dict):
                    raise TypeError()
                componentsschemas_audit_event_details_union_type_1 = AuditDetailsUserUpdated.from_dict(data)



                return componentsschemas_audit_event_details_union_type_1
            except (TypeError, ValueError, AttributeError, KeyError):
                pass
            try:
                if not isinstance(data, dict):
                    raise TypeError()
                componentsschemas_audit_event_details_union_type_2 = AuditDetailsRoleChanged.from_dict(data)



                return componentsschemas_audit_event_details_union_type_2
            except (TypeError, ValueError, AttributeError, KeyError):
                pass
            try:
                if not isinstance(data, dict):
                    raise TypeError()
                componentsschemas_audit_event_details_union_type_3 = AuditDetailsTagName.from_dict(data)



                return componentsschemas_audit_event_details_union_type_3
            except (TypeError, ValueError, AttributeError, KeyError):
                pass
            try:
                if not isinstance(data, dict):
                    raise TypeError()
                componentsschemas_audit_event_details_union_type_4 = AuditDetailsInitiator.from_dict(data)



                return componentsschemas_audit_event_details_union_type_4
            except (TypeError, ValueError, AttributeError, KeyError):
                pass
            try:
                if not isinstance(data, dict):
                    raise TypeError()
                componentsschemas_audit_event_details_union_type_5 = AuditDetailsInviter.from_dict(data)



                return componentsschemas_audit_event_details_union_type_5
            except (TypeError, ValueError, AttributeError, KeyError):
                pass
            try:
                if not isinstance(data, dict):
                    raise TypeError()
                componentsschemas_audit_event_details_union_type_6 = AuditDetailsChatRenamed.from_dict(data)



                return componentsschemas_audit_event_details_union_type_6
            except (TypeError, ValueError, AttributeError, KeyError):
                pass
            try:
                if not isinstance(data, dict):
                    raise TypeError()
                componentsschemas_audit_event_details_union_type_7 = AuditDetailsChatPermission.from_dict(data)



                return componentsschemas_audit_event_details_union_type_7
            except (TypeError, ValueError, AttributeError, KeyError):
                pass
            try:
                if not isinstance(data, dict):
                    raise TypeError()
                componentsschemas_audit_event_details_union_type_8 = AuditDetailsTagChat.from_dict(data)



                return componentsschemas_audit_event_details_union_type_8
            except (TypeError, ValueError, AttributeError, KeyError):
                pass
            try:
                if not isinstance(data, dict):
                    raise TypeError()
                componentsschemas_audit_event_details_union_type_9 = AuditDetailsChatId.from_dict(data)



                return componentsschemas_audit_event_details_union_type_9
            except (TypeError, ValueError, AttributeError, KeyError):
                pass
            try:
                if not isinstance(data, dict):
                    raise TypeError()
                componentsschemas_audit_event_details_union_type_10 = AuditDetailsTokenScopes.from_dict(data)



                return componentsschemas_audit_event_details_union_type_10
            except (TypeError, ValueError, AttributeError, KeyError):
                pass
            try:
                if not isinstance(data, dict):
                    raise TypeError()
                componentsschemas_audit_event_details_union_type_11 = AuditDetailsKms.from_dict(data)



                return componentsschemas_audit_event_details_union_type_11
            except (TypeError, ValueError, AttributeError, KeyError):
                pass
            try:
                if not isinstance(data, dict):
                    raise TypeError()
                componentsschemas_audit_event_details_union_type_12 = AuditDetailsDlp.from_dict(data)



                return componentsschemas_audit_event_details_union_type_12
            except (TypeError, ValueError, AttributeError, KeyError):
                pass
            if not isinstance(data, dict):
                raise TypeError()
            componentsschemas_audit_event_details_union_type_13 = AuditDetailsSearch.from_dict(data)



            return componentsschemas_audit_event_details_union_type_13

        details = _parse_details(d.pop("details"))


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
