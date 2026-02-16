from http import HTTPStatus
from typing import Any, cast
from urllib.parse import quote

import httpx

from ...client import AuthenticatedClient, Client
from ...types import Response, UNSET
from ... import errors

from ...models.api_error import ApiError
from ...models.empty_response import EmptyResponse
from ...models.o_auth_error import OAuthError
from typing import cast



def _get_kwargs(
    id: int,

) -> dict[str, Any]:
    

    

    

    _kwargs: dict[str, Any] = {
        "method": "delete",
        "url": "/messages/{id}".format(id=quote(str(id), safe=""),),
    }


    return _kwargs



def _parse_response(*, client: AuthenticatedClient | Client, response: httpx.Response) -> ApiError | EmptyResponse | OAuthError | None:
    if response.status_code == 204:
        response_204 = EmptyResponse.from_dict(response.json())



        return response_204

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


def _build_response(*, client: AuthenticatedClient | Client, response: httpx.Response) -> Response[ApiError | EmptyResponse | OAuthError]:
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

) -> Response[ApiError | EmptyResponse | OAuthError]:
    """  Удаление сообщения

    #admin_access_token_required

    Метод для удаления сообщения.

    Удаление сообщения доступно отправителю, админам и редакторам в чате. В личных сообщениях оба
    пользователя являются редакторами. Ограничений по давности отправки сообщения нет.

    Для удаления сообщения вам необходимо знать его `id` и указать его в `URL` запроса.

    Args:
        id (int):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[ApiError | EmptyResponse | OAuthError]
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

) -> ApiError | EmptyResponse | OAuthError | None:
    """  Удаление сообщения

    #admin_access_token_required

    Метод для удаления сообщения.

    Удаление сообщения доступно отправителю, админам и редакторам в чате. В личных сообщениях оба
    пользователя являются редакторами. Ограничений по давности отправки сообщения нет.

    Для удаления сообщения вам необходимо знать его `id` и указать его в `URL` запроса.

    Args:
        id (int):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        ApiError | EmptyResponse | OAuthError
     """


    return sync_detailed(
        id=id,
client=client,

    ).parsed

async def asyncio_detailed(
    id: int,
    *,
    client: AuthenticatedClient | Client,

) -> Response[ApiError | EmptyResponse | OAuthError]:
    """  Удаление сообщения

    #admin_access_token_required

    Метод для удаления сообщения.

    Удаление сообщения доступно отправителю, админам и редакторам в чате. В личных сообщениях оба
    пользователя являются редакторами. Ограничений по давности отправки сообщения нет.

    Для удаления сообщения вам необходимо знать его `id` и указать его в `URL` запроса.

    Args:
        id (int):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[ApiError | EmptyResponse | OAuthError]
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

) -> ApiError | EmptyResponse | OAuthError | None:
    """  Удаление сообщения

    #admin_access_token_required

    Метод для удаления сообщения.

    Удаление сообщения доступно отправителю, админам и редакторам в чате. В личных сообщениях оба
    пользователя являются редакторами. Ограничений по давности отправки сообщения нет.

    Для удаления сообщения вам необходимо знать его `id` и указать его в `URL` запроса.

    Args:
        id (int):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        ApiError | EmptyResponse | OAuthError
     """


    return (await asyncio_detailed(
        id=id,
client=client,

    )).parsed
