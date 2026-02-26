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






T = TypeVar("T", bound="StatusUpdateRequestStatus")



@_attrs_define
class StatusUpdateRequestStatus:
    """ 
        Attributes:
            emoji (str): Emoji символ статуса
            title (str): Текст статуса
            expires_at (datetime.datetime | Unset): Срок жизни статуса (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ
            is_away (bool | Unset): Режим «Нет на месте»
     """

    emoji: str
    title: str
    expires_at: datetime.datetime | Unset = UNSET
    is_away: bool | Unset = UNSET
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)





    def to_dict(self) -> dict[str, Any]:
        emoji = self.emoji

        title = self.title

        expires_at: str | Unset = UNSET
        if not isinstance(self.expires_at, Unset):
            expires_at = self.expires_at.isoformat()

        is_away = self.is_away


        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update({
            "emoji": emoji,
            "title": title,
        })
        if expires_at is not UNSET:
            field_dict["expires_at"] = expires_at
        if is_away is not UNSET:
            field_dict["is_away"] = is_away

        return field_dict



    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        d = dict(src_dict)
        emoji = d.pop("emoji")

        title = d.pop("title")

        _expires_at = d.pop("expires_at", UNSET)
        expires_at: datetime.datetime | Unset
        if isinstance(_expires_at,  Unset):
            expires_at = UNSET
        else:
            expires_at = isoparse(_expires_at)




        is_away = d.pop("is_away", UNSET)

        status_update_request_status = cls(
            emoji=emoji,
            title=title,
            expires_at=expires_at,
            is_away=is_away,
        )


        status_update_request_status.additional_properties = d
        return status_update_request_status

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
