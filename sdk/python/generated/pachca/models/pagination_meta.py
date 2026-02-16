from __future__ import annotations

from collections.abc import Mapping
from typing import Any, TypeVar, BinaryIO, TextIO, TYPE_CHECKING, Generator

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..types import UNSET, Unset

from ..types import UNSET, Unset
from typing import cast

if TYPE_CHECKING:
  from ..models.pagination_meta_paginate import PaginationMetaPaginate





T = TypeVar("T", bound="PaginationMeta")



@_attrs_define
class PaginationMeta:
    """ Метаданные пагинации

        Attributes:
            paginate (PaginationMetaPaginate | Unset): Вспомогательная информация
     """

    paginate: PaginationMetaPaginate | Unset = UNSET
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)





    def to_dict(self) -> dict[str, Any]:
        from ..models.pagination_meta_paginate import PaginationMetaPaginate
        paginate: dict[str, Any] | Unset = UNSET
        if not isinstance(self.paginate, Unset):
            paginate = self.paginate.to_dict()


        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update({
        })
        if paginate is not UNSET:
            field_dict["paginate"] = paginate

        return field_dict



    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        from ..models.pagination_meta_paginate import PaginationMetaPaginate
        d = dict(src_dict)
        _paginate = d.pop("paginate", UNSET)
        paginate: PaginationMetaPaginate | Unset
        if isinstance(_paginate,  Unset):
            paginate = UNSET
        else:
            paginate = PaginationMetaPaginate.from_dict(_paginate)




        pagination_meta = cls(
            paginate=paginate,
        )


        pagination_meta.additional_properties = d
        return pagination_meta

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
