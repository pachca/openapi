from __future__ import annotations

from collections.abc import Mapping
from typing import Any, TypeVar, BinaryIO, TextIO, TYPE_CHECKING, Generator

from attrs import define as _attrs_define
from attrs import field as _attrs_field
import json
from .. import types

from ..types import UNSET, Unset

from ..types import File, FileTypes
from io import BytesIO






T = TypeVar("T", bound="FileUploadRequest")



@_attrs_define
class FileUploadRequest:
    """ 
        Attributes:
            content_disposition (str): Параметр Content-Disposition, полученный в ответе на запрос [Получение подписи, ключа
                и других параметров](POST /uploads)
            acl (str): Параметр acl, полученный в ответе на запрос [Получение подписи, ключа и других параметров](POST
                /uploads)
            policy (str): Параметр policy, полученный в ответе на запрос [Получение подписи, ключа и других параметров](POST
                /uploads)
            x_amz_credential (str): Параметр x-amz-credential, полученный в ответе на запрос [Получение подписи, ключа и
                других параметров](POST /uploads)
            x_amz_algorithm (str): Параметр x-amz-algorithm, полученный в ответе на запрос [Получение подписи, ключа и
                других параметров](POST /uploads)
            x_amz_date (str): Параметр x-amz-date, полученный в ответе на запрос [Получение подписи, ключа и других
                параметров](POST /uploads)
            x_amz_signature (str): Параметр x-amz-signature, полученный в ответе на запрос [Получение подписи, ключа и
                других параметров](POST /uploads)
            key (str): Параметр key, полученный в ответе на запрос [Получение подписи, ключа и других параметров](POST
                /uploads)
            file (File): Файл для загрузки
     """

    content_disposition: str
    acl: str
    policy: str
    x_amz_credential: str
    x_amz_algorithm: str
    x_amz_date: str
    x_amz_signature: str
    key: str
    file: File
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)





    def to_dict(self) -> dict[str, Any]:
        content_disposition = self.content_disposition

        acl = self.acl

        policy = self.policy

        x_amz_credential = self.x_amz_credential

        x_amz_algorithm = self.x_amz_algorithm

        x_amz_date = self.x_amz_date

        x_amz_signature = self.x_amz_signature

        key = self.key

        file = self.file.to_tuple()



        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update({
            "contentDisposition": content_disposition,
            "acl": acl,
            "policy": policy,
            "xAmzCredential": x_amz_credential,
            "xAmzAlgorithm": x_amz_algorithm,
            "xAmzDate": x_amz_date,
            "xAmzSignature": x_amz_signature,
            "key": key,
            "file": file,
        })

        return field_dict


    def to_multipart(self) -> types.RequestFiles:
        files: types.RequestFiles = []

        files.append(("contentDisposition", (None, str(self.content_disposition).encode(), "text/plain")))



        files.append(("acl", (None, str(self.acl).encode(), "text/plain")))



        files.append(("policy", (None, str(self.policy).encode(), "text/plain")))



        files.append(("xAmzCredential", (None, str(self.x_amz_credential).encode(), "text/plain")))



        files.append(("xAmzAlgorithm", (None, str(self.x_amz_algorithm).encode(), "text/plain")))



        files.append(("xAmzDate", (None, str(self.x_amz_date).encode(), "text/plain")))



        files.append(("xAmzSignature", (None, str(self.x_amz_signature).encode(), "text/plain")))



        files.append(("key", (None, str(self.key).encode(), "text/plain")))



        files.append(("file", self.file.to_tuple()))




        for prop_name, prop in self.additional_properties.items():
            files.append((prop_name, (None, str(prop).encode(), "text/plain")))



        return files


    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        d = dict(src_dict)
        content_disposition = d.pop("contentDisposition")

        acl = d.pop("acl")

        policy = d.pop("policy")

        x_amz_credential = d.pop("xAmzCredential")

        x_amz_algorithm = d.pop("xAmzAlgorithm")

        x_amz_date = d.pop("xAmzDate")

        x_amz_signature = d.pop("xAmzSignature")

        key = d.pop("key")

        file = File(
             payload = BytesIO(d.pop("file"))
        )




        file_upload_request = cls(
            content_disposition=content_disposition,
            acl=acl,
            policy=policy,
            x_amz_credential=x_amz_credential,
            x_amz_algorithm=x_amz_algorithm,
            x_amz_date=x_amz_date,
            x_amz_signature=x_amz_signature,
            key=key,
            file=file,
        )


        file_upload_request.additional_properties = d
        return file_upload_request

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
