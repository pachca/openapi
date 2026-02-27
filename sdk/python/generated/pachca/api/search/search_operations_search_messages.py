from http import HTTPStatus
from typing import Any, cast
from urllib.parse import quote

import httpx

from ...client import AuthenticatedClient, Client
from ...types import Response, UNSET
from ... import errors

from ...models.api_error import ApiError
from ...models.o_auth_error import OAuthError
from ...models.search_operations_search_messages_response_200 import SearchOperationsSearchMessagesResponse200
from ...models.sort_order import SortOrder
from ...types import UNSET, Unset
from dateutil.parser import isoparse
from typing import cast
import datetime



def _get_kwargs(
    *,
    query: str | Unset = UNSET,
    limit: int | Unset = 200,
    cursor: str | Unset = UNSET,
    order: SortOrder | Unset = UNSET,
    created_from: datetime.datetime | Unset = UNSET,
    created_to: datetime.datetime | Unset = UNSET,
    chat_ids: list[int] | Unset = UNSET,
    user_ids: list[int] | Unset = UNSET,
    active: bool | Unset = UNSET,

) -> dict[str, Any]:
    

    

    params: dict[str, Any] = {}

    params["query"] = query

    params["limit"] = limit

    params["cursor"] = cursor

    json_order: str | Unset = UNSET
    if not isinstance(order, Unset):
        json_order = order.value

    params["order"] = json_order

    json_created_from: str | Unset = UNSET
    if not isinstance(created_from, Unset):
        json_created_from = created_from.isoformat()
    params["created_from"] = json_created_from

    json_created_to: str | Unset = UNSET
    if not isinstance(created_to, Unset):
        json_created_to = created_to.isoformat()
    params["created_to"] = json_created_to

    json_chat_ids: list[int] | Unset = UNSET
    if not isinstance(chat_ids, Unset):
        json_chat_ids = chat_ids


    params["chat_ids"] = json_chat_ids

    json_user_ids: list[int] | Unset = UNSET
    if not isinstance(user_ids, Unset):
        json_user_ids = user_ids


    params["user_ids"] = json_user_ids

    params["active"] = active


    params = {k: v for k, v in params.items() if v is not UNSET and v is not None}


    _kwargs: dict[str, Any] = {
        "method": "get",
        "url": "/search/messages",
        "params": params,
    }


    return _kwargs



def _parse_response(*, client: AuthenticatedClient | Client, response: httpx.Response) -> ApiError | OAuthError | SearchOperationsSearchMessagesResponse200 | None:
    if response.status_code == 200:
        response_200 = SearchOperationsSearchMessagesResponse200.from_dict(response.json())



        return response_200

    if response.status_code == 400:
        response_400 = ApiError.from_dict(response.json())



        return response_400

    if response.status_code == 401:
        response_401 = OAuthError.from_dict(response.json())



        return response_401

    if response.status_code == 402:
        response_402 = ApiError.from_dict(response.json())



        return response_402

    if response.status_code == 403:
        response_403 = OAuthError.from_dict(response.json())



        return response_403

    if client.raise_on_unexpected_status:
        raise errors.UnexpectedStatus(response.status_code, response.content)
    else:
        return None


def _build_response(*, client: AuthenticatedClient | Client, response: httpx.Response) -> Response[ApiError | OAuthError | SearchOperationsSearchMessagesResponse200]:
    return Response(
        status_code=HTTPStatus(response.status_code),
        content=response.content,
        headers=response.headers,
        parsed=_parse_response(client=client, response=response),
    )


def sync_detailed(
    *,
    client: AuthenticatedClient | Client,
    query: str | Unset = UNSET,
    limit: int | Unset = 200,
    cursor: str | Unset = UNSET,
    order: SortOrder | Unset = UNSET,
    created_from: datetime.datetime | Unset = UNSET,
    created_to: datetime.datetime | Unset = UNSET,
    chat_ids: list[int] | Unset = UNSET,
    user_ids: list[int] | Unset = UNSET,
    active: bool | Unset = UNSET,

) -> Response[ApiError | OAuthError | SearchOperationsSearchMessagesResponse200]:
    """  Поиск сообщений

    Метод для полнотекстового поиска сообщений.

    Args:
        query (str | Unset):
        limit (int | Unset):  Default: 200.
        cursor (str | Unset):
        order (SortOrder | Unset): Порядок сортировки
        created_from (datetime.datetime | Unset):
        created_to (datetime.datetime | Unset):
        chat_ids (list[int] | Unset):
        user_ids (list[int] | Unset):
        active (bool | Unset):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[ApiError | OAuthError | SearchOperationsSearchMessagesResponse200]
     """


    kwargs = _get_kwargs(
        query=query,
limit=limit,
cursor=cursor,
order=order,
created_from=created_from,
created_to=created_to,
chat_ids=chat_ids,
user_ids=user_ids,
active=active,

    )

    response = client.get_httpx_client().request(
        **kwargs,
    )

    return _build_response(client=client, response=response)

