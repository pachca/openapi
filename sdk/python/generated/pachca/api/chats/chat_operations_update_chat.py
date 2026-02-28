from http import HTTPStatus
from typing import Any, cast
from urllib.parse import quote

import httpx

from ...client import AuthenticatedClient, Client
from ...types import Response, UNSET
from ... import errors

from ...models.api_error import ApiError
from ...models.chat_operations_update_chat_response_200 import ChatOperationsUpdateChatResponse200
from ...models.chat_update_request import ChatUpdateRequest
from ...models.o_auth_error import OAuthError
from typing import cast



def _get_kwargs(
    id: int,
    *,
    body: ChatUpdateRequest,

) -> dict[str, Any]:
    headers: dict[str, Any] = {}


    

    

    _kwargs: dict[str, Any] = {
        "method": "put",
        "url": "/chats/{id}".format(id=quote(str(id), safe=""),),
    }

    _kwargs["json"] = body.to_dict()


    headers["Content-Type"] = "application/json"

    _kwargs["headers"] = headers
    return _kwargs



def _parse_response(*, client: AuthenticatedClient | Client, response: httpx.Response) -> ApiError | ChatOperationsUpdateChatResponse200 | OAuthError | None:
    if response.status_code == 200:
        response_200 = ChatOperationsUpdateChatResponse200.from_dict(response.json())



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

    if response.status_code == 404:
        response_404 = ApiError.from_dict(response.json())



        return response_404

    if response.status_code == 422:
        response_422 = ApiError.from_dict(response.json())



        return response_422

    if client.raise_on_unexpected_status:
        raise errors.UnexpectedStatus(response.status_code, response.content)
    else:
        return None


def _build_response(*, client: AuthenticatedClient | Client, response: httpx.Response) -> Response[ApiError | ChatOperationsUpdateChatResponse200 | OAuthError]:
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
    body: ChatUpdateRequest,

) -> Response[ApiError | ChatOperationsUpdateChatResponse200 | OAuthError]:
    """  Обновление чата

    Метод для обновления параметров чата.

    Для обновления нужно знать `id` чата и указать его в `URL`. Все обновляемые поля передаются в теле
    запроса.

    Args:
        id (int):  Example: 334.
        body (ChatUpdateRequest): Запрос на обновление чата

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[ApiError | ChatOperationsUpdateChatResponse200 | OAuthError]
     """


    kwargs = _get_kwargs(
        id=id,
body=body,

    )

    response = client.get_httpx_client().request(
        **kwargs,
    )

    return _build_response(client=client, response=response)

def sync(
    id: int,
    *,
    client: AuthenticatedClient | Client,
    body: ChatUpdateRequest,

) -> ApiError | ChatOperationsUpdateChatResponse200 | OAuthError | None:
    """  Обновление чата

    Метод для обновления параметров чата.

    Для обновления нужно знать `id` чата и указать его в `URL`. Все обновляемые поля передаются в теле
    запроса.

    Args:
        id (int):  Example: 334.
        body (ChatUpdateRequest): Запрос на обновление чата

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        ApiError | ChatOperationsUpdateChatResponse200 | OAuthError
     """


    return sync_detailed(
        id=id,
client=client,
body=body,

    ).parsed

async def asyncio_detailed(
    id: int,
    *,
    client: AuthenticatedClient | Client,
    body: ChatUpdateRequest,

) -> Response[ApiError | ChatOperationsUpdateChatResponse200 | OAuthError]:
    """  Обновление чата

    Метод для обновления параметров чата.

    Для обновления нужно знать `id` чата и указать его в `URL`. Все обновляемые поля передаются в теле
    запроса.

    Args:
        id (int):  Example: 334.
        body (ChatUpdateRequest): Запрос на обновление чата

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[ApiError | ChatOperationsUpdateChatResponse200 | OAuthError]
     """


    kwargs = _get_kwargs(
        id=id,
body=body,

    )

    response = await client.get_async_httpx_client().request(
        **kwargs
    )

    return _build_response(client=client, response=response)

async def asyncio(
    id: int,
    *,
    client: AuthenticatedClient | Client,
    body: ChatUpdateRequest,

) -> ApiError | ChatOperationsUpdateChatResponse200 | OAuthError | None:
    """  Обновление чата

    Метод для обновления параметров чата.

    Для обновления нужно знать `id` чата и указать его в `URL`. Все обновляемые поля передаются в теле
    запроса.

    Args:
        id (int):  Example: 334.
        body (ChatUpdateRequest): Запрос на обновление чата

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        ApiError | ChatOperationsUpdateChatResponse200 | OAuthError
     """


    return (await asyncio_detailed(
        id=id,
client=client,
body=body,

    )).parsed
