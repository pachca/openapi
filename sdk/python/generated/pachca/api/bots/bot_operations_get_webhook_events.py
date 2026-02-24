from http import HTTPStatus
from typing import Any, cast
from urllib.parse import quote

import httpx

from ...client import AuthenticatedClient, Client
from ...types import Response, UNSET
from ... import errors

from ...models.api_error import ApiError
from ...models.bot_operations_get_webhook_events_response_200 import BotOperationsGetWebhookEventsResponse200
from ...models.o_auth_error import OAuthError
from ...types import UNSET, Unset
from typing import cast



def _get_kwargs(
    *,
    limit: int | Unset = 50,
    cursor: str | Unset = UNSET,

) -> dict[str, Any]:
    

    

    params: dict[str, Any] = {}

    params["limit"] = limit

    params["cursor"] = cursor


    params = {k: v for k, v in params.items() if v is not UNSET and v is not None}


    _kwargs: dict[str, Any] = {
        "method": "get",
        "url": "/webhooks/events",
        "params": params,
    }


    return _kwargs



def _parse_response(*, client: AuthenticatedClient | Client, response: httpx.Response) -> ApiError | BotOperationsGetWebhookEventsResponse200 | OAuthError | None:
    if response.status_code == 200:
        response_200 = BotOperationsGetWebhookEventsResponse200.from_dict(response.json())



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


def _build_response(*, client: AuthenticatedClient | Client, response: httpx.Response) -> Response[ApiError | BotOperationsGetWebhookEventsResponse200 | OAuthError]:
    return Response(
        status_code=HTTPStatus(response.status_code),
        content=response.content,
        headers=response.headers,
        parsed=_parse_response(client=client, response=response),
    )


def sync_detailed(
    *,
    client: AuthenticatedClient | Client,
    limit: int | Unset = 50,
    cursor: str | Unset = UNSET,

) -> Response[ApiError | BotOperationsGetWebhookEventsResponse200 | OAuthError]:
    """  История событий

    Метод для получения истории последних событий бота. Данный метод будет полезен, если вы не можете
    получать события в реальном времени на ваш `URL`, но вам требуется обрабатывать все события, на
    которые вы подписались.

    История событий сохраняется только при активном пункте «Сохранять историю событий» во вкладке
    «Исходящий webhook» настроек бота. При этом указывать «Webhook `URL`» не требуется.

    Для получения истории событий конкретного бота вам необходимо знать его `access_token` и
    использовать его при запросе. Каждое событие представляет `JSON` объект вебхука.

    Args:
        limit (int | Unset):  Default: 50.
        cursor (str | Unset):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[ApiError | BotOperationsGetWebhookEventsResponse200 | OAuthError]
     """


    kwargs = _get_kwargs(
        limit=limit,
cursor=cursor,

    )

    response = client.get_httpx_client().request(
        **kwargs,
    )

    return _build_response(client=client, response=response)

def sync(
    *,
    client: AuthenticatedClient | Client,
    limit: int | Unset = 50,
    cursor: str | Unset = UNSET,

) -> ApiError | BotOperationsGetWebhookEventsResponse200 | OAuthError | None:
    """  История событий

    Метод для получения истории последних событий бота. Данный метод будет полезен, если вы не можете
    получать события в реальном времени на ваш `URL`, но вам требуется обрабатывать все события, на
    которые вы подписались.

    История событий сохраняется только при активном пункте «Сохранять историю событий» во вкладке
    «Исходящий webhook» настроек бота. При этом указывать «Webhook `URL`» не требуется.

    Для получения истории событий конкретного бота вам необходимо знать его `access_token` и
    использовать его при запросе. Каждое событие представляет `JSON` объект вебхука.

    Args:
        limit (int | Unset):  Default: 50.
        cursor (str | Unset):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        ApiError | BotOperationsGetWebhookEventsResponse200 | OAuthError
     """


    return sync_detailed(
        client=client,
limit=limit,
cursor=cursor,

    ).parsed

async def asyncio_detailed(
    *,
    client: AuthenticatedClient | Client,
    limit: int | Unset = 50,
    cursor: str | Unset = UNSET,

) -> Response[ApiError | BotOperationsGetWebhookEventsResponse200 | OAuthError]:
    """  История событий

    Метод для получения истории последних событий бота. Данный метод будет полезен, если вы не можете
    получать события в реальном времени на ваш `URL`, но вам требуется обрабатывать все события, на
    которые вы подписались.

    История событий сохраняется только при активном пункте «Сохранять историю событий» во вкладке
    «Исходящий webhook» настроек бота. При этом указывать «Webhook `URL`» не требуется.

    Для получения истории событий конкретного бота вам необходимо знать его `access_token` и
    использовать его при запросе. Каждое событие представляет `JSON` объект вебхука.

    Args:
        limit (int | Unset):  Default: 50.
        cursor (str | Unset):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[ApiError | BotOperationsGetWebhookEventsResponse200 | OAuthError]
     """


    kwargs = _get_kwargs(
        limit=limit,
cursor=cursor,

    )

    response = await client.get_async_httpx_client().request(
        **kwargs
    )

    return _build_response(client=client, response=response)

async def asyncio(
    *,
    client: AuthenticatedClient | Client,
    limit: int | Unset = 50,
    cursor: str | Unset = UNSET,

) -> ApiError | BotOperationsGetWebhookEventsResponse200 | OAuthError | None:
    """  История событий

    Метод для получения истории последних событий бота. Данный метод будет полезен, если вы не можете
    получать события в реальном времени на ваш `URL`, но вам требуется обрабатывать все события, на
    которые вы подписались.

    История событий сохраняется только при активном пункте «Сохранять историю событий» во вкладке
    «Исходящий webhook» настроек бота. При этом указывать «Webhook `URL`» не требуется.

    Для получения истории событий конкретного бота вам необходимо знать его `access_token` и
    использовать его при запросе. Каждое событие представляет `JSON` объект вебхука.

    Args:
        limit (int | Unset):  Default: 50.
        cursor (str | Unset):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        ApiError | BotOperationsGetWebhookEventsResponse200 | OAuthError
     """


    return (await asyncio_detailed(
        client=client,
limit=limit,
cursor=cursor,

    )).parsed
