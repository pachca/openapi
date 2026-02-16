from http import HTTPStatus
from typing import Any, cast
from urllib.parse import quote

import httpx

from ...client import AuthenticatedClient, Client
from ...types import Response, UNSET
from ... import errors

from ...models.api_error import ApiError
from ...models.empty_response import EmptyResponse
from ...models.link_previews_request import LinkPreviewsRequest
from ...models.o_auth_error import OAuthError
from typing import cast



def _get_kwargs(
    id: int,
    *,
    body: LinkPreviewsRequest,

) -> dict[str, Any]:
    headers: dict[str, Any] = {}


    

    

    _kwargs: dict[str, Any] = {
        "method": "post",
        "url": "/messages/{id}/link_previews".format(id=quote(str(id), safe=""),),
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
    *,
    client: AuthenticatedClient | Client,
    body: LinkPreviewsRequest,

) -> Response[ApiError | EmptyResponse | OAuthError]:
    """  Unfurl (разворачивание ссылок)

    #unfurling_bot_access_token_required

    Метод для создания предпросмотров ссылок в сообщениях.

    Для создания предпросмотров ссылок вам необходимо знать `id` сообщения и указать его в `URL`
    запроса.

    Изображения вы можете предоставить как публичной ссылкой (параметром `image_url`), так и с помощью
    прямой загрузки файла на наш сервер (параметром `image`) через метод `Загрузка файлов`. Если вы
    указали оба параметра сразу, то `image` является более приоритетным.

    Если среди присланных `URL`-ключей будет выявлена ошибка (такого `URL` нет в сообщении или боту не
    прописан в настройках домен указанного `URL`), то запрос не будет выполнен (не будет создано ни
    одного предпросмотра).

    На данный момент поддерживается отображение только первого созданного предпросмотра ссылки к
    сообщению. Все присланные вами `link_previews` будут сохранены и появятся в сообщениях в ближайших
    обновлениях.

    Args:
        id (int):
        body (LinkPreviewsRequest): Запрос на разворачивание ссылок

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[ApiError | EmptyResponse | OAuthError]
     """


    kwargs = _get_kwargs(
        id=id,
body=body,

    )

    response = client.get_httpx_client().request(
        **kwargs,
    )

    return _build_response(client=client, response=response)

def sync(
    id: int,
    *,
    client: AuthenticatedClient | Client,
    body: LinkPreviewsRequest,

) -> ApiError | EmptyResponse | OAuthError | None:
    """  Unfurl (разворачивание ссылок)

    #unfurling_bot_access_token_required

    Метод для создания предпросмотров ссылок в сообщениях.

    Для создания предпросмотров ссылок вам необходимо знать `id` сообщения и указать его в `URL`
    запроса.

    Изображения вы можете предоставить как публичной ссылкой (параметром `image_url`), так и с помощью
    прямой загрузки файла на наш сервер (параметром `image`) через метод `Загрузка файлов`. Если вы
    указали оба параметра сразу, то `image` является более приоритетным.

    Если среди присланных `URL`-ключей будет выявлена ошибка (такого `URL` нет в сообщении или боту не
    прописан в настройках домен указанного `URL`), то запрос не будет выполнен (не будет создано ни
    одного предпросмотра).

    На данный момент поддерживается отображение только первого созданного предпросмотра ссылки к
    сообщению. Все присланные вами `link_previews` будут сохранены и появятся в сообщениях в ближайших
    обновлениях.

    Args:
        id (int):
        body (LinkPreviewsRequest): Запрос на разворачивание ссылок

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        ApiError | EmptyResponse | OAuthError
     """


    return sync_detailed(
        id=id,
client=client,
body=body,

    ).parsed

async def asyncio_detailed(
    id: int,
    *,
    client: AuthenticatedClient | Client,
    body: LinkPreviewsRequest,

) -> Response[ApiError | EmptyResponse | OAuthError]:
    """  Unfurl (разворачивание ссылок)

    #unfurling_bot_access_token_required

    Метод для создания предпросмотров ссылок в сообщениях.

    Для создания предпросмотров ссылок вам необходимо знать `id` сообщения и указать его в `URL`
    запроса.

    Изображения вы можете предоставить как публичной ссылкой (параметром `image_url`), так и с помощью
    прямой загрузки файла на наш сервер (параметром `image`) через метод `Загрузка файлов`. Если вы
    указали оба параметра сразу, то `image` является более приоритетным.

    Если среди присланных `URL`-ключей будет выявлена ошибка (такого `URL` нет в сообщении или боту не
    прописан в настройках домен указанного `URL`), то запрос не будет выполнен (не будет создано ни
    одного предпросмотра).

    На данный момент поддерживается отображение только первого созданного предпросмотра ссылки к
    сообщению. Все присланные вами `link_previews` будут сохранены и появятся в сообщениях в ближайших
    обновлениях.

    Args:
        id (int):
        body (LinkPreviewsRequest): Запрос на разворачивание ссылок

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[ApiError | EmptyResponse | OAuthError]
     """


    kwargs = _get_kwargs(
        id=id,
body=body,

    )

    response = await client.get_async_httpx_client().request(
        **kwargs
    )

    return _build_response(client=client, response=response)

async def asyncio(
    id: int,
    *,
    client: AuthenticatedClient | Client,
    body: LinkPreviewsRequest,

) -> ApiError | EmptyResponse | OAuthError | None:
    """  Unfurl (разворачивание ссылок)

    #unfurling_bot_access_token_required

    Метод для создания предпросмотров ссылок в сообщениях.

    Для создания предпросмотров ссылок вам необходимо знать `id` сообщения и указать его в `URL`
    запроса.

    Изображения вы можете предоставить как публичной ссылкой (параметром `image_url`), так и с помощью
    прямой загрузки файла на наш сервер (параметром `image`) через метод `Загрузка файлов`. Если вы
    указали оба параметра сразу, то `image` является более приоритетным.

    Если среди присланных `URL`-ключей будет выявлена ошибка (такого `URL` нет в сообщении или боту не
    прописан в настройках домен указанного `URL`), то запрос не будет выполнен (не будет создано ни
    одного предпросмотра).

    На данный момент поддерживается отображение только первого созданного предпросмотра ссылки к
    сообщению. Все присланные вами `link_previews` будут сохранены и появятся в сообщениях в ближайших
    обновлениях.

    Args:
        id (int):
        body (LinkPreviewsRequest): Запрос на разворачивание ссылок

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        ApiError | EmptyResponse | OAuthError
     """


    return (await asyncio_detailed(
        id=id,
client=client,
body=body,

    )).parsed
