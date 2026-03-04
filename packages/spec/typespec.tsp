import "@typespec/http";
import "@typespec/rest";
import "@typespec/openapi3";
import "@typespec/openapi";

using TypeSpec.Http;
using TypeSpec.Rest;
using OpenAPI;

@service(#{
  title: "Pachca API",
})
@info(#{
  version: "1.0.1",
})
@server("https://api.pachca.com/api/shared/v1", "Production server")
@useAuth(BearerAuth)
namespace PachcaAPI;

// ============================================================================
// Common Types
// ============================================================================

/** Массив названий тегов */
@example(#["Design", "iOS"])
model TagNamesFilter is string[];

// ============================================================================
// Enums
// ============================================================================

@doc("Тип данных дополнительного поля")
@extension("x-enum-descriptions", #{
  string: "Строковое значение",
  number: "Числовое значение",
  date: "Дата",
  link: "Ссылка",
})
enum CustomPropertyDataType {
  @doc("Строковое значение")
  string: "string",
  
  @doc("Числовое значение")
  number: "number",
  
  @doc("Дата")
  date: "date",
  
  @doc("Ссылка")
  link: "link",
}

@doc("Тип файла")
@extension("x-enum-descriptions", #{
  file: "Обычный файл",
  image: "Изображение",
})
enum FileType {
  @doc("Обычный файл")
  file: "file",
  
  @doc("Изображение")
  image: "image",
}

@doc("Роль пользователя в системе")
@extension("x-enum-descriptions", #{
  admin: "Администратор",
  user: "Сотрудник",
  multi_guest: "Мульти-гость",
  guest: "Гость",
})
enum UserRole {
  @doc("Администратор")
  admin: "admin",

  @doc("Сотрудник")
  user: "user",

  @doc("Мульти-гость")
  multi_guest: "multi_guest",

  @doc("Гость")
  guest: "guest",
}

@doc("Статус приглашения пользователя")
@extension("x-enum-descriptions", #{
  confirmed: "Принято",
  sent: "Отправлено",
})
enum InviteStatus {
  @doc("Принято")
  confirmed: "confirmed",
  
  @doc("Отправлено")
  sent: "sent",
}

@doc("Тип сущности для сообщений")
@extension("x-enum-descriptions", #{
  discussion: "Беседа или канал",
  thread: "Тред",
  user: "Пользователь",
})
enum MessageEntityType {
  @doc("Беседа или канал")
  discussion: "discussion",
  
  @doc("Тред")
  thread: "thread",
  
  @doc("Пользователь")
  user: "user",
}

@doc("Роль участника чата")
@extension("x-enum-descriptions", #{
  admin: "Админ",
  editor: "Редактор (доступно только для каналов)",
  member: "Участник или подписчик",
})
enum ChatMemberRole {
  @doc("Админ")
  admin: "admin",
  
  @doc("Редактор (доступно только для каналов)")
  editor: "editor",
  
  @doc("Участник или подписчик")
  member: "member",
}

@doc("Роль участника чата (с фильтром все)")
@extension("x-enum-descriptions", #{
  all: "Любая роль",
  owner: "Создатель",
  admin: "Админ",
  editor: "Редактор",
  member: "Участник/подписчик",
})
enum ChatMemberRoleFilter {
  @doc("Любая роль")
  all: "all",
  
  @doc("Создатель")
  owner: "owner",
  
  @doc("Админ")
  admin: "admin",
  
  @doc("Редактор")
  editor: "editor",
  
  @doc("Участник/подписчик")
  member: "member",
}

@doc("Тип задачи")
@extension("x-enum-descriptions", #{
  call: "Позвонить контакту",
  meeting: "Встреча",
  reminder: "Простое напоминание",
  event: "Событие",
  email: "Написать письмо",
})
enum TaskKind {
  @doc("Позвонить контакту")
  call: "call",
  
  @doc("Встреча")
  meeting: "meeting",
  
  @doc("Простое напоминание")
  reminder: "reminder",
  
  @doc("Событие")
  event: "event",
  
  @doc("Написать письмо")
  email: "email",
}

@doc("Статус напоминания")
@extension("x-enum-descriptions", #{
  done: "Выполнено",
  undone: "Активно",
})
enum TaskStatus {
  @doc("Выполнено")
  done: "done",

  @doc("Активно")
  undone: "undone",
}

@doc("Порядок сортировки")
@extension("x-enum-descriptions", #{
  asc: "По возрастанию",
  desc: "По убыванию",
})
enum SortOrder {
  @doc("По возрастанию")
  asc: "asc",
  
  @doc("По убыванию")
  desc: "desc",
}

@doc("Сортировка результатов поиска")
@extension("x-enum-descriptions", #{
  by_score: "По релевантности",
  alphabetical: "По алфавиту",
})
enum SearchSortOrder {
  @doc("По релевантности")
  by_score: "by_score",

  @doc("По алфавиту")
  alphabetical: "alphabetical",
}

@doc("Доступность чатов для пользователя")
@extension("x-enum-descriptions", #{
  is_member: "Чаты, где пользователь является участником",
  public: "Все открытые чаты компании, вне зависимости от участия в них пользователя",
})
enum ChatAvailability {
  @doc("Чаты, где пользователь является участником")
  is_member: "is_member",
  
  @doc("Все открытые чаты компании, вне зависимости от участия в них пользователя")
  public: "public",
}

@doc("Тип события webhook")
@extension("x-enum-descriptions", #{
  new: "Создание",
  update: "Обновление",
  delete: "Удаление",
})
enum WebhookEventType {
  @doc("Создание")
  new: "new",
  
  @doc("Обновление")
  update: "update",
  
  @doc("Удаление")
  delete: "delete",
}

@doc("Тип события webhook для реакций")
@extension("x-enum-descriptions", #{
  new: "Создание",
  delete: "Удаление",
})
enum ReactionEventType {
  @doc("Создание")
  new: "new",
  
  @doc("Удаление")
  delete: "delete",
}

@doc("Тип события webhook для участников")
@extension("x-enum-descriptions", #{
  add: "Добавление",
  remove: "Удаление",
})
enum MemberEventType {
  @doc("Добавление")
  add: "add",
  
  @doc("Удаление")
  remove: "remove",
}

@doc("Тип события webhook для пользователей")
@extension("x-enum-descriptions", #{
  invite: "Приглашение",
  confirm: "Подтверждение",
  update: "Обновление",
  suspend: "Приостановка",
  activate: "Активация",
  delete: "Удаление",
})
enum UserEventType {
  @doc("Приглашение")
  invite: "invite",
  
  @doc("Подтверждение")
  confirm: "confirm",
  
  @doc("Обновление")
  update: "update",
  
  @doc("Приостановка")
  suspend: "suspend",
  
  @doc("Активация")
  activate: "activate",
  
  @doc("Удаление")
  delete: "delete",
}

@doc("Тип сущности для поиска")
@extension("x-enum-descriptions", #{
  User: "Пользователь",
  Task: "Задача",
})
enum SearchEntityType {
  @doc("Пользователь")
  User: "User",
  
  @doc("Задача")
  Task: "Task",
}

@doc("Тип чата")
@extension("x-enum-descriptions", #{
  discussion: "Канал или беседа",
  thread: "Тред",
})
enum ChatSubtype {
  @doc("Канал или беседа")
  discussion: "discussion",

  @doc("Тред")
  thread: "thread",
}

@doc("Коды ошибок валидации")
@extension("x-enum-descriptions", #{
  blank: "Обязательное поле (не может быть пустым)",
  too_long: "Слишком длинное значение (пояснения вы получите в поле message)",
  invalid: "Поле не соответствует правилам (пояснения вы получите в поле message)",
  inclusion: "Поле имеет непредусмотренное значение",
  exclusion: "Поле имеет недопустимое значение",
  taken: "Название для этого поля уже существует",
  wrong_emoji: "Emoji статуса не может содержать значения отличные от Emoji символа",
  not_found: "Объект не найден",
  already_exists: "Объект уже существует (пояснения вы получите в поле message)",
  personal_chat: "Ошибка личного чата (пояснения вы получите в поле message)",
  displayed_error: "Отображаемая ошибка (пояснения вы получите в поле message)",
  not_authorized: "Действие запрещено",
  invalid_date_range: "Выбран слишком большой диапазон дат",
  invalid_webhook_url: "Некорректный URL вебхука",
  rate_limit: "Достигнут лимит запросов",
  licenses_limit: "Превышен лимит активных сотрудников (пояснения вы получите в поле message)",
  user_limit: "Превышен лимит количества реакций, которые может добавить пользователь (20 уникальных реакций)",
  unique_limit: "Превышен лимит количества уникальных реакций, которые можно добавить на сообщение (30 уникальных реакций)",
  general_limit: "Превышен лимит количества реакций, которые можно добавить на сообщение (1000 реакций)",
  unhandled: "Ошибка выполнения запроса (пояснения вы получите в поле message)",
  trigger_not_found: "Не удалось найти идентификатор события",
  trigger_expired: "Время жизни идентификатора события истекло",
  required: "Обязательный параметр не передан",
  in: "Недопустимое значение (не входит в список допустимых)",
  not_applicable: "Значение неприменимо в данном контексте (пояснения вы получите в поле message)",
  self_update: "Нельзя изменить свои собственные данные",
  owner_protected: "Нельзя изменить данные владельца",
  already_assigned: "Значение уже назначено",
  forbidden: "Недостаточно прав для выполнения действия (пояснения вы получите в поле message)",
  permission_denied: "Доступ запрещён (недостаточно прав)",
  access_denied: "Доступ запрещён",
  wrong_params: "Некорректные параметры запроса (пояснения вы получите в поле message)",
  payment_required: "Требуется оплата",
  min_length: "Значение слишком короткое (пояснения вы получите в поле message)",
  max_length: "Значение слишком длинное (пояснения вы получите в поле message)",
})
enum ValidationErrorCode {
  @doc("Обязательное поле (не может быть пустым)")
  blank: "blank",
  
  @doc("Слишком длинное значение (пояснения вы получите в поле message)")
  too_long: "too_long",
  
  @doc("Поле не соответствует правилам (пояснения вы получите в поле message)")
  invalid: "invalid",
  
  @doc("Поле имеет непредусмотренное значение")
  inclusion: "inclusion",
  
  @doc("Поле имеет недопустимое значение")
  exclusion: "exclusion",
  
  @doc("Название для этого поля уже существует")
  taken: "taken",
  
  @doc("Emoji статуса не может содержать значения отличные от Emoji символа")
  wrong_emoji: "wrong_emoji",
  
  @doc("Объект не найден")
  not_found: "not_found",
  
  @doc("Объект уже существует (пояснения вы получите в поле message)")
  already_exists: "already_exists",
  
  @doc("Ошибка личного чата (пояснения вы получите в поле message)")
  personal_chat: "personal_chat",
  
  @doc("Отображаемая ошибка (пояснения вы получите в поле message)")
  displayed_error: "displayed_error",
  
  @doc("Действие запрещено")
  not_authorized: "not_authorized",
  
  @doc("Выбран слишком большой диапазон дат")
  invalid_date_range: "invalid_date_range",
  
  @doc("Некорректный URL вебхука")
  invalid_webhook_url: "invalid_webhook_url",
  
  @doc("Достигнут лимит запросов")
  rate_limit: "rate_limit",
  
  @doc("Превышен лимит активных сотрудников (пояснения вы получите в поле message)")
  licenses_limit: "licenses_limit",
  
  @doc("Превышен лимит количества реакций, которые может добавить пользователь (20 уникальных реакций)")
  user_limit: "user_limit",
  
  @doc("Превышен лимит количества уникальных реакций, которые можно добавить на сообщение (30 уникальных реакций)")
  unique_limit: "unique_limit",
  
  @doc("Превышен лимит количества реакций, которые можно добавить на сообщение (1000 реакций)")
  general_limit: "general_limit",
  
  @doc("Ошибка выполнения запроса (пояснения вы получите в поле message)")
  unhandled: "unhandled",
  
  @doc("Не удалось найти идентификатор события")
  trigger_not_found: "trigger_not_found",
  
  @doc("Время жизни идентификатора события истекло")
  trigger_expired: "trigger_expired",

  @doc("Обязательный параметр не передан")
  required: "required",

  @doc("Недопустимое значение (не входит в список допустимых)")
  in: "in",

  @doc("Значение неприменимо в данном контексте (пояснения вы получите в поле message)")
  not_applicable: "not_applicable",

  @doc("Нельзя изменить свои собственные данные")
  self_update: "self_update",

  @doc("Нельзя изменить данные владельца")
  owner_protected: "owner_protected",

  @doc("Значение уже назначено")
  already_assigned: "already_assigned",

  @doc("Недостаточно прав для выполнения действия (пояснения вы получите в поле message)")
  forbidden: "forbidden",

  @doc("Доступ запрещён (недостаточно прав)")
  permission_denied: "permission_denied",

  @doc("Доступ запрещён")
  access_denied: "access_denied",

  @doc("Некорректные параметры запроса (пояснения вы получите в поле message)")
  wrong_params: "wrong_params",

  @doc("Требуется оплата")
  payment_required: "payment_required",

  @doc("Значение слишком короткое (пояснения вы получите в поле message)")
  min_length: "min_length",

  @doc("Значение слишком длинное (пояснения вы получите в поле message)")
  max_length: "max_length",
}

@doc("Тип аудит-события")
@extension("x-enum-descriptions", #{
  user_login: "Пользователь успешно вошел в систему",
  user_logout: "Пользователь вышел из системы",
  user_2fa_fail: "Неудачная попытка двухфакторной аутентификации",
  user_2fa_success: "Успешная двухфакторная аутентификация",
  user_created: "Создана новая учетная запись пользователя",
  user_deleted: "Учетная запись пользователя удалена",
  user_role_changed: "Роль пользователя была изменена",
  user_updated: "Данные пользователя обновлены",
  tag_created: "Создан новый тег",
  tag_deleted: "Тег удален",
  user_added_to_tag: "Пользователь добавлен в тег",
  user_removed_from_tag: "Пользователь удален из тега",
  chat_created: "Создан новый чат",
  chat_renamed: "Чат переименован",
  chat_permission_changed: "Изменены права доступа к чату",
  user_chat_join: "Пользователь присоединился к чату",
  user_chat_leave: "Пользователь покинул чат",
  tag_added_to_chat: "Тег добавлен в чат",
  tag_removed_from_chat: "Тег удален из чата",
  message_updated: "Сообщение отредактировано",
  message_deleted: "Сообщение удалено",
  message_created: "Сообщение создано",
  reaction_created: "Реакция добавлена",
  reaction_deleted: "Реакция удалена",
  thread_created: "Тред создан",
  access_token_created: "Создан новый токен доступа",
  access_token_updated: "Токен доступа обновлен",
  access_token_destroy: "Токен доступа удален",
  kms_encrypt: "Данные зашифрованы",
  kms_decrypt: "Данные расшифрованы",
  audit_events_accessed: "Доступ к журналам аудита получен",
  dlp_violation_detected: "Срабатывание правила DLP-системы",
  search_users_api: "Поиск сотрудников через API",
  search_chats_api: "Поиск чатов через API",
  search_messages_api: "Поиск сообщений через API",
})
enum AuditEventKey {
  @doc("Пользователь успешно вошел в систему")
  user_login: "user_login",

  @doc("Пользователь вышел из системы")
  user_logout: "user_logout",

  @doc("Неудачная попытка двухфакторной аутентификации")
  user_2fa_fail: "user_2fa_fail",

  @doc("Успешная двухфакторная аутентификация")
  user_2fa_success: "user_2fa_success",

  @doc("Создана новая учетная запись пользователя")
  user_created: "user_created",

  @doc("Учетная запись пользователя удалена")
  user_deleted: "user_deleted",

  @doc("Роль пользователя была изменена")
  user_role_changed: "user_role_changed",

  @doc("Данные пользователя обновлены")
  user_updated: "user_updated",

  @doc("Создан новый тег")
  tag_created: "tag_created",

  @doc("Тег удален")
  tag_deleted: "tag_deleted",

  @doc("Пользователь добавлен в тег")
  user_added_to_tag: "user_added_to_tag",

  @doc("Пользователь удален из тега")
  user_removed_from_tag: "user_removed_from_tag",

  @doc("Создан новый чат")
  chat_created: "chat_created",

  @doc("Чат переименован")
  chat_renamed: "chat_renamed",

  @doc("Изменены права доступа к чату")
  chat_permission_changed: "chat_permission_changed",

  @doc("Пользователь присоединился к чату")
  user_chat_join: "user_chat_join",

  @doc("Пользователь покинул чат")
  user_chat_leave: "user_chat_leave",

  @doc("Тег добавлен в чат")
  tag_added_to_chat: "tag_added_to_chat",

  @doc("Тег удален из чата")
  tag_removed_from_chat: "tag_removed_from_chat",

  @doc("Сообщение отредактировано")
  message_updated: "message_updated",

  @doc("Сообщение удалено")
  message_deleted: "message_deleted",

  @doc("Сообщение создано")
  message_created: "message_created",

  @doc("Реакция добавлена")
  reaction_created: "reaction_created",

  @doc("Реакция удалена")
  reaction_deleted: "reaction_deleted",

  @doc("Тред создан")
  thread_created: "thread_created",

  @doc("Создан новый токен доступа")
  access_token_created: "access_token_created",

  @doc("Токен доступа обновлен")
  access_token_updated: "access_token_updated",

  @doc("Токен доступа удален")
  access_token_destroy: "access_token_destroy",

  @doc("Данные зашифрованы")
  kms_encrypt: "kms_encrypt",

  @doc("Данные расшифрованы")
  kms_decrypt: "kms_decrypt",

  @doc("Доступ к журналам аудита получен")
  audit_events_accessed: "audit_events_accessed",

  @doc("Срабатывание правила DLP-системы")
  dlp_violation_detected: "dlp_violation_detected",

  @doc("Поиск сотрудников через API")
  search_users_api: "search_users_api",

  @doc("Поиск чатов через API")
  search_chats_api: "search_chats_api",

  @doc("Поиск сообщений через API")
  search_messages_api: "search_messages_api",
}

// ============================================================================
// Common Models
// ============================================================================

@doc("Дополнительное поле")
model CustomProperty {
  @doc("Идентификатор поля")
  @example(1678)
  id: int32;
  
  @doc("Название поля")
  @example("Город")
  name: string;
  
  @doc("Тип поля")
  @example(CustomPropertyDataType.string)
  data_type: CustomPropertyDataType;

  @doc("Значение")
  @example("Санкт-Петербург")
  value: string;
}

@doc("Определение дополнительного поля (без значения)")
model CustomPropertyDefinition {
  @doc("Идентификатор поля")
  @example(1678)
  id: int32;

  @doc("Название поля")
  @example("Город")
  name: string;

  @doc("Тип поля")
  @example(CustomPropertyDataType.string)
  data_type: CustomPropertyDataType;
}

