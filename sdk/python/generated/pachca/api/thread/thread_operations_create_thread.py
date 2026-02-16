from http import HTTPStatus
from typing import Any, cast
from urllib.parse import quote

import httpx

from ...client import AuthenticatedClient, Client
from ...types import Response, UNSET
from ... import errors

from ...models.api_error import ApiError
from ...models.o_auth_error import OAuthError
from ...models.thread_operations_create_thread_response_201 import ThreadOperationsCreateThreadResponse201
from typing import cast



def _get_kwargs(
    id: int,

) -> dict[str, Any]:
    

    

    

    _kwargs: dict[str, Any] = {
        "method": "post",
        "url": "/messages/{id}/thread".format(id=quote(str(id), safe=""),),
    }


    return _kwargs



def _parse_response(*, client: AuthenticatedClient | Client, response: httpx.Response) -> ApiError | OAuthError | ThreadOperationsCreateThreadResponse201 | None:
    if response.status_code == 201:
        response_201 = ThreadOperationsCreateThreadResponse201.from_dict(response.json())



        return response_201

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


def _build_response(*, client: AuthenticatedClient | Client, response: httpx.Response) -> Response[ApiError | OAuthError | ThreadOperationsCreateThreadResponse201]:
    return Response(
        status_code=HTTPStatus(response.status_code),
        content=response.content,
        headers=response.headers,
        parsed=_parse_response(client=client, response=response),
    )


def sync_detailed(
    id: int,
    *,
    client: AuthenticatedClient | Client,

) -> Response[ApiError | OAuthError | ThreadOperationsCreateThreadResponse201]:
    """  Новый тред

    Метод для создания нового треда к сообщению.

    Если у сообщения уже был создан тред, то в ответе на запрос вернётся информация об уже созданном
    ранее треде.

    Args:
        id (int):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[ApiError | OAuthError | ThreadOperationsCreateThreadResponse201]
     """


    kwargs = _get_kwargs(
        id=id,

    )

    response = client.get_httpx_client().request(
        **kwargs,
    )

    return _build_response(client=client, response=response)

def sync(
    id: int,
    *,
    client: AuthenticatedClient | Client,

) -> ApiError | OAuthError | ThreadOperationsCreateThreadResponse201 | None:
    """  Новый тред

    Метод для создания нового треда к сообщению.

    Если у сообщения уже был создан тред, то в ответе на запрос вернётся информация об уже созданном
    ранее треде.

    Args:
        id (int):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        ApiError | OAuthError | ThreadOperationsCreateThreadResponse201
     """


    return sync_detailed(
        id=id,
client=client,

    ).parsed

async def asyncio_detailed(
    id: int,
    *,
    client: AuthenticatedClient | Client,

) -> Response[ApiError | OAuthError | ThreadOperationsCreateThreadResponse201]:
    """  Новый тред

    Метод для создания нового треда к сообщению.

    Если у сообщения уже был создан тред, то в ответе на запрос вернётся информация об уже созданном
    ранее треде.

    Args:
        id (int):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[ApiError | OAuthError | ThreadOperationsCreateThreadResponse201]
     """


    kwargs = _get_kwargs(
        id=id,

    )

    response = await client.get_async_httpx_client().request(
        **kwargs
    )

    return _build_response(client=client, response=response)

async def asyncio(
    id: int,
    *,
    client: AuthenticatedClient | Client,

) -> ApiError | OAuthError | ThreadOperationsCreateThreadResponse201 | None:
    """  Новый тред

    Метод для создания нового треда к сообщению.

    Если у сообщения уже был создан тред, то в ответе на запрос вернётся информация об уже созданном
    ранее треде.

    Args:
        id (int):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        ApiError | OAuthError | ThreadOperationsCreateThreadResponse201
     """


    return (await asyncio_detailed(
        id=id,
client=client,

    )).parsed
