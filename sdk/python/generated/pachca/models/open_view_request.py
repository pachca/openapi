from __future__ import annotations

from collections.abc import Mapping
from typing import Any, TypeVar, BinaryIO, TextIO, TYPE_CHECKING, Generator

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..types import UNSET, Unset

from ..models.open_view_request_type import OpenViewRequestType
from ..types import UNSET, Unset
from typing import cast

if TYPE_CHECKING:
  from ..models.open_view_request_view import OpenViewRequestView





T = TypeVar("T", bound="OpenViewRequest")



@_attrs_define
class OpenViewRequest:
    """ Запрос на открытие представления

        Attributes:
            type_ (OpenViewRequestType): Способ открытия представления Example: modal.
            trigger_id (str): Уникальный идентификатор события (полученный, например, в исходящем вебхуке о нажатии кнопки)
                Example: 791a056b-006c-49dd-834b-c633fde52fe8.
            view (OpenViewRequestView): Собранный объект представления
            private_metadata (str | Unset): Необязательная строка, которая будет отправлена в ваше приложение при отправке
                пользователем заполненной формы. Используйте это поле, например, для передачи в формате `JSON` какой то
                дополнительной информации вместе с заполненной пользователем формой. Example: {"timeoff_id":4378}.
            callback_id (str | Unset): Необязательный идентификатор для распознавания этого представления, который будет
                отправлен в ваше приложение при отправке пользователем заполненной формы. Используйте это поле, например, для
                понимания, какую форму должен был заполнить пользователь. Example: timeoff_reguest_form.
     """

    type_: OpenViewRequestType
    trigger_id: str
    view: OpenViewRequestView
    private_metadata: str | Unset = UNSET
    callback_id: str | Unset = UNSET
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)





    def to_dict(self) -> dict[str, Any]:
        from ..models.open_view_request_view import OpenViewRequestView
        type_ = self.type_.value

        trigger_id = self.trigger_id

        view = self.view.to_dict()

        private_metadata = self.private_metadata

        callback_id = self.callback_id


        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update({
            "type": type_,
            "trigger_id": trigger_id,
            "view": view,
        })
        if private_metadata is not UNSET:
            field_dict["private_metadata"] = private_metadata
        if callback_id is not UNSET:
            field_dict["callback_id"] = callback_id

        return field_dict



    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        from ..models.open_view_request_view import OpenViewRequestView
        d = dict(src_dict)
        type_ = OpenViewRequestType(d.pop("type"))




        trigger_id = d.pop("trigger_id")

        view = OpenViewRequestView.from_dict(d.pop("view"))




        private_metadata = d.pop("private_metadata", UNSET)

        callback_id = d.pop("callback_id", UNSET)

        open_view_request = cls(
            type_=type_,
            trigger_id=trigger_id,
            view=view,
            private_metadata=private_metadata,
            callback_id=callback_id,
        )


        open_view_request.additional_properties = d
        return open_view_request

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
