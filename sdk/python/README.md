# Pachca Python SDK

Python клиент для [Pachca API](https://dev.pachca.com).

## Установка

```bash
pip install pachca-sdk
```

## Использование

```python
from pachca import PachcaClient, MessageCreateRequestMessage

client = PachcaClient("YOUR_TOKEN")

# Создание сообщения
msg = await client.messages.create_message(
    MessageCreateRequestMessage(entity_id=334, content="Hello!")
)

# Получение сообщения
fetched = await client.messages.get_message(msg.id)

# Реакция (≤2 полей — передаются как kwargs)
await client.reactions.add_reaction(msg.id, code="👀")

# Закрепление
await client.messages.pin_message(msg.id)

# Список сообщений чата (с пагинацией)
messages = await client.messages.list_chat_messages(chat_id=198)
print(messages.next_cursor)  # курсор следующей страницы
```

## Конвенции

- **Вход**: path-параметры и body-поля (если ≤2) разворачиваются в аргументы метода. Иначе — один объект-запрос.
- **Выход**: если ответ API содержит единственное поле `data`, SDK возвращает его содержимое напрямую.

```python
# ≤2 поля → развёрнуто в аргументы
await client.reactions.add_reaction(message_id, ReactionRequest(code="👍"))
await client.messages.pin_message(message_id)

# >2 полей → объект-запрос
await client.messages.create_message(MessageCreateRequest(...))

# Ответ: API возвращает {"data": ...}, SDK возвращает объект напрямую
message = await client.messages.create_message(...)  # Message, не {"data": Message}
```

## Пагинация

Для эндпоинтов с курсорной пагинацией SDK генерирует `*_all`-методы, которые автоматически обходят все страницы:

```python
# Вручную
chats = []
cursor = None
while True:
    response = await client.chats.list_chats(cursor=cursor)
    chats.extend(response.data)
    cursor = response.meta.paginate.next_page if response.meta and response.meta.paginate else None
    if not cursor:
        break

# Автоматически
all_chats = await client.chats.list_chats_all()
```

Доступные методы: `list_chats_all`, `list_users_all`, `list_tasks_all`, `list_tags_all`, `list_members_all`, `list_chat_messages_all`, `list_reactions_all`, `search_chats_all`, `search_messages_all`, `search_users_all` и др.

## Повторные запросы

SDK автоматически повторяет запросы при получении ответа `429 Too Many Requests`. Используется заголовок `Retry-After` для определения задержки, с экспоненциальным backoff (до 3 попыток).

## Обработка ошибок

```python
from pachca import PachcaClient, ApiError, OAuthError

try:
    await client.messages.get_message(999999)
except OAuthError as e:
    print(f"Ошибка авторизации: {e.message}")
except ApiError as e:
    print(f"Ошибка API: {e.errors}")
```

## Пример

См. [examples/main.py](examples/main.py) — 8-шаговый echo bot.

Названия методов и параметров соответствуют [документации API](https://dev.pachca.com).
