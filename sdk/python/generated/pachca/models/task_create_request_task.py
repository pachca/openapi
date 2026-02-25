from __future__ import annotations

from collections.abc import Mapping
from typing import Any, TypeVar, BinaryIO, TextIO, TYPE_CHECKING, Generator

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..types import UNSET, Unset

from ..models.task_kind import TaskKind
from ..types import UNSET, Unset
from dateutil.parser import isoparse
from typing import cast
import datetime

if TYPE_CHECKING:
  from ..models.task_create_request_task_custom_properties_item import TaskCreateRequestTaskCustomPropertiesItem





T = TypeVar("T", bound="TaskCreateRequestTask")



@_attrs_define
class TaskCreateRequestTask:
    """ Собранный объект параметров создаваемого напоминания

        Attributes:
            kind (TaskKind): Тип задачи
            content (str | Unset): Описание (по умолчанию — название типа) Example: Забрать со склада 21 заказ.
            due_at (datetime.datetime | Unset): Срок выполнения напоминания (ISO-8601) в формате YYYY-MM-DDThh:mm:ss.sssTZD.
                Если указано время 23:59:59.000, то напоминание будет создано на весь день (без указания времени). Example:
                2020-06-05T12:00:00.000+03:00.
            priority (int | Unset): Приоритет: 1, 2 (важно) или 3 (очень важно). Default: 1. Example: 2.
            performer_ids (list[int] | Unset): Массив идентификаторов пользователей, привязываемых к напоминанию как
                «ответственные» (по умолчанию ответственным назначается вы)
            chat_id (int | Unset): Идентификатор чата, к которому привязывается напоминание Example: 456.
            all_day (bool | Unset): Напоминание на весь день (без указания времени)
            custom_properties (list[TaskCreateRequestTaskCustomPropertiesItem] | Unset): Задаваемые дополнительные поля
     """

    kind: TaskKind
    content: str | Unset = UNSET
    due_at: datetime.datetime | Unset = UNSET
    priority: int | Unset = 1
    performer_ids: list[int] | Unset = UNSET
    chat_id: int | Unset = UNSET
    all_day: bool | Unset = UNSET
    custom_properties: list[TaskCreateRequestTaskCustomPropertiesItem] | Unset = UNSET
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)





    def to_dict(self) -> dict[str, Any]:
        from ..models.task_create_request_task_custom_properties_item import TaskCreateRequestTaskCustomPropertiesItem
        kind = self.kind.value

        content = self.content

        due_at: str | Unset = UNSET
        if not isinstance(self.due_at, Unset):
            due_at = self.due_at.isoformat()

        priority = self.priority

        performer_ids: list[int] | Unset = UNSET
        if not isinstance(self.performer_ids, Unset):
            performer_ids = self.performer_ids



        chat_id = self.chat_id

        all_day = self.all_day

        custom_properties: list[dict[str, Any]] | Unset = UNSET
        if not isinstance(self.custom_properties, Unset):
            custom_properties = []
            for custom_properties_item_data in self.custom_properties:
                custom_properties_item = custom_properties_item_data.to_dict()
                custom_properties.append(custom_properties_item)




        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update({
            "kind": kind,
        })
        if content is not UNSET:
            field_dict["content"] = content
        if due_at is not UNSET:
            field_dict["due_at"] = due_at
        if priority is not UNSET:
            field_dict["priority"] = priority
        if performer_ids is not UNSET:
            field_dict["performer_ids"] = performer_ids
        if chat_id is not UNSET:
            field_dict["chat_id"] = chat_id
        if all_day is not UNSET:
            field_dict["all_day"] = all_day
        if custom_properties is not UNSET:
            field_dict["custom_properties"] = custom_properties

        return field_dict



    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        from ..models.task_create_request_task_custom_properties_item import TaskCreateRequestTaskCustomPropertiesItem
        d = dict(src_dict)
        kind = TaskKind(d.pop("kind"))




        content = d.pop("content", UNSET)

        _due_at = d.pop("due_at", UNSET)
        due_at: datetime.datetime | Unset
        if isinstance(_due_at,  Unset):
            due_at = UNSET
        else:
            due_at = isoparse(_due_at)




        priority = d.pop("priority", UNSET)

        performer_ids = cast(list[int], d.pop("performer_ids", UNSET))


        chat_id = d.pop("chat_id", UNSET)

        all_day = d.pop("all_day", UNSET)

        _custom_properties = d.pop("custom_properties", UNSET)
        custom_properties: list[TaskCreateRequestTaskCustomPropertiesItem] | Unset = UNSET
        if _custom_properties is not UNSET:
            custom_properties = []
            for custom_properties_item_data in _custom_properties:
                custom_properties_item = TaskCreateRequestTaskCustomPropertiesItem.from_dict(custom_properties_item_data)



                custom_properties.append(custom_properties_item)


        task_create_request_task = cls(
            kind=kind,
            content=content,
            due_at=due_at,
            priority=priority,
            performer_ids=performer_ids,
            chat_id=chat_id,
            all_day=all_day,
            custom_properties=custom_properties,
        )


        task_create_request_task.additional_properties = d
        return task_create_request_task

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
