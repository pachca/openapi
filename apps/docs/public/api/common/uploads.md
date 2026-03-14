# Получение подписи, ключа и других параметров

**Метод**: `POST`

**Путь**: `/uploads`

> **Скоуп:** `uploads:write`

Метод для получения подписи, ключа и других параметров, необходимых для загрузки файла.

Данный метод необходимо использовать для загрузки каждого файла.

## Пример запроса

```bash
curl -X POST "https://api.pachca.com/api/shared/v1/uploads" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Ответы

### 201: The request has succeeded and a new resource has been created as a result.

**Схема ответа:**

- `Content-Disposition: string` (required) — Используемый заголовок (в данном запросе — attachment)
- `acl: string` (required) — Уровень безопасности (в данном запросе — private)
- `policy: string` (required) — Уникальная policy для загрузки файла
- `x-amz-credential: string` (required) — x-amz-credential для загрузки файла
- `x-amz-algorithm: string` (required) — Используемый алгоритм (в данном запросе — AWS4-HMAC-SHA256)
- `x-amz-date: string` (required) — Уникальный x-amz-date для загрузки файла
- `x-amz-signature: string` (required) — Уникальная подпись для загрузки файла
- `key: string` (required) — Уникальный ключ для загрузки файла
- `direct_url: string` (required) — Адрес для загрузки файла

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
  "direct_url": "https://api.pachca.com/api/v3/direct_upload"
}
```

### 401: Access is unauthorized.

**Схема ответа при ошибке:**

- `error: string` (required) — Код ошибки
- `error_description: string` (required) — Описание ошибки

**Пример ответа:**

```json
{
  "error": "invalid_token",
  "error_description": "Access token is missing"
}
```

### 403: Access is forbidden.

**Схема ответа при ошибке:**

- `error: string` (required) — Код ошибки
- `error_description: string` (required) — Описание ошибки

**Пример ответа:**

```json
{
  "error": "invalid_token",
  "error_description": "Access token is missing"
}
```

