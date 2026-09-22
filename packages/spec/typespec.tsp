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
  version: "1.0.0",
})
@server("https://api.pachca.com/api/shared/v1", "Production server")
@useAuth(BearerAuth)
namespace PachcaAPI;

// ============================================================================
// Common Types
// ============================================================================

/** Массив названий тегов */
@example(#["Design", "iOS"])
@maxItems(100)
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
  audio: "Аудиофайл",
  voice: "Голосовое сообщение",
  video: "Видеофайл",
})
enum FileType {
  @doc("Обычный файл")
  file: "file",

  @doc("Изображение")
  image: "image",

  @doc("Аудиофайл")
  audio: "audio",

  @doc("Голосовое сообщение")
  voice: "voice",

  @doc("Видеофайл")
  video: "video",
}

@doc("Что отдать вместо исходного файла")
@extension("x-enum-descriptions", #{
  pdf_preview: "Документ, переведённый в PDF",
  pdf_first_page: "Первая страница документа картинкой",
  thumb: "Уменьшенная копия изображения",
  image: "Изображение как есть",
})
enum FileTarget {
  @doc("Документ, переведённый в PDF")
  pdf_preview: "pdf_preview",

  @doc("Первая страница документа картинкой")
  pdf_first_page: "pdf_first_page",

  @doc("Уменьшенная копия изображения")
  thumb: "thumb",

  @doc("Изображение как есть")
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

@doc("Роль пользователя, допустимая при редактировании сотрудника. Роль `guest` недоступна для установки через API при редактировании — назначить роль `guest` можно только при создании сотрудника (см. `UserCreateRole`).")
@extension("x-enum-descriptions", #{
  admin: "Администратор",
  user: "Сотрудник",
  multi_guest: "Мульти-гость",
})
enum UserRoleInput {
  @doc("Администратор")
  admin: "admin",

  @doc("Сотрудник")
  user: "user",

  @doc("Мульти-гость")
  multi_guest: "multi_guest",
}

@doc("Роль пользователя, допустимая при создании сотрудника. В отличие от редактирования, при создании можно назначить роль `guest` — в этом случае параметр `chat_ids` обязателен и должен содержать ровно один чат.")
@extension("x-enum-descriptions", #{
  admin: "Администратор",
  user: "Сотрудник",
  multi_guest: "Мульти-гость",
  guest: "Гость",
})
enum UserCreateRole {
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

@doc("Сортировка результатов поиска сообщений")
@extension("x-enum-descriptions", #{
  created_at: "По дате создания (хронология)",
  relevance: "По релевантности",
})
enum MessageSearchSort {
  created_at: "created_at",
  relevance: "relevance",
}

@doc("Поле сортировки чатов")
@extension("x-enum-descriptions", #{
  id: "По идентификатору чата",
  last_message_at: "По дате и времени создания последнего сообщения",
})
enum ChatSortField {
  @doc("По идентификатору чата")
  id: "id",

  @doc("По дате и времени создания последнего сообщения")
  last_message_at: "last_message_at",
}

@doc("Поле сортировки сообщений")
@extension("x-enum-descriptions", #{
  id: "По идентификатору сообщения",
})
enum MessageSortField {
  @doc("По идентификатору сообщения")
  id: "id",
}

@doc("Сортировка результатов поиска")
@extension("x-enum-descriptions", #{
  by_score: "По релевантности",
  alphabetical: "По алфавиту",
  creation: "По дате создания",
})
enum SearchSortOrder {
  @doc("По релевантности")
  by_score: "by_score",

  @doc("По алфавиту")
  alphabetical: "alphabetical",

  @doc("По дате создания")
  creation: "creation",
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

@doc("Состояние чатов в выборке")
@extension("x-enum-descriptions", #{
  active: "Только активные чаты",
  archived: "Только архивные чаты",
})
enum ChatActivity {
  @doc("Только активные чаты")
  active: "active",

  @doc("Только архивные чаты")
  archived: "archived",
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
  
  @doc("Напоминание")
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
  already_exists: "Объект с такими данными уже есть. Конфликтующее поле приходит в key, если его удалось определить",
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
  use_of_system_words: "Использовано зарезервированное системное слово (here, all)",
  export_file_not_found: "Файл экспорта не найден или ещё не готов",
  cannot_kick_owner: "Нельзя исключить владельца чата",
  pin_failed: "Не удалось закрепить сообщение",
  message_deleted: "Сообщение удалено",
  thread_message: "Нельзя создать тред для сообщения, которое уже находится в треде",
  view_not_found: "Представление не найдено или принадлежит другому боту",
  submit_expired: "Время на ответ об отправке формы истекло или ответ уже был принят",
  service_unavailable: "Сервис временно недоступен, повторите запрос",
  next_send_at_invalid: "Ближайшая отправка отложенного сообщения приходится на прошлое",
  schedule_invalid: "Расписание отложенного сообщения не складывается в повтор",
  schedule_end_date_invalid: "Расписание заканчивается раньше ближайшей отправки",
  scheduled_messages_limit: "Превышен лимит отложенных сообщений на чат (50)",
  draft_type_change_forbidden: "Отложенное сообщение нельзя превратить обратно в черновик",
  confidential_download_denied: "Скачивание файла запрещено: нужен запрос из безопасного контура",
  decryption_failed: "Не удалось расшифровать файл",
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

  @doc("Ближайшая отправка отложенного сообщения приходится на прошлое")
  next_send_at_invalid: "next_send_at_invalid",

  @doc("Расписание отложенного сообщения не складывается в повтор")
  schedule_invalid: "schedule_invalid",

  @doc("Расписание заканчивается раньше ближайшей отправки")
  schedule_end_date_invalid: "schedule_end_date_invalid",

  @doc("Превышен лимит отложенных сообщений на чат (50)")
  scheduled_messages_limit: "scheduled_messages_limit",

  @doc("Отложенное сообщение нельзя превратить обратно в черновик")
  draft_type_change_forbidden: "draft_type_change_forbidden",

  @doc("Скачивание файла запрещено: нужен запрос из безопасного контура")
  confidential_download_denied: "confidential_download_denied",

  @doc("Не удалось расшифровать файл")
  decryption_failed: "decryption_failed",

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

  @doc("Использовано зарезервированное системное слово (here, all)")
  use_of_system_words: "use_of_system_words",

  @doc("Файл экспорта не найден или ещё не готов")
  export_file_not_found: "export_file_not_found",

  @doc("Нельзя исключить владельца чата")
  cannot_kick_owner: "cannot_kick_owner",

  @doc("Не удалось закрепить сообщение")
  pin_failed: "pin_failed",

  @doc("Сообщение удалено")
  message_deleted: "message_deleted",

  @doc("Нельзя создать тред для сообщения, которое уже находится в треде")
  thread_message: "thread_message",

  @doc("Представление не найдено или принадлежит другому боту")
  view_not_found: "view_not_found",

  @doc("Время на ответ об отправке формы истекло или ответ уже был принят")
  submit_expired: "submit_expired",

  @doc("Сервис временно недоступен, повторите запрос")
  service_unavailable: "service_unavailable",
}

@doc("Тип аудит-события")
@extension("x-enum-descriptions", #{
  user_login: "Пользователь успешно вошел в систему",
  user_logout: "Пользователь вышел из системы",
  user_2fa_fail: "Неудачная попытка двухфакторной аутентификации",
  user_2fa_success: "Успешная двухфакторная аутентификация",
  user_2fa_disabled: "Двухфакторная аутентификация отключена у сотрудника",
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
  company_chats_accessed: "Получен список всех чатов пространства",
  company_bots_accessed: "Получен список всех ботов пространства",
  dlp_violation_detected: "Срабатывание правила DLP-системы",
  search_users_api: "Поиск сотрудников через API",
  search_chats_api: "Поиск чатов через API",
  search_messages_api: "Поиск сообщений через API",
  bot_scopes_updated: "Изменены скоупы токена бота",
  bot_webhook_settings_updated: "Изменены настройки исходящего вебхука бота",
  bot_token_recreated: "Токен бота перевыпущен (ротация)",
  bot_deleted: "Бот удалён",
  bot_oauth_client_updated: "Изменены параметры OAuth-клиента бота",
  oauth_authorization_granted: "Пользователь выдал OAuth-клиенту доступ к своим данным",
  oauth_authorization_revoked: "Доступ OAuth-клиента к данным пользователя отозван",
  oauth_device_authorization_approved: "Сотрудник подтвердил вход приложения с устройства",
  oauth_device_authorization_denied: "Сотрудник отклонил вход приложения с устройства",
  video_call_started: "Видеозвонок начат",
  video_call_finished: "Видеозвонок завершён",
  video_call_recording_ready: "Запись видеозвонка готова",
  exchange_disabled: "Отключена интеграция с Exchange",
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

  @doc("Двухфакторная аутентификация отключена у сотрудника")
  user_2fa_disabled: "user_2fa_disabled",

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

  @doc("Получен список всех чатов пространства")
  company_chats_accessed: "company_chats_accessed",

  @doc("Получен список всех ботов пространства")
  company_bots_accessed: "company_bots_accessed",

  @doc("Срабатывание правила DLP-системы")
  dlp_violation_detected: "dlp_violation_detected",

  @doc("Поиск сотрудников через API")
  search_users_api: "search_users_api",

  @doc("Поиск чатов через API")
  search_chats_api: "search_chats_api",

  @doc("Поиск сообщений через API")
  search_messages_api: "search_messages_api",

  @doc("Изменены скоупы токена бота")
  bot_scopes_updated: "bot_scopes_updated",

  @doc("Изменены настройки исходящего вебхука бота")
  bot_webhook_settings_updated: "bot_webhook_settings_updated",

  @doc("Токен бота перевыпущен (ротация)")
  bot_token_recreated: "bot_token_recreated",

  @doc("Бот удалён")
  bot_deleted: "bot_deleted",

  @doc("Изменены параметры OAuth-клиента бота")
  bot_oauth_client_updated: "bot_oauth_client_updated",

  @doc("Пользователь выдал OAuth-клиенту доступ к своим данным")
  oauth_authorization_granted: "oauth_authorization_granted",

  @doc("Доступ OAuth-клиента к данным пользователя отозван")
  oauth_authorization_revoked: "oauth_authorization_revoked",

  @doc("Сотрудник подтвердил вход приложения с устройства")
  oauth_device_authorization_approved: "oauth_device_authorization_approved",

  @doc("Сотрудник отклонил вход приложения с устройства")
  oauth_device_authorization_denied: "oauth_device_authorization_denied",

  @doc("Видеозвонок начат")
  video_call_started: "video_call_started",

  @doc("Видеозвонок завершён")
  video_call_finished: "video_call_finished",

  @doc("Запись видеозвонка готова")
  video_call_recording_ready: "video_call_recording_ready",

  @doc("Отключена интеграция с Exchange")
  exchange_disabled: "exchange_disabled",
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
  @maxLength(32)
  @example("Город")
  name: string;
  
  @doc("Тип поля")
  @example(CustomPropertyDataType.string)
  data_type: CustomPropertyDataType;

  @doc("Значение. Возвращается `null`, если поле не заполнено. Число передаётся строкой, дата — в формате ISO 8601.")
  @maxLength(768)
  @example("Санкт-Петербург")
  value: string | null;
}

