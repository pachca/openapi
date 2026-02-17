# Загрузка файла

**Метод**: `POST`

**Путь**: `/direct_url`

#access_token_not_required

Для того чтобы прикрепить файл к сообщению или к другой сущности через API, требуется сначала загрузить файл на сервер (через метод получения подписи и ключа), а затем сформировать ссылку на него.

**Процесс загрузки состоит из трёх шагов:**

1. [Получение подписи, ключа и других параметров](POST /uploads) — сделать `POST`-запрос без тела запроса для получения параметров загрузки.
2. **Загрузка файла** — после получения всех параметров, нужно сделать `POST` запрос c форматом `multipart/form-data` на адрес `direct_url`, включая те же поля, что пришли (content-disposition, acl, policy, x-amz-credential, x-amz-algorithm, x-amz-date, x-amz-signature, key) и сам файл. При успешной загрузке — `HTTP` статус `204`, тело ответа отсутствует.
3. **Прикрепление файла к сообщению или другой сущности** — после загрузки файла, чтобы прикрепить его к сообщению или другой сущности API, необходимо сформировать путь файла. Для этого в поле `key`, полученном на этапе подписи, заменить шаблон `$filename` на фактическое имя файла. Пример: Если ваш файл называется `Логотип для сайта.png`, а в ответе на метод `/uploads` ключ был `attaches/files/93746/e354-...-5e6f/$filename`, итоговый ключ будет `attaches/files/93746/e354-...-5e6f/Логотип для сайта.png`.

## Тело запроса


## Примеры запроса

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

## Ответы

### 204: There is no content to send for this request, but the headers may be useful. 

