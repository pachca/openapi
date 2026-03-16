# Загрузка файла

**Метод**: `POST`

**Путь**: `/direct_url`

> Авторизация не требуется

Загрузка файла на сервер с форматом `multipart/form-data`. Параметры для загрузки получаются через метод [Получение подписи, ключа и других параметров](POST /uploads).

## Тело запроса


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

