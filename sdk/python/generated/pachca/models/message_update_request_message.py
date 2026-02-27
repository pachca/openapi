from __future__ import annotations

from collections.abc import Mapping
from typing import Any, TypeVar, BinaryIO, TextIO, TYPE_CHECKING, Generator

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..types import UNSET, Unset

from ..types import UNSET, Unset
from typing import cast

if TYPE_CHECKING:
  from ..models.button import Button
  from ..models.message_update_request_message_files_item import MessageUpdateRequestMessageFilesItem





T = TypeVar("T", bound="MessageUpdateRequestMessage")



@_attrs_define
class MessageUpdateRequestMessage:
    """ Собранный объект параметров редактируемого сообщения

        Attributes:
            content (str | Unset): Текст сообщения Example: Вот попробуйте написать правильно это с первого раза: Будущий,
                Полощи, Прийти, Грейпфрут, Мозаика, Бюллетень, Дуршлаг, Винегрет..
            files (list[MessageUpdateRequestMessageFilesItem] | Unset): Прикрепляемые файлы
            buttons (list[list[Button]] | Unset): Массив строк, каждая из которых представлена массивом кнопок. Максимум 100
                кнопок у сообщения, до 8 кнопок в строке. Для удаления кнопок пришлите пустой массив.
            display_avatar_url (str | Unset): Ссылка на специальную аватарку отправителя для этого сообщения. Использование
                этого поля возможно только с access_token бота. Example: https://example.com/avatar.png.
            display_name (str | Unset): Полное специальное имя отправителя для этого сообщения. Использование этого поля
                возможно только с access_token бота. Example: Бот Поддержки.
     """

    content: str | Unset = UNSET
    files: list[MessageUpdateRequestMessageFilesItem] | Unset = UNSET
    buttons: list[list[Button]] | Unset = UNSET
    display_avatar_url: str | Unset = UNSET
    display_name: str | Unset = UNSET
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)





    def to_dict(self) -> dict[str, Any]:
        from ..models.message_update_request_message_files_item import MessageUpdateRequestMessageFilesItem
        from ..models.button import Button
        content = self.content

        files: list[dict[str, Any]] | Unset = UNSET
        if not isinstance(self.files, Unset):
            files = []
            for files_item_data in self.files:
                files_item = files_item_data.to_dict()
                files.append(files_item)



        buttons: list[list[dict[str, Any]]] | Unset = UNSET
        if not isinstance(self.buttons, Unset):
            buttons = []
            for buttons_item_data in self.buttons:
                buttons_item = []
                for buttons_item_item_data in buttons_item_data:
                    buttons_item_item = buttons_item_item_data.to_dict()
                    buttons_item.append(buttons_item_item)


                buttons.append(buttons_item)



        display_avatar_url = self.display_avatar_url

        display_name = self.display_name


        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update({
        })
        if content is not UNSET:
            field_dict["content"] = content
        if files is not UNSET:
            field_dict["files"] = files
        if buttons is not UNSET:
            field_dict["buttons"] = buttons
        if display_avatar_url is not UNSET:
            field_dict["display_avatar_url"] = display_avatar_url
        if display_name is not UNSET:
            field_dict["display_name"] = display_name

        return field_dict



    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        from ..models.button import Button
        from ..models.message_update_request_message_files_item import MessageUpdateRequestMessageFilesItem
        d = dict(src_dict)
        content = d.pop("content", UNSET)

        _files = d.pop("files", UNSET)
        files: list[MessageUpdateRequestMessageFilesItem] | Unset = UNSET
        if _files is not UNSET:
            files = []
            for files_item_data in _files:
                files_item = MessageUpdateRequestMessageFilesItem.from_dict(files_item_data)



                files.append(files_item)


        _buttons = d.pop("buttons", UNSET)
        buttons: list[list[Button]] | Unset = UNSET
        if _buttons is not UNSET:
            buttons = []
            for buttons_item_data in _buttons:
                buttons_item = []
                _buttons_item = buttons_item_data
                for buttons_item_item_data in (_buttons_item):
                    buttons_item_item = Button.from_dict(buttons_item_item_data)



                    buttons_item.append(buttons_item_item)

                buttons.append(buttons_item)


        display_avatar_url = d.pop("display_avatar_url", UNSET)

        display_name = d.pop("display_name", UNSET)

        message_update_request_message = cls(
            content=content,
            files=files,
            buttons=buttons,
            display_avatar_url=display_avatar_url,
            display_name=display_name,
        )


        message_update_request_message.additional_properties = d
        return message_update_request_message

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
