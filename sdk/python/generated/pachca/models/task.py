from __future__ import annotations

from collections.abc import Mapping
from typing import Any, TypeVar, BinaryIO, TextIO, TYPE_CHECKING, Generator

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..types import UNSET, Unset

from ..models.task_kind import TaskKind
from ..models.task_status import TaskStatus
from dateutil.parser import isoparse
from typing import cast
import datetime

if TYPE_CHECKING:
  from ..models.custom_property import CustomProperty





T = TypeVar("T", bound="Task")



@_attrs_define
class Task:
    """ Напоминание

        Attributes:
            id (int): Идентификатор напоминания Example: 22283.
            kind (TaskKind): Тип задачи
            content (str): Описание Example: Забрать со склада 21 заказ.
            due_at (datetime.datetime | None): Срок выполнения напоминания (ISO-8601, UTC+0) в формате YYYY-MM-
                DDThh:mm:ss.sssZ Example: 2020-06-05T09:00:00.000Z.
            priority (int): Приоритет Example: 2.
            user_id (int): Идентификатор пользователя-создателя напоминания Example: 12.
            chat_id (int | None): Идентификатор чата, к которому привязано напоминание Example: 456.
            status (TaskStatus): Статус напоминания Example: undone.
            created_at (datetime.datetime): Дата и время создания напоминания (ISO-8601, UTC+0) в формате YYYY-MM-
                DDThh:mm:ss.sssZ Example: 2020-06-04T10:37:57.000Z.
            performer_ids (list[int]): Массив идентификаторов пользователей, привязанных к напоминанию как «ответственные»
                Example: [12].
            all_day (bool): Напоминание на весь день (без указания времени)
            custom_properties (list[CustomProperty]): Дополнительные поля напоминания
     """

    id: int
    kind: TaskKind
    content: str
    due_at: datetime.datetime | None
    priority: int
    user_id: int
    chat_id: int | None
    status: TaskStatus
    created_at: datetime.datetime
    performer_ids: list[int]
    all_day: bool
    custom_properties: list[CustomProperty]
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)





    def to_dict(self) -> dict[str, Any]:
        from ..models.custom_property import CustomProperty
        id = self.id

        kind = self.kind.value

        content = self.content

        due_at: None | str
        if isinstance(self.due_at, datetime.datetime):
            due_at = self.due_at.isoformat()
        else:
            due_at = self.due_at

        priority = self.priority

        user_id = self.user_id

        chat_id: int | None
        chat_id = self.chat_id

        status = self.status.value

        created_at = self.created_at.isoformat()

        performer_ids = self.performer_ids



        all_day = self.all_day

        custom_properties = []
        for custom_properties_item_data in self.custom_properties:
            custom_properties_item = custom_properties_item_data.to_dict()
            custom_properties.append(custom_properties_item)




        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update({
            "id": id,
            "kind": kind,
            "content": content,
            "due_at": due_at,
            "priority": priority,
            "user_id": user_id,
            "chat_id": chat_id,
            "status": status,
            "created_at": created_at,
            "performer_ids": performer_ids,
            "all_day": all_day,
            "custom_properties": custom_properties,
        })

        return field_dict



    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        from ..models.custom_property import CustomProperty
        d = dict(src_dict)
        id = d.pop("id")

        kind = TaskKind(d.pop("kind"))




        content = d.pop("content")

        def _parse_due_at(data: object) -> datetime.datetime | None:
            if data is None:
                return data
            try:
                if not isinstance(data, str):
                    raise TypeError()
                due_at_type_0 = isoparse(data)



                return due_at_type_0
            except (TypeError, ValueError, AttributeError, KeyError):
                pass
            return cast(datetime.datetime | None, data)

        due_at = _parse_due_at(d.pop("due_at"))


        priority = d.pop("priority")

        user_id = d.pop("user_id")

        def _parse_chat_id(data: object) -> int | None:
            if data is None:
                return data
            return cast(int | None, data)

        chat_id = _parse_chat_id(d.pop("chat_id"))


        status = TaskStatus(d.pop("status"))




        created_at = isoparse(d.pop("created_at"))




        performer_ids = cast(list[int], d.pop("performer_ids"))


        all_day = d.pop("all_day")

        custom_properties = []
        _custom_properties = d.pop("custom_properties")
        for custom_properties_item_data in (_custom_properties):
            custom_properties_item = CustomProperty.from_dict(custom_properties_item_data)



            custom_properties.append(custom_properties_item)


        task = cls(
            id=id,
            kind=kind,
            content=content,
            due_at=due_at,
            priority=priority,
            user_id=user_id,
            chat_id=chat_id,
            status=status,
            created_at=created_at,
            performer_ids=performer_ids,
            all_day=all_day,
            custom_properties=custom_properties,
        )


        task.additional_properties = d
        return task

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
