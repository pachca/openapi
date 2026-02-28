from http import HTTPStatus
from typing import Any, cast
from urllib.parse import quote

import httpx

from ...client import AuthenticatedClient, Client
from ...types import Response, UNSET
from ... import errors

from ...models.api_error import ApiError
from ...models.o_auth_error import OAuthError
from ...models.search_operations_search_users_response_200 import SearchOperationsSearchUsersResponse200
from ...models.search_sort_order import SearchSortOrder
from ...models.sort_order import SortOrder
from ...models.user_role import UserRole
from ...types import UNSET, Unset
from dateutil.parser import isoparse
from typing import cast
import datetime



def _get_kwargs(
    *,
    query: str | Unset = UNSET,
    limit: int | Unset = 200,
    cursor: str | Unset = UNSET,
    sort: SearchSortOrder | Unset = UNSET,
    order: SortOrder | Unset = UNSET,
    created_from: datetime.datetime | Unset = UNSET,
    created_to: datetime.datetime | Unset = UNSET,
    company_roles: list[UserRole] | Unset = UNSET,

) -> dict[str, Any]:
    

    

    params: dict[str, Any] = {}

    params["query"] = query

    params["limit"] = limit

    params["cursor"] = cursor

    json_sort: str | Unset = UNSET
    if not isinstance(sort, Unset):
        json_sort = sort.value

    params["sort"] = json_sort

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

    json_company_roles: list[str] | Unset = UNSET
    if not isinstance(company_roles, Unset):
        json_company_roles = []
        for company_roles_item_data in company_roles:
            company_roles_item = company_roles_item_data.value
            json_company_roles.append(company_roles_item)


    params["company_roles"] = json_company_roles


    params = {k: v for k, v in params.items() if v is not UNSET and v is not None}


    _kwargs: dict[str, Any] = {
        "method": "get",
        "url": "/search/users",
        "params": params,
    }


    return _kwargs



def _parse_response(*, client: AuthenticatedClient | Client, response: httpx.Response) -> ApiError | OAuthError | SearchOperationsSearchUsersResponse200 | None:
    if response.status_code == 200:
        response_200 = SearchOperationsSearchUsersResponse200.from_dict(response.json())



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


def _build_response(*, client: AuthenticatedClient | Client, response: httpx.Response) -> Response[ApiError | OAuthError | SearchOperationsSearchUsersResponse200]:
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
    sort: SearchSortOrder | Unset = UNSET,
    order: SortOrder | Unset = UNSET,
    created_from: datetime.datetime | Unset = UNSET,
    created_to: datetime.datetime | Unset = UNSET,
    company_roles: list[UserRole] | Unset = UNSET,

) -> Response[ApiError | OAuthError | SearchOperationsSearchUsersResponse200]:
    """  Поиск сотрудников

    Метод для полнотекстового поиска сотрудников по имени, email, должности и другим полям.

    Args:
        query (str | Unset):  Example: Олег.
        limit (int | Unset):  Default: 200. Example: 10.
        cursor (str | Unset):  Example: eyJpZCI6MTAsImRpciI6ImFzYyJ9.
        sort (SearchSortOrder | Unset): Сортировка результатов поиска
        order (SortOrder | Unset): Порядок сортировки
        created_from (datetime.datetime | Unset):  Example: 2025-01-01T00:00:00.000Z.
        created_to (datetime.datetime | Unset):  Example: 2025-02-01T00:00:00.000Z.
        company_roles (list[UserRole] | Unset):  Example: ['admin', 'user'].

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[ApiError | OAuthError | SearchOperationsSearchUsersResponse200]
     """


    kwargs = _get_kwargs(
        query=query,
limit=limit,
cursor=cursor,
sort=sort,
order=order,
created_from=created_from,
created_to=created_to,
company_roles=company_roles,

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
    sort: SearchSortOrder | Unset = UNSET,
    order: SortOrder | Unset = UNSET,
    created_from: datetime.datetime | Unset = UNSET,
    created_to: datetime.datetime | Unset = UNSET,
    company_roles: list[UserRole] | Unset = UNSET,

) -> ApiError | OAuthError | SearchOperationsSearchUsersResponse200 | None:
    """  Поиск сотрудников

    Метод для полнотекстового поиска сотрудников по имени, email, должности и другим полям.

    Args:
        query (str | Unset):  Example: Олег.
        limit (int | Unset):  Default: 200. Example: 10.
        cursor (str | Unset):  Example: eyJpZCI6MTAsImRpciI6ImFzYyJ9.
        sort (SearchSortOrder | Unset): Сортировка результатов поиска
        order (SortOrder | Unset): Порядок сортировки
        created_from (datetime.datetime | Unset):  Example: 2025-01-01T00:00:00.000Z.
        created_to (datetime.datetime | Unset):  Example: 2025-02-01T00:00:00.000Z.
        company_roles (list[UserRole] | Unset):  Example: ['admin', 'user'].

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        ApiError | OAuthError | SearchOperationsSearchUsersResponse200
     """


    return sync_detailed(
        client=client,
query=query,
limit=limit,
cursor=cursor,
sort=sort,
order=order,
created_from=created_from,
created_to=created_to,
company_roles=company_roles,

    ).parsed

