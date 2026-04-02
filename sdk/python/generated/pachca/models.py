from __future__ import annotations

from dataclasses import dataclass
from enum import StrEnum
from typing import Union

class AuditEventKey(StrEnum):
    """Тип аудит-события"""

    USER_LOGIN = "user_login"  # Пользователь успешно вошел в систему
    USER_LOGOUT = "user_logout"  # Пользователь вышел из системы
    USER_2FA_FAIL = "user_2fa_fail"  # Неудачная попытка двухфакторной аутентификации
    USER_2FA_SUCCESS = "user_2fa_success"  # Успешная двухфакторная аутентификация
    USER_CREATED = "user_created"  # Создана новая учетная запись пользователя
    USER_DELETED = "user_deleted"  # Учетная запись пользователя удалена
    USER_ROLE_CHANGED = "user_role_changed"  # Роль пользователя была изменена
    USER_UPDATED = "user_updated"  # Данные пользователя обновлены
    TAG_CREATED = "tag_created"  # Создан новый тег
    TAG_DELETED = "tag_deleted"  # Тег удален
    USER_ADDED_TO_TAG = "user_added_to_tag"  # Пользователь добавлен в тег
    USER_REMOVED_FROM_TAG = "user_removed_from_tag"  # Пользователь удален из тега
    CHAT_CREATED = "chat_created"  # Создан новый чат
    CHAT_RENAMED = "chat_renamed"  # Чат переименован
    CHAT_PERMISSION_CHANGED = "chat_permission_changed"  # Изменены права доступа к чату
    USER_CHAT_JOIN = "user_chat_join"  # Пользователь присоединился к чату
    USER_CHAT_LEAVE = "user_chat_leave"  # Пользователь покинул чат
    TAG_ADDED_TO_CHAT = "tag_added_to_chat"  # Тег добавлен в чат
    TAG_REMOVED_FROM_CHAT = "tag_removed_from_chat"  # Тег удален из чата
    MESSAGE_UPDATED = "message_updated"  # Сообщение отредактировано
    MESSAGE_DELETED = "message_deleted"  # Сообщение удалено
    MESSAGE_CREATED = "message_created"  # Сообщение создано
    REACTION_CREATED = "reaction_created"  # Реакция добавлена
    REACTION_DELETED = "reaction_deleted"  # Реакция удалена
    THREAD_CREATED = "thread_created"  # Тред создан
    ACCESS_TOKEN_CREATED = "access_token_created"  # Создан новый токен доступа
    ACCESS_TOKEN_UPDATED = "access_token_updated"  # Токен доступа обновлен
    ACCESS_TOKEN_DESTROY = "access_token_destroy"  # Токен доступа удален
    KMS_ENCRYPT = "kms_encrypt"  # Данные зашифрованы
    KMS_DECRYPT = "kms_decrypt"  # Данные расшифрованы
    AUDIT_EVENTS_ACCESSED = "audit_events_accessed"  # Доступ к журналам аудита получен
    DLP_VIOLATION_DETECTED = "dlp_violation_detected"  # Срабатывание правила DLP-системы
    SEARCH_USERS_API = "search_users_api"  # Поиск сотрудников через API
    SEARCH_CHATS_API = "search_chats_api"  # Поиск чатов через API
    SEARCH_MESSAGES_API = "search_messages_api"  # Поиск сообщений через API


class ChatAvailability(StrEnum):
    """Доступность чатов для пользователя"""

    IS_MEMBER = "is_member"  # Чаты, где пользователь является участником
    PUBLIC = "public"  # Все открытые чаты компании, вне зависимости от участия в них пользователя


class ChatMemberRole(StrEnum):
    """Роль участника чата"""

    ADMIN = "admin"  # Админ
    EDITOR = "editor"  # Редактор (доступно только для каналов)
    MEMBER = "member"  # Участник или подписчик


class ChatMemberRoleFilter(StrEnum):
    """Роль участника чата (с фильтром все)"""

    ALL = "all"  # Любая роль
    OWNER = "owner"  # Создатель
    ADMIN = "admin"  # Админ
    EDITOR = "editor"  # Редактор
    MEMBER = "member"  # Участник/подписчик


class ChatSubtype(StrEnum):
    """Тип чата"""

    DISCUSSION = "discussion"  # Канал или беседа
    THREAD = "thread"  # Тред


class CustomPropertyDataType(StrEnum):
    """Тип данных дополнительного поля"""

    STRING = "string"  # Строковое значение
    NUMBER = "number"  # Числовое значение
    DATE = "date"  # Дата
    LINK = "link"  # Ссылка


