/** Тип аудит-события */
export enum AuditEventKey {
  /** Пользователь успешно вошел в систему */
  UserLogin = "user_login",
  /** Пользователь вышел из системы */
  UserLogout = "user_logout",
  /** Неудачная попытка двухфакторной аутентификации */
  User2faFail = "user_2fa_fail",
  /** Успешная двухфакторная аутентификация */
  User2faSuccess = "user_2fa_success",
  /** Создана новая учетная запись пользователя */
  UserCreated = "user_created",
  /** Учетная запись пользователя удалена */
  UserDeleted = "user_deleted",
  /** Роль пользователя была изменена */
  UserRoleChanged = "user_role_changed",
  /** Данные пользователя обновлены */
  UserUpdated = "user_updated",
  /** Создан новый тег */
  TagCreated = "tag_created",
  /** Тег удален */
  TagDeleted = "tag_deleted",
  /** Пользователь добавлен в тег */
  UserAddedToTag = "user_added_to_tag",
  /** Пользователь удален из тега */
  UserRemovedFromTag = "user_removed_from_tag",
  /** Создан новый чат */
  ChatCreated = "chat_created",
  /** Чат переименован */
  ChatRenamed = "chat_renamed",
  /** Изменены права доступа к чату */
  ChatPermissionChanged = "chat_permission_changed",
  /** Пользователь присоединился к чату */
  UserChatJoin = "user_chat_join",
  /** Пользователь покинул чат */
  UserChatLeave = "user_chat_leave",
  /** Тег добавлен в чат */
  TagAddedToChat = "tag_added_to_chat",
  /** Тег удален из чата */
  TagRemovedFromChat = "tag_removed_from_chat",
  /** Сообщение отредактировано */
  MessageUpdated = "message_updated",
  /** Сообщение удалено */
  MessageDeleted = "message_deleted",
  /** Сообщение создано */
  MessageCreated = "message_created",
  /** Реакция добавлена */
  ReactionCreated = "reaction_created",
  /** Реакция удалена */
  ReactionDeleted = "reaction_deleted",
  /** Тред создан */
  ThreadCreated = "thread_created",
  /** Создан новый токен доступа */
  AccessTokenCreated = "access_token_created",
  /** Токен доступа обновлен */
  AccessTokenUpdated = "access_token_updated",
  /** Токен доступа удален */
  AccessTokenDestroy = "access_token_destroy",
  /** Данные зашифрованы */
  KmsEncrypt = "kms_encrypt",
  /** Данные расшифрованы */
  KmsDecrypt = "kms_decrypt",
  /** Доступ к журналам аудита получен */
  AuditEventsAccessed = "audit_events_accessed",
  /** Срабатывание правила DLP-системы */
  DlpViolationDetected = "dlp_violation_detected",
  /** Поиск сотрудников через API */
  SearchUsersApi = "search_users_api",
  /** Поиск чатов через API */
  SearchChatsApi = "search_chats_api",
  /** Поиск сообщений через API */
  SearchMessagesApi = "search_messages_api",
}

/** Доступность чатов для пользователя */
export enum ChatAvailability {
  /** Чаты, где пользователь является участником */
  IsMember = "is_member",
  /** Все открытые чаты компании, вне зависимости от участия в них пользователя */
  Public = "public",
}

/** Роль участника чата */
export enum ChatMemberRole {
  /** Админ */
  Admin = "admin",
  /** Редактор (доступно только для каналов) */
  Editor = "editor",
  /** Участник или подписчик */
  Member = "member",
}

/** Роль участника чата (с фильтром все) */
export enum ChatMemberRoleFilter {
  /** Любая роль */
  All = "all",
  /** Создатель */
  Owner = "owner",
  /** Админ */
  Admin = "admin",
  /** Редактор */
  Editor = "editor",
  /** Участник/подписчик */
  Member = "member",
}

/** Тип чата */
export enum ChatSubtype {
  /** Канал или беседа */
  Discussion = "discussion",
  /** Тред */
  Thread = "thread",
}

/** Тип данных дополнительного поля */
export enum CustomPropertyDataType {
  /** Строковое значение */
  String = "string",
  /** Числовое значение */
  Number = "number",
  /** Дата */
  Date = "date",
  /** Ссылка */
  Link = "link",
}

