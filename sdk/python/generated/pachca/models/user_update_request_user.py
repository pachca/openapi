from __future__ import annotations

from collections.abc import Mapping
from typing import Any, TypeVar, BinaryIO, TextIO, TYPE_CHECKING, Generator

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..types import UNSET, Unset

from ..models.user_update_request_user_role import UserUpdateRequestUserRole
from ..types import UNSET, Unset
from typing import cast

if TYPE_CHECKING:
  from ..models.user_update_request_user_custom_properties_item import UserUpdateRequestUserCustomPropertiesItem





T = TypeVar("T", bound="UserUpdateRequestUser")



@_attrs_define
class UserUpdateRequestUser:
    """ Собранный объект параметров редактируемого сотрудника

        Attributes:
            first_name (str | Unset): Имя Example: Олег.
            last_name (str | Unset): Фамилия Example: Петров.
            email (str | Unset): Электронная почта Example: olegpetrov@example.com.
            phone_number (str | Unset): Телефон Example: +79001234567.
            nickname (str | Unset): Имя пользователя Example: olegpetrov.
            department (str | Unset): Департамент Example: Отдел разработки.
            title (str | Unset): Должность Example: Старший разработчик.
            role (UserUpdateRequestUserRole | Unset): Уровень доступа Example: user.
            suspended (bool | Unset): Деактивация пользователя
            list_tags (list[str] | Unset): Массив тегов, привязываемых к сотруднику Example: ['Product'].
            custom_properties (list[UserUpdateRequestUserCustomPropertiesItem] | Unset): Задаваемые дополнительные поля
     """

    first_name: str | Unset = UNSET
    last_name: str | Unset = UNSET
    email: str | Unset = UNSET
    phone_number: str | Unset = UNSET
    nickname: str | Unset = UNSET
    department: str | Unset = UNSET
    title: str | Unset = UNSET
    role: UserUpdateRequestUserRole | Unset = UNSET
    suspended: bool | Unset = UNSET
    list_tags: list[str] | Unset = UNSET
    custom_properties: list[UserUpdateRequestUserCustomPropertiesItem] | Unset = UNSET
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)





    def to_dict(self) -> dict[str, Any]:
        from ..models.user_update_request_user_custom_properties_item import UserUpdateRequestUserCustomPropertiesItem
        first_name = self.first_name

        last_name = self.last_name

        email = self.email

        phone_number = self.phone_number

        nickname = self.nickname

        department = self.department

        title = self.title

        role: str | Unset = UNSET
        if not isinstance(self.role, Unset):
            role = self.role.value


        suspended = self.suspended

        list_tags: list[str] | Unset = UNSET
        if not isinstance(self.list_tags, Unset):
            list_tags = self.list_tags



        custom_properties: list[dict[str, Any]] | Unset = UNSET
        if not isinstance(self.custom_properties, Unset):
            custom_properties = []
            for custom_properties_item_data in self.custom_properties:
                custom_properties_item = custom_properties_item_data.to_dict()
                custom_properties.append(custom_properties_item)




        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update({
        })
        if first_name is not UNSET:
            field_dict["first_name"] = first_name
        if last_name is not UNSET:
            field_dict["last_name"] = last_name
        if email is not UNSET:
            field_dict["email"] = email
        if phone_number is not UNSET:
            field_dict["phone_number"] = phone_number
        if nickname is not UNSET:
            field_dict["nickname"] = nickname
        if department is not UNSET:
            field_dict["department"] = department
        if title is not UNSET:
            field_dict["title"] = title
        if role is not UNSET:
            field_dict["role"] = role
        if suspended is not UNSET:
            field_dict["suspended"] = suspended
        if list_tags is not UNSET:
            field_dict["list_tags"] = list_tags
        if custom_properties is not UNSET:
            field_dict["custom_properties"] = custom_properties

        return field_dict



    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        from ..models.user_update_request_user_custom_properties_item import UserUpdateRequestUserCustomPropertiesItem
        d = dict(src_dict)
        first_name = d.pop("first_name", UNSET)

        last_name = d.pop("last_name", UNSET)

        email = d.pop("email", UNSET)

        phone_number = d.pop("phone_number", UNSET)

        nickname = d.pop("nickname", UNSET)

        department = d.pop("department", UNSET)

        title = d.pop("title", UNSET)

        _role = d.pop("role", UNSET)
        role: UserUpdateRequestUserRole | Unset
        if isinstance(_role,  Unset):
            role = UNSET
        else:
            role = UserUpdateRequestUserRole(_role)




        suspended = d.pop("suspended", UNSET)

        list_tags = cast(list[str], d.pop("list_tags", UNSET))


        _custom_properties = d.pop("custom_properties", UNSET)
        custom_properties: list[UserUpdateRequestUserCustomPropertiesItem] | Unset = UNSET
        if _custom_properties is not UNSET:
            custom_properties = []
            for custom_properties_item_data in _custom_properties:
                custom_properties_item = UserUpdateRequestUserCustomPropertiesItem.from_dict(custom_properties_item_data)



                custom_properties.append(custom_properties_item)


        user_update_request_user = cls(
            first_name=first_name,
            last_name=last_name,
            email=email,
            phone_number=phone_number,
            nickname=nickname,
            department=department,
            title=title,
            role=role,
            suspended=suspended,
            list_tags=list_tags,
            custom_properties=custom_properties,
        )


        user_update_request_user.additional_properties = d
        return user_update_request_user

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
