from http import HTTPStatus
from typing import Any, cast
from urllib.parse import quote

import httpx

from ...client import AuthenticatedClient, Client
from ...types import Response, UNSET
from ... import errors

from ...models.api_error import ApiError
from ...models.o_auth_error import OAuthError
from ...models.user_status_operations_get_user_status_response_200 import UserStatusOperationsGetUserStatusResponse200
from typing import cast



def _get_kwargs(
    user_id: int,

) -> dict[str, Any]:
    

    

    

    _kwargs: dict[str, Any] = {
        "method": "get",
        "url": "/users/{user_id}/status".format(user_id=quote(str(user_id), safe=""),),
    }


    return _kwargs



def _parse_response(*, client: AuthenticatedClient | Client, response: httpx.Response) -> ApiError | OAuthError | UserStatusOperationsGetUserStatusResponse200 | None:
    if response.status_code == 200:
        response_200 = UserStatusOperationsGetUserStatusResponse200.from_dict(response.json())



        return response_200

    if response.status_code == 401:
        response_401 = OAuthError.from_dict(response.json())



        return response_401

    if response.status_code == 403:
        response_403 = OAuthError.from_dict(response.json())



        return response_403

    if response.status_code == 404:
        response_404 = ApiError.from_dict(response.json())



        return response_404

    if client.raise_on_unexpected_status:
        raise errors.UnexpectedStatus(response.status_code, response.content)
    else:
        return None


def _build_response(*, client: AuthenticatedClient | Client, response: httpx.Response) -> Response[ApiError | OAuthError | UserStatusOperationsGetUserStatusResponse200]:
    return Response(
        status_code=HTTPStatus(response.status_code),
        content=response.content,
        headers=response.headers,
        parsed=_parse_response(client=client, response=response),
    )


def sync_detailed(
    user_id: int,
    *,
    client: AuthenticatedClient | Client,

) -> Response[ApiError | OAuthError | UserStatusOperationsGetUserStatusResponse200]:
    """  Статус сотрудника

    Метод для получения информации о статусе сотрудника.

    Args:
        user_id (int):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[ApiError | OAuthError | UserStatusOperationsGetUserStatusResponse200]
     """


    kwargs = _get_kwargs(
        user_id=user_id,

    )

    response = client.get_httpx_client().request(
        **kwargs,
    )

    return _build_response(client=client, response=response)

def sync(
    user_id: int,
    *,
    client: AuthenticatedClient | Client,

) -> ApiError | OAuthError | UserStatusOperationsGetUserStatusResponse200 | None:
    """  Статус сотрудника

    Метод для получения информации о статусе сотрудника.

    Args:
        user_id (int):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        ApiError | OAuthError | UserStatusOperationsGetUserStatusResponse200
     """


    return sync_detailed(
        user_id=user_id,
client=client,

    ).parsed

async def asyncio_detailed(
    user_id: int,
    *,
    client: AuthenticatedClient | Client,

) -> Response[ApiError | OAuthError | UserStatusOperationsGetUserStatusResponse200]:
    """  Статус сотрудника

    Метод для получения информации о статусе сотрудника.

    Args:
        user_id (int):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[ApiError | OAuthError | UserStatusOperationsGetUserStatusResponse200]
     """


    kwargs = _get_kwargs(
        user_id=user_id,

    )

    response = await client.get_async_httpx_client().request(
        **kwargs
    )

    return _build_response(client=client, response=response)

async def asyncio(
    user_id: int,
    *,
    client: AuthenticatedClient | Client,

) -> ApiError | OAuthError | UserStatusOperationsGetUserStatusResponse200 | None:
    """  Статус сотрудника

    Метод для получения информации о статусе сотрудника.

    Args:
        user_id (int):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        ApiError | OAuthError | UserStatusOperationsGetUserStatusResponse200
     """


    return (await asyncio_detailed(
        user_id=user_id,
client=client,

    )).parsed
