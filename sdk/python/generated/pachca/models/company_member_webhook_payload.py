from __future__ import annotations

from collections.abc import Mapping
from typing import Any, TypeVar, BinaryIO, TextIO, TYPE_CHECKING, Generator

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..types import UNSET, Unset

from ..models.company_member_webhook_payload_type import CompanyMemberWebhookPayloadType
from ..models.user_event_type import UserEventType
from dateutil.parser import isoparse
from typing import cast
import datetime






T = TypeVar("T", bound="CompanyMemberWebhookPayload")



@_attrs_define
class CompanyMemberWebhookPayload:
    """ Структура исходящего вебхука об участниках пространства

        Attributes:
            type_ (CompanyMemberWebhookPayloadType): Тип объекта Example: company_member.
            event (UserEventType): Тип события webhook для пользователей
            user_ids (list[int]): Массив идентификаторов пользователей, с которыми произошло событие Example: [2345, 6789].
            created_at (datetime.datetime): Дата и время события (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ
                Example: 2025-05-15T14:30:00.000Z.
            webhook_timestamp (int): Дата и время отправки вебхука (UTC+0) в формате UNIX Example: 1747574400.
     """

    type_: CompanyMemberWebhookPayloadType
    event: UserEventType
    user_ids: list[int]
    created_at: datetime.datetime
    webhook_timestamp: int
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)





    def to_dict(self) -> dict[str, Any]:
        type_ = self.type_.value

        event = self.event.value

        user_ids = self.user_ids



        created_at = self.created_at.isoformat()

        webhook_timestamp = self.webhook_timestamp


        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update({
            "type": type_,
            "event": event,
            "user_ids": user_ids,
            "created_at": created_at,
            "webhook_timestamp": webhook_timestamp,
        })

        return field_dict



    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        d = dict(src_dict)
        type_ = CompanyMemberWebhookPayloadType(d.pop("type"))




        event = UserEventType(d.pop("event"))




        user_ids = cast(list[int], d.pop("user_ids"))


        created_at = isoparse(d.pop("created_at"))




        webhook_timestamp = d.pop("webhook_timestamp")

        company_member_webhook_payload = cls(
            type_=type_,
            event=event,
            user_ids=user_ids,
            created_at=created_at,
            webhook_timestamp=webhook_timestamp,
        )


        company_member_webhook_payload.additional_properties = d
        return company_member_webhook_payload

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