class FileType(StrEnum):
    """Тип файла"""

    FILE = "file"  # Обычный файл
    IMAGE = "image"  # Изображение


class InviteStatus(StrEnum):
    """Статус приглашения пользователя"""

    CONFIRMED = "confirmed"  # Принято
    SENT = "sent"  # Отправлено


class MemberEventType(StrEnum):
    """Тип события webhook для участников"""

    ADD = "add"  # Добавление
    REMOVE = "remove"  # Удаление


class MessageEntityType(StrEnum):
    """Тип сущности для сообщений"""

    DISCUSSION = "discussion"  # Беседа или канал
    THREAD = "thread"  # Тред
    USER = "user"  # Пользователь


class OAuthScope(StrEnum):
    """Скоуп доступа OAuth токена"""

    CHATS_READ = "chats:read"  # Просмотр чатов и списка чатов
    CHATS_CREATE = "chats:create"  # Создание новых чатов
    CHATS_UPDATE = "chats:update"  # Изменение настроек чата
    CHATS_ARCHIVE = "chats:archive"  # Архивация и разархивация чатов
    CHATS_LEAVE = "chats:leave"  # Выход из чатов
    CHAT_MEMBERS_READ = "chat_members:read"  # Просмотр участников чата
    CHAT_MEMBERS_WRITE = "chat_members:write"  # Добавление, изменение и удаление участников чата
    CHAT_EXPORTS_READ = "chat_exports:read"  # Скачивание экспортов чата
    CHAT_EXPORTS_WRITE = "chat_exports:write"  # Создание экспортов чата
    MESSAGES_READ = "messages:read"  # Просмотр сообщений в чатах
    MESSAGES_CREATE = "messages:create"  # Отправка сообщений
    MESSAGES_UPDATE = "messages:update"  # Редактирование сообщений
    MESSAGES_DELETE = "messages:delete"  # Удаление сообщений
    REACTIONS_READ = "reactions:read"  # Просмотр реакций на сообщения
    REACTIONS_WRITE = "reactions:write"  # Добавление и удаление реакций
    PINS_WRITE = "pins:write"  # Закрепление и открепление сообщений
    THREADS_READ = "threads:read"  # Просмотр тредов (комментариев)
    THREADS_CREATE = "threads:create"  # Создание тредов (комментариев)
    LINK_PREVIEWS_WRITE = "link_previews:write"  # Unfurl (разворачивание ссылок)
    USERS_READ = "users:read"  # Просмотр информации о сотрудниках и списка сотрудников
    USERS_CREATE = "users:create"  # Создание новых сотрудников
    USERS_UPDATE = "users:update"  # Редактирование данных сотрудника
    USERS_DELETE = "users:delete"  # Удаление сотрудников
    GROUP_TAGS_READ = "group_tags:read"  # Просмотр тегов
    GROUP_TAGS_WRITE = "group_tags:write"  # Создание, редактирование и удаление тегов
    BOTS_WRITE = "bots:write"  # Изменение настроек бота
    PROFILE_READ = "profile:read"  # Просмотр информации о своем профиле
    PROFILE_STATUS_READ = "profile_status:read"  # Просмотр статуса профиля
    PROFILE_STATUS_WRITE = "profile_status:write"  # Изменение и удаление статуса профиля
    USER_STATUS_READ = "user_status:read"  # Просмотр статуса сотрудника
    USER_STATUS_WRITE = "user_status:write"  # Изменение и удаление статуса сотрудника
    CUSTOM_PROPERTIES_READ = "custom_properties:read"  # Просмотр дополнительных полей
    AUDIT_EVENTS_READ = "audit_events:read"  # Просмотр журнала аудита
    TASKS_READ = "tasks:read"  # Просмотр задач
    TASKS_CREATE = "tasks:create"  # Создание задач
    TASKS_UPDATE = "tasks:update"  # Изменение задачи
    TASKS_DELETE = "tasks:delete"  # Удаление задачи
    FILES_READ = "files:read"  # Скачивание файлов
    FILES_WRITE = "files:write"  # Загрузка файлов
    UPLOADS_WRITE = "uploads:write"  # Получение данных для загрузки файлов
    VIEWS_WRITE = "views:write"  # Открытие форм (представлений)
    WEBHOOKS_READ = "webhooks:read"  # Просмотр вебхуков
    WEBHOOKS_WRITE = "webhooks:write"  # Создание и управление вебхуками
    WEBHOOKS_EVENTS_READ = "webhooks:events:read"  # Просмотр лога вебхуков
    WEBHOOKS_EVENTS_DELETE = "webhooks:events:delete"  # Удаление записи в логе вебхука
    SEARCH_USERS = "search:users"  # Поиск сотрудников
    SEARCH_CHATS = "search:chats"  # Поиск чатов
    SEARCH_MESSAGES = "search:messages"  # Поиск сообщений


