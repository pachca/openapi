from __future__ import annotations

from collections.abc import Mapping
from typing import Any, TypeVar, BinaryIO, TextIO, TYPE_CHECKING, Generator

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..types import UNSET, Unset

from typing import cast

if TYPE_CHECKING:
  from ..models.search_pagination_meta_paginate import SearchPaginationMetaPaginate





T = TypeVar("T", bound="SearchPaginationMeta")



@_attrs_define
class SearchPaginationMeta:
    """ Мета-информация для пагинации поисковых результатов

        Attributes:
            total (int): Общее количество найденных результатов Example: 42.
            paginate (SearchPaginationMetaPaginate): Вспомогательная информация
     """

    total: int
    paginate: SearchPaginationMetaPaginate
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)





    def to_dict(self) -> dict[str, Any]:
        from ..models.search_pagination_meta_paginate import SearchPaginationMetaPaginate
        total = self.total

        paginate = self.paginate.to_dict()


        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update({
            "total": total,
            "paginate": paginate,
        })

        return field_dict



    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        from ..models.search_pagination_meta_paginate import SearchPaginationMetaPaginate
        d = dict(src_dict)
        total = d.pop("total")

        paginate = SearchPaginationMetaPaginate.from_dict(d.pop("paginate"))




        search_pagination_meta = cls(
            total=total,
            paginate=paginate,
        )


        search_pagination_meta.additional_properties = d
        return search_pagination_meta

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
