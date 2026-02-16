from http import HTTPStatus
from typing import Any, cast
from urllib.parse import quote

import httpx

from ...client import AuthenticatedClient, Client
from ...types import Response, UNSET
from ... import errors

from ...models.o_auth_error import OAuthError
from ...models.upload_params import UploadParams
from typing import cast



def _get_kwargs(
    
) -> dict[str, Any]:
    

    

    

    _kwargs: dict[str, Any] = {
        "method": "post",
        "url": "/uploads",
    }


    return _kwargs



def _parse_response(*, client: AuthenticatedClient | Client, response: httpx.Response) -> OAuthError | UploadParams | None:
    if response.status_code == 201:
        response_201 = UploadParams.from_dict(response.json())



        return response_201

    if response.status_code == 401:
        response_401 = OAuthError.from_dict(response.json())



        return response_401

    if response.status_code == 403:
        response_403 = OAuthError.from_dict(response.json())



        return response_403

    if client.raise_on_unexpected_status:
        raise errors.UnexpectedStatus(response.status_code, response.content)
    else:
        return None


def _build_response(*, client: AuthenticatedClient | Client, response: httpx.Response) -> Response[OAuthError | UploadParams]:
    return Response(
        status_code=HTTPStatus(response.status_code),
        content=response.content,
        headers=response.headers,
        parsed=_parse_response(client=client, response=response),
    )


def sync_detailed(
    *,
    client: AuthenticatedClient | Client,

) -> Response[OAuthError | UploadParams]:
    """  Получение подписи, ключа и других параметров

    Метод для получения подписи, ключа и других параметров, необходимых для загрузки файла.

    Данный метод необходимо использовать для загрузки каждого файла.

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[OAuthError | UploadParams]
     """


    kwargs = _get_kwargs(
        
    )

    response = client.get_httpx_client().request(
        **kwargs,
    )

    return _build_response(client=client, response=response)

def sync(
    *,
    client: AuthenticatedClient | Client,

) -> OAuthError | UploadParams | None:
    """  Получение подписи, ключа и других параметров

    Метод для получения подписи, ключа и других параметров, необходимых для загрузки файла.

    Данный метод необходимо использовать для загрузки каждого файла.

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        OAuthError | UploadParams
     """


    return sync_detailed(
        client=client,

    ).parsed

async def asyncio_detailed(
    *,
    client: AuthenticatedClient | Client,

) -> Response[OAuthError | UploadParams]:
    """  Получение подписи, ключа и других параметров

    Метод для получения подписи, ключа и других параметров, необходимых для загрузки файла.

    Данный метод необходимо использовать для загрузки каждого файла.

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[OAuthError | UploadParams]
     """


    kwargs = _get_kwargs(
        
    )

    response = await client.get_async_httpx_client().request(
        **kwargs
    )

    return _build_response(client=client, response=response)

async def asyncio(
    *,
    client: AuthenticatedClient | Client,

) -> OAuthError | UploadParams | None:
    """  Получение подписи, ключа и других параметров

    Метод для получения подписи, ключа и других параметров, необходимых для загрузки файла.

    Данный метод необходимо использовать для загрузки каждого файла.

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        OAuthError | UploadParams
     """


    return (await asyncio_detailed(
        client=client,

    )).parsed
