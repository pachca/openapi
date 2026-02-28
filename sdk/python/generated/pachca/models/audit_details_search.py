from __future__ import annotations

from collections.abc import Mapping
from typing import Any, TypeVar, BinaryIO, TextIO, TYPE_CHECKING, Generator

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..types import UNSET, Unset

from typing import cast

if TYPE_CHECKING:
  from ..models.audit_details_search_filters import AuditDetailsSearchFilters





T = TypeVar("T", bound="AuditDetailsSearch")



@_attrs_define
class AuditDetailsSearch:
    """ При: search_users_api, search_chats_api, search_messages_api

        Attributes:
            search_type (str): Тип поиска
            query_present (bool): Указан ли поисковый запрос
            cursor_present (bool): Использован ли курсор
            limit (int): Количество возвращённых результатов
            filters (AuditDetailsSearchFilters): Применённые фильтры. Возможные ключи зависят от типа поиска: order, sort,
                created_from, created_to, company_roles (users), active, chat_subtype, personal (chats), chat_ids, user_ids
                (messages)
     """

    search_type: str
    query_present: bool
    cursor_present: bool
    limit: int
    filters: AuditDetailsSearchFilters
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)





    def to_dict(self) -> dict[str, Any]:
        from ..models.audit_details_search_filters import AuditDetailsSearchFilters
        search_type = self.search_type

        query_present = self.query_present

        cursor_present = self.cursor_present

        limit = self.limit

        filters = self.filters.to_dict()


        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update({
            "search_type": search_type,
            "query_present": query_present,
            "cursor_present": cursor_present,
            "limit": limit,
            "filters": filters,
        })

        return field_dict



    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        from ..models.audit_details_search_filters import AuditDetailsSearchFilters
        d = dict(src_dict)
        search_type = d.pop("search_type")

        query_present = d.pop("query_present")

        cursor_present = d.pop("cursor_present")

        limit = d.pop("limit")

        filters = AuditDetailsSearchFilters.from_dict(d.pop("filters"))




        audit_details_search = cls(
            search_type=search_type,
            query_present=query_present,
            cursor_present=cursor_present,
            limit=limit,
            filters=filters,
        )


        audit_details_search.additional_properties = d
        return audit_details_search

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
