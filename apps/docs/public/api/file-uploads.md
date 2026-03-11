
# Загрузка файлов

Загрузка файлов через API Пачки — трёхшаговый процесс с presigned URL (S3-совместимое хранилище).

## Процесс загрузки


  ### Шаг 1. Получение параметров загрузки

Сделайте запрос к методу [Получение подписи, ключа и других параметров](POST /uploads) без тела для получения подписи и параметров. Данный метод необходимо использовать для загрузки каждого файла.

    **Получение параметров загрузки**

### cURL

```bash
curl -X POST "https://api.pachca.com/api/shared/v1/uploads" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### JavaScript

```javascript
const response = await fetch('https://api.pachca.com/api/shared/v1/uploads', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_ACCESS_TOKEN',
  }
});

const data = await response.json();
console.log(data);
```

### Python

```python
import requests

headers = {
    'Authorization': 'Bearer YOUR_ACCESS_TOKEN',
}

response = requests.post(
    'https://api.pachca.com/api/shared/v1/uploads',
    headers=headers
)

print(response.json())
```

### Node.js

```javascript
const https = require('https');

const options = {
    hostname: 'api.pachca.com',
    port: 443,
    path: '/api/shared/v1/uploads',
    method: 'POST',
    headers: {
        'Authorization': 'Bearer YOUR_ACCESS_TOKEN'
    }
};

const req = https.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        console.log(JSON.parse(data));
    });
});

req.on('error', (error) => {
    console.error(error);
});

req.end();
```

### Ruby

```ruby
require 'net/http'
require 'json'

uri = URI('https://api.pachca.com/api/shared/v1/uploads')
request = Net::HTTP::Post.new(uri)
request['Authorization'] = 'Bearer YOUR_ACCESS_TOKEN'

response = Net::HTTP.start(uri.hostname, uri.port, use_ssl: true) do |http|
  http.request(request)
end

puts JSON.parse(response.body)
```

### PHP

```php
<?php

$curl = curl_init();

curl_setopt_array($curl, [
    CURLOPT_URL => 'https://api.pachca.com/api/shared/v1/uploads',
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_CUSTOMREQUEST => 'POST',
    CURLOPT_HTTPHEADER => [
        'Authorization: Bearer YOUR_ACCESS_TOKEN',
    ],
]);

$response = curl_exec($curl);
curl_close($curl);

echo $response;
?>
```


    В ответе вы получите параметры для следующего шага: `Content-Disposition`, `acl`, `policy`, `x-amz-credential`, `x-amz-algorithm`, `x-amz-date`, `x-amz-signature`, `key` и `direct_url`.


  ### Шаг 2. Загрузка файла

Отправьте запрос к методу [Загрузка файла](POST /direct_url) с форматом `multipart/form-data` на адрес `direct_url`. Включите все полученные параметры и сам файл. При успешной загрузке сервер вернёт `HTTP 201 Created`.

    **Загрузка файла**

### cURL

```bash
curl "https://api.pachca.com/api/shared/v1/direct_url" \
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

### JavaScript

```javascript
const formData = new FormData();
formData.append('Content-Disposition', 'attachment');
formData.append('acl', 'private');
formData.append('policy', 'eyJloNBpcmF0aW9u...');
formData.append('x-amz-credential', '286471_server/20211122/kz-6x/s3/aws4_request');
formData.append('x-amz-algorithm', 'AWS4-HMAC-SHA256');
formData.append('x-amz-date', '20211122T065734Z');
formData.append('x-amz-signature', '87e8f3ba4083c937c0e891d7a11tre932d8c33cg4bacf5380bf27624c1ok1475');
formData.append('key', 'attaches/files/93746/e354fd79-4f3e-4b5a-9c8d-1a2b3c4d5e6f/$filename');
formData.append('file', fileInput.files[0]);

const response = await fetch('https://api.pachca.com/api/shared/v1/direct_url', {
  method: 'POST',
  headers: {
  },
  body: formData
});

console.log(response.status);
```

### Python

```python
import requests

data = {
    'Content-Disposition': 'attachment',
    'acl': 'private',
    'policy': 'eyJloNBpcmF0aW9u...',
    'x-amz-credential': '286471_server/20211122/kz-6x/s3/aws4_request',
    'x-amz-algorithm': 'AWS4-HMAC-SHA256',
    'x-amz-date': '20211122T065734Z',
    'x-amz-signature': '87e8f3ba4083c937c0e891d7a11tre932d8c33cg4bacf5380bf27624c1ok1475',
    'key': 'attaches/files/93746/e354fd79-4f3e-4b5a-9c8d-1a2b3c4d5e6f/$filename',
}

files = {
    'file': open('filename.png', 'rb'),
}

headers = {
}

response = requests.post(
    'https://api.pachca.com/api/shared/v1/direct_url',
    headers=headers,
    data=data,
    files=files
)

print(response.status_code)
```

