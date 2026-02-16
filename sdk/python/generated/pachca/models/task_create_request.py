from __future__ import annotations

from collections.abc import Mapping
from typing import Any, TypeVar, BinaryIO, TextIO, TYPE_CHECKING, Generator

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..types import UNSET, Unset

from typing import cast

if TYPE_CHECKING:
  from ..models.task_create_request_task import TaskCreateRequestTask





T = TypeVar("T", bound="TaskCreateRequest")



@_attrs_define
class TaskCreateRequest:
    """ Запрос на создание напоминания

        Attributes:
            task (TaskCreateRequestTask): Собранный объект параметров создаваемого напоминания
     """

    task: TaskCreateRequestTask
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)





    def to_dict(self) -> dict[str, Any]:
        from ..models.task_create_request_task import TaskCreateRequestTask
        task = self.task.to_dict()


        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update({
            "task": task,
        })

        return field_dict



    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        from ..models.task_create_request_task import TaskCreateRequestTask
        d = dict(src_dict)
        task = TaskCreateRequestTask.from_dict(d.pop("task"))




        task_create_request = cls(
            task=task,
        )


        task_create_request.additional_properties = d
        return task_create_request

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
