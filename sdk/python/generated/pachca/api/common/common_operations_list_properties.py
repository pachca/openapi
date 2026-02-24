from http import HTTPStatus
from typing import Any, cast
from urllib.parse import quote

import httpx

from ...client import AuthenticatedClient, Client
from ...types import Response, UNSET
from ... import errors

from ...models.api_error import ApiError
from ...models.common_operations_list_properties_response_200 import CommonOperationsListPropertiesResponse200
from ...models.o_auth_error import OAuthError
from ...models.search_entity_type import SearchEntityType
from typing import cast



def _get_kwargs(
    *,
    entity_type: SearchEntityType,

) -> dict[str, Any]:
    

    

    params: dict[str, Any] = {}

    json_entity_type = entity_type.value
    params["entity_type"] = json_entity_type


    params = {k: v for k, v in params.items() if v is not UNSET and v is not None}


    _kwargs: dict[str, Any] = {
        "method": "get",
        "url": "/custom_properties",
        "params": params,
    }


    return _kwargs



def _parse_response(*, client: AuthenticatedClient | Client, response: httpx.Response) -> ApiError | CommonOperationsListPropertiesResponse200 | OAuthError | None:
    if response.status_code == 200:
        response_200 = CommonOperationsListPropertiesResponse200.from_dict(response.json())



        return response_200

    if response.status_code == 400:
        response_400 = ApiError.from_dict(response.json())



        return response_400

    if response.status_code == 401:
        response_401 = OAuthError.from_dict(response.json())



        return response_401

    if response.status_code == 403:
        response_403 = OAuthError.from_dict(response.json())



        return response_403

    if response.status_code == 422:
        response_422 = ApiError.from_dict(response.json())



        return response_422

    if client.raise_on_unexpected_status:
        raise errors.UnexpectedStatus(response.status_code, response.content)
    else:
        return None


def _build_response(*, client: AuthenticatedClient | Client, response: httpx.Response) -> Response[ApiError | CommonOperationsListPropertiesResponse200 | OAuthError]:
    return Response(
        status_code=HTTPStatus(response.status_code),
        content=response.content,
        headers=response.headers,
        parsed=_parse_response(client=client, response=response),
    )


def sync_detailed(
    *,
    client: AuthenticatedClient | Client,
    entity_type: SearchEntityType,

) -> Response[ApiError | CommonOperationsListPropertiesResponse200 | OAuthError]:
    r"""  Список дополнительных полей

    На данный момент работа с дополнительными полями типа \"Файл\" недоступна.

    Метод для получения актуального списка дополнительных полей участников и напоминаний в вашей
    компании.

    По умолчанию в вашей компании все сущности имеют только базовые поля. Но администратор вашей
    компании может добавлять дополнительные поля, редактировать их и удалять. Если при создании
    сотрудников (или напоминаний) вы используете дополнительные поля, которые не являются актуальными
    (удалены или не существуют) - вы получите ошибку.

    Args:
        entity_type (SearchEntityType): Тип сущности для поиска

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[ApiError | CommonOperationsListPropertiesResponse200 | OAuthError]
     """


    kwargs = _get_kwargs(
        entity_type=entity_type,

    )

    response = client.get_httpx_client().request(
        **kwargs,
    )

    return _build_response(client=client, response=response)

def sync(
    *,
    client: AuthenticatedClient | Client,
    entity_type: SearchEntityType,

) -> ApiError | CommonOperationsListPropertiesResponse200 | OAuthError | None:
    r"""  Список дополнительных полей

    На данный момент работа с дополнительными полями типа \"Файл\" недоступна.

    Метод для получения актуального списка дополнительных полей участников и напоминаний в вашей
    компании.

    По умолчанию в вашей компании все сущности имеют только базовые поля. Но администратор вашей
    компании может добавлять дополнительные поля, редактировать их и удалять. Если при создании
    сотрудников (или напоминаний) вы используете дополнительные поля, которые не являются актуальными
    (удалены или не существуют) - вы получите ошибку.

    Args:
        entity_type (SearchEntityType): Тип сущности для поиска

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        ApiError | CommonOperationsListPropertiesResponse200 | OAuthError
     """


    return sync_detailed(
        client=client,
entity_type=entity_type,

    ).parsed

async def asyncio_detailed(
    *,
    client: AuthenticatedClient | Client,
    entity_type: SearchEntityType,

) -> Response[ApiError | CommonOperationsListPropertiesResponse200 | OAuthError]:
    r"""  Список дополнительных полей

    На данный момент работа с дополнительными полями типа \"Файл\" недоступна.

    Метод для получения актуального списка дополнительных полей участников и напоминаний в вашей
    компании.

    По умолчанию в вашей компании все сущности имеют только базовые поля. Но администратор вашей
    компании может добавлять дополнительные поля, редактировать их и удалять. Если при создании
    сотрудников (или напоминаний) вы используете дополнительные поля, которые не являются актуальными
    (удалены или не существуют) - вы получите ошибку.

    Args:
        entity_type (SearchEntityType): Тип сущности для поиска

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[ApiError | CommonOperationsListPropertiesResponse200 | OAuthError]
     """


    kwargs = _get_kwargs(
        entity_type=entity_type,

    )

    response = await client.get_async_httpx_client().request(
        **kwargs
    )

    return _build_response(client=client, response=response)

async def asyncio(
    *,
    client: AuthenticatedClient | Client,
    entity_type: SearchEntityType,

) -> ApiError | CommonOperationsListPropertiesResponse200 | OAuthError | None:
    r"""  Список дополнительных полей

    На данный момент работа с дополнительными полями типа \"Файл\" недоступна.

    Метод для получения актуального списка дополнительных полей участников и напоминаний в вашей
    компании.

    По умолчанию в вашей компании все сущности имеют только базовые поля. Но администратор вашей
    компании может добавлять дополнительные поля, редактировать их и удалять. Если при создании
    сотрудников (или напоминаний) вы используете дополнительные поля, которые не являются актуальными
    (удалены или не существуют) - вы получите ошибку.

    Args:
        entity_type (SearchEntityType): Тип сущности для поиска

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        ApiError | CommonOperationsListPropertiesResponse200 | OAuthError
     """


    return (await asyncio_detailed(
        client=client,
entity_type=entity_type,

    )).parsed
