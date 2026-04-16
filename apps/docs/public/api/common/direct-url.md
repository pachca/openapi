# Загрузка файла

**Метод**: `POST`

**Путь**: `/direct_url`

> Авторизация не требуется

Загрузка файла на сервер с форматом `multipart/form-data`. Параметры для загрузки получаются через метод [Получение подписи, ключа и других параметров](POST /uploads).

## Тело запроса

**Обязательно**

Формат: `multipart/form-data`

### Схема

- `Content-Disposition: string` (required) — Параметр Content-Disposition, полученный в ответе на запрос [Получение подписи, ключа и других параметров](POST /uploads)
- `acl: string` (required) — Параметр acl, полученный в ответе на запрос [Получение подписи, ключа и других параметров](POST /uploads)
- `policy: string` (required) — Параметр policy, полученный в ответе на запрос [Получение подписи, ключа и других параметров](POST /uploads)
- `x-amz-credential: string` (required) — Параметр x-amz-credential, полученный в ответе на запрос [Получение подписи, ключа и других параметров](POST /uploads)
- `x-amz-algorithm: string` (required) — Параметр x-amz-algorithm, полученный в ответе на запрос [Получение подписи, ключа и других параметров](POST /uploads)
- `x-amz-date: string` (required) — Параметр x-amz-date, полученный в ответе на запрос [Получение подписи, ключа и других параметров](POST /uploads)
- `x-amz-signature: string` (required) — Параметр x-amz-signature, полученный в ответе на запрос [Получение подписи, ключа и других параметров](POST /uploads)
- `key: string` (required) — Параметр key, полученный в ответе на запрос [Получение подписи, ключа и других параметров](POST /uploads)
- `file: binary` (required) — Файл для загрузки


## Пример запроса

```bash
# URL получается из ответа POST /uploads (поле direct_url)
curl "$DIRECT_URL" \
  -F "Content-Disposition=attachment" \
  -F "acl=private" \
  -F "policy=eyJloNBpcmF0aW9u..." \
  -F "x-amz-credential=286471_server/20211122/kz-6x/s3/aws4_request" \
  -F "x-amz-algorithm=AWS4-HMAC-SHA256" \
  -F "x-amz-date=20211122T065734Z" \
  -F "x-amz-signature=87e8f3ba4083c937c0e891d7a11tre932d8c33cg4bacf5380bf27624c1ok1475" \
  -F "key=attaches/files/93746/e354fd79-4f3e-4b5a-9c8d-1a2b3c4d5e6f/$filename" \
  -F "file=@filename.png"
```

## Ответы

### 204: There is no content to send for this request, but the headers may be useful. 

