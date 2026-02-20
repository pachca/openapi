from __future__ import annotations

from collections.abc import Mapping
from typing import Any, TypeVar, BinaryIO, TextIO, TYPE_CHECKING, Generator

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..types import UNSET, Unset

from ..models.message_entity_type import MessageEntityType
from ..types import UNSET, Unset
from typing import cast

if TYPE_CHECKING:
  from ..models.button import Button
  from ..models.message_create_request_message_files_item import MessageCreateRequestMessageFilesItem





T = TypeVar("T", bound="MessageCreateRequestMessage")



@_attrs_define
class MessageCreateRequestMessage:
    """ Собранный объект параметров создаваемого сообщения

        Attributes:
            entity_id (int): Идентификатор сущности Example: 198.
            content (str): Текст сообщения Example: Вчера мы продали 756 футболок (что на 10% больше, чем в прошлое
                воскресенье).
            entity_type (MessageEntityType | Unset): Тип сущности для сообщений Default: MessageEntityType.DISCUSSION.
            files (list[MessageCreateRequestMessageFilesItem] | Unset): Прикрепляемые файлы
            buttons (list[list[Button]] | Unset): Массив строк, каждая из которых представлена массивом кнопок. Максимум 100
                кнопок у сообщения, до 8 кнопок в строке.
            parent_message_id (int | Unset): Идентификатор сообщения. Указывается в случае, если вы отправляете ответ на
                другое сообщение. Example: 194270.
            display_avatar_url (str | Unset): Ссылка на специальную аватарку отправителя для этого сообщения. Использование
                этого поля возможно только с access_token бота. Example: https://example.com/avatar.png.
            display_name (str | Unset): Полное специальное имя отправителя для этого сообщения. Использование этого поля
                возможно только с access_token бота. Example: Бот Поддержки.
            skip_invite_mentions (bool | Unset): Пропуск добавления упоминаемых пользователей в тред. Работает только при
                отправке сообщения в тред. Default: False.
            link_preview (bool | Unset): Отображение предпросмотра первой найденной ссылки в тексте сообщения Default:
                False.
     """

    entity_id: int
    content: str
    entity_type: MessageEntityType | Unset = MessageEntityType.DISCUSSION
    files: list[MessageCreateRequestMessageFilesItem] | Unset = UNSET
    buttons: list[list[Button]] | Unset = UNSET
    parent_message_id: int | Unset = UNSET
    display_avatar_url: str | Unset = UNSET
    display_name: str | Unset = UNSET
    skip_invite_mentions: bool | Unset = False
    link_preview: bool | Unset = False
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)





    def to_dict(self) -> dict[str, Any]:
        from ..models.message_create_request_message_files_item import MessageCreateRequestMessageFilesItem
        from ..models.button import Button
        entity_id = self.entity_id

        content = self.content

        entity_type: str | Unset = UNSET
        if not isinstance(self.entity_type, Unset):
            entity_type = self.entity_type.value


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



        parent_message_id = self.parent_message_id

        display_avatar_url = self.display_avatar_url

        display_name = self.display_name

        skip_invite_mentions = self.skip_invite_mentions

        link_preview = self.link_preview


        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update({
            "entity_id": entity_id,
            "content": content,
        })
        if entity_type is not UNSET:
            field_dict["entity_type"] = entity_type
        if files is not UNSET:
            field_dict["files"] = files
        if buttons is not UNSET:
            field_dict["buttons"] = buttons
        if parent_message_id is not UNSET:
            field_dict["parent_message_id"] = parent_message_id
        if display_avatar_url is not UNSET:
            field_dict["display_avatar_url"] = display_avatar_url
        if display_name is not UNSET:
            field_dict["display_name"] = display_name
        if skip_invite_mentions is not UNSET:
            field_dict["skip_invite_mentions"] = skip_invite_mentions
        if link_preview is not UNSET:
            field_dict["link_preview"] = link_preview

        return field_dict



    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        from ..models.button import Button
        from ..models.message_create_request_message_files_item import MessageCreateRequestMessageFilesItem
        d = dict(src_dict)
        entity_id = d.pop("entity_id")

        content = d.pop("content")

        _entity_type = d.pop("entity_type", UNSET)
        entity_type: MessageEntityType | Unset
        if isinstance(_entity_type,  Unset):
            entity_type = UNSET
        else:
            entity_type = MessageEntityType(_entity_type)




        _files = d.pop("files", UNSET)
        files: list[MessageCreateRequestMessageFilesItem] | Unset = UNSET
        if _files is not UNSET:
            files = []
            for files_item_data in _files:
                files_item = MessageCreateRequestMessageFilesItem.from_dict(files_item_data)



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


        parent_message_id = d.pop("parent_message_id", UNSET)

        display_avatar_url = d.pop("display_avatar_url", UNSET)

        display_name = d.pop("display_name", UNSET)

        skip_invite_mentions = d.pop("skip_invite_mentions", UNSET)

        link_preview = d.pop("link_preview", UNSET)

        message_create_request_message = cls(
            entity_id=entity_id,
            content=content,
            entity_type=entity_type,
            files=files,
            buttons=buttons,
            parent_message_id=parent_message_id,
            display_avatar_url=display_avatar_url,
            display_name=display_name,
            skip_invite_mentions=skip_invite_mentions,
            link_preview=link_preview,
        )


        message_create_request_message.additional_properties = d
        return message_create_request_message

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