### Node.js

```javascript
const FormData = require('form-data');
const fs = require('fs');
const https = require('https');

const form = new FormData();
form.append('Content-Disposition', 'attachment');
form.append('acl', 'private');
form.append('policy', 'eyJloNBpcmF0aW9u...');
form.append('x-amz-credential', '286471_server/20211122/kz-6x/s3/aws4_request');
form.append('x-amz-algorithm', 'AWS4-HMAC-SHA256');
form.append('x-amz-date', '20211122T065734Z');
form.append('x-amz-signature', '87e8f3ba4083c937c0e891d7a11tre932d8c33cg4bacf5380bf27624c1ok1475');
form.append('key', 'attaches/files/93746/e354fd79-4f3e-4b5a-9c8d-1a2b3c4d5e6f/$filename');
form.append('file', fs.createReadStream('filename.png'));

const options = {
    hostname: 'api.pachca.com',
    port: 443,
    path: '/api/shared/v1/direct_url',
    method: 'POST',
    headers: {
        ...form.getHeaders()
    }
};

const req = https.request(options, (res) => {
    console.log('Status:', res.statusCode);
});

form.pipe(req);
```

### Ruby

```ruby
require 'net/http'
require 'uri'

uri = URI('https://api.pachca.com/api/shared/v1/direct_url')

boundary = "----FormBoundary#{rand(1_000_000)}"

body = []
body << "--#{boundary}\r\n"
body << "Content-Disposition: form-data; name=\"Content-Disposition\"\r\n\r\n"
body << "attachment\r\n"
body << "--#{boundary}\r\n"
body << "Content-Disposition: form-data; name=\"acl\"\r\n\r\n"
body << "private\r\n"
body << "--#{boundary}\r\n"
body << "Content-Disposition: form-data; name=\"policy\"\r\n\r\n"
body << "eyJloNBpcmF0aW9u...\r\n"
body << "--#{boundary}\r\n"
body << "Content-Disposition: form-data; name=\"x-amz-credential\"\r\n\r\n"
body << "286471_server/20211122/kz-6x/s3/aws4_request\r\n"
body << "--#{boundary}\r\n"
body << "Content-Disposition: form-data; name=\"x-amz-algorithm\"\r\n\r\n"
body << "AWS4-HMAC-SHA256\r\n"
body << "--#{boundary}\r\n"
body << "Content-Disposition: form-data; name=\"x-amz-date\"\r\n\r\n"
body << "20211122T065734Z\r\n"
body << "--#{boundary}\r\n"
body << "Content-Disposition: form-data; name=\"x-amz-signature\"\r\n\r\n"
body << "87e8f3ba4083c937c0e891d7a11tre932d8c33cg4bacf5380bf27624c1ok1475\r\n"
body << "--#{boundary}\r\n"
body << "Content-Disposition: form-data; name=\"key\"\r\n\r\n"
body << "attaches/files/93746/e354fd79-4f3e-4b5a-9c8d-1a2b3c4d5e6f/$filename\r\n"
body << "--#{boundary}\r\n"
body << "Content-Disposition: form-data; name=\"file\"; filename=\"filename.png\"\r\n"
body << "Content-Type: application/octet-stream\r\n\r\n"
body << File.read('filename.png')
body << "\r\n"
body << "--#{boundary}--\r\n"

request = Net::HTTP::Post.new(uri)
request['Content-Type'] = "multipart/form-data; boundary=#{boundary}"
request.body = body.join

response = Net::HTTP.start(uri.hostname, uri.port, use_ssl: true) do |http|
  http.request(request)
end

puts response.code
```

### PHP

```php
<?php

$curl = curl_init();

curl_setopt_array($curl, [
    CURLOPT_URL => 'https://api.pachca.com/api/shared/v1/direct_url',
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_CUSTOMREQUEST => 'POST',
    CURLOPT_HTTPHEADER => [
    ],
    CURLOPT_POSTFIELDS => [
        'Content-Disposition' => 'attachment',
        'acl' => 'private',
        'policy' => 'eyJloNBpcmF0aW9u...',
        'x-amz-credential' => '286471_server/20211122/kz-6x/s3/aws4_request',
        'x-amz-algorithm' => 'AWS4-HMAC-SHA256',
        'x-amz-date' => '20211122T065734Z',
        'x-amz-signature' => '87e8f3ba4083c937c0e891d7a11tre932d8c33cg4bacf5380bf27624c1ok1475',
        'key' => 'attaches/files/93746/e354fd79-4f3e-4b5a-9c8d-1a2b3c4d5e6f/$filename',
        'file' => new CURLFile('filename.png'),
    ],
]);

$response = curl_exec($curl);
curl_close($curl);

echo $response;
?>
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
