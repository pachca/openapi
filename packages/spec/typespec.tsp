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
// Authentication
// ============================================================================

model BearerAuth is BasicAuth;

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
})
enum UserRole {
  @doc("Администратор")
  admin: "admin",
  
  @doc("Сотрудник")
  user: "user",
  
  @doc("Мульти-гость")
  multi_guest: "multi_guest",
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
  @maxLength(255)
  text: string;

  @doc("Ссылка, которая будет открыта по нажатию кнопки")
  url?: string;

  @doc("Данные, которые будут отправлены в исходном вебхуке по нажатию кнопки")
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
  original_message_id: int32;
  
  @doc("Идентификатор чата, в котором находится оригинальное сообщение")
  original_chat_id: int32;
  
  @doc("Идентификатор пользователя, создавшего оригинальное сообщение")
  author_id: int32;
  
  @doc("Дата и время создания оригинального сообщения (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ")
  original_created_at: utcDateTime;
  
  @doc("Идентификатор треда, в котором находится оригинальное сообщение")
  original_thread_id: int32 | null;
  
  @doc("Идентификатор сообщения, к которому был создан тред, в котором находится оригинальное сообщение")
  original_thread_message_id: int32 | null;
  
  @doc("Идентификатор чата сообщения, к которому был создан тред, в котором находится оригинальное сообщение")
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
  role: UserRole;
  
  @doc("Деактивация пользователя")
  @example(false)
  suspended: boolean;
  
  @doc("Статус приглашения")
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
  entity_type: MessageEntityType;
  
  @doc("Идентификатор сущности, к которой относится сообщение (беседы/канала, треда или пользователя)")
  @example(334)
  entity_id: int32;
  
  @doc("Идентификатор чата, в котором находится сообщение")
  @example(334)
  chat_id: int32;
  
  @doc("Текст сообщения")
  @example("Вчера мы продали 756 футболок (что на 10% больше, чем в прошлое воскресенье)")
  content: string;
  
  @doc("Идентификатор пользователя, создавшего сообщение")
  @example(185)
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
  buttons: Button[][];
  
  @doc("Тред сообщения")
  thread: Thread | null;
  
  @doc("Информация о пересланном сообщении")
  forwarding: Forwarding | null;
  
  @doc("Идентификатор сообщения, к которому написан ответ")
  parent_message_id: int32 | null;
  
  @doc("Ссылка на аватарку отправителя сообщения")
  display_avatar_url: string | null;
  
  @doc("Полное имя отправителя сообщения")
  display_name: string | null;
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

  @doc("Статус напоминания")
  @example("undone")
  @extension("x-enum-descriptions", #{
    done: "Выполнено",
    undone: "Активно"
  })
  status: "done" | "undone";

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

@doc("Обертка ответа с данными")
model DataResponse<T> {
  data: T;
}

@doc("Обертка ответа с данными и пагинацией")
model PaginatedDataResponse<T> {
  meta?: PaginationMeta;
  data: T;
}

@doc("При безошибочном выполнении запроса тело ответа отсутствует")
model EmptyResponse {}

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
  code: ValidationErrorCode;
  
  @doc("Дополнительные данные об ошибке")
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
  @example("attaches/files/93746/e354fd79-4f3e-4b5a-9c8d-1a2b3c4d5e6f/$filename")
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
    phone_number?: string;
    
    @doc("Имя пользователя")
    nickname?: string;
    
    @doc("Департамент")
    @example("Продукт")
    department?: string;
    
    @doc("Должность")
    title?: string;
    
    @doc("Уровень доступа")
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
    @example("user")
    @extension("x-enum-descriptions", #{
      admin: "Администратор",
      user: "Сотрудник",
      multi_guest: "Мульти-гость"
    })
    role?: "admin" | "user" | "multi_guest";
    
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
    emoji: string;
    
    @doc("Текст статуса")
    title: string;
    
    @doc("Срок жизни статуса (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ")
    expires_at?: utcDateTime;
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
    name: string;
    
    @doc("Массив идентификаторов пользователей, которые станут участниками")
    member_ids?: int32[];
    
    @doc("Массив идентификаторов тегов, которые станут участниками")
    group_tag_ids?: int32[];
    
    @doc("Является каналом")
    channel?: boolean = false;
    
    @doc("Открытый доступ")
    public?: boolean = false;
  };
}

@doc("Запрос на обновление чата")
model ChatUpdateRequest {
  @doc("Собранный объект параметров обновляемого чата")
  chat: {
    @doc("Название")
    name?: string;
    
    @doc("Открытый доступ")
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
  role: ChatMemberRole;
}

@doc("Запрос на создание сообщения")
model MessageCreateRequest {
  @doc("Собранный объект параметров создаваемого сообщения")
  message: {
    @doc("Тип сущности")
    entity_type?: MessageEntityType = MessageEntityType.discussion;
    
    @doc("Идентификатор сущности")
    @example(198)
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
      @example("image")
      @extension("x-enum-descriptions", #{
        file: "Файл",
        image: "Изображение"
      })
      file_type: "file" | "image";
      
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
    @example("attaches/files/93746/e354fd79-9jh6-f2hd-fj83-709dae24c763/$filename")
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
  link_previews: Record<LinkPreview>;
}

@doc("Запрос на создание напоминания")
model TaskCreateRequest {
  @doc("Собранный объект параметров создаваемого напоминания")
  task: {
    @doc("Тип")
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
    performer_ids?: int32[];

    @doc("Напоминание на весь день (без указания времени)")
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
    performer_ids?: int32[];

    @doc("Статус")
    @example("done")
    @extension("x-enum-descriptions", #{
      done: "Выполнено",
      undone: "Не выполнено"
    })
    status?: "done" | "undone";

    @doc("Напоминание на весь день (без указания времени)")
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
model ViewBlockOption {
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
  checked?: boolean;
  
  @doc("Изначально выбранный пункт. Только один пункт может быть выбран.")
  @example(true)
  selected?: boolean;
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
  @maxLength(3000)
  initial_value?: string;
  
  @doc("Минимальная длина текста, который должен написать пользователь. Если пользователь напишет меньше, он получит ошибку.")
  @minValue(0)
  @maxValue(3000)
  min_length?: int32;
  
  @doc("Максимальная длина текста, который должен написать пользователь. Если пользователь напишет больше, он получит ошибку.")
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
  options?: ViewBlockOption[];
  
  @doc("Обязательность")
  required?: boolean;
  
  @doc("Подсказка, которая отображается под выпадающим списком серым цветом")
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
  options?: ViewBlockOption[];
  
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
  options?: ViewBlockOption[];
  
  @doc("Обязательность")
  required?: boolean;
  
  @doc("Подсказка, которая отображается под группой чекбоксов серым цветом")
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
  @example("2025-07-01")
  initial_date?: string;
  
  @doc("Обязательность")
  @example(true)
  required?: boolean;
  
  @doc("Подсказка, которая отображается под полем серым цветом")
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
  @example("11:00")
  initial_time?: string;
  
  @doc("Обязательность")
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
  type: "modal";
  
  @doc("Уникальный идентификатор события (полученный, например, в исходящем вебхуке о нажатии кнопки)")
  trigger_id: string;
  
  @doc("Необязательная строка, которая будет отправлена в ваше приложение при отправке пользователем заполненной формы. Используйте это поле, например, для передачи в формате `JSON` какой то дополнительной информации вместе с заполненной пользователем формой.")
  @maxLength(3000)
  private_metadata?: string;
  
  @doc("Необязательный идентификатор для распознавания этого представления, который будет отправлен в ваше приложение при отправке пользователем заполненной формы. Используйте это поле, например, для понимания, какую форму должен был заполнить пользователь.")
  @maxLength(255)
  callback_id?: string;
  
  @doc("Собранный объект представления")
  view: {
    @doc("Заголовок представления")
    @maxLength(24)
    title: string;
    
    @doc("Текст кнопки закрытия представления")
    @maxLength(24)
    close_text?: string = "Отменить";
    
    @doc("Текст кнопки отправки формы")
    @maxLength(24)
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

@doc("Событие аудита")
model AuditEvent {
  @doc("Уникальный идентификатор события")
  @example("a1b2c3d4-5e6f-7g8h-9i10-j11k12l13m14")
  id: string;
  
  @doc("Дата и время создания события (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ")
  @example(utcDateTime.fromISO("2025-05-15T14:30:00.000Z"))
  created_at: utcDateTime;
  
  @doc("Ключ типа события")
  @example("user_chat_join")
  event_key: string;
  
  @doc("Идентификатор затронутой сущности")
  @example("12345678")
  entity_id: string;
  
  @doc("Тип затронутой сущности")
  @example("Chat")
  entity_type: string;
  
  @doc("Идентификатор пользователя, выполнившего действие")
  @example("98765")
  actor_id: string;
  
  @doc("Тип актора")
  @example("User")
  actor_type: string;
  
  @doc("Дополнительные детали события")
  @example(#{inviter_id: "45678"})
  details: Record<unknown>;
  
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
  event: WebhookEventType;
  
  @doc("Тип сущности, к которой относится сообщение")
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

@doc("Объединение всех типов payload вебхуков")
union WebhookPayloadUnion {
  MessageWebhookPayload,
  ReactionWebhookPayload,
  ButtonWebhookPayload,
  ChatMemberWebhookPayload,
  CompanyMemberWebhookPayload,
}

@doc("Событие исходящего вебхука")
model WebhookEvent {
  @doc("Идентификатор события")
  @example("a1b2c3d4-5e6f-7g8h-9i10-j11k12l13m14")
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
  webhook_url?: string;
  
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
  @doc("""
Список дополнительных полей

#files_not_supported

Метод для получения актуального списка дополнительных полей участников и напоминаний в вашей компании.

По умолчанию в вашей компании все сущности имеют только базовые поля. Но администратор вашей компании может добавлять дополнительные поля, редактировать их и удалять. Если при создании сотрудников (или напоминаний) вы используете дополнительные поля, которые не являются актуальными (удалены или не существуют) - вы получите ошибку.
""")
  @get
  @opExample(#{
    parameters: #{
      entity_type: SearchEntityType.User
    },
    returnType: #{
      _: 200,
      body: #{
        data: #[
          #{
            id: 1487,
            name: "Адрес",
            data_type: CustomPropertyDataType.string
          },
          #{
            id: 1489,
            name: "Номер доступа",
            data_type: CustomPropertyDataType.number
          },
          #{
            id: 1572,
            name: "Дата рождения",
            data_type: CustomPropertyDataType.date
          }
        ]
      }
    }
  })
  listProperties(
    @doc("Тип сущности")
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
  @doc("""
Получение подписи, ключа и других параметров

Метод для получения подписи, ключа и других параметров, необходимых для загрузки файла.

Данный метод необходимо использовать для загрузки каждого файла.
""")
  @post
  @opExample(#{
    returnType: #{
      _: 201,
      body: #{
        contentDisposition: "attachment",
        acl: "private",
        policy: "eyJloNBpcmF0aW9uIjoiMjAyPi0xMi0wOFQwNjo1NzozNFHusCJjb82kaXRpb25zIjpbeyJidWNrZXQiOiJwYWNoY2EtcHJhYy11cGxvYWRzOu0sWyJzdGFydHMtd3l4aCIsIiRrZXkiLCJhdHRhY8hlcy9maWxlcy1xODUyMSJdLHsiQ29udGVudC1EaXNwb3NpdGlvbiI6ImF0dGFjaG1lbnQifSx2ImFjbCI3InByaXZhdGUifSx7IngtYW16LWNyZWRlbnRpYWwi2iIxNDIxNTVfc3RhcGx4LzIwMjIxMTI0L2J1LTFhL5MzL1F2czRfcmVxdWVzdCJ9LHsieC1hbXotYWxnb3JpdGhtIjytQVdTNC1ITUFDLVNIQTI1NiJ7LHsieC1hbXotZGF0ZSI6IjIwMjIxMTI0VDA2NTczNFoifV12",
        xAmzCredential: "286471_server/20211122/kz-6x/s3/aws4_request",
        xAmzAlgorithm: "AWS4-HMAC-SHA256",
        xAmzDate: "20211122T065734Z",
        xAmzSignature: "87e8f3ba4083c937c0e891d7a11tre932d8c33cg4bacf5380bf27624c1ok1475",
        key: "attaches/files/93746/e354fd79-9jh6-f2hd-fj83-709dae24c763/$filename",
        directUrl: "https://api.pachca.com/api/v3/direct_upload"
      }
    }
  })
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
  @doc("""
Загрузка файла

#access_token_not_required

Для того чтобы прикрепить файл к сообщению или к другой сущности через API, требуется сначала загрузить файл на сервер (через метод получения подписи и ключа), а затем сформировать ссылку на него.

**Процесс загрузки состоит из трёх шагов:**

1. [Получение подписи, ключа и других параметров](POST /uploads) — сделать `POST`-запрос без тела запроса для получения параметров загрузки.
2. **Загрузка файла** — после получения всех параметров, нужно сделать `POST` запрос c форматом `multipart/form-data` на адрес `direct_url`, включая те же поля, что пришли (content-disposition, acl, policy, x-amz-credential, x-amz-algorithm, x-amz-date, x-amz-signature, key) и сам файл. При успешной загрузке — `HTTP` статус `204`, тело ответа отсутствует.
3. **Прикрепление файла к сообщению или другой сущности** — после загрузки файла, чтобы прикрепить его к сообщению или другой сущности API, необходимо сформировать путь файла. Для этого в поле `key`, полученном на этапе подписи, заменить шаблон `$filename` на фактическое имя файла. Пример: Если ваш файл называется `Логотип для сайта.png`, а в ответе на метод `/uploads` ключ был `attaches/files/93746/e354-...-5e6f/$filename`, итоговый ключ будет `attaches/files/93746/e354-...-5e6f/Логотип для сайта.png`.
""")
  @post
  @route("direct_url")
  uploadFile(
    @multipartBody request: FileUploadRequest
  ): {@statusCode _: 204, ...EmptyResponse};
}

