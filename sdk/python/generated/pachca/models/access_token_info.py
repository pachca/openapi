from __future__ import annotations

from collections.abc import Mapping
from typing import Any, TypeVar, BinaryIO, TextIO, TYPE_CHECKING, Generator

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..types import UNSET, Unset

from ..models.o_auth_scope import OAuthScope
from dateutil.parser import isoparse
from typing import cast
import datetime






T = TypeVar("T", bound="AccessTokenInfo")



@_attrs_define
class AccessTokenInfo:
    """ Информация о текущем OAuth токене

        Attributes:
            id (int): Идентификатор токена Example: 4827.
            token (str): Маскированный токен (видны первые 8 и последние 4 символа) Example: cH5kR9mN...x7Qp.
            name (None | str): Пользовательское имя токена Example: Мой API токен.
            user_id (int): Идентификатор владельца токена Example: 12.
            scopes (list[OAuthScope]): Список скоупов токена
            created_at (datetime.datetime): Дата создания токена Example: 2025-01-15T10:30:00.000Z.
            revoked_at (datetime.datetime | None): Дата отзыва токена
            expires_in (int | None): Время жизни токена в секундах
            last_used_at (datetime.datetime | None): Дата последнего использования токена Example: 2025-02-24T14:20:00.000Z.
     """

    id: int
    token: str
    name: None | str
    user_id: int
    scopes: list[OAuthScope]
    created_at: datetime.datetime
    revoked_at: datetime.datetime | None
    expires_in: int | None
    last_used_at: datetime.datetime | None
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)





    def to_dict(self) -> dict[str, Any]:
        id = self.id

        token = self.token

        name: None | str
        name = self.name

        user_id = self.user_id

        scopes = []
        for scopes_item_data in self.scopes:
            scopes_item = scopes_item_data.value
            scopes.append(scopes_item)



        created_at = self.created_at.isoformat()

        revoked_at: None | str
        if isinstance(self.revoked_at, datetime.datetime):
            revoked_at = self.revoked_at.isoformat()
        else:
            revoked_at = self.revoked_at

        expires_in: int | None
        expires_in = self.expires_in

        last_used_at: None | str
        if isinstance(self.last_used_at, datetime.datetime):
            last_used_at = self.last_used_at.isoformat()
        else:
            last_used_at = self.last_used_at


        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update({
            "id": id,
            "token": token,
            "name": name,
            "user_id": user_id,
            "scopes": scopes,
            "created_at": created_at,
            "revoked_at": revoked_at,
            "expires_in": expires_in,
            "last_used_at": last_used_at,
        })

        return field_dict



    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        d = dict(src_dict)
        id = d.pop("id")

        token = d.pop("token")

        def _parse_name(data: object) -> None | str:
            if data is None:
                return data
            return cast(None | str, data)

        name = _parse_name(d.pop("name"))


        user_id = d.pop("user_id")

        scopes = []
        _scopes = d.pop("scopes")
        for scopes_item_data in (_scopes):
            scopes_item = OAuthScope(scopes_item_data)



            scopes.append(scopes_item)


        created_at = isoparse(d.pop("created_at"))




        def _parse_revoked_at(data: object) -> datetime.datetime | None:
            if data is None:
                return data
            try:
                if not isinstance(data, str):
                    raise TypeError()
                revoked_at_type_0 = isoparse(data)



                return revoked_at_type_0
            except (TypeError, ValueError, AttributeError, KeyError):
                pass
            return cast(datetime.datetime | None, data)

        revoked_at = _parse_revoked_at(d.pop("revoked_at"))


        def _parse_expires_in(data: object) -> int | None:
            if data is None:
                return data
            return cast(int | None, data)

        expires_in = _parse_expires_in(d.pop("expires_in"))


        def _parse_last_used_at(data: object) -> datetime.datetime | None:
            if data is None:
                return data
            try:
                if not isinstance(data, str):
                    raise TypeError()
                last_used_at_type_0 = isoparse(data)



                return last_used_at_type_0
            except (TypeError, ValueError, AttributeError, KeyError):
                pass
            return cast(datetime.datetime | None, data)

        last_used_at = _parse_last_used_at(d.pop("last_used_at"))


        access_token_info = cls(
            id=id,
            token=token,
            name=name,
            user_id=user_id,
            scopes=scopes,
            created_at=created_at,
            revoked_at=revoked_at,
            expires_in=expires_in,
            last_used_at=last_used_at,
        )


        access_token_info.additional_properties = d
        return access_token_info

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
