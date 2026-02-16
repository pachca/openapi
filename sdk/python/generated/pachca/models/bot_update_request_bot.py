from __future__ import annotations

from collections.abc import Mapping
from typing import Any, TypeVar, BinaryIO, TextIO, TYPE_CHECKING, Generator

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..types import UNSET, Unset

from typing import cast

if TYPE_CHECKING:
  from ..models.bot_update_request_bot_webhook import BotUpdateRequestBotWebhook





T = TypeVar("T", bound="BotUpdateRequestBot")



@_attrs_define
class BotUpdateRequestBot:
    """ Собранный объект параметров редактируемого бота

        Attributes:
            webhook (BotUpdateRequestBotWebhook): Объект параметров вебхука
     """

    webhook: BotUpdateRequestBotWebhook
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)





    def to_dict(self) -> dict[str, Any]:
        from ..models.bot_update_request_bot_webhook import BotUpdateRequestBotWebhook
        webhook = self.webhook.to_dict()


        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update({
            "webhook": webhook,
        })

        return field_dict



    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        from ..models.bot_update_request_bot_webhook import BotUpdateRequestBotWebhook
        d = dict(src_dict)
        webhook = BotUpdateRequestBotWebhook.from_dict(d.pop("webhook"))




        bot_update_request_bot = cls(
            webhook=webhook,
        )


        bot_update_request_bot.additional_properties = d
        return bot_update_request_bot

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