/** Тип файла */
export enum FileType {
  /** Обычный файл */
  File = "file",
  /** Изображение */
  Image = "image",
}

/** Статус приглашения пользователя */
export enum InviteStatus {
  /** Принято */
  Confirmed = "confirmed",
  /** Отправлено */
  Sent = "sent",
}

/** Тип события webhook для участников */
export enum MemberEventType {
  /** Добавление */
  Add = "add",
  /** Удаление */
  Remove = "remove",
}

/** Тип сущности для сообщений */
export enum MessageEntityType {
  /** Беседа или канал */
  Discussion = "discussion",
  /** Тред */
  Thread = "thread",
  /** Пользователь */
  User = "user",
}

/** Скоуп доступа OAuth токена */
export enum OAuthScope {
  /** Просмотр чатов и списка чатов */
  ChatsRead = "chats:read",
  /** Создание новых чатов */
  ChatsCreate = "chats:create",
  /** Изменение настроек чата */
  ChatsUpdate = "chats:update",
  /** Архивация и разархивация чатов */
  ChatsArchive = "chats:archive",
  /** Выход из чатов */
  ChatsLeave = "chats:leave",
  /** Просмотр участников чата */
  ChatMembersRead = "chat_members:read",
  /** Добавление, изменение и удаление участников чата */
  ChatMembersWrite = "chat_members:write",
  /** Скачивание экспортов чата */
  ChatExportsRead = "chat_exports:read",
  /** Создание экспортов чата */
  ChatExportsWrite = "chat_exports:write",
  /** Просмотр сообщений в чатах */
  MessagesRead = "messages:read",
  /** Отправка сообщений */
  MessagesCreate = "messages:create",
  /** Редактирование сообщений */
  MessagesUpdate = "messages:update",
  /** Удаление сообщений */
  MessagesDelete = "messages:delete",
  /** Просмотр реакций на сообщения */
  ReactionsRead = "reactions:read",
  /** Добавление и удаление реакций */
  ReactionsWrite = "reactions:write",
  /** Закрепление и открепление сообщений */
  PinsWrite = "pins:write",
  /** Просмотр тредов (комментариев) */
  ThreadsRead = "threads:read",
  /** Создание тредов (комментариев) */
  ThreadsCreate = "threads:create",
  /** Unfurl (разворачивание ссылок) */
  LinkPreviewsWrite = "link_previews:write",
  /** Просмотр информации о сотрудниках и списка сотрудников */
  UsersRead = "users:read",
  /** Создание новых сотрудников */
  UsersCreate = "users:create",
  /** Редактирование данных сотрудника */
  UsersUpdate = "users:update",
  /** Удаление сотрудников */
  UsersDelete = "users:delete",
  /** Просмотр тегов */
  GroupTagsRead = "group_tags:read",
  /** Создание, редактирование и удаление тегов */
  GroupTagsWrite = "group_tags:write",
  /** Изменение настроек бота */
  BotsWrite = "bots:write",
  /** Просмотр информации о своем профиле */
  ProfileRead = "profile:read",
  /** Просмотр статуса профиля */
  ProfileStatusRead = "profile_status:read",
  /** Изменение и удаление статуса профиля */
  ProfileStatusWrite = "profile_status:write",
  /** Просмотр статуса сотрудника */
  UserStatusRead = "user_status:read",
  /** Изменение и удаление статуса сотрудника */
  UserStatusWrite = "user_status:write",
  /** Просмотр дополнительных полей */
  CustomPropertiesRead = "custom_properties:read",
  /** Просмотр журнала аудита */
  AuditEventsRead = "audit_events:read",
  /** Просмотр задач */
  TasksRead = "tasks:read",
  /** Создание задач */
  TasksCreate = "tasks:create",
  /** Изменение задачи */
  TasksUpdate = "tasks:update",
  /** Удаление задачи */
  TasksDelete = "tasks:delete",
  /** Скачивание файлов */
  FilesRead = "files:read",
  /** Загрузка файлов */
  FilesWrite = "files:write",
  /** Получение данных для загрузки файлов */
  UploadsWrite = "uploads:write",
  /** Открытие форм (представлений) */
  ViewsWrite = "views:write",
  /** Просмотр вебхуков */
  WebhooksRead = "webhooks:read",
  /** Создание и управление вебхуками */
  WebhooksWrite = "webhooks:write",
  /** Просмотр лога вебхуков */
  WebhooksEventsRead = "webhooks:events:read",
  /** Удаление записи в логе вебхука */
  WebhooksEventsDelete = "webhooks:events:delete",
  /** Поиск сотрудников */
  SearchUsers = "search:users",
  /** Поиск чатов */
  SearchChats = "search:chats",
  /** Поиск сообщений */
  SearchMessages = "search:messages",
}