class ReactionEventType(StrEnum):
    """Тип события webhook для реакций"""

    NEW = "new"  # Создание
    DELETE = "delete"  # Удаление


class SearchEntityType(StrEnum):
    """Тип сущности для поиска"""

    USER = "User"  # Пользователь
    TASK = "Task"  # Задача


class SearchSortOrder(StrEnum):
    """Сортировка результатов поиска"""

    BY_SCORE = "by_score"  # По релевантности
    ALPHABETICAL = "alphabetical"  # По алфавиту


class SortOrder(StrEnum):
    """Порядок сортировки"""

    ASC = "asc"  # По возрастанию
    DESC = "desc"  # По убыванию


class TaskKind(StrEnum):
    """Тип задачи"""

    CALL = "call"  # Позвонить контакту
    MEETING = "meeting"  # Встреча
    REMINDER = "reminder"  # Простое напоминание
    EVENT = "event"  # Событие
    EMAIL = "email"  # Написать письмо


class TaskStatus(StrEnum):
    """Статус напоминания"""

    DONE = "done"  # Выполнено
    UNDONE = "undone"  # Активно


class UserEventType(StrEnum):
    """Тип события webhook для пользователей"""

    INVITE = "invite"  # Приглашение
    CONFIRM = "confirm"  # Подтверждение
    UPDATE = "update"  # Обновление
    SUSPEND = "suspend"  # Приостановка
    ACTIVATE = "activate"  # Активация
    DELETE = "delete"  # Удаление


class UserRole(StrEnum):
    """Роль пользователя в системе"""

    ADMIN = "admin"  # Администратор
    USER = "user"  # Сотрудник
    MULTI_GUEST = "multi_guest"  # Мульти-гость
    GUEST = "guest"  # Гость


class UserRoleInput(StrEnum):
    """Роль пользователя, допустимая при создании и редактировании. Роль `guest` недоступна для установки через API."""

    ADMIN = "admin"  # Администратор
    USER = "user"  # Сотрудник
    MULTI_GUEST = "multi_guest"  # Мульти-гость


class ValidationErrorCode(StrEnum):
    """Коды ошибок валидации"""

    BLANK = "blank"  # Обязательное поле (не может быть пустым)
    TOO_LONG = "too_long"  # Слишком длинное значение (пояснения вы получите в поле message)
    INVALID = "invalid"  # Поле не соответствует правилам (пояснения вы получите в поле message)
    INCLUSION = "inclusion"  # Поле имеет непредусмотренное значение
    EXCLUSION = "exclusion"  # Поле имеет недопустимое значение
    TAKEN = "taken"  # Название для этого поля уже существует
    WRONG_EMOJI = "wrong_emoji"  # Emoji статуса не может содержать значения отличные от Emoji символа
    NOT_FOUND = "not_found"  # Объект не найден
    ALREADY_EXISTS = "already_exists"  # Объект уже существует (пояснения вы получите в поле message)
    PERSONAL_CHAT = "personal_chat"  # Ошибка личного чата (пояснения вы получите в поле message)
    DISPLAYED_ERROR = "displayed_error"  # Отображаемая ошибка (пояснения вы получите в поле message)
    NOT_AUTHORIZED = "not_authorized"  # Действие запрещено
    INVALID_DATE_RANGE = "invalid_date_range"  # Выбран слишком большой диапазон дат
    INVALID_WEBHOOK_URL = "invalid_webhook_url"  # Некорректный URL вебхука
    RATE_LIMIT = "rate_limit"  # Достигнут лимит запросов
    LICENSES_LIMIT = "licenses_limit"  # Превышен лимит активных сотрудников (пояснения вы получите в поле message)
    USER_LIMIT = "user_limit"  # Превышен лимит количества реакций, которые может добавить пользователь (20 уникальных реакций)
    UNIQUE_LIMIT = "unique_limit"  # Превышен лимит количества уникальных реакций, которые можно добавить на сообщение (30 уникальных реакций)
    GENERAL_LIMIT = "general_limit"  # Превышен лимит количества реакций, которые можно добавить на сообщение (1000 реакций)
    UNHANDLED = "unhandled"  # Ошибка выполнения запроса (пояснения вы получите в поле message)
    TRIGGER_NOT_FOUND = "trigger_not_found"  # Не удалось найти идентификатор события
    TRIGGER_EXPIRED = "trigger_expired"  # Время жизни идентификатора события истекло
    REQUIRED = "required"  # Обязательный параметр не передан
    IN = "in"  # Недопустимое значение (не входит в список допустимых)
    NOT_APPLICABLE = "not_applicable"  # Значение неприменимо в данном контексте (пояснения вы получите в поле message)
    SELF_UPDATE = "self_update"  # Нельзя изменить свои собственные данные
    OWNER_PROTECTED = "owner_protected"  # Нельзя изменить данные владельца
    ALREADY_ASSIGNED = "already_assigned"  # Значение уже назначено
    FORBIDDEN = "forbidden"  # Недостаточно прав для выполнения действия (пояснения вы получите в поле message)
    PERMISSION_DENIED = "permission_denied"  # Доступ запрещён (недостаточно прав)
    ACCESS_DENIED = "access_denied"  # Доступ запрещён
    WRONG_PARAMS = "wrong_params"  # Некорректные параметры запроса (пояснения вы получите в поле message)
    PAYMENT_REQUIRED = "payment_required"  # Требуется оплата
    MIN_LENGTH = "min_length"  # Значение слишком короткое (пояснения вы получите в поле message)
    MAX_LENGTH = "max_length"  # Значение слишком длинное (пояснения вы получите в поле message)
    USE_OF_SYSTEM_WORDS = "use_of_system_words"  # Использовано зарезервированное системное слово (here, all)


