from http import HTTPStatus
from typing import Any, cast
from urllib.parse import quote

import httpx

from ...client import AuthenticatedClient, Client
from ...types import Response, UNSET
from ... import errors

from ...models.api_error import ApiError
from ...models.o_auth_error import OAuthError
from ...models.security_operations_get_audit_events_response_200 import SecurityOperationsGetAuditEventsResponse200
from ...types import UNSET, Unset
from dateutil.parser import isoparse
from typing import cast
import datetime



def _get_kwargs(
    *,
    start_time: datetime.datetime,
    end_time: datetime.datetime,
    event_key: str | Unset = UNSET,
    actor_id: int | Unset = UNSET,
    actor_type: str | Unset = UNSET,
    entity_id: int | Unset = UNSET,
    entity_type: str | Unset = UNSET,
    limit: int | Unset = 50,
    cursor: str | Unset = UNSET,

) -> dict[str, Any]:
    

    

    params: dict[str, Any] = {}

    json_start_time = start_time.isoformat()
    params["start_time"] = json_start_time

    json_end_time = end_time.isoformat()
    params["end_time"] = json_end_time

    params["event_key"] = event_key

    params["actor_id"] = actor_id

    params["actor_type"] = actor_type

    params["entity_id"] = entity_id

    params["entity_type"] = entity_type

    params["limit"] = limit

    params["cursor"] = cursor


    params = {k: v for k, v in params.items() if v is not UNSET and v is not None}


    _kwargs: dict[str, Any] = {
        "method": "get",
        "url": "/audit-events",
        "params": params,
    }


    return _kwargs



def _parse_response(*, client: AuthenticatedClient | Client, response: httpx.Response) -> ApiError | OAuthError | SecurityOperationsGetAuditEventsResponse200 | None:
    if response.status_code == 200:
        response_200 = SecurityOperationsGetAuditEventsResponse200.from_dict(response.json())



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


def _build_response(*, client: AuthenticatedClient | Client, response: httpx.Response) -> Response[ApiError | OAuthError | SecurityOperationsGetAuditEventsResponse200]:
    return Response(
        status_code=HTTPStatus(response.status_code),
        content=response.content,
        headers=response.headers,
        parsed=_parse_response(client=client, response=response),
    )


def sync_detailed(
    *,
    client: AuthenticatedClient | Client,
    start_time: datetime.datetime,
    end_time: datetime.datetime,
    event_key: str | Unset = UNSET,
    actor_id: int | Unset = UNSET,
    actor_type: str | Unset = UNSET,
    entity_id: int | Unset = UNSET,
    entity_type: str | Unset = UNSET,
    limit: int | Unset = 50,
    cursor: str | Unset = UNSET,

) -> Response[ApiError | OAuthError | SecurityOperationsGetAuditEventsResponse200]:
    """  Журнал аудита событий

    #corporation_price_only

    Метод для получения логов событий на основе указанных фильтров.

    Args:
        start_time (datetime.datetime):
        end_time (datetime.datetime):
        event_key (str | Unset):
        actor_id (int | Unset):
        actor_type (str | Unset):
        entity_id (int | Unset):
        entity_type (str | Unset):
        limit (int | Unset):  Default: 50.
        cursor (str | Unset):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[ApiError | OAuthError | SecurityOperationsGetAuditEventsResponse200]
     """


    kwargs = _get_kwargs(
        start_time=start_time,
end_time=end_time,
event_key=event_key,
actor_id=actor_id,
actor_type=actor_type,
entity_id=entity_id,
entity_type=entity_type,
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
    start_time: datetime.datetime,
    end_time: datetime.datetime,
    event_key: str | Unset = UNSET,
    actor_id: int | Unset = UNSET,
    actor_type: str | Unset = UNSET,
    entity_id: int | Unset = UNSET,
    entity_type: str | Unset = UNSET,
    limit: int | Unset = 50,
    cursor: str | Unset = UNSET,

) -> ApiError | OAuthError | SecurityOperationsGetAuditEventsResponse200 | None:
    """  Журнал аудита событий

    #corporation_price_only

    Метод для получения логов событий на основе указанных фильтров.

    Args:
        start_time (datetime.datetime):
        end_time (datetime.datetime):
        event_key (str | Unset):
        actor_id (int | Unset):
        actor_type (str | Unset):
        entity_id (int | Unset):
        entity_type (str | Unset):
        limit (int | Unset):  Default: 50.
        cursor (str | Unset):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        ApiError | OAuthError | SecurityOperationsGetAuditEventsResponse200
     """


    return sync_detailed(
        client=client,
start_time=start_time,
end_time=end_time,
event_key=event_key,
actor_id=actor_id,
actor_type=actor_type,
entity_id=entity_id,
entity_type=entity_type,
limit=limit,
cursor=cursor,

    ).parsed

async def asyncio_detailed(
    *,
    client: AuthenticatedClient | Client,
    start_time: datetime.datetime,
    end_time: datetime.datetime,
    event_key: str | Unset = UNSET,
    actor_id: int | Unset = UNSET,
    actor_type: str | Unset = UNSET,
    entity_id: int | Unset = UNSET,
    entity_type: str | Unset = UNSET,
    limit: int | Unset = 50,
    cursor: str | Unset = UNSET,

) -> Response[ApiError | OAuthError | SecurityOperationsGetAuditEventsResponse200]:
    """  Журнал аудита событий

    #corporation_price_only

    Метод для получения логов событий на основе указанных фильтров.

    Args:
        start_time (datetime.datetime):
        end_time (datetime.datetime):
        event_key (str | Unset):
        actor_id (int | Unset):
        actor_type (str | Unset):
        entity_id (int | Unset):
        entity_type (str | Unset):
        limit (int | Unset):  Default: 50.
        cursor (str | Unset):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[ApiError | OAuthError | SecurityOperationsGetAuditEventsResponse200]
     """


    kwargs = _get_kwargs(
        start_time=start_time,
end_time=end_time,
event_key=event_key,
actor_id=actor_id,
actor_type=actor_type,
entity_id=entity_id,
entity_type=entity_type,
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
    start_time: datetime.datetime,
    end_time: datetime.datetime,
    event_key: str | Unset = UNSET,
    actor_id: int | Unset = UNSET,
    actor_type: str | Unset = UNSET,
    entity_id: int | Unset = UNSET,
    entity_type: str | Unset = UNSET,
    limit: int | Unset = 50,
    cursor: str | Unset = UNSET,

) -> ApiError | OAuthError | SecurityOperationsGetAuditEventsResponse200 | None:
    """  Журнал аудита событий

    #corporation_price_only

    Метод для получения логов событий на основе указанных фильтров.

    Args:
        start_time (datetime.datetime):
        end_time (datetime.datetime):
        event_key (str | Unset):
        actor_id (int | Unset):
        actor_type (str | Unset):
        entity_id (int | Unset):
        entity_type (str | Unset):
        limit (int | Unset):  Default: 50.
        cursor (str | Unset):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        ApiError | OAuthError | SecurityOperationsGetAuditEventsResponse200
     """


    return (await asyncio_detailed(
        client=client,
start_time=start_time,
end_time=end_time,
event_key=event_key,
actor_id=actor_id,
actor_type=actor_type,
entity_id=entity_id,
entity_type=entity_type,
limit=limit,
cursor=cursor,

    )).parsed