/** Тип события webhook для реакций */
export enum ReactionEventType {
  /** Создание */
  New = "new",
  /** Удаление */
  Delete = "delete",
}

/** Тип сущности для поиска */
export enum SearchEntityType {
  /** Пользователь */
  User = "User",
  /** Задача */
  Task = "Task",
}

/** Сортировка результатов поиска */
export enum SearchSortOrder {
  /** По релевантности */
  ByScore = "by_score",
  /** По алфавиту */
  Alphabetical = "alphabetical",
}

/** Порядок сортировки */
export enum SortOrder {
  /** По возрастанию */
  Asc = "asc",
  /** По убыванию */
  Desc = "desc",
}

/** Тип задачи */
export enum TaskKind {
  /** Позвонить контакту */
  Call = "call",
  /** Встреча */
  Meeting = "meeting",
  /** Простое напоминание */
  Reminder = "reminder",
  /** Событие */
  Event = "event",
  /** Написать письмо */
  Email = "email",
}

/** Статус напоминания */
export enum TaskStatus {
  /** Выполнено */
  Done = "done",
  /** Активно */
  Undone = "undone",
}

/** Тип события webhook для пользователей */
export enum UserEventType {
  /** Приглашение */
  Invite = "invite",
  /** Подтверждение */
  Confirm = "confirm",
  /** Обновление */
  Update = "update",
  /** Приостановка */
  Suspend = "suspend",
  /** Активация */
  Activate = "activate",
  /** Удаление */
  Delete = "delete",
}

/** Роль пользователя в системе */
export enum UserRole {
  /** Администратор */
  Admin = "admin",
  /** Сотрудник */
  User = "user",
  /** Мульти-гость */
  MultiGuest = "multi_guest",
  /** Гость */
  Guest = "guest",
}

