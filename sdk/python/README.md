# Pachca Python SDK

Python клиент для [Pachca API](https://dev.pachca.com).

## Установка

```bash
pip install pachca
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

## Ресурсы

| Свойство | Методы |
|----------|--------|
| `client.messages` | `create_message`, `get_message`, `update_message`, `delete_message`, `pin_message`, `unpin_message`, `list_chat_messages` |
| `client.users` | `list_users`, `create_user`, `get_user`, `update_user`, `delete_user`, `get_user_status`, `update_user_status`, `delete_user_status` |
| `client.chats` | `list_chats`, `create_chat`, `get_chat`, `update_chat`, `archive_chat`, `unarchive_chat` |
| `client.tasks` | `list_tasks`, `create_task`, `get_task`, `update_task`, `delete_task` |
| `client.group_tags` | `list_tags`, `create_tag`, `get_tag`, `update_tag`, `delete_tag`, `get_tag_users` |
| `client.members` | `list_members`, `add_members`, `remove_member`, `update_member_role`, `add_tags`, `remove_tag`, `leave_chat` |
| `client.reactions` | `list_reactions`, `add_reaction`, `remove_reaction` |
| `client.thread` | `create_thread`, `get_thread` |
| `client.search` | `search_users`, `search_chats`, `search_messages` |
| `client.security` | `get_audit_events` |
| `client.profile` | `get_profile`, `get_status`, `update_status`, `delete_status`, `get_token_info` |
| `client.bots` | `update_bot`, `get_webhook_events`, `delete_webhook_event` |
| `client.views` | `open_view` |
| `client.common` | `list_properties`, `get_upload_params`, `upload_file`, `request_export`, `download_export` |

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
