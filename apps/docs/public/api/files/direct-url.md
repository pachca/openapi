> Расположение: Методы API → Файлы
> Краткое содержание: Второй шаг загрузки: сам файл уходит в хранилище формой multipart/form-data
> Это Markdown-версия конкретной страницы. Для контекста за её пределами (правила API, полный перечень методов, авторизация) ОБЯЗАТЕЛЬНО открой [llms.txt](https://dev.pachca.com/llms.txt) перед ответом — это сэкономит токены и предотвратит неполный ответ.

# Загрузка файла

**Метод**: `POST`

**Путь**: `/direct_url`

> Авторизация не требуется

Второй шаг загрузки: сам файл уходит в хранилище формой `multipart/form-data`. Поля формы и адрес берутся из ответа метода [Получение подписи, ключа и других параметров](/api/files/uploads) и передаются как есть, в том же порядке, а файл идёт последним полем.

Запрос уходит не в API Пачки, а прямо в хранилище, и в ответ приходит `204` без тела. Дальше файл прикладывают к сообщению, передав его `key` в поле `files` метода [Новое сообщение](/api/messages/create). Имя файла в `name` должно иметь то же расширение, что и `key`, иначе сообщение будет отклонено.

## Тело запроса

**Обязательно**

Формат: `multipart/form-data`

### Схема

- `Content-Disposition: string` (required) — Параметр Content-Disposition, полученный в ответе на запрос [Получение подписи, ключа и других параметров](/api/files/uploads)
- `acl: string` (required) — Параметр acl, полученный в ответе на запрос [Получение подписи, ключа и других параметров](/api/files/uploads)
- `policy: string` (required) — Параметр policy, полученный в ответе на запрос [Получение подписи, ключа и других параметров](/api/files/uploads)
- `x-amz-credential: string` (required) — Параметр x-amz-credential, полученный в ответе на запрос [Получение подписи, ключа и других параметров](/api/files/uploads)
- `x-amz-algorithm: string` (required) — Параметр x-amz-algorithm, полученный в ответе на запрос [Получение подписи, ключа и других параметров](/api/files/uploads)
- `x-amz-date: string` (required) — Параметр x-amz-date, полученный в ответе на запрос [Получение подписи, ключа и других параметров](/api/files/uploads)
- `x-amz-signature: string` (required) — Параметр x-amz-signature, полученный в ответе на запрос [Получение подписи, ключа и других параметров](/api/files/uploads)
- `key: string` (required) — Параметр key, полученный в ответе на запрос [Получение подписи, ключа и других параметров](/api/files/uploads)
- `file: binary` (required) — Файл для загрузки


## Пример запроса

```bash
# URL получается из ответа POST /uploads (поле direct_url)
curl "$DIRECT_URL" \
  -F 'Content-Disposition=attachment' \
  -F 'acl=private' \
  -F 'policy=eyJloNBpcmF0aW9u...' \
  -F 'x-amz-credential=286471_server/20211122/kz-6x/s3/aws4_request' \
  -F 'x-amz-algorithm=AWS4-HMAC-SHA256' \
  -F 'x-amz-date=20211122T065734Z' \
  -F 'x-amz-signature=87e8f3ba4083c937c0e891d7a11tre932d8c33cg4bacf5380bf27624c1ok1475' \
  -F 'key=attaches/files/93746/e354fd79-4f3e-4b5a-9c8d-1a2b3c4d5e6f/${filename}' \
  -F 'file=@filename.png'
```

## Ответы

### 204: There is no content to send for this request, but the headers may be useful. 