/** Коды ошибок валидации */
export enum ValidationErrorCode {
  /** Обязательное поле (не может быть пустым) */
  Blank = "blank",
  /** Слишком длинное значение (пояснения вы получите в поле message) */
  TooLong = "too_long",
  /** Поле не соответствует правилам (пояснения вы получите в поле message) */
  Invalid = "invalid",
  /** Поле имеет непредусмотренное значение */
  Inclusion = "inclusion",
  /** Поле имеет недопустимое значение */
  Exclusion = "exclusion",
  /** Название для этого поля уже существует */
  Taken = "taken",
  /** Emoji статуса не может содержать значения отличные от Emoji символа */
  WrongEmoji = "wrong_emoji",
  /** Объект не найден */
  NotFound = "not_found",
  /** Объект уже существует (пояснения вы получите в поле message) */
  AlreadyExists = "already_exists",
  /** Ошибка личного чата (пояснения вы получите в поле message) */
  PersonalChat = "personal_chat",
  /** Отображаемая ошибка (пояснения вы получите в поле message) */
  DisplayedError = "displayed_error",
  /** Действие запрещено */
  NotAuthorized = "not_authorized",
  /** Выбран слишком большой диапазон дат */
  InvalidDateRange = "invalid_date_range",
  /** Некорректный URL вебхука */
  InvalidWebhookUrl = "invalid_webhook_url",
  /** Достигнут лимит запросов */
  RateLimit = "rate_limit",
  /** Превышен лимит активных сотрудников (пояснения вы получите в поле message) */
  LicensesLimit = "licenses_limit",
  /** Превышен лимит количества реакций, которые может добавить пользователь (20 уникальных реакций) */
  UserLimit = "user_limit",
  /** Превышен лимит количества уникальных реакций, которые можно добавить на сообщение (30 уникальных реакций) */
  UniqueLimit = "unique_limit",
  /** Превышен лимит количества реакций, которые можно добавить на сообщение (1000 реакций) */
  GeneralLimit = "general_limit",
  /** Ошибка выполнения запроса (пояснения вы получите в поле message) */
  Unhandled = "unhandled",
  /** Не удалось найти идентификатор события */
  TriggerNotFound = "trigger_not_found",
  /** Время жизни идентификатора события истекло */
  TriggerExpired = "trigger_expired",
  /** Обязательный параметр не передан */
  Required = "required",
  /** Недопустимое значение (не входит в список допустимых) */
  In = "in",
  /** Значение неприменимо в данном контексте (пояснения вы получите в поле message) */
  NotApplicable = "not_applicable",
  /** Нельзя изменить свои собственные данные */
  SelfUpdate = "self_update",
  /** Нельзя изменить данные владельца */
  OwnerProtected = "owner_protected",
  /** Значение уже назначено */
  AlreadyAssigned = "already_assigned",
  /** Недостаточно прав для выполнения действия (пояснения вы получите в поле message) */
  Forbidden = "forbidden",
  /** Доступ запрещён (недостаточно прав) */
  PermissionDenied = "permission_denied",
  /** Доступ запрещён */
  AccessDenied = "access_denied",
  /** Некорректные параметры запроса (пояснения вы получите в поле message) */
  WrongParams = "wrong_params",
  /** Требуется оплата */
  PaymentRequired = "payment_required",
  /** Значение слишком короткое (пояснения вы получите в поле message) */
  MinLength = "min_length",
  /** Значение слишком длинное (пояснения вы получите в поле message) */
  MaxLength = "max_length",
  /** Использовано зарезервированное системное слово (here, all) */
  UseOfSystemWords = "use_of_system_words",
}

/** Тип события webhook */
export enum WebhookEventType {
  /** Создание */
  New = "new",
  /** Обновление */
  Update = "update",
  /** Удаление */
  Delete = "delete",
}

export interface AccessTokenInfo {
  id: number;
  token: string;
  name: string | null;
  userId: number;
  scopes: OAuthScope[];
  createdAt: string;
  revokedAt: string | null;
  expiresIn: number | null;
  lastUsedAt: string | null;
}

export interface AddMembersRequest {
  memberIds: number[];
  silent?: boolean;
}

export interface AddTagsRequest {
  groupTagIds: number[];
}

export class ApiError extends Error {
  errors?: ApiErrorItem[];
  constructor(errors?: ApiErrorItem[]) {
    super(errors?.map((e) => `${e.key}: ${e.value}`).join(", "));
    this.errors = errors;
  }
}

export interface ApiErrorItem {
  key: string;
  value: string | null;
  message: string;
  code: ValidationErrorCode;
  payload: Record<string, string> | null;
}

export interface AuditDetailsChatId {
  chatId: number;
}

export interface AuditDetailsChatPermission {
  publicAccess: boolean;
}

export interface AuditDetailsChatRenamed {
  oldName: string;
  newName: string;
}

export interface AuditDetailsDlp {
  dlpRuleId: number;
  dlpRuleName: string;
  messageId: number;
  chatId: number;
  userId: number;
  actionMessage: string;
  conditionsMatched: boolean;
}

export interface AuditDetailsEmpty {
}

export interface AuditDetailsInitiator {
  initiatorId: number;
}

export interface AuditDetailsInviter {
  inviterId: number;
}

export interface AuditDetailsKms {
  chatId: number;
  messageId: number;
  reason: string;
}

export interface AuditDetailsRoleChanged {
  newCompanyRole: string;
  previousCompanyRole: string;
  initiatorId: number;
}

export interface AuditDetailsSearch {
  searchType: string;
  queryPresent: boolean;
  cursorPresent: boolean;
  limit: number;
  filters: Record<string, string>;
}

export interface AuditDetailsTagChat {
  chatId: number;
  tagName: string;
}

export interface AuditDetailsTagName {
  name: string;
}

export interface AuditDetailsTokenScopes {
  scopes: string[];
}

export interface AuditDetailsUserUpdated {
  changedAttrs: string[];
}

