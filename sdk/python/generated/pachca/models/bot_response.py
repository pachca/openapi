from __future__ import annotations

from collections.abc import Mapping
from typing import Any, TypeVar, BinaryIO, TextIO, TYPE_CHECKING, Generator

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..types import UNSET, Unset

from typing import cast

if TYPE_CHECKING:
  from ..models.bot_response_webhook import BotResponseWebhook





T = TypeVar("T", bound="BotResponse")



@_attrs_define
class BotResponse:
    """ Ответ с данными бота

        Attributes:
            id (int): Идентификатор бота Example: 1738816.
            webhook (BotResponseWebhook): Объект параметров вебхука
     """

    id: int
    webhook: BotResponseWebhook
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)





    def to_dict(self) -> dict[str, Any]:
        from ..models.bot_response_webhook import BotResponseWebhook
        id = self.id

        webhook = self.webhook.to_dict()


        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update({
            "id": id,
            "webhook": webhook,
        })

        return field_dict



    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        from ..models.bot_response_webhook import BotResponseWebhook
        d = dict(src_dict)
        id = d.pop("id")

        webhook = BotResponseWebhook.from_dict(d.pop("webhook"))




        bot_response = cls(
            id=id,
            webhook=webhook,
        )


        bot_response.additional_properties = d
        return bot_response

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