@doc("Дополнительное поле")
model CustomPropertyDefinition {
  @doc("Идентификатор поля")
  @example(1678)
  id: int32;

  @doc("Название поля")
  @maxLength(32)
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
  @maxLength(50)
  @example("Очень занят")
  title: string;

  @doc("Срок жизни статуса (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ. `null`, если срок не задан — такой статус не сбрасывается автоматически.")
  @example(utcDateTime.fromISO("2024-04-08T10:00:00.000Z"))
  expires_at: utcDateTime | null;

  @doc("Режим «Нет на месте»")
  @example(false)
  is_away: boolean;

  @doc("Сообщение при режиме «Нет на месте». Отображается в профиле пользователя, а также при отправке ему личного сообщения или упоминании в чате. `null`, если текст не задан.")
  away_message: {
    @doc("Текст сообщения")
    @maxLength(1024)
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
  
  @doc("Ссылка на скачивание файла. Обычно ведёт прямо в хранилище и действует до 7 дней, а оставшийся срок может быть меньше — если такая ссылка вернула `403`, запросите сообщение заново и получите свежую. Если в пространстве включено шифрование или задан безопасный контур, ссылка ведёт на [Скачивание файла](GET /files/{id}): забирать такой файл нужно с заголовком `Authorization`, а токену нужен скоуп `files:read`.")
  @example("https://pachca-prod-uploads.s3.storage.selcloud.ru/attaches/files/12/21zu7934-02e1-44d9-8df2-0f970c259796/congrat.png?response-cache-control=max-age%3D3600%3B&response-content-disposition=attachment&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=142155_staply%2F20231107%2Fru-1a%2Fs3%2Faws4_request&X-Amz-Date=20231107T160412&X-Amz-Expires=604800&X-Amz-SignedHeaders=host&X-Amz-Signature=98765asgfadsfdSaDSd4sdfg35asdf67sadf8")
  url: string;
  
  @doc("Ширина изображения в пикселях. `null` для файлов, не являющихся изображением, а также если размер не был передан при загрузке.")
  @example(1920)
  width?: int32 | null;
  
  @doc("Высота изображения в пикселях. `null` для файлов, не являющихся изображением, а также если размер не был передан при загрузке.")
  @example(1080)
  height?: int32 | null;

  @doc("Длительность в миллисекундах у голосового, аудио- и видеофайла. `null` у остальных файлов и если длительность не была передана при загрузке.")
  @example(5400)
  duration_ms?: int32 | null;
}

@doc("Кнопка")
model Button {
  @doc("Текст, отображаемый на кнопке")
  @example("Подробнее")
  @maxLength(255)
  text: string;

  @doc("Ссылка, которая будет открыта по нажатию кнопки. У кнопки должно быть заполнено ровно одно из полей `url` и `data`.")
  @example("https://example.com/details")
  @maxLength(1024)
  url?: string;

  @doc("Данные, которые будут отправлены в исходящем вебхуке по нажатию кнопки. У кнопки должно быть заполнено ровно одно из полей `url` и `data`.")
  @example("awesome")
  @maxLength(255)
  data?: string;
}

@doc("Тред")
model Thread {
  @doc("Идентификатор созданного треда (в тред пишут методом [Новое сообщение](POST /messages))")
  @example(265142)
  id: int64;
  
  @doc("Идентификатор чата треда (по нему пишут в тред методом [Новое сообщение](POST /messages) и читают его методом [Список сообщений чата](GET /messages))")
  @example(2637266155)
  chat_id: int64;
  
  @doc("Идентификатор сообщения, к которому был создан тред. `null` для самостоятельного треда, созданного без привязки к сообщению.")
  @example(154332686)
  message_id: int64 | null;

  @doc("Идентификатор чата сообщения. `null` для самостоятельного треда, созданного без привязки к сообщению.")
  @example(2637266154)
  message_chat_id: int64 | null;
  
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

  @doc("Идентификатор сообщения, к которому был создан тред, в котором находится оригинальное сообщение. `null`, если оригинальное сообщение было не в треде или тред создан без привязки к сообщению.")
  @example(null)
  original_thread_message_id: int32 | null;

  @doc("Идентификатор чата сообщения, к которому был создан тред, в котором находится оригинальное сообщение. `null`, если оригинальное сообщение было не в треде или тред создан без привязки к сообщению.")
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
  
  @doc("Имя. Возвращается `null`, пока приглашённый сотрудник не завершил регистрацию (`invite_status` со значением `sent`).")
  @maxLength(255)
  @example("Олег")
  first_name: string | null;
  
  @doc("Фамилия. Если не заполнена, возвращается `null` или пустая строка.")
  @maxLength(255)
  @example("Петров")
  last_name: string | null;

  @doc("Имя пользователя")
  @maxLength(255)
  @example("olegpetrov")
  nickname: string;

  @doc("Электронная почта. В чужой карточке приходит `null`, если у вызывающего нет права видеть персональные данные: у владельца пространства и администратора оно есть всегда, у сотрудника и бота — только когда в пространстве включён показ персональных данных, у гостя — никогда. В своей карточке поле приходит всегда.")
  @maxLength(255)
  @example("olegp@example.com")
  email: string | null;

  @doc("Телефон. В чужой карточке приходит `null`, если у вызывающего нет права видеть персональные данные: у владельца пространства и администратора оно есть всегда, у сотрудника и бота — только когда в пространстве включён показ персональных данных, у гостя — никогда. В своей карточке поле приходит всегда.")
  @maxLength(255)
  @example("+79001234567")
  phone_number: string | null;

  @doc("Департамент. Если не указан, возвращается `null` или пустая строка.")
  @maxLength(255)
  @example("Продукт")
  department: string | null;

  @doc("Должность. Если не указана, возвращается `null` или пустая строка.")
  @example("CIO")
  title: string | null;
  
  @doc("Уровень доступа")
  @example(UserRole.admin)
  role: UserRole;
  
  @doc("Деактивация пользователя")
  @example(false)
  suspended: boolean;
  
  @doc("Статус приглашения")
  @example(InviteStatus.confirmed)
  invite_status: InviteStatus;

  @doc("Идентификатор сотрудника, который пригласил данного сотрудника. Возвращает `null`, если сотрудник зарегистрировался самостоятельно или если пригласивший сотрудник был удалён.")
  @example(185)
  inviter_id: int32 | null;

  @doc("Массив тегов, привязанных к сотруднику")
  @example(#["Product", "Design"])
  list_tags: string[];
  
  @doc("Дополнительные поля сотрудника")
  custom_properties: CustomProperty[];
  
  @doc("Статус. `null`, если у сотрудника не установлен статус.")
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
  
  @doc("Дата последней активности пользователя (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ. `null`, если сотрудник ещё ни разу не заходил в Пачку — в этом случае `invite_status` возвращает `sent`.")
  @example(utcDateTime.fromISO("2025-01-20T13:40:07.000Z"))
  last_activity_at: utcDateTime | null;

  @doc("Часовой пояс пользователя. `null`, если сотрудник не задал личный часовой пояс — тогда применяется часовой пояс компании.")
  @maxLength(32)
  @example("Europe/Moscow")
  time_zone: string | null;
  
  @doc("Ссылка на скачивание аватарки пользователя. `null`, если аватарка не загружена.")
  @example("https://app.pachca.com/users/12/photo.jpg")
  image_url: string | null;
}

@doc("Чат")
model Chat {
  @doc("Идентификатор созданного чата")
  @example(334)
  id: int32;
  
  @doc("Название")
  @maxLength(255)
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

  @doc("Находится в архиве")
  @example(false)
  archived: boolean;

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

@doc("Данные голосового сообщения")
model VoiceContent {
  @doc("Длительность голосового сообщения в миллисекундах")
  @example(5400)
  duration_ms: int32;

  @doc("Форма волны (амплитуды) для визуализации голосового сообщения")
  @example("4,8,12,20,16,10,6,3")
  waveform: string;

  @doc("Расшифровка голосового сообщения в текст. `null`, пока расшифровка не готова или недоступна.")
  @example("Привет, посмотри пожалуйста последний отчёт")
  transcript: string | null;
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

  @doc("Данные голосового сообщения. Заполняется только для голосовых сообщений (`file_type` файла — `voice`), иначе `null`.")
  voice_content: VoiceContent | null;

  @doc("Массив строк, каждая из которых представлена массивом кнопок. `null`, если сообщение отправлено без кнопок.")
  buttons: Button[][] | null;
  
  @doc("Тред, созданный к этому сообщению. `null`, если тред не создан, а также у сообщений, которые сами находятся внутри треда.")
  thread: {
    @doc("Идентификатор треда")
    @example(265142)
    id: int64;

    @doc("Идентификатор чата треда")
    @example(2637266155)
    chat_id: int64;
  } | null;
  
  @doc("Информация о пересланном сообщении. `null`, если сообщение не является пересланным.")
  forwarding: Forwarding | null;
  
  @doc("Идентификатор сообщения, к которому написан ответ. `null`, если сообщение не является ответом на другое сообщение.")
  @example(null)
  parent_message_id: int32 | null;

  @doc("Ссылка на аватарку отправителя сообщения. Поле присутствует только у сообщений от ботов; у сообщений от сотрудников его в ответе нет. `null`, если бот не переопределял значение при отправке.")
  @example(null)
  display_avatar_url?: string | null;

  @doc("Полное имя отправителя сообщения. Поле присутствует только у сообщений от ботов; у сообщений от сотрудников его в ответе нет. `null`, если бот не переопределял значение при отправке.")
  @example(null)
  display_name?: string | null;

  @doc("Дата и время последнего изменения сообщения (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ. У неотредактированного сообщения совпадает с датой создания. `null` у сообщений, отправленных до появления этого поля.")
  @example(utcDateTime.fromISO("2021-08-28T16:10:00.000Z"))
  changed_at: utcDateTime | null;

  @doc("Дата и время удаления сообщения (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ. `null` у неудалённых сообщений. В списке сообщений удалённые не возвращаются.")
  @example(null)
  deleted_at: utcDateTime | null;
}

@doc("Тег")
model GroupTag {
  @doc("Идентификатор тега")
  @example(9111)
  id: int32;
  
  @doc("Название тега")
  @maxLength(255)
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
  name: string;
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

  @doc("Срок выполнения напоминания (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ. `null`, если срок не задан.")
  @example(utcDateTime.fromISO("2020-06-05T09:00:00.000Z"))
  due_at: utcDateTime | null;

  @doc("Приоритет")
  @example(2)
  priority: int32;

  @doc("Идентификатор пользователя-создателя напоминания")
  @example(12)
  user_id: int32;

  @doc("Идентификатор чата, к которому привязано напоминание. `null`, если напоминание не привязано к чату.")
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

@doc("Что возвращать в списке черновиков")
@extension("x-enum-descriptions", #{
  regular: "Обычные черновики",
  scheduled: "Отложенные сообщения",
  all: "И черновики, и отложенные сообщения",
})
enum DraftType {
  @doc("Обычные черновики")
  regular: "regular",

  @doc("Отложенные сообщения")
  scheduled: "scheduled",

  @doc("И черновики, и отложенные сообщения")
  all: "all",
}

@doc("Периодичность повтора отложенного сообщения")
@extension("x-enum-descriptions", #{
  once: "Один раз",
  daily: "Каждый день",
  weekly: "Каждую неделю",
  monthly: "Каждый месяц",
  every_2_months: "Раз в два месяца",
  every_3_months: "Раз в три месяца",
  every_4_months: "Раз в четыре месяца",
  every_6_months: "Раз в полгода",
  yearly: "Раз в год",
})
enum DraftRepetitionInterval {
  @doc("Один раз")
  once: "once",

  @doc("Каждый день")
  daily: "daily",

  @doc("Каждую неделю")
  weekly: "weekly",

  @doc("Каждый месяц")
  monthly: "monthly",

  @doc("Раз в два месяца")
  every_2_months: "every_2_months",

  @doc("Раз в три месяца")
  every_3_months: "every_3_months",

  @doc("Раз в четыре месяца")
  every_4_months: "every_4_months",

  @doc("Раз в полгода")
  every_6_months: "every_6_months",

  @doc("Раз в год")
  yearly: "yearly",
}

@doc("Правило повтора отложенного сообщения")
model DraftRepetition {
  @doc("Периодичность")
  @example(DraftRepetitionInterval.weekly)
  interval: DraftRepetitionInterval;

  @doc("Дни недели, по которым уходит сообщение: 0 — воскресенье, 6 — суббота. Приходит только при периодичности `weekly`.")
  @example(#[1, 3])
  days?: int32[];

  @doc("Какой по счёту день недели в месяце: от 1 до 4 — первый, второй, третий, четвёртый, 5 — последний. Приходит только при периодичности по месяцам, а `null` в ней означает повтор по числу месяца из `start_date`.")
  @example(2)
  nth_day?: int32 | null;
}

@doc("Расписание отправки отложенного сообщения")
model DraftSchedule {
  @doc("Первая отправка (ISO-8601). Из неё берутся время суток, число месяца и день недели, по которым дальше строится повтор.")
  @example(utcDateTime.fromISO("2026-09-17T12:00:00.000Z"))
  start_date: utcDateTime;

  @doc("Дата, после которой повтор прекращается (ISO-8601). `null`, если конец не задан.")
  @example(utcDateTime.fromISO("2026-12-31T12:00:00.000Z"))
  end_date: utcDateTime | null;

  @doc("Правило повтора")
  repetition: DraftRepetition;
}

@doc("Черновик или отложенное сообщение")
model Draft {
  @doc("Идентификатор черновика")
  @example(4821)
  id: int32;

  @doc("Куда уйдёт сообщение: в беседу или канал, в тред либо в личную переписку с сотрудником")
  @example(MessageEntityType.discussion)
  entity_type: MessageEntityType | null;

  @doc("Идентификатор того, что названо в `entity_type`: беседы или канала, треда либо сотрудника")
  @example(334)
  entity_id: int32 | null;

  @doc("Идентификатор чата, в котором лежит черновик. У черновика треда это чат самого треда.")
  @example(334)
  chat_id: int32 | null;

  @doc("Текст черновика. У черновика из одних вложений приходит пустая строка, а не `null`.")
  @example("Отчёт за неделю: продажи выросли на 10%")
  content: string;

  @doc("Идентификатор сообщения, ответом на которое уйдёт черновик. `null`, если это не ответ.")
  @example(196093)
  parent_message_id: int32 | null;

  @doc("Прикреплённые файлы")
  files: File[];

  @doc("Голосовое сообщение. `null`, если голосового вложения нет. Расшифровка в `transcript` у черновика всегда `null` — она запускается после отправки.")
  voice_content: VoiceContent | null;

  @doc("Расписание отправки. `null` у обычного черновика.")
  schedule: DraftSchedule | null;

  @doc("Ближайшая отправка (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ. `null` у обычного черновика.")
  @example(utcDateTime.fromISO("2026-09-17T12:00:00.000Z"))
  next_send_at: utcDateTime | null;

  @doc("Дата и время создания (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ")
  @example(utcDateTime.fromISO("2026-09-16T10:00:00.000Z"))
  created_at: utcDateTime;

  @doc("Дата и время последнего изменения (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ")
  @example(utcDateTime.fromISO("2026-09-16T10:00:00.000Z"))
  updated_at: utcDateTime;
}

// ============================================================================
// Request/Response Models
// ============================================================================

@doc("Метаданные пагинации")
model PaginationMeta {
  @doc("Вспомогательная информация")
  paginate: {
    @doc("Курсор пагинации следующей страницы")
    @example("eyJxZCO2MiwiZGlyIjomSNYjIn3")
    next_page: string;

    @doc("Курсор пагинации предыдущей страницы. Используется для polling новых записей «сверху» списка.")
    @example("eyJxZCO2MiwiZGlyIjoiYXNjIn0")
    prev_page?: string;

    @doc("Есть ли ещё данные на следующей странице. На последней странице — `false`.")
    @example(true)
    has_next?: boolean;

    @doc("Есть ли ещё данные на предыдущей странице. На первом запросе без курсора — `false`.")
    @example(false)
    has_prev?: boolean;
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
  meta: PaginationMeta;
}


@doc("Данные аватара")
model AvatarData {
  @doc("URL аватара")
  @example("https://pachca-prod.s3.amazonaws.com/uploads/0001/0001/image.jpg")
  image_url: string;
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
  bots_read: "Просмотр ботов",
  bots_write: "Управление ботами",
  bot_self_webhook_write: "Самостоятельное управление адресом вебхука бота",
  bot_self_write: "Самостоятельное управление настройками бота",
  profile_read: "Просмотр информации о своем профиле",
  profile_status_read: "Просмотр статуса профиля",
  profile_status_write: "Изменение и удаление статуса профиля",
  profile_avatar_write: "Изменение и удаление аватара профиля",
  user_status_read: "Просмотр статуса сотрудника",
  user_status_write: "Изменение и удаление статуса сотрудника",
  user_avatar_write: "Изменение и удаление аватара сотрудника",
  custom_properties_read: "Просмотр дополнительных полей",
  audit_events_read: "Просмотр журнала аудита",
  company_chats_read: "Просмотр списка всех чатов пространства",
  company_bots_read: "Просмотр списка всех ботов пространства",
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
  drafts_read: "Просмотр черновиков и отложенных сообщений",
  drafts_write: "Создание, изменение и удаление черновиков и отложенных сообщений",
})
@extension("x-scope-roles", #{
  chats_read: #["owner", "admin", "user", "bot"],
  chats_create: #["owner", "admin", "user", "bot"],
  chats_update: #["owner", "admin", "user", "bot"],
  chats_archive: #["owner", "admin", "user", "bot"],
  chats_leave: #["owner", "admin", "user", "bot"],
  chat_members_read: #["owner", "admin", "user", "bot"],
  chat_members_write: #["owner", "admin", "user", "bot"],
  chat_exports_read: #["owner"],
  chat_exports_write: #["owner"],
  messages_read: #["owner", "admin", "user", "bot"],
  messages_create: #["owner", "admin", "user", "bot"],
  messages_update: #["owner", "admin", "user", "bot"],
  messages_delete: #["owner", "admin", "user", "bot"],
  reactions_read: #["owner", "admin", "user", "bot"],
  reactions_write: #["owner", "admin", "user", "bot"],
  pins_write: #["owner", "admin", "user", "bot"],
  threads_read: #["owner", "admin", "user", "bot"],
  threads_create: #["owner", "admin", "user", "bot"],
  link_previews_write: #["owner", "admin", "user", "bot"],
  views_write: #["owner", "admin", "user", "bot"],
  users_read: #["owner", "admin", "user", "bot"],
  users_create: #["owner", "admin"],
  users_update: #["owner", "admin"],
  users_delete: #["owner", "admin"],
  group_tags_read: #["owner", "admin", "user", "bot"],
  group_tags_write: #["owner", "admin"],
  bots_read: #["owner", "admin", "user"],
  bots_write: #["owner", "admin", "user"],
  bot_self_webhook_write: #["bot"],
  bot_self_write: #["bot"],
  profile_read: #["owner", "admin", "user", "bot"],
  profile_status_read: #["owner", "admin", "user", "bot"],
  profile_status_write: #["owner", "admin", "user", "bot"],
  profile_avatar_write: #["owner", "admin", "user", "bot"],
  user_status_read: #["owner", "admin", "user", "bot"],
  user_status_write: #["owner", "admin"],
  user_avatar_write: #["owner", "admin"],
  custom_properties_read: #["owner", "admin", "user", "bot"],
  audit_events_read: #["owner"],
  company_chats_read: #["owner"],
  company_bots_read: #["owner"],
  tasks_read: #["owner", "admin", "user", "bot"],
  tasks_create: #["owner", "admin", "user", "bot"],
  tasks_update: #["owner", "admin", "user", "bot"],
  tasks_delete: #["owner", "admin", "user", "bot"],
  files_read: #["owner", "admin", "user", "bot"],
  files_write: #["owner", "admin", "user", "bot"],
  uploads_write: #["owner", "admin", "user", "bot"],
  webhooks_read: #["owner", "admin", "user", "bot"],
  webhooks_write: #["owner", "admin", "user", "bot"],
  webhooks_events_read: #["owner", "admin", "user", "bot"],
  webhooks_events_delete: #["owner", "admin", "user", "bot"],
  search_users: #["owner", "admin", "user", "bot"],
  search_chats: #["owner", "admin", "user", "bot"],
  search_messages: #["owner", "admin", "user", "bot"],
  drafts_read: #["owner", "admin", "user"],
  drafts_write: #["owner", "admin", "user"],
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

  @doc("Просмотр ботов")
  bots_read: "bots:read",

  @doc("Управление ботами")
  bots_write: "bots:write",

  @doc("Самостоятельное управление адресом вебхука бота")
  bot_self_webhook_write: "bot_self:webhook:write",

  @doc("Самостоятельное управление настройками бота")
  bot_self_write: "bot_self:write",

  @doc("Просмотр информации о своем профиле")
  profile_read: "profile:read",

  @doc("Просмотр статуса профиля")
  profile_status_read: "profile_status:read",

  @doc("Изменение и удаление статуса профиля")
  profile_status_write: "profile_status:write",

  @doc("Изменение и удаление аватара профиля")
  profile_avatar_write: "profile_avatar:write",

  @doc("Просмотр статуса сотрудника")
  user_status_read: "user_status:read",

  @doc("Изменение и удаление статуса сотрудника")
  user_status_write: "user_status:write",

  @doc("Изменение и удаление аватара сотрудника")
  user_avatar_write: "user_avatar:write",

  @doc("Просмотр дополнительных полей")
  custom_properties_read: "custom_properties:read",

  @doc("Просмотр журнала аудита")
  audit_events_read: "audit_events:read",

  @doc("Просмотр списка всех чатов пространства")
  company_chats_read: "company_chats:read",

  @doc("Просмотр списка всех ботов пространства")
  company_bots_read: "company_bots:read",

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

  @doc("Просмотр черновиков и отложенных сообщений")
  drafts_read: "drafts:read",

  @doc("Создание, изменение и удаление черновиков и отложенных сообщений")
  drafts_write: "drafts:write",
}

@doc("Токен доступа")
model AccessTokenInfo {
  @doc("Идентификатор токена")
  @example(4827)
  id: int64;

  @doc("Маскированный токен (видны первые 8 и последние 4 символа)")
  @example("cH5kR9mN...x7Qp")
  token: string;

  @doc("Пользовательское имя токена. `null` у токена бота — имя задаётся только при создании токена вручную.")
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

  @doc("Дата отзыва токена. Всегда `null`: по отозванному токену метод возвращает 401.")
  @example(null)
  revoked_at: utcDateTime | null;

  @doc("Время жизни токена в секундах. `null` у бессрочного токена — такие выдаёт интерфейс. У токена, полученного входом из CLI, здесь `3600`: он живёт час и продлевается сам.")
  @example(null)
  expires_in: int32 | null;

  @doc("Дата последнего использования токена. `null`, пока по токену не было ни одного запроса. Обновляется не чаще раза в час, поэтому может отставать.")
  @example(utcDateTime.fromISO("2025-02-24T14:20:00.000Z"))
  last_used_at: utcDateTime | null;
}

// ============================================================================
// Error Models
// ============================================================================

@extension("x-error", true)
@doc("Ошибка API (используется для 400, 402, 403, 404, 409, 410, 422)")
model ApiError {
  @doc("Массив ошибок")
  errors: ApiErrorItem[];
}

@doc("Детальная информация об ошибке")
model ApiErrorItem {
  @doc("Ключ поля с ошибкой")
  @example("field.name")
  key: string;
  
  @doc("Значение поля, которое вызвало ошибку. `null`, если ошибка не относится к конкретному значению.")
  @example("invalid_value")
  value: string | null;
  
  @doc("Сообщение об ошибке")
  @example("Поле не может быть пустым")
  message: string;
  
  @doc("Код ошибки")
  @example(ValidationErrorCode.blank)
  code: ValidationErrorCode;
  
  @doc("Дополнительные данные об ошибке. Содержимое зависит от кода ошибки: `{id: number}` — при ошибке кастомного свойства (идентификатор свойства), `{record: {type: string, id: number}, query: string}` — при ошибке авторизации, `{draft_id: number}` — когда черновик в этом чате уже есть. В большинстве случаев `null`.")
  @example(null)
  payload: Record<unknown> | null;
}

@extension("x-error", true)
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
    @maxLength(255)
    @example("Олег")
    first_name?: string;

    @doc("Фамилия")
    @maxLength(255)
    @example("Петров")
    last_name?: string;

    @doc("Электронная почта")
    @maxLength(255)
    @example("olegp@example.com")
    email: string;

    @doc("Телефон")
    @maxLength(255)
    @example("+79001234567")
    phone_number?: string;

    @doc("Имя пользователя")
    @maxLength(255)
    @example("olegpetrov")
    nickname?: string;

    @doc("Департамент")
    @maxLength(255)
    @example("Продукт")
    department?: string;

    @doc("Должность")
    @example("CIO")
    title?: string;

    @doc("Уровень доступа")
    @example(UserCreateRole.user)
    role?: UserCreateRole;

    @doc("Деактивация пользователя")
    @example(false)
    suspended?: boolean = false;

    @doc("Массив тегов, привязываемых к сотруднику")
    @example(#["Product", "Design"])
    list_tags?: string[];

    @doc("Идентификаторы чатов, в которые сотрудник будет добавлен сразу при создании. Для роли `guest` параметр обязателен и должен содержать ровно один активный чат.")
    @example(#[12345])
    chat_ids?: int32[];

    @doc("Задаваемые дополнительные поля")
    custom_properties?: {
      @doc("Идентификатор поля")
      @example(1678)
      id: int32;

      @doc("Устанавливаемое значение")
      @maxLength(768)
      @example("Санкт-Петербург")
      value: string;
    }[];
  };

  @doc("Пропуск этапа отправки приглашения сотруднику. Сотруднику не будет отправлено письмо на электронную почту с приглашением создать аккаунт. Полезно при предварительном создании аккаунтов перед входом через SSO.")
  @example(false)
  skip_email_notify?: boolean = false;
}

@doc("Запрос на редактирование сотрудника")
model UserUpdateRequest {
  @doc("Собранный объект параметров редактируемого сотрудника")
  user: {
    @doc("Имя")
    @maxLength(255)
    @example("Олег")
    first_name?: string;

    @doc("Фамилия")
    @maxLength(255)
    @example("Петров")
    last_name?: string;

    @doc("Электронная почта")
    @maxLength(255)
    @example("olegpetrov@example.com")
    email?: string;

    @doc("Телефон")
    @maxLength(255)
    @example("+79001234567")
    phone_number?: string;

    @doc("Имя пользователя")
    @maxLength(255)
    @example("olegpetrov")
    nickname?: string;

    @doc("Департамент")
    @maxLength(255)
    @example("Отдел разработки")
    department?: string;
    
    @doc("Должность")
    @example("Старший разработчик")
    title?: string;
    
    @doc("Уровень доступа")
    @example(UserRoleInput.user)
    role?: UserRoleInput;

    @doc("Деактивация пользователя")
    @example(false)
    suspended?: boolean = false;

    @doc("Массив тегов, привязываемых к сотруднику")
    @example(#["Product", "Design"])
    list_tags?: string[];
    
    @doc("Задаваемые дополнительные поля")
    custom_properties?: {
      @doc("Идентификатор поля")
      @example(1678)
      id: int32;
      
      @doc("Устанавливаемое значение")
      @maxLength(768)
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
    @maxLength(50)
    @example("Очень занят")
    title: string;

    @doc("Срок жизни статуса (ISO-8601). Смещение вида `+03:00` учитывается, время без смещения считается UTC.")
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
    @maxLength(255)
    @example("Новое название тега")
    name: string;
  };
}

@doc("Запрос на создание чата")
model ChatCreateRequest {
  @doc("Собранный объект параметров создаваемого чата")
  chat: {
    @doc("Название")
    @maxLength(255)
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
    @maxLength(255)
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
    @doc("Тип сущности. Регистр значения не учитывается. Значение вне списка возвращает `400` с кодом `invalid`.")
    @example(MessageEntityType.discussion)
    entity_type?: MessageEntityType = MessageEntityType.discussion;

    @doc("Идентификатор того, что названо в `entity_type`: беседы или канала, треда либо пользователя.")
    @example(334)
    entity_id: int32;

    @doc("Текст сообщения. Поддерживает упоминания: `@nickname` или `<@user_id>` (будет автоматически преобразовано в `@nickname`).")
    @example("Вчера мы продали 756 футболок (что на 10% больше, чем в прошлое воскресенье)")
    content: string;

    @doc("Прикрепляемые файлы")
    files?: {
      @doc("Путь к файлу, полученный в методе [Загрузка файла](POST /direct_url)")
      @example("attaches/files/93746/e354fd79-4f3e-4b5a-9c8d-1a2b3c4d5e6f/logo.png")
      @maxLength(1000)
      key: string;
      
      @doc("Название файла, которое вы хотите отображать пользователю. Расширение должно совпадать с расширением файла в `key`, иначе ответ будет 422 с кодом `wrong_params`.")
      @example("logo.png")
      @maxLength(255)
      name: string;

      @doc("Тип файла")
      @example(FileType.image)
      file_type: FileType;
      
      @doc("Размер файла в байтах, отображаемый пользователю")
      @example(12345)
      size: int64;
      
      @doc("Ширина изображения в px (используется в случае, если file_type указан как image)")
      @example(800)
      width?: int32;
      
      @doc("Высота изображения в px (используется в случае, если file_type указан как image)")
      @example(600)
      height?: int32;

      @doc("Длительность в миллисекундах. Обязательно для голосовых сообщений (`file_type` — `voice`), для других типов не используется.")
      @example(5400)
      @minValue(1)
      duration_ms?: int32;

      @doc("Форма волны для визуализации голосового сообщения. Обязательно для голосовых сообщений (`file_type` — `voice`), для других типов не используется.")
      @example("4,8,12,20,16,10,6,3")
      @maxLength(256)
      waveform?: string;
    }[];

    @doc("Массив строк, каждая из которых представлена массивом кнопок. Максимум 100 кнопок у сообщения, до 8 кнопок в строке.")
    @maxItems(32)
    @example(#[#[#{ text: "Подробнее", url: "https://example.com/details" }, #{ text: "Отлично!", data: "awesome" }]])
    buttons?: Button[][];

    @doc("Идентификатор сообщения, на которое отвечаете. Ответ появится прямо в ленте чата, а не в треде: для треда отправляйте сообщение с `entity_type: \"thread\"`.")
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
  };

  @doc("Отображение предпросмотра первой найденной ссылки в тексте сообщения")
  @example(false)
  link_preview?: boolean = false;
}

@doc("Запрос на редактирование сообщения")
model MessageUpdateRequest {
  @doc("Собранный объект параметров редактируемого сообщения")
  message: {
    @doc("Текст сообщения. Поддерживает упоминания: `@nickname` или `<@user_id>` (будет автоматически преобразовано в `@nickname`).")
    @example("Вот попробуйте написать правильно это с первого раза: Будущий, Полощи, Прийти, Грейпфрут, Мозаика, Бюллетень, Дуршлаг, Винегрет.")
    content?: string;
    
    @doc("Прикрепляемые файлы")
    files?: {
      @doc("Путь к файлу, полученный в методе [Загрузка файла](POST /direct_url)")
      @example("attaches/files/93746/e354fd79-4f3e-4b5a-9c8d-1a2b3c4d5e6f/logo.png")
      @maxLength(1000)
      key: string;
      
      @doc("Название файла, которое вы хотите отображать пользователю. Расширение должно совпадать с расширением файла в `key`, иначе ответ будет 422 с кодом `wrong_params`.")
      @example("logo.png")
      @maxLength(255)
      name: string;

      @doc("Тип файла")
      @example(FileType.image)
      file_type?: FileType = FileType.file;

      @doc("Размер файла в байтах, отображаемый пользователю")
      @example(12345)
      size?: int64;

      @doc("Ширина изображения в px (используется в случае, если file_type указан как image)")
      @example(800)
      width?: int32;

      @doc("Высота изображения в px (используется в случае, если file_type указан как image)")
      @example(600)
      height?: int32;

      @doc("Длительность в миллисекундах. Обязательно для голосовых сообщений (`file_type` — `voice`), для других типов не используется.")
      @example(5400)
      @minValue(1)
      duration_ms?: int32;

      @doc("Форма волны для визуализации голосового сообщения. Без неё запрос с голосовым файлом (`file_type` — `voice`) не пройдёт проверку, но при редактировании присланное значение не сохраняется. Для других типов не используется.")
      @example("4,8,12,20,16,10,6,3")
      @maxLength(256)
      waveform?: string;
    }[];

    @doc("Массив строк, каждая из которых представлена массивом кнопок. Максимум 100 кнопок у сообщения, до 8 кнопок в строке. Для удаления кнопок пришлите пустой массив.")
    @maxItems(32)
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
  @doc("Emoji символ реакции. Именно символ: текстовые записи вроде `+1` или `:+1:` отклоняются как неизвестный эмодзи.")
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
    @doc("Путь к изображению, полученный в методе [Загрузка файла](POST /direct_url)")
    @example("attaches/files/93746/e354fd79-9jh6-f2hd-fj83-709dae24c763/\${filename}")
    key: string;
    
    @doc("Название изображения (рекомендуется писать вместе с расширением)")
    @example("files-to-server.jpg")
    name: string;
    
    @doc("Размер изображения в байтах")
    @example(695604)
    size?: int32;
  };
}

@doc("Запрос на разворачивание ссылок")
model LinkPreviewsRequest {
  @doc("`JSON` карта предпросмотров ссылок, где каждый ключ — `URL`, который был получен в исходящем вебхуке о новом сообщении")
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

    @doc("Срок выполнения напоминания (ISO-8601). Смещение вида `+03:00` учитывается, время без смещения считается UTC. Секунды отбрасываются: срок встаёт на начало минуты. Исключение — ровно 23:59:59: такое напоминание создаётся на весь день, без указания времени.")
    @example(utcDateTime.fromISO("2020-06-05T12:00:00.000+03:00"))
    due_at?: utcDateTime;

    @doc("Приоритет: 1, 2 (важно) или 3 (очень важно)")
    @example(2)
    @minValue(1)
    @maxValue(3)
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
    kind?: TaskKind = TaskKind.reminder;

    @doc("Описание")
    @example("Забрать со склада 21 заказ")
    content?: string;

    @doc("Срок выполнения напоминания (ISO-8601). Смещение вида `+03:00` учитывается, время без смещения считается UTC. Секунды отбрасываются: срок встаёт на начало минуты. Исключение — ровно 23:59:59: такое напоминание создаётся на весь день, без указания времени.")
    @example(utcDateTime.fromISO("2020-06-05T12:00:00.000+03:00"))
    due_at?: utcDateTime;

    @doc("Приоритет: 1, 2 (важно) или 3 (очень важно)")
    @example(2)
    @minValue(1)
    @maxValue(3)
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

    @doc("Дата и время выполнения напоминания (ISO-8601). Смещение вида `+03:00` учитывается, время без смещения считается UTC. Значение, которое не удалось разобрать, отметку о выполнении снимает: ответ придёт успешный, а в нём `done_at` будет `null`.")
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

@doc("Прикрепляемый к черновику файл")
model DraftFileRequest {
  @doc("Идентификатор уже прикреплённого файла. Передаётся при редактировании, чтобы сохранить вложение как есть. У нового файла не указывается.")
  @example(3560)
  id?: int32;

  @doc("Путь к файлу, полученный в методе [Загрузка файла](POST /direct_url)")
  @example("attaches/files/93746/e354fd79-4f3e-4b5a-9c8d-1a2b3c4d5e6f/logo.png")
  @maxLength(1000)
  key: string;

  @doc("Название файла, которое вы хотите отображать пользователю")
  @example("logo.png")
  @maxLength(255)
  name: string;

  @doc("Тип файла")
  @example(FileType.image)
  file_type?: FileType;

  @doc("Размер файла в байтах, отображаемый пользователю")
  @example(12345)
  size?: int64;

  @doc("Ширина изображения в пикселях")
  @example(800)
  width?: int32;

  @doc("Высота изображения в пикселях")
  @example(600)
  height?: int32;

  @doc("Длительность в миллисекундах. Обязательна для голосового сообщения (`file_type` — `voice`).")
  @example(5400)
  duration_ms?: int32;

  @doc("Форма волны для визуализации. Обязательна для голосового сообщения (`file_type` — `voice`).")
  @example("4,8,12,20,16,10,6,3")
  @maxLength(256)
  waveform?: string;
}

@doc("Правило повтора в запросе")
model DraftRepetitionRequest {
  @doc("Периодичность")
  @example(DraftRepetitionInterval.weekly)
  interval: DraftRepetitionInterval;

  @doc("Дни недели, по которым уходит сообщение: 0 — воскресенье, 6 — суббота. Учитывается только при периодичности `weekly`, а если не передать, берётся день недели из `start_date`.")
  @example(#[1, 3])
  @maxItems(7)
  days?: int32[];

  @doc("Какой по счёту день недели в месяце: от 1 до 4 — первый, второй, третий, четвёртый, 5 — последний. Учитывается только при периодичности по месяцам, а без него повтор идёт по числу месяца из `start_date`.")
  @example(2)
  @minValue(1)
  @maxValue(5)
  nth_day?: int32 | null;
}

@doc("Расписание отправки в запросе")
model DraftScheduleRequest {
  @doc("Первая отправка (ISO-8601). Из неё берутся время суток, число месяца и день недели, по которым дальше строится повтор. Смещение вида `+03:00` учитывается, время без смещения считается UTC.")
  @example(utcDateTime.fromISO("2026-09-17T12:00:00.000Z"))
  start_date: utcDateTime;

  @doc("Дата, после которой повтор прекращается (ISO-8601). Без неё повтор идёт бессрочно.")
  @example(utcDateTime.fromISO("2026-12-31T12:00:00.000Z"))
  end_date?: utcDateTime | null;

  @doc("Правило повтора")
  repetition: DraftRepetitionRequest;
}

@doc("Запрос на создание черновика")
model DraftCreateRequest {
  @doc("Собранный объект параметров черновика")
  draft: {
    @doc("Куда пишется черновик: в беседу или канал, в тред либо в личную переписку с сотрудником")
    @example(MessageEntityType.discussion)
    entity_type: MessageEntityType;

    @doc("Идентификатор того, что названо в `entity_type`: беседы или канала, треда либо сотрудника")
    @example(334)
    entity_id: int32;

    @doc("Текст черновика. Можно не передавать, если есть вложения, но пустым черновик быть не может.")
    @example("Отчёт за неделю: продажи выросли на 10%")
    content?: string;

    @doc("Идентификатор сообщения, ответом на которое уйдёт черновик. Сообщение должно быть в том же чате.")
    @example(196093)
    parent_message_id?: int32 | null;

    @doc("Прикрепляемые файлы, не больше десяти")
    @maxItems(10)
    files?: DraftFileRequest[];

    @doc("Расписание отправки. С ним создаётся отложенное сообщение, без него — обычный черновик.")
    schedule?: DraftScheduleRequest | null;
  };
}

@doc("Запрос на обновление черновика")
model DraftUpdateRequest {
  @doc("Собранный объект изменяемых параметров черновика")
  draft: {
    @doc("Текст черновика")
    @example("Отчёт за неделю: продажи выросли на 10%")
    content?: string;

    @doc("Идентификатор сообщения, ответом на которое уйдёт черновик. `null` снимает ответ.")
    @example(196093)
    parent_message_id?: int32 | null;

    @doc("Прикрепляемые файлы, не больше десяти. Переданный массив заменяет прежний состав: пустой снимает все вложения, а чтобы сохранить уже прикреплённый файл, передайте его с `id`. Без этого поля вложения остаются как были.")
    @maxItems(10)
    files?: DraftFileRequest[];

    @doc("Расписание отправки. У обычного черновика оно превращает его в отложенное сообщение. У отложенного расписание можно изменить, но не снять: `null` в ответ даст `422` с кодом `draft_type_change_forbidden`.")
    schedule?: DraftScheduleRequest | null;
  };
}

@doc("Радиокнопка блока radio. Изначальный выбор задаётся полем `checked`, как у checkbox, а не `selected`, как у select.")
model ViewBlockSelectableOption {
  @doc("Отображаемый текст")
  @example("Ничего")
  @maxLength(75)
  text: string;

  @doc("Уникальное строковое значение, которое будет передано в ваше приложение при выборе этого пункта")
  @example("nothing")
  @maxLength(255)
  value: string;

  @doc("Пояснение, которое будет указано серым цветом в этом пункте под отображаемым текстом")
  @example("Каждый день бот будет присылать список новых задач в вашей команде")
  @maxLength(75)
  description?: string;

  @doc("Изначально выбранная радиокнопка. Только одна радиокнопка может быть выбрана.")
  @example(true)
  checked?: boolean;
}

@doc("Пункт выпадающего списка (select). Изначальный выбор задаётся полем `selected`, а не `checked`, как у radio и checkbox.")
model ViewBlockSelectOption {
  @doc("Отображаемый текст")
  @example("Ничего")
  @maxLength(75)
  text: string;

  @doc("Уникальное строковое значение, которое будет передано в ваше приложение при выборе этого пункта")
  @example("nothing")
  @maxLength(255)
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
  @maxLength(255)
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
  multiline?: boolean = false;
  
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
  required?: boolean = false;
  
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
  @minItems(1)
  @maxItems(100)
  options: ViewBlockSelectOption[];

  @doc("Обязательность")
  @example(false)
  required?: boolean = false;

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
  @minItems(1)
  @maxItems(10)
  options: ViewBlockSelectableOption[];
  
  @doc("Обязательность")
  @example(true)
  required?: boolean = false;
  
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
  @minItems(1)
  @maxItems(10)
  options: ViewBlockCheckboxOption[];

  @doc("Обязательность")
  @example(false)
  required?: boolean = false;

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
  required?: boolean = false;

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
  
  @doc("Начальное значение в поле в формате HH:mm. Значение в формате HH:mm:ss тоже принимается — секунды отбрасываются.")
  @example(plainTime.fromISO("11:00"))
  initial_time?: plainTime;

  @doc("Обязательность")
  @example(false)
  required?: boolean = false;
  
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
  
  @doc("Массив допустимых расширений файлов, указанные в виде строк (например, [\"png\",\"jpg\",\"gif\"]). Точка в начале не нужна, но допустима — она подставляется сама. Значение с косой чертой считается MIME-типом и остаётся как есть. Если это поле не указано, все расширения файлов будут приняты. Значение подставляется в фильтр окна выбора файла, поэтому расширение полученного файла проверяйте у себя.")
  @example(#["pdf","jpg","png"])
  filetypes?: string[];
  
  @doc("Максимальное количество файлов, которое может загрузить пользователь в это поле")
  @example(1)
  @minValue(1)
  @maxValue(10)
  max_files?: int32 = 10;
  
  @doc("Обязательность")
  @example(true)
  required?: boolean = false;
  
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

@doc("Представление")
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
  @example("timeoff_request_form")
  callback_id?: string;

  @doc("Собранный объект представления")
  view: {
    @doc("Заголовок представления")
    @maxLength(24)
    @example("Уведомление об отпуске")
    title: string;

    @doc("Текст кнопки закрытия представления. Отображается только в десктоп-вебе. В мобильных приложениях (iOS/Android) кнопка закрытия — это крестик в шапке, и заданный текст там не показывается.")
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

@doc("Условие срабатывания исходящего вебхука бота")
@extension("x-enum-descriptions", #{
  commands: "Только на команды (триггер-слова) из commands",
  all_messages: "На все сообщения в чатах, где есть бот",
  unfurl: "На развёртывание ссылок (link previews)",
})
enum BotTriggerOn {
  commands: "commands",
  all_messages: "all_messages",
  unfurl: "unfurl",
}

@doc("Шаблонизатор для форматирования входящих вебхуков")
@extension("x-enum-descriptions", #{
  liquid: "Liquid — условия, циклы и фильтры",
  mustache: "Mustache — простая подстановка без логики",
})
enum BotTemplateEngine {
  liquid: "liquid",
  mustache: "mustache",
}

@doc("Событие исходящего вебхука бота")
@extension("x-enum-descriptions", #{
  message_new: "Новое сообщение",
  message_update: "Сообщение отредактировано",
  message_delete: "Сообщение удалено",
  reaction_new: "Добавлена реакция",
  reaction_delete: "Реакция удалена",
  button_click: "Нажата кнопка",
  message_link_shared: "В сообщении отправлена ссылка (для unfurl)",
  chat_member_add: "Участник добавлен в чат",
  chat_member_remove: "Участник удалён из чата",
  company_member_invite: "Сотрудник приглашён в компанию",
  company_member_confirm: "Сотрудник подтвердил приглашение",
  company_member_suspend: "Сотрудник деактивирован",
  company_member_activate: "Сотрудник активирован",
  company_member_delete: "Сотрудник удалён из компании",
  company_member_update: "Данные сотрудника изменены",
  video_call_started: "Видеозвонок начался",
  video_call_finished: "Видеозвонок завершился",
  video_call_recording_ready: "Запись видеозвонка готова",
})
enum BotEventName {
  message_new: "message_new",
  message_update: "message_update",
  message_delete: "message_delete",
  reaction_new: "reaction_new",
  reaction_delete: "reaction_delete",
  button_click: "button_click",
  message_link_shared: "message_link_shared",
  chat_member_add: "chat_member_add",
  chat_member_remove: "chat_member_remove",
  company_member_invite: "company_member_invite",
  company_member_confirm: "company_member_confirm",
  company_member_suspend: "company_member_suspend",
  company_member_activate: "company_member_activate",
  company_member_delete: "company_member_delete",
  company_member_update: "company_member_update",
  video_call_started: "video_call_started",
  video_call_finished: "video_call_finished",
  video_call_recording_ready: "video_call_recording_ready",
}

@doc("Кто может добавлять бота в чаты")
@extension("x-enum-descriptions", #{
  creator: "Только создатель бота",
  creator_admin: "Создатель и администраторы компании",
  creator_admin_user: "Создатель, администраторы и участники компании",
  anyone: "Любой пользователь, в том числе гости",
})
enum BotWhoCanAdd {
  creator: "creator",
  creator_admin: "creator_admin",
  creator_admin_user: "creator_admin_user",
  anyone: "anyone",
}

@doc("Роль, которой разрешено редактировать настройки бота")
@extension("x-enum-descriptions", #{
  admin: "Администраторы компании",
  chat_owners: "Владельцы чатов, в которые добавлен бот",
})
enum BotCanEdit {
  admin: "admin",
  chat_owners: "chat_owners",
}

@doc("Запрос на создание бота")
model BotCreateRequest {
  @doc("Объект параметров вебхука создаваемого бота")
  webhook: {
    @doc("Имя бота")
    @maxLength(255)
    @example("Бот задач")
    name: string;

    @doc("Никнейм бота. Должен заканчиваться на `_bot`.")
    @maxLength(255)
    @example("tasks_bot")
    nickname?: string;

    @doc("URL исходящего вебхука")
    @example("https://www.website.com/tasks/new")
    outgoing_url?: string;

    @doc("События, на которые подписан бот")
    @example(#[BotEventName.message_new])
    events?: BotEventName[];

    @doc("Условие срабатывания исходящего вебхука")
    @example(BotTriggerOn.commands)
    trigger_on?: BotTriggerOn = BotTriggerOn.commands;

    @doc("Команды бота (триггер-слова), на которые он реагирует при trigger_on = commands. Суммарная длина команд, объединённых через запятую, не должна превышать 255 символов.")
    @example(#["/task", "/help"])
    commands?: string[];

    @doc("Скоупы (права доступа) токена бота. Если не указано, бот получает набор по умолчанию. Боту доступны не все скоупы: часть из них разрешена только пользовательским ролям, и попытка назначить такой скоуп возвращает `400`. Служебные значения `bot` и `all` назначать нельзя.")
    @example(#["messages:create"])
    scopes?: string[];

    @doc("Шаблон форматирования входящего вебхука")
    @example("Заказ от {{ client }} на сумму {{ amount }} ₽")
    template?: string;

    @doc("Шаблонизатор для обработки шаблона входящего вебхука")
    @example(BotTemplateEngine.liquid)
    template_engine?: BotTemplateEngine = BotTemplateEngine.liquid;

    @doc("Название поля проверки для верификации входящего вебхука")
    @example("challenge")
    challenge_key?: string;

    @doc("Показывать превью ссылок в сообщениях входящего вебхука")
    @example(true)
    link_preview_enabled?: boolean = true;

    @doc("Игнорировать входящие сообщения, отправленные самим ботом")
    @example(false)
    ignore_self_messages?: boolean = false;

    @doc("Сохранять историю событий бота для последующего получения через метод истории событий")
    @example(false)
    events_history_enabled?: boolean = false;

    @doc("Кто может добавлять бота в чаты")
    @example(BotWhoCanAdd.creator)
    who_can_add?: BotWhoCanAdd = BotWhoCanAdd.creator;

    @doc("Роли, которым, помимо создателя, разрешено редактировать настройки бота. Создатель может редактировать всегда. Пустой массив — редактировать может только создатель.")
    @example(#[BotCanEdit.admin])
    can_edit?: BotCanEdit[];

    @doc("Ограничивает бота одной беседой или каналом: `true` — бота можно добавить только в один такой чат, `false` — в несколько. Личные чаты и треды в ограничение не входят. Задаётся только при создании, при редактировании не меняется.")
    @example(false)
    single_chat?: boolean = false;
  };

}

@doc("Запрос на обновление бота")
model BotUpdateRequest {
  @doc("Объект параметров вебхука редактируемого бота")
  webhook: {
    @doc("Имя бота")
    @maxLength(255)
    @example("Бот задач")
    name?: string;

    @doc("Никнейм бота. Должен заканчиваться на `_bot`.")
    @maxLength(255)
    @example("tasks_bot")
    nickname?: string;

    @doc("URL исходящего вебхука")
    @example("https://www.website.com/tasks/new")
    outgoing_url?: string;

    @doc("События, на которые подписан бот")
    @example(#[BotEventName.message_new])
    events?: BotEventName[];

    @doc("Условие срабатывания исходящего вебхука")
    @example(BotTriggerOn.commands)
    trigger_on?: BotTriggerOn = BotTriggerOn.commands;

    @doc("Команды бота (триггер-слова), на которые он реагирует при trigger_on = commands. Суммарная длина команд, объединённых через запятую, не должна превышать 255 символов.")
    @example(#["/task", "/help"])
    commands?: string[];

    @doc("Скоупы (права доступа) токена бота. Если не указано, бот получает набор по умолчанию. Боту доступны не все скоупы: часть из них разрешена только пользовательским ролям, и попытка назначить такой скоуп возвращает `400`. Служебные значения `bot` и `all` назначать нельзя.")
    @example(#["messages:create"])
    scopes?: string[];

    @doc("Шаблон форматирования входящего вебхука")
    @example("Заказ от {{ client }} на сумму {{ amount }} ₽")
    template?: string;

    @doc("Шаблонизатор для обработки шаблона входящего вебхука")
    @example(BotTemplateEngine.liquid)
    template_engine?: BotTemplateEngine = BotTemplateEngine.liquid;

    @doc("Название поля проверки для верификации входящего вебхука")
    @example("challenge")
    challenge_key?: string;

    @doc("Показывать превью ссылок в сообщениях входящего вебхука")
    @example(true)
    link_preview_enabled?: boolean = true;

    @doc("Игнорировать входящие сообщения, отправленные самим ботом")
    @example(false)
    ignore_self_messages?: boolean = false;

    @doc("Сохранять историю событий бота для последующего получения через метод истории событий")
    @example(false)
    events_history_enabled?: boolean = false;

    @doc("Кто может добавлять бота в чаты")
    @example(BotWhoCanAdd.creator)
    who_can_add?: BotWhoCanAdd = BotWhoCanAdd.creator;

    @doc("Роли, которым, помимо создателя, разрешено редактировать настройки бота. Создатель может редактировать всегда. Пустой массив — редактировать может только создатель.")
    @example(#[BotCanEdit.admin])
    can_edit?: BotCanEdit[];
  };

}



@doc("Параметры вебхука бота")
model BotWebhook {
  @doc("Имя бота")
  @maxLength(255)
  @example("Бот задач")
  name: string;

  @doc("Никнейм бота")
  @maxLength(255)
  @example("tasks_bot")
  nickname: string;

  @doc("URL исходящего вебхука. `null`, если исходящий вебхук у бота не настроен.")
  @example("https://www.website.com/tasks/new")
  outgoing_url: string | null;

  @doc("События, на которые подписан бот")
  @example(#[BotEventName.message_new])
  events: BotEventName[];

  @doc("Условие срабатывания исходящего вебхука")
  @example(BotTriggerOn.commands)
  trigger_on: BotTriggerOn;

  @doc("Команды бота (триггер-слова)")
  @example(#["/task"])
  commands: string[];

  @doc("Скоупы (права доступа) токена бота. Набор по умолчанию шире того, что можно назначить явно, поэтому здесь могут встречаться значения, недоступные для явной установки.")
  @example(#["messages:create"])
  scopes: string[];

  @doc("Шаблон форматирования входящего вебхука. `null`, если не задан.")
  @example("Заказ от {{ client }} на сумму {{ amount }} ₽")
  template: string | null;

  @doc("Шаблонизатор для обработки шаблона входящего вебхука")
  @example(BotTemplateEngine.liquid)
  template_engine: BotTemplateEngine;

  @doc("Название поля проверки для верификации входящего вебхука. `null`, если не задано.")
  @example("challenge")
  challenge_key: string | null;

  @doc("Показывать превью ссылок в сообщениях входящего вебхука")
  @example(true)
  link_preview_enabled: boolean;

  @doc("Игнорировать входящие сообщения, отправленные самим ботом")
  @example(false)
  ignore_self_messages: boolean;

  @doc("Сохранять историю событий бота для последующего получения через метод истории событий")
  @example(false)
  events_history_enabled: boolean;

  @doc("Ограничивает бота одной беседой или каналом: `true` — бота можно добавить только в один такой чат, `false` — в несколько. Личные чаты и треды в ограничение не входят.")
  @example(false)
  single_chat: boolean;

  @doc("Роли, которым, помимо создателя, разрешено редактировать настройки бота. Создатель может редактировать всегда. Пустой массив — редактировать может только создатель.")
  @example(#[BotCanEdit.admin])
  can_edit: BotCanEdit[];

  @doc("Кто может добавлять бота в чаты")
  @example(BotWhoCanAdd.creator)
  who_can_add: BotWhoCanAdd;
}

@doc("Запрос на саморегистрацию вебхука бота")
model BotWebhookSelfUpdateRequest {
  @doc("Объект параметров вебхука")
  webhook: {
    @doc("URL исходящего вебхука. Пустая строка отключает вебхук.")
    @example("https://www.website.com/tasks/new")
    outgoing_url: string;
  };
}

@doc("Параметры бота")
model BotResponse {
  @doc("Идентификатор бота (совпадает с `user_id` бота)")
  @example(1738816)
  id: int32;

  @doc("Объект параметров вебхука")
  webhook: BotWebhook;

}

@doc("Параметры созданного бота")
model BotCreateResponse {
  ...BotResponse;

  @doc("Токен доступа бота. Возвращается при создании бота и при ротации токена.")
  @example("bm90X2FfcmVhbF90b2tlbg")
  access_token: string;

}

@doc("Параметры вебхука бота пространства. Настройки бота, недоступного вам для редактирования, приходят как `null` — остаются только имя и никнейм.")
model CompanyBotWebhook {
  @doc("Имя бота")
  @maxLength(255)
  @example("Бот задач")
  name: string;

  @doc("Никнейм бота")
  @maxLength(255)
  @example("tasks_bot")
  nickname: string;

  @doc("URL исходящего вебхука. `null`, если исходящий вебхук у бота не настроен.")
  @example("https://www.website.com/tasks/new")
  outgoing_url: string | null;

  @doc("События, на которые подписан бот")
  @example(#[BotEventName.message_new])
  events: BotEventName[] | null;

  @doc("Условие срабатывания исходящего вебхука")
  @example(BotTriggerOn.commands)
  trigger_on: BotTriggerOn | null;

  @doc("Команды бота (триггер-слова)")
  @example(#["/task"])
  commands: string[] | null;

  @doc("Скоупы (права доступа) токена бота")
  @example(#["messages:create"])
  scopes: string[] | null;

  @doc("Шаблон форматирования входящего вебхука. `null`, если не задан.")
  @example("Заказ от {{ client }} на сумму {{ amount }} ₽")
  template: string | null;

  @doc("Шаблонизатор для обработки шаблона входящего вебхука")
  @example(BotTemplateEngine.liquid)
  template_engine: BotTemplateEngine | null;

  @doc("Название поля проверки для верификации входящего вебхука. `null`, если не задано.")
  @example("challenge")
  challenge_key: string | null;

  @doc("Показывать превью ссылок в сообщениях входящего вебхука")
  @example(true)
  link_preview_enabled: boolean | null;

  @doc("Игнорировать входящие сообщения, отправленные самим ботом")
  @example(false)
  ignore_self_messages: boolean | null;

  @doc("Сохранять историю событий бота для последующего получения через метод истории событий")
  @example(false)
  events_history_enabled: boolean | null;

  @doc("Ограничивает бота одной беседой или каналом: `true` — бота можно добавить только в один такой чат, `false` — в несколько. Личные чаты и треды в ограничение не входят.")
  @example(false)
  single_chat: boolean | null;

  @doc("Роли, которым, помимо создателя, разрешено редактировать настройки бота. Создатель может редактировать всегда. Пустой массив — редактировать может только создатель.")
  @example(#[BotCanEdit.admin])
  can_edit: BotCanEdit[] | null;

  @doc("Кто может добавлять бота в чаты")
  @example(BotWhoCanAdd.creator)
  who_can_add: BotWhoCanAdd | null;
}

@doc("Параметры бота пространства")
model CompanyBotResponse {
  @doc("Идентификатор бота (совпадает с `user_id` бота)")
  @example(1738816)
  id: int32;

  @doc("Объект параметров вебхука")
  webhook: CompanyBotWebhook;

}

@doc("Пустые детали. При: user_login, user_logout, user_2fa_fail, user_2fa_success, user_2fa_disabled, user_created, user_deleted, chat_created, message_created, message_updated, message_deleted, reaction_created, reaction_deleted, thread_created, audit_events_accessed, company_chats_accessed, company_bots_accessed, exchange_disabled.")
model AuditDetailsEmpty {}

@doc("При: user_updated")
model AuditDetailsUserUpdated {
  @doc("Список изменённых полей")
  changed_attrs: string[];
  @doc("Как было выполнено изменение. Значение `sso_login` — профиль обновился автоматически при входе через SSO. Поле отсутствует, если профиль изменили обычным способом.")
  context?: string;
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
  @doc("Описание действия. `null`, если у действия правила текст не задан.")
  action_message: string | null;
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
  @doc("Применённые фильтры. Возможные ключи зависят от типа поиска: order, sort, created_from, created_to, company_roles (users), active, chat_subtype, personal (chats), chat_ids, user_ids (messages).")
  filters: Record<unknown>;
}

@doc("При: bot_deleted, bot_token_recreated")
model AuditDetailsBot {
  @doc("Идентификатор бота")
  bot_id: int32;
  @doc("Идентификатор пользователя, выполнившего действие. `null`, если действие выполнено без инициатора.")
  actor_id: int32 | null;
}

@doc("При: bot_scopes_updated")
model AuditDetailsBotScopes {
  @doc("Скоупы, добавленные токену бота")
  added_scopes: string[];
  @doc("Скоупы, отозванные у токена бота")
  removed_scopes: string[];
}

@doc("При: bot_webhook_settings_updated")
model AuditDetailsBotWebhookSettings {
  @doc("Изменённые настройки вебхука. Ключ — имя настройки (outgoing_url, ignore_self_messages, events_history_enabled), значение — объект с полями previous (прежнее значение) и new (новое значение).")
  changes: Record<unknown>;
}

@doc("При: bot_oauth_client_updated")
model AuditDetailsBotOAuthClient {
  @doc("Идентификатор OAuth-клиента бота")
  client_id: string;
  @doc("Изменённые параметры клиента. Ключ — имя параметра (confidential, redirect_uris, scopes), значение — объект с полями previous (прежнее значение) и new (новое значение).")
  changes: Record<unknown>;
}

@doc("При: oauth_authorization_granted")
model AuditDetailsOAuthAuthorizationGranted {
  @doc("Идентификатор OAuth-клиента, которому выдан доступ")
  client_id: string;
  @doc("Скоупы, на которые выдан доступ")
  scopes: string[];
}

@doc("При: oauth_authorization_revoked")
model AuditDetailsOAuthAuthorizationRevoked {
  @doc("Идентификатор OAuth-клиента, у которого отозван доступ")
  client_id: string;
  @doc("Количество отозванных токенов")
  revoked_tokens_count: int32;
}

@doc("При: oauth_device_authorization_approved")
model AuditDetailsDeviceAuthorizationApproved {
  @doc("Идентификатор OAuth-клиента, которому разрешён вход")
  client_id: string;
  @doc("Скоупы, на которые согласился сотрудник")
  scopes: string[];
}

@doc("При: oauth_device_authorization_denied")
model AuditDetailsDeviceAuthorizationDenied {
  @doc("Идентификатор OAuth-клиента, которому отказано во входе")
  client_id: string;
  @doc("Скоупы, которые клиент запрашивал")
  scopes: string[];
}

@doc("При: video_call_started")
model AuditDetailsVideoCallStarted {
  @doc("Идентификатор чата, в котором проходит видеозвонок")
  chat_id: int32;
  @doc("Идентификатор сообщения о начале звонка. `null`, если такого сообщения нет.")
  started_message_id: int32 | null;
}

@doc("При: video_call_finished")
model AuditDetailsVideoCallFinished {
  @doc("Идентификатор чата, в котором проходил видеозвонок")
  chat_id: int32;
  @doc("Идентификатор сообщения о начале звонка. `null`, если такого сообщения нет.")
  started_message_id: int32 | null;
  @doc("Длительность звонка в секундах")
  duration: int32;
  @doc("Максимальное число одновременных участников за время звонка")
  max_members_count: int32;
}

@doc("При: video_call_recording_ready")
model AuditDetailsVideoCallRecording {
  @doc("Идентификатор чата, в котором проходил видеозвонок")
  chat_id: int32;
  @doc("Идентификатор сообщения о начале звонка. `null`, если такого сообщения нет.")
  started_message_id: int32 | null;
  @doc("Идентификатор записи")
  recording_id: int32;
  @doc("Идентификатор файла записи")
  file_id: int32;
  @doc("Длительность записи в секундах")
  duration: int32;
  @doc("Размер файла записи в байтах")
  size: int64;
}

@doc("Дополнительные детали события аудита. Структура зависит от значения event_key.")
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
  AuditDetailsBot,
  AuditDetailsBotScopes,
  AuditDetailsBotWebhookSettings,
  AuditDetailsBotOAuthClient,
  AuditDetailsOAuthAuthorizationGranted,
  AuditDetailsOAuthAuthorizationRevoked,
  AuditDetailsDeviceAuthorizationApproved,
  AuditDetailsDeviceAuthorizationDenied,
  AuditDetailsVideoCallStarted,
  AuditDetailsVideoCallFinished,
  AuditDetailsVideoCallRecording,
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

  @doc("Дополнительные детали события. Структура зависит от значения event_key — см. описания значений поля event_key. Для событий без деталей возвращается пустой объект.")
  details: AuditEventDetailsUnion;
  
  @doc("IP-адрес, с которого было выполнено действие. `null` у событий, записанных без запроса пользователя.")
  @example("192.168.1.100")
  ip_address: string | null;
  
  @doc("User agent клиента, обрезается до 255 символов. `null` у событий, записанных без запроса пользователя.")
  @example("Pachca/3.60.0 (co.staply.pachca; build:15; iOS 18.5.0) Alamofire/5.0.0")
  user_agent: string | null;
}

// ============================================================================
// Webhook Payload Models
// ============================================================================

@doc("Объект треда в вебхуке сообщения")
model WebhookMessageThread {
  @doc("Идентификатор сообщения, к которому был создан тред. `null` у треда без сообщения-родителя — такие создаёт [Новый самостоятельный тред](POST /threads).")
  @example(12345)
  message_id: int32 | null;

  @doc("Идентификатор чата сообщения, к которому был создан тред. `null` у треда без сообщения-родителя.")
  @example(67890)
  message_chat_id: int32 | null;
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

  @doc("Дата и время последнего изменения сообщения (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ. У неотредактированного сообщения совпадает с датой создания. `null` у сообщений, отправленных до появления этого поля.")
  @example(utcDateTime.fromISO("2025-05-15T14:35:00.000Z"))
  changed_at?: utcDateTime | null;

  @doc("Прямая ссылка на сообщение")
  @example("https://pachca.com/chats/1245817/messages/5678")
  url: string;
  
  @doc("Идентификатор чата, в котором находится сообщение")
  @example(9012)
  chat_id: int32;
  
  @doc("Идентификатор сообщения, к которому написан ответ. `null`, если сообщение не является ответом на другое сообщение.")
  @example(3456)
  parent_message_id?: int32 | null;
  
  @doc("Тред, в котором отправлено сообщение. `null`, если сообщение отправлено не в треде. В отличие от поля `thread` в объекте сообщения REST API, здесь описывается тред, внутри которого находится сообщение.")
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

  @doc("Идентификатор чата, в котором находится сообщение. Поле всегда присутствует в payload. В редких случаях (например, если сообщение было удалено к моменту отправки вебхука) может быть `null`.")
  @example(9012)
  chat_id: int32 | null;

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
  
  @doc("Дата и время добавления реакции (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ. Поле присутствует и для события удаления реакции.")
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
  
  @doc("Уникальный идентификатор события. Время жизни — 3 секунды. Может быть использован, например, для открытия представления пользователю.")
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

@doc("Структура исходящего вебхука о заполнении формы")
model ViewSubmitWebhookPayload {
  @doc("Тип объекта")
  @example("view")
  @extension("x-enum-descriptions", #{
    view: "Для формы всегда view"
  })
  type: "view";

  @doc("Тип события")
  @example("submit")
  @extension("x-enum-descriptions", #{
    submit: "Отправка формы"
  })
  event: "submit";

  @doc("Идентификатор обратного вызова, указанный при открытии представления. `null`, если при открытии формы он не был указан.")
  @example("timeoff_request_form")
  callback_id: string | null;

  @doc("Приватные метаданные, указанные при открытии представления. `null`, если при открытии формы они не были указаны.")
  @example("{\"timeoff_id\":4378}")
  private_metadata: string | null;

  @doc("Идентификатор чата, в котором была нажата кнопка, открывшая форму. Поле может быть `null` для форм, открытых до выкатки этого поля.")
  @example(9012)
  chat_id: int32 | null;

  @doc("Идентификатор пользователя, который отправил форму")
  @example(1235523)
  user_id: int32;

  @doc("Идентификатор представления. Нужен боту без адреса исходящего вебхука, чтобы ответить методом [Ответ на отправку формы](POST /views/{view_id}/submit_response).")
  @example("01KAJZ2XDSS2S3DSW9EXJZ0TBV")
  view_id: string;

  @doc("Идентификатор отправки формы. Нужен боту без адреса исходящего вебхука, чтобы ответить методом [Ответ на отправку формы](POST /views/{view_id}/submit_response).")
  @example("791a056b-006c-49dd-834b-c633fde52fe8")
  submit_id: string;

  @doc("Данные заполненных полей представления. Ключ — `name` блока, значение — введённые данные. У блока `file_input` значение приходит массивом объектов с полями `name`, `size` и `url`, ссылка действует 2 часа.")
  data: Record<unknown>;

  @doc("Дата и время отправки вебхука (UTC+0) в формате UNIX")
  @example(1755075544)
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
  
  @doc("Идентификатор треда. `null`, если участники добавлены в обычный чат или канал, а не в тред.")
  @example(5678)
  thread_id?: int32 | null;
  
  @doc("Массив идентификаторов пользователей, с которыми произошло событие")
  @example(#[2345, 6789])
  user_ids: int32[];
  
  @doc("Дата и время события (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ssZ. В этом вебхуке время приходит без долей секунды, в отличие от остальных.")
  @example(utcDateTime.fromISO("2025-05-15T14:30:00Z"))
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
  
  @doc("Дата и время события (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ssZ. В этом вебхуке время приходит без долей секунды, в отличие от остальных.")
  @example(utcDateTime.fromISO("2025-05-15T14:30:00Z"))
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

  @doc("Признак того, что автор сообщения скрыл превью для этой ссылки. Если `true` — бот не должен создавать превью.")
  @example(false)
  skip: boolean;
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

  @doc("Идентификатор отправителя сообщения")
  @example(2345)
  user_id: int32;

  @doc("Дата и время создания сообщения (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ")
  @example(utcDateTime.fromISO("2024-09-18T19:53:14.000Z"))
  created_at: utcDateTime;

  @doc("Дата и время отправки вебхука (UTC+0) в формате UNIX")
  @example(1726685594)
  webhook_timestamp: int32;
}

@doc("Тип события видеозвонка")
@extension("x-enum-descriptions", #{
  started: "Видеозвонок начался",
  finished: "Видеозвонок завершился",
  recording_ready: "Запись видеозвонка готова",
})
enum VideoCallEventType {
  @doc("Видеозвонок начался")
  started: "started",

  @doc("Видеозвонок завершился")
  finished: "finished",

  @doc("Запись видеозвонка готова")
  recording_ready: "recording_ready",
}

@doc("Параметры треда, в котором проходит видеозвонок")
model WebhookVideoCallThread {
  @doc("Идентификатор треда")
  @example(12345)
  id: int32;

  @doc("Идентификатор чата треда")
  @example(67890)
  chat_id: int32;

  @doc("Идентификатор сообщения, к которому создан тред. `null` у треда без сообщения-родителя — такие создаёт [Новый самостоятельный тред](POST /threads).")
  @example(268092)
  message_id: int32 | null;

  @doc("Идентификатор чата сообщения, к которому создан тред. `null` у треда без сообщения-родителя.")
  @example(23438)
  message_chat_id: int32 | null;
}

@doc("Участник видеозвонка")
model WebhookVideoCallMember {
  @doc("Идентификатор участника")
  @example(2345)
  user_id: int32;

  @doc("Дата и время первого подключения к звонку (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ")
  @example(utcDateTime.fromISO("2025-05-15T14:30:00.000Z"))
  joined_at: utcDateTime;

  @doc("Дата и время выхода из звонка (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ. Если участник оставался в звонке до его завершения, совпадает с временем окончания звонка.")
  @example(utcDateTime.fromISO("2025-05-15T14:45:00.000Z"))
  left_at: utcDateTime;
}

@doc("Структура исходящего вебхука о видеозвонке")
model VideoCallWebhookPayload {
  @doc("Тип объекта")
  @example("video_call")
  @extension("x-enum-descriptions", #{
    video_call: "Для видеозвонков всегда video_call"
  })
  type: "video_call";

  @doc("Тип события")
  @example(VideoCallEventType.started)
  event: VideoCallEventType;

  @doc("Идентификатор видеозвонка")
  @example(9012)
  video_room_id: int32;

  @doc("Идентификатор чата, в котором проходит видеозвонок")
  @example(23438)
  chat_id: int32;

  @doc("Идентификатор пользователя, начавшего видеозвонок")
  @example(2345)
  owner_id: int32;

  @doc("Объект с параметрами треда, если видеозвонок проходит в треде. `null`, если звонок не в треде.")
  thread?: WebhookVideoCallThread | null;

  @doc("Дата и время начала звонка (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ. Присутствует для событий started и finished.")
  @example(utcDateTime.fromISO("2025-05-15T14:30:00.000Z"))
  started_at?: utcDateTime;

  @doc("Дата и время завершения звонка (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ. Присутствует для события finished.")
  @example(utcDateTime.fromISO("2025-05-15T14:45:00.000Z"))
  finished_at?: utcDateTime;

  @doc("Длительность в секундах. Для события finished — длительность звонка, для recording_ready — длительность записи.")
  @example(900)
  duration?: int32;

  @doc("Список участников звонка. Присутствует для события finished.")
  members?: WebhookVideoCallMember[];

  @doc("Идентификатор записи. Присутствует для события recording_ready.")
  @example(4567)
  recording_id?: int32;

  @doc("Идентификатор файла записи. Присутствует для события recording_ready. `null`, если файл ещё не привязан.")
  @example(89012)
  file_id?: int32 | null;

  @doc("Прямая ссылка на файл записи. Присутствует для события recording_ready.")
  @example("https://api.pachca.com/files/89012")
  url?: string;

  @doc("Размер файла записи в байтах. Присутствует для события recording_ready.")
  @example(10485760)
  size?: int64;

  @doc("Дата и время отправки вебхука (UTC+0) в формате UNIX")
  @example(1747574400)
  webhook_timestamp: int32;
}

@doc("Объединение всех типов payload вебхуков")
@extension("x-union-deserializer", "webhook-payload")
union WebhookPayloadUnion {
  MessageWebhookPayload,
  ReactionWebhookPayload,
  ButtonWebhookPayload,
  ViewSubmitWebhookPayload,
  ChatMemberWebhookPayload,
  CompanyMemberWebhookPayload,
  LinkSharedWebhookPayload,
  VideoCallWebhookPayload,
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
  @doc("Дата начала для экспорта в формате YYYY-MM-DD. Если прислать дату со временем, время молча отбрасывается — экспорт всегда идёт по календарным дням.")
  @example(plainDate.fromISO("2025-03-20"))
  start_at: plainDate;
  
  @doc("Дата окончания для экспорта в формате YYYY-MM-DD, включительно. Если прислать дату со временем, время молча отбрасывается.")
  @example(plainDate.fromISO("2025-03-20"))
  end_at: plainDate;
  
  @doc("Адрес, на который придёт вебхук с номером готовой выгрузки. Без него узнать номер неоткуда: заказавший получит письмо и уведомление, а вызывающая программа — ничего.")
  @example("https://webhook.site/9227d3b8-6e82-4e64-bf5d-ad972ad270f2")
  webhook_url?: string;
  
  @doc("Массив идентификаторов чатов. Указывается, если нужно получить сообщения только некоторых чатов.")
  @example(#[1381521])
  chat_ids?: int32[];
  
  @doc("Пропуск формирования файла со списком чатов (chats.json)")
  @example(false)
  skip_chats_file?: boolean = false;
}

@route("/oauth/token/info")
@tag("OAuth")
interface OAuthOperations {
  @doc("""
Информация о токене

Сведения о токене, которым сделан сам запрос: его скоупы, владелец, даты создания и последнего использования. Сам токен приходит замаскированным — видны только первые 8 и последние 4 символа.

Метод не требует скоупа и отвечает на любой действующий токен, личный или бота. Поэтому им удобно проверять токен перед работой: живой отвечает `200`, отозванный или просроченный — `401`, а список скоупов сразу показывает, какие методы этому токену доступны.

Чей это токен, видно по `user_id`. Полную карточку владельца отдаёт [Свой профиль](GET /profile).
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

@route("/chats/exports")
@tag("Chats")
interface ExportOperations {
  @extension("x-requirements", #{
    scope: "chat_exports:write",
    plan: "corporation",
  })
  @doc("""
Экспорт сообщений

Заказ выгрузки сообщений пространства за период. Архив готовится в фоне, поэтому ответ приходит пустым и идентификатора выгрузки не содержит.

Номер готовой выгрузки приходит в поле `export_id` вебхука на адрес из `webhook_url`. Заказавший дополнительно получает письмо и уведомление в Пачке со ссылкой вида `/full_exports/{id}` — число в ней и есть идентификатор. Адрес вебхука необязателен, но без него программе номер взять неоткуда: остаются только письмо и уведомление заказавшему.

С этим идентификатором архив забирают методом [Скачать архив экспорта](GET /chats/exports/{id}).
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

В ответ на запрос сервер вернёт `302 Found` с заголовком `Location`, содержащим временную ссылку на скачивание файла. Большинство HTTP-клиентов автоматически следуют редиректу и скачивают файл.

Ссылка действует 5 минут, поэтому скачивайте архив сразу после запроса. Сам архив хранится 7 дней, а скачать его может только тот, кто заказал выгрузку. Другому сотруднику с тем же правом метод откажет.
""")
  @route("/{id}")
  @get

  downloadExport(
    @doc("Идентификатор экспорта")
    @extension("example", 22322)
    @path id: int32
  ): {
    @statusCode _: 302;
    @doc("Временная ссылка на архив в хранилище, действует 5 минут")
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

@route("/company/chats")
@tag("Chats")
interface CompanyChatOperations {
  @extension("x-requirements", #{
    scope: "company_chats:read",
    plan: "corporation",
  })
  @doc("""
Список чатов пространства

Беседы и каналы всего пространства, включая закрытые, где вы не состоите участником. Личные переписки и треды не возвращаются.

По умолчанию отдаются и активные, и архивные чаты. Параметр `activity` оставляет в выдаче только одно из состояний.

Метод доступен владельцу пространства. Каждый запрос записывается в [журнал аудита событий](/guides/audit-events) с типом `company_chats_accessed`.
""")
  @extension("x-paginated", true)
  @get
  listCompanyChats(
    @doc("Состояние чатов. Если параметр не указан, возвращаются и активные, и архивные чаты.")
    @extension("example", "active")
    @query activity?: ChatActivity,
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
    @body body: PaginatedDataResponse<Chat[]>;
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
    @statusCode _: 402;
    @body body: ApiError;
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
Свой профиль

Карточка владельца токена. У бот-токена это карточка самого бота.

Часовой пояс нужен, чтобы правильно понимать сроки, названные словами: «до 15:00» и «к пятнице» считаются в поясе сотрудника, а не в UTC. Пустое значение означает часовой пояс пространства.

Чужую карточку отдаёт [Информация о сотруднике](GET /users/{id}).
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
Свой статус

Статус владельца токена: эмодзи, подпись, срок и режим «Нет на месте».

Если статус не установлен, метод возвращает `200` и `null` в теле ответа — без объекта-обёртки. Статус с истёкшим `expires_at` какое-то время ещё возвращается, пока не будет очищен, поэтому проверяйте `expires_at` на стороне клиента.
""")
  @route("/status")
  @get
  getStatus(): {
    @statusCode _: 200;
    @body body: DataResponse<UserStatus> | null;
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
Новый свой статус

Ставит статус владельцу токена: эмодзи, подпись и, если нужно, срок. Метод доступен и боту — статус появится в карточке самого бота.

Режим «Нет на месте» включается этим же методом, флагом `is_away`. В `away_message` кладут текст, который увидят в профиле и при попытке написать или упомянуть. Когда срок из `expires_at` истекает, статус снимается целиком, вместе с режимом и этим текстом.

Перезаписываются только переданные поля. Чтобы продлить текущий статус, достаточно прислать один `expires_at`.

Срок, названный словами («до трёх», «до конца дня»), — это `expires_at`, а не часть подписи. Считается он в часовом поясе сотрудника, а пояс приходит в методе [Свой профиль](GET /profile).

Эмодзи обязателен, и он должен быть ровно один, без текста вокруг. Подпись обязательна и не длиннее 50 символов.
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
Удаление своего статуса

Снимает статус с владельца токена вместе с режимом «Нет на месте» и его текстом. Если статуса не было, ответ всё равно `204`, поэтому повторный вызов безопасен.
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
// Profile Avatar Operations
// ============================================================================

@route("/profile")
@tag("Profile")
interface ProfileAvatarOperations {
  @extension("x-requirements", #{
    scope: "profile_avatar:write",
  })
  @doc("""
Загрузка своего аватара

Ставит или заменяет аватар владельца токена. Файл передаётся в формате `multipart/form-data`, в ответе приходит только ссылка на новое изображение.

Принимаются `jpg`, `jpeg`, `png` и `gif`, причём анимированный `gif` — не больше 2 МБ. Картинка уменьшается до 1024 на 1024 пикселя, а непрозрачный `png` сохраняется как `jpg`.

Аватар другого сотрудника ставит [Загрузка аватара сотрудника](PUT /users/{user_id}/avatar), и это доступно только владельцу пространства и администратору.
""")
  @route("/avatar")
  @put
  updateProfileAvatar(
    @multipartBody body: {
      @doc("Файл изображения для аватара")
      image: HttpPart<bytes>;
    }
  ): {
    @statusCode _: 200;
    @body body: DataResponse<AvatarData>;
  } | {
    @statusCode _: 401;
    @body body: OAuthError;
  } | {
    @statusCode _: 403;
    @body body: ApiError | OAuthError;
  } | {
    @statusCode _: 402;
    @body body: ApiError;
  } | {
    @statusCode _: 422;
    @body body: ApiError;
  };

  @extension("x-requirements", #{
    scope: "profile_avatar:write",
  })
  @doc("""
Удаление своего аватара

Убирает аватар владельца токена, дальше в интерфейсе показываются инициалы. Если аватара не было, ответ всё равно `204`.
""")
  @route("/avatar")
  @delete
  deleteProfileAvatar(): {
    @statusCode _: 204;
  } | {
    @statusCode _: 401;
    @body body: OAuthError;
  } | {
    @statusCode _: 403;
    @body body: ApiError | OAuthError;
  } | {
    @statusCode _: 402;
    @body body: ApiError;
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
Новый сотрудник

Заводит сотрудника в пространстве и отправляет ему приглашение на почту. Доступно владельцу пространства и администратору, боту метод недоступен.

Если сотрудник с этим адресом уже есть в пространстве, метод отвечает `409`. Занятый ник ошибкой не считается: к нему молча дописываются случайные символы, и в ответе приходит уже изменённый.

Вы можете заполнять дополнительные поля сотрудника, которые созданы в вашей компании. Получить актуальный список идентификаторов дополнительных полей сотрудника вы можете в методе [Список дополнительных полей](GET /custom_properties).

Поле `list_tags` сразу заводит сотрудника в теги, а вместе с тегами — и в чаты, к которым эти теги привязаны. У гостя теги не назначаются вовсе: ответ приходит успешный, а `list_tags` в нём пустой.

Через параметр `chat_ids` сотрудника можно сразу добавить в указанные чаты. Чтобы создать гостя, передайте `role: "guest"` — для этой роли `chat_ids` обязателен и должен содержать ровно один активный чат, в который у токена есть право добавлять участников. При нарушении правил гостевого доступа возвращается `400` с ошибкой по полю `chat_ids`.
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
  } | {
    @statusCode _: 402;
    @body body: ApiError;
  } | {
    @statusCode _: 409;
    @body body: ApiError;
  };

  @extension("x-requirements", #{
    scope: "users:read",
  })
  @doc("""
Список сотрудников

Все сотрудники пространства, кроме удалённых. Приостановленные приходят вместе с остальными и отличаются полем `suspended`.

Боты в пространстве — тоже сотрудники и приходят в общем списке с `bot: true`. Но из выдачи по `query` они исключены: чтобы найти бота по имени, перебирайте страницы без поискового запроса или пользуйтесь методом [Список ботов](GET /bots).

Почта и телефон приходят `null`, если в пространстве выключен показ персональных данных, а вызывающий не администратор.

Карточку одного сотрудника отдаёт [Информация о сотруднике](GET /users/{id}), свою — [Свой профиль](GET /profile).
""")
  @extension("x-paginated", true)
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
    @doc("Курсор для пагинации (из `meta.paginate.next_page` или `meta.paginate.prev_page`)")
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
  } | {
    @statusCode _: 402;
    @body body: ApiError;
  };

  @extension("x-requirements", #{
    scope: "users:read",
  })
  @doc("""
Информация о сотруднике

Карточка сотрудника.

Приостановленный сотрудник отдаётся с `suspended: true`, удалённый — `404`, как несуществующий. Бот тоже приходит сюда как сотрудник, с `bot: true`.

Почта и телефон приходят `null`, если в пространстве выключен показ персональных данных, а вызывающий не администратор. Свою карточку сотрудник видит целиком — она же отдаётся методом [Свой профиль](GET /profile) и без скоупа `users:read`.
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
  } | {
    @statusCode _: 402;
    @body body: ApiError;
  };

  @extension("x-requirements", #{
    scope: "users:update",
  })
  @doc("""
Редактирование сотрудника

Меняет карточку сотрудника: перезаписываются только переданные поля. Идентификаторы дополнительных полей отдаёт [Список дополнительных полей](GET /custom_properties).

Поле `list_tags` заменяет набор тегов целиком, поэтому присылайте вместе с новым тегом и те, что сохраняются. Снятый тег выводит сотрудника из чатов, куда его привёл этот тег, а имя, которого в пространстве ещё нет, создаёт новый тег вместе с назначением.

`suspended: true` приостанавливает сотрудника: он теряет доступ, но остаётся в чатах, тегах и задачах, а `suspended: false` возвращает его обратно. Насовсем убирает сотрудника [Удаление сотрудника](DELETE /users/{id}).

Владельца пространства редактирует только он сам, а его роль меняется лишь на администратора. Перевести обычного сотрудника в гостя нельзя — в обоих случаях ответ `403`.

Незнакомое значение роли метод молча пропускает: ответ приходит успешный, а роль остаётся прежней.
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
  } | {
    @statusCode _: 402;
    @body body: ApiError;
  } | {
    @statusCode _: 409;
    @body body: ApiError;
  };

  @extension("x-requirements", #{
    scope: "users:delete",
  })
  @doc("""
Удаление сотрудника

Убирает сотрудника из пространства. Отменить это нельзя: вернуть его можно только новым приглашением, и это будет уже другой сотрудник.

Что происходит: он выходит из всех бесед и каналов, кроме личных переписок, с него снимаются все теги, задачи, где он был единственным исполнителем, удаляются, а из остальных он убирается. Написанные им сообщения и файлы остаются на месте.

Владельца пространства удалить нельзя — метод ответит `403`. Повторный вызов отвечает `404`: удалённого сотрудника метод уже не находит.

Если сотрудник уходит в отпуск или увольнение ещё не финальное, пользуйтесь методом [Редактирование сотрудника](PUT /users/{id}) с `suspended: true`. Приостановка обратима и сохраняет чаты, теги и задачи.
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
  } | {
    @statusCode _: 402;
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

Статус другого сотрудника: эмодзи, подпись, срок и режим «Нет на месте».

Если статус не установлен, метод возвращает `200` и `null` в теле ответа — без объекта-обёртки. Статус с истёкшим `expires_at` какое-то время ещё возвращается, пока не будет очищен, поэтому проверяйте `expires_at` на стороне клиента.
""")
  @route("/{user_id}/status")
  @get
  getUserStatus(
    @doc("Идентификатор пользователя")
    @extension("example", 12)
    @path user_id: int32
  ): {
    @statusCode _: 200;
    @body body: DataResponse<UserStatus> | null;
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

Ставит статус другому сотруднику — например, «в отпуске» на время отсутствия. Доступно владельцу пространства и администратору, боту метод недоступен даже с выданным скоупом.

Этим же методом сотруднику включают режим «Нет на месте» флагом `is_away` и задают текст `away_message`, который увидят при попытке к нему обратиться.

Статус видят все, кто видит сотрудника в пространстве. Перезаписываются только переданные поля, поэтому продлить чужой статус можно одним `expires_at`.

Срок, названный словами, — это `expires_at`, а не часть подписи, и считается он в часовом поясе того сотрудника, которому ставят статус. Эмодзи обязателен и ровно один, подпись обязательна и не длиннее 50 символов.

Свой статус ставят методом [Новый свой статус](PUT /profile/status) — он доступен всем ролям и ботам.
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

Снимает статус с другого сотрудника вместе с режимом «Нет на месте» и его текстом. Доступно владельцу пространства и администратору, боту метод недоступен.

Если статуса не было, ответ всё равно `204`. Свой статус снимает [Удаление своего статуса](DELETE /profile/status).
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
// User Avatar Operations
// ============================================================================

@route("/users")
@tag("Users")
interface UserAvatarOperations {
  @extension("x-requirements", #{
    scope: "user_avatar:write",
  })
  @doc("""
Загрузка аватара сотрудника

Ставит или заменяет аватар другому сотруднику. Доступно владельцу пространства и администратору, боту метод недоступен. Аватар владельца пространства меняет только он сам.

Файл передаётся в формате `multipart/form-data`, в ответе приходит только ссылка на новое изображение. Принимаются `jpg`, `jpeg`, `png` и `gif`, анимированный `gif` — не больше 2 МБ, картинка уменьшается до 1024 на 1024 пикселя.

Свой аватар ставят методом [Загрузка своего аватара](PUT /profile/avatar) — он доступен всем ролям и ботам.
""")
  @route("/{user_id}/avatar")
  @put
  updateUserAvatar(
    @doc("Идентификатор пользователя")
    @extension("example", 12)
    @path user_id: int32,
    @multipartBody body: {
      @doc("Файл изображения для аватара")
      image: HttpPart<bytes>;
    }
  ): {
    @statusCode _: 200;
    @body body: DataResponse<AvatarData>;
  } | {
    @statusCode _: 401;
    @body body: OAuthError;
  } | {
    @statusCode _: 403;
    @body body: ApiError | OAuthError;
  } | {
    @statusCode _: 404;
    @body body: ApiError;
  } | {
    @statusCode _: 402;
    @body body: ApiError;
  } | {
    @statusCode _: 422;
    @body body: ApiError;
  };

  @extension("x-requirements", #{
    scope: "user_avatar:write",
  })
  @doc("""
Удаление аватара сотрудника

Убирает аватар другому сотруднику, дальше в интерфейсе показываются инициалы. Доступно владельцу пространства и администратору, боту метод недоступен, а аватар владельца пространства убирает только он сам.

Если аватара не было, ответ всё равно `204`.
""")
  @route("/{user_id}/avatar")
  @delete
  deleteUserAvatar(
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
    @body body: ApiError | OAuthError;
  } | {
    @statusCode _: 404;
    @body body: ApiError;
  } | {
    @statusCode _: 402;
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

Создаёт тег. Тег — это способ держать состав чатов сам собой: его привязывают к беседе или каналу, и все, у кого этот тег есть, оказываются там автоматически.

Сотрудников в тег добавляют не здесь, а в карточке каждого — [Редактирование сотрудника](PUT /users/{id}) с полем `list_tags`. Свежий тег создаётся пустым, с `users_count: 0`. К чату его привязывает метод [Добавление тегов](POST /chats/{id}/group_tags).

Название уникально в пространстве без учёта регистра и не может содержать `@`. Создавать теги могут владелец пространства и администратор, боту метод недоступен.
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
  } | {
    @statusCode _: 402;
    @body body: ApiError;
  } | {
    @statusCode _: 409;
    @body body: ApiError;
  };

  @extension("x-requirements", #{
    scope: "group_tags:read",
  })
  @doc("""
Информация о теге

Название тега и число сотрудников в нём.

В `users_count` считаются только действующие сотрудники: приостановленные в счётчик не попадают, хотя в методе [Список сотрудников тега](GET /group_tags/{id}/users) остаются.
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
  } | {
    @statusCode _: 402;
    @body body: ApiError;
  };

  @extension("x-requirements", #{
    scope: "group_tags:read",
  })
  @doc("""
Список тегов

Все теги пространства с числом сотрудников в каждом. Видны они одинаково всем ролям, независимо от того, к каким чатам привязаны.

Параметр `names` ищет теги по названиям — это способ получить `id` по имени, известному из интерфейса. За один запрос он принимает не больше 100 имён.

Кто состоит в конкретном теге, отдаёт [Список сотрудников тега](GET /group_tags/{id}/users).
""")
  @extension("x-paginated", true)
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
    @doc("Курсор для пагинации (из `meta.paginate.next_page` или `meta.paginate.prev_page`)")
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
  } | {
    @statusCode _: 402;
    @body body: ApiError;
  };

  @extension("x-requirements", #{
    scope: "group_tags:read",
  })
  @doc("""
Список сотрудников тега

Кто состоит в теге. Приостановленные сотрудники в списке приходят, хотя в `users_count` самого тега они не учтены. Удалённые не приходят, а боты, помеченные тегом, в выдачу попадают.

Состав тега меняют в карточке сотрудника — [Редактирование сотрудника](PUT /users/{id}) с полем `list_tags`, по одному сотруднику за раз.
""")
  @extension("x-paginated", true)
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
    @doc("Курсор для пагинации (из `meta.paginate.next_page` или `meta.paginate.prev_page`)")
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
  } | {
    @statusCode _: 402;
    @body body: ApiError;
  };

  @extension("x-requirements", #{
    scope: "group_tags:write",
  })
  @doc("""
Редактирование тега

Переименовывает тег. Состав сотрудников и привязки к чатам при этом не меняются: у всех, кто был в теге, он остаётся, только под новым названием.

Название уникально в пространстве без учёта регистра и не может содержать `@`. Переименовывать теги могут владелец пространства и администратор, боту метод недоступен.
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
  } | {
    @statusCode _: 402;
    @body body: ApiError;
  } | {
    @statusCode _: 409;
    @body body: ApiError;
  };

  @extension("x-requirements", #{
    scope: "group_tags:write",
  })
  @doc("""
Удаление тега

Убирает тег из пространства: он снимается со всех сотрудников и отвязывается от всех чатов.

Из чатов при этом никто не выходит. Сотрудники, которых тег привёл в беседу или канал, остаются там обычными участниками, и дальше их состав тегом уже не поддерживается. Чтобы вывести их из конкретного чата, пользуйтесь методом [Исключение тега](DELETE /chats/{id}/group_tags/{tag_id}) до удаления самого тега.

Удалять теги могут владелец пространства и администратор, боту метод недоступен.
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
  } | {
    @statusCode _: 402;
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

Создаёт беседу или канал. Владелец токена становится владельцем чата, и роль эта в дальнейшем не передаётся.

Для создания личной переписки 1 на 1 с пользователем пользуйтесь методом [Новое сообщение](POST /messages). Чтобы обсудить конкретное сообщение, чат заводить не нужно — под ним заводят тред методом [Новый тред](POST /messages/{id}/thread). Разговору на одну тему постоянное место тоже не нужно: для него есть метод [Новый самостоятельный тред](POST /threads).

Участников можно передать сразу: `member_ids` добавляет поимённо, `group_tag_ids` приводит всех, кто состоит в теге, и дальше поддерживает состав сам. Идентификаторы, которых в пространстве нет, а также приостановленные и удалённые сотрудники молча отбрасываются — ответ приходит успешным, а сотрудника в чате не оказывается, поэтому сверяйте состав в ответе.
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
  } | {
    @statusCode _: 402;
    @body body: ApiError;
  };

  @extension("x-requirements", #{
    scope: "chats:read",
  })
  @doc("""
Информация о чате

Карточка чата вместе с составом участников и привязанными тегами.

Закрытая беседа, в которой вызывающий не состоит, отвечает `403`, а не `404`: существование чата этим методом не скрывается. Открытый канал своего пространства отдаётся и тому, кто в него не вступал. Владельцу пространства метод тоже не открывает чужие закрытые чаты — весь их перечень отдаёт [Список чатов пространства](GET /company/chats).

В `member_ids` приходят только действующие участники: приостановленные в список не попадают, хотя членство у них сохраняется.
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
  } | {
    @statusCode _: 402;
    @body body: ApiError;
  };

  @extension("x-requirements", #{
    scope: "chats:read",
  })
  @doc("""
Список чатов

По умолчанию — беседы, каналы и личные переписки, где состоит владелец токена. С `availability=public` метод отдаёт вместо этого все открытые чаты пространства, включая те, куда вызывающий не вступал.

Треды в списке не приходят никогда, для них есть [Список тредов](GET /threads).

`archived=true` не переключает выдачу на архив, а добавляет архивные чаты к активным.
""")
  @extension("x-paginated", true)
  @get
  listChats(
    @doc("Поле сортировки")
    @extension("example", "id")
    @query sort?: ChatSortField = ChatSortField.id,
    @doc("Направление сортировки")
    @extension("example", "desc")
    @query order?: SortOrder = SortOrder.desc,
    @doc("Параметр, который отвечает за доступность и выборку чатов для пользователя")
    @extension("example", "is_member")
    @query availability?: ChatAvailability = ChatAvailability.is_member,
    @doc("Добавляет к выдаче архивные чаты. По умолчанию возвращаются только активные. Работает при любом значении `availability`.")
    @extension("example", true)
    @query archived?: boolean = false,
    @doc("Фильтрация по времени создания последнего сообщения: вернутся чаты, где оно позже указанного. Значение в ISO-8601, смещение вида `+03:00` учитывается, время без смещения считается UTC.")
    @extension("example", "2025-01-01T00:00:00.000Z")
    @query last_message_at_after?: utcDateTime,
    @doc("Фильтрация по времени создания последнего сообщения: вернутся чаты, где оно раньше указанного. Значение в ISO-8601, смещение вида `+03:00` учитывается, время без смещения считается UTC.")
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
    @doc("Курсор для пагинации (из `meta.paginate.next_page` или `meta.paginate.prev_page`)")
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
  } | {
    @statusCode _: 402;
    @body body: ApiError;
  };

  @extension("x-requirements", #{
    scope: "chats:update",
  })
  @doc("""
Редактирование чата

Меняет название беседы или канала и его доступность. Оба изменения видны участникам системным сообщением в ленте чата.

Личный чат переименовать нельзя, архивный — тоже: сначала верните его из архива методом [Разархивация чата](PUT /chats/{id}/unarchive). В закрытом чате метод доступен владельцу и администратору чата, в открытом — любому сотруднику пространства, даже не участнику.

Состав участников этим методом не меняется, для него есть [Добавление пользователей](POST /chats/{id}/members) и [Исключение пользователя](DELETE /chats/{id}/members/{user_id}).
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
  } | {
    @statusCode _: 402;
    @body body: ApiError;
  };

  @extension("x-requirements", #{
    scope: "chats:archive",
  })
  @doc("""
Архивация чата

Отправляет беседу или канал в архив: чат пропадает из списков у всех участников, новые сообщения в него не принимаются, а история сохраняется.

Архивация не только замораживает чат. Из него исключаются все гости, а теги от него отвязываются. Приведённые тегом сотрудники при этом остаются обычными участниками, но состав чата больше не поддерживается сам. Метод [Разархивация чата](PUT /chats/{id}/unarchive) не возвращает ни гостей, ни привязку тегов.

Треды, заведённые в чате, остаются открытыми: писать в них можно и после архивации.

Личный чат и тред в архив не отправляются. Повторная архивация уже архивного чата отвечает `403`.
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

Возвращает беседу или канал из архива: чат снова появляется в списках, и в него снова можно писать.

Если чат и так не в архиве, метод всё равно отвечает успехом.
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

Кто состоит в беседе, канале или треде. Боты приходят наравне с сотрудниками, с `bot: true`.

Владелец пространства может получить состав участников любого чата пространства. Администраторы и боты получают состав только тех чатов, где состоят сами, и открытых чатов пространства.

В выдачу попадают только действующие сотрудники: приостановленные не приходят, хотя членство у них сохраняется. Роль участника в чате метод не отдаёт — параметр `role` работает только как фильтр.
""")
  @extension("x-paginated", true)
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
    @doc("Курсор для пагинации (из `meta.paginate.next_page` или `meta.paginate.prev_page`)")
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

Добавляет сотрудников и ботов в беседу, канал или тред. Бота добавляют так же, как сотрудника: его `id` в `member_ids`. В канале он получает роль редактора, а в беседе становится обычным участником — и только после этого может туда писать.

Роль в чате назначается в момент добавления: владелец пространства и администратор становятся администраторами чата, остальные — обычными участниками. Дальше она сама не пересчитывается, и повышение сотрудника в пространстве ничего не меняет там, где он уже состоит. Менять роль нужно методом [Редактирование роли](PUT /chats/{id}/members/{user_id}).

Тех, кто уже состоит в чате, метод пропускает молча и ошибкой это не считает. А вот неизвестный или неактивный идентификатор останавливает весь запрос: метод отвечает `404` и перечисляет такие значения, никто при этом не добавляется.

Добавить сразу целый отдел удобнее тегом — [Добавление тегов](POST /chats/{id}/group_tags): тогда состав чата поддерживается сам.
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

Убирает сотрудника или бота из беседы, канала или треда. Из треда исключают по его `chat_id`. В закрытой беседе исключённый теряет доступ к чату, но остаётся в тредах, где состоял.

Сотрудника, которого держит в чате привязанный тег, этим методом убрать нельзя: ответ придёт успешный, а сотрудник останется в чате. Снимите с него тег методом [Редактирование сотрудника](PUT /users/{id}) или отцепите тег от чата методом [Исключение тега](DELETE /chats/{id}/group_tags/{tag_id}).

Если пользователь является владельцем чата, то исключить его нельзя. Он может только самостоятельно выйти из чата, воспользовавшись методом [Выход из чата](DELETE /chats/{id}/leave).
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

Привязывает теги к беседе или каналу, чтобы состав чата поддерживался сам.

После добавления тега все его участники автоматически становятся участниками чата. Состав участников тега и чата синхронизируется автоматически: при добавлении нового участника в тег он сразу появляется в чате, при удалении из тега — удаляется из чата.

Если хотя бы один из переданных тегов не найден, метод отвечает `404` и не привязывает ни одного. Тег, который к чату уже привязан, повторно не привязывается, а его участники всё равно догружаются в чат.

Привязать тег может участник закрытой беседы и любой сотрудник пространства в открытом чате, а отцепить — только владелец или администратор чата методом [Исключение тега](DELETE /chats/{id}/group_tags/{tag_id}).
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

Отцепляет тег от беседы или канала и выводит оттуда сотрудников, которых держал только он.

Выход происходит фоном, уже после ответа: метод отвечает `204` сразу, а состав чата меняется через несколько мгновений. Останутся владелец чата, те, кого приводит другой тег этого же чата, и те, кого добавляли в чат вручную.

Снять тег с чата может владелец или администратор чата. Привязать его обратно можно методом [Добавление тегов](POST /chats/{id}/group_tags).
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

Меняет роль участника беседы или канала. Роль в чате с ролью в пространстве не связана: рядовой сотрудник может быть администратором чата, а повышение в пространстве роли в чатах не меняет.

Роль `editor` существует только в каналах. Себе роль сменить нельзя, как и тому, кто в чате не состоит: метод ответит ошибкой. Повторная установка той же роли считается ошибкой, а не повтором.

Владельцу чата роль изменить нельзя. Он всегда имеет права администратора чата.
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
Выход из чата

Владелец токена выходит из беседы, канала или треда сам. Из треда выходят по его `chat_id`. В закрытой беседе остальные видят системное сообщение о выходе, в открытом чате и канале — нет.

Выйти нельзя, если сотрудника держит в чате привязанный тег: метод ответит `403`, пока тег не снимут с сотрудника или с чата. Из личной переписки выйти тоже нельзя, а вот из архивного чата можно.

Вернуться в открытый чат можно самому, в закрытый — только если кто-то из участников добавит обратно. Другого сотрудника выводит [Исключение пользователя](DELETE /chats/{id}/members/{user_id}).
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

@tag("Threads")
interface ThreadOperations {
  @extension("x-requirements", #{
    scope: "threads:create",
  })
  @doc("""
Новый тред

Заводит тред под сообщением — место, где обсуждают сказанное, не засоряя ленту чата. Тред — это отдельный доступ: в него можно позвать сотрудника, не открывая ему сам чат, и он увидит только тред и родительское сообщение. Если обсуждать нужно тему, а не сообщение, заводите тред методом [Новый самостоятельный тред](POST /threads).

В новый тред сразу попадают тот, кто его создал, автор сообщения, все, кто ставил на сообщение реакции, и участники чата, включившие уведомления о тредах. Упомянутых в родительском сообщении — и поимённо, и тегом — добавляет фоновая задача сразу после создания, поэтому в первом ответе их может ещё не быть. Общие упоминания вроде `@all` в тред никого не приводят, а упомянутого, которого нет в самом чате, тред не подхватит.

Пустой тред разговором ещё не является: сразу отправьте в него первое сообщение методом [Новое сообщение](POST /messages) с `entity_type: "thread"`. Названия у треда нет, и удалить его нельзя ни через API, ни в приложении.

Если у сообщения уже был создан тред, то в ответе на запрос вернётся информация об уже созданном ранее треде. Тред под сообщением, которое само лежит в треде, завести нельзя: вложенных тредов в Пачке нет.
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
    scope: "threads:create",
  })
  @doc("""
Новый самостоятельный тред

Заводит тред, который ни к чему не привязан: место для разговора, диалога с агентом или звонка, которому не нужен отдельный чат. Собрать в нём можно любых сотрудников.

Тело запроса не требуется. Создатель треда становится его единственным участником, а поля `message_id` и `message_chat_id` в ответе возвращаются как `null`. Добавить в тред участников проще всего упоминанием: `@ник` или `@тег` в начале или в конце текста сообщения. Можно и методом [Добавление пользователей](POST /chats/{id}/members) по `chat_id` треда.

Названия у треда нет, поэтому сразу отправьте в него первое сообщение — по нему сотрудники и поймут, о чём речь. Удалить тред нельзя. Если обсуждать нужно конкретное сообщение в чате, заводите тред под ним методом [Новый тред](POST /messages/{id}/thread), а если нужно постоянное место с названием — создайте его методом [Новый чат](POST /chats).
""")
  @opExample(#{
    returnType: #{
      _: 201,
      body: #{
        data: #{
          id: 265142,
          chat_id: 2637266155,
          message_id: null,
          message_chat_id: null,
          updated_at: utcDateTime.fromISO("2023-02-01T19:20:47.204Z"),
        },
      },
    },
  })
  @route("/threads")
  @post
  createStandaloneThread(): {
    @statusCode _: 201;
    @body body: DataResponse<Thread>;
  } | {
    @statusCode _: 401;
    @body body: OAuthError;
  } | {
    @statusCode _: 402;
    @body body: ApiError;
  } | {
    @statusCode _: 403;
    @body body: OAuthError;
  };

  @extension("x-requirements", #{
    scope: "threads:read",
  })
  @doc("""
Информация о треде

Идентификаторы треда: его собственный `id`, `chat_id` для чтения и отправки сообщений и идентификаторы сообщения, под которым он висит. У самостоятельного треда `message_id` и `message_chat_id` приходят как `null`.

В ответе только идентификаторы: названия и счётчика сообщений у треда нет, о чём он — видно по переписке внутри. Сообщения треда читаются методом [Список сообщений чата](GET /messages), а состав участников — методом [Список участников чата](GET /chats/{id}/members), оба по `chat_id` треда.

Доступ к треду шире, чем выдача метода [Список тредов](GET /threads): тред, который открывается по `id`, в списке может и не появиться.
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
  } | {
    @statusCode _: 402;
    @body body: ApiError;
  };

  @extension("x-requirements", #{
    scope: "threads:read",
  })
  @doc("""
Список тредов

Треды, доступные владельцу токена.

Возвращаются треды, где вы состоите в самом треде или в чате, в котором он заведён. Участия в треде достаточно: входить в чат с родительским сообщением не нужно, самостоятельные треды тоже приходят. А вот треды из открытых чатов пространства, где вы не состоите, в список не попадают, хотя сами чаты вам доступны.

Сортировка — по убыванию времени последнего сообщения в треде.

В элементе списка нет ни названия, ни текста: только идентификаторы треда, его чата и родительского сообщения. Чтобы понять, о чём тред, прочитайте его сообщения методом [Список сообщений чата](GET /messages) по `chat_id`, а нужный тред по содержанию ищут методом [Поиск сообщений](GET /search/messages).
""")
  @extension("x-paginated", true)
  @route("/threads")
  @get
  listThreads(
    @doc("Фильтрация по времени последнего сообщения в треде: вернутся треды, где оно позже указанного. Значение в ISO-8601, смещение вида `+03:00` учитывается, время без смещения считается UTC.")
    @extension("example", "2025-01-01T00:00:00.000Z")
    @query last_message_at_after?: utcDateTime,
    @doc("Фильтрация по времени последнего сообщения в треде: вернутся треды, где оно раньше указанного. Значение в ISO-8601, смещение вида `+03:00` учитывается, время без смещения считается UTC.")
    @extension("example", "2025-02-01T00:00:00.000Z")
    @query last_message_at_before?: utcDateTime,
    @doc("Количество возвращаемых сущностей за один запрос")
    @query
    @extension("example", 1)
    @minValue(1)
    @maxValue(50)
    limit?: int32 = 50,
    @doc("Курсор для пагинации (из `meta.paginate.next_page` или `meta.paginate.prev_page`)")
    @extension("example", "eyJpZCI6MTAsImRpciI6ImFzYyJ9")
    @query cursor?: string
  ): {
    @statusCode _: 200;
    @body body: PaginatedDataResponse<Thread[]>;
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
    @statusCode _: 402;
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

Отправляет сообщение в беседу или канал, личное сообщение пользователю или комментарий в тред.

С `entity_type: "discussion"` — это значение по умолчанию — в `entity_id` можно передать `chat_id` любого чата, так что для отправки достаточно знать идентификатор чата. Сообщение в тред можно адресовать и идентификатором самого треда, а личное — идентификатором пользователя, но тогда нужен соответствующий `entity_type`: `thread` или `user`.

Личный чат для этого создавать не требуется: он появится сам, если между вами ещё не было переписки. Между двумя пользователями может быть только один личный чат. Со своим собственным идентификатором сообщение уйдёт в чат с самим собой, где пишут заметки себе.

Тред, в отличие от личного чата, сам не появляется: если у сообщения треда ещё нет, его сначала создают методом [Новый тред](POST /messages/{id}/thread).

Текст в поле `content` разбирается как markdown: жирный, курсив, зачёркнутый, строчный код, блок кода и ссылки. Списки и таблицы не разбираются — `-`, `1.` и `|` остаются как есть, у цитаты пропадает `>`, а строка с решёткой и пробелом становится жирной. Таблицу, чек-лист или диаграмму приложите файлом `.md`: Пачка показывает такой файл оформленным, а если он единственный документ в сообщении, его начало видно прямо в чате. Подробности — в разделе [Форматирование текста](/guides/markdown).

`@all` упоминает всех участников чата, `@here` — тех, кто сейчас в сети, а `@` с названием тега без пробелов — сотрудников этого тега. В треде упоминание работает ещё и как приглашение: упомянутого сотрудника, которого в треде нет, Пачка туда добавляет, и он получает доступ к треду и родительскому сообщению. Чтобы этого не происходило, передайте `skip_invite_mentions: true`. В беседе и канале упоминание никого не добавляет, и этот параметр там ничего не меняет. Имя без `@` и упоминание внутри строчного кода или блока кода упоминанием не считаются.

Под текстом сообщения можно показать кнопки — массив `buttons`, где каждый вложенный массив это ряд. Работают они только у сообщений, отправленных токеном бота: нажатие на кнопку с `data` приходит событием `button_click` тому самому боту, а вместе с ним `trigger_id` — на открытие формы по нему есть 3 секунды, метод [Открытие представления](POST /views/open). Кнопка с `url` просто ведёт по ссылке и события не создаёт. Подробности в разделе [Кнопки](/guides/buttons).

Бот может подписать сообщение чужим именем и аватаром: `display_name` и `display_avatar_url` меняют отправителя только у этого сообщения. Бейдж «Бот» остаётся, а в профиле отправителя видно настоящего бота. Так показывают автора из другой системы, когда переносят в Пачку чужую переписку. С личным токеном поля недоступны, ответ `403`. Подробности — в разделе [Боты](/guides/bots/overview).

К сообщению можно приложить не больше 10 файлов. Превью ссылки строится, только если передать `link_preview` в корне тела запроса.

Действует суточный предел на число сообщений в один чат от одного отправителя. При превышении метод отвечает `429`, а в заголовке `Retry-After` приходит пауза до следующей попытки. Значения пределов — в разделе [Лимиты](/api/limits).
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
  } | {
    @statusCode _: 402;
    @body body: ApiError;
  } | {
    @statusCode _: 429;
    @header("Retry-After") retryAfter: int32;
    @body body: ApiError;
  };

  @extension("x-requirements", #{
    scope: "messages:read",
  })
  @doc("""
Информация о сообщении

Сообщение вместе с автором, вложениями и кнопками.

Удалённое сообщение метод всё равно отдаёт — с пустым `content` и заполненным `deleted_at`, без файлов и реакций.

Ссылки на файлы в ответе временные. Обычный файл отдаётся прямой ссылкой на хранилище, а защищённый и зашифрованный — адресом API, по которому нужен токен со скоупом `files:read`.
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
  } | {
    @statusCode _: 402;
    @body body: ApiError;
  };

  @extension("x-requirements", #{
    scope: "messages:update",
  })
  @doc("""
Редактирование сообщения

Меняет текст, файлы и кнопки уже отправленного сообщения. В интерфейсе у него появляется пометка о правке. Текст оформляется по тем же правилам, что и в методе [Новое сообщение](POST /messages).

Править можно только свои сообщения, и только обычные: системное, пересланное и голосовое метод не меняет. Ограничений по давности отправки нет.

Файлы и кнопки заменяются целиком: пустой массив снимает их все, а отсутствие поля в теле оставляет как было. Любая правка убирает превью ссылок, и заново оно не строится.
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
  } | {
    @statusCode _: 402;
    @body body: ApiError;
  };

  @extension("x-requirements", #{
    scope: "messages:delete",
  })
  @doc("""
Удаление сообщения

Удаление сообщения доступно отправителю, админам и редакторам в чате. В личных сообщениях оба пользователя являются редакторами. Ограничений по давности отправки сообщения нет.

Текст, файлы и реакции пропадают у всех и не восстанавливаются, закрепление снимается, а в переписке на месте сообщения остаётся пометка «Сообщение удалено».

Тред, заведённый под этим сообщением, остаётся вместе со всей перепиской в нём. Повторное удаление отвечает `204` и уже ничего не меняет.
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
  } | {
    @statusCode _: 402;
    @body body: ApiError;
  };

  @extension("x-requirements", #{
    scope: "pins:write",
  })
  @doc("""
Закрепление сообщения

Закрепляет сообщение в шапке беседы или канала, где его видят все участники. Ограничения на число закреплённых сообщений нет.

В тредах метод не работает. Уже закреплённое сообщение отвечает `409`, а удалённое — `422`.
""")
  @route("/{id}/pin")
  @post

  pinMessage(
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
  } | {
    @statusCode _: 422;
  } | {
    @statusCode _: 409;
    @body body: ApiError;
  };

  @extension("x-requirements", #{
    scope: "pins:write",
  })
  @doc("""
Открепление сообщения

Снимает закрепление с сообщения. Если сообщение не было закреплено, ответ всё равно `204`, поэтому повторный вызов безопасен.
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

Лента сообщений беседы, канала, треда или личной переписки — по `chat_id` нужного чата.

Сообщения приходят от новых к старым, то есть первыми идут последние сообщения чата. За более ранними обращайтесь с параметрами `limit` и `cursor`.

Удалённые сообщения в список не попадают.

Сообщения треда отдаются по `chat_id` самого треда, а не по чату, где висит родительское сообщение. Идентификатор треда приходит в поле `thread` родительского сообщения.
""")
  @extension("x-paginated", true)
  @get
  listChatMessages(
    @doc("Идентификатор чата (беседа, канал, диалог или чат треда)")
    @extension("example", 198)
    @query chat_id: int32,
    @doc("Поле сортировки")
    @extension("example", "id")
    @query sort?: MessageSortField = MessageSortField.id,
    @doc("Направление сортировки")
    @extension("example", "desc")
    @query order?: SortOrder = SortOrder.desc,
    @doc("Количество возвращаемых сущностей за один запрос")
    @query
    @extension("example", 1)
    @minValue(1)
    @maxValue(50)
    limit?: int32 = 50,
    @doc("Курсор для пагинации (из `meta.paginate.next_page` или `meta.paginate.prev_page`)")
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
  } | {
    @statusCode _: 402;
    @body body: ApiError;
  };
}

// ============================================================================
// Read Member Operations
// ============================================================================

@tag("Read members")
interface ReadMemberOperations {
  @extension("x-requirements", #{
    scope: "messages:read",
  })
  @doc("""
Список прочитавших сообщение

Кто из участников чата дочитал ленту до этого сообщения. Отдаётся плоский массив идентификаторов.

Самого вызывающего и автора сообщения в списке не будет никогда — считаются только остальные участники. Для сообщения в треде это участники треда, а не родительского чата.

Имён метод не отдаёт. За ними ходят методом [Информация о сотруднике](GET /users/{id}) по каждому идентификатору.
""")
  @extension("x-paginated", true)
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
    @doc("Курсор для пагинации (из `meta.paginate.next_page` или `meta.paginate.prev_page`)")
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
  } | {
    @statusCode _: 402;
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

Ставит эмодзи-реакцию на сообщение от имени владельца токена.

В поле `code` передаётся сам символ эмодзи: текстовые записи вроде `+1` или `:+1:` метод не принимает. Если пользователь уже ставил реакцию, повторно она установлена не будет. Для удаления реакции надо воспользоваться методом [Удаление реакции](DELETE /messages/{id}/reactions).

Если под сообщением есть тред, реагирующий заодно подписывается на него и начинает получать новые сообщения треда.

**Лимиты реакций:**

- Каждый пользователь может установить на сообщение не более **20 уникальных** реакций
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

Снимает с сообщения свою реакцию.

Чужая реакция и реакция, которой нет, отвечают `404`. Подписку на тред, если она появилась вместе с реакцией, снятие реакции не отменяет.
""")
  @delete

  removeReaction(
    @doc("Идентификатор сообщения")
    @extension("example", 7231942)
    @path id: int32,

    @doc("Emoji символ реакции. Именно символ: текстовые записи вроде `+1` или `:+1:` отклоняются как неизвестный эмодзи.")
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

Все реакции на сообщении и кто их поставил: в каждой записи приходит `user_id` и сам символ.

У удалённого сообщения список пуст — реакции пропадают вместе с текстом и файлами.
""")
  @extension("x-paginated", true)
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
    @doc("Курсор для пагинации (из `meta.paginate.next_page` или `meta.paginate.prev_page`)")
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

@tag("Messages")
interface LinkPreviewOperations {
  @extension("x-requirements", #{
    scope: "link_previews:write",
  })
  @doc("""
Unfurl (разворачивание ссылок)

Подставляет в сообщение предпросмотр ссылки, собранный самим ботом: заголовок, описание и картинку. Так внутренние адреса компании, которые Пачка сама открыть не может, показываются в переписке карточкой.

Метод доступен только боту, у которого исходящий вебхук настроен на разворачивание ссылок. Такой бот получает событие `message_link_shared` и отвечает на него этим методом, причём состоять в чате с сообщением ему не нужно — достаточно, чтобы чат был в его пространстве.

Домен ссылки должен быть в списке разрешённых у бота, а сама ссылка — присутствовать в тексте сообщения, иначе метод ответит ошибкой. Ответ приходит пустым даже тогда, когда ни одно превью не применилось: результат проверяют повторным чтением сообщения.
""")
  @route("/messages/{id}/link_previews")
  @post
  unfurl(
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

Ищет сотрудников по имени и фамилии, нику, должности и отделу. Опечатки прощаются только в имени и фамилии, остальным полям нужно точное слово.

По почте метод ищет лишь тем, кому в пространстве видны персональные данные. По телефону он не ищет вовсе — для этого есть [Список сотрудников](GET /users) с параметром `query`.

Удалённые сотрудники не находятся никогда, приостановленные — только когда задан текстовый запрос, и стоят в выдаче ниже остальных. Из ботов находятся лишь публичные.
""")
  @extension("x-paginated", true)
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
    @doc("Курсор для пагинации (из `meta.paginate.next_page`)")
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

Ищет беседы и каналы по названию, прощая опечатки. Находит и открытые чаты пространства, куда вызывающий не вступал, а закрытые — только те, где он состоит.

Личные переписки по умолчанию не ищутся. Передайте `personal=true`, и поиск пойдёт по имени собеседника, а не по названию чата.

Метод ищет по названиям, а не по содержанию. Если нужно найти, где что-то обсуждали или о чём договорились, это [Поиск сообщений](GET /search/messages).
""")
  @extension("x-paginated", true)
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
    @doc("Курсор для пагинации (из `meta.paginate.next_page`)")
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

Ищет по тексту сообщений и по именам вложенных файлов, но только в чатах, где владелец токена состоит. Открытый канал, в который он не вступал, в поиск не попадает, хотя ленту его читать можно. Сообщения тредов в выдачу входят.

Слова запроса ищутся по словоформам и по части слова, опечатки при этом не исправляются. Запрос в кавычках ищется строгой фразой, поиск по части слова в нём не работает.

По умолчанию сообщения приходят от новых к старым. `sort=relevance` переключает выдачу на соответствие запросу, где свежие сообщения всё равно ценятся выше.
""")
  @extension("x-paginated", true)
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
    @doc("Курсор для пагинации (из `meta.paginate.next_page`)")
    @extension("example", "eyJpZCI6MTAsImRpciI6ImFzYyJ9")
    @query cursor?: string,
    @doc("Направление сортировки")
    @extension("example", "desc")
    @query order?: SortOrder,
    @doc("Сортировка результатов")
    @extension("example", "created_at")
    @query sort?: MessageSearchSort = MessageSearchSort.created_at,
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

Создаёт напоминание и назначает на него ответственных.

При создании напоминания обязательно указать его тип: звонок, встреча, простое напоминание, событие или письмо. Описание при этом не требуется — напоминание создастся с текстом по типу. Если описание передано, именно оно и станет текстом напоминания.

У напоминания должны быть ответственные. Если их не указать, ответственным становится владелец токена.

Ответственным для напоминания без привязки к каким-либо сущностям может стать любой сотрудник компании. Актуальный состав сотрудников компании вы можете получить в методе [Список сотрудников](GET /users). Ответственные, которых вызывающий не видит, молча отбрасываются: ответ приходит успешным, а в `performer_ids` их нет, поэтому сверяйте состав в ответе.

Напоминание можно привязать к беседе полем `chat_id` — тогда кроме автора и ответственных его видят участники этой беседы. Привязывающий должен сам в ней состоять. В канале, в треде и в архивном чате напоминания не создаются.

Передать напоминание другому сотруднику — значит сменить ответственного методом [Редактирование напоминания](PUT /tasks/{id}).

Если к пространству или к профилю подключён календарь, напоминание заодно появляется в нём событием.
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
  } | {
    @statusCode _: 402;
    @body body: ApiError;
  };

  @extension("x-requirements", #{
    scope: "tasks:read",
  })
  @doc("""
Список напоминаний

Напоминания, доступные владельцу токена.

Без параметра `chat_ids` возвращаются только ваши напоминания: из бесед и каналов, где вы состоите участником, а также созданные вами или назначенные вам напоминания без привязки к чату. Параметр `chat_ids` меняет выборку — возвращаются все напоминания указанных чатов, включая чужие.
""")
  @extension("x-paginated", true)
  @get
  listTasks(
    @doc("Фильтр по состоянию. Если параметр не указан, возвращаются напоминания в любом состоянии.")
    @extension("example", "undone")
    @query status?: TaskStatus,
    @doc("Фильтр по чатам, к которым привязаны напоминания. Доступными считаются чаты, где вы состоите участником, открытые беседы и каналы пространства, а также треды, доступные вам по родительскому чату. Остальные переданные идентификаторы игнорируются без ошибки. Не более 100 идентификаторов.")
    @extension("example", #[198, 334])
    @maxItems(100)
    @query chat_ids?: int32[],
    @doc("Фильтр по ответственным за напоминание. Не более 100 идентификаторов.")
    @extension("example", #[12, 185])
    @maxItems(100)
    @query performer_ids?: int32[],
    @doc("Фильтр по автору напоминания")
    @extension("example", 12)
    @query author_id?: int32,
    @doc("Количество возвращаемых сущностей за один запрос")
    @query
    @extension("example", 1)
    @minValue(1)
    @maxValue(50)
    limit?: int32 = 50,
    @doc("Курсор для пагинации (из `meta.paginate.next_page` или `meta.paginate.prev_page`)")
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
  } | {
    @statusCode _: 402;
    @body body: ApiError;
  };

  @extension("x-requirements", #{
    scope: "tasks:read",
  })
  @doc("""
Информация о напоминании

Напоминание вместе с его автором, ответственными и чатом, к которому оно привязано.

Напоминание видят его автор, ответственные и участники чата, к которому оно привязано. Участия в чате хватает, чтобы прочитать, но не чтобы изменить: править и удалять напоминание могут только автор и ответственные.
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
  } | {
    @statusCode _: 402;
    @body body: ApiError;
  };

  @extension("x-requirements", #{
    scope: "tasks:update",
  })
  @doc("""
Редактирование напоминания

Меняет напоминание: перезаписываются только переданные поля.

Передать напоминание другому сотруднику — это тоже правка: добавьте его в `performer_ids` вместо прежнего.

Выполненное напоминание закрывают этим же методом: `status: "done"` ставит галочку и оставляет напоминание в списке, `status: "undone"` возвращает его в работу.

Доступно автору и ответственным. Участник чата, где висит напоминание, его видит, но менять не может. Привязку к чату изменить нельзя: чтобы перевесить напоминание в другой чат, удалите его и создайте заново с нужным `chat_id`.
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
  } | {
    @statusCode _: 402;
    @body body: ApiError;
  };

  @extension("x-requirements", #{
    scope: "tasks:delete",
  })
  @doc("""
Удаление напоминания

Убирает напоминание насовсем: восстановить его нельзя, и у ответственных оно тоже пропадает. Если напоминание уехало в подключённый календарь, событие удаляется и там.

Доступно автору и ответственным. Повторный вызов отвечает `404`.

Закрыть выполненное напоминание, сохранив его в списке, можно методом [Редактирование напоминания](PUT /tasks/{id}) со `status: "done"`.
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
  } | {
    @statusCode _: 402;
    @body body: ApiError;
  };
}

