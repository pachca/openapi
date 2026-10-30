# Pachca Python SDK

Python клиент для [Pachca API](https://dev.pachca.com).

## Установка

```bash
pip install pachca-sdk
```

## Использование

```python
from pachca.client import PachcaClient
from pachca.models import (
    ListChatMessagesParams,
    MessageCreateRequest,
    MessageCreateRequestMessage,
    ReactionRequest,
)

client = PachcaClient("YOUR_TOKEN")

# Отправка сообщения
message = await client.messages.create_message(
    MessageCreateRequest(message=MessageCreateRequestMessage(entity_id=chat_id, content="Привет из Python SDK!"))
)

# Получение сообщения
fetched = await client.messages.get_message(message.id)

# Реакция
await client.reactions.add_reaction(message.id, ReactionRequest(code="👀"))

# Закрепление
await client.messages.pin_message(message.id)

# Страница сообщений чата и курсор следующей страницы
page = await client.messages.list_chat_messages(ListChatMessagesParams(chat_id=chat_id))
print(page.meta.paginate.next_page)

await client.close()
```

Все методы асинхронные: вызывайте их через `await` внутри `async def`.

## Конвенции

- **Вход**: path-параметры передаются аргументами метода. Тело из одного обязательного поля, например роль участника чата, тоже разворачивается в аргумент. Остальные тела передаются одним объектом-запросом, query-параметры — объектом `*Params`.
- **Выход**: если ответ API содержит единственное поле `data`, SDK возвращает его содержимое напрямую. Если рядом с `data` есть `meta` (списки и метод `Новый чат`), SDK возвращает ответ целиком: `data` и `meta`.

```python
from pachca.models import ChatMemberRole, ReactionRequest

# Тело из одного поля → аргумент
await client.members.update_member_role(chat_id, user_id, ChatMemberRole.ADMIN)
await client.messages.pin_message(message_id)

# Тело из нескольких полей → объект-запрос
await client.reactions.add_reaction(message_id, ReactionRequest(code="👍"))

# Ответ: API возвращает {"data": Message}, SDK возвращает Message
message = await client.messages.get_message(message_id)  # Message, не {"data": Message}
```

## Пагинация

Для методов с курсорной пагинацией SDK генерирует `*_all`-методы, которые автоматически обходят все страницы:

```python
from pachca.models import Chat, ListChatsParams

# Вручную
chats: list[Chat] = []
cursor = None
while True:
    response = await client.chats.list_chats(ListChatsParams(cursor=cursor))
    if not response.data:
        break
    chats.extend(response.data)
    cursor = response.meta.paginate.next_page

# Автоматически
all_chats = await client.chats.list_chats_all()
```

Метод `*_all` есть у каждого метода с пагинацией, полный список — на странице [Python SDK](https://dev.pachca.com/guides/sdk/python#avtopaginatsiya).

## Повторные запросы

SDK повторяет запросы сам. Паузы между попытками описаны на странице [Python SDK](https://dev.pachca.com/guides/sdk/python#povtornye-zaprosy), общие правила повторов — в разделе [Повторные запросы](https://dev.pachca.com/api/limits#povtornye-zaprosy-retry).

## Свой HTTP-клиент

Для настройки прокси, таймаутов и других параметров HTTP используйте `PachcaClient.from_client()` с готовым `httpx.AsyncClient`. Повторы такому клиенту даёт транспорт `RetryTransport` из `pachca.utils`, прокси задаётся во внутреннем транспорте:

```python
import httpx
from pachca.client import PACHCA_API_URL, PachcaClient
from pachca.utils import RetryTransport

http = httpx.AsyncClient(
    base_url=PACHCA_API_URL,
    headers={"Authorization": f"Bearer {token}"},
    transport=RetryTransport(httpx.AsyncHTTPTransport(proxy=httpx.Proxy("http://proxy:8080"))),
)
client = PachcaClient.from_client(http)
```

Полный пример: [`../examples/httpclient.py`](../examples/httpclient.py)

## Загрузка файлов

Загрузка файла идёт в три шага: параметры загрузки, отправка файла по адресу `direct_url` и сообщение с ключом файла. Подробнее — в разделе [Загрузка файлов](https://dev.pachca.com/api/file-uploads).

```python
from pachca.models import (
    FileType,
    FileUploadRequest,
    MessageCreateRequest,
    MessageCreateRequestFile,
    MessageCreateRequestMessage,
)

filename = "report.pdf"
with open(filename, "rb") as f:
    data = f.read()

# 1. Получить параметры загрузки и подставить имя файла в ключ
params = await client.files.get_upload_params()
key = params.key.replace("${filename}", filename)

# 2. Загрузить файл по адресу direct_url
await client.files.upload_file(
    params.direct_url,
    FileUploadRequest(
        content_disposition=params.content_disposition,
        acl=params.acl,
        policy=params.policy,
        x_amz_credential=params.x_amz_credential,
        x_amz_algorithm=params.x_amz_algorithm,
        x_amz_date=params.x_amz_date,
        x_amz_signature=params.x_amz_signature,
        key=key,
        bucket=params.bucket,
        file=data,
    ),
)

# 3. Отправить сообщение с файлом
await client.messages.create_message(
    MessageCreateRequest(
        message=MessageCreateRequestMessage(
            entity_id=chat_id,
            content="Отчёт за неделю",
            files=[MessageCreateRequestFile(key=key, name=filename, file_type=FileType.FILE, size=len(data))],
        )
    )
)
```

Полный пример: [`../examples/upload.py`](../examples/upload.py)

## Обработка ошибок

```python
from pachca.models import ApiError, OAuthError

try:
    await client.messages.get_message(999999)
except OAuthError as e:
    print(f"Ошибка авторизации: {e.error}")
except ApiError as e:
    for item in e.errors:
        print(f"Ошибка API: {item.key}: {item.message}")
```

## Тестирование

Для unit-тестов используйте `PachcaClient.stub()` — создаёт клиент без HTTP-подключения.

Методы без переопределения выбрасывают `NotImplementedError("Service.method is not implemented")`:

```python
from datetime import datetime, timezone
from unittest.mock import AsyncMock
from pachca.client import MessagesService, PachcaClient
from pachca.models import Message, MessageEntityType

# Мок-сервис
mock_messages = MessagesService()
mock_messages.get_message = AsyncMock(return_value=Message(
    id=1,
    entity_type=MessageEntityType.DISCUSSION,
    entity_id=123,
    chat_id=123,
    root_chat_id=123,
    content="Test message",
    user_id=1,
    created_at=datetime.now(timezone.utc),
    url="https://app.pachca.com/chats/123?message=1",
    files=[],
    important=False,
))

# Тест
client = PachcaClient.stub(messages=mock_messages)

message = await client.messages.get_message(1)
assert message.content == "Test message"
```

Полный пример: [`../examples/stub.py`](../examples/stub.py)