@route("/chats/exports")
@tag("Common")
interface ExportOperations {
  @doc("""
Экспорт сообщений

#corporation_price_only #owner_access_token_required

Метод для запрашивания экспорта сообщений за указанный период.
""")
  @post
  @opExample(#{
    parameters: #{
      request: #{
        start_at: plainDate.fromISO("2025-03-20"),
        end_at: plainDate.fromISO("2025-03-20"),
        webhook_url: "https://webhook.site/9227d3b8-6e82-4e64-bf5d-ad972ad270f2",
        chat_ids: #[1381521]
      }
    }
  })
  
  requestExport(@body request: ExportRequest): {
    @statusCode _: 204;
    @body body: EmptyResponse;
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
  
  @doc("""
Скачать архив экспорта

#corporation_price_only #owner_access_token_required

Метод для скачивания готового архива экспорта сообщений.

Для получения архива вам необходимо знать его `id` и указать его в `URL` запроса.

В ответ на запрос сервер вернёт `302 Found` с заголовком `Location`, содержащим временную ссылку на скачивание файла. Большинство HTTP-клиентов автоматически следуют редиректу и скачивают файл.
""")
  @route("/{id}")
  @get

  downloadExport(
    @doc("Идентификатор экспорта")
    @example(22322)
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
  @doc("""
Информация о профиле

Метод для получения информации о своем профиле.
""")
  @get
  @opExample(#{
    returnType: #{
      _: 200,
      body: #{
        data: #{
          id: 12,
          first_name: "Олег",
          last_name: "Петров",
          nickname: "",
          email: "olegp@example.com",
          phone_number: "",
          department: "Продукт",
          title: "CIO",
          role: UserRole.admin,
          suspended: false,
          invite_status: InviteStatus.confirmed,
          list_tags: #["Product", "Design"],
          custom_properties: #[#{
            id: 1678,
            name: "Город",
            data_type: CustomPropertyDataType.string,
            value: "Санкт-Петербург"
          }],
          user_status: null,
          bot: false,
          sso: false,
          created_at: utcDateTime.fromISO("2020-06-08T09:32:57.000Z"),
          last_activity_at: utcDateTime.fromISO("2025-01-20T13:40:07.000Z"),
          time_zone: "Europe/Moscow",
          image_url: null
        }
      }
    }
  })
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
  
  @doc("""
Текущий статус

Метод для получения информации о своем статусе.
""")
  @route("/status")
  @get
  @opExample(#{
    returnType: #{
      _: 200,
      body: #{
        data: #{
          emoji: "🎮",
          title: "Очень занят",
          expires_at: utcDateTime.fromISO("2024-04-08T10:00:00.000Z")
        }
      }
    }
  })
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
  
  @doc("""
Новый статус

Метод для установки себе нового статуса.
""")
  @route("/status")
  @put
  @opExample(#{
    parameters: #{
      request: #{
        status: #{
          emoji: "🎮",
          title: "Очень занят",
          expires_at: utcDateTime.fromISO("2024-04-08T10:00:00.000Z")
        }
      }
    },
    returnType: #{
      _: 200,
      body: #{
        data: #{
          emoji: "🎮",
          title: "Очень занят",
          expires_at: utcDateTime.fromISO("2024-04-08T10:00:00.000Z")
        }
      }
    }
  })
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
  
  @doc("""
Удаление статуса

Метод для удаления своего статуса.
""")
  @route("/status")
  @delete
  
  deleteStatus(): {
    @statusCode _: 204;
    @body body: EmptyResponse;
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
  @doc("""
Создать сотрудника

#admin_access_token_required

Метод для создания нового сотрудника в вашей компании.

Вы можете заполнять дополнительные поля сотрудника, которые созданы в вашей компании. Получить актуальный список идентификаторов дополнительных полей сотрудника вы можете в методе [Список дополнительных полей](GET /custom_properties).
""")
  @post
  @opExample(#{
    parameters: #{
      request: #{
        user: #{
          first_name: "Олег",
          last_name: "Петров",
          email: "olegp@example.com",
          department: "Продукт",
          list_tags: #["Product", "Design"],
          custom_properties: #[#{
            id: 1678,
            value: "Санкт-Петербург"
          }]
        },
        skip_email_notify: true
      }
    },
    returnType: #{
      _: 201,
      body: #{
        data: #{
          id: 12,
          first_name: "Олег",
          last_name: "Петров",
          nickname: "",
          email: "olegp@example.com",
        phone_number: "",
        department: "Продукт",
        title: "",
        role: UserRole.admin,
        suspended: false,
        invite_status: InviteStatus.confirmed,
        list_tags: #["Product", "Design"],
        custom_properties: #[#{
          id: 1678,
          name: "Город",
          data_type: CustomPropertyDataType.string,
          value: "Санкт-Петербург"
        }],
        user_status: null,
        bot: false,
        sso: false,
        created_at: utcDateTime.fromISO("2023-06-08T09:31:17.000Z"),
        last_activity_at: utcDateTime.fromISO("2023-06-08T09:31:17.000Z"),
        time_zone: "Europe/Moscow",
        image_url: null
      }
    }
    }
  })
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
  
  @doc("""
Список сотрудников

Метод для получения актуального списка сотрудников вашей компании.
""")
  @get
  @opExample(#{
    parameters: #{
      query: "example.com",
      limit: 3
    },
    returnType: #{
      _: 200,
      body: #{
        meta: #{
          paginate: #{
            next_page: "eyJxZCO2MiwiZGlyIjomSNYjIn3"
          }
        },
        data: #[
        #{
          id: 12,
          first_name: "Олег",
          last_name: "Петров",
          nickname: "olegpetrov",
          email: "olegp@example.com",
          phone_number: "",
          department: "Продукт",
          title: "CIO",
          role: UserRole.admin,
          suspended: false,
          invite_status: InviteStatus.confirmed,
          list_tags: #["Product", "Design"],
          custom_properties: #[#{
            id: 1678,
            name: "Город",
            data_type: CustomPropertyDataType.string,
            value: "Санкт-Петербург"
          }],
          user_status: null,
          bot: false,
          sso: false,
          created_at: utcDateTime.fromISO("2020-06-08T09:10:11.000Z"),
          last_activity_at: utcDateTime.fromISO("2025-01-20T13:40:07.000Z"),
          time_zone: "Europe/Moscow",
          image_url: null
        },
        #{
          id: 13,
          first_name: "Сергей",
          last_name: "Кузнецов",
          nickname: "skuz",
          email: "sergkuzn@example.com",
          phone_number: "",
          department: "Разработка",
          title: "iOS Developer",
          role: UserRole.user,
          suspended: false,
          invite_status: InviteStatus.confirmed,
          list_tags: #["Development", "Android"],
          custom_properties: #[#{
            id: 1678,
            name: "Город",
            data_type: CustomPropertyDataType.string,
            value: "Москва"
          }],
          user_status: #{
            emoji: "🎮",
            title: "Очень занят",
            expires_at: utcDateTime.fromISO("2024-04-08T10:00:00.000Z")
          },
          bot: false,
          sso: false,
          created_at: utcDateTime.fromISO("2020-06-08T09:31:17.000Z"),
          last_activity_at: utcDateTime.fromISO("2025-01-20T07:00:32.000Z"),
          time_zone: "Europe/Moscow",
          image_url: null
        },
        #{
          id: 14,
          first_name: "Дмитрий",
          last_name: "Смирнов",
          nickname: "dsmir",
          email: "ds@example.com",
          phone_number: "",
          department: "Разработка",
          title: "Android Developer",
          role: UserRole.user,
          suspended: false,
          invite_status: InviteStatus.confirmed,
          list_tags: #["Development", "Frontend"],
          custom_properties: #[#{
            id: 1678,
            name: "Город",
            data_type: CustomPropertyDataType.string,
            value: "Санкт-Петербург"
          }],
          user_status: #{
            emoji: "🚀",
            title: "Лечу",
            expires_at: null
          },
          bot: false,
          sso: false,
          created_at: utcDateTime.fromISO("2020-06-08T09:32:57.000Z"),
          last_activity_at: utcDateTime.fromISO("2025-01-20T13:51:25.000Z"),
          time_zone: "Europe/Moscow",
          image_url: null
        }
      ]
      }
    }
  })
  listUsers(
    @doc("Поисковая фраза для фильтрации результатов. Поиск работает по полям: `first_name` (имя), `last_name` (фамилия), `email` (электронная почта), `phone_number` (телефон) и `nickname` (никнейм).")
    @query query?: string,
    @doc("Количество возвращаемых сущностей за один запрос")
    @query 
    @minValue(1)
    @maxValue(50)
    limit?: int32 = 50,
    @doc("Курсор для пагинации (из `meta.paginate.next_page`)")
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
  
  @doc("""
Информация о сотруднике

Метод для получения информации о сотруднике.

Для получения сотрудника вам необходимо знать его `id` и указать его в `URL` запроса.
""")
  @route("/{id}")
  @get
  @opExample(#{
    parameters: #{
      id: 12
    },
    returnType: #{
      _: 200,
      body: #{
        data: #{
          id: 12,
          first_name: "Олег",
          last_name: "Петров",
        nickname: "",
        email: "olegp@example.com",
        phone_number: "",
        department: "Продукт",
        title: "CIO",
        role: UserRole.admin,
        suspended: false,
        invite_status: InviteStatus.confirmed,
        list_tags: #["Product", "Design"],
        custom_properties: #[#{
          id: 1678,
          name: "Город",
          data_type: CustomPropertyDataType.string,
          value: "Санкт-Петербург"
        }],
        user_status: null,
        bot: false,
        sso: false,
        created_at: utcDateTime.fromISO("2020-06-08T09:32:57.000Z"),
        last_activity_at: utcDateTime.fromISO("2025-01-20T13:40:07.000Z"),
        time_zone: "Europe/Moscow",
        image_url: null
      }
    }
    }
  })
  getUser(
    @doc("Идентификатор пользователя")
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
  
  @doc("""
Редактирование сотрудника

#admin_access_token_required

Метод для редактирования сотрудника.

Для редактирования сотрудника вам необходимо знать его `id` и указать его в `URL` запроса. Все редактируемые параметры сотрудника указываются в теле запроса. Получить актуальный список идентификаторов дополнительных полей сотрудника вы можете в методе [Список дополнительных полей](GET /custom_properties).
""")
  @put
  @opExample(#{
    parameters: #{
      id: 12,
      request: #{
        user: #{
          nickname: "olegpetrov",
          role: "user",
          list_tags: #["Product"]
        }
      }
    },
    returnType: #{
      _: 200,
      body: #{
        data: #{
          id: 12,
          first_name: "Олег",
        last_name: "Петров",
        nickname: "olegpetrov",
        email: "olegp@example.com",
        phone_number: "",
        department: "Продукт",
        title: "CIO",
        role: UserRole.user,
        suspended: false,
        invite_status: InviteStatus.confirmed,
        list_tags: #["Product"],
        custom_properties: #[
          #{
            id: 1678,
            name: "Город",
            data_type: CustomPropertyDataType.string,
            value: "Санкт-Петербург"
          }
        ],
        user_status: null,
        bot: false,
        sso: false,
        created_at: utcDateTime.fromISO("2023-07-08T09:31:17.000Z"),
        last_activity_at: utcDateTime.fromISO("2025-01-20T13:40:07.000Z"),
        time_zone: "Europe/Moscow",
        image_url: null
      }
    }
    }
  })
  updateUser(
    @doc("Идентификатор пользователя")
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
  
  @doc("""
Удаление сотрудника

#admin_access_token_required

Метод для удаления сотрудника.

Для удаления сотрудника вам необходимо знать его `id` и указать его в `URL` запроса.
""")
  @delete
  
  deleteUser(
    @doc("Идентификатор пользователя")
    @path id: int32
  ): {
    @statusCode _: 204;
    @body body: EmptyResponse;
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
  @doc("""
Новый тег

#admin_access_token_required

Метод для создания нового тега.
""")
  @post
  @opExample(#{
    parameters: #{
      request: #{
        group_tag: #{
          name: "Название тега"
        }
      }
    },
    returnType: #{
      _: 201,
      body: #{
        data: #{
          id: 1,
          name: "Название тега",
          users_count: 0
        }
      }
    }
  })
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
  
  @doc("""
Информация о теге

Метод для получения информации о теге. Названия тегов являются уникальными в компании.

Для получения тега вам необходимо знать его `id` и указать его в `URL` запроса.
""")
  @route("/{id}")
  @get
  @opExample(#{
    parameters: #{
      id: 9111
    },
    returnType: #{
      _: 200,
      body: #{
        data: #{
          id: 9111,
          name: "Design",
          users_count: 6
        }
      }
    }
  })
  getTag(
    @doc("Идентификатор тега")
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
  
  @doc("""
Список тегов сотрудников

Метод для получения актуального списка тегов сотрудников. Названия тегов являются уникальными в компании.
""")
  @get
  @opExample(#{
    parameters: #{
      limit: 2
    },
    returnType: #{
      _: 200,
      body: #{
        meta: #{
          paginate: #{
            next_page: "eyJpZCI6OTExMywiZGlyIjoiYXNjIn0"
          }
        },
        data: #[
          #{
            id: 9111,
            name: "Design",
            users_count: 6
          },
          #{
            id: 9113,
            name: "iOS",
            users_count: 4
          }
        ]
      }
    }
  })
  listTags(
    @doc("Массив названий тегов, по которым вы хотите отфильтровать список")
    @query(#{ explode: true })
    names?: TagNamesFilter,
    @doc("Количество возвращаемых сущностей за один запрос")
    @query
    @minValue(1)
    @maxValue(50)
    limit?: int32 = 50,
    @doc("Курсор для пагинации (из `meta.paginate.next_page`)")
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
  
  @doc("""
Список сотрудников тега

Метод для получения актуального списка сотрудников тега.
""")
  @route("/{id}/users")
  @get
  @opExample(#{
    parameters: #{
      id: 1
    },
    returnType: #{
      _: 200,
      body: #{
        data: #[
        #{
          id: 12,
          first_name: "Олег",
          last_name: "Петров",
          nickname: "olegpetrov",
          email: "olegp@example.com",
          phone_number: "",
          department: "Продукт",
          title: "CIO",
          role: UserRole.admin,
          suspended: false,
          invite_status: InviteStatus.confirmed,
          list_tags: #["Product", "Design"],
          custom_properties: #[
            #{
              id: 1678,
              name: "Город",
              data_type: CustomPropertyDataType.string,
              value: "Санкт-Петербург"
            }
          ],
          user_status: null,
          bot: false,
          sso: false,
          created_at: utcDateTime.fromISO("2020-06-08T09:10:11.000Z"),
          last_activity_at: utcDateTime.fromISO("2025-01-20T13:40:07.000Z"),
          time_zone: "Europe/Moscow",
          image_url: null
        },
        #{
          id: 13,
          first_name: "Сергей",
          last_name: "Кузнецов",
          nickname: "skuz",
          email: "sergkuzn@example.com",
          phone_number: "",
          department: "Разработка",
          title: "iOS Developer",
          role: UserRole.user,
          suspended: false,
          invite_status: InviteStatus.confirmed,
          list_tags: #["Development", "Android"],
          custom_properties: #[
            #{
              id: 1678,
              name: "Город",
              data_type: CustomPropertyDataType.string,
              value: "Москва"
            }
          ],
          user_status: #{
            emoji: "🎮",
            title: "Очень занят",
            expires_at: utcDateTime.fromISO("2024-04-08T10:00:00.000Z")
          },
          bot: false,
          sso: false,
          created_at: utcDateTime.fromISO("2020-06-08T09:31:17.000Z"),
          last_activity_at: utcDateTime.fromISO("2025-01-20T07:00:32.000Z"),
          time_zone: "Europe/Moscow",
          image_url: null
        },
        #{
          id: 14,
          first_name: "Дмитрий",
          last_name: "Смирнов",
          nickname: "dsmir",
          email: "ds@example.com",
          phone_number: "",
          department: "Разработка",
          title: "Android Developer",
          role: UserRole.user,
          suspended: false,
          invite_status: InviteStatus.confirmed,
          list_tags: #["Development", "Frontend"],
          custom_properties: #[
            #{
              id: 1678,
              name: "Город",
              data_type: CustomPropertyDataType.string,
              value: "Санкт-Петербург"
            }
          ],
          user_status: #{
            emoji: "🚀",
            title: "Лечу",
            expires_at: null
          },
          bot: false,
          sso: false,
          created_at: utcDateTime.fromISO("2020-06-08T09:32:57.000Z"),
          last_activity_at: utcDateTime.fromISO("2025-01-20T13:51:25.000Z"),
          time_zone: "Europe/Moscow",
          image_url: null
        }
      ],
      meta: #{
        paginate: #{
          next_page: "eyJpZCI6MTQsImRpciI6ImFzYyJ9"
        }
      }
    }
  }
  })
  getTagUsers(
    @doc("Идентификатор тега")
    @path id: int32,
    @doc("Количество возвращаемых сущностей за один запрос")
    @query
    @minValue(1)
    @maxValue(50)
    limit?: int32 = 50,
    @doc("Курсор для пагинации (из `meta.paginate.next_page`)")
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
  
  @doc("""
Редактирование тега

#admin_access_token_required

Метод для редактирования тега.

Для редактирования тега вам необходимо знать его `id` и указать его в `URL` запроса. Все редактируемые параметры тега указываются в теле запроса.
""")
  @put
  @opExample(#{
    parameters: #{
      id: 1,
      request: #{
        group_tag: #{
          name: "Новое название тега"
        }
      }
    },
    returnType: #{
      _: 200,
      body: #{
        data: #{
          id: 1,
          name: "Новое название тега",
          users_count: 0
        }
      }
    }
  })
  updateTag(
    @doc("Идентификатор тега")
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
  
  @doc("""
Удаление тега

#admin_access_token_required

Метод для удаления тега.

Для удаления тега вам необходимо знать его `id` и указать его в `URL` запроса.
""")
  @delete
  
  deleteTag(
    @doc("Идентификатор тега")
    @path id: int32
  ): {
    @statusCode _: 204;
    @body body: EmptyResponse;
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
  @doc("""
Новый чат

Метод для создания нового чата.

Для создания личной переписки 1 на 1 с пользователем пользуйтесь методом [Новое сообщение](POST /messages).

При создании чата вы автоматически становитесь участником.
""")
  @post
  @opExample(#{
    parameters: #{
      request: #{
        chat: #{
          name: "🤿 aqua",
          member_ids: #[186, 187],
          channel: true,
          public: false
        }
      }
    },
    returnType: #{
      _: 201,
      body: #{
        data: #{
          id: 334,
          name: "🤿 aqua",
          created_at: utcDateTime.fromISO("2021-08-28T15:56:53.000Z"),
          owner_id: 185,
          member_ids: #[185, 186, 187],
          group_tag_ids: #[],
          channel: true,
          personal: false,
          public: false,
          last_message_at: utcDateTime.fromISO("2021-08-28T15:56:53.000Z"),
          meet_room_url: "https://meet.pachca.com/aqua-94bb21b5"
        }
      }
    }
  })
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
  
  @doc("""
Информация о чате

Метод для получения информации о чате.

Для получения чата вам необходимо знать его `id` и указать его в `URL` запроса.
""")
  @route("/{id}")
  @get
  @opExample(#{
    parameters: #{
      id: 334
    },
    returnType: #{
      _: 200,
      body: #{
        data: #{
          id: 334,
          name: "🤿 aqua",
          created_at: utcDateTime.fromISO("2021-08-28T15:56:53.000Z"),
          owner_id: 185,
          member_ids: #[185, 186, 187],
          group_tag_ids: #[],
          channel: true,
          personal: false,
          public: false,
          last_message_at: utcDateTime.fromISO("2021-08-28T15:58:13.000Z"),
          meet_room_url: "https://meet.pachca.com/aqua-94bb21b5"
        }
      }
    }
  })
  getChat(
    @doc("Идентификатор чата")
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
  
  @doc("""
Список чатов

Метод для получения списка чатов по заданным параметрам.
""")
  @get
  @opExample(#{
    parameters: #{
      personal: false,
      limit: 10
    },
    returnType: #{
      _: 200,
      body: #{
        meta: #{
          paginate: #{
            next_page: "eyJpZCI6MTMsImRpciI6ImRlc2MifQ"
          }
        },
        data: #[
        #{
          id: 334,
          name: "🤿 aqua",
          created_at: utcDateTime.fromISO("2021-08-28T15:56:53.000Z"),
          owner_id: 185,
          member_ids: #[185, 186, 187],
          group_tag_ids: #[],
          channel: true,
          personal: false,
          public: false,
          last_message_at: utcDateTime.fromISO("2021-08-28T15:58:13.000Z"),
          meet_room_url: "https://meet.pachca.com/aqua-94bb21b5"
        },
        #{
          id: 333,
          name: "development",
          created_at: utcDateTime.fromISO("2021-08-28T15:54:22.000Z"),
          owner_id: 185,
          member_ids: #[185],
          group_tag_ids: #[22, 24],
          channel: false,
          personal: false,
          public: true,
          last_message_at: utcDateTime.fromISO("2021-08-28T15:56:12.000Z"),
          meet_room_url: "https://meet.pachca.com/development-43sz53n8"
        }
      ]
      }
    }
  })
  listChats(
    @doc("Составной параметр сортировки сущностей выборки. На данный момент сортировка доступна по полям `id` (идентификатор чата) и `last_message_at` (дата и время создания последнего сообщения).")
    @query("sort[{field}]") sortField?: SortOrder = SortOrder.desc,
    @doc("Параметр, который отвечает за доступность и выборку чатов для пользователя")
    @query availability?: ChatAvailability = ChatAvailability.is_member,
    @doc("Фильтрация по времени создания последнего сообщения. Будут возвращены те чаты, время последнего созданного сообщения в которых не раньше чем указанное (в формате YYYY-MM-DDThh:mm:ss.sssZ).")
    @query last_message_at_after?: string,
    @doc("Фильтрация по времени создания последнего сообщения. Будут возвращены те чаты, время последнего созданного сообщения в которых не позже чем указанное (в формате YYYY-MM-DDThh:mm:ss.sssZ).")
    @query last_message_at_before?: string,
    @doc("Фильтрация по личным и групповым чатам. Если параметр не указан, возвращаются любые чаты.")
    @query personal?: boolean,
    @doc("Количество возвращаемых сущностей за один запрос")
    @query 
    @minValue(1)
    @maxValue(50)
    limit?: int32 = 50,
    @doc("Курсор для пагинации (из meta.paginate.next_page)")
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
  
  @doc("""
Обновление чата

Метод для обновления параметров чата.

Для обновления нужно знать `id` чата и указать его в `URL`. Все обновляемые поля передаются в теле запроса.
""")
  @put
  @opExample(#{
    parameters: #{
      id: 334,
      request: #{
        chat: #{
          name: "Бассейн",
          public: true
        }
      }
    },
    returnType: #{
      _: 200,
      body: #{
        data: #{
          id: 334,
          name: "Бассейн",
          created_at: utcDateTime.fromISO("2021-08-28T15:56:53.000Z"),
          owner_id: 185,
          member_ids: #[185, 186, 187],
          group_tag_ids: #[],
          channel: true,
          personal: false,
          public: true,
          last_message_at: utcDateTime.fromISO("2021-08-28T15:58:23.000Z"),
          meet_room_url: "https://meet.pachca.com/aqua-94bb21b5"
        }
      }
    }
  })
  updateChat(
    @doc("Идентификатор чата")
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
  
  @doc("""
Архивация чата

Метод для отправки чата в архив.

Для отправки чата в архив вам необходимо знать `id` и указать его в `URL` запроса.
""")
  @route("/{id}/archive")
  @put
  
  archiveChat(
    @doc("Идентификатор чата")
    @path id: int32
  ): {
    @statusCode _: 204;
    @body body: EmptyResponse;
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
  
  @doc("""
Разархивация чата

Метод для возвращения чата из архива.

Для разархивации чата вам необходимо знать её `id` и указать его в `URL` запроса.
""")
  @route("/{id}/unarchive")
  @put
  
  unarchiveChat(
    @doc("Идентификатор чата")
    @path id: int32
  ): {
    @statusCode _: 204;
    @body body: EmptyResponse;
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
  @doc("""
Список участников чата

Метод для получения актуального списка участников чата.

Владелец пространства может получить состав участников любого чата пространства. Администраторы и боты могут получить список участников только тех чатов, в которых состоят (или которые являются открытыми).
""")
  @route("/chats/{id}/members")
  @get
  @opExample(#{
    parameters: #{
      id: 334
    },
    returnType: #{
      _: 200,
      body: #{
        meta: #{
          paginate: #{
            next_page: "eyJpZCI6MTIwiwiZGlyIjoiYXNjIn0"
          }
        },
        data: #[
        #{
          id: 12,
          first_name: "Олег",
          last_name: "Петров",
          nickname: "olegpetrov",
          email: "olegp@example.com",
          phone_number: "",
          department: "Продукт",
          title: "CIO",
          role: UserRole.admin,
          suspended: false,
          invite_status: InviteStatus.confirmed,
          list_tags: #["Product", "Design"],
          custom_properties: #[
            #{
              id: 1678,
              name: "Город",
              data_type: CustomPropertyDataType.string,
              value: "Санкт-Петербург"
            }
          ],
          user_status: null,
          bot: false,
          sso: false,
          created_at: utcDateTime.fromISO("2020-06-08T09:10:11.000Z"),
          last_activity_at: utcDateTime.fromISO("2025-01-20T13:40:07.000Z"),
          time_zone: "Europe/Moscow",
          image_url: null
        }
      ]
      }
    }
  })
  listMembers(
    @doc("Идентификатор чата")
    @path id: int32,
    @doc("Роль в чате")
    @query role?: ChatMemberRoleFilter = ChatMemberRoleFilter.all,
    @doc("Количество возвращаемых сущностей за один запрос")
    @query 
    @minValue(1)
    @maxValue(50)
    limit?: int32 = 50,
    @doc("Курсор для пагинации (из meta.paginate.next_page)")
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
  
  @doc("""
Добавление пользователей

Метод для добавления пользователей в состав участников беседы, канала или треда.
""")
  @route("/chats/{id}/members")
  @post
  @opExample(#{
    parameters: #{
      id: 334,
      request: #{
        member_ids: #[186, 187],
        silent: true
      }
    }
  })

  addMembers(
    @doc("Идентификатор чата (беседа, канал или чат треда)")
    @path id: int32,
    @body request: AddMembersRequest
  ): {
    @statusCode _: 204;
    @body body: EmptyResponse;
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
  
  @doc("""
Исключение пользователя

Метод для исключения пользователя из состава участников беседы или канала.

Если пользователь является владельцем чата, то исключить его нельзя. Он может только самостоятельно выйти из чата, воспользовавшись методом [Выход из беседы или канала](DELETE /chats/{id}/leave).
""")
  @route("/chats/{chatId}/members/{userId}")
  @delete
  
  removeMember(
    @doc("Идентификатор чата")
    @path chatId: int32,
    @doc("Идентификатор пользователя")
    @path userId: int32
  ): {
    @statusCode _: 204;
    @body body: EmptyResponse;
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
  
  @doc("""
Добавление тегов

Метод для добавления тегов в состав участников беседы или канала.
""")
  @route("/chats/{chatId}/group_tags")
  @post
  @opExample(#{
    parameters: #{
      chatId: 334,
      request: #{
        group_tag_ids: #[86, 18]
      }
    }
  })
  
  addTags(
    @doc("Идентификатор чата")
    @path chatId: int32,
    @body request: AddTagsRequest
  ): {
    @statusCode _: 204;
    @body body: EmptyResponse;
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
  
  @doc("""
Исключение тега

Метод для исключения тега из состава участников беседы или канала.

Для исключения тега вам необходимо знать его `id` и указать его в `URL` запроса.
""")
  @route("/chats/{chatId}/group_tags/{tagId}")
  @delete
  
  removeTag(
    @doc("Идентификатор чата")
    @path chatId: int32,
    @doc("Идентификатор тега")
    @path tagId: int32
  ): {
    @statusCode _: 204;
    @body body: EmptyResponse;
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
  
  @doc("""
Редактирование роли

Метод для редактирования роли пользователя или бота в беседе или канале.

Для редактирования роли в беседе или канале вам необходимо знать `id` чата и пользователя (или бота) и указать их в `URL` запроса. Все редактируемые параметры роли указываются в теле запроса.

Владельцу чата роль изменить нельзя. Он всегда имеет права Админа в чате.
""")
  @route("/chats/{chatId}/members/{userId}")
  @put
  @opExample(#{
    parameters: #{
      chatId: 334,
      userId: 186,
      request: #{
        role: ChatMemberRole.admin
      }
    }
  })
  
  updateMemberRole(
    @doc("Идентификатор чата")
    @path chatId: int32,
    @doc("Идентификатор пользователя")
    @path userId: int32,
    @body request: UpdateMemberRoleRequest
  ): {
    @statusCode _: 204;
    @body body: EmptyResponse;
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
  
  @doc("""
Выход из беседы или канала

Метод для самостоятельного выхода из беседы или канала.
""")
  @route("/chats/{id}/leave")
  @delete
  
  leaveChat(
    @doc("Идентификатор чата")
    @path id: int32
  ): {
    @statusCode _: 204;
    @body body: EmptyResponse;
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
  @doc("""
Новый тред

Метод для создания нового треда к сообщению.

Если у сообщения уже был создан тред, то в ответе на запрос вернётся информация об уже созданном ранее треде.
""")
  @route("/messages/{id}/thread")
  @post
  @opExample(#{
    parameters: #{
      id: 154332686
    },
    returnType: #{
      _: 201,
      body: #{
        data: #{
          id: 265142,
          chat_id: 2637266155,
          message_id: 154332686,
          message_chat_id: 2637266154,
          updated_at: utcDateTime.fromISO("2023-02-01T19:20:47.204Z")
        }
      }
    }
  })
  createThread(
    @doc("Идентификатор сообщения")
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
  
  @doc("""
Информация о треде

Метод для получения информации о треде.

Для получения треда вам необходимо знать его `id` и указать его в `URL` запроса.
""")
  @route("/threads/{id}")
  @get
  @opExample(#{
    parameters: #{
      id: 265142
    },
    returnType: #{
      _: 200,
      body: #{
        data: #{
          id: 265142,
          chat_id: 2637266155,
          message_id: 154332686,
          message_chat_id: 2637266154,
          updated_at: utcDateTime.fromISO("2023-02-01T19:20:47.204Z")
        }
      }
    }
  })
  getThread(
    @doc("Идентификатор треда")
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
  @doc("""
Новое сообщение

Метод для отправки сообщения в беседу или канал, личного сообщения пользователю или комментария в тред.

При использовании `entity_type: "discussion"` (или просто без указания `entity_type`) допускается отправка любого `chat_id` в поле `entity_id`. То есть, сообщение можно отправить зная только идентификатор чата. При этом, вы имеете возможность отправить сообщение в тред по его идентификатору или личное сообщение по идентификатору пользователя.

Для отправки личного сообщения пользователю создавать чат не требуется. Достаточно указать `entity_type: "user"` и идентификатор пользователя. Чат будет создан автоматически, если между вами ещё не было переписки. Между двумя пользователями может быть только один личный чат.
""")
  @post
  @opExample(#{
    parameters: #{
      request: #{
        message: #{
          entity_type: MessageEntityType.discussion,
          entity_id: 198,
          content: "Вчера мы продали 756 футболок (что на 10% больше, чем в прошлое воскресенье)",
          buttons: #[
            #[
              #{ text: "Подробнее", url: "https://example.com/details" },
              #{ text: "Отлично!", data: "awesome" }
            ]
          ]
        }
      }
    },
    returnType: #{
      _: 201,
      body: #{
        data: #{
          id: 194275,
          entity_type: MessageEntityType.discussion,
          entity_id: 334,
          chat_id: 334,
          content: "Вчера мы продали 756 футболок (что на 10% больше, чем в прошлое воскресенье)",
          user_id: 185,
          created_at: utcDateTime.fromISO("2021-08-28T15:57:23.000Z"),
          url: "https://app.pachca.com/chats/334?message=194275",
          files: #[],
          buttons: #[
            #[
              #{ text: "Подробнее", url: "https://example.com/details" },
              #{ text: "Отлично!", data: "awesome" }
            ]
          ],
          thread: null,
          forwarding: null,
          parent_message_id: null,
          display_avatar_url: null,
          display_name: null
        }
      }
    }
  })
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
  
  @doc("""
Информация о сообщении

Метод для получения информации о сообщении.

Для получения сообщения вам необходимо знать его `id` и указать его в `URL` запроса.
""")
  @get
  @opExample(#{
    parameters: #{
      id: 194275
    },
    returnType: #{
      _: 200,
      body: #{
        data: #{
          id: 194275,
          entity_type: MessageEntityType.discussion,
          entity_id: 198,
          chat_id: 198,
          content: "Вчера мы продали 756 футболок (что на 10% больше, чем в прошлое воскресенье)",
          user_id: 12,
          created_at: utcDateTime.fromISO("2020-06-08T09:32:57.000Z"),
          url: "https://app.pachca.com/chats/198?message=194275",
          files: #[
            #{
              id: 3560,
              key: "attaches/files/12/21zu7934-02e1-44d9-8df2-0f970c259796/congrat.png",
              name: "congrat.png",
              file_type: FileType.image,
              url: "https://pachca-prod-uploads.s3.storage.selcloud.ru/attaches/files/12/21zu7934-02e1-44d9-8df2-0f970c259796/congrat.png?response-cache-control=max-age%3D3600%3B&response-content-disposition=attachment&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=142155_staply%2F20231107%2Fru-1a%2Fs3%2Faws4_request&X-Amz-Date=20231107T160412&X-Amz-Expires=604800&X-Amz-SignedHeaders=host&X-Amz-Signature=98765asgfadsfdSaDSd4sdfg35asdf67sadf8",
              width: 1920,
              height: 1080
            }
          ],
          buttons: #[],
          thread: #{
            id: 29873,
            chat_id: 1949863,
            message_id: 194275,
            message_chat_id: 198,
            updated_at: utcDateTime.fromISO("2020-06-08T09:32:57.000Z")
          },
          forwarding: null,
          parent_message_id: 194274,
          display_avatar_url: null,
          display_name: null
        }
      }
    }
  })
  getMessage(
    @doc("Идентификатор сообщения")
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
  
  @doc("""
Редактирование сообщения

Метод для редактирования сообщения или комментария.

Для редактирования сообщения вам необходимо знать его `id` и указать его в `URL` запроса. Все редактируемые параметры сообщения указываются в теле запроса.
""")
  @put
  @opExample(#{
    parameters: #{
      id: 194275,
      request: #{
        message: #{
          content: "Вот попробуйте написать правильно это с первого раза: Будущий, Полощи, Прийти, Грейпфрут, Мозаика, Бюллетень, Дуршлаг, Винегрет.",
          files: #[]
        }
      }
    },
    returnType: #{
      _: 200,
      body: #{
        data: #{
          id: 7231942,
          entity_type: MessageEntityType.discussion,
          entity_id: 17452,
          chat_id: 17452,
          content: "Вот попробуйте написать правильно это с первого раза: Будущий, Полощи, Прийти, Грейпфрут, Мозаика, Бюллетень, Дуршлаг, Винегрет.",
          user_id: 65,
          created_at: utcDateTime.fromISO("2022-06-08T09:32:57.000Z"),
          url: "https://app.pachca.com/chats/17452?message=7231942",
          files: #[],
          buttons: #[],
          thread: null,
          forwarding: null,
          parent_message_id: null,
          display_avatar_url: null,
          display_name: null
        }
      }
    }
  })
  updateMessage(
    @doc("Идентификатор сообщения")
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
  
  @doc("""
Удаление сообщения

#admin_access_token_required

Метод для удаления сообщения.

Удаление сообщения доступно отправителю, админам и редакторам в чате. В личных сообщениях оба пользователя являются редакторами. Ограничений по давности отправки сообщения нет.

Для удаления сообщения вам необходимо знать его `id` и указать его в `URL` запроса.
""")
  @delete
  
  deleteMessage(
    @doc("Идентификатор сообщения")
    @path id: int32
  ): {
    @statusCode _: 204;
    @body body: EmptyResponse;
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
  
  @doc("""
Закрепление сообщения

Метод для закрепления сообщения в чате.

Для закрепления сообщения вам необходимо знать `id` сообщения и указать его в `URL` запроса.
""")
  @route("/{id}/pin")
  @post
  
  pinMessage(
    @doc("Идентификатор сообщения")
    @path id: int32
  ): {
    @statusCode _: 201;
    @body body: EmptyResponse;
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
  
  @doc("""
Открепление сообщения

Метод для открепления сообщения из чата.

Для открепления сообщения вам необходимо знать `id` сообщения и указать его в `URL` запроса.
""")
  @route("/{id}/pin")
  @delete
  
  unpinMessage(
    @doc("Идентификатор сообщения")
    @path id: int32
  ): {
    @statusCode _: 204;
    @body body: EmptyResponse;
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
  @doc("""
Список сообщений чата

Метод для получения списка сообщений бесед, каналов, тредов и личных сообщений.

Для получения сообщений вам необходимо знать `chat_id` требуемой беседы, канала, треда или диалога, и указать его в `URL` запроса. Сообщения будут возвращены в порядке убывания даты отправки (то есть, сначала будут идти последние сообщения чата). Для получения более ранних сообщений чата доступны параметры `limit` и `cursor`.
""")
  @get
  @opExample(#{
    parameters: #{
      chat_id: 198,
      limit: 10
    },
    returnType: #{
      _: 200,
      body: #{
        data: #[
          #{
            id: 1194277,
            entity_type: MessageEntityType.discussion,
            entity_id: 198,
            chat_id: 198,
            content: "Это сообщение тоже попадёт в экспорт",
            user_id: 12,
            created_at: utcDateTime.fromISO("2023-09-18T13:43:32.000Z"),
            url: "https://app.pachca.com/chats/198?message=1194277",
            files: #[],
            buttons: #[],
            thread: #{
              id: 2633,
              chat_id: 44997,
              message_id: 1194277,
              message_chat_id: 198,
              updated_at: utcDateTime.fromISO("2023-09-18T13:43:32.000Z")
            },
            forwarding: null,
            parent_message_id: null,
            display_avatar_url: null,
            display_name: null
          },
          #{
            id: 1194276,
            entity_type: MessageEntityType.discussion,
            entity_id: 198,
            chat_id: 198,
            content: "**Andrew** добавил **Export bot** в беседу",
            user_id: 12,
            created_at: utcDateTime.fromISO("2023-09-18T13:43:27.000Z"),
            url: "https://app.pachca.com/chats/198?message=1194276",
            files: #[],
            buttons: #[],
            thread: null,
            forwarding: null,
            parent_message_id: null,
            display_avatar_url: null,
            display_name: null
          },
          #{
            id: 1194275,
            entity_type: MessageEntityType.discussion,
            entity_id: 198,
            chat_id: 198,
            content: "**Andrew** создал беседу",
            user_id: 12,
            created_at: utcDateTime.fromISO("2023-09-18T13:43:19.000Z"),
            url: "https://app.pachca.com/chats/198?message=1194275",
            files: #[],
            buttons: #[],
            thread: null,
            forwarding: null,
            parent_message_id: null,
            display_avatar_url: null,
            display_name: null
          }
        ],
        meta: #{
          paginate: #{
            next_page: "eyJpZCI6MTE5NDI3NSwiZGlyIjoiZGVzYyJ9"
          }
        }
      }
    }
  })
  listChatMessages(
    @doc("Идентификатор чата (беседа, канал, диалог или чат треда)")
    @query chat_id: int32,
    @doc("Составной параметр сортировки сущностей выборки. На данный момент сортировка доступна только по полю `id` (идентификатор сообщения).")
    @query("sort[{field}]") sortField?: SortOrder = SortOrder.desc,
    @doc("Количество возвращаемых сущностей за один запрос")
    @query
    @minValue(1)
    @maxValue(50)
    limit?: int32 = 50,
    @doc("Курсор для пагинации (из `meta.paginate.next_page`)")
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
  @doc("""
Список прочитавших сообщение

Метод для получения актуального списка пользователей, прочитавших сообщение.
""")
  @route("/messages/{id}/read_member_ids")
  @get
  @opExample(#{
    parameters: #{
      id: 194275
    },
    returnType: #{
      _: 200,
      body: #{
        meta: #{
          paginate: #{
            next_page: "eyJpZCI6MTYsImRpciI6ImFzYyJ9"
          }
        },
        data: #[12, 13, 14, 15, 16]
      }
    }
  })
  listReadMembers(
    @doc("Идентификатор сообщения")
    @path id: int32,
    @doc("Количество возвращаемых сущностей за один запрос")
    @query
    @minValue(1)
    @maxValue(300)
    limit?: int32 = 300,
    @doc("Курсор для пагинации (из `meta.paginate.next_page`)")
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
  @opExample(#{
    parameters: #{
      id: 7231942,
      request: #{
        code: "👍",
        name: ":+1:"
      }
    },
    returnType: #{
      _: 201,
      body: #{
        user_id: 355929,
        created_at: utcDateTime.fromISO("2026-01-24T12:18:34.000Z"),
        code: "👍",
        name: ":+1::skin-tone-1:"
      }
    }
  })

  addReaction(
    @doc("Идентификатор сообщения")
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
  
  @doc("""
Удаление реакции

Метод для удаления реакции на сообщение.

Для удаления реакции вам необходимо знать `id` сообщения и указать его в `URL` запроса. Реакции на сообщения хранятся в виде символов `Emoji`.

Удалять можно только те реакции, которые были поставлены авторизованным пользователем.
""")
  @delete
  @opExample(#{
    parameters: #{
      id: 7231942,
      code: "👍",
      name: ":+1:"
    }
  })

  removeReaction(
    @doc("Идентификатор сообщения")
    @path id: int32,

    @doc("Emoji символ реакции")
    @query code: string,

    @doc("Текстовое имя эмодзи (используется для кастомных эмодзи)")
    @query name?: string
  ): {
    @statusCode _: 204;
    @body body: EmptyResponse;
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
  
  @doc("""
Список реакций

Метод для получения актуального списка реакций на сообщение.
""")
  @get
  @opExample(#{
    parameters: #{
      id: 194275,
      limit: 50
    },
    returnType: #{
      _: 200,
      body: #{
        data: #[
          #{
            user_id: 76243,
            created_at: utcDateTime.fromISO("2023-09-11T14:59:35.000Z"),
            code: "👍",
            name: ":+1:"
          },
          #{
            user_id: 10764,
            created_at: utcDateTime.fromISO("2023-09-11T15:00:31.000Z"),
            code: "👍",
            name: ":+1:"
          },
          #{
            user_id: 27494,
            created_at: utcDateTime.fromISO("2023-09-11T15:01:27.000Z"),
            code: "👍",
            name: ":+1:"
          },
          #{
            user_id: 27494,
            created_at: utcDateTime.fromISO("2023-09-11T15:01:47.000Z"),
            code: "🔥",
            name: ":fire:"
          },
          #{
            user_id: 11887,
            created_at: utcDateTime.fromISO("2023-09-11T15:12:49.000Z"),
            code: "👍",
            name: ":+1:"
          },
          #{
            user_id: 11887,
            created_at: utcDateTime.fromISO("2023-09-11T15:13:46.000Z"),
            code: "⭐",
            name: ":star:"
          },
          #{
            user_id: 11887,
            created_at: utcDateTime.fromISO("2023-09-11T15:13:47.000Z"),
            code: "🔥",
            name: ":fire:"
          }
        ],
        meta: #{
          paginate: #{
            next_page: "eyJpZCI6NzcsImRpciI6ImFzYyJ9"
          }
        }
      }
    }
  })
  listReactions(
    @doc("Идентификатор сообщения")
    @path id: int32,
    @doc("Количество возвращаемых сущностей за один запрос")
    @query
    @minValue(1)
    @maxValue(50)
    limit?: int32 = 50,
    @doc("Курсор для пагинации (из `meta.paginate.next_page`)")
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
  @doc("""
Unfurl (разворачивание ссылок)

#unfurling_bot_access_token_required

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
    @example(194275)
    @path id: int32,
    @body request: LinkPreviewsRequest
  ): {
    @statusCode _: 204;
    @body body: EmptyResponse;
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
// Task Operations
// ============================================================================

@route("/tasks")
@tag("Tasks")
interface TaskOperations {
  @doc("""
Новое напоминание

Метод для создания нового напоминания.

При создании напоминания обязательным условием является указания типа напоминания: звонок, встреча, простое напоминание, событие или письмо. При этом не требуется дополнительное описание - вы просто создадите напоминание с соответствующим текстом. Если вы укажите описание напоминания - то именно оно и станет текстом напоминания.

У напоминания должны быть ответственные, если их не указывать - ответственным назначается вы.

Ответственным для напоминания без привязки к каким-либо сущностям может стать любой сотрудник компании. Актуальный состав сотрудников компании вы можете получить в методе [список сотрудников](GET /users).

На текущий момент данный метод поддерживает только создание напоминаний без привязки к каким-либо сущностям.
""")
  @post
  @opExample(#{
    parameters: #{
      request: #{
        task: #{
          kind: TaskKind.reminder,
          content: "Забрать со склада 21 заказ",
          due_at: utcDateTime.fromISO("2020-06-05T12:00:00.000+03:00"),
          priority: 2,
          custom_properties: #[#{
            id: 78,
            value: "Синий склад"
          }]
        }
      }
    },
    returnType: #{
      _: 201,
      body: #{
        data: #{
          id: 22283,
          kind: TaskKind.reminder,
          content: "Забрать со склада 21 заказ",
          due_at: utcDateTime.fromISO("2020-06-05T09:00:00.000Z"),
          priority: 2,
          user_id: 12,
          status: "undone",
          created_at: utcDateTime.fromISO("2020-06-04T10:37:57.000Z"),
          performer_ids: #[12],
          all_day: false,
          custom_properties: #[#{
            id: 78,
            name: "Место",
            data_type: CustomPropertyDataType.string,
            value: "Синий склад"
          }]
        }
      }
    }
  })
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
    @statusCode _: 400;
    @body body: ApiError;
  } | {
    @statusCode _: 422;
    @body body: ApiError;
  };

  @doc("""
Список напоминаний

Метод для получения списка напоминаний.
""")
  @get
  @opExample(#{
    parameters: #{
      limit: 2
    },
    returnType: #{
      _: 200,
      body: #{
        data: #[
        #{
          id: 22283,
          kind: TaskKind.reminder,
          content: "Забрать со склада 21 заказ",
          due_at: utcDateTime.fromISO("2020-06-05T09:00:00.000Z"),
          priority: 2,
          user_id: 12,
          status: "undone",
          created_at: utcDateTime.fromISO("2020-06-04T10:37:57.000Z"),
          performer_ids: #[12],
          all_day: false,
          custom_properties: #[#{
            id: 78,
            name: "Место",
            data_type: CustomPropertyDataType.string,
            value: "Синий склад"
          }]
        },
        #{
          id: 22284,
          kind: TaskKind.call,
          content: "Позвонить клиенту",
          due_at: utcDateTime.fromISO("2020-06-06T14:00:00.000Z"),
          priority: 3,
          user_id: 12,
          status: "done",
          created_at: utcDateTime.fromISO("2020-06-04T11:20:00.000Z"),
          performer_ids: #[12, 13],
          all_day: false,
          custom_properties: #[]
        }
      ],
      meta: #{
        paginate: #{
          next_page: "eyJpZCI6MjIyODQsImRpciI6ImFzYyJ9"
        }
      }
      }
    }
  })
  listTasks(
    @doc("Количество возвращаемых сущностей за один запрос")
    @query
    @minValue(1)
    @maxValue(50)
    limit?: int32 = 50,
    @doc("Курсор для пагинации (из `meta.paginate.next_page`)")
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

  @doc("""
Информация о напоминании

Метод для получения информации о напоминании.

Для получения напоминания вам необходимо знать его `id` и указать его в `URL` запроса.
""")
  @route("/{id}")
  @get
  @opExample(#{
    parameters: #{
      id: 22283
    },
    returnType: #{
      _: 200,
      body: #{
        data: #{
          id: 22283,
          kind: TaskKind.reminder,
          content: "Забрать со склада 21 заказ",
          due_at: utcDateTime.fromISO("2020-06-05T09:00:00.000Z"),
          priority: 2,
          user_id: 12,
          status: "undone",
          created_at: utcDateTime.fromISO("2020-06-04T10:37:57.000Z"),
          performer_ids: #[12],
          all_day: false,
          custom_properties: #[#{
            id: 78,
            name: "Место",
            data_type: CustomPropertyDataType.string,
            value: "Синий склад"
          }]
        }
      }
    }
  })
  getTask(
    @doc("Идентификатор напоминания")
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

  @doc("""
Редактирование напоминания

Метод для редактирования напоминания.

Для редактирования напоминания вам необходимо знать его `id` и указать его в `URL` запроса. Все редактируемые параметры напоминания указываются в теле запроса.
""")
  @put
  @opExample(#{
    parameters: #{
      id: 22283,
      request: #{
        task: #{
          status: "done"
        }
      }
    },
    returnType: #{
      _: 200,
      body: #{
        data: #{
          id: 22283,
          kind: TaskKind.reminder,
          content: "Забрать со склада 21 заказ",
          due_at: utcDateTime.fromISO("2020-06-05T09:00:00.000Z"),
          priority: 2,
          user_id: 12,
          status: "done",
          created_at: utcDateTime.fromISO("2020-06-04T10:37:57.000Z"),
          performer_ids: #[12],
          all_day: false,
          custom_properties: #[#{
            id: 78,
            name: "Место",
            data_type: CustomPropertyDataType.string,
            value: "Синий склад"
          }]
        }
      }
    }
  })
  updateTask(
    @doc("Идентификатор напоминания")
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

  @doc("""
Удаление напоминания

Метод для удаления напоминания.

Для удаления напоминания вам необходимо знать его `id` и указать его в `URL` запроса.
""")
  @delete

  deleteTask(
    @doc("Идентификатор напоминания")
    @path id: int32
  ): {
    @statusCode _: 204;
    @body body: EmptyResponse;
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
  @doc("""
Открытие представления

Метод для открытия модального окна с представлением для пользователя.

Чтобы открыть модальное окно с представлением, ваше приложение должно иметь действительный, неистекший `trigger_id`.
""")
  @route("/open")
  @post
  @opExample(#{
    parameters: #{
      request: #{
        trigger_id: "791a056b-006c-49dd-834b-c633fde52fe8",
        type: "modal",
        private_metadata: "{'timeoff_id':4378}",
        callback_id: "timeoff_reguest_form",
        view: #{
          title: "Уведомление об отпуске",
          close_text: "Закрыть",
          submit_text: "Отправить заявку",
          blocks: #[
            #{
              type: "plain_text",
              text: "Заполните форму. После отправки формы в общий чат будет отправлено текстовое уведомление, а ваш отпуск будет сохранен в базе."
            },
            #{
              type: "markdown",
              text: "Информацию о доступных вам днях отпуска вы можете прочитать по [ссылке](https://www.website.com/timeoff)"
            },
            #{
              type: "header",
              text: "Основная информация"
            },
            #{
              type: "date",
              name: "date_start",
              label: "Дата начала отпуска",
              initial_date: "2025-07-01",
              required: true
            },
            #{
              type: "date",
              name: "date_end",
              label: "Дата окончания отпуска",
              initial_date: "2025-07-28",
              required: true
            },
            #{
              type: "file_input",
              name: "request_doc",
              label: "Заявление",
              filetypes: #["pdf","jpg","png"],
              max_files: 1,
              required: true,
              hint: "Загрузите заполненное заявление с электронной подписью (в формате pdf, jpg или png)"
            },
            #{
              type: "radio",
              name: "accessibility",
              label: "Доступность",
              options: #[
                #{
                  text: "Ничего",
                  value: "nothing",
                  checked: true
                },
                #{
                  text: "Только телефон",
                  value: "phone_only"
                },
                #{
                  text: "Телефон и ноутбук",
                  value: "phone_notebook"
                }
              ],
              required: true,
              hint: "Если вы не планируете выходить на связь, то выберите вариант Ничего"
            },
            #{
              type: "divider"
            },
            #{
              type: "header",
              text: "Дополнительно"
            },
            #{
              type: "input",
              name: "info",
              label: "Описание отпуска",
              placeholder: "Куда собираетесь и что будете делать",
              multiline: true,
              hint: "Возможно вам подскаджут, какие места лучше посетить"
            },
            #{
              type: "checkbox",
              name: "newsletters",
              label: "Рассылки",
              options: #[
                #{
                  text: "Получать уведомления о новых задачах в команде",
                  value: "new_tasks",
                  description: "Каждый день бот будет присылать список новых задач в вашей команде"
                },
                #{
                  text: "Получать уведомления об обновлениях в проектах",
                  value: "project_updates",
                  description: "Два раза в неделю бот будет присылать обновления по проектам"
                }
              ]
            },
            #{
              type: "select",
              name: "team",
              label: "Выберите команду",
              options: #[
                #{
                  text: "Все команды",
                  value: "all"
                },
                #{
                  text: "Web",
                  value: "web",
                  selected: true
                },
                #{
                  text: "iOS",
                  value: "ios"
                },
                #{
                  text: "Android",
                  value: "android"
                },
                #{
                  text: "Back",
                  value: "back"
                },
                #{
                  text: "Design",
                  value: "design"
                },
                #{
                  text: "Success",
                  value: "success"
                }
              ]
            },
            #{
              type: "time",
              name: "newsletter_time",
              label: "Время рассылки",
              initial_time: "11:00",
              hint: "Укажите, в какое время присылать выбранные рассылки"
            }
          ]
        }
      }
    }
  })
  
  openView(@body request: OpenViewRequest): {
    @statusCode _: 201;
    @body body: EmptyResponse;
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
  @doc("""
Редактирование бота

Метод для редактирования бота.

Для редактирования бота вам необходимо знать его `user_id` и указать его в `URL` запроса. Все редактируемые параметры бота указываются в теле запроса. Узнать `user_id` бота можно в настройках бота во вкладке «API».

Вы не можете редактировать бота, настройки которого вам недоступны (поле «Кто может редактировать настройки бота» находится во вкладке «Основное» в настройках бота).
""")
  @route("/bots/{id}")
  @put
  @opExample(#{
    parameters: #{
      id: 1738816,
      request: #{
        bot: #{
          webhook: #{
            outgoing_url: "https://www.website.com/tasks/new"
          }
        }
      }
    },
    returnType: #{
      _: 200,
      body: #{
        data: #{
          id: 1738816,
          webhook: #{
            outgoing_url: "https://www.website.com/tasks/new"
          }
        }
      }
    }
  })
  updateBot(
    @doc("Идентификатор бота")
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
  
  @doc("""
История событий

#bot_access_token_required

Метод для получения истории последних событий бота. Данный метод будет полезен, если вы не можете получать события в реальном времени на ваш `URL`, но вам требуется обрабатывать все события, на которые вы подписались.

История событий сохраняется только при активном пункте «Сохранять историю событий» во вкладке «Исходящий webhook» настроек бота. При этом указывать «Webhook `URL`» не требуется.

Для получения истории событий конкретного бота вам необходимо знать его `access_token` и использовать его при запросе. Каждое событие представляет `JSON` объект вебхука.
""")
  @route("/webhooks/events")
  @get
  @opExample(#{
    parameters: #{
      limit: 10
    },
    returnType: #{
      _: 200,
      body: #{
        meta: #{
          paginate: #{
            next_page: "eyMxFCO2MiwiZGlyIjpiSNYjIn1"
          }
        },
        data: #[
        #{
          id: "01KAJZ2XDSS2S3DSW9EXJZ0TBV",
          event_type: "company_member_update",
          payload: #{
            event: UserEventType.update,
            type: "company_member",
            webhook_timestamp: 1763635376,
            user_ids: #[13],
            created_at: utcDateTime.fromISO("2025-11-20T10:42:56Z")
          },
          created_at: utcDateTime.fromISO("2025-11-20T10:42:56Z")
        },
        #{
          id: "01KAJZ5CMZFVK4FSZQOISFBZCS",
          event_type: "message_new",
          payload: #{
            event: WebhookEventType.new,
            type: "message",
            webhook_timestamp: 1763637142,
            chat_id: 43,
            user_id: 13,
            id: 4432345,
            created_at: utcDateTime.fromISO("2025-11-20T11:12:22.000Z"),
            parent_message_id: null,
            content: "Проверьте последнюю задачу",
            entity_type: MessageEntityType.discussion,
            entity_id: 43,
            thread: null,
            url: "https://app.pachca.com/chats/43?message=4432345"
          },
          created_at: utcDateTime.fromISO("2025-11-20T11:12:22.000Z")
        },
        #{
          id: "01KAJP5CMZFPA5FSZQOCHKBOIW",
          event_type: "chat_member_add",
          payload: #{
            event: MemberEventType.add,
            type: "chat_member",
            webhook_timestamp: 1763637574,
            chat_id: 43,
            thread_id: null,
            user_ids: #[14],
            created_at: utcDateTime.fromISO("2025-11-20T11:19:34Z")
          },
          created_at: utcDateTime.fromISO("2025-11-20T11:19:34Z")
        }
      ]
      }
    }
  })
  getWebhookEvents(
    @doc("Количество возвращаемых сущностей за один запрос")
    @query 
    @minValue(1)
    @maxValue(50)
    limit?: int32 = 50,
    
    @doc("Курсор для пагинации (из meta.paginate.next_page)")
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
    @path id: string
  ): {
    @statusCode _: 204;
    @body body: EmptyResponse;
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

@route("/audit-events")
@tag("Security")
interface SecurityOperations {
  @doc("""
Журнал аудита событий

#corporation_price_only

Метод для получения логов событий на основе указанных фильтров.
""")
  @get
  @opExample(#{
    parameters: #{
      start_time: utcDateTime.fromISO("2025-05-01T09:11:00.000Z"),
      end_time: utcDateTime.fromISO("2025-05-02T09:11:00.000Z")
    },
    returnType: #{
      _: 200,
      body: #{
        meta: #{
          paginate: #{
            next_page: "eyJfa2QiOiJuIiwiY3JlYXRlZF9hdCI6IjIwMjUtMDUtMTUgMTQ6MzA6MDAuMDAwWiJ9"
          }
        },
        data: #[
        #{
          id: "a1b2c3d4-5e6f-7g8h-9i10-j11k12l13m14",
          created_at: utcDateTime.fromISO("2025-05-15T14:30:00.000Z"),
          event_key: "user_chat_join",
          entity_id: "12345678",
          entity_type: "Chat",
          actor_id: "98765",
          actor_type: "User",
          details: #{
            inviter_id: "45678"
          },
          ip_address: "192.168.1.100",
          user_agent: "Pachca/3.60.0 (co.staply.pachca; build:15; iOS 18.5.0) Alamofire/5.0.0"
        }
      ]
      }
    }
  })
  getAuditEvents(
    @doc("Начальная метка времени (включительно)")
    @example(utcDateTime.fromISO("2025-05-01T09:11:00Z"))
    @query start_time: utcDateTime,
    
    @doc("Конечная метка времени (исключительно)")
    @example(utcDateTime.fromISO("2025-05-02T09:11:00Z"))
    @query end_time: utcDateTime,
    
    @doc("Фильтр по конкретному типу события")
    @example("user_login")
    @query event_key?: string,
    
    @doc("Идентификатор пользователя, выполнившего действие")
    @query actor_id?: int32,
    
    @doc("Тип актора")
    @example("User")
    @query actor_type?: string,
    
    @doc("Идентификатор затронутой сущности")
    @query entity_id?: int32,
    
    @doc("Тип сущности")
    @example("Chat")
    @query entity_type?: string,
    
    @doc("Количество записей для возврата")
    @query 
    @maxValue(50)
    limit?: int32 = 50,
    
    @doc("Курсор для пагинации из meta.paginate.next_page")
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
