> Расположение: Методы API → Файлы
> Краткое содержание: Первый шаг загрузки файла: метод выдаёт адрес хранилища и подписанные поля формы, с которыми файл заливают следующим запросом.
> Это Markdown-версия конкретной страницы. Для контекста за её пределами (правила API, полный перечень методов, авторизация) ОБЯЗАТЕЛЬНО открой [llms.txt](https://dev.pachca.com/llms.txt) перед ответом — это сэкономит токены и предотвратит неполный ответ.

# Получение подписи, ключа и других параметров

**Метод**: `POST`

**Путь**: `/uploads`

> **Скоуп:** `uploads:write`

Первый шаг загрузки файла: метод выдаёт адрес хранилища и подписанные поля формы, с которыми файл заливают следующим запросом.

Ничего в Пачке при этом ещё не создаётся: загруженный файл никому не виден и ни к чему не привязан. Вложением он становится, когда его `key` передан в поле `files` — в [Новое сообщение](/api/messages/create) или [Новый черновик](/api/drafts/create), а также при их правке.

Параметры выдаются на один файл: для каждого следующего запрашивайте их заново. Подпись действует 14 дней, а `key` привязан к владельцу токена, поэтому чужой ключ приложить к своему сообщению не получится.

## Пример запроса

```bash
curl -X POST "https://api.pachca.com/api/shared/v1/uploads" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Ответы

### 201: The request has succeeded and a new resource has been created as a result.

**Схема ответа:**

- `Content-Disposition: string` (required) — Используемый заголовок (в данном запросе — attachment). Пример: `"attachment"`
- `acl: string` — Уровень безопасности, `private`. Приходит не во всех пространствах: если поле есть в ответе, его передают в форме загрузки. Пример: `"private"`
- `policy: string` (required) — Уникальная policy для загрузки файла. Пример: `"eyJloNBpcmF0aW9uIjoiMjAyPi0xMi0wOFQwNjo1NzozNFHusCJjb82kaXRpb25zIjpbeyJidWNrZXQiOiJwYWNoY2EtcHJhYy11cGxvYWRzOu0sWyJzdGFydHMtd3l4aCIsIiRrZXkiLCJhdHRhY8hlcy9maWxlcy1xODUyMSJdLHsiQ29udGVudC1EaXNwb3NpdGlvbiI6ImF0dGFjaG1lbnQifSx2ImFjbCI3InByaXZhdGUifSx7IngtYW16LWNyZWRlbnRpYWwi2iIxNDIxNTVfc3RhcGx4LzIwMjIxMTI0L2J1LTFhL5MzL1F2czRfcmVxdWVzdCJ9LHsieC1hbXotYWxnb3JpdGhtIjytQVdTNC1ITUFDLVNIQTI1NiJ7LHsieC1hbXotZGF0ZSI6IjIwMjIxMTI0VDA2NTczNFoifV12"`
- `x-amz-credential: string` (required) — x-amz-credential для загрузки файла. Пример: `"286471_server/20211122/kz-6x/s3/aws4_request"`
- `x-amz-algorithm: string` (required) — Используемый алгоритм (в данном запросе — AWS4-HMAC-SHA256). Пример: `"AWS4-HMAC-SHA256"`
- `x-amz-date: string` (required) — Уникальный x-amz-date для загрузки файла. Пример: `"20211122T065734Z"`
- `x-amz-signature: string` (required) — Уникальная подпись для загрузки файла. Пример: `"87e8f3ba4083c937c0e891d7a11tre932d8c33cg4bacf5380bf27624c1ok1475"`
- `key: string` (required) — Уникальный ключ для загрузки файла. Чтобы приложить файл, в ключе заменяют `${filename}` на имя файла, а остальное передают как есть: начало ключа бывает разным. Пример: `"attaches/files/93746/e354fd79-4f3e-4b5a-9c8d-1a2b3c4d5e6f/${filename}"`
- `bucket: string` — Имя хранилища. Приходит не во всех пространствах: если поле есть в ответе, его передают в форме загрузки. Пример: `"uploads"`
- `direct_url: string` (required) — Адрес хранилища, куда отправляется форма загрузки. Пример: `"https://uploads.storage.example.com"`

**Пример ответа:**

```json
{
  "Content-Disposition": "attachment",
  "acl": "private",
  "policy": "eyJloNBpcmF0aW9uIjoiMjAyPi0xMi0wOFQwNjo1NzozNFHusCJjb82kaXRpb25zIjpbeyJidWNrZXQiOiJwYWNoY2EtcHJhYy11cGxvYWRzOu0sWyJzdGFydHMtd3l4aCIsIiRrZXkiLCJhdHRhY8hlcy9maWxlcy1xODUyMSJdLHsiQ29udGVudC1EaXNwb3NpdGlvbiI6ImF0dGFjaG1lbnQifSx2ImFjbCI3InByaXZhdGUifSx7IngtYW16LWNyZWRlbnRpYWwi2iIxNDIxNTVfc3RhcGx4LzIwMjIxMTI0L2J1LTFhL5MzL1F2czRfcmVxdWVzdCJ9LHsieC1hbXotYWxnb3JpdGhtIjytQVdTNC1ITUFDLVNIQTI1NiJ7LHsieC1hbXotZGF0ZSI6IjIwMjIxMTI0VDA2NTczNFoifV12",
  "x-amz-credential": "286471_server/20211122/kz-6x/s3/aws4_request",
  "x-amz-algorithm": "AWS4-HMAC-SHA256",
  "x-amz-date": "20211122T065734Z",
  "x-amz-signature": "87e8f3ba4083c937c0e891d7a11tre932d8c33cg4bacf5380bf27624c1ok1475",
  "key": "attaches/files/93746/e354fd79-4f3e-4b5a-9c8d-1a2b3c4d5e6f/${filename}",
  "direct_url": "https://uploads.storage.example.com"
}
```

### 401: Access is unauthorized.

**Схема ответа при ошибке:** `OAuthError`. Поля и коды описаны в разделе [Ошибки](/api/errors).

**Пример ответа:**

```json
{
  "error": "invalid_token",
  "error_description": "Access token is missing"
}
```

### 402: Client error

**Схема ответа при ошибке:** `ApiError`. Поля и коды описаны в разделе [Ошибки](/api/errors).

**Пример ответа:**

```json
{
  "errors": [
    {
      "key": "field.name",
      "value": "invalid_value",
      "message": "Поле не может быть пустым",
      "code": "blank",
      "payload": null
    }
  ]
}
```

### 403: Access is forbidden.

**Схема ответа при ошибке:** `ApiError` или `OAuthError`. Поля и коды описаны в разделе [Ошибки](/api/errors).

**Пример ответа:**

```json
{
  "errors": [
    {
      "key": "field.name",
      "value": "invalid_value",
      "message": "Поле не может быть пустым",
      "code": "blank",
      "payload": null
    }
  ]
}
```