class WebhookEventType(StrEnum):
    """Тип события webhook"""

    NEW = "new"  # Создание
    UPDATE = "update"  # Обновление
    DELETE = "delete"  # Удаление


@dataclass
class AccessTokenInfo:
    id: int
    token: str
    user_id: int
    scopes: list[OAuthScope]
    created_at: str
    name: str | None = None
    revoked_at: str | None = None
    expires_in: int | None = None
    last_used_at: str | None = None


@dataclass
class AddMembersRequest:
    member_ids: list[int]
    silent: bool | None = None


@dataclass
class AddTagsRequest:
    group_tag_ids: list[int]


@dataclass
class ApiError(Exception):
    errors: list[ApiErrorItem]


@dataclass
class ApiErrorItem:
    key: str
    message: str
    code: ValidationErrorCode
    value: str | None = None
    payload: dict[str, str] | None = None


@dataclass
class AuditDetailsChatId:
    chat_id: int


@dataclass
class AuditDetailsChatPermission:
    public_access: bool


@dataclass
class AuditDetailsChatRenamed:
    old_name: str
    new_name: str


@dataclass
class AuditDetailsDlp:
    dlp_rule_id: int
    dlp_rule_name: str
    message_id: int
    chat_id: int
    user_id: int
    action_message: str
    conditions_matched: bool


@dataclass
class AuditDetailsEmpty:
    pass


@dataclass
class AuditDetailsInitiator:
    initiator_id: int


@dataclass
class AuditDetailsInviter:
    inviter_id: int


@dataclass
class AuditDetailsKms:
    chat_id: int
    message_id: int
    reason: str


@dataclass
class AuditDetailsRoleChanged:
    new_company_role: str
    previous_company_role: str
    initiator_id: int


@dataclass
class AuditDetailsSearch:
    search_type: str
    query_present: bool
    cursor_present: bool
    limit: int
    filters: dict[str, str]


@dataclass
class AuditDetailsTagChat:
    chat_id: int
    tag_name: str


@dataclass
class AuditDetailsTagName:
    name: str


@dataclass
class AuditDetailsTokenScopes:
    scopes: list[str]


@dataclass
class AuditDetailsUserUpdated:
    changed_attrs: list[str]


@dataclass
class AuditEvent:
    id: str
    created_at: str
    event_key: AuditEventKey
    entity_id: str
    entity_type: str
    actor_id: str
    actor_type: str
    details: AuditEventDetailsUnion
    ip_address: str
    user_agent: str


@dataclass
class BotResponseWebhook:
    outgoing_url: str


@dataclass
class BotResponse:
    id: int
    webhook: BotResponseWebhook


@dataclass
class BotUpdateRequestBotWebhook:
    outgoing_url: str


@dataclass
class BotUpdateRequestBot:
    webhook: BotUpdateRequestBotWebhook


@dataclass
class BotUpdateRequest:
    bot: BotUpdateRequestBot


@dataclass
class Button:
    text: str
    url: str | None = None
    data: str | None = None


@dataclass
class ButtonWebhookPayload:
    type: str  # literal "button"
    event: str  # literal "click"
    message_id: int
    trigger_id: str
    data: str
    user_id: int
    chat_id: int
    webhook_timestamp: int


