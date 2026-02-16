from __future__ import annotations

from collections.abc import Mapping
from typing import Any, TypeVar, BinaryIO, TextIO, TYPE_CHECKING, Generator

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..types import UNSET, Unset

from ..types import UNSET, Unset
from typing import cast

if TYPE_CHECKING:
  from ..models.pagination_meta import PaginationMeta





T = TypeVar("T", bound="ReadMemberOperationsListReadMembersResponse200")



@_attrs_define
class ReadMemberOperationsListReadMembersResponse200:
    """ Обертка ответа с данными и пагинацией

        Attributes:
            data (list[int]):
            meta (PaginationMeta | Unset): Метаданные пагинации
     """

    data: list[int]
    meta: PaginationMeta | Unset = UNSET
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)





    def to_dict(self) -> dict[str, Any]:
        from ..models.pagination_meta import PaginationMeta
        data = self.data



        meta: dict[str, Any] | Unset = UNSET
        if not isinstance(self.meta, Unset):
            meta = self.meta.to_dict()


        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update({
            "data": data,
        })
        if meta is not UNSET:
            field_dict["meta"] = meta

        return field_dict



    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        from ..models.pagination_meta import PaginationMeta
        d = dict(src_dict)
        data = cast(list[int], d.pop("data"))


        _meta = d.pop("meta", UNSET)
        meta: PaginationMeta | Unset
        if isinstance(_meta,  Unset):
            meta = UNSET
        else:
            meta = PaginationMeta.from_dict(_meta)




        read_member_operations_list_read_members_response_200 = cls(
            data=data,
            meta=meta,
        )


        read_member_operations_list_read_members_response_200.additional_properties = d
        return read_member_operations_list_read_members_response_200

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
