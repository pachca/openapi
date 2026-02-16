from http import HTTPStatus
from typing import Any, cast
from urllib.parse import quote

import httpx

from ...client import AuthenticatedClient, Client
from ...types import Response, UNSET
from ... import errors

from ...models.api_error import ApiError
from ...models.message_create_request import MessageCreateRequest
from ...models.message_operations_create_message_response_201 import MessageOperationsCreateMessageResponse201
from ...models.o_auth_error import OAuthError
from typing import cast



def _get_kwargs(
    *,
    body: MessageCreateRequest,

) -> dict[str, Any]:
    headers: dict[str, Any] = {}


    

    

    _kwargs: dict[str, Any] = {
        "method": "post",
        "url": "/messages",
    }

    _kwargs["json"] = body.to_dict()


    headers["Content-Type"] = "application/json"

    _kwargs["headers"] = headers
    return _kwargs



def _parse_response(*, client: AuthenticatedClient | Client, response: httpx.Response) -> ApiError | MessageOperationsCreateMessageResponse201 | OAuthError | None:
    if response.status_code == 201:
        response_201 = MessageOperationsCreateMessageResponse201.from_dict(response.json())



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


def _build_response(*, client: AuthenticatedClient | Client, response: httpx.Response) -> Response[ApiError | MessageOperationsCreateMessageResponse201 | OAuthError]:
    return Response(
        status_code=HTTPStatus(response.status_code),
        content=response.content,
        headers=response.headers,
        parsed=_parse_response(client=client, response=response),
    )


def sync_detailed(
    *,
    client: AuthenticatedClient | Client,
    body: MessageCreateRequest,

) -> Response[ApiError | MessageOperationsCreateMessageResponse201 | OAuthError]:
    r"""  Новое сообщение

    Метод для отправки сообщения в беседу или канал, личного сообщения пользователю или комментария в
    тред.

    При использовании `entity_type: \"discussion\"` (или просто без указания `entity_type`) допускается
    отправка любого `chat_id` в поле `entity_id`. То есть, сообщение можно отправить зная только
    идентификатор чата. При этом, вы имеете возможность отправить сообщение в тред по его идентификатору
    или личное сообщение по идентификатору пользователя.

    Для отправки личного сообщения пользователю создавать чат не требуется. Достаточно указать
    `entity_type: \"user\"` и идентификатор пользователя. Чат будет создан автоматически, если между
    вами ещё не было переписки. Между двумя пользователями может быть только один личный чат.

    Args:
        body (MessageCreateRequest): Запрос на создание сообщения

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[ApiError | MessageOperationsCreateMessageResponse201 | OAuthError]
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
    body: MessageCreateRequest,

) -> ApiError | MessageOperationsCreateMessageResponse201 | OAuthError | None:
    r"""  Новое сообщение

    Метод для отправки сообщения в беседу или канал, личного сообщения пользователю или комментария в
    тред.

    При использовании `entity_type: \"discussion\"` (или просто без указания `entity_type`) допускается
    отправка любого `chat_id` в поле `entity_id`. То есть, сообщение можно отправить зная только
    идентификатор чата. При этом, вы имеете возможность отправить сообщение в тред по его идентификатору
    или личное сообщение по идентификатору пользователя.

    Для отправки личного сообщения пользователю создавать чат не требуется. Достаточно указать
    `entity_type: \"user\"` и идентификатор пользователя. Чат будет создан автоматически, если между
    вами ещё не было переписки. Между двумя пользователями может быть только один личный чат.

    Args:
        body (MessageCreateRequest): Запрос на создание сообщения

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        ApiError | MessageOperationsCreateMessageResponse201 | OAuthError
     """


    return sync_detailed(
        client=client,
body=body,

    ).parsed

async def asyncio_detailed(
    *,
    client: AuthenticatedClient | Client,
    body: MessageCreateRequest,

) -> Response[ApiError | MessageOperationsCreateMessageResponse201 | OAuthError]:
    r"""  Новое сообщение

    Метод для отправки сообщения в беседу или канал, личного сообщения пользователю или комментария в
    тред.

    При использовании `entity_type: \"discussion\"` (или просто без указания `entity_type`) допускается
    отправка любого `chat_id` в поле `entity_id`. То есть, сообщение можно отправить зная только
    идентификатор чата. При этом, вы имеете возможность отправить сообщение в тред по его идентификатору
    или личное сообщение по идентификатору пользователя.

    Для отправки личного сообщения пользователю создавать чат не требуется. Достаточно указать
    `entity_type: \"user\"` и идентификатор пользователя. Чат будет создан автоматически, если между
    вами ещё не было переписки. Между двумя пользователями может быть только один личный чат.

    Args:
        body (MessageCreateRequest): Запрос на создание сообщения

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[ApiError | MessageOperationsCreateMessageResponse201 | OAuthError]
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
    body: MessageCreateRequest,

) -> ApiError | MessageOperationsCreateMessageResponse201 | OAuthError | None:
    r"""  Новое сообщение

    Метод для отправки сообщения в беседу или канал, личного сообщения пользователю или комментария в
    тред.

    При использовании `entity_type: \"discussion\"` (или просто без указания `entity_type`) допускается
    отправка любого `chat_id` в поле `entity_id`. То есть, сообщение можно отправить зная только
    идентификатор чата. При этом, вы имеете возможность отправить сообщение в тред по его идентификатору
    или личное сообщение по идентификатору пользователя.

    Для отправки личного сообщения пользователю создавать чат не требуется. Достаточно указать
    `entity_type: \"user\"` и идентификатор пользователя. Чат будет создан автоматически, если между
    вами ещё не было переписки. Между двумя пользователями может быть только один личный чат.

    Args:
        body (MessageCreateRequest): Запрос на создание сообщения

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        ApiError | MessageOperationsCreateMessageResponse201 | OAuthError
     """


    return (await asyncio_detailed(
        client=client,
body=body,

    )).parsed
