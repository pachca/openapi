from http import HTTPStatus
from typing import Any, cast
from urllib.parse import quote

import httpx

from ...client import AuthenticatedClient, Client
from ...types import Response, UNSET
from ... import errors

from ...models.api_error import ApiError
from ...models.o_auth_error import OAuthError
from ...types import UNSET, Unset
from typing import cast



def _get_kwargs(
    id: int,
    *,
    code: str,
    name: str | Unset = UNSET,

) -> dict[str, Any]:
    

    

    params: dict[str, Any] = {}

    params["code"] = code

    params["name"] = name


    params = {k: v for k, v in params.items() if v is not UNSET and v is not None}


    _kwargs: dict[str, Any] = {
        "method": "delete",
        "url": "/messages/{id}/reactions".format(id=quote(str(id), safe=""),),
        "params": params,
    }


    return _kwargs



def _parse_response(*, client: AuthenticatedClient | Client, response: httpx.Response) -> Any | ApiError | OAuthError | None:
    if response.status_code == 204:
        response_204 = cast(Any, None)
        return response_204

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


def _build_response(*, client: AuthenticatedClient | Client, response: httpx.Response) -> Response[Any | ApiError | OAuthError]:
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
    code: str,
    name: str | Unset = UNSET,

) -> Response[Any | ApiError | OAuthError]:
    """  Удаление реакции

    Метод для удаления реакции на сообщение.

    Для удаления реакции вам необходимо знать `id` сообщения и указать его в `URL` запроса. Реакции на
    сообщения хранятся в виде символов `Emoji`.

    Удалять можно только те реакции, которые были поставлены авторизованным пользователем.

    Args:
        id (int):  Example: 7231942.
        code (str):  Example: 👍.
        name (str | Unset):  Example: :+1:.

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[Any | ApiError | OAuthError]
     """


    kwargs = _get_kwargs(
        id=id,
code=code,
name=name,

    )

    response = client.get_httpx_client().request(
        **kwargs,
    )

    return _build_response(client=client, response=response)

def sync(
    id: int,
    *,
    client: AuthenticatedClient | Client,
    code: str,
    name: str | Unset = UNSET,

) -> Any | ApiError | OAuthError | None:
    """  Удаление реакции

    Метод для удаления реакции на сообщение.

    Для удаления реакции вам необходимо знать `id` сообщения и указать его в `URL` запроса. Реакции на
    сообщения хранятся в виде символов `Emoji`.

    Удалять можно только те реакции, которые были поставлены авторизованным пользователем.

    Args:
        id (int):  Example: 7231942.
        code (str):  Example: 👍.
        name (str | Unset):  Example: :+1:.

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Any | ApiError | OAuthError
     """


    return sync_detailed(
        id=id,
client=client,
code=code,
name=name,

    ).parsed

async def asyncio_detailed(
    id: int,
    *,
    client: AuthenticatedClient | Client,
    code: str,
    name: str | Unset = UNSET,

) -> Response[Any | ApiError | OAuthError]:
    """  Удаление реакции

    Метод для удаления реакции на сообщение.

    Для удаления реакции вам необходимо знать `id` сообщения и указать его в `URL` запроса. Реакции на
    сообщения хранятся в виде символов `Emoji`.

    Удалять можно только те реакции, которые были поставлены авторизованным пользователем.

    Args:
        id (int):  Example: 7231942.
        code (str):  Example: 👍.
        name (str | Unset):  Example: :+1:.

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[Any | ApiError | OAuthError]
     """


    kwargs = _get_kwargs(
        id=id,
code=code,
name=name,

    )

    response = await client.get_async_httpx_client().request(
        **kwargs
    )

    return _build_response(client=client, response=response)

async def asyncio(
    id: int,
    *,
    client: AuthenticatedClient | Client,
    code: str,
    name: str | Unset = UNSET,

) -> Any | ApiError | OAuthError | None:
    """  Удаление реакции

    Метод для удаления реакции на сообщение.

    Для удаления реакции вам необходимо знать `id` сообщения и указать его в `URL` запроса. Реакции на
    сообщения хранятся в виде символов `Emoji`.

    Удалять можно только те реакции, которые были поставлены авторизованным пользователем.

    Args:
        id (int):  Example: 7231942.
        code (str):  Example: 👍.
        name (str | Unset):  Example: :+1:.

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Any | ApiError | OAuthError
     """


    return (await asyncio_detailed(
        id=id,
client=client,
code=code,
name=name,

    )).parsed
