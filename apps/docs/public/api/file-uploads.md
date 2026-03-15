
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

## Полный пример

```javascript title="Node.js: загрузка и отправка файла"
const fs = require('node:fs');
const path = require('node:path');

const TOKEN = 'ваш_токен';
const BASE = 'https://api.pachca.com/api/shared/v1';
const headers = { Authorization: `Bearer ${TOKEN}` };

// Шаг 1: Получить параметры загрузки
const { data: params } = await fetch(`${BASE}/uploads`, {
  method: 'POST', headers
}).then(r => r.json());

// Шаг 2: Загрузить файл
const filePath = './report.pdf';
const fileName = path.basename(filePath);
const fileBuffer = fs.readFileSync(filePath);

const form = new FormData();
form.append('Content-Disposition', params['Content-Disposition']);
form.append('acl', params.acl);
form.append('policy', params.policy);
form.append('x-amz-credential', params['x-amz-credential']);
form.append('x-amz-algorithm', params['x-amz-algorithm']);
form.append('x-amz-date', params['x-amz-date']);
form.append('x-amz-signature', params['x-amz-signature']);
form.append('key', params.key);
form.append('file', new File([fileBuffer], fileName));

await fetch(params.direct_url, { method: 'POST', body: form });

// Шаг 3: Отправить сообщение с файлом
const fileKey = params.key.replace('${filename}', fileName);
await fetch(`${BASE}/messages`, {
  method: 'POST',
  headers: { ...headers, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: {
      entity_type: 'discussion',
      entity_id: 12345,
      content: 'Отчёт прикреплён',
      files: [{ key: fileKey, name: fileName, file_type: 'file', size: fileBuffer.length }]
    }
  })
});
```

## Частые ошибки

| Ошибка | Причина | Решение |
|--------|---------|---------|
| `403 Forbidden` при загрузке | Истекла подпись | Параметры загрузки действительны ограниченное время. Запросите новые через `POST /uploads` |
| `400 Bad Request` | Неправильный Content-Type | Убедитесь, что запрос отправляется как `multipart/form-data`, а не `application/json` |
| Файл не отображается | Неверный `key` | Проверьте, что `${filename}` в ключе заменён на реальное имя файла |