// ============================================================================
// Draft Operations
// ============================================================================

@route("/drafts")
@tag("Drafts")
interface DraftOperations {
  @extension("x-requirements", #{
    scope: "drafts:write",
  })
  @doc("""
Новый черновик

Кладёт черновик в беседу, тред или личную переписку. В интерфейсе Пачки он появляется в поле ввода этого чата, где сотрудник его допишет и отправит. Этим же методом создаётся отложенное сообщение: с полем `schedule` черновик уходит сам в назначенное время, без него просто лежит. Сам метод ничего не отправляет, для отправки есть [Новое сообщение](POST /messages).

Черновик виден только своему автору — его не видит ни собеседник, ни администратор пространства. Обычный черновик в чате может быть только один. Повторный вызов отвечает `409` с кодом `already_exists` и номером существующего в `payload.draft_id`. Дописывают его методом [Редактирование черновика](PUT /drafts/{id}). Отложенных сообщений на один чат — не больше 50.

Для треда в `entity_id` передают идентификатор самого треда, а не сообщения, под которым он висит. Личной переписки с сотрудником может ещё не быть — тогда она заводится сама, как при обычной отправке сообщения.

Пустой черновик создать нельзя: нужен либо текст, либо вложения.

Токенам ботов метод недоступен.
""")
  @post
  createDraft(@body request: DraftCreateRequest): {
    @statusCode _: 201;
    @body body: DataResponse<Draft>;
  } | {
    @statusCode _: 401;
    @body body: OAuthError;
  } | {
    @statusCode _: 403;
    @body body: ApiError | OAuthError;
  } | {
    @statusCode _: 404;
    @body body: ApiError;
  } | {
    @statusCode _: 400;
    @body body: ApiError;
  } | {
    @statusCode _: 409;
    @body body: ApiError;
  } | {
    @statusCode _: 422;
    @body body: ApiError;
  } | {
    @statusCode _: 402;
    @body body: ApiError;
  };

  @extension("x-requirements", #{
    scope: "drafts:read",
  })
  @doc("""
Список черновиков

Свои черновики, от новых к старым.

По умолчанию возвращаются только обычные черновики: отложенные нужно запросить параметром `type`. Отличить их в ответе можно по полю `schedule`.

Пара `entity_type` и `entity_id` сужает выдачу до одного чата, треда или личной переписки. Если такого чата нет или он недоступен, метод отвечает пустым списком, а не ошибкой.
""")
  @extension("x-paginated", true)
  @get
  listDrafts(
    @doc("Что возвращать: `regular` — обычные черновики, `scheduled` — отложенные сообщения, `all` — и те и другие")
    @extension("example", "all")
    @query type?: DraftType = DraftType.regular,
    @doc("Тип чата для фильтра по одному чату. Указывается вместе с `entity_id`: если прислать только один из двух, ответ будет `422`.")
    @extension("example", "discussion")
    @query entity_type?: MessageEntityType,
    @doc("Идентификатор того, что названо в `entity_type`. Указывается вместе с ним.")
    @extension("example", 334)
    @query entity_id?: int32,
    @doc("Количество возвращаемых сущностей за один запрос")
    @query
    @extension("example", 25)
    @minValue(1)
    @maxValue(50)
    limit?: int32 = 50,
    @doc("Курсор для пагинации (из `meta.paginate.next_page` или `meta.paginate.prev_page`)")
    @extension("example", "eyJpZCI6MTAsImRpciI6ImFzYyJ9")
    @query cursor?: string
  ): {
    @statusCode _: 200;
    @body body: PaginatedDataResponse<Draft[]>;
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
  } | {
    @statusCode _: 402;
    @body body: ApiError;
  };

  @extension("x-requirements", #{
    scope: "drafts:read",
  })
  @doc("""
Информация о черновике

Черновик. У отложенного сообщения сюда же приходит его расписание.
""")
  @route("/{id}")
  @get
  getDraft(
    @doc("Идентификатор черновика")
    @extension("example", 4821)
    @path id: int32
  ): {
    @statusCode _: 200;
    @body body: DataResponse<Draft>;
  } | {
    @statusCode _: 401;
    @body body: OAuthError;
  } | {
    @statusCode _: 403;
    @body body: ApiError | OAuthError;
  } | {
    @statusCode _: 404;
    @body body: ApiError;
  } | {
    @statusCode _: 402;
    @body body: ApiError;
  };

  @extension("x-requirements", #{
    scope: "drafts:write",
  })
  @doc("""
Редактирование черновика

Меняет свой черновик: текст, вложения, расписание и сообщение, ответом на которое он уйдёт (`parent_message_id`). Перезаписываются только переданные поля, поэтому дописать текст, не трогая вложения, можно одним `content`.

Обычный черновик превращается в отложенное сообщение, если передать `schedule`. Обратный переход запрещён: `schedule: null` у отложенного отвечает `422` с кодом `draft_type_change_forbidden`. Чтобы отменить отправку, черновик убирают методом [Удаление черновика](DELETE /drafts/{id}).

Править можно, только пока в чат разрешено писать. Если доступ к чату потерян, редактирование ответит `403`, а удаление всё равно сработает.

Чат черновика этим методом не меняется, `entity_type` и `entity_id` он не принимает. Чтобы перенести черновик в другой чат, создайте новый и удалите прежний.
""")
  @route("/{id}")
  @put
  updateDraft(
    @doc("Идентификатор черновика")
    @extension("example", 4821)
    @path id: int32,
    @body request: DraftUpdateRequest
  ): {
    @statusCode _: 200;
    @body body: DataResponse<Draft>;
  } | {
    @statusCode _: 401;
    @body body: OAuthError;
  } | {
    @statusCode _: 403;
    @body body: ApiError | OAuthError;
  } | {
    @statusCode _: 404;
    @body body: ApiError;
  } | {
    @statusCode _: 400;
    @body body: ApiError;
  } | {
    @statusCode _: 422;
    @body body: ApiError;
  } | {
    @statusCode _: 402;
    @body body: ApiError;
  };

  @extension("x-requirements", #{
    scope: "drafts:write",
  })
  @doc("""
Удаление черновика

Убирает свой черновик насовсем: восстановить его нельзя, вложения удаляются вместе с ним. У отложенного сообщения удаление и есть отмена отправки.

Работает, даже если в чат уже нельзя писать. Повторный вызов отвечает `404`.
""")
  @route("/{id}")
  @delete
  deleteDraft(
    @doc("Идентификатор черновика")
    @extension("example", 4821)
    @path id: int32
  ): {
    @statusCode _: 204;

  } | {
    @statusCode _: 401;
    @body body: OAuthError;
  } | {
    @statusCode _: 403;
    @body body: ApiError | OAuthError;
  } | {
    @statusCode _: 404;
    @body body: ApiError;
  } | {
    @statusCode _: 402;
    @body body: ApiError;
  };
}

