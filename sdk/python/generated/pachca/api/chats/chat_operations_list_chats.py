from http import HTTPStatus
from typing import Any, cast
from urllib.parse import quote

import httpx

from ...client import AuthenticatedClient, Client
from ...types import Response, UNSET
from ... import errors

from ...models.api_error import ApiError
from ...models.chat_availability import ChatAvailability
from ...models.chat_operations_list_chats_response_200 import ChatOperationsListChatsResponse200
from ...models.o_auth_error import OAuthError
from ...models.sort_order import SortOrder
from ...types import UNSET, Unset
from dateutil.parser import isoparse
from typing import cast
import datetime



def _get_kwargs(
    *,
    sortfield: SortOrder | Unset = SortOrder.DESC,
    availability: ChatAvailability | Unset = ChatAvailability.IS_MEMBER,
    last_message_at_after: datetime.datetime | Unset = UNSET,
    last_message_at_before: datetime.datetime | Unset = UNSET,
    personal: bool | Unset = UNSET,
    limit: int | Unset = 50,
    cursor: str | Unset = UNSET,

) -> dict[str, Any]:
    

    

    params: dict[str, Any] = {}

    json_sortfield: str | Unset = UNSET
    if not isinstance(sortfield, Unset):
        json_sortfield = sortfield.value

    params["sort[{field}]"] = json_sortfield

    json_availability: str | Unset = UNSET
    if not isinstance(availability, Unset):
        json_availability = availability.value

    params["availability"] = json_availability

    json_last_message_at_after: str | Unset = UNSET
    if not isinstance(last_message_at_after, Unset):
        json_last_message_at_after = last_message_at_after.isoformat()
    params["last_message_at_after"] = json_last_message_at_after

    json_last_message_at_before: str | Unset = UNSET
    if not isinstance(last_message_at_before, Unset):
        json_last_message_at_before = last_message_at_before.isoformat()
    params["last_message_at_before"] = json_last_message_at_before

    params["personal"] = personal

    params["limit"] = limit

    params["cursor"] = cursor


    params = {k: v for k, v in params.items() if v is not UNSET and v is not None}


    _kwargs: dict[str, Any] = {
        "method": "get",
        "url": "/chats",
        "params": params,
    }


    return _kwargs



def _parse_response(*, client: AuthenticatedClient | Client, response: httpx.Response) -> ApiError | ChatOperationsListChatsResponse200 | OAuthError | None:
    if response.status_code == 200:
        response_200 = ChatOperationsListChatsResponse200.from_dict(response.json())



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


def _build_response(*, client: AuthenticatedClient | Client, response: httpx.Response) -> Response[ApiError | ChatOperationsListChatsResponse200 | OAuthError]:
    return Response(
        status_code=HTTPStatus(response.status_code),
        content=response.content,
        headers=response.headers,
        parsed=_parse_response(client=client, response=response),
    )


