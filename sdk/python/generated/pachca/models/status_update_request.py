from __future__ import annotations

from collections.abc import Mapping
from typing import Any, TypeVar, BinaryIO, TextIO, TYPE_CHECKING, Generator

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..types import UNSET, Unset

from typing import cast

if TYPE_CHECKING:
  from ..models.status_update_request_status import StatusUpdateRequestStatus





T = TypeVar("T", bound="StatusUpdateRequest")



@_attrs_define
class StatusUpdateRequest:
    """ Запрос на установку статуса

        Attributes:
            status (StatusUpdateRequestStatus):
     """

    status: StatusUpdateRequestStatus
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)





    def to_dict(self) -> dict[str, Any]:
        from ..models.status_update_request_status import StatusUpdateRequestStatus
        status = self.status.to_dict()


        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update({
            "status": status,
        })

        return field_dict



    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        from ..models.status_update_request_status import StatusUpdateRequestStatus
        d = dict(src_dict)
        status = StatusUpdateRequestStatus.from_dict(d.pop("status"))




        status_update_request = cls(
            status=status,
        )


        status_update_request.additional_properties = d
        return status_update_request

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