@doc("Ответ бота на отправку формы")
model SubmitViewResponseRequest {
  @doc("Идентификатор отправки формы из вебхука `view_submit`")
  @example("791a056b-006c-49dd-834b-c633fde52fe8")
  submit_id: string;

  @doc("Ошибки заполнения полей. Ключ — `name` блока, значение — текст ошибки под полем. Без этого поля представление закрывается как успешно отправленное.")
  @example(#{ date_end: "Дата окончания отпуска не может быть меньше даты начала" })
  errors?: Record<string>;
}

@doc("Результат ответа на отправку формы")
model SubmitViewResponseResult {
  @doc("Признак успешной обработки")
  @example(true)
  success: boolean;
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

Показывает пользователю модальное окно с формой в ответ на его действие. Метод вызывают токеном бота: события о нажатии кнопок приходят только ботам, от имени бота окно и открывается.

Открыть окно можно единственным способом — по `trigger_id` из события о нажатии кнопки. Один `trigger_id` открывает одно окно и живёт 3 секунды: у бота с вебхуком — с момента, когда Пачка передала нажатие, у бота с [Журналом событий](GET /webhooks/events) — с момента записи нажатия в журнал. Поэтому окно открывают первым делом, а всё остальное по событию делают уже после.

Заполненная форма приходит обратно событием `view_submit`: на исходящий вебхук, а если адрес не задан — в журнал. На вебхук отвечают прямо в ответе на него, и Пачка ждёт его 3 секунды. Событие из журнала закрывают методом [Ответ на отправку формы](POST /views/{view_id}/submit_response), на это есть 5 секунд. Не успели — пользователь увидит ошибку отправки.
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
  } | {
    @statusCode _: 402;
    @body body: ApiError;
  };

  @extension("x-requirements", #{
    scope: "views:write",
  })
  @doc("""
Ответ на отправку формы

Закрывает форму сотруднику или показывает ему ошибки под полями. Метод нужен боту, у которого не задан адрес исходящего вебхука: отвечать на вебхук такому боту некуда, и событие `view_submit` он получает из метода [История событий](GET /webhooks/events). Если адрес вебхука задан, отвечайте прямо на вебхук — это проще и не требует опроса журнала.

Идентификаторы `view_id` и `submit_id` приходят в теле события. Ответить нужно в течение 5 секунд с момента отправки формы, иначе сотрудник увидит ошибку отправки, а значения полей сохранятся для повторной попытки.

Тело без поля `errors` закрывает форму как успешно отправленную, с полем `errors` — показывает текст ошибки под каждым названным полем.

Ответ принимается один раз. Повторный вызов с той же парой `view_id` и `submit_id`, как и опоздавший, получает `410` с кодом `submit_expired`.
""")
  @route("/{view_id}/submit_response")
  @post
  submitViewResponse(
    @doc("Идентификатор представления")
    @extension("example", "01KAJZ2XDSS2S3DSW9EXJZ0TBV")
    @path
    view_id: string,

    @body request: SubmitViewResponseRequest,
  ): {
    @statusCode _: 200;
    @body body: SubmitViewResponseResult;
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
    @statusCode _: 410;
    @body body: ApiError;
  } | {
    @statusCode _: 422;
    @body body: ApiError;
  } | {
    @statusCode _: 402;
    @body body: ApiError;
  } | {
    @statusCode _: 503;
    @body body: ApiError;
  };
}

