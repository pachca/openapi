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

### 402: Client error

**Схема ответа при ошибке:**

- `errors: array of object` (required) — Массив ошибок
  - `key: string` (required) — Ключ поля с ошибкой
  - `value: string` (required) — Значение поля, которое вызвало ошибку
  - `message: string` (required) — Сообщение об ошибке
  - `code: string` (required) — Код ошибки
    Значения: `blank` — Обязательное поле (не может быть пустым), `too_long` — Слишком длинное значение (пояснения вы получите в поле message), `invalid` — Поле не соответствует правилам (пояснения вы получите в поле message), `inclusion` — Поле имеет непредусмотренное значение, `exclusion` — Поле имеет недопустимое значение, `taken` — Название для этого поля уже существует, `wrong_emoji` — Emoji статуса не может содержать значения отличные от Emoji символа, `not_found` — Объект не найден, `already_exists` — Объект уже существует (пояснения вы получите в поле message), `personal_chat` — Ошибка личного чата (пояснения вы получите в поле message), `displayed_error` — Отображаемая ошибка (пояснения вы получите в поле message), `not_authorized` — Действие запрещено, `invalid_date_range` — Выбран слишком большой диапазон дат, `invalid_webhook_url` — Некорректный URL вебхука, `rate_limit` — Достигнут лимит запросов, `licenses_limit` — Превышен лимит активных сотрудников (пояснения вы получите в поле message), `user_limit` — Превышен лимит количества реакций, которые может добавить пользователь (20 уникальных реакций), `unique_limit` — Превышен лимит количества уникальных реакций, которые можно добавить на сообщение (30 уникальных реакций), `general_limit` — Превышен лимит количества реакций, которые можно добавить на сообщение (1000 реакций), `unhandled` — Ошибка выполнения запроса (пояснения вы получите в поле message), `trigger_not_found` — Не удалось найти идентификатор события, `trigger_expired` — Время жизни идентификатора события истекло, `required` — Обязательный параметр не передан, `in` — Недопустимое значение (не входит в список допустимых), `not_applicable` — Значение неприменимо в данном контексте (пояснения вы получите в поле message), `self_update` — Нельзя изменить свои собственные данные, `owner_protected` — Нельзя изменить данные владельца, `already_assigned` — Значение уже назначено, `forbidden` — Недостаточно прав для выполнения действия (пояснения вы получите в поле message), `permission_denied` — Доступ запрещён (недостаточно прав), `access_denied` — Доступ запрещён, `wrong_params` — Некорректные параметры запроса (пояснения вы получите в поле message), `payment_required` — Требуется оплата, `min_length` — Значение слишком короткое (пояснения вы получите в поле message), `max_length` — Значение слишком длинное (пояснения вы получите в поле message), `use_of_system_words` — Использовано зарезервированное системное слово (here, all)
  - `payload: Record<string, object>` (required) — Дополнительные данные об ошибке. Содержимое зависит от кода ошибки: `{id: number}` — при ошибке кастомного свойства (идентификатор свойства), `{record: {type: string, id: number}, query: string}` — при ошибке авторизации. В большинстве случаев `null`
    **Структура значений Record:**
    - Тип значения: `any`

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

