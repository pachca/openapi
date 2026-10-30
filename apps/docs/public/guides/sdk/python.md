> Расположение: SDK
> Краткое содержание: Асинхронный типизированный клиент для Pachca API на Python: httpx, type hints, dataclass-модели, автопагинация и retry. PyPI-пакет, требуется Python 3.10+
> Это Markdown-версия конкретной страницы. Для контекста за её пределами (правила API, полный перечень методов, авторизация) ОБЯЗАТЕЛЬНО открой [llms.txt](https://dev.pachca.com/llms.txt) перед ответом — это сэкономит токены и предотвратит неполный ответ.


# Python

- [pachca-sdk](https://pypi.org/project/pachca-sdk/) PyPI


Асинхронный типизированный клиент для Pachca API. Построен на httpx с поддержкой type hints и dataclass-моделей. Требуется Python 3.10+.

## Быстрый старт


  ### Шаг 1. Установка

```bash
pip install pachca-sdk
```


  ### Шаг 2. Создание клиента

Клиенту нужен токен бота или персональный токен. Какой выбрать и кто может его выпустить, описано в разделе [Какой токен выбрать](/api/authorization#kakoy-token-vybrat).

```python
from pachca.client import PachcaClient

client = PachcaClient("YOUR_TOKEN")
```


  ### Шаг 3. Первый запрос

```python
# Получение профиля
response = await client.profile.get_profile()
# → User(id: int, first_name: str | None, last_name: str | None, nickname: str, email: str | None, phone_number: str | None, department: str | None, title: str | None, role: UserRole, suspended: bool, invite_status: InviteStatus, inviter_id: int | None, list_tags: list[str], custom_properties: list[CustomProperty(id: int, name: str, data_type: CustomPropertyDataType, value: str | None)], user_status: UserStatus(emoji: str, title: str, expires_at: datetime | None, is_away: bool, away_message: UserStatusAwayMessage(text: str) | None) | None, bot: bool, sso: bool, created_at: datetime, last_activity_at: datetime | None, time_zone: str | None, image_url: str | None)
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
| `client.oauth.revoke_token()` | [Отзыв токена](/api/oauth/revoke-token) |
| `client.oauth.exchange_token()` | [Обмен кода на токен](/api/oauth/exchange-token) |
| `client.oauth.get_token_info()` | [Информация о токене](/api/oauth/token-info) |
| `client.chats.create_chat()` | [Новый чат](/api/chats/create) |
| `client.chats.request_export()` | [Экспорт сообщений](/api/chats/request-export) |
| `client.chats.list_chats()` | [Список чатов](/api/chats/list) |
| `client.chats.get_chat()` | [Информация о чате](/api/chats/get) |
| `client.chats.list_company_chats()` | [Список чатов пространства](/api/chats/list-company) |
| `client.chats.download_export()` | [Скачать архив экспорта](/api/chats/download-export) |
| `client.chats.update_chat()` | [Редактирование чата](/api/chats/update) |
| `client.chats.archive_chat()` | [Архивация чата](/api/chats/archive) |
| `client.chats.update_chat_avatar()` | [Загрузка аватара чата](/api/chats/update-avatar) |
| `client.chats.unarchive_chat()` | [Разархивация чата](/api/chats/unarchive) |
| `client.chats.mark_chat_unread()` | [Отметка чата непрочитанным](/api/chats/mark-unread) |
| `client.chats.delete_chat_avatar()` | [Удаление аватара чата](/api/chats/remove-avatar) |
| `client.profile.get_profile()` | [Свой профиль](/api/profile/get) |
| `client.profile.get_status()` | [Свой статус](/api/profile/get-status) |
| `client.profile.update_profile_avatar()` | [Загрузка своего аватара](/api/profile/update-avatar) |
| `client.profile.update_status()` | [Новый свой статус](/api/profile/update-status) |
| `client.profile.delete_profile_avatar()` | [Удаление своего аватара](/api/profile/delete-avatar) |
| `client.profile.delete_status()` | [Удаление своего статуса](/api/profile/delete-status) |
| `client.users.create_user()` | [Новый сотрудник](/api/users/create) |
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
| `client.group_tags.list_tags()` | [Список тегов](/api/group-tags/list) |
| `client.group_tags.get_tag()` | [Информация о теге](/api/group-tags/get) |
| `client.group_tags.get_tag_users()` | [Список сотрудников тега](/api/group-tags/list-users) |
| `client.group_tags.update_tag()` | [Редактирование тега](/api/group-tags/update) |
| `client.group_tags.delete_tag()` | [Удаление тега](/api/group-tags/delete) |
| `client.members.add_tags()` | [Добавление тегов](/api/members/add-group-tags) |
| `client.members.add_members()` | [Добавление участников](/api/members/add) |
| `client.members.list_members()` | [Список участников чата](/api/members/list) |
| `client.members.update_member_role()` | [Редактирование роли участника](/api/members/update) |
| `client.members.leave_chat()` | [Выход из чата](/api/members/leave) |
| `client.members.remove_tag()` | [Исключение тега из чата](/api/members/remove-group-tag) |
| `client.members.remove_member()` | [Исключение участника](/api/members/remove) |
| `client.threads.create_standalone_thread()` | [Новый самостоятельный тред](/api/threads/create) |
| `client.threads.create_thread()` | [Новый тред](/api/threads/add) |
| `client.threads.list_threads()` | [Список тредов](/api/threads/list) |
| `client.threads.get_thread()` | [Информация о треде](/api/threads/get) |
| `client.messages.create_message()` | [Новое сообщение](/api/messages/create) |
| `client.messages.unfurl()` | [Unfurl (разворачивание ссылок)](/api/messages/unfurl) |
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
| `client.important_messages.add_message_to_important()` | [Добавление сообщения в важные](/api/important-messages/create) |
| `client.important_messages.list_important_messages()` | [Список важных сообщений](/api/important-messages/list) |
| `client.important_messages.remove_message_from_important()` | [Удаление сообщения из важных](/api/important-messages/delete) |
| `client.search.search_chats()` | [Поиск чатов](/api/search/list-chats) |
| `client.search.search_messages()` | [Поиск сообщений](/api/search/list-messages) |
| `client.search.search_users()` | [Поиск сотрудников](/api/search/list-users) |
| `client.tasks.create_task()` | [Новое напоминание](/api/tasks/create) |
| `client.tasks.list_tasks()` | [Список напоминаний](/api/tasks/list) |
| `client.tasks.get_task()` | [Информация о напоминании](/api/tasks/get) |
| `client.tasks.update_task()` | [Редактирование напоминания](/api/tasks/update) |
| `client.tasks.delete_task()` | [Удаление напоминания](/api/tasks/delete) |
| `client.drafts.create_draft()` | [Новый черновик](/api/drafts/create) |
| `client.drafts.list_drafts()` | [Список черновиков](/api/drafts/list) |
| `client.drafts.get_draft()` | [Информация о черновике](/api/drafts/get) |
| `client.drafts.update_draft()` | [Редактирование черновика](/api/drafts/update) |
| `client.drafts.delete_draft()` | [Удаление черновика](/api/drafts/delete) |
| `client.views.open_view()` | [Открытие представления](/api/views/open) |
| `client.views.submit_view_response()` | [Ответ на отправку формы](/api/views/submit-response) |
| `client.bots.create_bot()` | [Новый бот](/api/bots/create) |
| `client.bots.self_recreate_bot_token()` | [Ротация собственного токена бота](/api/bots/recreate-token-self) |
| `client.bots.recreate_bot_token()` | [Ротация токена бота](/api/bots/recreate-token) |
| `client.bots.rotate_bot_client_secret()` | [Ротация секрета клиента](/api/bots/rotate-client-secret) |
| `client.bots.create_bot_token()` | [Новый токен бота](/api/bots/create-token) |
| `client.bots.reissue_bot_token()` | [Перевыпуск токена бота](/api/bots/reissue-token) |
| `client.bots.list_bots()` | [Список ботов](/api/bots/list) |
| `client.bots.get_bot()` | [Информация о боте](/api/bots/get) |
| `client.bots.list_company_bots()` | [Список ботов пространства](/api/bots/list-company) |
| `client.bots.get_webhook_events()` | [История событий](/api/bots/list-events) |
| `client.bots.get_bot_scopes()` | [Каталог прав бота](/api/bots/list-scopes) |
| `client.bots.list_bot_tokens()` | [Список токенов бота](/api/bots/list-tokens) |
| `client.bots.get_webhook_events_stream()` | [Поток событий](/api/bots/get-stream) |
| `client.bots.self_update_bot_webhook()` | [Саморегистрация вебхука бота](/api/bots/update-webhook) |
| `client.bots.update_bot()` | [Редактирование бота](/api/bots/update) |
| `client.bots.update_bot_avatar()` | [Загрузка аватара бота](/api/bots/update-avatar) |
| `client.bots.update_bot_token()` | [Изменение токена бота](/api/bots/update-token) |
| `client.bots.delete_bot()` | [Удаление бота](/api/bots/delete) |
| `client.bots.delete_bot_avatar()` | [Удаление аватара бота](/api/bots/remove-avatar) |
| `client.bots.delete_webhook_event()` | [Удаление события истории](/api/bots/remove-event) |
| `client.bots.delete_bot_token()` | [Удаление токена бота](/api/bots/delete-token) |
| `client.security.get_audit_events()` | [Журнал аудита событий](/api/security/list) |
| `client.custom_properties.list_properties()` | [Список дополнительных полей](/api/custom-properties/list) |
| `client.files.upload_file()` | [Загрузка файла](/api/files/direct-url) |
| `client.files.get_upload_params()` | [Получение подписи, ключа и других параметров](/api/files/uploads) |
| `client.files.download_file()` | [Скачивание файла](/api/files/get) |


## Запросы

Все методы — асинхронные (`async def`) и возвращают корутины.

**GET с параметрами:**

```python
from datetime import datetime

from pachca.models import ChatAvailability, ChatSortField, ListChatsParams, SortOrder

# Список чатов
params = ListChatsParams(
    sort=ChatSortField.ID,
    order=SortOrder.DESC,
    availability=ChatAvailability.IS_MEMBER,
    archived=True,
    last_message_at_after=datetime.fromisoformat("2025-01-01T00:00:00.000+00:00"),
    last_message_at_before=datetime.fromisoformat("2025-02-01T00:00:00.000+00:00"),
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
# → CreateChatResponse(data: Chat(id: int, name: str, created_at: datetime, owner_id: int, member_ids: list[int], group_tag_ids: list[int], channel: bool, archived: bool, personal: bool, public: bool, last_message_at: datetime, meet_room_url: str, avatar_url: str | None), meta: CreateChatResponseMeta(not_found_member_ids: list[int], not_found_group_tag_ids: list[int]))
```


**Простой вызов по ID:**

```python
# Получение чата
response = await client.chats.get_chat(id=334)
# → Chat(id: int, name: str, created_at: datetime, owner_id: int, member_ids: list[int], group_tag_ids: list[int], channel: bool, archived: bool, personal: bool, public: bool, last_message_at: datetime, meet_room_url: str, avatar_url: str | None)
```


## Пагинация

Поля пагинации называются как в API: `meta.paginate.next_page`, `prev_page`, `has_next` и `has_prev`, а у методов поиска ещё `meta.total`. Какие поля приходят у каждого метода и как понять, что страницы закончились, описано в разделе [Пагинация](/api/pagination).

### Ручная пагинация

```python
from pachca.models import ListChatsParams

cursor = None
has_next = True
while has_next:
    response = await client.chats.list_chats(ListChatsParams(limit=50, cursor=cursor))
    if not response.data:
        break
    for chat in response.data:
        print(chat.id, chat.name)
    cursor = response.meta.paginate.next_page
    has_next = response.meta.paginate.has_next is not False
```

В модели поле `has_next` необязательное. Если оно `None`, цикл идёт дальше и останавливается на пустой странице. Так же обходят страницы методы `*_all()`.

### Автопагинация

Для каждого метода с пагинацией есть `*_all()` вариант:

```python
# Все чаты одним списком
chats = await client.chats.list_chats_all()
print(f"Всего: {len(chats)}")
```

Доступные методы автопагинации:

| Метод | Возвращает |
|-------|-----------|
| `security.get_audit_events_all()` | `list[AuditEvent]` |
| `bots.list_bots_all()` | `list[BotResponse]` |
| `bots.list_bot_tokens_all()` | `list[BotAccessToken]` |
| `bots.list_company_bots_all()` | `list[CompanyBotResponse]` |
| `bots.get_webhook_events_all()` | `list[WebhookEvent]` |
| `chats.list_chats_all()` | `list[Chat]` |
| `chats.list_company_chats_all()` | `list[Chat]` |
| `drafts.list_drafts_all()` | `list[Draft]` |
| `group_tags.list_tags_all()` | `list[GroupTag]` |
| `group_tags.get_tag_users_all()` | `list[User]` |
| `important_messages.list_important_messages_all()` | `list[Message]` |
| `members.list_members_all()` | `list[User]` |
| `messages.list_chat_messages_all()` | `list[Message]` |
| `reactions.list_reactions_all()` | `list[Reaction]` |
| `search.search_chats_all()` | `list[Chat]` |
| `search.search_messages_all()` | `list[Message]` |
| `search.search_users_all()` | `list[User]` |
| `tasks.list_tasks_all()` | `list[Task]` |
| `threads.list_threads_all()` | `list[Thread]` |
| `users.list_users_all()` | `list[User]` |

## Обработка ошибок

SDK выбрасывает два типа исключений:

### ApiError

Возникает при ошибках `400`, `403`, `404`, `409`, `410`, `422` с массивом `errors` в теле:

```python
from pachca.models import ApiError

try:
    await client.chats.create_chat(request)
except ApiError as error:
    for e in error.errors:
        print(e.key, e.message)   # name не может быть пустым
        print(e.code)             # blank
```

Поля `ApiErrorItem`:

| Поле | Тип | Описание |
|------|-----|----------|
| `key` | `str` | Поле, вызвавшее ошибку |
| `value` | `Any \| None` | Переданное значение |
| `message` | `str` | Текст ошибки |
| `code` | `ValidationErrorCode` | Код валидации |
| `payload` | `dict[str, Any] \| None` | Дополнительные данные |

Код статуса ответа — в поле `status_code`. Если ответ с ошибкой пришёл без тела или не в JSON, SDK тоже выбрасывает `ApiError`: с кодом статуса и пустым `errors`. Так бывает с ответом `404` без тела от метода [Поток событий](/api/bots/get-stream), когда история событий выключена, и со страницей прокси при `502`.

### OAuthError

Возникает при ошибке авторизации: `401`, а также `403` с кодом `insufficient_scope` или `role_forbidden` и отказе при обмене кода на токен. Код — в поле `error`, список кодов — в разделе [Ошибки авторизации](/api/authorization#oshibki-avtorizatsii):

```python
from pachca.models import OAuthError

try:
    await client.profile.get_profile()
except OAuthError as error:
    print(error.error)              # "insufficient_scope"
    print(error.error_description)  # описание ошибки
```

Поле `error` — перечисление `OAuthErrorCode`: его сравнивают с элементом, например `OAuthErrorCode.INSUFFICIENT_SCOPE`, или со строкой.

## Повторные запросы

Паузы между попытками, к каждой SDK добавляет случайную величину до 25%:

- **429 с заголовком `Retry-After`:** срок из заголовка
- **429 без заголовка:** 1 сек, 2 сек, 4 сек
- **5xx:** 1 сек, 2 сек, 3 сек

Сетевую ошибку без ответа сервера SDK не повторяет: исключение httpx приходит сразу. Повторы делает `RetryTransport`, обёртка над транспортом httpx.

Общие правила повторов — в разделе [Повторные запросы](/api/limits#povtornye-zaprosy-retry).

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
    ListChatsResponse, ListMembersResponse, CreateChatResponse,
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

Поле-перечисление в ответе приходит элементом своего перечисления, в том числе со значением, которого SDK ещё не знает: у такого элемента в `value` исходная строка, а `is_known` равно `False`. Так же работает и вызов вроде `OAuthScope("x")`: проверить, знает ли SDK значение, помогает `is_known`.

## Тело вебхука

Тела событий вебхука описаны моделями `MessageWebhookPayload`, `ReactionWebhookPayload`, `ButtonWebhookPayload`, `ViewSubmitWebhookPayload`, `ChatMemberWebhookPayload`, `CompanyMemberWebhookPayload`, `LinkSharedWebhookPayload` и `VideoCallWebhookPayload`. Тип `WebhookPayloadUnion` объединяет их, а модель по полям `type` и `event` выбирает функция `deserialize`:

```python
import json

from pachca.models import ButtonWebhookPayload, WebhookPayloadUnion
from pachca.utils import deserialize

# raw_body — тело запроса в байтах
payload = deserialize(WebhookPayloadUnion, json.loads(raw_body))
if isinstance(payload, ButtonWebhookPayload):
    print(payload.message_id, payload.data)
```

Подпись проверяйте по исходному телу до разбора, как в разделе [Безопасность](/guides/webhook/handler#bezopasnost). Те же модели отдают методы `poll_webhook_events` и `poll_webhook_payloads`, которые забирают события из истории: пример — в разделе [Пример поллинга](/guides/webhook/polling#primer-pollinga).

## Зависимости

| Пакет | Версия | Назначение |
|-------|--------|-----------|
| `httpx` | `>=0.23.0, <0.29.0` | Асинхронный HTTP-клиент |

## Примеры

**Отправка сообщения:**

```python
from pachca.client import PachcaClient
from pachca.models import MessageCreateRequest, MessageCreateRequestMessage

client = PachcaClient("YOUR_TOKEN")

request = MessageCreateRequest(message=MessageCreateRequestMessage(entity_id=334, content="Вчера мы продали 756 футболок (что на 10% больше, чем в прошлое воскресенье)"))
response = await client.messages.create_message(request=request)
# → Message(id: int, entity_type: MessageEntityType, entity_id: int, chat_id: int, root_chat_id: int, content: str, user_id: int, created_at: datetime, url: str, files: list[File(id: int, key: str, name: str, file_type: FileType, url: str, width: int | None, height: int | None, duration_ms: int | None)], voice_content: VoiceContent(duration_ms: int, waveform: str, transcript: str | None) | None, buttons: list[list[Button(text: str, url: str | None, data: str | None)]] | None, thread: MessageThread(id: int, chat_id: int) | None, forwarding: Forwarding(original_message_id: int, original_chat_id: int, author_id: int, original_created_at: datetime, original_thread_id: int | None, original_thread_message_id: int | None, original_thread_parent_chat_id: int | None) | None, parent_message_id: int | None, display_avatar_url: str | None, display_name: str | None, changed_at: datetime | None, deleted_at: datetime | None, important: bool)
```


**Список сотрудников:**

```python
from pachca.client import PachcaClient
from pachca.models import ListUsersParams

client = PachcaClient("YOUR_TOKEN")

params = ListUsersParams(
    query="Олег",
    limit=1,
    cursor="eyJpZCI6MTAsImRpciI6ImFzYyJ9"
)
response = await client.users.list_users(params=params)
# → ListUsersResponse(data: list[User], meta: PaginationMeta)
```


**Создание задачи:**

```python
from datetime import datetime

from pachca.client import PachcaClient
from pachca.models import TaskCreateRequest, TaskCreateRequestCustomProperty, TaskCreateRequestTask, TaskKind

client = PachcaClient("YOUR_TOKEN")

request = TaskCreateRequest(
    task=TaskCreateRequestTask(
        kind=TaskKind.REMINDER,
        content="Забрать со склада 21 заказ",
        due_at=datetime.fromisoformat("2020-06-05T12:00:00.000+03:00"),
        priority=2,
        performer_ids=[123],
        chat_id=456,
        all_day=False,
        custom_properties=[TaskCreateRequestCustomProperty(id=78, value="Синий склад")]
    )
)
response = await client.tasks.create_task(request=request)
# → Task(id: int, kind: TaskKind, content: str, due_at: datetime | None, priority: int, user_id: int, chat_id: int | None, status: TaskStatus, created_at: datetime, performer_ids: list[int], all_day: bool, custom_properties: list[CustomProperty(id: int, name: str, data_type: CustomPropertyDataType, value: str | None)])
```



## Связанные разделы

- [SDK](/guides/sdk/overview)
- [Авторизация](/api/authorization)
- [Пагинация](/api/pagination)