def sync_detailed(
    *,
    client: AuthenticatedClient | Client,
    sortfield: SortOrder | Unset = SortOrder.DESC,
    availability: ChatAvailability | Unset = ChatAvailability.IS_MEMBER,
    last_message_at_after: datetime.datetime | Unset = UNSET,
    last_message_at_before: datetime.datetime | Unset = UNSET,
    personal: bool | Unset = UNSET,
    limit: int | Unset = 50,
    cursor: str | Unset = UNSET,

) -> Response[ApiError | ChatOperationsListChatsResponse200 | OAuthError]:
    """  Список чатов

    Метод для получения списка чатов по заданным параметрам.

    Args:
        sortfield (SortOrder | Unset): Порядок сортировки Default: SortOrder.DESC.
        availability (ChatAvailability | Unset): Доступность чатов для пользователя Default:
            ChatAvailability.IS_MEMBER.
        last_message_at_after (datetime.datetime | Unset):
        last_message_at_before (datetime.datetime | Unset):
        personal (bool | Unset):
        limit (int | Unset):  Default: 50.
        cursor (str | Unset):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[ApiError | ChatOperationsListChatsResponse200 | OAuthError]
     """


    kwargs = _get_kwargs(
        sortfield=sortfield,
availability=availability,
last_message_at_after=last_message_at_after,
last_message_at_before=last_message_at_before,
personal=personal,
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
    sortfield: SortOrder | Unset = SortOrder.DESC,
    availability: ChatAvailability | Unset = ChatAvailability.IS_MEMBER,
    last_message_at_after: datetime.datetime | Unset = UNSET,
    last_message_at_before: datetime.datetime | Unset = UNSET,
    personal: bool | Unset = UNSET,
    limit: int | Unset = 50,
    cursor: str | Unset = UNSET,

) -> ApiError | ChatOperationsListChatsResponse200 | OAuthError | None:
    """  Список чатов

    Метод для получения списка чатов по заданным параметрам.

    Args:
        sortfield (SortOrder | Unset): Порядок сортировки Default: SortOrder.DESC.
        availability (ChatAvailability | Unset): Доступность чатов для пользователя Default:
            ChatAvailability.IS_MEMBER.
        last_message_at_after (datetime.datetime | Unset):
        last_message_at_before (datetime.datetime | Unset):
        personal (bool | Unset):
        limit (int | Unset):  Default: 50.
        cursor (str | Unset):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        ApiError | ChatOperationsListChatsResponse200 | OAuthError
     """


    return sync_detailed(
        client=client,
sortfield=sortfield,
availability=availability,
last_message_at_after=last_message_at_after,
last_message_at_before=last_message_at_before,
personal=personal,
limit=limit,
cursor=cursor,

    ).parsed

async def asyncio_detailed(
    *,
    client: AuthenticatedClient | Client,
    sortfield: SortOrder | Unset = SortOrder.DESC,
    availability: ChatAvailability | Unset = ChatAvailability.IS_MEMBER,
    last_message_at_after: datetime.datetime | Unset = UNSET,
    last_message_at_before: datetime.datetime | Unset = UNSET,
    personal: bool | Unset = UNSET,
    limit: int | Unset = 50,
    cursor: str | Unset = UNSET,

) -> Response[ApiError | ChatOperationsListChatsResponse200 | OAuthError]:
    """  Список чатов

    Метод для получения списка чатов по заданным параметрам.

    Args:
        sortfield (SortOrder | Unset): Порядок сортировки Default: SortOrder.DESC.
        availability (ChatAvailability | Unset): Доступность чатов для пользователя Default:
            ChatAvailability.IS_MEMBER.
        last_message_at_after (datetime.datetime | Unset):
        last_message_at_before (datetime.datetime | Unset):
        personal (bool | Unset):
        limit (int | Unset):  Default: 50.
        cursor (str | Unset):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[ApiError | ChatOperationsListChatsResponse200 | OAuthError]
     """


    kwargs = _get_kwargs(
        sortfield=sortfield,
availability=availability,
last_message_at_after=last_message_at_after,
last_message_at_before=last_message_at_before,
personal=personal,
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
    sortfield: SortOrder | Unset = SortOrder.DESC,
    availability: ChatAvailability | Unset = ChatAvailability.IS_MEMBER,
    last_message_at_after: datetime.datetime | Unset = UNSET,
    last_message_at_before: datetime.datetime | Unset = UNSET,
    personal: bool | Unset = UNSET,
    limit: int | Unset = 50,
    cursor: str | Unset = UNSET,

) -> ApiError | ChatOperationsListChatsResponse200 | OAuthError | None:
    """  Список чатов

    Метод для получения списка чатов по заданным параметрам.

    Args:
        sortfield (SortOrder | Unset): Порядок сортировки Default: SortOrder.DESC.
        availability (ChatAvailability | Unset): Доступность чатов для пользователя Default:
            ChatAvailability.IS_MEMBER.
        last_message_at_after (datetime.datetime | Unset):
        last_message_at_before (datetime.datetime | Unset):
        personal (bool | Unset):
        limit (int | Unset):  Default: 50.
        cursor (str | Unset):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        ApiError | ChatOperationsListChatsResponse200 | OAuthError
     """


    return (await asyncio_detailed(
        client=client,
sortfield=sortfield,
availability=availability,
last_message_at_after=last_message_at_after,
last_message_at_before=last_message_at_before,
personal=personal,
limit=limit,
cursor=cursor,

    )).parsed