@dataclass
class Chat:
    id: int
    name: str
    created_at: str
    owner_id: int
    member_ids: list[int]
    group_tag_ids: list[int]
    channel: bool
    personal: bool
    public: bool
    last_message_at: str
    meet_room_url: str


@dataclass
class ChatCreateRequestChat:
    name: str
    member_ids: list[int] | None = None
    group_tag_ids: list[int] | None = None
    channel: bool | None = False
    public: bool | None = False


@dataclass
class ChatCreateRequest:
    chat: ChatCreateRequestChat


@dataclass
class ChatMemberWebhookPayload:
    type: str  # literal "chat_member"
    event: MemberEventType
    chat_id: int
    user_ids: list[int]
    created_at: str
    webhook_timestamp: int
    thread_id: int | None = None


@dataclass
class ChatUpdateRequestChat:
    name: str | None = None
    public: bool | None = None


@dataclass
class ChatUpdateRequest:
    chat: ChatUpdateRequestChat


@dataclass
class CompanyMemberWebhookPayload:
    type: str  # literal "company_member"
    event: UserEventType
    user_ids: list[int]
    created_at: str
    webhook_timestamp: int


@dataclass
class CustomProperty:
    id: int
    name: str
    data_type: CustomPropertyDataType
    value: str


@dataclass
class CustomPropertyDefinition:
    id: int
    name: str
    data_type: CustomPropertyDataType


@dataclass
class ExportRequest:
    start_at: str
    end_at: str
    webhook_url: str
    chat_ids: list[int] | None = None
    skip_chats_file: bool | None = None


@dataclass
class File:
    id: int
    key: str
    name: str
    file_type: FileType
    url: str
    width: int | None = None
    height: int | None = None


@dataclass
class FileUploadRequest:
    content_disposition: str
    acl: str
    policy: str
    x_amz_credential: str
    x_amz_algorithm: str
    x_amz_date: str
    x_amz_signature: str
    key: str
    file: bytes


@dataclass
class Forwarding:
    original_message_id: int
    original_chat_id: int
    author_id: int
    original_created_at: str
    original_thread_id: int | None = None
    original_thread_message_id: int | None = None
    original_thread_parent_chat_id: int | None = None


@dataclass
class GroupTag:
    id: int
    name: str
    users_count: int


@dataclass
class GroupTagRequestGroupTag:
    name: str


@dataclass
class GroupTagRequest:
    group_tag: GroupTagRequestGroupTag


@dataclass
class LinkPreviewImage:
    key: str
    name: str
    size: int | None = None


@dataclass
class LinkPreview:
    title: str
    description: str
    image_url: str | None = None
    image: LinkPreviewImage | None = None


@dataclass
class LinkPreviewsRequest:
    link_previews: dict[str, LinkPreview]


@dataclass
class LinkSharedWebhookPayload:
    type: str  # literal "message"
    event: str  # literal "link_shared"
    chat_id: int
    message_id: int
    links: list[WebhookLink]
    user_id: int
    created_at: str
    webhook_timestamp: int


@dataclass
class MessageThread:
    id: int
    chat_id: int


@dataclass
class Message:
    id: int
    entity_type: MessageEntityType
    entity_id: int
    chat_id: int
    root_chat_id: int
    content: str
    user_id: int
    created_at: str
    url: str
    files: list[File]
    buttons: list[list[Button]] | None = None
    thread: MessageThread | None = None
    forwarding: Forwarding | None = None
    parent_message_id: int | None = None
    display_avatar_url: str | None = None
    display_name: str | None = None
    changed_at: str | None = None
    deleted_at: str | None = None


@dataclass
class MessageCreateRequestFile:
    key: str
    name: str
    file_type: FileType
    size: int
    width: int | None = None
    height: int | None = None


@dataclass
class MessageCreateRequestMessage:
    entity_id: int
    content: str
    entity_type: MessageEntityType | None = MessageEntityType.DISCUSSION
    files: list[MessageCreateRequestFile] | None = None
    buttons: list[list[Button]] | None = None
    parent_message_id: int | None = None
    display_avatar_url: str | None = None
    display_name: str | None = None
    skip_invite_mentions: bool | None = False


@dataclass
class MessageCreateRequest:
    message: MessageCreateRequestMessage
    link_preview: bool | None = False


@dataclass
class MessageUpdateRequestFile:
    key: str
    name: str
    file_type: str | None = None
    size: int | None = None
    width: int | None = None
    height: int | None = None


@dataclass
class MessageUpdateRequestMessage:
    content: str | None = None
    files: list[MessageUpdateRequestFile] | None = None
    buttons: list[list[Button]] | None = None
    display_avatar_url: str | None = None
    display_name: str | None = None