@doc("Статус пользователя")
model UserStatus {
  @doc("Emoji символ статуса")
  @example("🎮")
  emoji: string;

  @doc("Текст статуса")
  @example("Очень занят")
  title: string;

  @doc("Срок жизни статуса (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ")
  @example(utcDateTime.fromISO("2024-04-08T10:00:00.000Z"))
  expires_at: utcDateTime | null;

  @doc("Режим «Нет на месте»")
  @example(false)
  is_away: boolean;

  @doc("Сообщение при режиме «Нет на месте». Отображается в профиле пользователя, а также при отправке ему личного сообщения или упоминании в чате.")
  away_message: {
    @doc("Текст сообщения")
    @example("Я в отпуске до 15 апреля. По срочным вопросам обращайтесь к @ivanov.")
    text: string;
  } | null;
}

@doc("Файл")
model File {
  @doc("Идентификатор файла")
  @example(3560)
  id: int32;
  
  @doc("Путь к файлу")
  @example("attaches/files/12/21zu7934-02e1-44d9-8df2-0f970c259796/congrat.png")
  key: string;
  
  @doc("Название файла с расширением")
  @example("congrat.png")
  name: string;
  
  @doc("Тип файла")
  @example(FileType.image)
  file_type: FileType;
  
  @doc("Прямая ссылка на скачивание файла")
  @example("https://pachca-prod-uploads.s3.storage.selcloud.ru/attaches/files/12/21zu7934-02e1-44d9-8df2-0f970c259796/congrat.png?response-cache-control=max-age%3D3600%3B&response-content-disposition=attachment&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=142155_staply%2F20231107%2Fru-1a%2Fs3%2Faws4_request&X-Amz-Date=20231107T160412&X-Amz-Expires=604800&X-Amz-SignedHeaders=host&X-Amz-Signature=98765asgfadsfdSaDSd4sdfg35asdf67sadf8")
  url: string;
  
  @doc("Ширина изображения в пикселях")
  @example(1920)
  width?: int32 | null;
  
  @doc("Высота изображения в пикселях")
  @example(1080)
  height?: int32 | null;
}

@doc("Кнопка")
model Button {
  @doc("Текст, отображаемый на кнопке")
  @example("Подробнее")
  @maxLength(255)
  text: string;

  @doc("Ссылка, которая будет открыта по нажатию кнопки")
  @example("https://example.com/details")
  url?: string;

  @doc("Данные, которые будут отправлены в исходном вебхуке по нажатию кнопки")
  @example("awesome")
  @maxLength(255)
  data?: string;
}

@doc("Тред")
model Thread {
  @doc("Идентификатор созданного треда (используется для отправки [новых комментариев](POST /messages) в тред)")
  @example(265142)
  id: int64;
  
  @doc("Идентификатор чата треда (используется для отправки [новых комментариев](POST /messages) в тред и получения [списка комментариев](GET /messages))")
  @example(2637266155)
  chat_id: int64;
  
  @doc("Идентификатор сообщения, к которому был создан тред")
  @example(154332686)
  message_id: int64;
  
  @doc("Идентификатор чата сообщения")
  @example(2637266154)
  message_chat_id: int64;
  
  @doc("Дата и время обновления треда (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ")
  @example(utcDateTime.fromISO("2023-02-01T19:20:47.204Z"))
  updated_at: utcDateTime;
}

@doc("Информация о пересланном сообщении")
model Forwarding {
  @doc("Идентификатор оригинального сообщения")
  @example(194275)
  original_message_id: int32;

  @doc("Идентификатор чата, в котором находится оригинальное сообщение")
  @example(334)
  original_chat_id: int32;

  @doc("Идентификатор пользователя, создавшего оригинальное сообщение")
  @example(12)
  author_id: int32;

  @doc("Дата и время создания оригинального сообщения (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ")
  @example(utcDateTime.fromISO("2025-01-15T10:30:00.000Z"))
  original_created_at: utcDateTime;

  @doc("Идентификатор треда, в котором находится оригинальное сообщение")
  @example(null)
  original_thread_id: int32 | null;

  @doc("Идентификатор сообщения, к которому был создан тред, в котором находится оригинальное сообщение")
  @example(null)
  original_thread_message_id: int32 | null;

  @doc("Идентификатор чата сообщения, к которому был создан тред, в котором находится оригинальное сообщение")
  @example(null)
  original_thread_parent_chat_id: int32 | null;
}

// ============================================================================
// Core Entity Models
// ============================================================================

