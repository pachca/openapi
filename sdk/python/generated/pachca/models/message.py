from __future__ import annotations

from collections.abc import Mapping
from typing import Any, TypeVar, BinaryIO, TextIO, TYPE_CHECKING, Generator

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..types import UNSET, Unset

from ..models.message_entity_type import MessageEntityType
from dateutil.parser import isoparse
from typing import cast
import datetime

if TYPE_CHECKING:
  from ..models.button import Button
  from ..models.file import File
  from ..models.forwarding import Forwarding
  from ..models.thread import Thread





T = TypeVar("T", bound="Message")



@_attrs_define
class Message:
    """ Сообщение

        Attributes:
            id (int): Идентификатор сообщения Example: 194275.
            entity_type (MessageEntityType): Тип сущности для сообщений
            entity_id (int): Идентификатор сущности, к которой относится сообщение (беседы/канала, треда или пользователя)
                Example: 334.
            chat_id (int): Идентификатор чата, в котором находится сообщение Example: 334.
            content (str): Текст сообщения Example: Вчера мы продали 756 футболок (что на 10% больше, чем в прошлое
                воскресенье).
            user_id (int): Идентификатор пользователя, создавшего сообщение Example: 185.
            created_at (datetime.datetime): Дата и время создания сообщения (ISO-8601, UTC+0) в формате YYYY-MM-
                DDThh:mm:ss.sssZ Example: 2021-08-28T15:57:23.000Z.
            url (str): Прямая ссылка на сообщение Example: https://app.pachca.com/chats/334?message=194275.
            files (list[File]): Прикрепленные файлы
            buttons (list[list[Button]]): Массив строк, каждая из которых представлена массивом кнопок
            thread (Thread): Тред
            forwarding (Forwarding): Информация о пересланном сообщении
            parent_message_id (int | None): Идентификатор сообщения, к которому написан ответ
            display_avatar_url (None | str): Ссылка на аватарку отправителя сообщения
            display_name (None | str): Полное имя отправителя сообщения
     """

    id: int
    entity_type: MessageEntityType
    entity_id: int
    chat_id: int
    content: str
    user_id: int
    created_at: datetime.datetime
    url: str
    files: list[File]
    buttons: list[list[Button]]
    thread: Thread
    forwarding: Forwarding
    parent_message_id: int | None
    display_avatar_url: None | str
    display_name: None | str
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)





    def to_dict(self) -> dict[str, Any]:
        from ..models.thread import Thread
        from ..models.forwarding import Forwarding
        from ..models.file import File
        from ..models.button import Button
        id = self.id

        entity_type = self.entity_type.value

        entity_id = self.entity_id

        chat_id = self.chat_id

        content = self.content

        user_id = self.user_id

        created_at = self.created_at.isoformat()

        url = self.url

        files = []
        for files_item_data in self.files:
            files_item = files_item_data.to_dict()
            files.append(files_item)



        buttons = []
        for buttons_item_data in self.buttons:
            buttons_item = []
            for buttons_item_item_data in buttons_item_data:
                buttons_item_item = buttons_item_item_data.to_dict()
                buttons_item.append(buttons_item_item)


            buttons.append(buttons_item)



        thread = self.thread.to_dict()

        forwarding = self.forwarding.to_dict()

        parent_message_id: int | None
        parent_message_id = self.parent_message_id

        display_avatar_url: None | str
        display_avatar_url = self.display_avatar_url

        display_name: None | str
        display_name = self.display_name


        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update({
            "id": id,
            "entity_type": entity_type,
            "entity_id": entity_id,
            "chat_id": chat_id,
            "content": content,
            "user_id": user_id,
            "created_at": created_at,
            "url": url,
            "files": files,
            "buttons": buttons,
            "thread": thread,
            "forwarding": forwarding,
            "parent_message_id": parent_message_id,
            "display_avatar_url": display_avatar_url,
            "display_name": display_name,
        })

        return field_dict



    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        from ..models.button import Button
        from ..models.file import File
        from ..models.forwarding import Forwarding
        from ..models.thread import Thread
        d = dict(src_dict)
        id = d.pop("id")

        entity_type = MessageEntityType(d.pop("entity_type"))




        entity_id = d.pop("entity_id")

        chat_id = d.pop("chat_id")

        content = d.pop("content")

        user_id = d.pop("user_id")

        created_at = isoparse(d.pop("created_at"))




        url = d.pop("url")

        files = []
        _files = d.pop("files")
        for files_item_data in (_files):
            files_item = File.from_dict(files_item_data)



            files.append(files_item)


        buttons = []
        _buttons = d.pop("buttons")
        for buttons_item_data in (_buttons):
            buttons_item = []
            _buttons_item = buttons_item_data
            for buttons_item_item_data in (_buttons_item):
                buttons_item_item = Button.from_dict(buttons_item_item_data)



                buttons_item.append(buttons_item_item)

            buttons.append(buttons_item)


        thread = Thread.from_dict(d.pop("thread"))




        forwarding = Forwarding.from_dict(d.pop("forwarding"))




        def _parse_parent_message_id(data: object) -> int | None:
            if data is None:
                return data
            return cast(int | None, data)

        parent_message_id = _parse_parent_message_id(d.pop("parent_message_id"))


        def _parse_display_avatar_url(data: object) -> None | str:
            if data is None:
                return data
            return cast(None | str, data)

        display_avatar_url = _parse_display_avatar_url(d.pop("display_avatar_url"))


        def _parse_display_name(data: object) -> None | str:
            if data is None:
                return data
            return cast(None | str, data)

        display_name = _parse_display_name(d.pop("display_name"))


        message = cls(
            id=id,
            entity_type=entity_type,
            entity_id=entity_id,
            chat_id=chat_id,
            content=content,
            user_id=user_id,
            created_at=created_at,
            url=url,
            files=files,
            buttons=buttons,
            thread=thread,
            forwarding=forwarding,
            parent_message_id=parent_message_id,
            display_avatar_url=display_avatar_url,
            display_name=display_name,
        )


        message.additional_properties = d
        return message

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
