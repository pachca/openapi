from http import HTTPStatus
from typing import Any, cast
from urllib.parse import quote

import httpx

from ...client import AuthenticatedClient, Client
from ...types import Response, UNSET
from ... import errors

from ...models.api_error import ApiError
from ...models.chat_message_operations_list_chat_messages_response_200 import ChatMessageOperationsListChatMessagesResponse200
from ...models.o_auth_error import OAuthError
from ...models.sort_order import SortOrder
from ...types import UNSET, Unset
from typing import cast



def _get_kwargs(
    *,
    chat_id: int,
    sortfield: SortOrder | Unset = SortOrder.DESC,
    limit: int | Unset = 50,
    cursor: str | Unset = UNSET,

) -> dict[str, Any]:
    

    

    params: dict[str, Any] = {}

    params["chat_id"] = chat_id

    json_sortfield: str | Unset = UNSET
    if not isinstance(sortfield, Unset):
        json_sortfield = sortfield.value

    params["sort[{field}]"] = json_sortfield

    params["limit"] = limit

    params["cursor"] = cursor


    params = {k: v for k, v in params.items() if v is not UNSET and v is not None}


    _kwargs: dict[str, Any] = {
        "method": "get",
        "url": "/messages",
        "params": params,
    }


    return _kwargs



def _parse_response(*, client: AuthenticatedClient | Client, response: httpx.Response) -> ApiError | ChatMessageOperationsListChatMessagesResponse200 | OAuthError | None:
    if response.status_code == 200:
        response_200 = ChatMessageOperationsListChatMessagesResponse200.from_dict(response.json())



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


def _build_response(*, client: AuthenticatedClient | Client, response: httpx.Response) -> Response[ApiError | ChatMessageOperationsListChatMessagesResponse200 | OAuthError]:
    return Response(
        status_code=HTTPStatus(response.status_code),
        content=response.content,
        headers=response.headers,
        parsed=_parse_response(client=client, response=response),
    )


def sync_detailed(
    *,
    client: AuthenticatedClient | Client,
    chat_id: int,
    sortfield: SortOrder | Unset = SortOrder.DESC,
    limit: int | Unset = 50,
    cursor: str | Unset = UNSET,

) -> Response[ApiError | ChatMessageOperationsListChatMessagesResponse200 | OAuthError]:
    """  Список сообщений чата

    Метод для получения списка сообщений бесед, каналов, тредов и личных сообщений.

    Для получения сообщений вам необходимо знать `chat_id` требуемой беседы, канала, треда или диалога,
    и указать его в `URL` запроса. Сообщения будут возвращены в порядке убывания даты отправки (то есть,
    сначала будут идти последние сообщения чата). Для получения более ранних сообщений чата доступны
    параметры `limit` и `cursor`.

    Args:
        chat_id (int):  Example: 198.
        sortfield (SortOrder | Unset): Порядок сортировки Default: SortOrder.DESC.
        limit (int | Unset):  Default: 50. Example: 1.
        cursor (str | Unset):  Example: eyJpZCI6MTAsImRpciI6ImFzYyJ9.

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[ApiError | ChatMessageOperationsListChatMessagesResponse200 | OAuthError]
     """


    kwargs = _get_kwargs(
        chat_id=chat_id,
sortfield=sortfield,
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
    chat_id: int,
    sortfield: SortOrder | Unset = SortOrder.DESC,
    limit: int | Unset = 50,
    cursor: str | Unset = UNSET,

) -> ApiError | ChatMessageOperationsListChatMessagesResponse200 | OAuthError | None:
    """  Список сообщений чата

    Метод для получения списка сообщений бесед, каналов, тредов и личных сообщений.

    Для получения сообщений вам необходимо знать `chat_id` требуемой беседы, канала, треда или диалога,
    и указать его в `URL` запроса. Сообщения будут возвращены в порядке убывания даты отправки (то есть,
    сначала будут идти последние сообщения чата). Для получения более ранних сообщений чата доступны
    параметры `limit` и `cursor`.

    Args:
        chat_id (int):  Example: 198.
        sortfield (SortOrder | Unset): Порядок сортировки Default: SortOrder.DESC.
        limit (int | Unset):  Default: 50. Example: 1.
        cursor (str | Unset):  Example: eyJpZCI6MTAsImRpciI6ImFzYyJ9.

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        ApiError | ChatMessageOperationsListChatMessagesResponse200 | OAuthError
     """


    return sync_detailed(
        client=client,
chat_id=chat_id,
sortfield=sortfield,
limit=limit,
cursor=cursor,

    ).parsed

async def asyncio_detailed(
    *,
    client: AuthenticatedClient | Client,
    chat_id: int,
    sortfield: SortOrder | Unset = SortOrder.DESC,
    limit: int | Unset = 50,
    cursor: str | Unset = UNSET,

) -> Response[ApiError | ChatMessageOperationsListChatMessagesResponse200 | OAuthError]:
    """  Список сообщений чата

    Метод для получения списка сообщений бесед, каналов, тредов и личных сообщений.

    Для получения сообщений вам необходимо знать `chat_id` требуемой беседы, канала, треда или диалога,
    и указать его в `URL` запроса. Сообщения будут возвращены в порядке убывания даты отправки (то есть,
    сначала будут идти последние сообщения чата). Для получения более ранних сообщений чата доступны
    параметры `limit` и `cursor`.

    Args:
        chat_id (int):  Example: 198.
        sortfield (SortOrder | Unset): Порядок сортировки Default: SortOrder.DESC.
        limit (int | Unset):  Default: 50. Example: 1.
        cursor (str | Unset):  Example: eyJpZCI6MTAsImRpciI6ImFzYyJ9.

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[ApiError | ChatMessageOperationsListChatMessagesResponse200 | OAuthError]
     """


    kwargs = _get_kwargs(
        chat_id=chat_id,
sortfield=sortfield,
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
    chat_id: int,
    sortfield: SortOrder | Unset = SortOrder.DESC,
    limit: int | Unset = 50,
    cursor: str | Unset = UNSET,

) -> ApiError | ChatMessageOperationsListChatMessagesResponse200 | OAuthError | None:
    """  Список сообщений чата

    Метод для получения списка сообщений бесед, каналов, тредов и личных сообщений.

    Для получения сообщений вам необходимо знать `chat_id` требуемой беседы, канала, треда или диалога,
    и указать его в `URL` запроса. Сообщения будут возвращены в порядке убывания даты отправки (то есть,
    сначала будут идти последние сообщения чата). Для получения более ранних сообщений чата доступны
    параметры `limit` и `cursor`.

    Args:
        chat_id (int):  Example: 198.
        sortfield (SortOrder | Unset): Порядок сортировки Default: SortOrder.DESC.
        limit (int | Unset):  Default: 50. Example: 1.
        cursor (str | Unset):  Example: eyJpZCI6MTAsImRpciI6ImFzYyJ9.

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        ApiError | ChatMessageOperationsListChatMessagesResponse200 | OAuthError
     """


    return (await asyncio_detailed(
        client=client,
chat_id=chat_id,
sortfield=sortfield,
limit=limit,
cursor=cursor,

    )).parsed
