from __future__ import annotations

from collections.abc import Mapping
from typing import Any, TypeVar, BinaryIO, TextIO, TYPE_CHECKING, Generator

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..types import UNSET, Unset

from ..types import UNSET, Unset
from dateutil.parser import isoparse
from typing import cast
import datetime






T = TypeVar("T", bound="ExportRequest")



@_attrs_define
class ExportRequest:
    """ Запрос на экспорт сообщений

        Attributes:
            start_at (datetime.date): Дата начала для экспорта (ISO-8601, UTC+0) в формате YYYY-MM-DD Example: 2025-03-20.
            end_at (datetime.date): Дата окончания для экспорта (ISO-8601, UTC+0) в формате YYYY-MM-DD Example: 2025-03-20.
            webhook_url (str | Unset): Адрес, на который будет отправлен вебхук по завершению экспорта Example:
                https://webhook.site/9227d3b8-6e82-4e64-bf5d-ad972ad270f2.
            chat_ids (list[int] | Unset): Массив идентификаторов чатов. Указывается, если нужно получить сообщения только
                некоторых чатов. Example: [1381521].
            skip_chats_file (bool | Unset): Пропуск формирования файла со списком чатов (chats.json)
     """

    start_at: datetime.date
    end_at: datetime.date
    webhook_url: str | Unset = UNSET
    chat_ids: list[int] | Unset = UNSET
    skip_chats_file: bool | Unset = UNSET
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)





    def to_dict(self) -> dict[str, Any]:
        start_at = self.start_at.isoformat()

        end_at = self.end_at.isoformat()

        webhook_url = self.webhook_url

        chat_ids: list[int] | Unset = UNSET
        if not isinstance(self.chat_ids, Unset):
            chat_ids = self.chat_ids



        skip_chats_file = self.skip_chats_file


        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update({
            "start_at": start_at,
            "end_at": end_at,
        })
        if webhook_url is not UNSET:
            field_dict["webhook_url"] = webhook_url
        if chat_ids is not UNSET:
            field_dict["chat_ids"] = chat_ids
        if skip_chats_file is not UNSET:
            field_dict["skip_chats_file"] = skip_chats_file

        return field_dict



    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        d = dict(src_dict)
        start_at = isoparse(d.pop("start_at")).date()




        end_at = isoparse(d.pop("end_at")).date()




        webhook_url = d.pop("webhook_url", UNSET)

        chat_ids = cast(list[int], d.pop("chat_ids", UNSET))


        skip_chats_file = d.pop("skip_chats_file", UNSET)

        export_request = cls(
            start_at=start_at,
            end_at=end_at,
            webhook_url=webhook_url,
            chat_ids=chat_ids,
            skip_chats_file=skip_chats_file,
        )


        export_request.additional_properties = d
        return export_request

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
