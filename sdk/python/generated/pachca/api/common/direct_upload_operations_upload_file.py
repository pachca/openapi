from http import HTTPStatus
from typing import Any, cast
from urllib.parse import quote

import httpx

from ...client import AuthenticatedClient, Client
from ...types import Response, UNSET
from ... import errors

from ...models.file_upload_request import FileUploadRequest
from typing import cast



def _get_kwargs(
    *,
    body: FileUploadRequest,

) -> dict[str, Any]:
    headers: dict[str, Any] = {}


    

    

    _kwargs: dict[str, Any] = {
        "method": "post",
        "url": "/direct_url",
    }

    _kwargs["files"] = body.to_multipart()



    _kwargs["headers"] = headers
    return _kwargs



def _parse_response(*, client: AuthenticatedClient | Client, response: httpx.Response) -> Any | None:
    if response.status_code == 201:
        return None

    if client.raise_on_unexpected_status:
        raise errors.UnexpectedStatus(response.status_code, response.content)
    else:
        return None


def _build_response(*, client: AuthenticatedClient | Client, response: httpx.Response) -> Response[Any]:
    return Response(
        status_code=HTTPStatus(response.status_code),
        content=response.content,
        headers=response.headers,
        parsed=_parse_response(client=client, response=response),
    )


def sync_detailed(
    *,
    client: AuthenticatedClient | Client,
    body: FileUploadRequest,

) -> Response[Any]:
    """  Загрузка файла

    #access_token_not_required

    Для того чтобы прикрепить файл к сообщению или к другой сущности через API, требуется сначала
    загрузить файл на сервер (через метод получения подписи и ключа), а затем сформировать ссылку на
    него.

    **Процесс загрузки состоит из трёх шагов:**

    1. [Получение подписи, ключа и других параметров](POST /uploads) — сделать `POST`-запрос без тела
    запроса для получения параметров загрузки.
    2. **Загрузка файла** — после получения всех параметров, нужно сделать `POST` запрос c форматом
    `multipart/form-data` на адрес `direct_url`, включая те же поля, что пришли (content-disposition,
    acl, policy, x-amz-credential, x-amz-algorithm, x-amz-date, x-amz-signature, key) и сам файл. При
    успешной загрузке — `HTTP` статус `201`.
    3. **Прикрепление файла к сообщению или другой сущности** — после загрузки файла, чтобы прикрепить
    его к сообщению или другой сущности API, необходимо сформировать путь файла. Для этого в поле `key`,
    полученном на этапе подписи, заменить шаблон `$filename` на фактическое имя файла. Пример: Если ваш
    файл называется `Логотип для сайта.png`, а в ответе на метод `/uploads` ключ был
    `attaches/files/93746/e354-...-5e6f/$filename`, итоговый ключ будет
    `attaches/files/93746/e354-...-5e6f/Логотип для сайта.png`.

    Args:
        body (FileUploadRequest):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[Any]
     """


    kwargs = _get_kwargs(
        body=body,

    )

    response = client.get_httpx_client().request(
        **kwargs,
    )

    return _build_response(client=client, response=response)


async def asyncio_detailed(
    *,
    client: AuthenticatedClient | Client,
    body: FileUploadRequest,

) -> Response[Any]:
    """  Загрузка файла

    #access_token_not_required

    Для того чтобы прикрепить файл к сообщению или к другой сущности через API, требуется сначала
    загрузить файл на сервер (через метод получения подписи и ключа), а затем сформировать ссылку на
    него.

    **Процесс загрузки состоит из трёх шагов:**

    1. [Получение подписи, ключа и других параметров](POST /uploads) — сделать `POST`-запрос без тела
    запроса для получения параметров загрузки.
    2. **Загрузка файла** — после получения всех параметров, нужно сделать `POST` запрос c форматом
    `multipart/form-data` на адрес `direct_url`, включая те же поля, что пришли (content-disposition,
    acl, policy, x-amz-credential, x-amz-algorithm, x-amz-date, x-amz-signature, key) и сам файл. При
    успешной загрузке — `HTTP` статус `201`.
    3. **Прикрепление файла к сообщению или другой сущности** — после загрузки файла, чтобы прикрепить
    его к сообщению или другой сущности API, необходимо сформировать путь файла. Для этого в поле `key`,
    полученном на этапе подписи, заменить шаблон `$filename` на фактическое имя файла. Пример: Если ваш
    файл называется `Логотип для сайта.png`, а в ответе на метод `/uploads` ключ был
    `attaches/files/93746/e354-...-5e6f/$filename`, итоговый ключ будет
    `attaches/files/93746/e354-...-5e6f/Логотип для сайта.png`.

    Args:
        body (FileUploadRequest):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[Any]
     """


    kwargs = _get_kwargs(
        body=body,

    )

    response = await client.get_async_httpx_client().request(
        **kwargs
    )

    return _build_response(client=client, response=response)