// ============================================================================
// Bot Operations
// ============================================================================

@tag("Bots")
interface BotOperations {
  @extension("x-requirements", #{
    scope: "bots:read",
  })
  @doc("""
Список ботов

Боты, которых вызывающий вправе настраивать: созданные им самим и те, чьи настройки открывают ему доступ к редактированию.

Параметр `query` отбирает ботов по части имени, без опечаток. Токены ботов в списке не приходят — их показывают один раз при создании и при ротации.

Перечень всех ботов пространства, включая чужих, доступен владельцу на тарифе «Корпорация» — [Список ботов пространства](GET /company/bots). Там чужие боты приходят с одними лишь именем и ником, остальные настройки скрыты.
""")
  @extension("x-paginated", true)
  @route("/bots")
  @get
  @opExample(#{
    returnType: #{
      _: 200,
      body: #{
        data: #[
          #{
            id: 1738816,
            webhook: #{
              name: "Бот задач",
              nickname: "tasks_bot",
              outgoing_url: "https://www.website.com/tasks/new",
              events: #[BotEventName.message_new],
              trigger_on: BotTriggerOn.commands,
              commands: #["/task"],
              scopes: #["messages:create"],
              template: "Заказ от {{ client }} на сумму {{ amount }} ₽",
              template_engine: BotTemplateEngine.liquid,
              challenge_key: "challenge",
              link_preview_enabled: true,
              ignore_self_messages: false,
              events_history_enabled: false,
              single_chat: false,
              can_edit: #[BotCanEdit.admin],
              who_can_add: BotWhoCanAdd.creator,
            },
          }
        ],
        meta: #{
          paginate: #{
            next_page: "eyJpZCI6MTczODgxNn0",
          },
        },
      },
    },
  })
  listBots(
    @doc("Поисковая фраза для фильтрации ботов по имени")
    @extension("example", "задач")
    @query query?: string,
    @doc("Количество возвращаемых сущностей за один запрос")
    @query
    @extension("example", 1)
    @minValue(1)
    @maxValue(50)
    limit?: int32 = 50,
    @doc("Курсор для пагинации (из `meta.paginate.next_page`)")
    @extension("example", "eyJpZCI6MTczODgxNn0")
    @query cursor?: string
  ): {
    @statusCode _: 200;
    @body body: PaginatedDataResponse<BotResponse[]>;
  } | {
    @statusCode _: 401;
    @body body: OAuthError;
  } | {
    @statusCode _: 403;
    @body body: OAuthError;
  } | {
    @statusCode _: 402;
    @body body: ApiError;
  };

  @extension("x-requirements", #{
    scope: "bots:write",
  })
  @doc("""
Новый бот

Создаёт бота в пространстве и сразу отдаёт его `access_token`. Сохраните токен при создании: тот же самый повторно не показывают, останется перевыпустить его методом [Ротация токена бота](POST /bots/{id}/recreate_token).

Созданный бот ещё никуда не пишет. В беседу и канал он пишет только как участник, а добавляют его как сотрудника — методом [Добавление пользователей](POST /chats/{id}/members), передав `id` бота. В канале бот получает роль редактора. Личные сообщения и треды в открытых чатах членства не требуют.

Входящий вебхук бота отправляет сообщение сразу во все беседы и каналы, где бот состоит, поэтому набор его чатов и решает, куда оно попадёт. Токен для этого не нужен, достаточно адреса вебхука. Чтобы написать в один конкретный чат, берите метод [Новое сообщение](POST /messages) — вот там токен уже нужен.

Ник обязан заканчиваться на `_bot` и быть свободным в пространстве. Ограничение `single_chat` задаётся только здесь: при редактировании бота оно уже не меняется.
""")
  @route("/bots")
  @post
  @opExample(#{
    parameters: #{
      request: #{
        webhook: #{
          name: "Бот задач",
          nickname: "tasks_bot",
          outgoing_url: "https://www.website.com/tasks/new",
          events: #[BotEventName.message_new],
          trigger_on: BotTriggerOn.commands,
          commands: #["/task"],
          scopes: #["messages:create"],
        },
      },
    },
    returnType: #{
      _: 201,
      body: #{
        data: #{
          id: 1738816,
          webhook: #{
            name: "Бот задач",
            nickname: "tasks_bot",
            outgoing_url: "https://www.website.com/tasks/new",
            events: #[BotEventName.message_new],
            trigger_on: BotTriggerOn.commands,
            commands: #["/task"],
            scopes: #["messages:create"],
            template: "Заказ от {{ client }} на сумму {{ amount }} ₽",
            template_engine: BotTemplateEngine.liquid,
            challenge_key: "challenge",
            link_preview_enabled: true,
            ignore_self_messages: false,
            events_history_enabled: false,
            single_chat: false,
            can_edit: #[BotCanEdit.admin],
            who_can_add: BotWhoCanAdd.creator,
          },
          access_token: "bm90X2FfcmVhbF90b2tlbg",
        },
      },
    },
  })
  createBot(@body request: BotCreateRequest): {
    @statusCode _: 201;
    @body body: DataResponse<BotCreateResponse>;
  } | {
    @statusCode _: 400;
    @body body: ApiError;
  } | {
    @statusCode _: 401;
    @body body: OAuthError;
  } | {
    @statusCode _: 403;
    @body body: OAuthError;
  } | {
    @statusCode _: 402;
    @body body: ApiError;
  };

  @extension("x-requirements", #{
    scope: "bots:read",
  })
  @doc("""
Информация о боте

Настройки бота. Токен в ответе не приходит — его показывают один раз при создании бота и при вызове метода [Ротация токена бота](POST /bots/{id}/recreate_token).

Метод отдаёт только тех ботов, которых вызывающий вправе настраивать: своих, а также чужих, если настройки бота открывают доступ администратору пространства или владельцу чата, где бот состоит. На остальных метод ответит `403`.

Перечень всех ботов пространства, включая чужих, доступен владельцу на тарифе «Корпорация» — [Список ботов пространства](GET /company/bots).
""")
  @route("/bots/{id}")
  @get
  @opExample(#{
    parameters: #{
      id: 1738816,
    },
    returnType: #{
      _: 200,
      body: #{
        data: #{
          id: 1738816,
          webhook: #{
            name: "Бот задач",
            nickname: "tasks_bot",
            outgoing_url: "https://www.website.com/tasks/new",
            events: #[BotEventName.message_new],
            trigger_on: BotTriggerOn.commands,
            commands: #["/task"],
            scopes: #["messages:create"],
            template: "Заказ от {{ client }} на сумму {{ amount }} ₽",
            template_engine: BotTemplateEngine.liquid,
            challenge_key: "challenge",
            link_preview_enabled: true,
            ignore_self_messages: false,
            events_history_enabled: false,
            single_chat: false,
            can_edit: #[BotCanEdit.admin],
            who_can_add: BotWhoCanAdd.creator,
          },
        },
      },
    },
  })
  getBot(
    @doc("Идентификатор бота")
    @extension("example", 1738816)
    @path id: int32
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
    @statusCode _: 402;
    @body body: ApiError;
  };

  @extension("x-requirements", #{
    scope: "bots:write",
  })
  @doc("""
Редактирование бота

Меняет настройки бота: перезаписываются только переданные поля.

Поле `single_chat` принимается только при создании бота. В этом методе оно молча игнорируется: ответ приходит успешный, а режим бота не меняется.

Ник обязан заканчиваться на `_bot` и быть свободным в пространстве, иначе метод отвечает ошибкой валидации. Команды и скоупы заменяются переданным списком целиком, а новый набор скоупов сразу применяется к действующему токену бота — перевыпускать его не нужно.

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
  } | {
    @statusCode _: 402;
    @body body: ApiError;
  };

  @extension("x-requirements", #{
    scope: "bots:write",
  })
  @doc("""
Удаление бота

Убирает бота из пространства насовсем. Прежний `access_token` бота сразу инвалидируется, бот исключается из всех чатов, его исходящий вебхук удаляется.

Удаление доступно создателю бота, а также администратору пространства, если настройки бота открывают администраторам доступ к редактированию. Владельцы и администраторы чатов удалять бота не могут, даже если им разрешено его редактировать.
""")
  @route("/bots/{id}")
  @delete
  deleteBot(
    @doc("Идентификатор бота")
    @extension("example", 1738816)
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
    @statusCode _: 402;
    @body body: ApiError;
  };

  @extension("x-requirements", #{
    scope: "bot_self:webhook:write",
  })
  @doc("""
Саморегистрация вебхука бота

Метод позволяет боту самостоятельно изменить `URL` своего исходящего вебхука своим же токеном — без участия администратора и без знания собственного `id`. Меняется вебхук того бота, которому принадлежит токен. Чтобы отключить вебхук, передайте пустую строку в `outgoing_url`.
""")
  @route("/bot/webhook")
  @put
  @opExample(#{
    parameters: #{
      request: #{
        webhook: #{
          outgoing_url: "https://www.website.com/tasks/new",
        },
      },
    },
    returnType: #{
      _: 200,
      body: #{
        data: #{
          id: 1738816,
          webhook: #{
            name: "Бот задач",
            nickname: "tasks_bot",
            outgoing_url: "https://www.website.com/tasks/new",
            events: #[BotEventName.message_new],
            trigger_on: BotTriggerOn.commands,
            commands: #["/task"],
            scopes: #["messages:create"],
            template: "Заказ от {{ client }} на сумму {{ amount }} ₽",
            template_engine: BotTemplateEngine.liquid,
            challenge_key: "challenge",
            link_preview_enabled: true,
            ignore_self_messages: false,
            events_history_enabled: false,
            single_chat: false,
            can_edit: #[BotCanEdit.admin],
            who_can_add: BotWhoCanAdd.creator,
          },
        },
      },
    },
  })
  selfUpdateBotWebhook(@body request: BotWebhookSelfUpdateRequest): {
    @statusCode _: 200;
    @body body: DataResponse<BotResponse>;
  } | {
    @statusCode _: 400;
    @body body: ApiError;
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
    @statusCode _: 402;
    @body body: ApiError;
  };

  @extension("x-requirements", #{
    scope: "bots:write",
  })
  @doc("""
Ротация токена бота

Метод генерирует боту новый `access_token` и сразу инвалидирует прежний. Используйте его при компрометации токена или плановой ротации секрета в `CI`.

Новый токен возвращается в ответе только один раз — сохраните его сразу. Права у него те же: скоупы переносятся с прежнего токена.


Ротация доступна создателю бота, а также администратору пространства, если настройки бота открывают администраторам доступ к редактированию. Владелец чата, где состоит бот, ротировать токен не может, даже когда остальные настройки бота ему открыты.
""")
  @route("/bots/{id}/recreate_token")
  @post
  @opExample(#{
    parameters: #{
      id: 1738816,
    },
    returnType: #{
      _: 200,
      body: #{
        data: #{
          id: 1738816,
          webhook: #{
            name: "Бот задач",
            nickname: "tasks_bot",
            outgoing_url: "https://www.website.com/tasks/new",
            events: #[BotEventName.message_new],
            trigger_on: BotTriggerOn.commands,
            commands: #["/task"],
            scopes: #["messages:create"],
            template: "Заказ от {{ client }} на сумму {{ amount }} ₽",
            template_engine: BotTemplateEngine.liquid,
            challenge_key: "challenge",
            link_preview_enabled: true,
            ignore_self_messages: false,
            events_history_enabled: false,
            single_chat: false,
            can_edit: #[BotCanEdit.admin],
            who_can_add: BotWhoCanAdd.creator,
          },
          access_token: "bm90X2FfcmVhbF90b2tlbg",
        },
      },
    },
  })
  recreateBotToken(
    @doc("Идентификатор бота")
    @extension("example", 1738816)
    @path id: int32
  ): {
    @statusCode _: 200;
    @body body: DataResponse<BotCreateResponse>;
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
    @statusCode _: 402;
    @body body: ApiError;
  };

  @extension("x-requirements", #{
    scope: "bot_self:write",
  })
  @doc("""
Ротация собственного токена бота

Метод позволяет боту сгенерировать себе новый `access_token` своим же токеном — без участия администратора и без знания собственного `id`.

Ротируется тот самый токен, которым сделан запрос, и он инвалидируется сразу.

Новый токен возвращается в ответе один раз — обязательно сохраните его, иначе бот потеряет доступ к API. Скоупы переносятся с прежнего токена.
""")
  @route("/bot/recreate_token")
  @post
  @opExample(#{
    returnType: #{
      _: 200,
      body: #{
        data: #{
          id: 1738816,
          webhook: #{
            name: "Бот задач",
            nickname: "tasks_bot",
            outgoing_url: "https://www.website.com/tasks/new",
            events: #[BotEventName.message_new],
            trigger_on: BotTriggerOn.commands,
            commands: #["/task"],
            scopes: #["messages:create"],
            template: "Заказ от {{ client }} на сумму {{ amount }} ₽",
            template_engine: BotTemplateEngine.liquid,
            challenge_key: "challenge",
            link_preview_enabled: true,
            ignore_self_messages: false,
            events_history_enabled: false,
            single_chat: false,
            can_edit: #[BotCanEdit.admin],
            who_can_add: BotWhoCanAdd.creator,
          },
          access_token: "bm90X2FfcmVhbF90b2tlbg",
        },
      },
    },
  })
  selfRecreateBotToken(): {
    @statusCode _: 200;
    @body body: DataResponse<BotCreateResponse>;
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
    @statusCode _: 402;
    @body body: ApiError;
  };

  @extension("x-requirements", #{
    scope: "webhooks:events:read",
  })
  @doc("""
История событий

Журнал событий бота: то же самое, что уходит в исходящий вебхук, но забирается запросом. Метод нужен, когда принимать вебхуки на свой адрес нельзя — обработчик недоступен из интернета, поднимается не всегда или пишется прямо сейчас.

Журнал ведётся, только когда в настройках бота включён пункт «Сохранять историю событий» во вкладке «Исходящий webhook». Адрес вебхука при этом можно не указывать вовсе, а если он указан, событие и уедет на него, и ляжет в журнал.

Метод работает только с токеном бота: у личного токена своего журнала нет. События отдаются от новых к старым, идентификатор события — строка, а не число.

Сам журнал не очищается: прочитанные события удаляйте методом [Удаление события](DELETE /webhooks/events/{id}), иначе они придут снова при повторном запросе.
""")
  @extension("x-paginated", true)
  @route("/webhooks/events")
  @get
  getWebhookEvents(
    @doc("Количество возвращаемых сущностей за один запрос")
    @query
    @extension("example", 1)
    @minValue(1)
    @maxValue(50)
    limit?: int32 = 50,
    
    @doc("Курсор для пагинации (из `meta.paginate.next_page` или `meta.paginate.prev_page`)")
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
  } | {
    @statusCode _: 402;
    @body body: ApiError;
  };

  @extension("x-requirements", #{
    scope: "webhooks:events:delete",
  })
  @doc("""
Удаление события

Убирает событие из журнала бота. Разбирая журнал, удаляйте событие сразу после обработки: журнал не очищается сам, и всё, что осталось, придёт снова при повторном запросе.

Метод работает только с токеном того бота, которому принадлежит событие.
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
  } | {
    @statusCode _: 402;
    @body body: ApiError;
  };
}