export interface AuditEvent {
  id: string;
  createdAt: string;
  eventKey: AuditEventKey;
  entityId: string;
  entityType: string;
  actorId: string;
  actorType: string;
  details: AuditEventDetailsUnion;
  ipAddress: string;
  userAgent: string;
}

export interface BotResponse {
  id: number;
  webhook: {
    outgoingUrl: string;
  };
}

export interface BotUpdateRequestBotWebhook {
  outgoingUrl: string;
}

export interface BotUpdateRequest {
  bot: {
    webhook: BotUpdateRequestBotWebhook;
  };
}

export interface Button {
  text: string;
  url?: string;
  data?: string;
}

export interface ButtonWebhookPayload {
  type: "button";
  event: "click";
  messageId: number;
  triggerId: string;
  data: string;
  userId: number;
  chatId: number;
  webhookTimestamp: number;
}

export interface Chat {
  id: number;
  name: string;
  createdAt: string;
  ownerId: number;
  memberIds: number[];
  groupTagIds: number[];
  channel: boolean;
  personal: boolean;
  public: boolean;
  lastMessageAt: string;
  meetRoomUrl: string;
}

export interface ChatCreateRequest {
  chat: {
    name: string;
    memberIds?: number[];
    groupTagIds?: number[];
    /** @default false */
    channel?: boolean;
    /** @default false */
    public?: boolean;
  };
}

export interface ChatMemberWebhookPayload {
  type: "chat_member";
  event: MemberEventType;
  chatId: number;
  threadId?: number | null;
  userIds: number[];
  createdAt: string;
  webhookTimestamp: number;
}

export interface ChatUpdateRequest {
  chat: {
    name?: string;
    public?: boolean;
  };
}

export interface CompanyMemberWebhookPayload {
  type: "company_member";
  event: UserEventType;
  userIds: number[];
  createdAt: string;
  webhookTimestamp: number;
}

export interface CustomProperty {
  id: number;
  name: string;
  dataType: CustomPropertyDataType;
  value: string;
}

export interface CustomPropertyDefinition {
  id: number;
  name: string;
  dataType: CustomPropertyDataType;
}

export interface ExportRequest {
  startAt: string;
  endAt: string;
  webhookUrl: string;
  chatIds?: number[];
  skipChatsFile?: boolean;
}

export interface File {
  id: number;
  key: string;
  name: string;
  fileType: FileType;
  url: string;
  width?: number | null;
  height?: number | null;
}

export interface FileUploadRequest {
  contentDisposition: string;
  acl: string;
  policy: string;
  xAmzCredential: string;
  xAmzAlgorithm: string;
  xAmzDate: string;
  xAmzSignature: string;
  key: string;
  file: Blob;
}

export interface Forwarding {
  originalMessageId: number;
  originalChatId: number;
  authorId: number;
  originalCreatedAt: string;
  originalThreadId: number | null;
  originalThreadMessageId: number | null;
  originalThreadParentChatId: number | null;
}

export interface GroupTag {
  id: number;
  name: string;
  usersCount: number;
}

export interface GroupTagRequest {
  groupTag: {
    name: string;
  };
}

export interface LinkPreview {
  title: string;
  description: string;
  imageUrl?: string;
  image?: {
    key: string;
    name: string;
    size?: number;
  };
}

export interface LinkPreviewsRequest {
  linkPreviews: Record<string, LinkPreview>;
}

export interface LinkSharedWebhookPayload {
  type: "message";
  event: "link_shared";
  chatId: number;
  messageId: number;
  links: WebhookLink[];
  userId: number;
  createdAt: string;
  webhookTimestamp: number;
}

export interface Message {
  id: number;
  entityType: MessageEntityType;
  entityId: number;
  chatId: number;
  rootChatId: number;
  content: string;
  userId: number;
  createdAt: string;
  url: string;
  files: File[];
  buttons: Button[][] | null;
  thread: {
    id: number;
    chatId: number;
  } | null;
  forwarding: Forwarding | null;
  parentMessageId: number | null;
  displayAvatarUrl: string | null;
  displayName: string | null;
  changedAt: string | null;
  deletedAt: string | null;
}

export interface MessageCreateRequestFile {
  key: string;
  name: string;
  fileType: FileType;
  size: number;
  width?: number;
  height?: number;
}

