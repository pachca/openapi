from http import HTTPStatus
from typing import Any, cast
from urllib.parse import quote

import httpx

from ...client import AuthenticatedClient, Client
from ...types import Response, UNSET
from ... import errors

from ...models.api_error import ApiError
from ...models.o_auth_error import OAuthError
from ...models.user_create_request import UserCreateRequest
from ...models.user_operations_create_user_response_201 import UserOperationsCreateUserResponse201
from typing import cast



def _get_kwargs(
    *,
    body: UserCreateRequest,

) -> dict[str, Any]:
    headers: dict[str, Any] = {}


    

    

    _kwargs: dict[str, Any] = {
        "method": "post",
        "url": "/users",
    }

    _kwargs["json"] = body.to_dict()


    headers["Content-Type"] = "application/json"

    _kwargs["headers"] = headers
    return _kwargs



def _parse_response(*, client: AuthenticatedClient | Client, response: httpx.Response) -> ApiError | OAuthError | UserOperationsCreateUserResponse201 | None:
    if response.status_code == 201:
        response_201 = UserOperationsCreateUserResponse201.from_dict(response.json())



        return response_201

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


def _build_response(*, client: AuthenticatedClient | Client, response: httpx.Response) -> Response[ApiError | OAuthError | UserOperationsCreateUserResponse201]:
    return Response(
        status_code=HTTPStatus(response.status_code),
        content=response.content,
        headers=response.headers,
        parsed=_parse_response(client=client, response=response),
    )


def sync_detailed(
    *,
    client: AuthenticatedClient | Client,
    body: UserCreateRequest,

) -> Response[ApiError | OAuthError | UserOperationsCreateUserResponse201]:
    """  Создать сотрудника

    Метод для создания нового сотрудника в вашей компании.

    Вы можете заполнять дополнительные поля сотрудника, которые созданы в вашей компании. Получить
    актуальный список идентификаторов дополнительных полей сотрудника вы можете в методе [Список
    дополнительных полей](GET /custom_properties).

    Args:
        body (UserCreateRequest): Запрос на создание сотрудника

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[ApiError | OAuthError | UserOperationsCreateUserResponse201]
     """


    kwargs = _get_kwargs(
        body=body,

    )

    response = client.get_httpx_client().request(
        **kwargs,
    )

    return _build_response(client=client, response=response)

def sync(
    *,
    client: AuthenticatedClient | Client,
    body: UserCreateRequest,

) -> ApiError | OAuthError | UserOperationsCreateUserResponse201 | None:
    """  Создать сотрудника

    Метод для создания нового сотрудника в вашей компании.

    Вы можете заполнять дополнительные поля сотрудника, которые созданы в вашей компании. Получить
    актуальный список идентификаторов дополнительных полей сотрудника вы можете в методе [Список
    дополнительных полей](GET /custom_properties).

    Args:
        body (UserCreateRequest): Запрос на создание сотрудника

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        ApiError | OAuthError | UserOperationsCreateUserResponse201
     """


    return sync_detailed(
        client=client,
body=body,

    ).parsed

async def asyncio_detailed(
    *,
    client: AuthenticatedClient | Client,
    body: UserCreateRequest,

) -> Response[ApiError | OAuthError | UserOperationsCreateUserResponse201]:
    """  Создать сотрудника

    Метод для создания нового сотрудника в вашей компании.

    Вы можете заполнять дополнительные поля сотрудника, которые созданы в вашей компании. Получить
    актуальный список идентификаторов дополнительных полей сотрудника вы можете в методе [Список
    дополнительных полей](GET /custom_properties).

    Args:
        body (UserCreateRequest): Запрос на создание сотрудника

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[ApiError | OAuthError | UserOperationsCreateUserResponse201]
     """


    kwargs = _get_kwargs(
        body=body,

    )

    response = await client.get_async_httpx_client().request(
        **kwargs
    )

    return _build_response(client=client, response=response)

async def asyncio(
    *,
    client: AuthenticatedClient | Client,
    body: UserCreateRequest,

) -> ApiError | OAuthError | UserOperationsCreateUserResponse201 | None:
    """  Создать сотрудника

    Метод для создания нового сотрудника в вашей компании.

    Вы можете заполнять дополнительные поля сотрудника, которые созданы в вашей компании. Получить
    актуальный список идентификаторов дополнительных полей сотрудника вы можете в методе [Список
    дополнительных полей](GET /custom_properties).

    Args:
        body (UserCreateRequest): Запрос на создание сотрудника

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        ApiError | OAuthError | UserOperationsCreateUserResponse201
     """


    return (await asyncio_detailed(
        client=client,
body=body,

    )).parsed
