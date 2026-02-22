from http import HTTPStatus
from typing import Any, cast
from urllib.parse import quote

import httpx

from ...client import AuthenticatedClient, Client
from ...types import Response, UNSET
from ... import errors

from ...models.api_error import ApiError
from ...models.empty_response import EmptyResponse
from ...models.o_auth_error import OAuthError
from ...models.update_member_role_request import UpdateMemberRoleRequest
from typing import cast



def _get_kwargs(
    id: int,
    user_id: int,
    *,
    body: UpdateMemberRoleRequest,

) -> dict[str, Any]:
    headers: dict[str, Any] = {}


    

    

    _kwargs: dict[str, Any] = {
        "method": "put",
        "url": "/chats/{id}/members/{user_id}".format(id=quote(str(id), safe=""),user_id=quote(str(user_id), safe=""),),
    }

    _kwargs["json"] = body.to_dict()


    headers["Content-Type"] = "application/json"

    _kwargs["headers"] = headers
    return _kwargs



def _parse_response(*, client: AuthenticatedClient | Client, response: httpx.Response) -> ApiError | EmptyResponse | OAuthError | None:
    if response.status_code == 204:
        response_204 = EmptyResponse.from_dict(response.json())



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


def _build_response(*, client: AuthenticatedClient | Client, response: httpx.Response) -> Response[ApiError | EmptyResponse | OAuthError]:
    return Response(
        status_code=HTTPStatus(response.status_code),
        content=response.content,
        headers=response.headers,
        parsed=_parse_response(client=client, response=response),
    )


def sync_detailed(
    id: int,
    user_id: int,
    *,
    client: AuthenticatedClient | Client,
    body: UpdateMemberRoleRequest,

) -> Response[ApiError | EmptyResponse | OAuthError]:
    """  Редактирование роли

    Метод для редактирования роли пользователя или бота в беседе или канале.

    Для редактирования роли в беседе или канале вам необходимо знать `id` чата и пользователя (или бота)
    и указать их в `URL` запроса. Все редактируемые параметры роли указываются в теле запроса.

    Владельцу чата роль изменить нельзя. Он всегда имеет права Админа в чате.

    Args:
        id (int):
        user_id (int):
        body (UpdateMemberRoleRequest): Запрос на изменение роли участника

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[ApiError | EmptyResponse | OAuthError]
     """


    kwargs = _get_kwargs(
        id=id,
user_id=user_id,
body=body,

    )

    response = client.get_httpx_client().request(
        **kwargs,
    )

    return _build_response(client=client, response=response)

def sync(
    id: int,
    user_id: int,
    *,
    client: AuthenticatedClient | Client,
    body: UpdateMemberRoleRequest,

) -> ApiError | EmptyResponse | OAuthError | None:
    """  Редактирование роли

    Метод для редактирования роли пользователя или бота в беседе или канале.

    Для редактирования роли в беседе или канале вам необходимо знать `id` чата и пользователя (или бота)
    и указать их в `URL` запроса. Все редактируемые параметры роли указываются в теле запроса.

    Владельцу чата роль изменить нельзя. Он всегда имеет права Админа в чате.

    Args:
        id (int):
        user_id (int):
        body (UpdateMemberRoleRequest): Запрос на изменение роли участника

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        ApiError | EmptyResponse | OAuthError
     """


    return sync_detailed(
        id=id,
user_id=user_id,
client=client,
body=body,

    ).parsed

async def asyncio_detailed(
    id: int,
    user_id: int,
    *,
    client: AuthenticatedClient | Client,
    body: UpdateMemberRoleRequest,

) -> Response[ApiError | EmptyResponse | OAuthError]:
    """  Редактирование роли

    Метод для редактирования роли пользователя или бота в беседе или канале.

    Для редактирования роли в беседе или канале вам необходимо знать `id` чата и пользователя (или бота)
    и указать их в `URL` запроса. Все редактируемые параметры роли указываются в теле запроса.

    Владельцу чата роль изменить нельзя. Он всегда имеет права Админа в чате.

    Args:
        id (int):
        user_id (int):
        body (UpdateMemberRoleRequest): Запрос на изменение роли участника

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[ApiError | EmptyResponse | OAuthError]
     """


    kwargs = _get_kwargs(
        id=id,
user_id=user_id,
body=body,

    )

    response = await client.get_async_httpx_client().request(
        **kwargs
    )

    return _build_response(client=client, response=response)

async def asyncio(
    id: int,
    user_id: int,
    *,
    client: AuthenticatedClient | Client,
    body: UpdateMemberRoleRequest,

) -> ApiError | EmptyResponse | OAuthError | None:
    """  Редактирование роли

    Метод для редактирования роли пользователя или бота в беседе или канале.

    Для редактирования роли в беседе или канале вам необходимо знать `id` чата и пользователя (или бота)
    и указать их в `URL` запроса. Все редактируемые параметры роли указываются в теле запроса.

    Владельцу чата роль изменить нельзя. Он всегда имеет права Админа в чате.

    Args:
        id (int):
        user_id (int):
        body (UpdateMemberRoleRequest): Запрос на изменение роли участника

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        ApiError | EmptyResponse | OAuthError
     """


    return (await asyncio_detailed(
        id=id,
user_id=user_id,
client=client,
body=body,

    )).parsed
