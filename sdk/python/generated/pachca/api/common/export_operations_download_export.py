from http import HTTPStatus
from typing import Any, cast
from urllib.parse import quote

import httpx

from ...client import AuthenticatedClient, Client
from ...types import Response, UNSET
from ... import errors

from ...models.api_error import ApiError
from ...models.o_auth_error import OAuthError
from typing import cast



def _get_kwargs(
    id: int,

) -> dict[str, Any]:
    

    

    

    _kwargs: dict[str, Any] = {
        "method": "get",
        "url": "/chats/exports/{id}".format(id=quote(str(id), safe=""),),
    }


    return _kwargs



def _parse_response(*, client: AuthenticatedClient | Client, response: httpx.Response) -> Any | ApiError | ApiError | OAuthError | OAuthError | None:
    if response.status_code == 302:
        response_302 = cast(Any, None)
        return response_302

    if response.status_code == 401:
        response_401 = OAuthError.from_dict(response.json())



        return response_401

    if response.status_code == 403:
        def _parse_response_403(data: object) -> ApiError | OAuthError:
            try:
                if not isinstance(data, dict):
                    raise TypeError()
                response_403_type_0 = OAuthError.from_dict(data)



                return response_403_type_0
            except (TypeError, ValueError, AttributeError, KeyError):
                pass
            if not isinstance(data, dict):
                raise TypeError()
            response_403_type_1_type_0 = ApiError.from_dict(data)



            return response_403_type_1_type_0

        response_403 = _parse_response_403(response.json())

        return response_403

    if response.status_code == 404:
        response_404 = ApiError.from_dict(response.json())



        return response_404

    if client.raise_on_unexpected_status:
        raise errors.UnexpectedStatus(response.status_code, response.content)
    else:
        return None


def _build_response(*, client: AuthenticatedClient | Client, response: httpx.Response) -> Response[Any | ApiError | ApiError | OAuthError | OAuthError]:
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

) -> Response[Any | ApiError | ApiError | OAuthError | OAuthError]:
    """  Скачать архив экспорта

    Метод для скачивания готового архива экспорта сообщений.

    Для получения архива вам необходимо знать его `id` и указать его в `URL` запроса.

    В ответ на запрос сервер вернёт `302 Found` с заголовком `Location`, содержащим временную ссылку на
    скачивание файла. Большинство HTTP-клиентов автоматически следуют редиректу и скачивают файл.

    Args:
        id (int):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[Any | ApiError | ApiError | OAuthError | OAuthError]
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

) -> Any | ApiError | ApiError | OAuthError | OAuthError | None:
    """  Скачать архив экспорта

    Метод для скачивания готового архива экспорта сообщений.

    Для получения архива вам необходимо знать его `id` и указать его в `URL` запроса.

    В ответ на запрос сервер вернёт `302 Found` с заголовком `Location`, содержащим временную ссылку на
    скачивание файла. Большинство HTTP-клиентов автоматически следуют редиректу и скачивают файл.

    Args:
        id (int):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Any | ApiError | ApiError | OAuthError | OAuthError
     """


    return sync_detailed(
        id=id,
client=client,

    ).parsed

async def asyncio_detailed(
    id: int,
    *,
    client: AuthenticatedClient | Client,

) -> Response[Any | ApiError | ApiError | OAuthError | OAuthError]:
    """  Скачать архив экспорта

    Метод для скачивания готового архива экспорта сообщений.

    Для получения архива вам необходимо знать его `id` и указать его в `URL` запроса.

    В ответ на запрос сервер вернёт `302 Found` с заголовком `Location`, содержащим временную ссылку на
    скачивание файла. Большинство HTTP-клиентов автоматически следуют редиректу и скачивают файл.

    Args:
        id (int):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[Any | ApiError | ApiError | OAuthError | OAuthError]
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

) -> Any | ApiError | ApiError | OAuthError | OAuthError | None:
    """  Скачать архив экспорта

    Метод для скачивания готового архива экспорта сообщений.

    Для получения архива вам необходимо знать его `id` и указать его в `URL` запроса.

    В ответ на запрос сервер вернёт `302 Found` с заголовком `Location`, содержащим временную ссылку на
    скачивание файла. Большинство HTTP-клиентов автоматически следуют редиректу и скачивают файл.

    Args:
        id (int):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Any | ApiError | ApiError | OAuthError | OAuthError
     """


    return (await asyncio_detailed(
        id=id,
client=client,

    )).parsed
