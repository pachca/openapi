from __future__ import annotations

from collections.abc import Mapping
from typing import Any, TypeVar, BinaryIO, TextIO, TYPE_CHECKING, Generator

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..types import UNSET, Unset

from ..models.view_block_markdown_type import ViewBlockMarkdownType






T = TypeVar("T", bound="ViewBlockMarkdown")



@_attrs_define
class ViewBlockMarkdown:
    """ Блок markdown — форматированный текст

        Attributes:
            type_ (ViewBlockMarkdownType): Тип блока Example: markdown.
            text (str): Текст Example: Информацию о доступных вам днях отпуска вы можете прочитать по
                [ссылке](https://www.website.com/timeoff).
     """

    type_: ViewBlockMarkdownType
    text: str
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)





    def to_dict(self) -> dict[str, Any]:
        type_ = self.type_.value

        text = self.text


        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update({
            "type": type_,
            "text": text,
        })

        return field_dict



    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        d = dict(src_dict)
        type_ = ViewBlockMarkdownType(d.pop("type"))




        text = d.pop("text")

        view_block_markdown = cls(
            type_=type_,
            text=text,
        )


        view_block_markdown.additional_properties = d
        return view_block_markdown

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
