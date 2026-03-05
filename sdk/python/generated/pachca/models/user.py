from __future__ import annotations

from collections.abc import Mapping
from typing import Any, TypeVar, BinaryIO, TextIO, TYPE_CHECKING, Generator

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..types import UNSET, Unset

from ..models.invite_status import InviteStatus
from ..models.user_role import UserRole
from dateutil.parser import isoparse
from typing import cast
import datetime

if TYPE_CHECKING:
  from ..models.custom_property import CustomProperty
  from ..models.user_status import UserStatus





T = TypeVar("T", bound="User")



@_attrs_define
class User:
    """ Сотрудник

        Attributes:
            id (int): Идентификатор пользователя Example: 12.
            first_name (str): Имя Example: Олег.
            last_name (str): Фамилия Example: Петров.
            nickname (str): Имя пользователя
            email (str): Электронная почта Example: olegp@example.com.
            phone_number (str): Телефон
            department (str): Департамент Example: Продукт.
            title (str): Должность Example: CIO.
            role (UserRole): Роль пользователя в системе
            suspended (bool): Деактивация пользователя
            invite_status (InviteStatus): Статус приглашения пользователя
            list_tags (list[str]): Массив тегов, привязанных к сотруднику Example: ['Product', 'Design'].
            custom_properties (list[CustomProperty]): Дополнительные поля сотрудника
            user_status (UserStatus): Статус пользователя
            bot (bool): Является ботом
            sso (bool): Использует ли пользователь SSO
            created_at (datetime.datetime): Дата создания (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ Example:
                2020-06-08T09:32:57.000Z.
            last_activity_at (datetime.datetime): Дата последней активности пользователя (ISO-8601, UTC+0) в формате YYYY-
                MM-DDThh:mm:ss.sssZ Example: 2025-01-20T13:40:07.000Z.
            time_zone (str): Часовой пояс пользователя Example: Europe/Moscow.
            image_url (None | str): Ссылка на скачивание аватарки пользователя Example:
                https://app.pachca.com/users/12/photo.jpg.
     """

    id: int
    first_name: str
    last_name: str
    nickname: str
    email: str
    phone_number: str
    department: str
    title: str
    role: UserRole
    suspended: bool
    invite_status: InviteStatus
    list_tags: list[str]
    custom_properties: list[CustomProperty]
    user_status: UserStatus
    bot: bool
    sso: bool
    created_at: datetime.datetime
    last_activity_at: datetime.datetime
    time_zone: str
    image_url: None | str
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)





    def to_dict(self) -> dict[str, Any]:
        from ..models.custom_property import CustomProperty
        from ..models.user_status import UserStatus
        id = self.id

        first_name = self.first_name

        last_name = self.last_name

        nickname = self.nickname

        email = self.email

        phone_number = self.phone_number

        department = self.department

        title = self.title

        role = self.role.value

        suspended = self.suspended

        invite_status = self.invite_status.value

        list_tags = self.list_tags



        custom_properties = []
        for custom_properties_item_data in self.custom_properties:
            custom_properties_item = custom_properties_item_data.to_dict()
            custom_properties.append(custom_properties_item)



        user_status = self.user_status.to_dict()

        bot = self.bot

        sso = self.sso

        created_at = self.created_at.isoformat()

        last_activity_at = self.last_activity_at.isoformat()

        time_zone = self.time_zone

        image_url: None | str
        image_url = self.image_url


        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update({
            "id": id,
            "first_name": first_name,
            "last_name": last_name,
            "nickname": nickname,
            "email": email,
            "phone_number": phone_number,
            "department": department,
            "title": title,
            "role": role,
            "suspended": suspended,
            "invite_status": invite_status,
            "list_tags": list_tags,
            "custom_properties": custom_properties,
            "user_status": user_status,
            "bot": bot,
            "sso": sso,
            "created_at": created_at,
            "last_activity_at": last_activity_at,
            "time_zone": time_zone,
            "image_url": image_url,
        })

        return field_dict



    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        from ..models.custom_property import CustomProperty
        from ..models.user_status import UserStatus
        d = dict(src_dict)
        id = d.pop("id")

        first_name = d.pop("first_name")

        last_name = d.pop("last_name")

        nickname = d.pop("nickname")

        email = d.pop("email")

        phone_number = d.pop("phone_number")

        department = d.pop("department")

        title = d.pop("title")

        role = UserRole(d.pop("role"))




        suspended = d.pop("suspended")

        invite_status = InviteStatus(d.pop("invite_status"))




        list_tags = cast(list[str], d.pop("list_tags"))


        custom_properties = []
        _custom_properties = d.pop("custom_properties")
        for custom_properties_item_data in (_custom_properties):
            custom_properties_item = CustomProperty.from_dict(custom_properties_item_data)



            custom_properties.append(custom_properties_item)


        user_status = UserStatus.from_dict(d.pop("user_status"))




        bot = d.pop("bot")

        sso = d.pop("sso")

        created_at = isoparse(d.pop("created_at"))




        last_activity_at = isoparse(d.pop("last_activity_at"))




        time_zone = d.pop("time_zone")

        def _parse_image_url(data: object) -> None | str:
            if data is None:
                return data
            return cast(None | str, data)

        image_url = _parse_image_url(d.pop("image_url"))


        user = cls(
            id=id,
            first_name=first_name,
            last_name=last_name,
            nickname=nickname,
            email=email,
            phone_number=phone_number,
            department=department,
            title=title,
            role=role,
            suspended=suspended,
            invite_status=invite_status,
            list_tags=list_tags,
            custom_properties=custom_properties,
            user_status=user_status,
            bot=bot,
            sso=sso,
            created_at=created_at,
            last_activity_at=last_activity_at,
            time_zone=time_zone,
            image_url=image_url,
        )


        user.additional_properties = d
        return user

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