export interface MessageCreateRequest {
  message: {
    /** @default discussion */
    entityType?: MessageEntityType;
    entityId: number;
    content: string;
    files?: MessageCreateRequestFile[];
    buttons?: Button[][];
    parentMessageId?: number;
    displayAvatarUrl?: string;
    displayName?: string;
    /** @default false */
    skipInviteMentions?: boolean;
    /** @default false */
    linkPreview?: boolean;
  };
}

export interface MessageUpdateRequestFile {
  key: string;
  name: string;
  fileType?: string;
  size?: number;
  width?: number;
  height?: number;
}

export interface MessageUpdateRequest {
  message: {
    content?: string;
    files?: MessageUpdateRequestFile[];
    buttons?: Button[][];
    displayAvatarUrl?: string;
    displayName?: string;
  };
}

export interface MessageWebhookPayload {
  type: "message";
  id: number;
  event: WebhookEventType;
  entityType: MessageEntityType;
  entityId: number;
  content: string;
  userId: number;
  createdAt: string;
  url: string;
  chatId: number;
  parentMessageId?: number | null;
  thread?: WebhookMessageThread | null;
  webhookTimestamp: number;
}

export class OAuthError extends Error {
  error?: string;
  constructor(error?: string) {
    super(error);
    this.error = error;
  }
}

export interface OpenViewRequest {
  type: "modal";
  triggerId: string;
  privateMetadata?: string;
  callbackId?: string;
  view: {
    title: string;
    /** @default Отменить */
    closeText?: string;
    /** @default Отправить */
    submitText?: string;
    blocks: ViewBlockUnion[];
  };
}

export interface PaginationMeta {
  paginate?: {
    nextPage?: string;
  };
}

export interface Reaction {
  userId: number;
  createdAt: string;
  code: string;
  name?: string;
}

export interface ReactionRequest {
  code: string;
  name?: string;
}

export interface ReactionWebhookPayload {
  type: "reaction";
  event: ReactionEventType;
  messageId: number;
  code: string;
  name: string;
  userId: number;
  createdAt: string;
  webhookTimestamp: number;
}

export interface SearchPaginationMeta {
  total: number;
  paginate: {
    nextPage: string;
  };
}

export interface StatusUpdateRequest {
  status: {
    emoji: string;
    title: string;
    expiresAt?: string;
    isAway?: boolean;
    awayMessage?: string;
  };
}

export interface TagNamesFilter {
}

export interface Task {
  id: number;
  kind: TaskKind;
  content: string;
  dueAt: string | null;
  priority: number;
  userId: number;
  chatId: number | null;
  status: TaskStatus;
  createdAt: string;
  performerIds: number[];
  allDay: boolean;
  customProperties: CustomProperty[];
}

export interface TaskCreateRequestCustomProperty {
  id: number;
  value: string;
}

export interface TaskCreateRequest {
  task: {
    kind: TaskKind;
    content?: string;
    dueAt?: string;
    /** @default 1 */
    priority?: number;
    performerIds?: number[];
    chatId?: number;
    allDay?: boolean;
    customProperties?: TaskCreateRequestCustomProperty[];
  };
}

export interface TaskUpdateRequestCustomProperty {
  id: number;
  value: string;
}

export interface TaskUpdateRequest {
  task: {
    kind?: TaskKind;
    content?: string;
    dueAt?: string;
    priority?: number;
    performerIds?: number[];
    status?: TaskStatus;
    allDay?: boolean;
    doneAt?: string;
    customProperties?: TaskUpdateRequestCustomProperty[];
  };
}

export interface Thread {
  id: number;
  chatId: number;
  messageId: number;
  messageChatId: number;
  updatedAt: string;
}

export interface UpdateMemberRoleRequest {
  role: ChatMemberRole;
}

export interface UploadParams {
  contentDisposition: string;
  acl: string;
  policy: string;
  xAmzCredential: string;
  xAmzAlgorithm: string;
  xAmzDate: string;
  xAmzSignature: string;
  key: string;
  directUrl: string;
}