async def asyncio_detailed(
    *,
    client: AuthenticatedClient | Client,
    query: str | Unset = UNSET,
    limit: int | Unset = 200,
    cursor: str | Unset = UNSET,
    sort: SearchSortOrder | Unset = UNSET,
    order: SortOrder | Unset = UNSET,
    created_from: datetime.datetime | Unset = UNSET,
    created_to: datetime.datetime | Unset = UNSET,
    company_roles: list[UserRole] | Unset = UNSET,

) -> Response[ApiError | OAuthError | SearchOperationsSearchUsersResponse200]:
    """  Поиск сотрудников

    Метод для полнотекстового поиска сотрудников по имени, email, должности и другим полям.

    Args:
        query (str | Unset):  Example: Олег.
        limit (int | Unset):  Default: 200. Example: 10.
        cursor (str | Unset):  Example: eyJpZCI6MTAsImRpciI6ImFzYyJ9.
        sort (SearchSortOrder | Unset): Сортировка результатов поиска
        order (SortOrder | Unset): Порядок сортировки
        created_from (datetime.datetime | Unset):  Example: 2025-01-01T00:00:00.000Z.
        created_to (datetime.datetime | Unset):  Example: 2025-02-01T00:00:00.000Z.
        company_roles (list[UserRole] | Unset):  Example: ['admin', 'user'].

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[ApiError | OAuthError | SearchOperationsSearchUsersResponse200]
     """


    kwargs = _get_kwargs(
        query=query,
limit=limit,
cursor=cursor,
sort=sort,
order=order,
created_from=created_from,
created_to=created_to,
company_roles=company_roles,

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
    sort: SearchSortOrder | Unset = UNSET,
    order: SortOrder | Unset = UNSET,
    created_from: datetime.datetime | Unset = UNSET,
    created_to: datetime.datetime | Unset = UNSET,
    company_roles: list[UserRole] | Unset = UNSET,

) -> ApiError | OAuthError | SearchOperationsSearchUsersResponse200 | None:
    """  Поиск сотрудников

    Метод для полнотекстового поиска сотрудников по имени, email, должности и другим полям.

    Args:
        query (str | Unset):  Example: Олег.
        limit (int | Unset):  Default: 200. Example: 10.
        cursor (str | Unset):  Example: eyJpZCI6MTAsImRpciI6ImFzYyJ9.
        sort (SearchSortOrder | Unset): Сортировка результатов поиска
        order (SortOrder | Unset): Порядок сортировки
        created_from (datetime.datetime | Unset):  Example: 2025-01-01T00:00:00.000Z.
        created_to (datetime.datetime | Unset):  Example: 2025-02-01T00:00:00.000Z.
        company_roles (list[UserRole] | Unset):  Example: ['admin', 'user'].

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        ApiError | OAuthError | SearchOperationsSearchUsersResponse200
     """


    return (await asyncio_detailed(
        client=client,
query=query,
limit=limit,
cursor=cursor,
sort=sort,
order=order,
created_from=created_from,
created_to=created_to,
company_roles=company_roles,

    )).parsed