@doc("Сотрудник")
model User {
  @doc("Идентификатор пользователя")
  @example(12)
  id: int32;
  
  @doc("Имя")
  @example("Олег")
  first_name: string;
  
  @doc("Фамилия")
  @example("Петров")
  last_name: string;
  
  @doc("Имя пользователя")
  @example("")
  nickname: string;
  
  @doc("Электронная почта")
  @example("olegp@example.com")
  email: string;
  
  @doc("Телефон")
  @example("")
  phone_number: string;
  
  @doc("Департамент")
  @example("Продукт")
  department: string;
  
  @doc("Должность")
  @example("CIO")
  title: string;
  
  @doc("Уровень доступа")
  @example(UserRole.admin)
  role: UserRole;
  
  @doc("Деактивация пользователя")
  @example(false)
  suspended: boolean;
  
  @doc("Статус приглашения")
  @example(InviteStatus.confirmed)
  invite_status: InviteStatus;
  
  @doc("Массив тегов, привязанных к сотруднику")
  @example(#["Product", "Design"])
  list_tags: string[];
  
  @doc("Дополнительные поля сотрудника")
  custom_properties: CustomProperty[];
  
  @doc("Статус")
  user_status: UserStatus | null;
  
  @doc("Является ботом")
  @example(false)
  bot: boolean;
  
  @doc("Использует ли пользователь SSO")
  @example(false)
  sso: boolean;
  
  @doc("Дата создания (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ")
  @example(utcDateTime.fromISO("2020-06-08T09:32:57.000Z"))
  created_at: utcDateTime;
  
  @doc("Дата последней активности пользователя (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ")
  @example(utcDateTime.fromISO("2025-01-20T13:40:07.000Z"))
  last_activity_at: utcDateTime;
  
  @doc("Часовой пояс пользователя")
  @example("Europe/Moscow")
  time_zone: string;
  
  @doc("Ссылка на скачивание аватарки пользователя")
  @example("https://app.pachca.com/users/12/photo.jpg")
  image_url: string | null;
}

@doc("Чат")
model Chat {
  @doc("Идентификатор созданного чата")
  @example(334)
  id: int32;
  
  @doc("Название")
  @example("🤿 aqua")
  name: string;
  
  @doc("Дата и время создания чата (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ")
  @example(utcDateTime.fromISO("2021-08-28T15:56:53.000Z"))
  created_at: utcDateTime;
  
  @doc("Идентификатор пользователя, создавшего чат")
  @example(185)
  owner_id: int32;
  
  @doc("Массив идентификаторов пользователей, участников")
  @example(#[185, 186, 187])
  member_ids: int32[];
  
  @doc("Массив идентификаторов тегов, участников")
  @example(#[9111])
  group_tag_ids: int32[];
  
  @doc("Является каналом")
  @example(true)
  channel: boolean;

  @doc("Является личным чатом")
  @example(false)
  personal: boolean;

  @doc("Открытый доступ")
  @example(false)
  public: boolean;
  
  @doc("Дата и время создания последнего сообщения в чате (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ")
  @example(utcDateTime.fromISO("2021-08-28T15:56:53.000Z"))
  last_message_at: utcDateTime;
  
  @doc("Ссылка на Видеочат")
  @example("https://meet.pachca.com/aqua-94bb21b5")
  meet_room_url: string;
}

@doc("Сообщение")
model Message {
  @doc("Идентификатор сообщения")
  @example(194275)
  id: int32;

  @doc("Тип сущности, к которой относится сообщение")
  @example(MessageEntityType.discussion)
  entity_type: MessageEntityType;
  
  @doc("Идентификатор сущности, к которой относится сообщение (беседы/канала, треда или пользователя)")
  @example(334)
  entity_id: int32;
  
  @doc("Идентификатор чата, в котором находится сообщение")
  @example(334)
  chat_id: int32;

  @doc("Идентификатор корневого чата. Для сообщений в тредах — идентификатор чата, в котором был создан тред. Для обычных сообщений совпадает с `chat_id`.")
  @example(334)
  root_chat_id: int32;

  @doc("Текст сообщения")
  @example("Вчера мы продали 756 футболок (что на 10% больше, чем в прошлое воскресенье)")
  content: string;
  
  @doc("Идентификатор пользователя, создавшего сообщение")
  @example(12)
  user_id: int32;
  
  @doc("Дата и время создания сообщения (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ")
  @example(utcDateTime.fromISO("2021-08-28T15:57:23.000Z"))
  created_at: utcDateTime;
  
  @doc("Прямая ссылка на сообщение")
  @example("https://app.pachca.com/chats/334?message=194275")
  url: string;
  
  @doc("Прикрепленные файлы")
  files: File[];
  
  @doc("Массив строк, каждая из которых представлена массивом кнопок")
  buttons: Button[][] | null;
  
  @doc("Тред сообщения")
  thread: Thread | null;
  
  @doc("Информация о пересланном сообщении")
  forwarding: Forwarding | null;
  
  @doc("Идентификатор сообщения, к которому написан ответ")
  @example(null)
  parent_message_id: int32 | null;

  @doc("Ссылка на аватарку отправителя сообщения")
  @example(null)
  display_avatar_url: string | null;

  @doc("Полное имя отправителя сообщения")
  @example(null)
  display_name: string | null;

  @doc("Дата и время последнего редактирования сообщения (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ")
  @example(utcDateTime.fromISO("2021-08-28T16:10:00.000Z"))
  changed_at: utcDateTime | null;

  @doc("Дата и время удаления сообщения (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ")
  @example(null)
  deleted_at: utcDateTime | null;
}

@doc("Тег")
model GroupTag {
  @doc("Идентификатор тега")
  @example(9111)
  id: int32;
  
  @doc("Название тега")
  @example("Design")
  name: string;
  
  @doc("Количество сотрудников, которые имеют этот тег")
  @example(6)
  users_count: int32;
}

@doc("Реакция на сообщение")
model Reaction {
  @doc("Идентификатор пользователя, который добавил реакцию")
  @example(12)
  user_id: int32;
  
  @doc("Дата и время добавления реакции (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ")
  @example(utcDateTime.fromISO("2024-01-20T10:30:00.000Z"))
  created_at: utcDateTime;
  
  @doc("Emoji символ реакции")
  @example("👍")
  code: string;
  
  @doc("Название emoji реакции")
  @example(":+1::skin-tone-1:")
  name?: string;
}

@doc("Напоминание")
model Task {
  @doc("Идентификатор напоминания")
  @example(22283)
  id: int32;

  @doc("Тип")
  @example(TaskKind.reminder)
  kind: TaskKind;

  @doc("Описание")
  @example("Забрать со склада 21 заказ")
  content: string;

  @doc("Срок выполнения напоминания (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ")
  @example(utcDateTime.fromISO("2020-06-05T09:00:00.000Z"))
  due_at: utcDateTime | null;

  @doc("Приоритет")
  @example(2)
  priority: int32;

  @doc("Идентификатор пользователя-создателя напоминания")
  @example(12)
  user_id: int32;

  @doc("Идентификатор чата, к которому привязано напоминание")
  @example(334)
  chat_id: int32 | null;

  @doc("Статус напоминания")
  @example(TaskStatus.undone)
  status: TaskStatus;

  @doc("Дата и время создания напоминания (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ")
  @example(utcDateTime.fromISO("2020-06-04T10:37:57.000Z"))
  created_at: utcDateTime;

  @doc("Массив идентификаторов пользователей, привязанных к напоминанию как «ответственные»")
  @example(#[12])
  performer_ids: int32[];

  @doc("Напоминание на весь день (без указания времени)")
  @example(false)
  all_day: boolean;

  @doc("Дополнительные поля напоминания")
  custom_properties: CustomProperty[];
}

// ============================================================================
// Request/Response Models
// ============================================================================

@doc("Метаданные пагинации")
model PaginationMeta {
  @doc("Вспомогательная информация")
  paginate?: {
    @doc("Курсор пагинации следующей страницы")
    @example("eyJxZCO2MiwiZGlyIjomSNYjIn3")
    next_page?: string;
  };
}

@doc("Мета-информация для пагинации поисковых результатов")
model SearchPaginationMeta {
  @doc("Общее количество найденных результатов")
  @example(42)
  total: int32;

  @doc("Вспомогательная информация")
  paginate: {
    @doc("Курсор пагинации следующей страницы")
    @example("eyJxZCO2MiwiZGlyIjomSNYjIn3")
    next_page: string;
  };
}

@doc("Обертка ответа поисковых результатов с данными и пагинацией")
model SearchPaginatedDataResponse<T> {
  data: T;
  meta: SearchPaginationMeta;
}

@doc("Обертка ответа с данными")
model DataResponse<T> {
  data: T;
}

@doc("Обертка ответа с данными и пагинацией")
model PaginatedDataResponse<T> {
  data: T;
  meta?: PaginationMeta;
}


// ============================================================================
// OAuth Models
// ============================================================================

@doc("Скоуп доступа OAuth токена")
@extension("x-enum-descriptions", #{
  chats_read: "Просмотр чатов и списка чатов",
  chats_create: "Создание новых чатов",
  chats_update: "Изменение настроек чата",
  chats_archive: "Архивация и разархивация чатов",
  chats_leave: "Выход из чатов",
  chat_members_read: "Просмотр участников чата",
  chat_members_write: "Добавление, изменение и удаление участников чата",
  chat_exports_read: "Скачивание экспортов чата",
  chat_exports_write: "Создание экспортов чата",
  messages_read: "Просмотр сообщений в чатах",
  messages_create: "Отправка сообщений",
  messages_update: "Редактирование сообщений",
  messages_delete: "Удаление сообщений",
  reactions_read: "Просмотр реакций на сообщения",
  reactions_write: "Добавление и удаление реакций",
  pins_write: "Закрепление и открепление сообщений",
  threads_read: "Просмотр тредов (комментариев)",
  threads_create: "Создание тредов (комментариев)",
  link_previews_write: "Unfurl (разворачивание ссылок)",
  views_write: "Открытие форм (представлений)",
  users_read: "Просмотр информации о сотрудниках и списка сотрудников",
  users_create: "Создание новых сотрудников",
  users_update: "Редактирование данных сотрудника",
  users_delete: "Удаление сотрудников",
  group_tags_read: "Просмотр тегов",
  group_tags_write: "Создание, редактирование и удаление тегов",
  bots_write: "Изменение настроек бота",
  profile_read: "Просмотр информации о своем профиле",
  profile_status_read: "Просмотр статуса профиля",
  profile_status_write: "Изменение и удаление статуса профиля",
  user_status_read: "Просмотр статуса сотрудника",
  user_status_write: "Изменение и удаление статуса сотрудника",
  custom_properties_read: "Просмотр дополнительных полей",
  audit_events_read: "Просмотр журнала аудита",
  tasks_read: "Просмотр задач",
  tasks_create: "Создание задач",
  tasks_update: "Изменение задачи",
  tasks_delete: "Удаление задачи",
  files_read: "Скачивание файлов",
  files_write: "Загрузка файлов",
  uploads_write: "Получение данных для загрузки файлов",
  webhooks_read: "Просмотр вебхуков",
  webhooks_write: "Создание и управление вебхуками",
  webhooks_events_read: "Просмотр лога вебхуков",
  webhooks_events_delete: "Удаление записи в логе вебхука",
  search_users: "Поиск сотрудников",
  search_chats: "Поиск чатов",
  search_messages: "Поиск сообщений",
})
enum OAuthScope {
  @doc("Просмотр чатов и списка чатов")
  chats_read: "chats:read",

  @doc("Создание новых чатов")
  chats_create: "chats:create",

  @doc("Изменение настроек чата")
  chats_update: "chats:update",

  @doc("Архивация и разархивация чатов")
  chats_archive: "chats:archive",

  @doc("Выход из чатов")
  chats_leave: "chats:leave",

  @doc("Просмотр участников чата")
  chat_members_read: "chat_members:read",

  @doc("Добавление, изменение и удаление участников чата")
  chat_members_write: "chat_members:write",

  @doc("Скачивание экспортов чата")
  chat_exports_read: "chat_exports:read",

  @doc("Создание экспортов чата")
  chat_exports_write: "chat_exports:write",

  @doc("Просмотр сообщений в чатах")
  messages_read: "messages:read",

  @doc("Отправка сообщений")
  messages_create: "messages:create",

  @doc("Редактирование сообщений")
  messages_update: "messages:update",

  @doc("Удаление сообщений")
  messages_delete: "messages:delete",

  @doc("Просмотр реакций на сообщения")
  reactions_read: "reactions:read",

  @doc("Добавление и удаление реакций")
  reactions_write: "reactions:write",

  @doc("Закрепление и открепление сообщений")
  pins_write: "pins:write",

  @doc("Просмотр тредов (комментариев)")
  threads_read: "threads:read",

  @doc("Создание тредов (комментариев)")
  threads_create: "threads:create",

  @doc("Unfurl (разворачивание ссылок)")
  link_previews_write: "link_previews:write",

  @doc("Просмотр информации о сотрудниках и списка сотрудников")
  users_read: "users:read",

  @doc("Создание новых сотрудников")
  users_create: "users:create",

  @doc("Редактирование данных сотрудника")
  users_update: "users:update",

  @doc("Удаление сотрудников")
  users_delete: "users:delete",

  @doc("Просмотр тегов")
  group_tags_read: "group_tags:read",

  @doc("Создание, редактирование и удаление тегов")
  group_tags_write: "group_tags:write",

  @doc("Изменение настроек бота")
  bots_write: "bots:write",

  @doc("Просмотр информации о своем профиле")
  profile_read: "profile:read",

  @doc("Просмотр статуса профиля")
  profile_status_read: "profile_status:read",

  @doc("Изменение и удаление статуса профиля")
  profile_status_write: "profile_status:write",

  @doc("Просмотр статуса сотрудника")
  user_status_read: "user_status:read",

  @doc("Изменение и удаление статуса сотрудника")
  user_status_write: "user_status:write",

  @doc("Просмотр дополнительных полей")
  custom_properties_read: "custom_properties:read",

  @doc("Просмотр журнала аудита")
  audit_events_read: "audit_events:read",

  @doc("Просмотр задач")
  tasks_read: "tasks:read",

  @doc("Создание задач")
  tasks_create: "tasks:create",

  @doc("Изменение задачи")
  tasks_update: "tasks:update",

  @doc("Удаление задачи")
  tasks_delete: "tasks:delete",

  @doc("Скачивание файлов")
  files_read: "files:read",

  @doc("Загрузка файлов")
  files_write: "files:write",

  @doc("Получение данных для загрузки файлов")
  uploads_write: "uploads:write",

  @doc("Открытие форм (представлений)")
  views_write: "views:write",

  @doc("Просмотр вебхуков")
  webhooks_read: "webhooks:read",

  @doc("Создание и управление вебхуками")
  webhooks_write: "webhooks:write",

  @doc("Просмотр лога вебхуков")
  webhooks_events_read: "webhooks:events:read",

  @doc("Удаление записи в логе вебхука")
  webhooks_events_delete: "webhooks:events:delete",

  @doc("Поиск сотрудников")
  search_users: "search:users",

  @doc("Поиск чатов")
  search_chats: "search:chats",

  @doc("Поиск сообщений")
  search_messages: "search:messages",
}

@doc("Информация о текущем OAuth токене")
model AccessTokenInfo {
  @doc("Идентификатор токена")
  @example(4827)
  id: int64;

  @doc("Маскированный токен (видны первые 8 и последние 4 символа)")
  @example("cH5kR9mN...x7Qp")
  token: string;

  @doc("Пользовательское имя токена")
  @example("Мой API токен")
  name: string | null;

  @doc("Идентификатор владельца токена")
  @example(12)
  user_id: int64;

  @doc("Список скоупов токена")
  @example(#[OAuthScope.messages_read, OAuthScope.chats_read])
  scopes: OAuthScope[];

  @doc("Дата создания токена")
  @example(utcDateTime.fromISO("2025-01-15T10:30:00.000Z"))
  created_at: utcDateTime;

  @doc("Дата отзыва токена")
  @example(null)
  revoked_at: utcDateTime | null;

  @doc("Время жизни токена в секундах")
  @example(null)
  expires_in: int32 | null;

  @doc("Дата последнего использования токена")
  @example(utcDateTime.fromISO("2025-02-24T14:20:00.000Z"))
  last_used_at: utcDateTime | null;
}

// ============================================================================
// Error Models
// ============================================================================

@doc("Ошибка API (используется для 400, 403, 404, 409, 410, 422)")
model ApiError {
  @doc("Массив ошибок")
  errors: ApiErrorItem[];
}

@doc("Детальная информация об ошибке")
model ApiErrorItem {
  @doc("Ключ поля с ошибкой")
  @example("field.name")
  key: string;
  
  @doc("Значение поля, которое вызвало ошибку")
  @example("invalid_value")
  value: string | null;
  
  @doc("Сообщение об ошибке")
  @example("Поле не может быть пустым")
  message: string;
  
  @doc("Код ошибки")
  @example(ValidationErrorCode.blank)
  code: ValidationErrorCode;
  
  @doc("Дополнительные данные об ошибке")
  @example(null)
  payload: string | null;
}

@doc("Ошибка OAuth авторизации (используется для 401 и 403)")
model OAuthError {
  @doc("Код ошибки")
  @example("invalid_token")
  error: string;
  
  @doc("Описание ошибки")
  @example("Access token is missing")
  error_description: string;
}

@doc("Параметры для загрузки файла")
model UploadParams {
  @doc("Используемый заголовок (в данном запросе — attachment)")
  @example("attachment")
  @encodedName("application/json", "Content-Disposition")
  contentDisposition: string;
  
  @doc("Уровень безопасности (в данном запросе — private)")
  @example("private")
  acl: string;
  
  @doc("Уникальная policy для загрузки файла")
  @example("eyJloNBpcmF0aW9uIjoiMjAyPi0xMi0wOFQwNjo1NzozNFHusCJjb82kaXRpb25zIjpbeyJidWNrZXQiOiJwYWNoY2EtcHJhYy11cGxvYWRzOu0sWyJzdGFydHMtd3l4aCIsIiRrZXkiLCJhdHRhY8hlcy9maWxlcy1xODUyMSJdLHsiQ29udGVudC1EaXNwb3NpdGlvbiI6ImF0dGFjaG1lbnQifSx2ImFjbCI3InByaXZhdGUifSx7IngtYW16LWNyZWRlbnRpYWwi2iIxNDIxNTVfc3RhcGx4LzIwMjIxMTI0L2J1LTFhL5MzL1F2czRfcmVxdWVzdCJ9LHsieC1hbXotYWxnb3JpdGhtIjytQVdTNC1ITUFDLVNIQTI1NiJ7LHsieC1hbXotZGF0ZSI6IjIwMjIxMTI0VDA2NTczNFoifV12")
  policy: string;
  
  @doc("x-amz-credential для загрузки файла")
  @example("286471_server/20211122/kz-6x/s3/aws4_request")
  @encodedName("application/json", "x-amz-credential")
  xAmzCredential: string;
  
  @doc("Используемый алгоритм (в данном запросе — AWS4-HMAC-SHA256)")
  @example("AWS4-HMAC-SHA256")
  @encodedName("application/json", "x-amz-algorithm")
  xAmzAlgorithm: string;
  
  @doc("Уникальный x-amz-date для загрузки файла")
  @example("20211122T065734Z")
  @encodedName("application/json", "x-amz-date")
  xAmzDate: string;
  
  @doc("Уникальная подпись для загрузки файла")
  @example("87e8f3ba4083c937c0e891d7a11tre932d8c33cg4bacf5380bf27624c1ok1475")
  @encodedName("application/json", "x-amz-signature")
  xAmzSignature: string;
  
  @doc("Уникальный ключ для загрузки файла")
  @example("attaches/files/93746/e354fd79-4f3e-4b5a-9c8d-1a2b3c4d5e6f/\${filename}")
  key: string;

  @doc("Адрес для загрузки файла")
  @example("https://api.pachca.com/api/v3/direct_upload")
  @encodedName("application/json", "direct_url")
  directUrl: string;
}

@doc("Запрос на создание сотрудника")
model UserCreateRequest {
  user: {
    @doc("Имя")
    @example("Олег")
    first_name?: string;
    
    @doc("Фамилия")
    @example("Петров")
    last_name?: string;
    
    @doc("Электронная почта")
    @example("olegp@example.com")
    email: string;
    
    @doc("Телефон")
    @example("+79001234567")
    phone_number?: string;

    @doc("Имя пользователя")
    @example("olegpetrov")
    nickname?: string;

    @doc("Департамент")
    @example("Продукт")
    department?: string;

    @doc("Должность")
    @example("CIO")
    title?: string;

    @doc("Уровень доступа")
    @example(UserRole.user)
    role?: UserRole;

    @doc("Деактивация пользователя")
    @example(false)
    suspended?: boolean;

    @doc("Массив тегов, привязываемых к сотруднику")
    @example(#["Product", "Design"])
    list_tags?: string[];
    
    @doc("Задаваемые дополнительные поля")
    custom_properties?: {
      @doc("Идентификатор поля")
      @example(1678)
      id: int32;
      
      @doc("Устанавливаемое значение")
      @example("Санкт-Петербург")
      value: string;
    }[];
  };
  
  @doc("Пропуск этапа отправки приглашения сотруднику. Сотруднику не будет отправлено письмо на электронную почту с приглашением создать аккаунт. Полезно при предварительном создании аккаунтов перед входом через SSO.")
  @example(true)
  skip_email_notify?: boolean;
}

@doc("Запрос на редактирование сотрудника")
model UserUpdateRequest {
  @doc("Собранный объект параметров редактируемого сотрудника")
  user: {
    @doc("Имя")
    @example("Олег")
    first_name?: string;
    
    @doc("Фамилия")
    @example("Петров")
    last_name?: string;
    
    @doc("Электронная почта")
    @example("olegpetrov@example.com")
    email?: string;
    
    @doc("Телефон")
    @example("+79001234567")
    phone_number?: string;
    
    @doc("Имя пользователя")
    @example("olegpetrov")
    nickname?: string;
    
    @doc("Департамент")
    @example("Отдел разработки")
    department?: string;
    
    @doc("Должность")
    @example("Старший разработчик")
    title?: string;
    
    @doc("Уровень доступа")
    @example(UserRole.user)
    role?: UserRole;
    
    @doc("Деактивация пользователя")
    @example(false)
    suspended?: boolean;
    
    @doc("Массив тегов, привязываемых к сотруднику")
    @example(#["Product"])
    list_tags?: string[];
    
    @doc("Задаваемые дополнительные поля")
    custom_properties?: {
      @doc("Идентификатор поля")
      @example(1678)
      id: int32;
      
      @doc("Устанавливаемое значение")
      @example("Санкт-Петербург")
      value: string;
    }[];
  };
}

@doc("Запрос на установку статуса")
model StatusUpdateRequest {
  status: {
    @doc("Emoji символ статуса")
    @example("🎮")
    emoji: string;

    @doc("Текст статуса")
    @example("Очень занят")
    title: string;

    @doc("Срок жизни статуса (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ")
    @example(utcDateTime.fromISO("2024-04-08T10:00:00.000Z"))
    expires_at?: utcDateTime;

    @doc("Режим «Нет на месте»")
    @example(true)
    is_away?: boolean;

    @doc("Текст сообщения при режиме «Нет на месте». Отображается в профиле и при личных сообщениях/упоминаниях.")
    @maxLength(1024)
    @example("Вернусь после 15:00")
    away_message?: string;
  };
}

@doc("Запрос на создание или редактирование тега")
model GroupTagRequest {
  group_tag: {
    @doc("Название тега")
    @example("Новое название тега")
    name: string;
  };
}

@doc("Запрос на создание чата")
model ChatCreateRequest {
  @doc("Собранный объект параметров создаваемого чата")
  chat: {
    @doc("Название")
    @example("🤿 aqua")
    name: string;

    @doc("Массив идентификаторов пользователей, которые станут участниками")
    @example(#[186, 187])
    member_ids?: int32[];

    @doc("Массив идентификаторов тегов, которые станут участниками")
    @example(#[86, 18])
    group_tag_ids?: int32[];

    @doc("Является каналом")
    @example(true)
    channel?: boolean = false;

    @doc("Открытый доступ")
    @example(false)
    public?: boolean = false;
  };
}

@doc("Запрос на обновление чата")
model ChatUpdateRequest {
  @doc("Собранный объект параметров обновляемого чата")
  chat: {
    @doc("Название")
    @example("Бассейн")
    name?: string;

    @doc("Открытый доступ")
    @example(true)
    public?: boolean;
  };
}

@doc("Запрос на добавление участников в чат")
model AddMembersRequest {
  @doc("Массив идентификаторов пользователей, которые станут участниками")
  @example(#[186, 187])
  member_ids: int32[];
  
  @doc("Не создавать в чате системное сообщение о добавлении участника")
  @example(true)
  silent?: boolean;
}

@doc("Запрос на добавление тегов в чат")
model AddTagsRequest {
  @doc("Массив идентификаторов тегов, которые станут участниками")
  @example(#[86, 18])
  group_tag_ids: int32[];
}

@doc("Запрос на изменение роли участника")
model UpdateMemberRoleRequest {
  @doc("Роль")
  @example(ChatMemberRole.admin)
  role: ChatMemberRole;
}

@doc("Запрос на создание сообщения")
model MessageCreateRequest {
  @doc("Собранный объект параметров создаваемого сообщения")
  message: {
    @doc("Тип сущности")
    @example(MessageEntityType.discussion)
    entity_type?: MessageEntityType = MessageEntityType.discussion;
    
    @doc("Идентификатор сущности")
    @example(334)
    entity_id: int32;
    
    @doc("Текст сообщения")
    @example("Вчера мы продали 756 футболок (что на 10% больше, чем в прошлое воскресенье)")
    content: string;
    
    @doc("Прикрепляемые файлы")
    files?: {
      @doc("Путь к файлу, полученный в результате [загрузки файла](POST /direct_url)")
      @example("attaches/files/93746/e354fd79-4f3e-4b5a-9c8d-1a2b3c4d5e6f/logo.png")
      key: string;
      
      @doc("Название файла, которое вы хотите отображать пользователю (рекомендуется писать вместе с расширением)")
      @example("logo.png")
      name: string;
      
      @doc("Тип файла")
      @example(FileType.image)
      file_type: FileType;
      
      @doc("Размер файла в байтах, отображаемый пользователю")
      @example(12345)
      size: int32;
      
      @doc("Ширина изображения в px (используется в случае, если file_type указан как image)")
      @example(800)
      width?: int32;
      
      @doc("Высота изображения в px (используется в случае, если file_type указан как image)")
      @example(600)
      height?: int32;
    }[];
    
    @doc("Массив строк, каждая из которых представлена массивом кнопок. Максимум 100 кнопок у сообщения, до 8 кнопок в строке.")
    @example(#[#[#{ text: "Подробнее", url: "https://example.com/details" }, #{ text: "Отлично!", data: "awesome" }]])
    buttons?: Button[][];

    @doc("Идентификатор сообщения. Указывается в случае, если вы отправляете ответ на другое сообщение.")
    @example(194270)
    parent_message_id?: int32;
    
    @doc("Ссылка на специальную аватарку отправителя для этого сообщения. Использование этого поля возможно только с access_token бота.")
    @example("https://example.com/avatar.png")
    @maxLength(255)
    display_avatar_url?: string;
    
    @doc("Полное специальное имя отправителя для этого сообщения. Использование этого поля возможно только с access_token бота.")
    @example("Бот Поддержки")
    @maxLength(255)
    display_name?: string;
    
    @doc("Пропуск добавления упоминаемых пользователей в тред. Работает только при отправке сообщения в тред.")
    @example(false)
    skip_invite_mentions?: boolean = false;
    
    @doc("Отображение предпросмотра первой найденной ссылки в тексте сообщения")
    @example(false)
    link_preview?: boolean = false;
  };
}

@doc("Запрос на редактирование сообщения")
model MessageUpdateRequest {
  @doc("Собранный объект параметров редактируемого сообщения")
  message: {
    @doc("Текст сообщения")
    @example("Вот попробуйте написать правильно это с первого раза: Будущий, Полощи, Прийти, Грейпфрут, Мозаика, Бюллетень, Дуршлаг, Винегрет.")
    content?: string;
    
    @doc("Прикрепляемые файлы")
    files?: {
      @doc("Путь к файлу, полученный в результате [загрузки файла](POST /direct_url)")
      @example("attaches/files/93746/e354fd79-4f3e-4b5a-9c8d-1a2b3c4d5e6f/logo.png")
      key: string;
      
      @doc("Название файла, которое вы хотите отображать пользователю (рекомендуется писать вместе с расширением)")
      @example("logo.png")
      name: string;
      
      @doc("Тип файла: файл (file), изображение (image)")
      @example("image")
      file_type?: string;
      
      @doc("Размер файла в байтах, отображаемый пользователю")
      @example(12345)
      size?: int32;
      
      @doc("Ширина изображения в px (используется в случае, если file_type указан как image)")
      @example(800)
      width?: int32;
      
      @doc("Высота изображения в px (используется в случае, если file_type указан как image)")
      @example(600)
      height?: int32;
    }[];
    
    @doc("Массив строк, каждая из которых представлена массивом кнопок. Максимум 100 кнопок у сообщения, до 8 кнопок в строке. Для удаления кнопок пришлите пустой массив.")
    @example(#[#[#{ text: "Подробнее", url: "https://example.com/details" }]])
    buttons?: Button[][];
    
    @doc("Ссылка на специальную аватарку отправителя для этого сообщения. Использование этого поля возможно только с access_token бота.")
    @example("https://example.com/avatar.png")
    display_avatar_url?: string;
    
    @doc("Полное специальное имя отправителя для этого сообщения. Использование этого поля возможно только с access_token бота.")
    @example("Бот Поддержки")
    display_name?: string;
  };
}

@doc("Запрос на добавление реакции")
model ReactionRequest {
  @doc("Emoji символ реакции")
  @example("👍")
  code: string;

  @doc("Текстовое имя эмодзи (используется для кастомных эмодзи)")
  @example(":+1:")
  name?: string;
}

@doc("Данные для предпросмотра ссылки")
model LinkPreview {
  @doc("Заголовок")
  @example("Статья: Отправка файлов")
  title: string;
  
  @doc("Описание")
  @example("Пример отправки файлов на удаленный сервер")
  description: string;
  
  @doc("Публичная ссылка на изображение (если вы хотите загрузить файл изображения в Пачку, то используйте параметр image)")
  @example("https://website.com/img/landing.png")
  image_url?: string;
  
  @doc("Изображение")
  image?: {
    @doc("Путь к изображению, полученный в результате [загрузки файла](POST /direct_url)")
    @example("attaches/files/93746/e354fd79-9jh6-f2hd-fj83-709dae24c763/\${filename}")
    key: string;
    
    @doc("Название изображения (рекомендуется писать вместе с расширением)")
    @example("files-to-server.jpg")
    name: string;
    
    @doc("Размер изображения в байтах")
    @example(695604)
    size: int32;
  };
}

@doc("Запрос на разворачивание ссылок")
model LinkPreviewsRequest {
  @doc("`JSON` карта предпросмотров ссылок, где каждый ключ — `URL`, который был получен в исходящем вебхуке о новом сообщении.")
  @extension("x-record-key-example", "https://website.com/articles/123")
  link_previews: Record<LinkPreview>;
}

@doc("Запрос на создание напоминания")
model TaskCreateRequest {
  @doc("Собранный объект параметров создаваемого напоминания")
  task: {
    @doc("Тип")
    @example(TaskKind.reminder)
    kind: TaskKind;

    @doc("Описание (по умолчанию — название типа)")
    @example("Забрать со склада 21 заказ")
    content?: string;

    @doc("Срок выполнения напоминания (ISO-8601) в формате YYYY-MM-DDThh:mm:ss.sssTZD. Если указано время 23:59:59.000, то напоминание будет создано на весь день (без указания времени).")
    @example(utcDateTime.fromISO("2020-06-05T12:00:00.000+03:00"))
    due_at?: utcDateTime;

    @doc("Приоритет: 1, 2 (важно) или 3 (очень важно).")
    @example(2)
    priority?: int32 = 1;

    @doc("Массив идентификаторов пользователей, привязываемых к напоминанию как «ответственные» (по умолчанию ответственным назначается вы)")
    @example(#[12, 13])
    performer_ids?: int32[];

    @doc("Идентификатор чата, к которому привязывается напоминание")
    @example(456)
    chat_id?: int32;

    @doc("Напоминание на весь день (без указания времени)")
    @example(false)
    all_day?: boolean;

    @doc("Задаваемые дополнительные поля")
    custom_properties?: {
      @doc("Идентификатор поля")
      @example(78)
      id: int32;

      @doc("Устанавливаемое значение")
      @example("Синий склад")
      value: string;
    }[];
  };
}

@doc("Запрос на обновление напоминания")
model TaskUpdateRequest {
  @doc("Собранный объект параметров обновляемого напоминания")
  task: {
    @doc("Тип")
    @example(TaskKind.reminder)
    kind?: TaskKind;

    @doc("Описание")
    @example("Забрать со склада 21 заказ")
    content?: string;

    @doc("Срок выполнения напоминания (ISO-8601) в формате YYYY-MM-DDThh:mm:ss.sssTZD. Если указано время 23:59:59.000, то напоминание будет создано на весь день (без указания времени).")
    @example(utcDateTime.fromISO("2020-06-05T12:00:00.000+03:00"))
    due_at?: utcDateTime;

    @doc("Приоритет: 1, 2 (важно) или 3 (очень важно).")
    @example(2)
    priority?: int32;

    @doc("Массив идентификаторов пользователей, привязываемых к напоминанию как «ответственные»")
    @example(#[12])
    performer_ids?: int32[];

    @doc("Статус")
    @example(TaskStatus.done)
    status?: TaskStatus;

    @doc("Напоминание на весь день (без указания времени)")
    @example(false)
    all_day?: boolean;

    @doc("Дата и время выполнения напоминания (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ")
    @example(utcDateTime.fromISO("2020-06-05T12:00:00.000Z"))
    done_at?: utcDateTime;

    @doc("Задаваемые дополнительные поля")
    custom_properties?: {
      @doc("Идентификатор поля")
      @example(78)
      id: int32;

      @doc("Устанавливаемое значение")
      @example("Синий склад")
      value: string;
    }[];
  };
}

@doc("Опция для блоков select, radio и checkbox")
model ViewBlockSelectableOption {
  @doc("Отображаемый текст")
  @example("Ничего")
  @maxLength(75)
  text: string;

  @doc("Уникальное строковое значение, которое будет передано в ваше приложение при выборе этого пункта")
  @example("nothing")
  @maxLength(150)
  value: string;

  @doc("Пояснение, которое будет указано серым цветом в этом пункте под отображаемым текстом")
  @example("Каждый день бот будет присылать список новых задач в вашей команде")
  @maxLength(75)
  description?: string;

  @doc("Изначально выбранный пункт. Только один пункт может быть выбран.")
  @example(true)
  selected?: boolean;
}

model ViewBlockCheckboxOption {
  @doc("Отображаемый текст")
  @example("Ничего")
  @maxLength(75)
  text: string;

  @doc("Уникальное строковое значение, которое будет передано в ваше приложение при выборе этого пункта")
  @example("nothing")
  @maxLength(150)
  value: string;

  @doc("Пояснение, которое будет указано серым цветом в этом пункте под отображаемым текстом")
  @example("Каждый день бот будет присылать список новых задач в вашей команде")
  @maxLength(75)
  description?: string;

  @doc("Изначально выбранный пункт")
  @example(true)
  checked?: boolean;
}

@doc("Блок header — заголовок")
model ViewBlockHeader {
  @doc("Тип блока")
  @example("header")
  @extension("x-enum-descriptions", #{
    header: "Для заголовков всегда header"
  })
  type: "header";
  
  @doc("Текст заголовка")
  @example("Основная информация")
  @maxLength(150)
  text: string;
}

@doc("Блок plain_text — обычный текст")
model ViewBlockPlainText {
  @doc("Тип блока")
  @example("plain_text")
  @extension("x-enum-descriptions", #{
    plain_text: "Для обычного текста всегда plain_text"
  })
  type: "plain_text";
  
  @doc("Текст")
  @example("Заполните форму. После отправки формы в общий чат будет отправлено текстовое уведомление, а ваш отпуск будет сохранен в базе.")
  @maxLength(12000)
  text: string;
}

@doc("Блок markdown — форматированный текст")
model ViewBlockMarkdown {
  @doc("Тип блока")
  @example("markdown")
  @extension("x-enum-descriptions", #{
    markdown: "Для форматированного текста всегда markdown"
  })
  type: "markdown";
  
  @doc("Текст")
  @example("Информацию о доступных вам днях отпуска вы можете прочитать по [ссылке](https://www.website.com/timeoff)")
  @maxLength(12000)
  text: string;
}

@doc("Блок divider — разделитель")
model ViewBlockDivider {
  @doc("Тип блока")
  @example("divider")
  @extension("x-enum-descriptions", #{
    divider: "Для разделителя всегда divider"
  })
  type: "divider";
}

@doc("Блок input — текстовое поле ввода")
model ViewBlockInput {
  @doc("Тип блока")
  @example("input")
  @extension("x-enum-descriptions", #{
    input: "Для текстового поля всегда input"
  })
  type: "input";
  
  @doc("Название, которое будет передано в ваше приложение как ключ указанного пользователем значения")
  @example("info")
  @maxLength(255)
  name: string;
  
  @doc("Подпись к полю")
  @example("Описание отпуска")
  @maxLength(150)
  label: string;
  
  @doc("Подсказка внутри поля ввода, пока оно пустое")
  @example("Куда собираетесь и что будете делать")
  @maxLength(150)
  placeholder?: string;
  
  @doc("Многострочное поле")
  @example(true)
  multiline?: boolean;
  
  @doc("Начальное значение в поле")
  @example("Начальный текст")
  @maxLength(3000)
  initial_value?: string;

  @doc("Минимальная длина текста, который должен написать пользователь. Если пользователь напишет меньше, он получит ошибку.")
  @example(10)
  @minValue(0)
  @maxValue(3000)
  min_length?: int32;

  @doc("Максимальная длина текста, который должен написать пользователь. Если пользователь напишет больше, он получит ошибку.")
  @example(500)
  @minValue(1)
  @maxValue(3000)
  max_length?: int32;
  
  @doc("Обязательность")
  @example(true)
  required?: boolean;
  
  @doc("Подсказка, которая отображается под полем серым цветом")
  @example("Возможно вам подскаджут, какие места лучше посетить")
  @maxLength(2000)
  hint?: string;
}

@doc("Блок select — выпадающий список")
model ViewBlockSelect {
  @doc("Тип блока")
  @example("select")
  @extension("x-enum-descriptions", #{
    select: "Для выпадающего списка всегда select"
  })
  type: "select";
  
  @doc("Название, которое будет передано в ваше приложение как ключ указанного пользователем выбора")
  @example("team")
  @maxLength(255)
  name: string;
  
  @doc("Подпись к выпадающему списку")
  @example("Выберите команду")
  @maxLength(150)
  label: string;
  
  @doc("Массив доступных пунктов в выпадающем списке")
  @maxItems(100)
  options?: ViewBlockSelectableOption[];

  @doc("Обязательность")
  @example(false)
  required?: boolean;

  @doc("Подсказка, которая отображается под выпадающим списком серым цветом")
  @example("Выберите одну из команд")
  @maxLength(2000)
  hint?: string;
}

@doc("Блок radio — радиокнопки")
model ViewBlockRadio {
  @doc("Тип блока")
  @example("radio")
  @extension("x-enum-descriptions", #{
    radio: "Для радиокнопок всегда radio"
  })
  type: "radio";
  
  @doc("Название, которое будет передано в ваше приложение как ключ указанного пользователем выбора")
  @example("accessibility")
  @maxLength(255)
  name: string;
  
  @doc("Подпись к группе радиокнопок")
  @example("Доступность")
  @maxLength(150)
  label: string;
  
  @doc("Массив радиокнопок")
  @maxItems(10)
  options?: ViewBlockSelectableOption[];
  
  @doc("Обязательность")
  @example(true)
  required?: boolean;
  
  @doc("Подсказка, которая отображается под группой радиокнопок серым цветом")
  @example("Если вы не планируете выходить на связь, то выберите вариант Ничего")
  @maxLength(2000)
  hint?: string;
}

@doc("Блок checkbox — чекбоксы")
model ViewBlockCheckbox {
  @doc("Тип блока")
  @example("checkbox")
  @extension("x-enum-descriptions", #{
    checkbox: "Для чекбоксов всегда checkbox"
  })
  type: "checkbox";
  
  @doc("Название, которое будет передано в ваше приложение как ключ указанного пользователем выбора")
  @example("newsletters")
  @maxLength(255)
  name: string;
  
  @doc("Подпись к группе чекбоксов")
  @example("Рассылки")
  @maxLength(150)
  label: string;
  
  @doc("Массив чекбоксов")
  @maxItems(10)
  options?: ViewBlockCheckboxOption[];

  @doc("Обязательность")
  @example(false)
  required?: boolean;

  @doc("Подсказка, которая отображается под группой чекбоксов серым цветом")
  @example("Выберите интересующие вас рассылки")
  @maxLength(2000)
  hint?: string;
}

@doc("Блок date — выбор даты")
model ViewBlockDate {
  @doc("Тип блока")
  @example("date")
  @extension("x-enum-descriptions", #{
    date: "Для выбора даты всегда date"
  })
  type: "date";
  
  @doc("Название, которое будет передано в ваше приложение как ключ указанного пользователем значения")
  @example("date_start")
  @maxLength(255)
  name: string;
  
  @doc("Подпись к полю")
  @example("Дата начала отпуска")
  @maxLength(150)
  label: string;
  
  @doc("Начальное значение в поле в формате YYYY-MM-DD")
  @example(plainDate.fromISO("2025-07-01"))
  initial_date?: plainDate;
  
  @doc("Обязательность")
  @example(true)
  required?: boolean;

  @doc("Подсказка, которая отображается под полем серым цветом")
  @example("Укажите дату начала отпуска")
  @maxLength(2000)
  hint?: string;
}

@doc("Блок time — выбор времени")
model ViewBlockTime {
  @doc("Тип блока")
  @example("time")
  @extension("x-enum-descriptions", #{
    time: "Для выбора времени всегда time"
  })
  type: "time";
  
  @doc("Название, которое будет передано в ваше приложение как ключ указанного пользователем значения")
  @example("newsletter_time")
  @maxLength(255)
  name: string;
  
  @doc("Подпись к полю")
  @example("Время рассылки")
  @maxLength(150)
  label: string;
  
  @doc("Начальное значение в поле в формате HH:mm")
  @example(plainTime.fromISO("11:00"))
  initial_time?: plainTime;

  @doc("Обязательность")
  @example(false)
  required?: boolean;
  
  @doc("Подсказка, которая отображается под полем серым цветом")
  @example("Укажите, в какое время присылать выбранные рассылки")
  @maxLength(2000)
  hint?: string;
}

@doc("Блок file_input — загрузка файлов")
model ViewBlockFileInput {
  @doc("Тип блока")
  @example("file_input")
  @extension("x-enum-descriptions", #{
    file_input: "Для загрузки файлов всегда file_input"
  })
  type: "file_input";
  
  @doc("Название, которое будет передано в ваше приложение как ключ указанного пользователем значения")
  @example("request_doc")
  @maxLength(255)
  name: string;
  
  @doc("Подпись к полю")
  @example("Заявление")
  @maxLength(150)
  label: string;
  
  @doc("Массив допустимых расширений файлов, указанные в виде строк (например, [\"png\",\"jpg\",\"gif\"]). Если это поле не указано, все расширения файлов будут приняты.")
  @example(#["pdf","jpg","png"])
  filetypes?: string[];
  
  @doc("Максимальное количество файлов, которое может загрузить пользователь в это поле.")
  @example(1)
  @minValue(1)
  @maxValue(10)
  max_files?: int32 = 10;
  
  @doc("Обязательность")
  @example(true)
  required?: boolean;
  
  @doc("Подсказка, которая отображается под полем серым цветом")
  @example("Загрузите заполненное заявление с электронной подписью (в формате pdf, jpg или png)")
  @maxLength(2000)
  hint?: string;
}

@doc("Блок представления для форм (базовая модель, используйте конкретные типы блоков)")
model ViewBlock {
  @doc("Тип блока")
  type: string;
  
  @doc("Текст блока")
  text?: string;
  
  @doc("Имя поля")
  name?: string;
  
  @doc("Метка поля")
  label?: string;
  
  @doc("Начальная дата")
  initial_date?: utcDateTime;
}

@doc("Union-тип для всех возможных блоков представления")
union ViewBlockUnion {
  ViewBlockHeader,
  ViewBlockPlainText,
  ViewBlockMarkdown,
  ViewBlockDivider,
  ViewBlockInput,
  ViewBlockSelect,
  ViewBlockRadio,
  ViewBlockCheckbox,
  ViewBlockDate,
  ViewBlockTime,
  ViewBlockFileInput
}

@doc("Запрос на открытие представления")
model OpenViewRequest {
  @doc("Способ открытия представления")
  @extension("x-enum-descriptions", #{
    modal: "Модальное окно"
  })
  @example("modal")
  type: "modal";

  @doc("Уникальный идентификатор события (полученный, например, в исходящем вебхуке о нажатии кнопки)")
  @example("791a056b-006c-49dd-834b-c633fde52fe8")
  trigger_id: string;

  @doc("Необязательная строка, которая будет отправлена в ваше приложение при отправке пользователем заполненной формы. Используйте это поле, например, для передачи в формате `JSON` какой то дополнительной информации вместе с заполненной пользователем формой.")
  @maxLength(3000)
  @example("{\"timeoff_id\":4378}")
  private_metadata?: string;

  @doc("Необязательный идентификатор для распознавания этого представления, который будет отправлен в ваше приложение при отправке пользователем заполненной формы. Используйте это поле, например, для понимания, какую форму должен был заполнить пользователь.")
  @maxLength(255)
  @example("timeoff_reguest_form")
  callback_id?: string;

  @doc("Собранный объект представления")
  view: {
    @doc("Заголовок представления")
    @maxLength(24)
    @example("Уведомление об отпуске")
    title: string;

    @doc("Текст кнопки закрытия представления")
    @maxLength(24)
    @example("Закрыть")
    close_text?: string = "Отменить";

    @doc("Текст кнопки отправки формы")
    @maxLength(24)
    @example("Отправить заявку")
    submit_text?: string = "Отправить";

    @doc("Массив блоков представления")
    @maxItems(100)
    blocks: ViewBlockUnion[];
  };
}

@doc("Запрос на обновление бота")
model BotUpdateRequest {
  @doc("Собранный объект параметров редактируемого бота")
  bot: {
    @doc("Объект параметров вебхука")
    webhook: {
      @doc("URL исходящего вебхука")
      @example("https://www.website.com/tasks/new")
      outgoing_url: string;
    };
  };
}

@doc("Ответ с данными бота")
model BotResponse {
  @doc("Идентификатор бота")
  @example(1738816)
  id: int32;
  
  @doc("Объект параметров вебхука")
  webhook: {
    @doc("URL исходящего вебхука")
    @example("https://www.website.com/tasks/new")
    outgoing_url: string;
  };
}

@doc("Пустые детали. При: user_login, user_logout, user_2fa_fail, user_2fa_success, user_created, user_deleted, chat_created, message_created, message_updated, message_deleted, reaction_created, reaction_deleted, thread_created, audit_events_accessed")
model AuditDetailsEmpty {}

@doc("При: user_updated")
model AuditDetailsUserUpdated {
  @doc("Список изменённых полей")
  changed_attrs: string[];
}

@doc("При: user_role_changed")
model AuditDetailsRoleChanged {
  @doc("Новая роль")
  new_company_role: string;
  @doc("Предыдущая роль")
  previous_company_role: string;
  @doc("Идентификатор инициатора")
  initiator_id: int32;
}

@doc("При: tag_created, tag_deleted")
model AuditDetailsTagName {
  @doc("Название тега")
  name: string;
}

@doc("При: user_added_to_tag, user_removed_from_tag, user_chat_leave")
model AuditDetailsInitiator {
  @doc("Идентификатор инициатора действия")
  initiator_id: int32;
}

@doc("При: user_chat_join")
model AuditDetailsInviter {
  @doc("Идентификатор пригласившего")
  inviter_id: int32;
}

@doc("При: chat_renamed")
model AuditDetailsChatRenamed {
  @doc("Прежнее название чата")
  old_name: string;
  @doc("Новое название чата")
  new_name: string;
}

@doc("При: chat_permission_changed")
model AuditDetailsChatPermission {
  @doc("Публичный доступ")
  public_access: boolean;
}

@doc("При: tag_added_to_chat")
model AuditDetailsTagChat {
  @doc("Идентификатор чата")
  chat_id: int32;
  @doc("Название тега")
  tag_name: string;
}

@doc("При: tag_removed_from_chat")
model AuditDetailsChatId {
  @doc("Идентификатор чата")
  chat_id: int32;
}

@doc("При: access_token_created, access_token_updated, access_token_destroy")
model AuditDetailsTokenScopes {
  @doc("Скоупы токена")
  scopes: string[];
}

@doc("При: kms_encrypt, kms_decrypt")
model AuditDetailsKms {
  @doc("Идентификатор чата")
  chat_id: int32;
  @doc("Идентификатор сообщения")
  message_id: int32;
  @doc("Причина операции")
  reason: string;
}

@doc("При: dlp_violation_detected")
model AuditDetailsDlp {
  @doc("Идентификатор правила DLP")
  dlp_rule_id: int32;
  @doc("Название правила DLP")
  dlp_rule_name: string;
  @doc("Идентификатор сообщения")
  message_id: int32;
  @doc("Идентификатор чата")
  chat_id: int32;
  @doc("Идентификатор пользователя")
  user_id: int32;
  @doc("Описание действия")
  action_message: string;
  @doc("Результат проверки условий правила (true — условия сработали)")
  conditions_matched: boolean;
}

@doc("При: search_users_api, search_chats_api, search_messages_api")
model AuditDetailsSearch {
  @doc("Тип поиска")
  search_type: string;
  @doc("Указан ли поисковый запрос")
  query_present: boolean;
  @doc("Использован ли курсор")
  cursor_present: boolean;
  @doc("Количество возвращённых результатов")
  limit: int32;
  @doc("Применённые фильтры. Возможные ключи зависят от типа поиска: order, sort, created_from, created_to, company_roles (users), active, chat_subtype, personal (chats), chat_ids, user_ids (messages)")
  filters: Record<unknown>;
}

@doc("Дополнительные детали события аудита. Структура зависит от значения event_key")
union AuditEventDetailsUnion {
  AuditDetailsEmpty,
  AuditDetailsUserUpdated,
  AuditDetailsRoleChanged,
  AuditDetailsTagName,
  AuditDetailsInitiator,
  AuditDetailsInviter,
  AuditDetailsChatRenamed,
  AuditDetailsChatPermission,
  AuditDetailsTagChat,
  AuditDetailsChatId,
  AuditDetailsTokenScopes,
  AuditDetailsKms,
  AuditDetailsDlp,
  AuditDetailsSearch,
}

@doc("Событие аудита")
model AuditEvent {
  @doc("Уникальный идентификатор события")
  @example("a1b2c3d4-5e6f-7g8h-9i10-j11k12l13m14")
  id: string;
  
  @doc("Дата и время создания события (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ")
  @example(utcDateTime.fromISO("2025-05-15T14:30:00.000Z"))
  created_at: utcDateTime;
  
  @doc("Ключ типа события")
  @example(AuditEventKey.user_login)
  event_key: AuditEventKey;
  
  @doc("Идентификатор затронутой сущности")
  @example("98765")
  entity_id: string;

  @doc("Тип затронутой сущности")
  @example("User")
  entity_type: string;

  @doc("Идентификатор пользователя, выполнившего действие")
  @example("98765")
  actor_id: string;

  @doc("Тип актора")
  @example("User")
  actor_type: string;

  @doc("Дополнительные детали события. Структура зависит от значения event_key — см. описания значений поля event_key. Для событий без деталей возвращается пустой объект")
  details: AuditEventDetailsUnion;
  
  @doc("IP-адрес, с которого было выполнено действие")
  @example("192.168.1.100")
  ip_address: string;
  
  @doc("User agent клиента")
  @example("Pachca/3.60.0 (co.staply.pachca; build:15; iOS 18.5.0) Alamofire/5.0.0")
  user_agent: string;
}

// ============================================================================
// Webhook Payload Models
// ============================================================================

@doc("Объект треда в вебхуке сообщения")
model WebhookMessageThread {
  @doc("Идентификатор сообщения, к которому был создан тред")
  @example(12345)
  message_id: int32;
  
  @doc("Идентификатор чата сообщения, к которому был создан тред")
  @example(67890)
  message_chat_id: int32;
}

@doc("Структура исходящего вебхука о сообщении")
model MessageWebhookPayload {
  @doc("Тип объекта")
  @example("message")
  @extension("x-enum-descriptions", #{
    message: "Для сообщений всегда message"
  })
  type: "message";
  
  @doc("Идентификатор сообщения")
  @example(1245817)
  id: int32;
  
  @doc("Тип события")
  @example(WebhookEventType.new)
  event: WebhookEventType;

  @doc("Тип сущности, к которой относится сообщение")
  @example(MessageEntityType.discussion)
  entity_type: MessageEntityType;
  
  @doc("Идентификатор сущности, к которой относится сообщение")
  @example(5678)
  entity_id: int32;
  
  @doc("Текст сообщения")
  @example("Текст сообщения")
  content: string;
  
  @doc("Идентификатор отправителя сообщения")
  @example(2345)
  user_id: int32;
  
  @doc("Дата и время создания сообщения (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ")
  @example(utcDateTime.fromISO("2025-05-15T14:30:00.000Z"))
  created_at: utcDateTime;
  
  @doc("Прямая ссылка на сообщение")
  @example("https://pachca.com/chats/1245817/messages/5678")
  url: string;
  
  @doc("Идентификатор чата, в котором находится сообщение")
  @example(9012)
  chat_id: int32;
  
  @doc("Идентификатор сообщения, к которому написан ответ")
  @example(3456)
  parent_message_id?: int32 | null;
  
  @doc("Объект с параметрами треда")
  thread?: WebhookMessageThread | null;
  
  @doc("Дата и время отправки вебхука (UTC+0) в формате UNIX")
  @example(1747574400)
  webhook_timestamp: int32;
}

@doc("Структура исходящего вебхука о реакции")
model ReactionWebhookPayload {
  @doc("Тип объекта")
  @example("reaction")
  @extension("x-enum-descriptions", #{
    reaction: "Для реакций всегда reaction"
  })
  type: "reaction";
  
  @doc("Тип события")
  @example(ReactionEventType.new)
  event: ReactionEventType;
  
  @doc("Идентификатор сообщения, к которому относится реакция")
  @example(1245817)
  message_id: int32;
  
  @doc("Emoji символ реакции")
  @example("👍")
  code: string;
  
  @doc("Название реакции")
  @example("thumbsup")
  name: string;
  
  @doc("Идентификатор пользователя, который добавил или удалил реакцию")
  @example(2345)
  user_id: int32;
  
  @doc("Дата и время создания сообщения (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ")
  @example(utcDateTime.fromISO("2025-05-15T14:30:00.000Z"))
  created_at: utcDateTime;
  
  @doc("Дата и время отправки вебхука (UTC+0) в формате UNIX")
  @example(1747574400)
  webhook_timestamp: int32;
}

@doc("Структура исходящего вебхука о нажатии кнопки")
model ButtonWebhookPayload {
  @doc("Тип объекта")
  @example("button")
  @extension("x-enum-descriptions", #{
    button: "Для кнопки всегда button"
  })
  type: "button";
  
  @doc("Тип события")
  @example("click")
  @extension("x-enum-descriptions", #{
    click: "Нажатие кнопки"
  })
  event: "click";
  
  @doc("Идентификатор сообщения, к которому относится кнопка")
  @example(1245817)
  message_id: int32;
  
  @doc("Уникальный идентификатор события. Время жизни — 3 секунды. Может быть использован, например, для открытия представления пользователю")
  @example("a1b2c3d4-5e6f-7g8h-9i10-j11k12l13m14")
  trigger_id: string;
  
  @doc("Данные нажатой кнопки")
  @example("button_data")
  data: string;
  
  @doc("Идентификатор пользователя, который нажал кнопку")
  @example(2345)
  user_id: int32;
  
  @doc("Идентификатор чата, в котором была нажата кнопка")
  @example(9012)
  chat_id: int32;
  
  @doc("Дата и время отправки вебхука (UTC+0) в формате UNIX")
  @example(1747574400)
  webhook_timestamp: int32;
}

