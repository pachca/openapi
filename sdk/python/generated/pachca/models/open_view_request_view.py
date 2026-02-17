from __future__ import annotations

from collections.abc import Mapping
from typing import Any, TypeVar, BinaryIO, TextIO, TYPE_CHECKING, Generator

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..types import UNSET, Unset

from ..types import UNSET, Unset
from typing import cast

if TYPE_CHECKING:
  from ..models.view_block_checkbox import ViewBlockCheckbox
  from ..models.view_block_date import ViewBlockDate
  from ..models.view_block_divider import ViewBlockDivider
  from ..models.view_block_file_input import ViewBlockFileInput
  from ..models.view_block_header import ViewBlockHeader
  from ..models.view_block_input import ViewBlockInput
  from ..models.view_block_markdown import ViewBlockMarkdown
  from ..models.view_block_plain_text import ViewBlockPlainText
  from ..models.view_block_radio import ViewBlockRadio
  from ..models.view_block_select import ViewBlockSelect
  from ..models.view_block_time import ViewBlockTime





T = TypeVar("T", bound="OpenViewRequestView")



@_attrs_define
class OpenViewRequestView:
    """ Собранный объект представления

        Attributes:
            title (str): Заголовок представления
            blocks (list[ViewBlockCheckbox | ViewBlockDate | ViewBlockDivider | ViewBlockFileInput | ViewBlockHeader |
                ViewBlockInput | ViewBlockMarkdown | ViewBlockPlainText | ViewBlockRadio | ViewBlockSelect | ViewBlockTime]):
                Массив блоков представления
            close_text (str | Unset): Текст кнопки закрытия представления Default: 'Отменить'.
            submit_text (str | Unset): Текст кнопки отправки формы Default: 'Отправить'.
     """

    title: str
    blocks: list[ViewBlockCheckbox | ViewBlockDate | ViewBlockDivider | ViewBlockFileInput | ViewBlockHeader | ViewBlockInput | ViewBlockMarkdown | ViewBlockPlainText | ViewBlockRadio | ViewBlockSelect | ViewBlockTime]
    close_text: str | Unset = 'Отменить'
    submit_text: str | Unset = 'Отправить'
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)





    def to_dict(self) -> dict[str, Any]:
        from ..models.view_block_radio import ViewBlockRadio
        from ..models.view_block_input import ViewBlockInput
        from ..models.view_block_select import ViewBlockSelect
        from ..models.view_block_plain_text import ViewBlockPlainText
        from ..models.view_block_date import ViewBlockDate
        from ..models.view_block_divider import ViewBlockDivider
        from ..models.view_block_header import ViewBlockHeader
        from ..models.view_block_time import ViewBlockTime
        from ..models.view_block_checkbox import ViewBlockCheckbox
        from ..models.view_block_markdown import ViewBlockMarkdown
        from ..models.view_block_file_input import ViewBlockFileInput
        title = self.title

        blocks = []
        for blocks_item_data in self.blocks:
            blocks_item: dict[str, Any]
            if isinstance(blocks_item_data, ViewBlockHeader):
                blocks_item = blocks_item_data.to_dict()
            elif isinstance(blocks_item_data, ViewBlockPlainText):
                blocks_item = blocks_item_data.to_dict()
            elif isinstance(blocks_item_data, ViewBlockMarkdown):
                blocks_item = blocks_item_data.to_dict()
            elif isinstance(blocks_item_data, ViewBlockDivider):
                blocks_item = blocks_item_data.to_dict()
            elif isinstance(blocks_item_data, ViewBlockInput):
                blocks_item = blocks_item_data.to_dict()
            elif isinstance(blocks_item_data, ViewBlockSelect):
                blocks_item = blocks_item_data.to_dict()
            elif isinstance(blocks_item_data, ViewBlockRadio):
                blocks_item = blocks_item_data.to_dict()
            elif isinstance(blocks_item_data, ViewBlockCheckbox):
                blocks_item = blocks_item_data.to_dict()
            elif isinstance(blocks_item_data, ViewBlockDate):
                blocks_item = blocks_item_data.to_dict()
            elif isinstance(blocks_item_data, ViewBlockTime):
                blocks_item = blocks_item_data.to_dict()
            else:
                blocks_item = blocks_item_data.to_dict()

            blocks.append(blocks_item)



        close_text = self.close_text

        submit_text = self.submit_text


        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update({
            "title": title,
            "blocks": blocks,
        })
        if close_text is not UNSET:
            field_dict["close_text"] = close_text
        if submit_text is not UNSET:
            field_dict["submit_text"] = submit_text

        return field_dict



    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        from ..models.view_block_checkbox import ViewBlockCheckbox
        from ..models.view_block_date import ViewBlockDate
        from ..models.view_block_divider import ViewBlockDivider
        from ..models.view_block_file_input import ViewBlockFileInput
        from ..models.view_block_header import ViewBlockHeader
        from ..models.view_block_input import ViewBlockInput
        from ..models.view_block_markdown import ViewBlockMarkdown
        from ..models.view_block_plain_text import ViewBlockPlainText
        from ..models.view_block_radio import ViewBlockRadio
        from ..models.view_block_select import ViewBlockSelect
        from ..models.view_block_time import ViewBlockTime
        d = dict(src_dict)
        title = d.pop("title")

        blocks = []
        _blocks = d.pop("blocks")
        for blocks_item_data in (_blocks):
            def _parse_blocks_item(data: object) -> ViewBlockCheckbox | ViewBlockDate | ViewBlockDivider | ViewBlockFileInput | ViewBlockHeader | ViewBlockInput | ViewBlockMarkdown | ViewBlockPlainText | ViewBlockRadio | ViewBlockSelect | ViewBlockTime:
                try:
                    if not isinstance(data, dict):
                        raise TypeError()
                    componentsschemas_view_block_union_type_0 = ViewBlockHeader.from_dict(data)



                    return componentsschemas_view_block_union_type_0
                except (TypeError, ValueError, AttributeError, KeyError):
                    pass
                try:
                    if not isinstance(data, dict):
                        raise TypeError()
                    componentsschemas_view_block_union_type_1 = ViewBlockPlainText.from_dict(data)



                    return componentsschemas_view_block_union_type_1
                except (TypeError, ValueError, AttributeError, KeyError):
                    pass
                try:
                    if not isinstance(data, dict):
                        raise TypeError()
                    componentsschemas_view_block_union_type_2 = ViewBlockMarkdown.from_dict(data)



                    return componentsschemas_view_block_union_type_2
                except (TypeError, ValueError, AttributeError, KeyError):
                    pass
                try:
                    if not isinstance(data, dict):
                        raise TypeError()
                    componentsschemas_view_block_union_type_3 = ViewBlockDivider.from_dict(data)



                    return componentsschemas_view_block_union_type_3
                except (TypeError, ValueError, AttributeError, KeyError):
                    pass
                try:
                    if not isinstance(data, dict):
                        raise TypeError()
                    componentsschemas_view_block_union_type_4 = ViewBlockInput.from_dict(data)



                    return componentsschemas_view_block_union_type_4
                except (TypeError, ValueError, AttributeError, KeyError):
                    pass
                try:
                    if not isinstance(data, dict):
                        raise TypeError()
                    componentsschemas_view_block_union_type_5 = ViewBlockSelect.from_dict(data)



                    return componentsschemas_view_block_union_type_5
                except (TypeError, ValueError, AttributeError, KeyError):
                    pass
                try:
                    if not isinstance(data, dict):
                        raise TypeError()
                    componentsschemas_view_block_union_type_6 = ViewBlockRadio.from_dict(data)



                    return componentsschemas_view_block_union_type_6
                except (TypeError, ValueError, AttributeError, KeyError):
                    pass
                try:
                    if not isinstance(data, dict):
                        raise TypeError()
                    componentsschemas_view_block_union_type_7 = ViewBlockCheckbox.from_dict(data)



                    return componentsschemas_view_block_union_type_7
                except (TypeError, ValueError, AttributeError, KeyError):
                    pass
                try:
                    if not isinstance(data, dict):
                        raise TypeError()
                    componentsschemas_view_block_union_type_8 = ViewBlockDate.from_dict(data)



                    return componentsschemas_view_block_union_type_8
                except (TypeError, ValueError, AttributeError, KeyError):
                    pass
                try:
                    if not isinstance(data, dict):
                        raise TypeError()
                    componentsschemas_view_block_union_type_9 = ViewBlockTime.from_dict(data)



                    return componentsschemas_view_block_union_type_9
                except (TypeError, ValueError, AttributeError, KeyError):
                    pass
                if not isinstance(data, dict):
                    raise TypeError()
                componentsschemas_view_block_union_type_10 = ViewBlockFileInput.from_dict(data)



                return componentsschemas_view_block_union_type_10

            blocks_item = _parse_blocks_item(blocks_item_data)

            blocks.append(blocks_item)


        close_text = d.pop("close_text", UNSET)

        submit_text = d.pop("submit_text", UNSET)

        open_view_request_view = cls(
            title=title,
            blocks=blocks,
            close_text=close_text,
            submit_text=submit_text,
        )


        open_view_request_view.additional_properties = d
        return open_view_request_view

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