@route("/company/bots")
@tag("Bots")
interface CompanyBotOperations {
  @extension("x-requirements", #{
    scope: "company_bots:read",
    plan: "corporation",
  })
  @doc("""
Список ботов пространства

Все боты пространства, включая тех, кто недоступен вам для редактирования. У таких ботов приходят только имя и ник, остальные настройки — `null`.

Метод доступен владельцу пространства. Каждый запрос записывается в [журнал аудита событий](/guides/audit-events) с типом `company_bots_accessed`.
""")
  @extension("x-paginated", true)
  @get
  @opExample(#{
    returnType: #{
      _: 200,
      body: #{
        data: #[
          #{
            id: 1738816,
            webhook: #{
              name: "Бот задач",
              nickname: "tasks_bot",
              outgoing_url: "https://www.website.com/tasks/new",
              events: #[BotEventName.message_new],
              trigger_on: BotTriggerOn.commands,
              commands: #["/task"],
              scopes: #["messages:create"],
              template: "Заказ от {{ client }} на сумму {{ amount }} ₽",
              template_engine: BotTemplateEngine.liquid,
              challenge_key: "challenge",
              link_preview_enabled: true,
              ignore_self_messages: false,
              events_history_enabled: false,
              single_chat: false,
              can_edit: #[BotCanEdit.admin],
              who_can_add: BotWhoCanAdd.creator,
            },
          },
          #{
            id: 1738817,
            webhook: #{
              name: "Бот релизов",
              nickname: "release_bot",
              outgoing_url: null,
              events: null,
              trigger_on: null,
              commands: null,
              scopes: null,
              template: null,
              template_engine: null,
              challenge_key: null,
              link_preview_enabled: null,
              ignore_self_messages: null,
              events_history_enabled: null,
              single_chat: null,
              can_edit: null,
              who_can_add: null,
            },
          }
        ],
        meta: #{
          paginate: #{
            next_page: "eyJpZCI6MTczODgxN30",
          },
        },
      },
    },
  })
  listCompanyBots(
    @doc("Поисковая фраза для фильтрации ботов по имени")
    @extension("example", "задач")
    @query query?: string,
    @doc("Количество возвращаемых сущностей за один запрос")
    @query
    @extension("example", 1)
    @minValue(1)
    @maxValue(50)
    limit?: int32 = 50,
    @doc("Курсор для пагинации (из `meta.paginate.next_page`)")
    @extension("example", "eyJpZCI6MTczODgxNn0")
    @query cursor?: string
  ): {
    @statusCode _: 200;
    @body body: PaginatedDataResponse<CompanyBotResponse[]>;
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
    @statusCode _: 402;
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

Что происходило в пространстве: входы и выходы, изменения ролей и настроек, действия с чатами, сотрудниками и ботами. Записи только читаются — изменить или удалить их нельзя ни через API, ни из интерфейса.

Метод доступен владельцу пространства на тарифе «Корпорация», остальным сотрудникам он отвечает `403`. Само обращение к журналу тоже записывается в журнал — событием `audit_events_accessed`.

События приходят от новых к старым и отбираются фильтрами: период по `start_time` и `end_time`, вид события по `event_key`, инициатор по `actor_id` и `actor_type`. Без фильтров метод отдаёт все события пространства постранично.
""")
  @extension("x-paginated", true)
  @get
  getAuditEvents(
    @doc("Начальная метка времени, включительно (ISO-8601). Смещение вида `+03:00` учитывается, время без смещения считается UTC. Значение, которое не удалось разобрать, фильтр снимает — ответ придёт полным, без ошибки.")
    @extension("example", "2025-05-01T09:11:00.000Z")
    @query start_time?: utcDateTime,

    @doc("Конечная метка времени, включительно (ISO-8601). Смещение вида `+03:00` учитывается, время без смещения считается UTC. Значение, которое не удалось разобрать, фильтр снимает — ответ придёт полным, без ошибки.")
    @extension("example", "2025-05-02T09:11:00.000Z")
    @query end_time?: utcDateTime,
    
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
    
    @doc("Курсор для пагинации (из `meta.paginate.next_page` или `meta.paginate.prev_page`)")
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
  } | {
    @statusCode _: 402;
    @body body: ApiError;
  };
}



// ============================================================================
// File & Custom Property Operations (utility, listed last in sidebar)
// ============================================================================

@route("/custom_properties")
@tag("Custom Properties")
interface CommonOperations {
  @extension("x-requirements", #{
    scope: "custom_properties:read",
  })
  @doc("""
Список дополнительных полей

Схема дополнительных полей пространства: идентификатор, название и тип каждого. Такие поля доступны только для сотрудников и напоминаний, наборы у них независимые, а нужный выбирает параметр `entity_type`. Значения приходят в самой сущности — в карточке сотрудника или в напоминании. Идентификаторы отсюда нужны, чтобы эти значения задавать.

Поля типов «Файл» и «Множественный выбор» через API недоступны и в выдачу не попадают. Базовые поля карточки — имя, телефон, почта, отдел, теги — тоже: это не дополнительные поля.

Набор полей задаёт администратор пространства, он же их переименовывает и удаляет. Поэтому список стоит перечитывать перед работой: обращение к полю, которого уже нет, возвращает ошибку.
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
  } | {
    @statusCode _: 402;
    @body body: ApiError;
  };
}