@doc("Структура исходящего вебхука об участниках чата")
model ChatMemberWebhookPayload {
  @doc("Тип объекта")
  @example("chat_member")
  @extension("x-enum-descriptions", #{
    chat_member: "Для участника чата всегда chat_member"
  })
  type: "chat_member";
  
  @doc("Тип события")
  @example(MemberEventType.add)
  event: MemberEventType;
  
  @doc("Идентификатор чата, в котором изменился состав участников")
  @example(9012)
  chat_id: int32;
  
  @doc("Идентификатор треда")
  @example(5678)
  thread_id?: int32 | null;
  
  @doc("Массив идентификаторов пользователей, с которыми произошло событие")
  @example(#[2345, 6789])
  user_ids: int32[];
  
  @doc("Дата и время события (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ")
  @example(utcDateTime.fromISO("2025-05-15T14:30:00.000Z"))
  created_at: utcDateTime;
  
  @doc("Дата и время отправки вебхука (UTC+0) в формате UNIX")
  @example(1747574400)
  webhook_timestamp: int32;
}

@doc("Структура исходящего вебхука об участниках пространства")
model CompanyMemberWebhookPayload {
  @doc("Тип объекта")
  @example("company_member")
  @extension("x-enum-descriptions", #{
    company_member: "Для участника пространства всегда company_member"
  })
  type: "company_member";
  
  @doc("Тип события")
  @example(UserEventType.invite)
  event: UserEventType;
  
  @doc("Массив идентификаторов пользователей, с которыми произошло событие")
  @example(#[2345, 6789])
  user_ids: int32[];
  
  @doc("Дата и время события (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ")
  @example(utcDateTime.fromISO("2025-05-15T14:30:00.000Z"))
  created_at: utcDateTime;
  
  @doc("Дата и время отправки вебхука (UTC+0) в формате UNIX")
  @example(1747574400)
  webhook_timestamp: int32;
}

