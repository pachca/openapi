from __future__ import annotations

from collections.abc import Mapping
from typing import Any, TypeVar, BinaryIO, TextIO, TYPE_CHECKING, Generator

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..types import UNSET, Unset

from ..models.bearer_auth_scheme import BearerAuthScheme
from ..models.bearer_auth_type import BearerAuthType






T = TypeVar("T", bound="BearerAuth")



@_attrs_define
class BearerAuth:
    """ 
        Attributes:
            type_ (BearerAuthType): Http authentication
            scheme (BearerAuthScheme): basic auth scheme
     """

    type_: BearerAuthType
    scheme: BearerAuthScheme
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)





    def to_dict(self) -> dict[str, Any]:
        type_ = self.type_.value

        scheme = self.scheme.value


        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update({
            "type": type_,
            "scheme": scheme,
        })

        return field_dict



    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        d = dict(src_dict)
        type_ = BearerAuthType(d.pop("type"))




        scheme = BearerAuthScheme(d.pop("scheme"))




        bearer_auth = cls(
            type_=type_,
            scheme=scheme,
        )


        bearer_auth.additional_properties = d
        return bearer_auth

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