def sync(
    *,
    client: AuthenticatedClient | Client,
    query: str | Unset = UNSET,
    limit: int | Unset = 200,
    cursor: str | Unset = UNSET,
    order: SortOrder | Unset = UNSET,
    created_from: datetime.datetime | Unset = UNSET,
    created_to: datetime.datetime | Unset = UNSET,
    chat_ids: list[int] | Unset = UNSET,
    user_ids: list[int] | Unset = UNSET,
    active: bool | Unset = UNSET,

) -> ApiError | OAuthError | SearchOperationsSearchMessagesResponse200 | None:
    """  Поиск сообщений

    Метод для полнотекстового поиска сообщений.

    Args:
        query (str | Unset):
        limit (int | Unset):  Default: 200.
        cursor (str | Unset):
        order (SortOrder | Unset): Порядок сортировки
        created_from (datetime.datetime | Unset):
        created_to (datetime.datetime | Unset):
        chat_ids (list[int] | Unset):
        user_ids (list[int] | Unset):
        active (bool | Unset):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        ApiError | OAuthError | SearchOperationsSearchMessagesResponse200
     """


    return sync_detailed(
        client=client,
query=query,
limit=limit,
cursor=cursor,
order=order,
created_from=created_from,
created_to=created_to,
chat_ids=chat_ids,
user_ids=user_ids,
active=active,

    ).parsed

async def asyncio_detailed(
    *,
    client: AuthenticatedClient | Client,
    query: str | Unset = UNSET,
    limit: int | Unset = 200,
    cursor: str | Unset = UNSET,
    order: SortOrder | Unset = UNSET,
    created_from: datetime.datetime | Unset = UNSET,
    created_to: datetime.datetime | Unset = UNSET,
    chat_ids: list[int] | Unset = UNSET,
    user_ids: list[int] | Unset = UNSET,
    active: bool | Unset = UNSET,

) -> Response[ApiError | OAuthError | SearchOperationsSearchMessagesResponse200]:
    """  Поиск сообщений

    Метод для полнотекстового поиска сообщений.

    Args:
        query (str | Unset):
        limit (int | Unset):  Default: 200.
        cursor (str | Unset):
        order (SortOrder | Unset): Порядок сортировки
        created_from (datetime.datetime | Unset):
        created_to (datetime.datetime | Unset):
        chat_ids (list[int] | Unset):
        user_ids (list[int] | Unset):
        active (bool | Unset):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[ApiError | OAuthError | SearchOperationsSearchMessagesResponse200]
     """


    kwargs = _get_kwargs(
        query=query,
limit=limit,
cursor=cursor,
order=order,
created_from=created_from,
created_to=created_to,
chat_ids=chat_ids,
user_ids=user_ids,
active=active,

    )

    response = await client.get_async_httpx_client().request(
        **kwargs
    )

    return _build_response(client=client, response=response)

async def asyncio(
    *,
    client: AuthenticatedClient | Client,
    query: str | Unset = UNSET,
    limit: int | Unset = 200,
    cursor: str | Unset = UNSET,
    order: SortOrder | Unset = UNSET,
    created_from: datetime.datetime | Unset = UNSET,
    created_to: datetime.datetime | Unset = UNSET,
    chat_ids: list[int] | Unset = UNSET,
    user_ids: list[int] | Unset = UNSET,
    active: bool | Unset = UNSET,

) -> ApiError | OAuthError | SearchOperationsSearchMessagesResponse200 | None:
    """  Поиск сообщений

    Метод для полнотекстового поиска сообщений.

    Args:
        query (str | Unset):
        limit (int | Unset):  Default: 200.
        cursor (str | Unset):
        order (SortOrder | Unset): Порядок сортировки
        created_from (datetime.datetime | Unset):
        created_to (datetime.datetime | Unset):
        chat_ids (list[int] | Unset):
        user_ids (list[int] | Unset):
        active (bool | Unset):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        ApiError | OAuthError | SearchOperationsSearchMessagesResponse200
     """


    return (await asyncio_detailed(
        client=client,
query=query,
limit=limit,
cursor=cursor,
order=order,
created_from=created_from,
created_to=created_to,
chat_ids=chat_ids,
user_ids=user_ids,
active=active,

    )).parsed