@doc("Объект ссылки в вебхуке разворачивания ссылок")
model WebhookLink {
  @doc("URL ссылки")
  @example("https://example.com/page1")
  url: string;

  @doc("Домен ссылки")
  @example("example.com")
  domain: string;
}

@doc("Структура исходящего вебхука о разворачивании ссылок")
model LinkSharedWebhookPayload {
  @doc("Тип объекта")
  @example("message")
  @extension("x-enum-descriptions", #{
    message: "Для разворачивания ссылок всегда message"
  })
  type: "message";

  @doc("Тип события")
  @example("link_shared")
  @extension("x-enum-descriptions", #{
    link_shared: "Обнаружена ссылка на отслеживаемый домен"
  })
  event: "link_shared";

  @doc("Идентификатор чата, в котором обнаружена ссылка")
  @example(23438)
  chat_id: int32;

  @doc("Идентификатор сообщения, содержащего ссылку")
  @example(268092)
  message_id: int32;

  @doc("Массив обнаруженных ссылок на отслеживаемые домены")
  links: WebhookLink[];

  @doc("Дата и время создания сообщения (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ")
  @example(utcDateTime.fromISO("2024-09-18T19:53:14.000Z"))
  created_at: utcDateTime;

  @doc("Дата и время отправки вебхука (UTC+0) в формате UNIX")
  @example(1726685594)
  webhook_timestamp: int32;
}

@doc("Объединение всех типов payload вебхуков")
union WebhookPayloadUnion {
  MessageWebhookPayload,
  ReactionWebhookPayload,
  ButtonWebhookPayload,
  ChatMemberWebhookPayload,
  CompanyMemberWebhookPayload,
  LinkSharedWebhookPayload,
}

@doc("Событие исходящего вебхука")
model WebhookEvent {
  @doc("Идентификатор события")
  @example("01KAJZ2XDSS2S3DSW9EXJZ0TBV")
  id: string;
  
  @doc("Тип события")
  @example("message_new")
  event_type: string;
  
  @doc("Объект вебхука")
  payload: WebhookPayloadUnion;
  
  @doc("Дата и время создания события (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ")
  @example(utcDateTime.fromISO("2025-05-15T14:30:00.000Z"))
  created_at: utcDateTime;
}

@doc("Запрос на экспорт сообщений")
model ExportRequest {
  @doc("Дата начала для экспорта (ISO-8601, UTC+0) в формате YYYY-MM-DD")
  @example(plainDate.fromISO("2025-03-20"))
  start_at: plainDate;
  
  @doc("Дата окончания для экспорта (ISO-8601, UTC+0) в формате YYYY-MM-DD")
  @example(plainDate.fromISO("2025-03-20"))
  end_at: plainDate;
  
  @doc("Адрес, на который будет отправлен вебхук по завершению экспорта")
  @example("https://webhook.site/9227d3b8-6e82-4e64-bf5d-ad972ad270f2")
  webhook_url: string;
  
  @doc("Массив идентификаторов чатов. Указывается, если нужно получить сообщения только некоторых чатов.")
  @example(#[1381521])
  chat_ids?: int32[];
  
  @doc("Пропуск формирования файла со списком чатов (chats.json)")
  @example(false)
  skip_chats_file?: boolean;
}

// ============================================================================
// Common Operations
// ============================================================================

@route("/custom_properties")
@tag("Common")
interface CommonOperations {
  @extension("x-requirements", #{
    scope: "custom_properties:read",
  })
  @doc("""
Список дополнительных полей

На данный момент работа с дополнительными полями типа "Файл" недоступна.

Метод для получения актуального списка дополнительных полей участников и напоминаний в вашей компании.

По умолчанию в вашей компании все сущности имеют только базовые поля. Но администратор вашей компании может добавлять дополнительные поля, редактировать их и удалять. Если при создании сотрудников (или напоминаний) вы используете дополнительные поля, которые не являются актуальными (удалены или не существуют) - вы получите ошибку.
""")
  @get
  listProperties(
    @doc("Тип сущности")
    @extension("example", "User")
    @query entity_type: SearchEntityType
  ): {
    @statusCode _: 200;
    @body body: DataResponse<CustomPropertyDefinition[]>;
  } | {
    @statusCode _: 401;
    @body body: OAuthError;
  } | {
    @statusCode _: 403;
    @body body: OAuthError;
  } | {
    @statusCode _: 422;
    @body body: ApiError;
  } | {
    @statusCode _: 400;
    @body body: ApiError;
  };
}

@route("/uploads")
@tag("Common")
interface UploadOperations {
  @extension("x-requirements", #{
    scope: "uploads:write",
  })
  @doc("""
Получение подписи, ключа и других параметров

Метод для получения подписи, ключа и других параметров, необходимых для загрузки файла.

Данный метод необходимо использовать для загрузки каждого файла.
""")
  @post
  getUploadParams(): {
    @statusCode _: 201;
    @body body: UploadParams;
  } | {
    @statusCode _: 401;
    @body body: OAuthError;
  } | {
    @statusCode _: 403;
    @body body: OAuthError;
  };
}

@doc("Данные для загрузки файла")
model FileUploadRequest {
  @doc("Параметр Content-Disposition, полученный в ответе на запрос [Получение подписи, ключа и других параметров](POST /uploads)")
  @encodedName("multipart/form-data", "Content-Disposition")
  contentDisposition: HttpPart<string>;
  
  @doc("Параметр acl, полученный в ответе на запрос [Получение подписи, ключа и других параметров](POST /uploads)")
  acl: HttpPart<string>;
  
  @doc("Параметр policy, полученный в ответе на запрос [Получение подписи, ключа и других параметров](POST /uploads)")
  policy: HttpPart<string>;
  
  @doc("Параметр x-amz-credential, полученный в ответе на запрос [Получение подписи, ключа и других параметров](POST /uploads)")
  @encodedName("multipart/form-data", "x-amz-credential")
  xAmzCredential: HttpPart<string>;
  
  @doc("Параметр x-amz-algorithm, полученный в ответе на запрос [Получение подписи, ключа и других параметров](POST /uploads)")
  @encodedName("multipart/form-data", "x-amz-algorithm")
  xAmzAlgorithm: HttpPart<string>;
  
  @doc("Параметр x-amz-date, полученный в ответе на запрос [Получение подписи, ключа и других параметров](POST /uploads)")
  @encodedName("multipart/form-data", "x-amz-date")
  xAmzDate: HttpPart<string>;
  
  @doc("Параметр x-amz-signature, полученный в ответе на запрос [Получение подписи, ключа и других параметров](POST /uploads)")
  @encodedName("multipart/form-data", "x-amz-signature")
  xAmzSignature: HttpPart<string>;
  
  @doc("Параметр key, полученный в ответе на запрос [Получение подписи, ключа и других параметров](POST /uploads)")
  key: HttpPart<string>;
  
  @doc("Файл для загрузки")
  file: HttpPart<bytes>;
}

@tag("Common")
interface DirectUploadOperations {
  @extension("x-requirements", #{
    auth: false,
  })
  @doc("""
Загрузка файла

Для того чтобы прикрепить файл к сообщению или к другой сущности через API, требуется сначала загрузить файл на сервер (через метод получения подписи и ключа), а затем сформировать ссылку на него.

**Процесс загрузки состоит из трёх шагов:**

1. [Получение подписи, ключа и других параметров](POST /uploads) — сделать `POST`-запрос без тела запроса для получения параметров загрузки.
2. **Загрузка файла** — после получения всех параметров, нужно сделать `POST` запрос c форматом `multipart/form-data` на адрес `direct_url`, включая те же поля, что пришли (content-disposition, acl, policy, x-amz-credential, x-amz-algorithm, x-amz-date, x-amz-signature, key) и сам файл. При успешной загрузке — `HTTP` статус `201`.
3. **Прикрепление файла к сообщению или другой сущности** — после загрузки файла, чтобы прикрепить его к сообщению или другой сущности API, необходимо сформировать путь файла. Для этого в поле `key`, полученном на этапе подписи, заменить шаблон `\${filename}` на фактическое имя файла. Пример: Если ваш файл называется `Логотип для сайта.png`, а в ответе на метод `/uploads` ключ был `attaches/files/93746/e354-...-5e6f/\${filename}`, итоговый ключ будет `attaches/files/93746/e354-...-5e6f/Логотип для сайта.png`.
""")
  @post
  @route("direct_url")
  uploadFile(
    @multipartBody request: FileUploadRequest
  ): {@statusCode _: 201};
}

@route("/chats/exports")
@tag("Common")
interface ExportOperations {
  @extension("x-requirements", #{
    scope: "chat_exports:write",
    plan: "corporation",
  })
  @doc("""
Экспорт сообщений

Метод для запрашивания экспорта сообщений за указанный период.
""")
  @post
  
  requestExport(@body request: ExportRequest): {
    @statusCode _: 204;

  } | {
    @statusCode _: 401;
    @body body: OAuthError;
  } | {
    @statusCode _: 403;
    @body body: ApiError | OAuthError;
  } | {
    @statusCode _: 400;
    @body body: ApiError;
  } | {
    @statusCode _: 422;
    @body body: ApiError;
  };
  
  @extension("x-requirements", #{
    scope: "chat_exports:read",
    plan: "corporation",
  })
  @doc("""
Скачать архив экспорта

Метод для скачивания готового архива экспорта сообщений.

Для получения архива вам необходимо знать его `id` и указать его в `URL` запроса.

В ответ на запрос сервер вернёт `302 Found` с заголовком `Location`, содержащим временную ссылку на скачивание файла. Большинство HTTP-клиентов автоматически следуют редиректу и скачивают файл.
""")
  @route("/{id}")
  @get

  downloadExport(
    @doc("Идентификатор экспорта")
    @extension("example", 22322)
    @path id: int32
  ): {
    @statusCode _: 302;
    @header Location: url;
  } | {
    @statusCode _: 401;
    @body body: OAuthError;
  } | {
    @statusCode _: 403;
    @body body: OAuthError;
  } | {
    @statusCode _: 404;
    @body body: ApiError;
  } | {
    @statusCode _: 403;
    @body body: ApiError | OAuthError;
  };
}

// ============================================================================
// Profile Operations
// ============================================================================

@route("/profile")
@tag("Profile")
interface ProfileOperations {
  @extension("x-requirements", #{
    scope: "profile:read",
  })
  @doc("""
Информация о профиле

Метод для получения информации о своем профиле.
""")
  @get
  getProfile(): {
    @statusCode _: 200;
    @body body: DataResponse<User>;
  } | {
    @statusCode _: 401;
    @body body: OAuthError;
  } | {
    @statusCode _: 403;
    @body body: OAuthError;
  };
  
  @extension("x-requirements", #{
    scope: "profile_status:read",
  })
  @doc("""
Текущий статус

Метод для получения информации о своем статусе.
""")
  @route("/status")
  @get
  getStatus(): {
    @statusCode _: 200;
    @body body: DataResponse<UserStatus | null>;
  } | {
    @statusCode _: 401;
    @body body: OAuthError;
  } | {
    @statusCode _: 403;
    @body body: OAuthError;
  };
  
  @extension("x-requirements", #{
    scope: "profile_status:write",
  })
  @doc("""
Новый статус

Метод для установки себе нового статуса.
""")
  @route("/status")
  @put
  updateStatus(@body request: StatusUpdateRequest): {
    @statusCode _: 200;
    @body body: DataResponse<UserStatus>;
  } | {
    @statusCode _: 401;
    @body body: OAuthError;
  } | {
    @statusCode _: 403;
    @body body: OAuthError;
  } | {
    @statusCode _: 400;
    @body body: ApiError;
  } | {
    @statusCode _: 422;
    @body body: ApiError;
  };
  
  @extension("x-requirements", #{
    scope: "profile_status:write",
  })
  @doc("""
Удаление статуса

Метод для удаления своего статуса.
""")
  @route("/status")
  @delete
  
  deleteStatus(): {
    @statusCode _: 204;

  } | {
    @statusCode _: 401;
    @body body: OAuthError;
  } | {
    @statusCode _: 403;
    @body body: OAuthError;
  };
}