@dataclass
class MessageUpdateRequest:
    message: MessageUpdateRequestMessage


@dataclass
class MessageWebhookPayload:
    type: str  # literal "message"
    id: int
    event: WebhookEventType
    entity_type: MessageEntityType
    entity_id: int
    content: str
    user_id: int
    created_at: str
    url: str
    chat_id: int
    webhook_timestamp: int
    parent_message_id: int | None = None
    thread: WebhookMessageThread | None = None


@dataclass
class OAuthError(Exception):
    error: str
    error_description: str


@dataclass
class OpenViewRequestView:
    title: str
    blocks: list[ViewBlockUnion]
    close_text: str | None = "Отменить"
    submit_text: str | None = "Отправить"


@dataclass
class OpenViewRequest:
    type: str  # literal "modal"
    trigger_id: str
    view: OpenViewRequestView
    private_metadata: str | None = None
    callback_id: str | None = None


@dataclass
class PaginationMetaPaginate:
    next_page: str | None = None


@dataclass
class PaginationMeta:
    paginate: PaginationMetaPaginate | None = None


@dataclass
class Reaction:
    user_id: int
    created_at: str
    code: str
    name: str | None = None


@dataclass
class ReactionRequest:
    code: str
    name: str | None = None


@dataclass
class ReactionWebhookPayload:
    type: str  # literal "reaction"
    event: ReactionEventType
    message_id: int
    code: str
    name: str
    user_id: int
    created_at: str
    webhook_timestamp: int


@dataclass
class SearchPaginationMetaPaginate:
    next_page: str


@dataclass
class SearchPaginationMeta:
    total: int
    paginate: SearchPaginationMetaPaginate


@dataclass
class StatusUpdateRequestStatus:
    emoji: str
    title: str
    expires_at: str | None = None
    is_away: bool | None = None
    away_message: str | None = None


@dataclass
class StatusUpdateRequest:
    status: StatusUpdateRequestStatus


@dataclass
class TagNamesFilter:
    pass


@dataclass
class Task:
    id: int
    kind: TaskKind
    content: str
    priority: int
    user_id: int
    status: TaskStatus
    created_at: str
    performer_ids: list[int]
    all_day: bool
    custom_properties: list[CustomProperty]
    due_at: str | None = None
    chat_id: int | None = None


@dataclass
class TaskCreateRequestCustomProperty:
    id: int
    value: str


@dataclass
class TaskCreateRequestTask:
    kind: TaskKind
    content: str | None = None
    due_at: str | None = None
    priority: int | None = 1
    performer_ids: list[int] | None = None
    chat_id: int | None = None
    all_day: bool | None = None
    custom_properties: list[TaskCreateRequestCustomProperty] | None = None


@dataclass
class TaskCreateRequest:
    task: TaskCreateRequestTask


@dataclass
class TaskUpdateRequestCustomProperty:
    id: int
    value: str


@dataclass
class TaskUpdateRequestTask:
    kind: TaskKind | None = None
    content: str | None = None
    due_at: str | None = None
    priority: int | None = None
    performer_ids: list[int] | None = None
    status: TaskStatus | None = None
    all_day: bool | None = None
    done_at: str | None = None
    custom_properties: list[TaskUpdateRequestCustomProperty] | None = None


@dataclass
class TaskUpdateRequest:
    task: TaskUpdateRequestTask


@dataclass
class Thread:
    id: int
    chat_id: int
    message_id: int
    message_chat_id: int
    updated_at: str


@dataclass
class UpdateMemberRoleRequest:
    role: ChatMemberRole


@dataclass
class UploadParams:
    content_disposition: str
    acl: str
    policy: str
    x_amz_credential: str
    x_amz_algorithm: str
    x_amz_date: str
    x_amz_signature: str
    key: str
    direct_url: str


@dataclass
class User:
    id: int
    first_name: str
    last_name: str
    nickname: str
    email: str
    phone_number: str
    department: str
    title: str
    role: UserRole
    suspended: bool
    invite_status: InviteStatus
    list_tags: list[str]
    custom_properties: list[CustomProperty]
    bot: bool
    sso: bool
    created_at: str
    last_activity_at: str
    time_zone: str
    user_status: UserStatus | None = None
    image_url: str | None = None


@dataclass
class UserCreateRequestCustomProperty:
    id: int
    value: str


@dataclass
class UserCreateRequestUser:
    email: str
    first_name: str | None = None
    last_name: str | None = None
    phone_number: str | None = None
    nickname: str | None = None
    department: str | None = None
    title: str | None = None
    role: UserRoleInput | None = None
    suspended: bool | None = None
    list_tags: list[str] | None = None
    custom_properties: list[UserCreateRequestCustomProperty] | None = None


