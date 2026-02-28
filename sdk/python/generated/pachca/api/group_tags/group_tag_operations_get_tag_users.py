from http import HTTPStatus
from typing import Any, cast
from urllib.parse import quote

import httpx

from ...client import AuthenticatedClient, Client
from ...types import Response, UNSET
from ... import errors

from ...models.api_error import ApiError
from ...models.group_tag_operations_get_tag_users_response_200 import GroupTagOperationsGetTagUsersResponse200
from ...models.o_auth_error import OAuthError
from ...types import UNSET, Unset
from typing import cast



def _get_kwargs(
    id: int,
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
        "url": "/group_tags/{id}/users".format(id=quote(str(id), safe=""),),
        "params": params,
    }


    return _kwargs



def _parse_response(*, client: AuthenticatedClient | Client, response: httpx.Response) -> ApiError | GroupTagOperationsGetTagUsersResponse200 | OAuthError | None:
    if response.status_code == 200:
        response_200 = GroupTagOperationsGetTagUsersResponse200.from_dict(response.json())



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


def _build_response(*, client: AuthenticatedClient | Client, response: httpx.Response) -> Response[ApiError | GroupTagOperationsGetTagUsersResponse200 | OAuthError]:
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
    limit: int | Unset = 50,
    cursor: str | Unset = UNSET,

) -> Response[ApiError | GroupTagOperationsGetTagUsersResponse200 | OAuthError]:
    """  Список сотрудников тега

    Метод для получения актуального списка сотрудников тега.

    Args:
        id (int):  Example: 9111.
        limit (int | Unset):  Default: 50. Example: 1.
        cursor (str | Unset):  Example: eyJpZCI6MTAsImRpciI6ImFzYyJ9.

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[ApiError | GroupTagOperationsGetTagUsersResponse200 | OAuthError]
     """


    kwargs = _get_kwargs(
        id=id,
limit=limit,
cursor=cursor,

    )

    response = client.get_httpx_client().request(
        **kwargs,
    )

    return _build_response(client=client, response=response)

def sync(
    id: int,
    *,
    client: AuthenticatedClient | Client,
    limit: int | Unset = 50,
    cursor: str | Unset = UNSET,

) -> ApiError | GroupTagOperationsGetTagUsersResponse200 | OAuthError | None:
    """  Список сотрудников тега

    Метод для получения актуального списка сотрудников тега.

    Args:
        id (int):  Example: 9111.
        limit (int | Unset):  Default: 50. Example: 1.
        cursor (str | Unset):  Example: eyJpZCI6MTAsImRpciI6ImFzYyJ9.

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        ApiError | GroupTagOperationsGetTagUsersResponse200 | OAuthError
     """


    return sync_detailed(
        id=id,
client=client,
limit=limit,
cursor=cursor,

    ).parsed

async def asyncio_detailed(
    id: int,
    *,
    client: AuthenticatedClient | Client,
    limit: int | Unset = 50,
    cursor: str | Unset = UNSET,

) -> Response[ApiError | GroupTagOperationsGetTagUsersResponse200 | OAuthError]:
    """  Список сотрудников тега

    Метод для получения актуального списка сотрудников тега.

    Args:
        id (int):  Example: 9111.
        limit (int | Unset):  Default: 50. Example: 1.
        cursor (str | Unset):  Example: eyJpZCI6MTAsImRpciI6ImFzYyJ9.

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[ApiError | GroupTagOperationsGetTagUsersResponse200 | OAuthError]
     """


    kwargs = _get_kwargs(
        id=id,
limit=limit,
cursor=cursor,

    )

    response = await client.get_async_httpx_client().request(
        **kwargs
    )

    return _build_response(client=client, response=response)

async def asyncio(
    id: int,
    *,
    client: AuthenticatedClient | Client,
    limit: int | Unset = 50,
    cursor: str | Unset = UNSET,

) -> ApiError | GroupTagOperationsGetTagUsersResponse200 | OAuthError | None:
    """  Список сотрудников тега

    Метод для получения актуального списка сотрудников тега.

    Args:
        id (int):  Example: 9111.
        limit (int | Unset):  Default: 50. Example: 1.
        cursor (str | Unset):  Example: eyJpZCI6MTAsImRpciI6ImFzYyJ9.

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        ApiError | GroupTagOperationsGetTagUsersResponse200 | OAuthError
     """


    return (await asyncio_detailed(
        id=id,
client=client,
limit=limit,
cursor=cursor,

    )).parsed