// ============================================================================
// User Operations
// ============================================================================

@route("/users")
@tag("Users")
interface UserOperations {
  @extension("x-requirements", #{
    scope: "users:create",
  })
  @doc("""
Создать сотрудника

Метод для создания нового сотрудника в вашей компании.

Вы можете заполнять дополнительные поля сотрудника, которые созданы в вашей компании. Получить актуальный список идентификаторов дополнительных полей сотрудника вы можете в методе [Список дополнительных полей](GET /custom_properties).
""")
  @post
  createUser(@body request: UserCreateRequest): {
    @statusCode _: 201;
    @body body: DataResponse<User>;
  } | {
    @statusCode _: 401;
    @body body: OAuthError;
  } | {
    @statusCode _: 403;
    @body body: OAuthError;
  } | {
    @statusCode _: 422;
    @body body: ApiError;
  } | {
    @statusCode _: 400;
    @body body: ApiError;
  };
  
  @extension("x-requirements", #{
    scope: "users:read",
  })
  @doc("""
Список сотрудников

Метод для получения актуального списка сотрудников вашей компании.
""")
  @get
  listUsers(
    @doc("Поисковая фраза для фильтрации результатов. Поиск работает по полям: `first_name` (имя), `last_name` (фамилия), `email` (электронная почта), `phone_number` (телефон) и `nickname` (никнейм).")
    @extension("example", "Олег")
    @query query?: string,
    @doc("Количество возвращаемых сущностей за один запрос")
    @query
    @extension("example", 1)
    @minValue(1)
    @maxValue(50)
    limit?: int32 = 50,
    @doc("Курсор для пагинации (из `meta.paginate.next_page`)")
    @extension("example", "eyJpZCI6MTAsImRpciI6ImFzYyJ9")
    @query cursor?: string
  ): {
    @statusCode _: 200;
    @body body: PaginatedDataResponse<User[]>;
  } | {
    @statusCode _: 401;
    @body body: OAuthError;
  } | {
    @statusCode _: 403;
    @body body: OAuthError;
  } | {
    @statusCode _: 400;
    @body body: ApiError;
  } | {
    @statusCode _: 422;
    @body body: ApiError;
  };
  
  @extension("x-requirements", #{
    scope: "users:read",
  })
  @doc("""
Информация о сотруднике

Метод для получения информации о сотруднике.

Для получения сотрудника вам необходимо знать его `id` и указать его в `URL` запроса.
""")
  @route("/{id}")
  @get
  getUser(
    @doc("Идентификатор пользователя")
    @extension("example", 12)
    @path id: int32
  ): {
    @statusCode _: 200;
    @body body: DataResponse<User>;
  } | {
    @statusCode _: 401;
    @body body: OAuthError;
  } | {
    @statusCode _: 403;
    @body body: OAuthError;
  } | {
    @statusCode _: 404;
    @body body: ApiError;
  };
  
  @extension("x-requirements", #{
    scope: "users:update",
  })
  @doc("""
Редактирование сотрудника

Метод для редактирования сотрудника.

Для редактирования сотрудника вам необходимо знать его `id` и указать его в `URL` запроса. Все редактируемые параметры сотрудника указываются в теле запроса. Получить актуальный список идентификаторов дополнительных полей сотрудника вы можете в методе [Список дополнительных полей](GET /custom_properties).
""")
  @put
  updateUser(
    @doc("Идентификатор пользователя")
    @extension("example", 12)
    @path id: int32,
    @body request: UserUpdateRequest
  ): {
    @statusCode _: 200;
    @body body: DataResponse<User>;
  } | {
    @statusCode _: 401;
    @body body: OAuthError;
  } | {
    @statusCode _: 403;
    @body body: OAuthError;
  } | {
    @statusCode _: 404;
    @body body: ApiError;
  } | {
    @statusCode _: 400;
    @body body: ApiError;
  } | {
    @statusCode _: 422;
    @body body: ApiError;
  };
  
  @extension("x-requirements", #{
    scope: "users:delete",
  })
  @doc("""
Удаление сотрудника

Метод для удаления сотрудника.

Для удаления сотрудника вам необходимо знать его `id` и указать его в `URL` запроса.
""")
  @delete

  deleteUser(
    @doc("Идентификатор пользователя")
    @extension("example", 12)
    @path id: int32
  ): {
    @statusCode _: 204;

  } | {
    @statusCode _: 401;
    @body body: OAuthError;
  } | {
    @statusCode _: 403;
    @body body: OAuthError;
  } | {
    @statusCode _: 404;
    @body body: ApiError;
  };
}

// ============================================================================
// User Status Operations
// ============================================================================

@route("/users")
@tag("Users")
interface UserStatusOperations {
  @extension("x-requirements", #{
    scope: "user_status:read",
  })
  @doc("""
Статус сотрудника

Метод для получения информации о статусе сотрудника.
""")
  @route("/{user_id}/status")
  @get
  getUserStatus(
    @doc("Идентификатор пользователя")
    @extension("example", 12)
    @path user_id: int32
  ): {
    @statusCode _: 200;
    @body body: DataResponse<UserStatus | null>;
  } | {
    @statusCode _: 401;
    @body body: OAuthError;
  } | {
    @statusCode _: 403;
    @body body: OAuthError;
  } | {
    @statusCode _: 404;
    @body body: ApiError;
  };

  @extension("x-requirements", #{
    scope: "user_status:write",
  })
  @doc("""
Новый статус сотрудника

Метод для установки нового статуса сотруднику.
""")
  @route("/{user_id}/status")
  @put
  updateUserStatus(
    @doc("Идентификатор пользователя")
    @extension("example", 12)
    @path user_id: int32,
    @body request: StatusUpdateRequest
  ): {
    @statusCode _: 200;
    @body body: DataResponse<UserStatus>;
  } | {
    @statusCode _: 401;
    @body body: OAuthError;
  } | {
    @statusCode _: 403;
    @body body: OAuthError;
  } | {
    @statusCode _: 404;
    @body body: ApiError;
  } | {
    @statusCode _: 400;
    @body body: ApiError;
  } | {
    @statusCode _: 422;
    @body body: ApiError;
  };

  @extension("x-requirements", #{
    scope: "user_status:write",
  })
  @doc("""
Удаление статуса сотрудника

Метод для удаления статуса сотрудника.
""")
  @route("/{user_id}/status")
  @delete

  deleteUserStatus(
    @doc("Идентификатор пользователя")
    @extension("example", 12)
    @path user_id: int32
  ): {
    @statusCode _: 204;

  } | {
    @statusCode _: 401;
    @body body: OAuthError;
  } | {
    @statusCode _: 403;
    @body body: OAuthError;
  } | {
    @statusCode _: 404;
    @body body: ApiError;
  };
}

// ============================================================================
// Group Tag Operations
// ============================================================================

@route("/group_tags")
@tag("Group tags")
interface GroupTagOperations {
  @extension("x-requirements", #{
    scope: "group_tags:write",
  })
  @doc("""
Новый тег

Метод для создания нового тега.
""")
  @post
  createTag(@body request: GroupTagRequest): {
    @statusCode _: 201;
    @body body: DataResponse<GroupTag>;
  } | {
    @statusCode _: 401;
    @body body: OAuthError;
  } | {
    @statusCode _: 403;
    @body body: OAuthError;
  } | {
    @statusCode _: 422;
    @body body: ApiError;
  } | {
    @statusCode _: 400;
    @body body: ApiError;
  };
  
  @extension("x-requirements", #{
    scope: "group_tags:read",
  })
  @doc("""
Информация о теге

Метод для получения информации о теге. Названия тегов являются уникальными в компании.

Для получения тега вам необходимо знать его `id` и указать его в `URL` запроса.
""")
  @route("/{id}")
  @get
  getTag(
    @doc("Идентификатор тега")
    @extension("example", 9111)
    @path id: int32
  ): {
    @statusCode _: 200;
    @body body: DataResponse<GroupTag>;
  } | {
    @statusCode _: 401;
    @body body: OAuthError;
  } | {
    @statusCode _: 403;
    @body body: OAuthError;
  } | {
    @statusCode _: 404;
    @body body: ApiError;
  };
  
  @extension("x-requirements", #{
    scope: "group_tags:read",
  })
  @doc("""
Список тегов сотрудников

Метод для получения актуального списка тегов сотрудников. Названия тегов являются уникальными в компании.
""")
  @get
  listTags(
    @doc("Массив названий тегов, по которым вы хотите отфильтровать список")
    @extension("example", #["Design", "Product"])
    @query(#{ explode: true })
    names?: TagNamesFilter,
    @doc("Количество возвращаемых сущностей за один запрос")
    @query
    @extension("example", 1)
    @minValue(1)
    @maxValue(50)
    limit?: int32 = 50,
    @doc("Курсор для пагинации (из `meta.paginate.next_page`)")
    @extension("example", "eyJpZCI6MTAsImRpciI6ImFzYyJ9")
    @query cursor?: string
  ): {
    @statusCode _: 200;
    @body body: PaginatedDataResponse<GroupTag[]>;
  } | {
    @statusCode _: 401;
    @body body: OAuthError;
  } | {
    @statusCode _: 403;
    @body body: OAuthError;
  } | {
    @statusCode _: 400;
    @body body: ApiError;
  } | {
    @statusCode _: 422;
    @body body: ApiError;
  };
  
  @extension("x-requirements", #{
    scope: "group_tags:read",
  })
  @doc("""
Список сотрудников тега

Метод для получения актуального списка сотрудников тега.
""")
  @route("/{id}/users")
  @get
  getTagUsers(
    @doc("Идентификатор тега")
    @extension("example", 9111)
    @path id: int32,
    @doc("Количество возвращаемых сущностей за один запрос")
    @query
    @extension("example", 1)
    @minValue(1)
    @maxValue(50)
    limit?: int32 = 50,
    @doc("Курсор для пагинации (из `meta.paginate.next_page`)")
    @extension("example", "eyJpZCI6MTAsImRpciI6ImFzYyJ9")
    @query cursor?: string
  ): {
    @statusCode _: 200;
    @body body: PaginatedDataResponse<User[]>;
  } | {
    @statusCode _: 401;
    @body body: OAuthError;
  } | {
    @statusCode _: 403;
    @body body: OAuthError;
  } | {
    @statusCode _: 404;
    @body body: ApiError;
  } | {
    @statusCode _: 400;
    @body body: ApiError;
  } | {
    @statusCode _: 422;
    @body body: ApiError;
  };
  
  @extension("x-requirements", #{
    scope: "group_tags:write",
  })
  @doc("""
Редактирование тега

Метод для редактирования тега.

Для редактирования тега вам необходимо знать его `id` и указать его в `URL` запроса. Все редактируемые параметры тега указываются в теле запроса.
""")
  @put
  updateTag(
    @doc("Идентификатор тега")
    @extension("example", 9111)
    @path id: int32,
    @body request: GroupTagRequest
  ): {
    @statusCode _: 200;
    @body body: DataResponse<GroupTag>;
  } | {
    @statusCode _: 401;
    @body body: OAuthError;
  } | {
    @statusCode _: 403;
    @body body: OAuthError;
  } | {
    @statusCode _: 404;
    @body body: ApiError;
  } | {
    @statusCode _: 400;
    @body body: ApiError;
  } | {
    @statusCode _: 422;
    @body body: ApiError;
  };
  
  @extension("x-requirements", #{
    scope: "group_tags:write",
  })
  @doc("""
Удаление тега

Метод для удаления тега.

Для удаления тега вам необходимо знать его `id` и указать его в `URL` запроса.
""")
  @delete

  deleteTag(
    @doc("Идентификатор тега")
    @extension("example", 9111)
    @path id: int32
  ): {
    @statusCode _: 204;

  } | {
    @statusCode _: 401;
    @body body: OAuthError;
  } | {
    @statusCode _: 403;
    @body body: OAuthError;
  } | {
    @statusCode _: 404;
    @body body: ApiError;
  };
}

// ============================================================================
// Chat Operations
// ============================================================================

@route("/chats")
@tag("Chats")
interface ChatOperations {
  @extension("x-requirements", #{
    scope: "chats:create",
  })
  @doc("""
Новый чат

Метод для создания нового чата.

Для создания личной переписки 1 на 1 с пользователем пользуйтесь методом [Новое сообщение](POST /messages).

При создании чата вы автоматически становитесь участником.
""")
  @post
  createChat(@body request: ChatCreateRequest): {
    @statusCode _: 201;
    @body body: DataResponse<Chat>;
  } | {
    @statusCode _: 401;
    @body body: OAuthError;
  } | {
    @statusCode _: 403;
    @body body: OAuthError;
  } | {
    @statusCode _: 400;
    @body body: ApiError;
  } | {
    @statusCode _: 422;
    @body body: ApiError;
  };
  
  @extension("x-requirements", #{
    scope: "chats:read",
  })
  @doc("""
Информация о чате

Метод для получения информации о чате.

Для получения чата вам необходимо знать его `id` и указать его в `URL` запроса.
""")
  @route("/{id}")
  @get
  getChat(
    @doc("Идентификатор чата")
    @extension("example", 334)
    @path id: int32
  ): {
    @statusCode _: 200;
    @body body: DataResponse<Chat>;
  } | {
    @statusCode _: 401;
    @body body: OAuthError;
  } | {
    @statusCode _: 403;
    @body body: OAuthError;
  } | {
    @statusCode _: 404;
    @body body: ApiError;
  };
  
  @extension("x-requirements", #{
    scope: "chats:read",
  })
  @doc("""
Список чатов

Метод для получения списка чатов по заданным параметрам.
""")
  @get
  listChats(
    @doc("Составной параметр сортировки сущностей выборки")
    @extension("x-param-names", #[
      #{ name: "sort[id]", description: "Идентификатор чата" },
      #{ name: "sort[last_message_at]", description: "Дата и время создания последнего сообщения" }
    ])
    @extension("example", "desc")
    @query("sort[{field}]") sortField?: SortOrder = SortOrder.desc,
    @doc("Параметр, который отвечает за доступность и выборку чатов для пользователя")
    @extension("example", "is_member")
    @query availability?: ChatAvailability = ChatAvailability.is_member,
    @doc("Фильтрация по времени создания последнего сообщения. Будут возвращены те чаты, время последнего созданного сообщения в которых не раньше чем указанное (в формате YYYY-MM-DDThh:mm:ss.sssZ).")
    @extension("example", "2025-01-01T00:00:00.000Z")
    @query last_message_at_after?: utcDateTime,
    @doc("Фильтрация по времени создания последнего сообщения. Будут возвращены те чаты, время последнего созданного сообщения в которых не позже чем указанное (в формате YYYY-MM-DDThh:mm:ss.sssZ).")
    @extension("example", "2025-02-01T00:00:00.000Z")
    @query last_message_at_before?: utcDateTime,
    @doc("Фильтрация по личным и групповым чатам. Если параметр не указан, возвращаются любые чаты.")
    @extension("example", false)
    @query personal?: boolean,
    @doc("Количество возвращаемых сущностей за один запрос")
    @query
    @extension("example", 1)
    @minValue(1)
    @maxValue(50)
    limit?: int32 = 50,
    @doc("Курсор для пагинации (из meta.paginate.next_page)")
    @extension("example", "eyJpZCI6MTAsImRpciI6ImFzYyJ9")
    @query cursor?: string
  ): {
    @statusCode _: 200;
    @body body: PaginatedDataResponse<Chat[]>;
  } | {
    @statusCode _: 401;
    @body body: OAuthError;
  } | {
    @statusCode _: 403;
    @body body: OAuthError;
  } | {
    @statusCode _: 400;
    @body body: ApiError;
  } | {
    @statusCode _: 422;
    @body body: ApiError;
  };
  
  @extension("x-requirements", #{
    scope: "chats:update",
  })
  @doc("""
Обновление чата

Метод для обновления параметров чата.

Для обновления нужно знать `id` чата и указать его в `URL`. Все обновляемые поля передаются в теле запроса.
""")
  @put
  updateChat(
    @doc("Идентификатор чата")
    @extension("example", 334)
    @path id: int32,
    @body request: ChatUpdateRequest
  ): {
    @statusCode _: 200;
    @body body: DataResponse<Chat>;
  } | {
    @statusCode _: 401;
    @body body: OAuthError;
  } | {
    @statusCode _: 403;
    @body body: OAuthError;
  } | {
    @statusCode _: 404;
    @body body: ApiError;
  } | {
    @statusCode _: 400;
    @body body: ApiError;
  } | {
    @statusCode _: 422;
    @body body: ApiError;
  };
  
  @extension("x-requirements", #{
    scope: "chats:archive",
  })
  @doc("""
Архивация чата

Метод для отправки чата в архив.

Для отправки чата в архив вам необходимо знать `id` и указать его в `URL` запроса.
""")
  @route("/{id}/archive")
  @put

  archiveChat(
    @doc("Идентификатор чата")
    @extension("example", 334)
    @path id: int32
  ): {
    @statusCode _: 204;

  } | {
    @statusCode _: 401;
    @body body: OAuthError;
  } | {
    @statusCode _: 403;
    @body body: OAuthError;
  } | {
    @statusCode _: 404;
    @body body: ApiError;
  };
  
  @extension("x-requirements", #{
    scope: "chats:archive",
  })
  @doc("""
Разархивация чата

Метод для возвращения чата из архива.

Для разархивации чата вам необходимо знать её `id` и указать его в `URL` запроса.
""")
  @route("/{id}/unarchive")
  @put

  unarchiveChat(
    @doc("Идентификатор чата")
    @extension("example", 334)
    @path id: int32
  ): {
    @statusCode _: 204;

  } | {
    @statusCode _: 401;
    @body body: OAuthError;
  } | {
    @statusCode _: 403;
    @body body: OAuthError;
  } | {
    @statusCode _: 404;
    @body body: ApiError;
  };
}

// ============================================================================
// Chat Member Operations
// ============================================================================

