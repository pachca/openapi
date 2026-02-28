from __future__ import annotations

from collections.abc import Mapping
from typing import Any, TypeVar, BinaryIO, TextIO, TYPE_CHECKING, Generator

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..types import UNSET, Unset

from ..models.task_kind import TaskKind
from ..models.task_status import TaskStatus
from ..types import UNSET, Unset
from dateutil.parser import isoparse
from typing import cast
import datetime

if TYPE_CHECKING:
  from ..models.task_update_request_task_custom_properties_item import TaskUpdateRequestTaskCustomPropertiesItem





T = TypeVar("T", bound="TaskUpdateRequestTask")



@_attrs_define
class TaskUpdateRequestTask:
    """ Собранный объект параметров обновляемого напоминания

        Attributes:
            kind (TaskKind | Unset): Тип задачи
            content (str | Unset): Описание Example: Забрать со склада 21 заказ.
            due_at (datetime.datetime | Unset): Срок выполнения напоминания (ISO-8601) в формате YYYY-MM-DDThh:mm:ss.sssTZD.
                Если указано время 23:59:59.000, то напоминание будет создано на весь день (без указания времени). Example:
                2020-06-05T12:00:00.000+03:00.
            priority (int | Unset): Приоритет: 1, 2 (важно) или 3 (очень важно). Example: 2.
            performer_ids (list[int] | Unset): Массив идентификаторов пользователей, привязываемых к напоминанию как
                «ответственные» Example: [12].
            status (TaskStatus | Unset): Статус напоминания
            all_day (bool | Unset): Напоминание на весь день (без указания времени)
            done_at (datetime.datetime | Unset): Дата и время выполнения напоминания (ISO-8601, UTC+0) в формате YYYY-MM-
                DDThh:mm:ss.sssZ Example: 2020-06-05T12:00:00.000Z.
            custom_properties (list[TaskUpdateRequestTaskCustomPropertiesItem] | Unset): Задаваемые дополнительные поля
     """

    kind: TaskKind | Unset = UNSET
    content: str | Unset = UNSET
    due_at: datetime.datetime | Unset = UNSET
    priority: int | Unset = UNSET
    performer_ids: list[int] | Unset = UNSET
    status: TaskStatus | Unset = UNSET
    all_day: bool | Unset = UNSET
    done_at: datetime.datetime | Unset = UNSET
    custom_properties: list[TaskUpdateRequestTaskCustomPropertiesItem] | Unset = UNSET
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)





    def to_dict(self) -> dict[str, Any]:
        from ..models.task_update_request_task_custom_properties_item import TaskUpdateRequestTaskCustomPropertiesItem
        kind: str | Unset = UNSET
        if not isinstance(self.kind, Unset):
            kind = self.kind.value


        content = self.content

        due_at: str | Unset = UNSET
        if not isinstance(self.due_at, Unset):
            due_at = self.due_at.isoformat()

        priority = self.priority

        performer_ids: list[int] | Unset = UNSET
        if not isinstance(self.performer_ids, Unset):
            performer_ids = self.performer_ids



        status: str | Unset = UNSET
        if not isinstance(self.status, Unset):
            status = self.status.value


        all_day = self.all_day

        done_at: str | Unset = UNSET
        if not isinstance(self.done_at, Unset):
            done_at = self.done_at.isoformat()

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
        if kind is not UNSET:
            field_dict["kind"] = kind
        if content is not UNSET:
            field_dict["content"] = content
        if due_at is not UNSET:
            field_dict["due_at"] = due_at
        if priority is not UNSET:
            field_dict["priority"] = priority
        if performer_ids is not UNSET:
            field_dict["performer_ids"] = performer_ids
        if status is not UNSET:
            field_dict["status"] = status
        if all_day is not UNSET:
            field_dict["all_day"] = all_day
        if done_at is not UNSET:
            field_dict["done_at"] = done_at
        if custom_properties is not UNSET:
            field_dict["custom_properties"] = custom_properties

        return field_dict



    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        from ..models.task_update_request_task_custom_properties_item import TaskUpdateRequestTaskCustomPropertiesItem
        d = dict(src_dict)
        _kind = d.pop("kind", UNSET)
        kind: TaskKind | Unset
        if isinstance(_kind,  Unset):
            kind = UNSET
        else:
            kind = TaskKind(_kind)




        content = d.pop("content", UNSET)

        _due_at = d.pop("due_at", UNSET)
        due_at: datetime.datetime | Unset
        if isinstance(_due_at,  Unset):
            due_at = UNSET
        else:
            due_at = isoparse(_due_at)




        priority = d.pop("priority", UNSET)

        performer_ids = cast(list[int], d.pop("performer_ids", UNSET))


        _status = d.pop("status", UNSET)
        status: TaskStatus | Unset
        if isinstance(_status,  Unset):
            status = UNSET
        else:
            status = TaskStatus(_status)




        all_day = d.pop("all_day", UNSET)

        _done_at = d.pop("done_at", UNSET)
        done_at: datetime.datetime | Unset
        if isinstance(_done_at,  Unset):
            done_at = UNSET
        else:
            done_at = isoparse(_done_at)




        _custom_properties = d.pop("custom_properties", UNSET)
        custom_properties: list[TaskUpdateRequestTaskCustomPropertiesItem] | Unset = UNSET
        if _custom_properties is not UNSET:
            custom_properties = []
            for custom_properties_item_data in _custom_properties:
                custom_properties_item = TaskUpdateRequestTaskCustomPropertiesItem.from_dict(custom_properties_item_data)



                custom_properties.append(custom_properties_item)


        task_update_request_task = cls(
            kind=kind,
            content=content,
            due_at=due_at,
            priority=priority,
            performer_ids=performer_ids,
            status=status,
            all_day=all_day,
            done_at=done_at,
            custom_properties=custom_properties,
        )


        task_update_request_task.additional_properties = d
        return task_update_request_task

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
