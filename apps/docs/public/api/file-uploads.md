
# Загрузка файлов

Загрузка файлов через API Пачки — трёхшаговый процесс с presigned URL (S3-совместимое хранилище).

## Процесс загрузки


  ### Шаг 1. Получение параметров загрузки

Сделайте запрос к методу [Получение подписи, ключа и других параметров](POST /uploads) без тела для получения подписи и параметров. Данный метод необходимо использовать для загрузки каждого файла.

    **Получение параметров загрузки**

```bash
curl -X POST "https://api.pachca.com/api/shared/v1/uploads" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```


    В ответе вы получите параметры для следующего шага: `Content-Disposition`, `acl`, `policy`, `x-amz-credential`, `x-amz-algorithm`, `x-amz-date`, `x-amz-signature`, `key` и `direct_url`.


  ### Шаг 2. Загрузка файла

Отправьте запрос к методу [Загрузка файла](POST /direct_url) с форматом `multipart/form-data` на адрес `direct_url`. Включите все полученные параметры и сам файл. При успешной загрузке сервер вернёт `HTTP 201 Created`.

    **Загрузка файла**

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


    > **Внимание:** Порядок полей в multipart-запросе важен: файл (`file`) должен быть **последним** полем.


  ### Шаг 3. Прикрепление файла к сообщению или другой сущности

После загрузки файла, чтобы прикрепить его к сообщению или другой сущности API, необходимо сформировать путь файла. Для этого в поле `key`, полученном на этапе подписи, заменить шаблон `${filename}` на фактическое имя файла.

    Пример: если ваш файл называется `Логотип для сайта.png`, а в ответе на метод `/uploads` ключ был `attaches/files/93746/e354-...-5e6f/${filename}`, итоговый ключ будет `attaches/files/93746/e354-...-5e6f/Логотип для сайта.png`.

    ```json title="Файл в сообщении"
    {
      "message": {
        "entity_type": "discussion",
        "entity_id": 12345,
        "content": "Документ прикреплён",
        "files": [
          {
            "key": "attaches/files/93746/e354fd79-.../document.pdf",
            "name": "document.pdf",
            "file_type": "file",
            "size": 102400
          }
        ]
      }
    }
    ```


## Через CLI

Команда `pachca upload` автоматически выполняет шаги 1 и 2 — получает подпись и загружает файл на S3. Возвращает готовый `key`:

```bash
# Загрузить файл
pachca upload report.pdf

# Загрузить и отправить в чат
KEY=$(pachca upload report.pdf -o json | jq -r '.key')
pachca messages create --entity-id 12345 \
  --content "Отчёт прикреплён" \
  --files "[{\"key\":\"$KEY\",\"name\":\"report.pdf\",\"file_type\":\"file\",\"size\":$(stat -f%z report.pdf)}]"
```

## Типы файлов

| Тип | `file_type` | Дополнительные поля |
|-----|-------------|---------------------|
| Файл | `file` | — |
| Изображение | `image` | `width`, `height` — размеры в пикселях |

## Примеры полного цикла

### TypeScript SDK

```typescript
import { PachcaClient, FileUploadRequest, FileType } from "@pachca/sdk"
import fs from "fs"
import path from "path"

const client = new PachcaClient("YOUR_TOKEN")

const filePath = "./report.pdf"
const fileName = path.basename(filePath)
const fileBuffer = fs.readFileSync(filePath)

// Шаг 1: Получить параметры загрузки
const params = await client.common.getUploadParams()

// Шаг 2: Загрузить файл на S3 (direct_url — внешний presigned URL)
await client.common.uploadFile(params.directUrl, {
  contentDisposition: params.contentDisposition,
  acl: params.acl,
  policy: params.policy,
  xAmzCredential: params.xAmzCredential,
  xAmzAlgorithm: params.xAmzAlgorithm,
  xAmzDate: params.xAmzDate,
  xAmzSignature: params.xAmzSignature,
  key: params.key,
  file: new File([fileBuffer], fileName)
})

// Шаг 3: Отправить сообщение с файлом
const fileKey = params.key.replace("${filename}", fileName)
await client.messages.createMessage({
  message: {
    entityType: "discussion",
    entityId: 12345,
    content: "Отчёт прикреплён",
    files: [{ key: fileKey, name: fileName, fileType: FileType.File, size: fileBuffer.length }]
  }
})
```

### Python SDK

```python
from pachca.client import PachcaClient
from pachca.models import FileUploadRequest, MessageCreateRequest, MessageCreateRequestMessage, MessageCreateRequestFile, FileType
import os

client = PachcaClient("YOUR_TOKEN")

file_path = "report.pdf"
file_name = os.path.basename(file_path)

# Шаг 1: Получить параметры загрузки
params = await client.common.get_upload_params()

# Шаг 2: Загрузить файл на S3 (direct_url — внешний presigned URL)
with open(file_path, "rb") as f:
    await client.common.upload_file(
        direct_url=params.direct_url,
        request=FileUploadRequest(
            content_disposition=params.content_disposition,
            acl=params.acl,
            policy=params.policy,
            x_amz_credential=params.x_amz_credential,
            x_amz_algorithm=params.x_amz_algorithm,
            x_amz_date=params.x_amz_date,
            x_amz_signature=params.x_amz_signature,
            key=params.key,
            file=f.read()
        )
    )

# Шаг 3: Отправить сообщение с файлом
file_key = params.key.replace("${filename}", file_name)
await client.messages.create_message(MessageCreateRequest(
    message=MessageCreateRequestMessage(
        entity_type="discussion",
        entity_id=12345,
        content="Отчёт прикреплён",
        files=[MessageCreateRequestFile(key=file_key, name=file_name, file_type=FileType.FILE, size=os.path.getsize(file_path))]
    )
))
```

## Поля multipart-формы для S3

Все поля из ответа [Получение подписи](POST /uploads) передаются на S3 **как есть** в multipart-форме:

| Поле | Описание |
|------|----------|
| `Content-Disposition` | Заголовок для скачивания |
| `acl` | Права доступа S3 |
| `policy` | Base64-кодированная политика загрузки |
| `x-amz-credential` | AWS credential |
| `x-amz-algorithm` | Всегда `AWS4-HMAC-SHA256` |
| `x-amz-date` | Дата подписи |
| `x-amz-signature` | Подпись запроса |
| `key` | Путь файла на S3 (содержит `${filename}` — заменить на реальное имя) |
| `file` | Сам файл — **обязательно последнее поле** |

> **Внимание:** `direct_url` — это внешний presigned URL от S3. Он **не** является эндпоинтом Пачки, не требует заголовка `Authorization` и имеет ограниченное время действия.


## Частые ошибки

| Ошибка | Причина | Решение |
|--------|---------|---------|
| `403 Forbidden` при загрузке | Истекла подпись | Параметры загрузки действительны ограниченное время. Запросите новые через [Получение подписи](POST /uploads) |
| `400 Bad Request` | Неправильный Content-Type | Убедитесь, что запрос отправляется как `multipart/form-data`, а не `application/json` |
| Файл не отображается | Неверный `key` | Проверьте, что `${filename}` в ключе заменён на реальное имя файла |