@tag("Members")
interface ChatMemberOperations {
  @extension("x-requirements", #{
    scope: "chat_members:read",
  })
  @doc("""
Список участников чата

Метод для получения актуального списка участников чата.

Владелец пространства может получить состав участников любого чата пространства. Администраторы и боты могут получить список участников только тех чатов, в которых состоят (или которые являются открытыми).
""")
  @route("/chats/{id}/members")
  @get
  listMembers(
    @doc("Идентификатор чата")
    @extension("example", 334)
    @path id: int32,
    @doc("Роль в чате")
    @extension("example", "all")
    @query role?: ChatMemberRoleFilter = ChatMemberRoleFilter.all,
    @doc("Количество возвращаемых сущностей за один запрос")
    @query
    @extension("example", 1)
    @minValue(1)
    @maxValue(50)
    limit?: int32 = 50,
    @doc("Курсор для пагинации (из meta.paginate.next_page)")
    @extension("example", "eyJpZCI6MTAsImRpciI6ImFzYyJ9")
    @query cursor?: string
  ): {
    @statusCode _: 200;
    @body body: PaginatedDataResponse<User[]>;
  } | {
    @statusCode _: 401;
    @body body: OAuthError;
  } | {
    @statusCode _: 403;
    @body body: OAuthError;
  } | {
    @statusCode _: 404;
    @body body: ApiError;
  } | {
    @statusCode _: 400;
    @body body: ApiError;
  } | {
    @statusCode _: 422;
    @body body: ApiError;
  };
  
  @extension("x-requirements", #{
    scope: "chat_members:write",
  })
  @doc("""
Добавление пользователей

Метод для добавления пользователей в состав участников беседы, канала или треда.
""")
  @route("/chats/{id}/members")
  @post

  addMembers(
    @doc("Идентификатор чата (беседа, канал или чат треда)")
    @extension("example", 334)
    @path id: int32,
    @body request: AddMembersRequest
  ): {
    @statusCode _: 204;

  } | {
    @statusCode _: 401;
    @body body: OAuthError;
  } | {
    @statusCode _: 403;
    @body body: OAuthError;
  } | {
    @statusCode _: 404;
    @body body: ApiError;
  } | {
    @statusCode _: 400;
    @body body: ApiError;
  } | {
    @statusCode _: 422;
    @body body: ApiError;
  };
  
  @extension("x-requirements", #{
    scope: "chat_members:write",
  })
  @doc("""
Исключение пользователя

Метод для исключения пользователя из состава участников беседы или канала.

Если пользователь является владельцем чата, то исключить его нельзя. Он может только самостоятельно выйти из чата, воспользовавшись методом [Выход из беседы или канала](DELETE /chats/{id}/leave).
""")
  @route("/chats/{id}/members/{user_id}")
  @delete

  removeMember(
    @doc("Идентификатор чата")
    @extension("example", 334)
    @path id: int32,
    @doc("Идентификатор пользователя")
    @extension("example", 186)
    @path user_id: int32
  ): {
    @statusCode _: 204;

  } | {
    @statusCode _: 401;
    @body body: OAuthError;
  } | {
    @statusCode _: 403;
    @body body: OAuthError;
  } | {
    @statusCode _: 404;
    @body body: ApiError;
  };
  
  @extension("x-requirements", #{
    scope: "chat_members:write",
  })
  @doc("""
Добавление тегов

Метод для добавления тегов в состав участников беседы или канала.

После добавления тега все его участники автоматически становятся участниками чата. Состав участников тега и чата синхронизируется автоматически: при добавлении нового участника в тег он сразу появляется в чате, при удалении из тега — удаляется из чата.
""")
  @route("/chats/{id}/group_tags")
  @post

  addTags(
    @doc("Идентификатор чата")
    @extension("example", 334)
    @path id: int32,
    @body request: AddTagsRequest
  ): {
    @statusCode _: 204;

  } | {
    @statusCode _: 401;
    @body body: OAuthError;
  } | {
    @statusCode _: 403;
    @body body: OAuthError;
  } | {
    @statusCode _: 404;
    @body body: ApiError;
  } | {
    @statusCode _: 400;
    @body body: ApiError;
  } | {
    @statusCode _: 422;
    @body body: ApiError;
  };
  
  @extension("x-requirements", #{
    scope: "chat_members:write",
  })
  @doc("""
Исключение тега

Метод для исключения тега из состава участников беседы или канала.

Для исключения тега вам необходимо знать его `id` и указать его в `URL` запроса.
""")
  @route("/chats/{id}/group_tags/{tag_id}")
  @delete

  removeTag(
    @doc("Идентификатор чата")
    @extension("example", 334)
    @path id: int32,
    @doc("Идентификатор тега")
    @extension("example", 86)
    @path tag_id: int32
  ): {
    @statusCode _: 204;

  } | {
    @statusCode _: 401;
    @body body: OAuthError;
  } | {
    @statusCode _: 403;
    @body body: OAuthError;
  } | {
    @statusCode _: 404;
    @body body: ApiError;
  };
  
  @extension("x-requirements", #{
    scope: "chat_members:write",
  })
  @doc("""
Редактирование роли

Метод для редактирования роли пользователя или бота в беседе или канале.

Для редактирования роли в беседе или канале вам необходимо знать `id` чата и пользователя (или бота) и указать их в `URL` запроса. Все редактируемые параметры роли указываются в теле запроса.

Владельцу чата роль изменить нельзя. Он всегда имеет права Админа в чате.
""")
  @route("/chats/{id}/members/{user_id}")
  @put

  updateMemberRole(
    @doc("Идентификатор чата")
    @extension("example", 334)
    @path id: int32,
    @doc("Идентификатор пользователя")
    @extension("example", 186)
    @path user_id: int32,
    @body request: UpdateMemberRoleRequest
  ): {
    @statusCode _: 204;

  } | {
    @statusCode _: 401;
    @body body: OAuthError;
  } | {
    @statusCode _: 403;
    @body body: OAuthError;
  } | {
    @statusCode _: 404;
    @body body: ApiError;
  } | {
    @statusCode _: 400;
    @body body: ApiError;
  } | {
    @statusCode _: 422;
    @body body: ApiError;
  };
  
  @extension("x-requirements", #{
    scope: "chats:leave",
  })
  @doc("""
Выход из беседы или канала

Метод для самостоятельного выхода из беседы или канала.
""")
  @route("/chats/{id}/leave")
  @delete

  leaveChat(
    @doc("Идентификатор чата")
    @extension("example", 334)
    @path id: int32
  ): {
    @statusCode _: 204;

  } | {
    @statusCode _: 401;
    @body body: OAuthError;
  } | {
    @statusCode _: 403;
    @body body: OAuthError;
  } | {
    @statusCode _: 404;
    @body body: ApiError;
  } | {
    @statusCode _: 400;
    @body body: ApiError;
  } | {
    @statusCode _: 422;
    @body body: ApiError;
  };
}

// ============================================================================
// Thread Operations
// ============================================================================

@tag("Thread")
interface ThreadOperations {
  @extension("x-requirements", #{
    scope: "threads:create",
  })
  @doc("""
Новый тред

Метод для создания нового треда к сообщению.

Если у сообщения уже был создан тред, то в ответе на запрос вернётся информация об уже созданном ранее треде.
""")
  @route("/messages/{id}/thread")
  @post
  createThread(
    @doc("Идентификатор сообщения")
    @extension("example", 154332686)
    @path id: int32
  ): {
    @statusCode _: 201;
    @body body: DataResponse<Thread>;
  } | {
    @statusCode _: 401;
    @body body: OAuthError;
  } | {
    @statusCode _: 403;
    @body body: OAuthError;
  } | {
    @statusCode _: 404;
    @body body: ApiError;
  };
  
  @extension("x-requirements", #{
    scope: "threads:read",
  })
  @doc("""
Информация о треде

Метод для получения информации о треде.

Для получения треда вам необходимо знать его `id` и указать его в `URL` запроса.
""")
  @route("/threads/{id}")
  @get
  getThread(
    @doc("Идентификатор треда")
    @extension("example", 265142)
    @path id: int32
  ): {
    @statusCode _: 200;
    @body body: DataResponse<Thread>;
  } | {
    @statusCode _: 401;
    @body body: OAuthError;
  } | {
    @statusCode _: 403;
    @body body: OAuthError;
  } | {
    @statusCode _: 404;
    @body body: ApiError;
  };
}

// ============================================================================
// Message Operations
// ============================================================================

@route("/messages")
@tag("Messages")
interface MessageOperations {
  @extension("x-requirements", #{
    scope: "messages:create",
  })
  @doc("""
Новое сообщение

Метод для отправки сообщения в беседу или канал, личного сообщения пользователю или комментария в тред.

При использовании `entity_type: "discussion"` (или просто без указания `entity_type`) допускается отправка любого `chat_id` в поле `entity_id`. То есть, сообщение можно отправить зная только идентификатор чата. При этом, вы имеете возможность отправить сообщение в тред по его идентификатору или личное сообщение по идентификатору пользователя.

Для отправки личного сообщения пользователю создавать чат не требуется. Достаточно указать `entity_type: "user"` и идентификатор пользователя. Чат будет создан автоматически, если между вами ещё не было переписки. Между двумя пользователями может быть только один личный чат.
""")
  @post
  createMessage(@body request: MessageCreateRequest): {
    @statusCode _: 201;
    @body body: DataResponse<Message>;
  } | {
    @statusCode _: 401;
    @body body: OAuthError;
  } | {
    @statusCode _: 403;
    @body body: OAuthError;
  } | {
    @statusCode _: 400;
    @body body: ApiError;
  } | {
    @statusCode _: 422;
    @body body: ApiError;
  };
  
  @extension("x-requirements", #{
    scope: "messages:read",
  })
  @doc("""
Информация о сообщении

Метод для получения информации о сообщении.

Для получения сообщения вам необходимо знать его `id` и указать его в `URL` запроса.
""")
  @get
  getMessage(
    @doc("Идентификатор сообщения")
    @extension("example", 194275)
    @path id: int32
  ): {
    @statusCode _: 200;
    @body body: DataResponse<Message>;
  } | {
    @statusCode _: 401;
    @body body: OAuthError;
  } | {
    @statusCode _: 403;
    @body body: OAuthError;
  } | {
    @statusCode _: 404;
    @body body: ApiError;
  };
  
  @extension("x-requirements", #{
    scope: "messages:update",
  })
  @doc("""
Редактирование сообщения

Метод для редактирования сообщения или комментария.

Для редактирования сообщения вам необходимо знать его `id` и указать его в `URL` запроса. Все редактируемые параметры сообщения указываются в теле запроса.
""")
  @put
  updateMessage(
    @doc("Идентификатор сообщения")
    @extension("example", 194275)
    @path id: int32,
    @body request: MessageUpdateRequest
  ): {
    @statusCode _: 200;
    @body body: DataResponse<Message>;
  } | {
    @statusCode _: 401;
    @body body: OAuthError;
  } | {
    @statusCode _: 403;
    @body body: OAuthError;
  } | {
    @statusCode _: 404;
    @body body: ApiError;
  } | {
    @statusCode _: 400;
    @body body: ApiError;
  } | {
    @statusCode _: 422;
    @body body: ApiError;
  };
  
  @extension("x-requirements", #{
    scope: "messages:delete",
  })
  @doc("""
Удаление сообщения

Метод для удаления сообщения.

Удаление сообщения доступно отправителю, админам и редакторам в чате. В личных сообщениях оба пользователя являются редакторами. Ограничений по давности отправки сообщения нет.

Для удаления сообщения вам необходимо знать его `id` и указать его в `URL` запроса.
""")
  @delete

  deleteMessage(
    @doc("Идентификатор сообщения")
    @extension("example", 194275)
    @path id: int32
  ): {
    @statusCode _: 204;

  } | {
    @statusCode _: 401;
    @body body: OAuthError;
  } | {
    @statusCode _: 403;
    @body body: OAuthError;
  } | {
    @statusCode _: 404;
    @body body: ApiError;
  };
  
  @extension("x-requirements", #{
    scope: "pins:write",
  })
  @doc("""
Закрепление сообщения

Метод для закрепления сообщения в чате.

Для закрепления сообщения вам необходимо знать `id` сообщения и указать его в `URL` запроса.
""")
  @route("/{id}/pin")
  @post

  pinMessage(
    @doc("Идентификатор сообщения")
    @extension("example", 194275)
    @path id: int32
  ): {
    @statusCode _: 201;

  } | {
    @statusCode _: 401;
    @body body: OAuthError;
  } | {
    @statusCode _: 403;
    @body body: OAuthError;
  } | {
    @statusCode _: 404;
    @body body: ApiError;
  } | {
    @statusCode _: 409;
    @body body: ApiError;
  };
  
  @extension("x-requirements", #{
    scope: "pins:write",
  })
  @doc("""
Открепление сообщения

Метод для открепления сообщения из чата.

Для открепления сообщения вам необходимо знать `id` сообщения и указать его в `URL` запроса.
""")
  @route("/{id}/pin")
  @delete

  unpinMessage(
    @doc("Идентификатор сообщения")
    @extension("example", 194275)
    @path id: int32
  ): {
    @statusCode _: 204;

  } | {
    @statusCode _: 401;
    @body body: OAuthError;
  } | {
    @statusCode _: 403;
    @body body: OAuthError;
  } | {
    @statusCode _: 404;
    @body body: ApiError;
  };
}

@route("/messages")
@tag("Messages")
interface ChatMessageOperations {
  @extension("x-requirements", #{
    scope: "messages:read",
  })
  @doc("""
Список сообщений чата

Метод для получения списка сообщений бесед, каналов, тредов и личных сообщений.

Для получения сообщений вам необходимо знать `chat_id` требуемой беседы, канала, треда или диалога, и указать его в `URL` запроса. Сообщения будут возвращены в порядке убывания даты отправки (то есть, сначала будут идти последние сообщения чата). Для получения более ранних сообщений чата доступны параметры `limit` и `cursor`.
""")
  @get
  listChatMessages(
    @doc("Идентификатор чата (беседа, канал, диалог или чат треда)")
    @extension("example", 198)
    @query chat_id: int32,
    @doc("Составной параметр сортировки сущностей выборки")
    @extension("x-param-names", #[
      #{ name: "sort[id]", description: "Идентификатор сообщения" }
    ])
    @extension("example", "desc")
    @query("sort[{field}]") sortField?: SortOrder = SortOrder.desc,
    @doc("Количество возвращаемых сущностей за один запрос")
    @query
    @extension("example", 1)
    @minValue(1)
    @maxValue(50)
    limit?: int32 = 50,
    @doc("Курсор для пагинации (из `meta.paginate.next_page`)")
    @extension("example", "eyJpZCI6MTAsImRpciI6ImFzYyJ9")
    @query cursor?: string
  ): {
    @statusCode _: 200;
    @body body: PaginatedDataResponse<Message[]>;
  } | {
    @statusCode _: 401;
    @body body: OAuthError;
  } | {
    @statusCode _: 403;
    @body body: OAuthError;
  } | {
    @statusCode _: 404;
    @body body: ApiError;
  } | {
    @statusCode _: 400;
    @body body: ApiError;
  } | {
    @statusCode _: 422;
    @body body: ApiError;
  };
}

// ============================================================================
// Read Member Operations
// ============================================================================

@tag("Read member")
interface ReadMemberOperations {
  @extension("x-requirements", #{
    scope: "messages:read",
  })
  @doc("""
Список прочитавших сообщение

Метод для получения актуального списка пользователей, прочитавших сообщение.
""")
  @route("/messages/{id}/read_member_ids")
  @get
  listReadMembers(
    @doc("Идентификатор сообщения")
    @extension("example", 194275)
    @path id: int32,
    @doc("Количество возвращаемых сущностей за один запрос")
    @query
    @extension("example", 300)
    @minValue(1)
    @maxValue(300)
    limit?: int32 = 300,
    @doc("Курсор для пагинации (из `meta.paginate.next_page`)")
    @extension("example", "eyJpZCI6MTAsImRpciI6ImFzYyJ9")
    @query cursor?: string
  ): {
    @statusCode _: 200;
    @body body: PaginatedDataResponse<int32[]>;
  } | {
    @statusCode _: 401;
    @body body: OAuthError;
  } | {
    @statusCode _: 403;
    @body body: OAuthError;
  } | {
    @statusCode _: 404;
    @body body: ApiError;
  } | {
    @statusCode _: 400;
    @body body: ApiError;
  } | {
    @statusCode _: 422;
    @body body: ApiError;
  };
}

// ============================================================================
// Reaction Operations
// ============================================================================

@route("/messages/{id}/reactions")
@tag("Reactions")
interface ReactionOperations {
  @extension("x-requirements", #{
    scope: "reactions:write",
  })
  @doc("""
Добавление реакции

Метод для добавления реакции на сообщение.

Для добавления реакции вам необходимо знать `id` сообщения и указать его в `URL` запроса. Реакции на сообщения отправляются в виде символов `Emoji`. Если пользователь уже ставил реакцию - повторно она установлена не будет. Для удаления реакции надо воспользоваться методом [Удаление реакции](DELETE /messages/{id}/reactions).

**Лимиты реакций:**

- Каждый пользователь может установить не более **20 уникальных** реакций
- Сообщение может иметь не более **30 уникальных** реакций
- Общее количество реакций на сообщение не может превышать **1000**
""")
  @post

  addReaction(
    @doc("Идентификатор сообщения")
    @extension("example", 7231942)
    @path id: int32,
    @body request: ReactionRequest
  ): {
    @statusCode _: 201;
    @body body: Reaction;
  } | {
    @statusCode _: 401;
    @body body: OAuthError;
  } | {
    @statusCode _: 403;
    @body body: OAuthError;
  } | {
    @statusCode _: 404;
    @body body: ApiError;
  } | {
    @statusCode _: 422;
    @body body: ApiError;
  } | {
    @statusCode _: 400;
    @body body: ApiError;
  };
  
  @extension("x-requirements", #{
    scope: "reactions:write",
  })
  @doc("""
Удаление реакции

Метод для удаления реакции на сообщение.

Для удаления реакции вам необходимо знать `id` сообщения и указать его в `URL` запроса. Реакции на сообщения хранятся в виде символов `Emoji`.

Удалять можно только те реакции, которые были поставлены авторизованным пользователем.
""")
  @delete

  removeReaction(
    @doc("Идентификатор сообщения")
    @extension("example", 7231942)
    @path id: int32,

    @doc("Emoji символ реакции")
    @extension("example", "👍")
    @query code: string,

    @doc("Текстовое имя эмодзи (используется для кастомных эмодзи)")
    @extension("example", ":+1:")
    @query name?: string
  ): {
    @statusCode _: 204;

  } | {
    @statusCode _: 401;
    @body body: OAuthError;
  } | {
    @statusCode _: 403;
    @body body: OAuthError;
  } | {
    @statusCode _: 404;
    @body body: ApiError;
  } | {
    @statusCode _: 400;
    @body body: ApiError;
  } | {
    @statusCode _: 422;
    @body body: ApiError;
  };
  
  @extension("x-requirements", #{
    scope: "reactions:read",
  })
  @doc("""
Список реакций

Метод для получения актуального списка реакций на сообщение.
""")
  @get
  listReactions(
    @doc("Идентификатор сообщения")
    @extension("example", 194275)
    @path id: int32,
    @doc("Количество возвращаемых сущностей за один запрос")
    @query
    @extension("example", 1)
    @minValue(1)
    @maxValue(50)
    limit?: int32 = 50,
    @doc("Курсор для пагинации (из `meta.paginate.next_page`)")
    @extension("example", "eyJpZCI6MTAsImRpciI6ImFzYyJ9")
    @query cursor?: string
  ): {
    @statusCode _: 200;
    @body body: PaginatedDataResponse<Reaction[]>;
  } | {
    @statusCode _: 401;
    @body body: OAuthError;
  } | {
    @statusCode _: 403;
    @body body: OAuthError;
  } | {
    @statusCode _: 404;
    @body body: ApiError;
  } | {
    @statusCode _: 400;
    @body body: ApiError;
  } | {
    @statusCode _: 422;
    @body body: ApiError;
  };
}