@route("/files")
@tag("Files")
interface FileOperations {
  @extension("x-requirements", #{
    scope: "files:read",
  })
  @doc("""
Скачивание файла

Отдаёт сам файл, а не ссылку на него. Нужен для вложений, у которых прямой ссылки на хранилище нет: в поле `url` у них стоит адрес этого метода, и открыть его можно только с токеном. Так отдаются зашифрованные файлы и отправленные из безопасного контура пространства — обе настройки описаны в разделе [Шифрование и безопасный контур](/guides/data-protection).

Отказ приходит `403` с кодом `confidential_download_denied`. Сверяется при этом адрес, с которого пришёл запрос, то есть адрес вашего сервера, а не сотрудника, чьим токеном вы пользуетесь: для серверной интеграции это самая частая причина отказа.

Ответ — тело файла и заголовок `Content-Disposition` с его именем, а не `JSON`. Зашифрованный файл расшифровывается на лету и приходит вложением целиком: `target` для него не действует. Если расшифровать не удалось, ответ — `400` с кодом `decryption_failed`.

Вложение сообщения доступно тому, кто видит само сообщение, а вложение черновика — только его автору.
""")
  @route("/{id}")
  @get
  downloadFile(
    @doc("Идентификатор файла из поля `id` вложения")
    @extension("example", 3560)
    @path id: int32,
    @doc("Что отдать вместо исходного файла: `pdf_preview` — документ, переведённый в PDF, `pdf_first_page` — первая страница картинкой, `thumb` — уменьшенная копия изображения, `image` — изображение как есть. Без параметра приходит исходный файл. Вариант, которого у этого файла нет, приводит к `400`.")
    @extension("example", "thumb")
    @query target?: FileTarget
  ): {
    @statusCode _: 200;
    @body body: bytes;
  } | {
    @statusCode _: 401;
    @body body: OAuthError;
  } | {
    @statusCode _: 403;
    @body body: ApiError | OAuthError;
  } | {
    @statusCode _: 404;
    @body body: ApiError;
  } | {
    @statusCode _: 400;
    @body body: ApiError;
  } | {
    @statusCode _: 402;
    @body body: ApiError;
  };
}

