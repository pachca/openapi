from http import HTTPStatus
from typing import Any, cast
from urllib.parse import quote

import httpx

from ...client import AuthenticatedClient, Client
from ...types import Response, UNSET
from ... import errors

from ...models.api_error import ApiError
from ...models.bot_operations_update_bot_response_200 import BotOperationsUpdateBotResponse200
from ...models.bot_update_request import BotUpdateRequest
from ...models.o_auth_error import OAuthError
from typing import cast



def _get_kwargs(
    id: int,
    *,
    body: BotUpdateRequest,

) -> dict[str, Any]:
    headers: dict[str, Any] = {}


    

    

    _kwargs: dict[str, Any] = {
        "method": "put",
        "url": "/bots/{id}".format(id=quote(str(id), safe=""),),
    }

    _kwargs["json"] = body.to_dict()


    headers["Content-Type"] = "application/json"

    _kwargs["headers"] = headers
    return _kwargs



def _parse_response(*, client: AuthenticatedClient | Client, response: httpx.Response) -> ApiError | BotOperationsUpdateBotResponse200 | OAuthError | None:
    if response.status_code == 200:
        response_200 = BotOperationsUpdateBotResponse200.from_dict(response.json())



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


def _build_response(*, client: AuthenticatedClient | Client, response: httpx.Response) -> Response[ApiError | BotOperationsUpdateBotResponse200 | OAuthError]:
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
    body: BotUpdateRequest,

) -> Response[ApiError | BotOperationsUpdateBotResponse200 | OAuthError]:
    """  Редактирование бота

    Метод для редактирования бота.

    Для редактирования бота вам необходимо знать его `user_id` и указать его в `URL` запроса. Все
    редактируемые параметры бота указываются в теле запроса. Узнать `user_id` бота можно в настройках
    бота во вкладке «API».

    Вы не можете редактировать бота, настройки которого вам недоступны (поле «Кто может редактировать
    настройки бота» находится во вкладке «Основное» в настройках бота).

    Args:
        id (int):  Example: 1738816.
        body (BotUpdateRequest): Запрос на обновление бота

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[ApiError | BotOperationsUpdateBotResponse200 | OAuthError]
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
    body: BotUpdateRequest,

) -> ApiError | BotOperationsUpdateBotResponse200 | OAuthError | None:
    """  Редактирование бота

    Метод для редактирования бота.

    Для редактирования бота вам необходимо знать его `user_id` и указать его в `URL` запроса. Все
    редактируемые параметры бота указываются в теле запроса. Узнать `user_id` бота можно в настройках
    бота во вкладке «API».

    Вы не можете редактировать бота, настройки которого вам недоступны (поле «Кто может редактировать
    настройки бота» находится во вкладке «Основное» в настройках бота).

    Args:
        id (int):  Example: 1738816.
        body (BotUpdateRequest): Запрос на обновление бота

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        ApiError | BotOperationsUpdateBotResponse200 | OAuthError
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
    body: BotUpdateRequest,

) -> Response[ApiError | BotOperationsUpdateBotResponse200 | OAuthError]:
    """  Редактирование бота

    Метод для редактирования бота.

    Для редактирования бота вам необходимо знать его `user_id` и указать его в `URL` запроса. Все
    редактируемые параметры бота указываются в теле запроса. Узнать `user_id` бота можно в настройках
    бота во вкладке «API».

    Вы не можете редактировать бота, настройки которого вам недоступны (поле «Кто может редактировать
    настройки бота» находится во вкладке «Основное» в настройках бота).

    Args:
        id (int):  Example: 1738816.
        body (BotUpdateRequest): Запрос на обновление бота

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[ApiError | BotOperationsUpdateBotResponse200 | OAuthError]
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
    body: BotUpdateRequest,

) -> ApiError | BotOperationsUpdateBotResponse200 | OAuthError | None:
    """  Редактирование бота

    Метод для редактирования бота.

    Для редактирования бота вам необходимо знать его `user_id` и указать его в `URL` запроса. Все
    редактируемые параметры бота указываются в теле запроса. Узнать `user_id` бота можно в настройках
    бота во вкладке «API».

    Вы не можете редактировать бота, настройки которого вам недоступны (поле «Кто может редактировать
    настройки бота» находится во вкладке «Основное» в настройках бота).

    Args:
        id (int):  Example: 1738816.
        body (BotUpdateRequest): Запрос на обновление бота

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        ApiError | BotOperationsUpdateBotResponse200 | OAuthError
     """


    return (await asyncio_detailed(
        id=id,
client=client,
body=body,

    )).parsed
