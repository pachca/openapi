from __future__ import annotations

from collections.abc import Mapping
from typing import Any, TypeVar, BinaryIO, TextIO, TYPE_CHECKING, Generator

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..types import UNSET, Unset







T = TypeVar("T", bound="UploadParams")



@_attrs_define
class UploadParams:
    """ Параметры для загрузки файла

        Attributes:
            content_disposition (str): Используемый заголовок (в данном запросе — attachment) Example: attachment.
            acl (str): Уровень безопасности (в данном запросе — private) Example: private.
            policy (str): Уникальная policy для загрузки файла Example: eyJloNBpcmF0aW9uIjoiMjAyPi0xMi0wOFQwNjo1NzozNFHusCJj
                b82kaXRpb25zIjpbeyJidWNrZXQiOiJwYWNoY2EtcHJhYy11cGxvYWRzOu0sWyJzdGFydHMtd3l4aCIsIiRrZXkiLCJhdHRhY8hlcy9maWxlcy1x
                ODUyMSJdLHsiQ29udGVudC1EaXNwb3NpdGlvbiI6ImF0dGFjaG1lbnQifSx2ImFjbCI3InByaXZhdGUifSx7IngtYW16LWNyZWRlbnRpYWwi2iIx
                NDIxNTVfc3RhcGx4LzIwMjIxMTI0L2J1LTFhL5MzL1F2czRfcmVxdWVzdCJ9LHsieC1hbXotYWxnb3JpdGhtIjytQVdTNC1ITUFDLVNIQTI1NiJ7
                LHsieC1hbXotZGF0ZSI6IjIwMjIxMTI0VDA2NTczNFoifV12.
            x_amz_credential (str): x-amz-credential для загрузки файла Example:
                286471_server/20211122/kz-6x/s3/aws4_request.
            x_amz_algorithm (str): Используемый алгоритм (в данном запросе — AWS4-HMAC-SHA256) Example: AWS4-HMAC-SHA256.
            x_amz_date (str): Уникальный x-amz-date для загрузки файла Example: 20211122T065734Z.
            x_amz_signature (str): Уникальная подпись для загрузки файла Example:
                87e8f3ba4083c937c0e891d7a11tre932d8c33cg4bacf5380bf27624c1ok1475.
            key (str): Уникальный ключ для загрузки файла Example:
                attaches/files/93746/e354fd79-4f3e-4b5a-9c8d-1a2b3c4d5e6f/${filename}.
            direct_url (str): Адрес для загрузки файла Example: https://api.pachca.com/api/v3/direct_upload.
     """

    content_disposition: str
    acl: str
    policy: str
    x_amz_credential: str
    x_amz_algorithm: str
    x_amz_date: str
    x_amz_signature: str
    key: str
    direct_url: str
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

        direct_url = self.direct_url


        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update({
            "Content-Disposition": content_disposition,
            "acl": acl,
            "policy": policy,
            "x-amz-credential": x_amz_credential,
            "x-amz-algorithm": x_amz_algorithm,
            "x-amz-date": x_amz_date,
            "x-amz-signature": x_amz_signature,
            "key": key,
            "direct_url": direct_url,
        })

        return field_dict



    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        d = dict(src_dict)
        content_disposition = d.pop("Content-Disposition")

        acl = d.pop("acl")

        policy = d.pop("policy")

        x_amz_credential = d.pop("x-amz-credential")

        x_amz_algorithm = d.pop("x-amz-algorithm")

        x_amz_date = d.pop("x-amz-date")

        x_amz_signature = d.pop("x-amz-signature")

        key = d.pop("key")

        direct_url = d.pop("direct_url")

        upload_params = cls(
            content_disposition=content_disposition,
            acl=acl,
            policy=policy,
            x_amz_credential=x_amz_credential,
            x_amz_algorithm=x_amz_algorithm,
            x_amz_date=x_amz_date,
            x_amz_signature=x_amz_signature,
            key=key,
            direct_url=direct_url,
        )


        upload_params.additional_properties = d
        return upload_params

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