@dataclass
class UserCreateRequest:
    user: UserCreateRequestUser
    skip_email_notify: bool | None = None


@dataclass
class UserStatusAwayMessage:
    text: str


@dataclass
class UserStatus:
    emoji: str
    title: str
    is_away: bool
    expires_at: str | None = None
    away_message: UserStatusAwayMessage | None = None


@dataclass
class UserUpdateRequestCustomProperty:
    id: int
    value: str


@dataclass
class UserUpdateRequestUser:
    first_name: str | None = None
    last_name: str | None = None
    email: str | None = None
    phone_number: str | None = None
    nickname: str | None = None
    department: str | None = None
    title: str | None = None
    role: UserRoleInput | None = None
    suspended: bool | None = None
    list_tags: list[str] | None = None
    custom_properties: list[UserUpdateRequestCustomProperty] | None = None


@dataclass
class UserUpdateRequest:
    user: UserUpdateRequestUser


@dataclass
class ViewBlock:
    type: str
    text: str | None = None
    name: str | None = None
    label: str | None = None
    initial_date: str | None = None


@dataclass
class ViewBlockCheckbox:
    type: str  # literal "checkbox"
    name: str
    label: str
    options: list[ViewBlockCheckboxOption] | None = None
    required: bool | None = None
    hint: str | None = None


@dataclass
class ViewBlockCheckboxOption:
    text: str
    value: str
    description: str | None = None
    checked: bool | None = None


@dataclass
class ViewBlockDate:
    type: str  # literal "date"
    name: str
    label: str
    initial_date: str | None = None
    required: bool | None = None
    hint: str | None = None


@dataclass
class ViewBlockDivider:
    type: str  # literal "divider"


@dataclass
class ViewBlockFileInput:
    type: str  # literal "file_input"
    name: str
    label: str
    filetypes: list[str] | None = None
    max_files: int | None = 10
    required: bool | None = None
    hint: str | None = None


@dataclass
class ViewBlockHeader:
    type: str  # literal "header"
    text: str


@dataclass
class ViewBlockInput:
    type: str  # literal "input"
    name: str
    label: str
    placeholder: str | None = None
    multiline: bool | None = None
    initial_value: str | None = None
    min_length: int | None = None
    max_length: int | None = None
    required: bool | None = None
    hint: str | None = None


@dataclass
class ViewBlockMarkdown:
    type: str  # literal "markdown"
    text: str


@dataclass
class ViewBlockPlainText:
    type: str  # literal "plain_text"
    text: str


@dataclass
class ViewBlockRadio:
    type: str  # literal "radio"
    name: str
    label: str
    options: list[ViewBlockSelectableOption] | None = None
    required: bool | None = None
    hint: str | None = None


@dataclass
class ViewBlockSelect:
    type: str  # literal "select"
    name: str
    label: str
    options: list[ViewBlockSelectableOption] | None = None
    required: bool | None = None
    hint: str | None = None


@dataclass
class ViewBlockSelectableOption:
    text: str
    value: str
    description: str | None = None
    selected: bool | None = None


@dataclass
class ViewBlockTime:
    type: str  # literal "time"
    name: str
    label: str
    initial_time: str | None = None
    required: bool | None = None
    hint: str | None = None


@dataclass
class ViewSubmitWebhookPayload:
    type: str  # literal "view"
    event: str  # literal "submit"
    user_id: int
    data: dict[str, str]
    webhook_timestamp: int
    callback_id: str | None = None
    private_metadata: str | None = None


@dataclass
class WebhookEvent:
    id: str
    event_type: str
    payload: WebhookPayloadUnion
    created_at: str


@dataclass
class WebhookLink:
    url: str
    domain: str


@dataclass
class WebhookMessageThread:
    message_id: int
    message_chat_id: int


AuditEventDetailsUnion = Union[AuditDetailsEmpty, AuditDetailsUserUpdated, AuditDetailsRoleChanged, AuditDetailsTagName, AuditDetailsInitiator, AuditDetailsInviter, AuditDetailsChatRenamed, AuditDetailsChatPermission, AuditDetailsTagChat, AuditDetailsChatId, AuditDetailsTokenScopes, AuditDetailsKms, AuditDetailsDlp, AuditDetailsSearch]


ViewBlockUnion = Union[ViewBlockHeader, ViewBlockPlainText, ViewBlockMarkdown, ViewBlockDivider, ViewBlockInput, ViewBlockSelect, ViewBlockRadio, ViewBlockCheckbox, ViewBlockDate, ViewBlockTime, ViewBlockFileInput]