// ============================================================================
// Link Preview Operations
// ============================================================================

@tag("Link Previews")
interface LinkPreviewOperations {
  @extension("x-requirements", #{
    scope: "link_previews:write",
  })
  @doc("""
Unfurl (разворачивание ссылок)

Метод для создания предпросмотров ссылок в сообщениях.

Для создания предпросмотров ссылок вам необходимо знать `id` сообщения и указать его в `URL` запроса.

Изображения вы можете предоставить как публичной ссылкой (параметром `image_url`), так и с помощью прямой загрузки файла на наш сервер (параметром `image`) через метод `Загрузка файлов`. Если вы указали оба параметра сразу, то `image` является более приоритетным.

Если среди присланных `URL`-ключей будет выявлена ошибка (такого `URL` нет в сообщении или боту не прописан в настройках домен указанного `URL`), то запрос не будет выполнен (не будет создано ни одного предпросмотра).

На данный момент поддерживается отображение только первого созданного предпросмотра ссылки к сообщению. Все присланные вами `link_previews` будут сохранены и появятся в сообщениях в ближайших обновлениях.
""")
  @route("/messages/{id}/link_previews")
  @post
  createLinkPreviews(
    @doc("Идентификатор сообщения")
    @extension("example", 194275)
    @path id: int32,
    @body request: LinkPreviewsRequest
  ): {
    @statusCode _: 204;

  } | {
    @statusCode _: 401;
    @body body: OAuthError;
  } | {
    @statusCode _: 403;
    @body body: OAuthError;
  } | {
    @statusCode _: 404;
    @body body: ApiError;
  } | {
    @statusCode _: 400;
    @body body: ApiError;
  } | {
    @statusCode _: 422;
    @body body: ApiError;
  };
}

// ============================================================================
// Search Operations
// ============================================================================

@route("/search")
@tag("Search")
interface SearchOperations {
  @extension("x-requirements", #{
    scope: "search:users",
  })
  @doc("""
Поиск сотрудников

Метод для полнотекстового поиска сотрудников по имени, email, должности и другим полям.
""")
  @route("/users")
  @get
  searchUsers(
    @doc("Текст поискового запроса")
    @extension("example", "Олег")
    @query query?: string,
    @doc("Количество возвращаемых результатов за один запрос")
    @extension("example", 10)
    @query @maxValue(200)
    limit?: int32 = 200,
    @doc("Курсор для пагинации (из meta.paginate.next_page)")
    @extension("example", "eyJpZCI6MTAsImRpciI6ImFzYyJ9")
    @query cursor?: string,
    @doc("Сортировка результатов")
    @extension("example", "by_score")
    @query sort?: SearchSortOrder,
    @doc("Направление сортировки")
    @extension("example", "desc")
    @query order?: SortOrder,
    @doc("Фильтр по дате создания (от)")
    @extension("example", "2025-01-01T00:00:00.000Z")
    @query created_from?: utcDateTime,
    @doc("Фильтр по дате создания (до)")
    @extension("example", "2025-02-01T00:00:00.000Z")
    @query created_to?: utcDateTime,
    @doc("Фильтр по ролям сотрудников")
    @extension("example", #["admin", "user"])
    @query company_roles?: UserRole[]
  ): {
    @statusCode _: 200;
    @body body: SearchPaginatedDataResponse<User[]>;
  } | {
    @statusCode _: 401;
    @body body: OAuthError;
  } | {
    @statusCode _: 402;
    @body body: ApiError;
  } | {
    @statusCode _: 403;
    @body body: OAuthError;
  } | {
    @statusCode _: 400;
    @body body: ApiError;
  };

  @extension("x-requirements", #{
    scope: "search:chats",
  })
  @doc("""
Поиск чатов

Метод для полнотекстового поиска каналов и бесед.
""")
  @route("/chats")
  @get
  searchChats(
    @doc("Текст поискового запроса")
    @extension("example", "Разработка")
    @query query?: string,
    @doc("Количество возвращаемых результатов за один запрос")
    @extension("example", 10)
    @query @maxValue(100)
    limit?: int32 = 100,
    @doc("Курсор для пагинации (из meta.paginate.next_page)")
    @extension("example", "eyJpZCI6MTAsImRpciI6ImFzYyJ9")
    @query cursor?: string,
    @doc("Направление сортировки")
    @extension("example", "desc")
    @query order?: SortOrder,
    @doc("Фильтр по дате создания (от)")
    @extension("example", "2025-01-01T00:00:00.000Z")
    @query created_from?: utcDateTime,
    @doc("Фильтр по дате создания (до)")
    @extension("example", "2025-02-01T00:00:00.000Z")
    @query created_to?: utcDateTime,
    @doc("Фильтр по активности чата")
    @extension("example", true)
    @query active?: boolean,
    @doc("Фильтр по типу чата")
    @extension("example", "discussion")
    @query chat_subtype?: ChatSubtype,
    @doc("Фильтр по личным чатам")
    @extension("example", false)
    @query personal?: boolean
  ): {
    @statusCode _: 200;
    @body body: SearchPaginatedDataResponse<Chat[]>;
  } | {
    @statusCode _: 401;
    @body body: OAuthError;
  } | {
    @statusCode _: 402;
    @body body: ApiError;
  } | {
    @statusCode _: 403;
    @body body: OAuthError;
  } | {
    @statusCode _: 400;
    @body body: ApiError;
  };

  @extension("x-requirements", #{
    scope: "search:messages",
  })
  @doc("""
Поиск сообщений

Метод для полнотекстового поиска сообщений.
""")
  @route("/messages")
  @get
  searchMessages(
    @doc("Текст поискового запроса")
    @extension("example", "футболки")
    @query query?: string,
    @doc("Количество возвращаемых результатов за один запрос")
    @extension("example", 10)
    @query @maxValue(200)
    limit?: int32 = 200,
    @doc("Курсор для пагинации (из meta.paginate.next_page)")
    @extension("example", "eyJpZCI6MTAsImRpciI6ImFzYyJ9")
    @query cursor?: string,
    @doc("Направление сортировки")
    @extension("example", "desc")
    @query order?: SortOrder,
    @doc("Фильтр по дате создания (от)")
    @extension("example", "2025-01-01T00:00:00.000Z")
    @query created_from?: utcDateTime,
    @doc("Фильтр по дате создания (до)")
    @extension("example", "2025-02-01T00:00:00.000Z")
    @query created_to?: utcDateTime,
    @doc("Фильтр по ID чатов")
    @extension("example", #[198, 334])
    @query chat_ids?: int32[],
    @doc("Фильтр по ID авторов сообщений")
    @extension("example", #[12, 185])
    @query user_ids?: int32[],
    @doc("Фильтр по активности чата")
    @extension("example", true)
    @query active?: boolean
  ): {
    @statusCode _: 200;
    @body body: SearchPaginatedDataResponse<Message[]>;
  } | {
    @statusCode _: 401;
    @body body: OAuthError;
  } | {
    @statusCode _: 402;
    @body body: ApiError;
  } | {
    @statusCode _: 403;
    @body body: OAuthError;
  } | {
    @statusCode _: 400;
    @body body: ApiError;
  };
}

// ============================================================================
// Task Operations
// ============================================================================

@route("/tasks")
@tag("Tasks")
interface TaskOperations {
  @extension("x-requirements", #{
    scope: "tasks:create",
  })
  @doc("""
Новое напоминание

Метод для создания нового напоминания.

При создании напоминания обязательным условием является указания типа напоминания: звонок, встреча, простое напоминание, событие или письмо. При этом не требуется дополнительное описание - вы просто создадите напоминание с соответствующим текстом. Если вы укажите описание напоминания - то именно оно и станет текстом напоминания.

У напоминания должны быть ответственные, если их не указывать - ответственным назначается вы.

Ответственным для напоминания без привязки к каким-либо сущностям может стать любой сотрудник компании. Актуальный состав сотрудников компании вы можете получить в методе [список сотрудников](GET /users).

Напоминание можно привязать к чату, указав `chat_id`. Для привязки к чату необходимо быть его участником.
""")
  @post
  createTask(@body request: TaskCreateRequest): {
    @statusCode _: 201;
    @body body: DataResponse<Task>;
  } | {
    @statusCode _: 401;
    @body body: OAuthError;
  } | {
    @statusCode _: 403;
    @body body: OAuthError;
  } | {
    @statusCode _: 404;
    @body body: ApiError;
  } | {
    @statusCode _: 400;
    @body body: ApiError;
  } | {
    @statusCode _: 422;
    @body body: ApiError;
  };

  @extension("x-requirements", #{
    scope: "tasks:read",
  })
  @doc("""
Список напоминаний

Метод для получения списка напоминаний.
""")
  @get
  listTasks(
    @doc("Количество возвращаемых сущностей за один запрос")
    @query
    @extension("example", 1)
    @minValue(1)
    @maxValue(50)
    limit?: int32 = 50,
    @doc("Курсор для пагинации (из `meta.paginate.next_page`)")
    @extension("example", "eyJpZCI6MTAsImRpciI6ImFzYyJ9")
    @query cursor?: string
  ): {
    @statusCode _: 200;
    @body body: PaginatedDataResponse<Task[]>;
  } | {
    @statusCode _: 401;
    @body body: OAuthError;
  } | {
    @statusCode _: 403;
    @body body: OAuthError;
  } | {
    @statusCode _: 400;
    @body body: ApiError;
  };

  @extension("x-requirements", #{
    scope: "tasks:read",
  })
  @doc("""
Информация о напоминании

Метод для получения информации о напоминании.

Для получения напоминания вам необходимо знать его `id` и указать его в `URL` запроса.
""")
  @route("/{id}")
  @get
  getTask(
    @doc("Идентификатор напоминания")
    @extension("example", 22283)
    @path id: int32
  ): {
    @statusCode _: 200;
    @body body: DataResponse<Task>;
  } | {
    @statusCode _: 401;
    @body body: OAuthError;
  } | {
    @statusCode _: 403;
    @body body: OAuthError;
  } | {
    @statusCode _: 404;
    @body body: ApiError;
  };

  @extension("x-requirements", #{
    scope: "tasks:update",
  })
  @doc("""
Редактирование напоминания

Метод для редактирования напоминания.

Для редактирования напоминания вам необходимо знать его `id` и указать его в `URL` запроса. Все редактируемые параметры напоминания указываются в теле запроса.
""")
  @put
  updateTask(
    @doc("Идентификатор напоминания")
    @extension("example", 22283)
    @path id: int32,
    @body request: TaskUpdateRequest
  ): {
    @statusCode _: 200;
    @body body: DataResponse<Task>;
  } | {
    @statusCode _: 401;
    @body body: OAuthError;
  } | {
    @statusCode _: 403;
    @body body: OAuthError;
  } | {
    @statusCode _: 404;
    @body body: ApiError;
  } | {
    @statusCode _: 400;
    @body body: ApiError;
  } | {
    @statusCode _: 422;
    @body body: ApiError;
  };

  @extension("x-requirements", #{
    scope: "tasks:delete",
  })
  @doc("""
Удаление напоминания

Метод для удаления напоминания.

Для удаления напоминания вам необходимо знать его `id` и указать его в `URL` запроса.
""")
  @delete

  deleteTask(
    @doc("Идентификатор напоминания")
    @extension("example", 22283)
    @path id: int32
  ): {
    @statusCode _: 204;

  } | {
    @statusCode _: 401;
    @body body: OAuthError;
  } | {
    @statusCode _: 403;
    @body body: OAuthError;
  } | {
    @statusCode _: 404;
    @body body: ApiError;
  };
}

// ============================================================================
// Form Operations
// ============================================================================

@route("/views")
@tag("Views")
interface FormOperations {
  @extension("x-requirements", #{
    scope: "views:write",
  })
  @doc("""
Открытие представления

Метод для открытия модального окна с представлением для пользователя.

Чтобы открыть модальное окно с представлением, ваше приложение должно иметь действительный, неистекший `trigger_id`.
""")
  @route("/open")
  @post
  openView(@body request: OpenViewRequest): {
    @statusCode _: 201;

  } | {
    @statusCode _: 401;
    @body body: OAuthError;
  } | {
    @statusCode _: 403;
    @body body: OAuthError;
  } | {
    @statusCode _: 400;
    @body body: ApiError;
  } | {
    @statusCode _: 422;
    @body body: ApiError;
  } | {
    @statusCode _: 410;
    @body body: ApiError;
  };
}

// ============================================================================
// Bot Operations
// ============================================================================

@tag("Bots")
interface BotOperations {
  @extension("x-requirements", #{
    scope: "bots:write",
  })
  @doc("""
Редактирование бота

Метод для редактирования бота.

Для редактирования бота вам необходимо знать его `user_id` и указать его в `URL` запроса. Все редактируемые параметры бота указываются в теле запроса. Узнать `user_id` бота можно в настройках бота во вкладке «API».

Вы не можете редактировать бота, настройки которого вам недоступны (поле «Кто может редактировать настройки бота» находится во вкладке «Основное» в настройках бота).
""")
  @route("/bots/{id}")
  @put
  updateBot(
    @doc("Идентификатор бота")
    @extension("example", 1738816)
    @path id: int32,
    @body request: BotUpdateRequest
  ): {
    @statusCode _: 200;
    @body body: DataResponse<BotResponse>;
  } | {
    @statusCode _: 401;
    @body body: OAuthError;
  } | {
    @statusCode _: 403;
    @body body: OAuthError;
  } | {
    @statusCode _: 404;
    @body body: ApiError;
  } | {
    @statusCode _: 400;
    @body body: ApiError;
  } | {
    @statusCode _: 422;
    @body body: ApiError;
  };
  
  @extension("x-requirements", #{
    scope: "webhooks:events:read",
  })
  @doc("""
История событий

Метод для получения истории последних событий бота. Данный метод будет полезен, если вы не можете получать события в реальном времени на ваш `URL`, но вам требуется обрабатывать все события, на которые вы подписались.

История событий сохраняется только при активном пункте «Сохранять историю событий» во вкладке «Исходящий webhook» настроек бота. При этом указывать «Webhook `URL`» не требуется.

Для получения истории событий конкретного бота вам необходимо знать его `access_token` и использовать его при запросе. Каждое событие представляет `JSON` объект вебхука.
""")
  @route("/webhooks/events")
  @get
  getWebhookEvents(
    @doc("Количество возвращаемых сущностей за один запрос")
    @query
    @extension("example", 1)
    @minValue(1)
    @maxValue(50)
    limit?: int32 = 50,
    
    @doc("Курсор для пагинации (из meta.paginate.next_page)")
    @extension("example", "eyJpZCI6MTAsImRpciI6ImFzYyJ9")
    @query cursor?: string
  ): {
    @statusCode _: 200;
    @body body: PaginatedDataResponse<WebhookEvent[]>;
  } | {
    @statusCode _: 401;
    @body body: OAuthError;
  } | {
    @statusCode _: 403;
    @body body: OAuthError;
  } | {
    @statusCode _: 400;
    @body body: ApiError;
  } | {
    @statusCode _: 422;
    @body body: ApiError;
  };
  
  @extension("x-requirements", #{
    scope: "webhooks:events:delete",
  })
  @doc("""
Удаление события

Данный метод доступен для работы только с `access_token` бота

Метод для удаления события из истории событий бота.

Для удаления события вам необходимо знать `access_token` бота, которому принадлежит событие, и `id` события.
""")
  @route("/webhooks/events/{id}")
  @delete

  deleteWebhookEvent(
    @doc("Идентификатор события")
    @extension("example", "01KAJZ2XDSS2S3DSW9EXJZ0TBV")
    @path id: string
  ): {
    @statusCode _: 204;

  } | {
    @statusCode _: 401;
    @body body: OAuthError;
  } | {
    @statusCode _: 403;
    @body body: OAuthError;
  } | {
    @statusCode _: 404;
    @body body: ApiError;
  };
}

// ============================================================================
// Security Operations
// ============================================================================

@route("/audit_events")
@tag("Security")
interface SecurityOperations {
  @extension("x-requirements", #{
    scope: "audit_events:read",
    plan: "corporation",
  })
  @doc("""
Журнал аудита событий

Метод для получения логов событий на основе указанных фильтров.
""")
  @get
  getAuditEvents(
    @doc("Начальная метка времени (включительно)")
    @extension("example", "2025-05-01T09:11:00Z")
    @query start_time: utcDateTime,
    
    @doc("Конечная метка времени (исключительно)")
    @extension("example", "2025-05-02T09:11:00Z")
    @query end_time: utcDateTime,
    
    @doc("Фильтр по конкретному типу события")
    @extension("example", "user_login")
    @query event_key?: AuditEventKey,
    
    @doc("Идентификатор пользователя, выполнившего действие")
    @extension("example", "98765")
    @query actor_id?: string,

    @doc("Тип актора")
    @extension("example", "User")
    @query actor_type?: string,

    @doc("Идентификатор затронутой сущности")
    @extension("example", "98765")
    @query entity_id?: string,

    @doc("Тип сущности")
    @extension("example", "User")
    @query entity_type?: string,

    @doc("Количество записей для возврата")
    @query
    @extension("example", 1)
    @maxValue(50)
    limit?: int32 = 50,
    
    @doc("Курсор для пагинации из meta.paginate.next_page")
    @extension("example", "eyJpZCI6MTAsImRpciI6ImFzYyJ9")
    @query cursor?: string
  ): {
    @statusCode _: 200;
    @body body: PaginatedDataResponse<AuditEvent[]>;
  } | {
    @statusCode _: 401;
    @body body: OAuthError;
  } | {
    @statusCode _: 403;
    @body body: OAuthError;
  } | {
    @statusCode _: 400;
    @body body: ApiError;
  } | {
    @statusCode _: 422;
    @body body: ApiError;
  };
}

@route("/oauth/token/info")
@tag("Profile")
interface OAuthOperations {
  @doc("""
Информация о токене

Метод для получения информации о текущем OAuth токене, включая его скоупы, дату создания и последнего использования. Токен в ответе маскируется — видны только первые 8 и последние 4 символа.
""")
  @get
  getTokenInfo(): {
    @statusCode _: 200;
    @body body: DataResponse<AccessTokenInfo>;
  } | {
    @statusCode _: 401;
    @body body: OAuthError;
  };
}
