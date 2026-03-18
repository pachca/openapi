
# Python SDK

[pachca-sdk](https://pypi.org/project/pachca-sdk/) PyPI


Асинхронный типизированный клиент для Pachca API. Построен на httpx с поддержкой type hints и dataclass-моделей. Требуется Python 3.10+.

## Быстрый старт


  ### Шаг 1. Установка

```bash
pip install pachca-sdk
```


  ### Шаг 2. Создание клиента

Получите API-токен в интерфейсе Пачки: **Настройки → Автоматизации → API** (подробнее — [Авторизация](/api/authorization)).

```python
from pachca import PachcaClient

client = PachcaClient("YOUR_TOKEN")
```


  ### Шаг 3. Первый запрос

*Endpoint not found*


> Все методы SDK асинхронные — вызывайте их через `await` внутри `async def`.


## Инициализация

```python
from pachca import PachcaClient

# Стандартное подключение
client = PachcaClient("YOUR_TOKEN")

# С кастомным базовым URL
client = PachcaClient("YOUR_TOKEN", base_url="https://custom-api.example.com/api/shared/v1")
```

| Параметр | Тип | По умолчанию | Описание |
|----------|-----|-------------|----------|
| `token` | `str` | — | Bearer-токен для авторизации |
| `base_url` | `str` | `https://api.pachca.com/api/shared/v1` | Базовый URL API |

Клиент использует `httpx.AsyncClient` — после завершения работы закройте его:

```python
await client.close()
```

## Сервисы

Клиент предоставляет 16 сервисов — по одному на каждую группу API-методов:

| Сервис | Описание | Документация |
|--------|----------|-------------|
| `client.security` | Журнал аудита | [/api/security/list](/api/security/list) |
| `client.bots` | Вебхуки и настройки бота | [/api/bots/list-events](/api/bots/list-events) |
| `client.chats` | Чаты, каналы, беседы | [/api/chats/list](/api/chats/list) |
| `client.common` | Кастомные поля, загрузки, экспорт | [/api/common/custom-properties](/api/common/custom-properties) |
| `client.group_tags` | Теги (группы сотрудников) | [/api/group-tags/list](/api/group-tags/list) |
| `client.link_previews` | Разворачивание ссылок | [/api/link-previews/add](/api/link-previews/add) |
| `client.members` | Участники чатов | [/api/members/list](/api/members/list) |
| `client.messages` | Сообщения | [/api/messages/list](/api/messages/list) |
| `client.profile` | Профиль и статус текущего пользователя | [/api/profile/get](/api/profile/get) |
| `client.reactions` | Реакции на сообщения | [/api/reactions/list](/api/reactions/list) |
| `client.read_members` | Прочитавшие сообщение | [/api/read-member/list-readers](/api/read-member/list-readers) |
| `client.search` | Поиск по чатам, сообщениям, пользователям | [/api/search/chats](/api/search/chats) |
| `client.tasks` | Задачи и напоминания | [/api/tasks/list](/api/tasks/list) |
| `client.threads` | Треды | [/api/threads/get](/api/threads/get) |
| `client.users` | Сотрудники | [/api/users/list](/api/users/list) |
| `client.views` | Формы и представления | [/api/views/open](/api/views/open) |

## Запросы

Все методы — асинхронные (`async def`) и возвращают корутины.

**GET с параметрами:**

*Endpoint not found*


**POST с телом запроса:**

*Endpoint not found*


**Простой вызов по ID:**

*Endpoint not found*


## Пагинация

Методы, возвращающие списки, используют cursor-based пагинацию. Ответ содержит `meta.paginate.next_page` — курсор для следующей страницы.

### Ручная пагинация

```python
from pachca.models import ListUsersParams

cursor = None
while True:
    response = await client.users.list_users(ListUsersParams(limit=50, cursor=cursor))
    for user in response.data:
        print(user.first_name, user.last_name)
    if not response.meta or not response.meta.paginate or not response.meta.paginate.next_page:
        break
    cursor = response.meta.paginate.next_page
```

### Автопагинация

Для каждого метода с пагинацией есть `*_all()` вариант:

```python
# Все пользователи одним списком
users = await client.users.list_users_all()
print(f"Всего: {len(users)}")
```

Доступные методы автопагинации:

| Метод | Возвращает |
|-------|-----------|
| `security.get_audit_events_all()` | `list[AuditEvent]` |
| `bots.get_webhook_events_all()` | `list[WebhookEvent]` |
| `chats.list_chats_all()` | `list[Chat]` |
| `group_tags.list_tags_all()` | `list[GroupTag]` |
| `members.list_members_all()` | `list[User]` |
| `messages.list_chat_messages_all()` | `list[Message]` |
| `reactions.list_reactions_all()` | `list[Reaction]` |
| `search.search_chats_all()` | `list[Chat]` |
| `search.search_messages_all()` | `list[Message]` |
| `search.search_users_all()` | `list[User]` |
| `tasks.list_tasks_all()` | `list[Task]` |
| `users.list_users_all()` | `list[User]` |

## Обработка ошибок

SDK выбрасывает два типа исключений:

### ApiError

Возникает при ошибках `400`, `403`, `404`, `409`, `410`, `422`:

```python
from pachca.models import ApiError

try:
    await client.chats.create_chat(request)
except ApiError as error:
    for e in error.errors:
        print(e.key, e.message)   # "name", "не может быть пустым"
        print(e.code)             # ValidationErrorCode.BLANK
```

Поля `ApiErrorItem`:

| Поле | Тип | Описание |
|------|-----|----------|
| `key` | `str` | Поле, вызвавшее ошибку |
| `value` | `str \| None` | Переданное значение |
| `message` | `str` | Текст ошибки |
| `code` | `ValidationErrorCode` | Код валидации |
| `payload` | `str \| None` | Дополнительные данные |

### OAuthError

Возникает при ошибках авторизации (`401`, `403`):

```python
from pachca.models import OAuthError

try:
    await client.profile.get_profile()
except OAuthError as error:
    print(error.error)              # "Token not found"
    print(error.error_description)  # описание ошибки
```

## Повторные запросы

SDK автоматически повторяет запрос при получении `429 Too Many Requests`:

- До **3 попыток** на каждый запрос
- Если сервер вернул заголовок `Retry-After` — ждёт указанное время
- Иначе — экспоненциальный backoff: 1 сек, 2 сек, 4 сек
- Реализовано через `RetryTransport` — обёртку над httpx-транспортом

## Типы

Все модели — Python dataclass'ы с type hints:

```python
from pachca.models import (
    # Модели
    Chat, Message, User, Task, GroupTag, Thread, Reaction,
    # Запросы
    ChatCreateRequest, MessageCreateRequest, TaskCreateRequest,
    # Параметры
    ListChatsParams, ListUsersParams, SearchMessagesParams,
    # Ответы
    ListChatsResponse, ListMembersResponse,
    # Перечисления
    AuditEventKey, ChatAvailability, SortOrder,
    # Ошибки
    ApiError, OAuthError,
)
```

## Зависимости

| Пакет | Версия | Назначение |
|-------|--------|-----------|
| `httpx` | >=0.23.0 | Асинхронный HTTP-клиент |
| `attrs` | >=22.2.0 | Dataclass'ы |
| `python-dateutil` | ^2.8.0 | Парсинг дат |

## Примеры

*Endpoint not found*


## Исходный код

- [SDK на GitHub](https://github.com/pachca/openapi/tree/main/sdk/python)
- [PyPI](https://pypi.org/project/pachca-sdk/)
