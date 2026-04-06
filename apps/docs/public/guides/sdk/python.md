
# Python

[pachca-sdk](https://pypi.org/project/pachca-sdk/) PyPI


Асинхронный типизированный клиент для Pachca API. Построен на httpx с поддержкой type hints и dataclass-моделей. Требуется Python 3.10+.

## Быстрый старт


  ### Шаг 1. Установка

```bash
pip install pachca-sdk
```


  ### Шаг 2. Создание клиента

Получите API-токен в интерфейсе Пачки: **Настройки** > **Автоматизации** > **API** (подробнее — [Авторизация](/api/authorization)).

```python
from pachca.client import PachcaClient

client = PachcaClient("YOUR_TOKEN")
```


  ### Шаг 3. Первый запрос

```python
# Получение профиля
response = await client.profile.get_profile()
# → User(id: int, first_name: str, last_name: str, nickname: str, email: str, phone_number: str, department: str, title: str, role: UserRole, suspended: bool, invite_status: InviteStatus, list_tags: list[str], custom_properties: list[CustomProperty(id: int, name: str, data_type: CustomPropertyDataType, value: str)], user_status: UserStatus(emoji: str, title: str, expires_at: str | None, is_away: bool, away_message: UserStatusAwayMessage(text: str) | None) | None, bot: bool, sso: bool, created_at: str, last_activity_at: str, time_zone: str, image_url: str | None)
```


> Все методы SDK асинхронные — вызывайте их через `await` внутри `async def`.


## Инициализация

```python
from pachca.client import PachcaClient

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

## Все методы

| Метод | Метод API |
|-------|----------|
| `client.common.request_export()` | [Экспорт сообщений](/api/common/request-export) |
| `client.common.upload_file()` | [Загрузка файла](/api/common/direct-url) |
| `client.common.get_upload_params()` | [Получение подписи, ключа и других параметров](/api/common/uploads) |
| `client.common.download_export()` | [Скачать архив экспорта](/api/common/get-exports) |
| `client.common.list_properties()` | [Список дополнительных полей](/api/common/custom-properties) |
| `client.profile.get_token_info()` | [Информация о токене](/api/profile/get-info) |
| `client.profile.get_profile()` | [Информация о профиле](/api/profile/get) |
| `client.profile.get_status()` | [Текущий статус](/api/profile/get-status) |
| `client.profile.update_profile_avatar()` | [Загрузка аватара](/api/profile/update-avatar) |
| `client.profile.update_status()` | [Новый статус](/api/profile/update-status) |
| `client.profile.delete_profile_avatar()` | [Удаление аватара](/api/profile/delete-avatar) |
| `client.profile.delete_status()` | [Удаление статуса](/api/profile/delete-status) |
| `client.users.create_user()` | [Создать сотрудника](/api/users/create) |
| `client.users.list_users()` | [Список сотрудников](/api/users/list) |
| `client.users.get_user()` | [Информация о сотруднике](/api/users/get) |
| `client.users.get_user_status()` | [Статус сотрудника](/api/users/get-status) |
| `client.users.update_user()` | [Редактирование сотрудника](/api/users/update) |
| `client.users.update_user_avatar()` | [Загрузка аватара сотрудника](/api/users/update-avatar) |
| `client.users.update_user_status()` | [Новый статус сотрудника](/api/users/update-status) |
| `client.users.delete_user()` | [Удаление сотрудника](/api/users/delete) |
| `client.users.delete_user_avatar()` | [Удаление аватара сотрудника](/api/users/remove-avatar) |
| `client.users.delete_user_status()` | [Удаление статуса сотрудника](/api/users/remove-status) |
| `client.group_tags.create_tag()` | [Новый тег](/api/group-tags/create) |
| `client.group_tags.list_tags()` | [Список тегов сотрудников](/api/group-tags/list) |
| `client.group_tags.get_tag()` | [Информация о теге](/api/group-tags/get) |
| `client.group_tags.get_tag_users()` | [Список сотрудников тега](/api/group-tags/list-users) |
| `client.group_tags.update_tag()` | [Редактирование тега](/api/group-tags/update) |
| `client.group_tags.delete_tag()` | [Удаление тега](/api/group-tags/delete) |
| `client.chats.create_chat()` | [Новый чат](/api/chats/create) |
| `client.chats.list_chats()` | [Список чатов](/api/chats/list) |
| `client.chats.get_chat()` | [Информация о чате](/api/chats/get) |
| `client.chats.update_chat()` | [Обновление чата](/api/chats/update) |
| `client.chats.archive_chat()` | [Архивация чата](/api/chats/archive) |
| `client.chats.unarchive_chat()` | [Разархивация чата](/api/chats/unarchive) |
| `client.members.add_tags()` | [Добавление тегов](/api/members/add-group-tags) |
| `client.members.add_members()` | [Добавление пользователей](/api/members/add) |
| `client.members.list_members()` | [Список участников чата](/api/members/list) |
| `client.members.update_member_role()` | [Редактирование роли](/api/members/update) |
| `client.members.remove_tag()` | [Исключение тега](/api/members/remove-group-tag) |
| `client.members.leave_chat()` | [Выход из беседы или канала](/api/members/leave) |
| `client.members.remove_member()` | [Исключение пользователя](/api/members/remove) |
| `client.threads.create_thread()` | [Новый тред](/api/threads/add) |
| `client.threads.get_thread()` | [Информация о треде](/api/threads/get) |
| `client.messages.create_message()` | [Новое сообщение](/api/messages/create) |
| `client.messages.pin_message()` | [Закрепление сообщения](/api/messages/pin) |
| `client.messages.list_chat_messages()` | [Список сообщений чата](/api/messages/list) |
| `client.messages.get_message()` | [Информация о сообщении](/api/messages/get) |
| `client.messages.update_message()` | [Редактирование сообщения](/api/messages/update) |
| `client.messages.delete_message()` | [Удаление сообщения](/api/messages/delete) |
| `client.messages.unpin_message()` | [Открепление сообщения](/api/messages/unpin) |
| `client.read_members.list_read_members()` | [Список прочитавших сообщение](/api/read-member/list-readers) |
| `client.reactions.add_reaction()` | [Добавление реакции](/api/reactions/add) |
| `client.reactions.list_reactions()` | [Список реакций](/api/reactions/list) |
| `client.reactions.remove_reaction()` | [Удаление реакции](/api/reactions/remove) |
| `client.link_previews.create_link_previews()` | [Unfurl (разворачивание ссылок)](/api/link-previews/add) |
| `client.search.search_chats()` | [Поиск чатов](/api/search/list-chats) |
| `client.search.search_messages()` | [Поиск сообщений](/api/search/list-messages) |
| `client.search.search_users()` | [Поиск сотрудников](/api/search/list-users) |
| `client.tasks.create_task()` | [Новое напоминание](/api/tasks/create) |
| `client.tasks.list_tasks()` | [Список напоминаний](/api/tasks/list) |
| `client.tasks.get_task()` | [Информация о напоминании](/api/tasks/get) |
| `client.tasks.update_task()` | [Редактирование напоминания](/api/tasks/update) |
| `client.tasks.delete_task()` | [Удаление напоминания](/api/tasks/delete) |
| `client.views.open_view()` | [Открытие представления](/api/views/open) |
| `client.bots.get_webhook_events()` | [История событий](/api/bots/list-events) |
| `client.bots.update_bot()` | [Редактирование бота](/api/bots/update) |
| `client.bots.delete_webhook_event()` | [Удаление события](/api/bots/remove-event) |
| `client.security.get_audit_events()` | [Журнал аудита событий](/api/security/list) |


## Запросы

Все методы — асинхронные (`async def`) и возвращают корутины.

**GET с параметрами:**

```python
from pachca.models import ChatAvailability, ChatSortField, ListChatsParams, SortOrder

# Список чатов
params = ListChatsParams(
    sort=ChatSortField.ID,
    order=SortOrder.DESC,
    availability=ChatAvailability.IS_MEMBER,
    last_message_at_after="2025-01-01T00:00:00.000Z",
    last_message_at_before="2025-02-01T00:00:00.000Z",
    personal=False,
    limit=1,
    cursor="eyJpZCI6MTAsImRpciI6ImFzYyJ9"
)
response = await client.chats.list_chats(params=params)
# → ListChatsResponse(data: list[Chat], meta: PaginationMeta)
```


**POST с телом запроса:**

```python
from pachca.models import ChatCreateRequest, ChatCreateRequestChat

# Создание чата
request = ChatCreateRequest(
    chat=ChatCreateRequestChat(
        name="🤿 aqua",
        member_ids=[123],
        group_tag_ids=[123],
        channel=True,
        public=False
    )
)
response = await client.chats.create_chat(request=request)
# → Chat(id: int, name: str, created_at: str, owner_id: int, member_ids: list[int], group_tag_ids: list[int], channel: bool, personal: bool, public: bool, last_message_at: str, meet_room_url: str)
```


**Простой вызов по ID:**

```python
# Получение чата
response = await client.chats.get_chat(id=334)
# → Chat(id: int, name: str, created_at: str, owner_id: int, member_ids: list[int], group_tag_ids: list[int], channel: bool, personal: bool, public: bool, last_message_at: str, meet_room_url: str)
```


## Пагинация

Методы, возвращающие списки, используют cursor-based пагинацию. Ответ всегда содержит `meta.paginate.next_page` — курсор для следующей страницы. Курсор никогда не бывает `None` — конец данных определяется по пустому списку `data`.

### Ручная пагинация

```python
from pachca.models import ListUsersParams

cursor = None
while True:
    response = await client.users.list_users(ListUsersParams(limit=50, cursor=cursor))
    if not response.data:
        break
    for user in response.data:
        print(user.first_name, user.last_name)
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
| `group_tags.get_tag_users_all()` | `list[User]` |
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

Возникает при ошибке авторизации (`401`):

```python
from pachca.models import OAuthError

try:
    await client.profile.get_profile()
except OAuthError as error:
    print(error.error)              # "Token not found"
    print(error.error_description)  # описание ошибки
```

## Повторные запросы

SDK автоматически повторяет запрос при получении `429 Too Many Requests` и ошибок сервера `5xx` (`500`, `502`, `503`, `504`):

- До **3 повторов** на каждый запрос
- **429:** если сервер вернул заголовок `Retry-After` — ждёт указанное время, иначе — экспоненциальный backoff: 1 сек, 2 сек, 4 сек
- **5xx:** экспоненциальный backoff с jitter: ~10 сек, ~20 сек, ~40 сек
- Реализовано через `RetryTransport` — обёртку над httpx-транспортом
- Ошибки клиента (4xx, кроме 429) возвращаются сразу без повторов

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
    AuditEventKey, ChatAvailability, ChatMemberRole, ChatMemberRoleFilter,
    ChatSubtype, CustomPropertyDataType, FileType, InviteStatus,
    MemberEventType, MessageEntityType, OAuthScope, ReactionEventType,
    SearchEntityType, SearchSortOrder, SortOrder, TaskKind, TaskStatus,
    UserEventType, UserRole, ValidationErrorCode, WebhookEventType,
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

```python
from pachca.client import PachcaClient
from pachca.models import Button, FileType, ListUsersParams, MessageCreateRequest, MessageCreateRequestFile, MessageCreateRequestMessage, MessageEntityType, TaskCreateRequest, TaskCreateRequestCustomProperty, TaskCreateRequestTask, TaskKind

client = PachcaClient("YOUR_TOKEN")

# Отправка сообщения
request = MessageCreateRequest(
    message=MessageCreateRequestMessage(
        entity_type=MessageEntityType.DISCUSSION,
        entity_id=334,
        content="Вчера мы продали 756 футболок (что на 10% больше, чем в прошлое воскресенье)",
        files=[MessageCreateRequestFile(
            key="attaches/files/93746/e354fd79-4f3e-4b5a-9c8d-1a2b3c4d5e6f/logo.png",
            name="logo.png",
            file_type=FileType.IMAGE,
            size=12345,
            width=800,
            height=600
        )],
        buttons=[[Button(
            text="Подробнее",
            url="https://example.com/details",
            data="awesome"
        )]],
        parent_message_id=194270,
        display_avatar_url="https://example.com/avatar.png",
        display_name="Бот Поддержки",
        skip_invite_mentions=False
    ),
    link_preview=False
)
response = await client.messages.create_message(request=request)
# → Message(id: int, entity_type: MessageEntityType, entity_id: int, chat_id: int, root_chat_id: int, content: str, user_id: int, created_at: str, url: str, files: list[File(id: int, key: str, name: str, file_type: FileType, url: str, width: int | None, height: int | None)], buttons: list[list[Button(text: str, url: str | None, data: str | None)]] | None, thread: MessageThread(id: int, chat_id: int) | None, forwarding: Forwarding(original_message_id: int, original_chat_id: int, author_id: int, original_created_at: str, original_thread_id: int | None, original_thread_message_id: int | None, original_thread_parent_chat_id: int | None) | None, parent_message_id: int | None, display_avatar_url: str | None, display_name: str | None, changed_at: str | None, deleted_at: str | None)

# Список сотрудников
params = ListUsersParams(
    query="Олег",
    limit=1,
    cursor="eyJpZCI6MTAsImRpciI6ImFzYyJ9"
)
response = await client.users.list_users(params=params)
# → ListUsersResponse(data: list[User], meta: PaginationMeta)

# Создание задачи
request = TaskCreateRequest(
    task=TaskCreateRequestTask(
        kind=TaskKind.REMINDER,
        content="Забрать со склада 21 заказ",
        due_at="2020-06-05T12:00:00.000+03:00",
        priority=2,
        performer_ids=[123],
        chat_id=456,
        all_day=False,
        custom_properties=[TaskCreateRequestCustomProperty(id=78, value="Синий склад")]
    )
)
response = await client.tasks.create_task(request=request)
# → Task(id: int, kind: TaskKind, content: str, due_at: str | None, priority: int, user_id: int, chat_id: int | None, status: TaskStatus, created_at: str, performer_ids: list[int], all_day: bool, custom_properties: list[CustomProperty(id: int, name: str, data_type: CustomPropertyDataType, value: str)])
```