export interface User {
  id: number;
  firstName: string;
  lastName: string;
  nickname: string;
  email: string;
  phoneNumber: string;
  department: string;
  title: string;
  role: UserRole;
  suspended: boolean;
  inviteStatus: InviteStatus;
  listTags: string[];
  customProperties: CustomProperty[];
  userStatus: UserStatus | null;
  bot: boolean;
  sso: boolean;
  createdAt: string;
  lastActivityAt: string;
  timeZone: string;
  imageUrl: string | null;
}

export interface UserCreateRequestCustomProperty {
  id: number;
  value: string;
}

export interface UserCreateRequest {
  user: {
    firstName?: string;
    lastName?: string;
    email: string;
    phoneNumber?: string;
    nickname?: string;
    department?: string;
    title?: string;
    role?: UserRole;
    suspended?: boolean;
    listTags?: string[];
    customProperties?: UserCreateRequestCustomProperty[];
  };
  skipEmailNotify?: boolean;
}

export interface UserStatus {
  emoji: string;
  title: string;
  expiresAt: string | null;
  isAway: boolean;
  awayMessage: {
    text: string;
  } | null;
}

export interface UserUpdateRequestCustomProperty {
  id: number;
  value: string;
}

export interface UserUpdateRequest {
  user: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phoneNumber?: string;
    nickname?: string;
    department?: string;
    title?: string;
    role?: UserRole;
    suspended?: boolean;
    listTags?: string[];
    customProperties?: UserUpdateRequestCustomProperty[];
  };
}

export interface ViewBlock {
  type: string;
  text?: string;
  name?: string;
  label?: string;
  initialDate?: string;
}

export interface ViewBlockCheckbox {
  type: "checkbox";
  name: string;
  label: string;
  options?: ViewBlockCheckboxOption[];
  required?: boolean;
  hint?: string;
}

export interface ViewBlockCheckboxOption {
  text: string;
  value: string;
  description?: string;
  checked?: boolean;
}

export interface ViewBlockDate {
  type: "date";
  name: string;
  label: string;
  initialDate?: string;
  required?: boolean;
  hint?: string;
}

export interface ViewBlockDivider {
  type: "divider";
}

export interface ViewBlockFileInput {
  type: "file_input";
  name: string;
  label: string;
  filetypes?: string[];
  /** @default 10 */
  maxFiles?: number;
  required?: boolean;
  hint?: string;
}

export interface ViewBlockHeader {
  type: "header";
  text: string;
}

export interface ViewBlockInput {
  type: "input";
  name: string;
  label: string;
  placeholder?: string;
  multiline?: boolean;
  initialValue?: string;
  minLength?: number;
  maxLength?: number;
  required?: boolean;
  hint?: string;
}

export interface ViewBlockMarkdown {
  type: "markdown";
  text: string;
}

export interface ViewBlockPlainText {
  type: "plain_text";
  text: string;
}

export interface ViewBlockRadio {
  type: "radio";
  name: string;
  label: string;
  options?: ViewBlockSelectableOption[];
  required?: boolean;
  hint?: string;
}

export interface ViewBlockSelect {
  type: "select";
  name: string;
  label: string;
  options?: ViewBlockSelectableOption[];
  required?: boolean;
  hint?: string;
}

export interface ViewBlockSelectableOption {
  text: string;
  value: string;
  description?: string;
  selected?: boolean;
}

export interface ViewBlockTime {
  type: "time";
  name: string;
  label: string;
  initialTime?: string;
  required?: boolean;
  hint?: string;
}

export interface WebhookEvent {
  id: string;
  eventType: string;
  payload: WebhookPayloadUnion;
  createdAt: string;
}

export interface WebhookLink {
  url: string;
  domain: string;
}

export interface WebhookMessageThread {
  messageId: number;
  messageChatId: number;
}

export type AuditEventDetailsUnion = AuditDetailsEmpty | AuditDetailsUserUpdated | AuditDetailsRoleChanged | AuditDetailsTagName | AuditDetailsInitiator | AuditDetailsInviter | AuditDetailsChatRenamed | AuditDetailsChatPermission | AuditDetailsTagChat | AuditDetailsChatId | AuditDetailsTokenScopes | AuditDetailsKms | AuditDetailsDlp | AuditDetailsSearch;

