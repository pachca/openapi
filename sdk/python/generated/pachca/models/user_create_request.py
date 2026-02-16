from __future__ import annotations

from collections.abc import Mapping
from typing import Any, TypeVar, BinaryIO, TextIO, TYPE_CHECKING, Generator

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..types import UNSET, Unset

from ..types import UNSET, Unset
from typing import cast

if TYPE_CHECKING:
  from ..models.user_create_request_user import UserCreateRequestUser





T = TypeVar("T", bound="UserCreateRequest")



@_attrs_define
class UserCreateRequest:
    """ Запрос на создание сотрудника

        Attributes:
            user (UserCreateRequestUser):
            skip_email_notify (bool | Unset): Пропуск этапа отправки приглашения сотруднику. Сотруднику не будет отправлено
                письмо на электронную почту с приглашением создать аккаунт. Полезно при предварительном создании аккаунтов перед
                входом через SSO. Example: True.
     """

    user: UserCreateRequestUser
    skip_email_notify: bool | Unset = UNSET
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)





    def to_dict(self) -> dict[str, Any]:
        from ..models.user_create_request_user import UserCreateRequestUser
        user = self.user.to_dict()

        skip_email_notify = self.skip_email_notify


        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update({
            "user": user,
        })
        if skip_email_notify is not UNSET:
            field_dict["skip_email_notify"] = skip_email_notify

        return field_dict



    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        from ..models.user_create_request_user import UserCreateRequestUser
        d = dict(src_dict)
        user = UserCreateRequestUser.from_dict(d.pop("user"))




        skip_email_notify = d.pop("skip_email_notify", UNSET)

        user_create_request = cls(
            user=user,
            skip_email_notify=skip_email_notify,
        )


        user_create_request.additional_properties = d
        return user_create_request

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
