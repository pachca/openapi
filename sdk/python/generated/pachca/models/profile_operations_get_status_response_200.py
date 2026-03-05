from __future__ import annotations

from collections.abc import Mapping
from typing import Any, TypeVar, BinaryIO, TextIO, TYPE_CHECKING, Generator

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..types import UNSET, Unset

from typing import cast

if TYPE_CHECKING:
  from ..models.user_status import UserStatus





T = TypeVar("T", bound="ProfileOperationsGetStatusResponse200")



@_attrs_define
class ProfileOperationsGetStatusResponse200:
    """ Обертка ответа с данными

        Attributes:
            data (None | UserStatus):
     """

    data: None | UserStatus
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)





    def to_dict(self) -> dict[str, Any]:
        from ..models.user_status import UserStatus
        data: dict[str, Any] | None
        if isinstance(self.data, UserStatus):
            data = self.data.to_dict()
        else:
            data = self.data


        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update({
            "data": data,
        })

        return field_dict



    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        from ..models.user_status import UserStatus
        d = dict(src_dict)
        def _parse_data(data: object) -> None | UserStatus:
            if data is None:
                return data
            try:
                if not isinstance(data, dict):
                    raise TypeError()
                data_type_1 = UserStatus.from_dict(data)



                return data_type_1
            except (TypeError, ValueError, AttributeError, KeyError):
                pass
            return cast(None | UserStatus, data)

        data = _parse_data(d.pop("data"))


        profile_operations_get_status_response_200 = cls(
            data=data,
        )


        profile_operations_get_status_response_200.additional_properties = d
        return profile_operations_get_status_response_200

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