export type ViewBlockUnion = ViewBlockHeader | ViewBlockPlainText | ViewBlockMarkdown | ViewBlockDivider | ViewBlockInput | ViewBlockSelect | ViewBlockRadio | ViewBlockCheckbox | ViewBlockDate | ViewBlockTime | ViewBlockFileInput;

export type WebhookPayloadUnion = MessageWebhookPayload | ReactionWebhookPayload | ButtonWebhookPayload | ChatMemberWebhookPayload | CompanyMemberWebhookPayload | LinkSharedWebhookPayload;

export interface GetAuditEventsParams {
  startTime: string;
  endTime: string;
  eventKey?: AuditEventKey;
  actorId?: string;
  actorType?: string;
  entityId?: string;
  entityType?: string;
  limit?: number;
  cursor?: string;
}

export interface ListChatsParams {
  sortId?: SortOrder;
  availability?: ChatAvailability;
  lastMessageAtAfter?: string;
  lastMessageAtBefore?: string;
  personal?: boolean;
  limit?: number;
  cursor?: string;
}

export interface ListMembersParams {
  role?: ChatMemberRoleFilter;
  limit?: number;
  cursor?: string;
}

export interface ListPropertiesParams {
  entityType: SearchEntityType;
}

export interface ListTagsParams {
  names?: TagNamesFilter;
  limit?: number;
  cursor?: string;
}

export interface GetTagUsersParams {
  limit?: number;
  cursor?: string;
}

export interface ListChatMessagesParams {
  chatId: number;
  sortId?: SortOrder;
  limit?: number;
  cursor?: string;
}

export interface RemoveReactionParams {
  code: string;
  name?: string;
}

export interface ListReactionsParams {
  limit?: number;
  cursor?: string;
}

export interface ListReadMembersParams {
  limit?: number;
  cursor?: string;
}

export interface SearchChatsParams {
  query?: string;
  limit?: number;
  cursor?: string;
  order?: SortOrder;
  createdFrom?: string;
  createdTo?: string;
  active?: boolean;
  chatSubtype?: ChatSubtype;
  personal?: boolean;
}

export interface SearchMessagesParams {
  query?: string;
  limit?: number;
  cursor?: string;
  order?: SortOrder;
  createdFrom?: string;
  createdTo?: string;
  chatIds?: number[];
  userIds?: number[];
  active?: boolean;
}

export interface SearchUsersParams {
  query?: string;
  limit?: number;
  cursor?: string;
  sort?: SearchSortOrder;
  order?: SortOrder;
  createdFrom?: string;
  createdTo?: string;
  companyRoles?: UserRole[];
}

export interface ListTasksParams {
  limit?: number;
  cursor?: string;
}

export interface ListUsersParams {
  query?: string;
  limit?: number;
  cursor?: string;
}

export interface GetWebhookEventsParams {
  limit?: number;
  cursor?: string;
}

export interface GetAuditEventsResponse {
  data: AuditEvent[];
  meta?: PaginationMeta;
}

export interface ListChatsResponse {
  data: Chat[];
  meta?: PaginationMeta;
}

export interface ListMembersResponse {
  data: User[];
  meta?: PaginationMeta;
}

export interface ListPropertiesResponse {
  data: CustomPropertyDefinition[];
}

export interface ListTagsResponse {
  data: GroupTag[];
  meta?: PaginationMeta;
}

export interface GetTagUsersResponse {
  data: User[];
  meta?: PaginationMeta;
}

export interface ListChatMessagesResponse {
  data: Message[];
  meta?: PaginationMeta;
}

export interface ListReactionsResponse {
  data: Reaction[];
  meta?: PaginationMeta;
}

export interface SearchChatsResponse {
  data: Chat[];
  meta: SearchPaginationMeta;
}

export interface SearchMessagesResponse {
  data: Message[];
  meta: SearchPaginationMeta;
}

export interface SearchUsersResponse {
  data: User[];
  meta: SearchPaginationMeta;
}

export interface ListTasksResponse {
  data: Task[];
  meta?: PaginationMeta;
}

export interface ListUsersResponse {
  data: User[];
  meta?: PaginationMeta;
}

export interface GetWebhookEventsResponse {
  data: WebhookEvent[];
  meta?: PaginationMeta;
}