@route("/uploads")
@tag("Files")
interface UploadOperations {
  @extension("x-requirements", #{
    scope: "uploads:write",
  })
  @doc("""
Получение подписи, ключа и других параметров

Первый шаг загрузки файла: метод выдаёт адрес хранилища и подписанные поля формы, с которыми файл заливают следующим запросом.

Ничего в Пачке при этом ещё не создаётся: загруженный файл никому не виден и ни к чему не привязан. Вложением он становится, когда его `key` передан в поле `files` — в [Новое сообщение](POST /messages) или [Новый черновик](POST /drafts), а также при их правке.

Параметры выдаются на один файл: для каждого следующего запрашивайте их заново. Подпись действует 14 дней, а `key` привязан к владельцу токена, поэтому чужой ключ приложить к своему сообщению не получится.
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
  } | {
    @statusCode _: 402;
    @body body: ApiError;
  };
}

@doc("Данные для загрузки файла")
model FileUploadRequest {
  @doc("Параметр Content-Disposition, полученный в ответе на запрос [Получение подписи, ключа и других параметров](POST /uploads)")
  `Content-Disposition`: HttpPart<string>;

  @doc("Параметр acl, полученный в ответе на запрос [Получение подписи, ключа и других параметров](POST /uploads)")
  acl: HttpPart<string>;

  @doc("Параметр policy, полученный в ответе на запрос [Получение подписи, ключа и других параметров](POST /uploads)")
  policy: HttpPart<string>;

  @doc("Параметр x-amz-credential, полученный в ответе на запрос [Получение подписи, ключа и других параметров](POST /uploads)")
  `x-amz-credential`: HttpPart<string>;

  @doc("Параметр x-amz-algorithm, полученный в ответе на запрос [Получение подписи, ключа и других параметров](POST /uploads)")
  `x-amz-algorithm`: HttpPart<string>;

  @doc("Параметр x-amz-date, полученный в ответе на запрос [Получение подписи, ключа и других параметров](POST /uploads)")
  `x-amz-date`: HttpPart<string>;

  @doc("Параметр x-amz-signature, полученный в ответе на запрос [Получение подписи, ключа и других параметров](POST /uploads)")
  `x-amz-signature`: HttpPart<string>;
  
  @doc("Параметр key, полученный в ответе на запрос [Получение подписи, ключа и других параметров](POST /uploads)")
  key: HttpPart<string>;
  
  @doc("Файл для загрузки")
  file: HttpPart<bytes>;
}

@tag("Files")
interface DirectUploadOperations {
  @extension("x-requirements", #{
    auth: false,
  })
  @extension("x-external-url", "directUrl")
  @doc("""
Загрузка файла

Второй шаг загрузки: сам файл уходит в хранилище формой `multipart/form-data`. Поля формы и адрес берутся из ответа метода [Получение подписи, ключа и других параметров](POST /uploads) и передаются как есть, в том же порядке, а файл идёт последним полем.

Запрос уходит не в API Пачки, а прямо в хранилище, и в ответ приходит `204` без тела. Дальше файл прикладывают, передав его `key` в поле `files` — в [Новое сообщение](POST /messages) или [Новый черновик](POST /drafts), а также при их правке. Имя файла в `name` должно иметь то же расширение, что и `key`, иначе сообщение будет отклонено.
""")
  @post
  @route("direct_url")
  uploadFile(
    @multipartBody request: FileUploadRequest
  ): {@statusCode _: 204};
}