WebhookPayloadUnion = Union[MessageWebhookPayload, ReactionWebhookPayload, ButtonWebhookPayload, ViewSubmitWebhookPayload, ChatMemberWebhookPayload, CompanyMemberWebhookPayload, LinkSharedWebhookPayload]


@dataclass
class GetAuditEventsParams:
    start_time: str | None = None
    end_time: str | None = None
    event_key: AuditEventKey | None = None
    actor_id: str | None = None
    actor_type: str | None = None
    entity_id: str | None = None
    entity_type: str | None = None
    limit: int | None = None
    cursor: str | None = None


@dataclass
class ListChatsParams:
    sort_id: SortOrder | None = None
    availability: ChatAvailability | None = None
    last_message_at_after: str | None = None
    last_message_at_before: str | None = None
    personal: bool | None = None
    limit: int | None = None
    cursor: str | None = None


@dataclass
class ListMembersParams:
    role: ChatMemberRoleFilter | None = None
    limit: int | None = None
    cursor: str | None = None


@dataclass
class ListPropertiesParams:
    entity_type: SearchEntityType


@dataclass
class ListTagsParams:
    names: TagNamesFilter | None = None
    limit: int | None = None
    cursor: str | None = None


@dataclass
class GetTagUsersParams:
    limit: int | None = None
    cursor: str | None = None


@dataclass
class ListChatMessagesParams:
    chat_id: int
    sort_id: SortOrder | None = None
    limit: int | None = None
    cursor: str | None = None


@dataclass
class RemoveReactionParams:
    code: str
    name: str | None = None


@dataclass
class ListReactionsParams:
    limit: int | None = None
    cursor: str | None = None


@dataclass
class ListReadMembersParams:
    limit: int | None = None
    cursor: str | None = None


@dataclass
class SearchChatsParams:
    query: str | None = None
    limit: int | None = None
    cursor: str | None = None
    order: SortOrder | None = None
    created_from: str | None = None
    created_to: str | None = None
    active: bool | None = None
    chat_subtype: ChatSubtype | None = None
    personal: bool | None = None


@dataclass
class SearchMessagesParams:
    query: str | None = None
    limit: int | None = None
    cursor: str | None = None
    order: SortOrder | None = None
    created_from: str | None = None
    created_to: str | None = None
    chat_ids: list[int] | None = None
    user_ids: list[int] | None = None
    active: bool | None = None


@dataclass
class SearchUsersParams:
    query: str | None = None
    limit: int | None = None
    cursor: str | None = None
    sort: SearchSortOrder | None = None
    order: SortOrder | None = None
    created_from: str | None = None
    created_to: str | None = None
    company_roles: list[UserRole] | None = None


@dataclass
class ListTasksParams:
    limit: int | None = None
    cursor: str | None = None


@dataclass
class ListUsersParams:
    query: str | None = None
    limit: int | None = None
    cursor: str | None = None


@dataclass
class GetWebhookEventsParams:
    limit: int | None = None
    cursor: str | None = None


@dataclass
class GetAuditEventsResponse:
    data: list[AuditEvent]
    meta: PaginationMeta | None = None


@dataclass
class ListChatsResponse:
    data: list[Chat]
    meta: PaginationMeta | None = None


@dataclass
class ListMembersResponse:
    data: list[User]
    meta: PaginationMeta | None = None


@dataclass
class ListPropertiesResponse:
    data: list[CustomPropertyDefinition]


@dataclass
class ListTagsResponse:
    data: list[GroupTag]
    meta: PaginationMeta | None = None


@dataclass
class GetTagUsersResponse:
    data: list[User]
    meta: PaginationMeta | None = None


@dataclass
class ListChatMessagesResponse:
    data: list[Message]
    meta: PaginationMeta | None = None


@dataclass
class ListReactionsResponse:
    data: list[Reaction]
    meta: PaginationMeta | None = None


@dataclass
class SearchChatsResponse:
    data: list[Chat]
    meta: SearchPaginationMeta


@dataclass
class SearchMessagesResponse:
    data: list[Message]
    meta: SearchPaginationMeta


@dataclass
class SearchUsersResponse:
    data: list[User]
    meta: SearchPaginationMeta


@dataclass
class ListTasksResponse:
    data: list[Task]
    meta: PaginationMeta | None = None


@dataclass
class ListUsersResponse:
    data: list[User]
    meta: PaginationMeta | None = None


@dataclass
class GetWebhookEventsResponse:
    data: list[WebhookEvent]
    meta: PaginationMeta | None = None
