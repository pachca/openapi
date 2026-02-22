
# Запросы и ответы

## Доступ

Для работы с методами API вам необходимо иметь действующий `access_token`.

`access_token` не имеет времени жизни. Если вы используете `access_token` «Администратора» или «Владельца» пространства, то в разделе «Автоматизации» → «API» вы можете воспользоваться функцией сброса токена. В таком случае вы увидите новый `Access token`, а предыдущий станет недействительным.

## Тестирование API

### Scalar

Онлайн-клиент с интерфейсом для тестирования всех методов API прямо в браузере — без установки. Достаточно вставить токен и отправить запрос.

- [Открыть Scalar API Client](https://client.scalar.com/?url=https://dev.pachca.com/openapi.yaml) — Браузерный клиент на основе OpenAPI-спецификации. Бесплатно, без регистрации.


> **Внимание:** Браузерный клиент Scalar отправляет запросы через прокси-сервер `proxy.scalar.com` — это необходимо из-за ограничений браузера (CORS). Токен проходит через сервер Scalar, но [по их заявлению](https://github.com/scalar/scalar) данные не логируются. Scalar — проект с открытым исходным кодом (MIT), включая код прокси. Если вы хотите избежать передачи токена через сторонний сервер, используйте Postman или Bruno — они работают локально и отправляют запросы напрямую.


### Postman / Bruno

Коллекция содержит все методы API с примерами запросов и настроенной авторизацией. Совместима с:

- **Postman** *File → Import*
- **Bruno** (open-source альтернатива) *File → Import → Postman Collection*

**Коллекция Postman/Bruno**

```text
https://dev.pachca.com/pachca.postman_collection.json
```


- [Скачать коллекцию](/pachca.postman_collection.json) — Файл в формате Postman Collection v2.1, совместим с Postman и Bruno.


## Структура запроса метода API

При выполнении запроса, `access_token` необходимо поместить в заголовки (ключ `Authorization` с указанием типа `Bearer`), а в теле запроса указать все необходимые параметры метода. При этом не забудьте, что сервер ожидает перечисление параметров в формате `JSON`, кодировке `UTF-8` и по протоколу `HTTPS`.

**Базовый URL**

```http
https://api.pachca.com/api/shared/v1
```


**Пример запроса**

```http
POST /users HTTP/1.1
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json; charset=utf-8
Host: api.pachca.com
Connection: close
User-Agent: Paw/3.1.10 (Macintosh; OS X/10.15.3) GCDHTTPRequest
Content-Length: 219

{
    "user": {
        "first_name": "Олег",
        "last_name": "Петров",
        "email": "olegp@example.com",
        "department": "Продукт",
        "list_tags": ["Product", "Design"],
        "custom_properties": [
            {
                "id": 1678,
                "value": "Санкт-Петербург"
            }
        ]
    },
    "skip_email_notify": true
}
```


## Обработка ответа метода API

Мы используем обычные коды ответов HTTP для обозначения результата выполнения запроса.

Ответ от сервера приходит в формате `JSON` и кодировке `UTF-8`.

При успешном ответе возвращаемый сервером результат будет представлен в теле ответа массивом `data`.

При ошибке выполнения запроса вы можете получить в теле ответа массив `errors` (подробнее об ошибках выполнения запросов вы можете прочитать в [следующем разделе](/guides/errors) документации).

**Пример ответа**

```http
HTTP/1.1 201 Created
Server: nginx/1.14.2
Date: Wed, 22 Apr 2020 12:32:29 GMT
Content-Type: application/json; charset=utf-8
Transfer-Encoding: chunked
Connection: close
ETag: W/"4d63aae1430a3bbd35e95e3db6b364df"
Cache-Control: max-age=0, private, must-revalidate
X-Request-Id: 12f8a05c-c5cf-4a79-8d2f-f82cc477c410
X-Runtime: 0.117503
Vary: Origin
X-Rack-CORS: miss; no-origin

{
    "data": {
        "id": 12,
        "first_name": "Олег",
        "last_name": "Петров",
        "nickname": "",
        "email": "olegp@example.com",
        "phone_number": "",
        "department": "Продукт",
        "role": "admin",
        "suspended": false,
        "invite_status": "confirmed",
        "list_tags": ["Product", "Design"],
        "custom_properties": [
            {
                "id": 1678,
                "name": "Город",
                "data_type": "string",
                "value": "Санкт-Петербург"
            }
        ]
    }
}
```

