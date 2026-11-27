// Сгенерировано из packages/spec/openapi.yaml (bun run generate в packages/app-sdk). Не править.
import type { PachcaDownload, PachcaFileInput, PachcaOp } from "../pachca.js";

/** Токен доступа */
export type AccessTokenInfo = {
  /** Идентификатор токена */
  id: number;
  /** Маскированный токен (видны первые 8 и последние 4 символа) */
  token: string;
  /** Имя токена. У входа из CLI это имя устройства, у токена внешнего приложения — имя приложения. `null`, если имени нет, например у токена, который сотрудник выдал боту на экране согласия. */
  name: string | null;
  /** Идентификатор владельца токена */
  userId: number;
  /** Список скоупов токена */
  scopes: Array<OAuthScope>;
  /** Дата создания токена */
  createdAt: string;
  /** Дата отзыва токена. Всегда `null`: по отозванному токену метод возвращает 401. */
  revokedAt: string | null;
  /** Время жизни токена в секундах. У входа из CLI и у токена внешнего приложения, которому сотрудник выдал доступ, здесь `3600`: токен живёт час и продлевается токеном обновления, CLI делает это сам. У остальных токенов `null`: они бессрочные. */
  expiresIn: number | null;
  /** Дата последнего использования токена. `null`, пока по токену не было ни одного запроса. Обновляется не чаще раза в минуту, поэтому может отставать. */
  lastUsedAt: string | null;
  /** Дата входа из CLI или выдачи доступа внешнему приложению. При продлении токена не меняется. У остальных токенов `null`. */
  authorizedAt: string | null;
};

/** Запрос на добавление участников в чат */
export type AddMembersRequest = {
  /** Массив идентификаторов пользователей, которые станут участниками */
  memberIds: Array<number>;
  /** При `true` в чат не приходит системное сообщение о добавлении, а добавленные сотрудники не получают письмо с приглашением. Сообщение бывает только в закрытой беседе, письмо — в беседах и каналах у тех, кто не отключил такие письма. В треде параметр ничего не меняет. */
  silent?: boolean;
};

/** Запрос на добавление тегов в чат */
export type AddTagsRequest = {
  /** Массив идентификаторов тегов, которые станут участниками */
  groupTagIds: Array<number>;
};

/** Ошибка API (используется для 400, 402, 403, 404, 409, 410, 422, 429, 503, 504) */
export type ApiError = {
  /** Массив ошибок */
  errors: Array<ApiErrorItem>;
};

/** Детальная информация об ошибке */
export type ApiErrorItem = {
  /** Ключ поля с ошибкой. `system`, если ошибка не относится к конкретному полю. */
  key: string;
  /** Значение, которое вызвало ошибку, как его передали или как оно хранится: обычно строка, число или массив, например `id` ботов у кода `bot_add_denied`, а бывает и логическое значение или объект. `null`, если ошибка не относится к конкретному значению. */
  value: (string | number | boolean | Array<unknown> | Record<string, unknown>) | null;
  /** Сообщение об ошибке */
  message: string;
  /** Код ошибки */
  code: ValidationErrorCode;
  /** Дополнительные данные об ошибке. Содержимое зависит от кода ошибки: `{id: number}` — при ошибке кастомного свойства (идентификатор свойства), `{record: {type: string, id: number}, query: string}` — при ошибке авторизации, `{draft_id: number}` — когда черновик в этом чате уже есть, `{limit: number, remaining: number, reset_at: string}` — при исчерпанном суточном лимите писем-приглашений (`reset_at` — когда в окне освободится место). В большинстве случаев `null`. */
  payload: Record<string, unknown> | null;
};

/** При: bot_deleted, а также bot_token_recreated, bot_token_created, bot_token_updated, bot_token_reissued в записях до 7 октября 2026 года */
export type AuditDetailsBot = {
  /** Идентификатор бота */
  botId: number;
  /** Идентификатор пользователя, выполнившего действие */
  actorId?: number;
  /** Идентификатор вебхука бота */
  webhookId?: number;
  /** Идентификатор приложения бота. Нет, если приложения у бота нет. */
  applicationId?: number;
  /** Идентификатор токена. Есть у bot_token_created, bot_token_reissued и bot_token_updated. */
  accessTokenId?: number;
  /** Токен в маскированном виде: первые и последние символы. Есть у событий токенов бота, если значение доступно. */
  accessTokenPreview?: string;
  /** Скоупы токена в записях до 7 октября 2026 года: массив у bot_token_created, объект с полями `previous` и `new` у bot_token_updated, если скоупы передали в запросе. */
  scopes?: (Array<string> | AuditDetailsTokenScopesChange);
  /** Смена названия токена у bot_token_updated. Есть, если название передали в запросе. */
  name?: AuditDetailsTokenNameChange;
};

/** При: bot_oauth_client_updated */
export type AuditDetailsBotOAuthClient = {
  /** Идентификатор бота */
  botId: number;
  /** Идентификатор пользователя, выполнившего действие */
  actorId?: number;
  /** Идентификатор OAuth-клиента бота */
  clientId: string;
  /** Изменённые параметры клиента. Ключ — имя параметра (confidential, redirect_uris, scopes), значение — объект с полями previous (прежнее значение) и new (новое значение). Нет, если авторизацию от имени сотрудника включили, не меняя параметров клиента. */
  changes?: Record<string, unknown>;
  /** Идентификатор приложения бота */
  applicationId?: number;
  /** Название приложения бота */
  applicationName?: string;
  /** Имя бота */
  botName?: string;
  /** Идентификатор вебхука бота */
  webhookId?: number;
  /** Права, которые бот запрашивает у сотрудника на экране согласия */
  scopes?: Array<string>;
  /** Идентификатор токена, которым выполнено действие. Нет, если действие выполнено в интерфейсе Пачки. */
  accessTokenId?: number;
  /** Токен, которым выполнено действие, в маскированном виде. Нет, если действие выполнено в интерфейсе Пачки. */
  accessTokenPreview?: string;
};

/** При: bot_oauth_client_disabled */
export type AuditDetailsBotOAuthClientDisabled = {
  /** Идентификатор бота */
  botId: number;
  /** Идентификатор пользователя, выполнившего действие */
  actorId?: number;
  /** Идентификатор OAuth-клиента бота */
  clientId: string;
  /** Сколько токенов сотрудников отозвано */
  deletedAccessTokensCount: number;
  /** Сколько неиспользованных кодов авторизации отозвано */
  deletedAccessGrantsCount: number;
  /** Идентификатор приложения бота */
  applicationId?: number;
  /** Название приложения бота */
  applicationName?: string;
  /** Имя бота */
  botName?: string;
  /** Идентификатор вебхука бота */
  webhookId?: number;
  /** Права, которые бот запрашивает у сотрудника на экране согласия */
  scopes?: Array<string>;
  /** Идентификатор токена, которым выполнено действие. Нет, если действие выполнено в интерфейсе Пачки. */
  accessTokenId?: number;
  /** Токен, которым выполнено действие, в маскированном виде. Нет, если действие выполнено в интерфейсе Пачки. */
  accessTokenPreview?: string;
};

/** При: bot_oauth_client_secret_rotated, bot_oauth_client_secret_issued */
export type AuditDetailsBotOAuthClientSecretRotated = {
  /** Идентификатор бота */
  botId: number;
  /** Идентификатор пользователя, выполнившего действие */
  actorId?: number;
  /** Идентификатор OAuth-клиента бота */
  clientId: string;
  /** Идентификатор приложения бота */
  applicationId?: number;
  /** Название приложения бота */
  applicationName?: string;
  /** Имя бота */
  botName?: string;
  /** Идентификатор вебхука бота */
  webhookId?: number;
  /** Права, которые бот запрашивает у сотрудника на экране согласия. Есть у bot_oauth_client_secret_issued. */
  scopes?: Array<string>;
  /** Идентификатор токена, которым выполнено действие. Есть у bot_oauth_client_secret_issued, кроме действий в интерфейсе Пачки. */
  accessTokenId?: number;
  /** Токен, которым выполнено действие, в маскированном виде. Есть у bot_oauth_client_secret_issued, кроме действий в интерфейсе Пачки. */
  accessTokenPreview?: string;
};

/** При: bot_scopes_updated */
export type AuditDetailsBotScopes = {
  /** Идентификатор бота */
  botId: number;
  /** Идентификатор пользователя, выполнившего действие */
  actorId?: number;
  /** Скоупы, добавленные токену бота */
  addedScopes: Array<string>;
  /** Скоупы, отозванные у токена бота */
  removedScopes: Array<string>;
  /** Имя бота. Нет в записях до 7 октября 2026 года. */
  botName?: string;
  /** Идентификатор вебхука бота */
  webhookId: number;
  /** Скоупы токена бота до изменения */
  previousScopes: Array<string>;
  /** Скоупы токена бота после изменения */
  newScopes: Array<string>;
};

/** При: bot_token_updated */
export type AuditDetailsBotTokenUpdated = {
  /** Вид токена: `bot` */
  tokenKind: string;
  /** Название токена после изменения. Нет, если у токена нет названия. */
  tokenName?: string;
  /** Идентификатор владельца токена — бота */
  resourceOwnerId: number;
  /** Скоупы токена после изменения */
  currentScopes: Array<string>;
  /** Идентификатор бота */
  botId?: number;
  /** Идентификатор пользователя, выполнившего действие */
  actorId?: number;
  /** Идентификатор токена */
  accessTokenId: number;
  /** Токен в маскированном виде: первые и последние символы. Нет, если значение недоступно. */
  accessTokenPreview?: string;
  /** Идентификатор приложения бота */
  applicationId?: number;
  /** Название приложения бота */
  applicationName?: string;
  /** Идентификатор OAuth-клиента бота */
  clientId?: string;
  /** Имя бота */
  botName?: string;
  /** Идентификатор вебхука бота */
  webhookId: number;
  /** Смена названия токена. Есть, если название передали в запросе. */
  name?: AuditDetailsTokenNameChange;
  /** Смена скоупов токена. Есть, если скоупы передали в запросе. */
  scopes?: AuditDetailsTokenScopesChange;
};

/** При: bot_webhook_settings_updated */
export type AuditDetailsBotWebhookSettings = {
  /** Идентификатор бота */
  botId: number;
  /** Идентификатор пользователя, выполнившего действие */
  actorId?: number;
  /** Изменённые настройки вебхука. Ключ — имя настройки (outgoing_url, ignore_self_messages, events_history_enabled, can_edit, who_can_add), значение — объект с полями previous (прежнее значение) и new (новое значение). Если значение не было задано, поля previous или new в объекте нет. */
  changes: Record<string, unknown>;
  /** Имя бота */
  botName?: string;
  /** Идентификатор вебхука бота */
  webhookId?: number;
  /** Идентификатор токена, которым изменили настройки. Нет, если их изменили в интерфейсе Пачки. */
  accessTokenId?: number;
  /** Токен, которым изменили настройки, в маскированном виде. Нет, если их изменили в интерфейсе Пачки. */
  accessTokenPreview?: string;
  /** Идентификатор приложения токена, которым изменили настройки. Нет, если их изменили в интерфейсе Пачки. */
  applicationId?: number;
};

/** При: tag_removed_from_chat */
export type AuditDetailsChatId = {
  /** Идентификатор чата */
  chatId: number;
};

/** При: chat_permission_changed */
export type AuditDetailsChatPermission = {
  /** Публичный доступ */
  publicAccess: boolean;
};

/** При: chat_renamed */
export type AuditDetailsChatRenamed = {
  /** Прежнее название чата */
  oldName: string;
  /** Новое название чата */
  newName: string;
};

/** При: oauth_device_authorization_approved */
export type AuditDetailsDeviceAuthorizationApproved = {
  /** Идентификатор OAuth-клиента, которому разрешён вход */
  clientId: string;
  /** Скоупы, на которые согласился сотрудник */
  scopes: Array<string>;
  /** Имя устройства, с которого выполняется вход. Нет, если приложение его не передало. */
  deviceName?: string;
  /** Идентификатор приложения, которому разрешён вход. Нет у входа в надстройку Outlook. */
  applicationId?: number;
  /** Название приложения. Нет у входа в надстройку Outlook и в записях до 7 октября 2026 года. */
  applicationName?: string;
  /** Идентификатор запроса на вход */
  deviceGrantId: number;
  /** Вид токена: `cli` — вход в CLI, `outlook` — вход в надстройку Outlook. Нет в записях до 7 октября 2026 года. */
  tokenKind?: string;
};

/** При: oauth_device_authorization_denied */
export type AuditDetailsDeviceAuthorizationDenied = {
  /** Идентификатор OAuth-клиента, которому отказано во входе */
  clientId: string;
  /** Скоупы, которые клиент запрашивал */
  scopes: Array<string>;
  /** Имя устройства, с которого выполнялся вход. Нет, если приложение его не передало. */
  deviceName?: string;
  /** Идентификатор приложения. Нет у входа в надстройку Outlook и при отказе во входе в CLI: приложение назначается входу в CLI только после подтверждения. */
  applicationId?: number;
  /** Идентификатор запроса на вход */
  deviceGrantId: number;
  /** Вид токена: `cli` — вход в CLI, `outlook` — вход в надстройку Outlook. Нет в записях до 7 октября 2026 года. */
  tokenKind?: string;
};

/** При: dlp_violation_detected */
export type AuditDetailsDlp = {
  /** Идентификатор правила DLP: строка из названия правила, например `pasport-rf`. При переименовании правила не меняется. */
  dlpRuleId: string;
  /** Название правила DLP */
  dlpRuleName: string;
  /** Идентификатор сообщения */
  messageId: number;
  /** Идентификатор чата */
  chatId: number;
  /** Идентификатор пользователя */
  userId: number;
  /** Описание действия. Нет, если у действия правила текст не задан. */
  actionMessage?: string;
  /** Результат проверки условий правила (true — условия сработали) */
  conditionsMatched: boolean;
};

/** Пустые детали. При: user_login (кроме входа по QR-коду), user_logout, user_2fa_fail, user_2fa_success, user_2fa_disabled, user_created, user_deleted, chat_created, message_created, reaction_created, reaction_deleted, thread_created, audit_events_accessed, company_chats_accessed, company_bots_accessed, exchange_disabled. У message_updated и message_deleted пустые детали могут прийти в записях до 7 ноября 2026 года включительно. */
export type AuditDetailsEmpty = Record<string, unknown>;

/** При: user_added_to_tag, user_removed_from_tag, user_chat_leave */
export type AuditDetailsInitiator = {
  /** Идентификатор пользователя, выполнившего действие. Актор события — сотрудник, которого оно коснулось. */
  initiatorId: number;
};

/** При: user_chat_join */
export type AuditDetailsInviter = {
  /** Идентификатор пользователя, добавившего участника в чат. Актор события — добавленный участник. */
  inviterId: number;
};

/** При: kms_encrypt, kms_decrypt */
export type AuditDetailsKms = {
  /** Идентификатор чата */
  chatId: number;
  /** Идентификатор сообщения */
  messageId: number;
  /** Причина операции: `message_create` — шифрование текста сообщения, `message_store_for_search` — сохранение текста для поиска, `file_upload` — загрузка файла (все три у kms_encrypt), `file_download` — скачивание файла (у kms_decrypt) */
  reason: string;
};

/** При: login_grant_approved */
export type AuditDetailsLoginGrantApproved = {
  /** Идентификатор запроса на вход по QR-коду, общий для всех событий одного входа */
  loginGrantId: string;
  /** Устройство, на котором выполнялся вход */
  device: AuditLoginGrantDevice;
};

/** При: login_grant_created */
export type AuditDetailsLoginGrantCreated = {
  /** Идентификатор запроса на вход по QR-коду, общий для всех событий одного входа */
  loginGrantId: string;
};

/** При: login_grant_denied */
export type AuditDetailsLoginGrantDenied = {
  /** Идентификатор запроса на вход по QR-коду, общий для всех событий одного входа */
  loginGrantId: string;
  /** Устройство, на котором выполнялся вход */
  device: AuditLoginGrantDevice;
  /** Причина отказа */
  reason: AuditLoginGrantDenyReason;
};

/** При: message_updated, message_deleted */
export type AuditDetailsMessage = {
  /** Идентификатор чата сообщения. У сообщения в треде это чат сообщения-родителя треда, а у самостоятельного треда чат самого треда. */
  chatId: number;
  /** Идентификатор чата треда. Есть только у сообщений в тредах. */
  threadChatId?: number;
  /** Кто изменил сообщение: `employee` — сотрудник, `bot` — бот, `dlp` — правило DLP заменило текст (актор — отправитель сообщения), `system` — сама Пачка, например когда прикрепляет к сообщению картинку по ссылке. У message_deleted приходит `employee` или `bot`. */
  source: string;
  /** Идентификатор версии сообщения: снимка его текста и файлов до правки или на момент удаления. После DLP текст в снимке скрыт. Нет, если правка не затронула текст и файлы или удалённое сообщение было пустым. Совпадает с `version_id` состояния в [истории сообщения](GET /company/messages/{id}/history). */
  messageVersionId?: number;
};

/** При: company_messages_accessed */
export type AuditDetailsMessageId = {
  /** Идентификатор сообщения, историю которого запросили */
  messageId: number;
};

/** При: oauth_authorization_granted */
export type AuditDetailsOAuthAuthorizationGranted = {
  /** Идентификатор OAuth-клиента, которому выдан доступ. Нет в записях до 7 октября 2026 года о доступе, выданном боту. */
  clientId?: string;
  /** Скоупы, на которые выдан доступ */
  scopes: Array<string>;
  /** Идентификатор приложения, которому выдан доступ */
  applicationId: number;
  /** Название приложения. Нет в записях до 7 октября 2026 года. */
  applicationName?: string;
  /** Идентификатор бота. Есть, когда доступ выдан боту. */
  botId?: number;
  /** Имя бота. Есть вместе с `bot_id`. */
  botName?: string;
  /** Идентификатор выданного кода авторизации */
  authorizationGrantId: number;
};

/** При: oauth_authorization_revoked */
export type AuditDetailsOAuthAuthorizationRevoked = {
  /** Идентификатор OAuth-клиента, у которого отозван доступ */
  clientId: string;
  /** Количество отозванных токенов */
  revokedTokensCount: number;
  /** Идентификатор сотрудника, чей доступ отозван. Есть, когда доступ отозвал администратор. */
  userId?: number;
  /** Идентификатор приложения, у которого отозван доступ */
  applicationId: number;
  /** Название приложения. Нет в записях до 7 октября 2026 года. */
  applicationName?: string;
  /** Идентификатор бота. Есть, когда доступ отозван у бота. */
  botId?: number;
  /** Имя бота. Есть вместе с `bot_id`. */
  botName?: string;
};

/** При: user_role_changed */
export type AuditDetailsRoleChanged = {
  /** Новая роль */
  newCompanyRole: string;
  /** Предыдущая роль */
  previousCompanyRole: string;
  /** Идентификатор пользователя, сменившего роль. Актор события — сотрудник, чью роль сменили. */
  initiatorId: number;
};

/** При: search_users_api, search_chats_api, search_messages_api */
export type AuditDetailsSearch = {
  /** Тип поиска */
  searchType: string;
  /** Указан ли поисковый запрос */
  queryPresent: boolean;
  /** Использован ли курсор */
  cursorPresent: boolean;
  /** Запрошенный размер страницы. Нет, если параметр `limit` не передан. В записях до 16 октября 2026 года в этом случае приходит `0`. */
  limit?: number;
  /** Применённые фильтры. Возможные ключи зависят от типа поиска: order, sort, created_from, created_to, company_roles (users), active (chats и messages), chat_subtype, personal (chats), chat_ids, user_ids, include_root_chat_id (messages, всегда `true`). Нет, если фильтры не применялись. */
  filters?: Record<string, unknown>;
};

/** При: tag_added_to_chat */
export type AuditDetailsTagChat = {
  /** Идентификатор чата */
  chatId: number;
  /** Название тега */
  tagName: string;
};

/** При: tag_created, tag_deleted */
export type AuditDetailsTagName = {
  /** Название тега */
  name: string;
};

/** При: access_token_created, access_token_updated, access_token_destroy, bot_token_created, bot_token_reissued, bot_token_recreated, bot_token_deleted, oauth_token_revoked */
export type AuditDetailsToken = {
  /** Вид токена: `personal` — персональный токен, `cli` — вход в CLI, `bot` — токен бота, `oauth` — токен, который сотрудник выдал боту на экране согласия, `client` — токен внешнего приложения, которому сотрудник выдал доступ */
  tokenKind: string;
  /** Название токена, у входа в CLI — имя устройства. Нет, если у токена нет названия. */
  tokenName?: string;
  /** Идентификатор владельца токена: сотрудника, а у токена бота — самого бота */
  resourceOwnerId: number;
  /** Скоупы токена */
  scopes: Array<string>;
  /** Идентификатор токена */
  accessTokenId: number;
  /** Токен в маскированном виде: первые и последние символы. Нет, если значение недоступно. */
  accessTokenPreview?: string;
  /** Идентификатор приложения, которому принадлежит токен */
  applicationId?: number;
  /** Название приложения, которому принадлежит токен */
  applicationName?: string;
  /** Идентификатор OAuth-клиента приложения */
  clientId?: string;
  /** Идентификатор бота. Есть у токенов бота и у токенов, которые сотрудник выдал боту. */
  botId?: number;
  /** Имя бота. Есть вместе с `bot_id`. */
  botName?: string;
  /** Имя устройства. Есть у входа в CLI, если имя задано. */
  deviceName?: string;
  /** Идентификатор пользователя, выполнившего действие. Есть у событий токенов бота. */
  actorId?: number;
  /** Идентификатор вебхука бота. Есть у событий токенов бота. */
  webhookId?: number;
  /** Идентификатор сотрудника, чей токен отозван. Есть, когда токен отозвал администратор или сотрудника перевели в гости. */
  userId?: number;
  /** Источник отзыва: `oauth_client` — приложение само отозвало токен. Есть только у oauth_token_revoked. */
  source?: string;
  /** Причина отзыва. `guest_downgrade` — токен отозван автоматически, когда сотрудника перевели в гости. Есть только в таких записях. */
  reason?: string;
};

/** Смена названия токена в журнале аудита */
export type AuditDetailsTokenNameChange = {
  /** Прежнее название. Нет, если названия не было. */
  previous?: string;
  /** Новое название. Нет, если название убрали. */
  new?: string;
};

/** При: access_token_created, access_token_updated, access_token_destroy в записях до 7 октября 2026 года */
export type AuditDetailsTokenScopes = {
  /** Скоупы токена */
  scopes: Array<string>;
};

/** Смена скоупов токена в журнале аудита */
export type AuditDetailsTokenScopesChange = {
  /** Скоупы токена до изменения */
  previous: Array<string>;
  /** Скоупы токена после изменения */
  new: Array<string>;
};

/** При: user_login, если вход был по QR-коду */
export type AuditDetailsUserLoginQr = {
  /** Способ входа: `qr` — вход по QR-коду */
  method: string;
  /** Идентификатор запроса на вход по QR-коду, общий для всех событий одного входа */
  loginGrantId: string;
};

/** При: user_updated */
export type AuditDetailsUserUpdated = {
  /** Список изменённых полей */
  changedAttrs: Array<string>;
  /** Как было выполнено изменение. Значение `sso_login` — профиль обновился автоматически при входе через SSO. Поле отсутствует, если профиль изменили обычным способом. */
  context?: string;
};

/** При: video_call_finished */
export type AuditDetailsVideoCallFinished = {
  /** Идентификатор чата, в котором проходил видеозвонок */
  chatId: number;
  /** Идентификатор сообщения о начале звонка. Нет, если такого сообщения не было. */
  startedMessageId?: number;
  /** Длительность звонка в секундах. Нет, если звонок завершился, так и не начавшись. */
  duration?: number;
  /** Максимальное число одновременных участников за время звонка */
  maxMembersCount: number;
};

/** При: video_call_recording_ready */
export type AuditDetailsVideoCallRecording = {
  /** Идентификатор чата, в котором проходил видеозвонок */
  chatId: number;
  /** Идентификатор сообщения о начале звонка. Нет, если такого сообщения не было. */
  startedMessageId?: number;
  /** Идентификатор записи */
  recordingId: number;
  /** Идентификатор файла записи */
  fileId: number;
  /** Длительность записи в секундах */
  duration: number;
  /** Размер файла записи в байтах */
  size: number;
};

/** При: video_call_started */
export type AuditDetailsVideoCallStarted = {
  /** Идентификатор чата, в котором проходит видеозвонок */
  chatId: number;
  /** Идентификатор сообщения о начале звонка. Нет, если такого сообщения не было. */
  startedMessageId?: number;
};

/** Событие аудита */
export type AuditEvent = {
  /** Уникальный идентификатор события */
  id: string;
  /** Дата и время создания события (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ */
  createdAt: string;
  /** Ключ типа события */
  eventKey: AuditEventKey;
  /** Идентификатор затронутой сущности */
  entityId: string;
  /** Тип затронутой сущности */
  entityType: string;
  /** Идентификатор пользователя, выполнившего действие. У событий user_role_changed, user_chat_join, user_chat_leave, user_added_to_tag и user_removed_from_tag это сотрудник, которого коснулось изменение, а кто его выполнил, приходит в `details`: в `initiator_id` или `inviter_id`. */
  actorId: string;
  /** Тип актора */
  actorType: string;
  /** Дополнительные детали события. Структура зависит от значения event_key — см. описания значений поля event_key. Для событий без деталей возвращается пустой объект. */
  details: AuditEventDetailsUnion;
  /** IP-адрес запроса, в котором произошло действие. У событий видеозвонков это обычно адрес видеосервера, а не участника звонка. `null`, если событие записано вне HTTP-запроса. */
  ipAddress: string | null;
  /** User agent клиента, обрезается до 255 символов. У событий видеозвонков это обычно user agent видеосервера. `null`, если событие записано вне HTTP-запроса. */
  userAgent: string | null;
};

/** Дополнительные детали события аудита. Структура зависит от значения event_key. */
export type AuditEventDetailsUnion = (AuditDetailsEmpty | AuditDetailsUserUpdated | AuditDetailsRoleChanged | AuditDetailsTagName | AuditDetailsInitiator | AuditDetailsInviter | AuditDetailsChatRenamed | AuditDetailsChatPermission | AuditDetailsTagChat | AuditDetailsChatId | AuditDetailsMessageId | AuditDetailsMessage | AuditDetailsTokenScopes | AuditDetailsKms | AuditDetailsDlp | AuditDetailsSearch | AuditDetailsBot | AuditDetailsBotScopes | AuditDetailsBotWebhookSettings | AuditDetailsBotOAuthClient | AuditDetailsOAuthAuthorizationGranted | AuditDetailsOAuthAuthorizationRevoked | AuditDetailsDeviceAuthorizationApproved | AuditDetailsDeviceAuthorizationDenied | AuditDetailsVideoCallStarted | AuditDetailsVideoCallFinished | AuditDetailsVideoCallRecording | AuditDetailsBotOAuthClientSecretRotated | AuditDetailsBotOAuthClientDisabled | AuditDetailsToken | AuditDetailsBotTokenUpdated | AuditDetailsUserLoginQr | AuditDetailsLoginGrantCreated | AuditDetailsLoginGrantApproved | AuditDetailsLoginGrantDenied);

/** Тип аудит-события */
export type AuditEventKey = "user_login" | "user_logout" | "user_2fa_fail" | "user_2fa_success" | "user_2fa_disabled" | "login_grant_created" | "login_grant_approved" | "login_grant_denied" | "user_created" | "user_deleted" | "user_role_changed" | "user_updated" | "tag_created" | "tag_deleted" | "user_added_to_tag" | "user_removed_from_tag" | "chat_created" | "chat_renamed" | "chat_permission_changed" | "user_chat_join" | "user_chat_leave" | "tag_added_to_chat" | "tag_removed_from_chat" | "message_updated" | "message_deleted" | "message_created" | "reaction_created" | "reaction_deleted" | "thread_created" | "access_token_created" | "access_token_updated" | "access_token_destroy" | "kms_encrypt" | "kms_decrypt" | "audit_events_accessed" | "company_chats_accessed" | "company_bots_accessed" | "company_messages_accessed" | "dlp_violation_detected" | "search_users_api" | "search_chats_api" | "search_messages_api" | "bot_scopes_updated" | "bot_webhook_settings_updated" | "bot_token_recreated" | "bot_deleted" | "bot_oauth_client_updated" | "bot_oauth_client_disabled" | "bot_oauth_client_secret_rotated" | "bot_oauth_client_secret_issued" | "bot_token_created" | "bot_token_updated" | "bot_token_reissued" | "bot_token_deleted" | "oauth_authorization_granted" | "oauth_authorization_revoked" | "oauth_token_revoked" | "oauth_device_authorization_approved" | "oauth_device_authorization_denied" | "video_call_started" | "video_call_finished" | "video_call_recording_ready" | "exchange_disabled";

/** Причина отказа во входе по QR-коду */
export type AuditLoginGrantDenyReason = "denied" | "verification_failed";

/** Устройство при входе по QR-коду. Данные о нём присылает само приложение, сервер сверяет только их формат. */
export type AuditLoginGrantDevice = {
  /** Название устройства */
  name: string;
  /** Платформа приложения */
  platform: AuditLoginGrantDevicePlatform;
  /** Версия операционной системы. Есть, если приложение её передало. */
  osVersion?: string;
  /** Версия приложения Пачки. Есть, если приложение её передало. */
  appVersion?: string;
};

/** Платформа мобильного приложения, в котором выполняется вход по QR-коду */
export type AuditLoginGrantDevicePlatform = "iOS" | "Android" | "Rustore" | "Appgallery";

/** Данные аватара */
export type AvatarData = {
  /** URL аватара */
  imageUrl: string;
};

/** Токен бота */
export type BotAccessToken = {
  /** Идентификатор токена */
  id: number;
  /** Токен в маскированном виде (видны первые 8 и последние 4 символа). Полное значение приходит один раз: при выпуске и перевыпуске токена. */
  token: string;
  /** Имя токена. `null` у токена, выпущенного без имени. */
  name: string | null;
  /** Идентификатор бота, которому принадлежит токен */
  userId: number;
  /** Права токена */
  scopes: Array<string>;
  /** Дата и время выпуска токена (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ */
  createdAt: string;
  /** Дата отзыва токена. Всегда `null`: отозванные токены в ответ не попадают. */
  revokedAt: string | null;
  /** Время жизни токена в секундах. У токенов бота `null`: они бессрочные. */
  expiresIn: number | null;
  /** Дата последнего использования токена. `null`, пока по токену не было ни одного запроса. Обновляется не чаще раза в минуту, поэтому может отставать. */
  lastUsedAt: string | null;
  /** Дата авторизации. У токенов бота `null`. */
  authorizedAt: string | null;
};

/** Роль, которой разрешено редактировать настройки бота */
export type BotCanEdit = "admin" | "chat_owners";

/** Запрос на создание бота */
export type BotCreateRequest = {
  /** Создать пустого бота: без входящего вебхука и, если не переданы скоупы, без токена. Со скоупами основной токен создаётся, но его значение в ответе не приходит: получите его методом [Ротация токена бота](POST /bots/{id}/recreate_token). Без этого поля бот создаётся с входящим вебхуком в своём формате, а его токен сразу приходит в `access_token`. */
  empty?: boolean;
  /** Объект параметров вебхука создаваемого бота */
  webhook: {
    /** Имя бота */
    name: string;
    /** Никнейм бота: латинские буквы, цифры и `_`, в конце `_bot`, свободный в пространстве. Ник не по формату отвечает `400` на поле `bot.nickname` с кодом `invalid`, а занятый ник — с кодом `taken`. Без поля ник собирается из имени в латинской транслитерации с `_bot` в конце, а если такой ник занят, с `_2_bot`, `_3_bot` и далее. */
    nickname?: string;
    /** URL исходящего вебхука: публичный адрес с протоколом `http` или `https`. Иначе ответ `400` на поле `webhook.outgoing_url` с кодом `webhook_url_invalid`, `webhook_url_unresolved` или `webhook_url_forbidden`. */
    outgoingUrl?: string;
    /** События, на которые подписан бот. Без поля бот подписан на `message_new`. */
    events?: Array<BotEventName>;
    /** Условие срабатывания исходящего вебхука. По умолчанию `commands`: события о новых и изменённых сообщениях приходят на команды из поля `commands`. Для событий обо всех сообщениях передайте `all_messages`. */
    triggerOn?: BotTriggerOn;
    /** Команды бота (триггер-слова), на которые он реагирует при trigger_on = commands. Событие о сообщении приходит боту, когда первое слово текста совпадает с одной из команд целиком, с учётом регистра. Команду можно задать и без слэша в начале. Суммарная длина команд вместе с разделителями `, ` (запятая и пробел) не должна превышать 255 символов. */
    commands?: Array<string>;
    /** Скоупы (права доступа) основного токена бота. Без поля основной токен получает набор по умолчанию, в котором нет `bot_self:webhook:write`, `bot_self:write` и `user_status:read`: их передают явно. Права, которые бот запрашивает у сотрудников в `oauth_client`, на основной токен не влияют. Боту доступны не все скоупы: часть из них разрешена только пользовательским ролям, и попытка назначить такой скоуп возвращает `400`. Служебные значения `bot` и `all` назначать нельзя. */
    scopes?: Array<string>;
    /** Шаблон форматирования входящего вебхука. Шаблон с синтаксической ошибкой у источника `simple`, в том числе у пустого бота с `kind: simple`, даёт ответ `400` на этом поле с кодом `invalid`, и бот не создаётся. Причина приходит в `message`. */
    template?: string;
    /** Шаблонизатор для обработки шаблона входящего вебхука. Без этого поля бот получает `liquid`, а пустой бот (`empty: true`) — `mustache`. */
    templateEngine?: BotTemplateEngine;
    /** Название поля проверки для верификации входящего вебхука */
    challengeKey?: string;
    /** Показывать превью ссылок в сообщениях входящего вебхука. При `true` ссылки из любых сообщений этого бота, в том числе отправленных через API, получают и [боты с разворачиванием ссылок](/guides/link-previews#vebhuk-o-ssylke). */
    linkPreviewEnabled?: boolean;
    /** Не присылать боту события о сообщениях, которые он отправил сам, и о реакциях на эти сообщения, кто бы их ни поставил или снял. Нажатия кнопок приходят всегда. */
    ignoreSelfMessages?: boolean;
    /** Сохранять историю событий бота для последующего получения через метод истории событий. Пачка создаёт события, только пока у бота задан `outgoing_url` или включено это поле: произошедшее без них не придёт и позже. */
    eventsHistoryEnabled?: boolean;
    /** Кто может добавлять бота в чаты */
    whoCanAdd?: BotWhoCanAdd;
    /** Роли, которым, помимо создателя, разрешено редактировать настройки бота. Создатель может редактировать всегда. Пустой массив — редактировать может только создатель. */
    canEdit?: Array<BotCanEdit>;
    /** Ограничивает бота одной беседой или каналом: `true` — бота можно добавить только в один такой чат, `false` — в несколько. Личные чаты и треды в ограничение не входят. */
    singleChat?: boolean;
    /** Источник входящего вебхука. Без `empty` по умолчанию `simple`, а у пустого бота входящий вебхук включается только этим полем. */
    kind?: BotWebhookKind;
    /** Домены, ссылки на которые бот разворачивает, не больше 5. Работают вместе с событием `message_link_shared`. Каждый элемент — хост без протокола, пути и порта: домен с точкой, IPv4-адрес или `localhost`. Домен не по [правилам распознавания доменов](/guides/link-previews#pravila-raspoznavaniya-domenov), например на кириллице, получает ответ `400` с кодом `invalid`. */
    unfurlDomains?: Array<string>;
  };
  /** Включить авторизацию от имени сотрудника сразу при создании. Подробнее — в разделе [Настройка авторизации](/guides/oauth/setup). */
  oauthClient?: BotOAuthClientRequest;
  /** Страница бота в витрине. Задаётся только вместе с `oauth_client`: без авторизации страницы у бота нет. */
  promo?: BotPromoRequest;
};

/** Параметры созданного бота */
export type BotCreateResponse = {
  /** Идентификатор бота (совпадает с `user_id` бота) */
  id: number;
  /** Имя бота */
  name: string;
  /** Никнейм бота */
  nickname: string;
  /** Ссылка на аватар бота. `null`, если аватар не задан. */
  avatarUrl: string | null;
  /** Идентификатор сотрудника, создавшего бота. `null`, если создатель не записан. */
  creatorId: number | null;
  /** Дата и время создания бота (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ */
  createdAt: string;
  /** Сколько сотрудников авторизовали бота */
  authorizedUsersCount: number;
  /** Дата и время, когда бот последний раз работал (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ: запрос на входящий вебхук или вызов API любым токеном бота, включая токены сотрудников. `null`, если такого не было. Использование токена учитывается не чаще раза в минуту. */
  lastUsedAt: string | null;
  /** Объект параметров вебхука */
  webhook: BotWebhook;
  /** Включена ли у бота авторизация от имени сотрудника */
  oauthClientEnabled: boolean;
  /** Параметры авторизации от имени сотрудника. Может прийти и у бота с выключенной авторизацией, поэтому включена ли она, смотрите в `oauth_client_enabled`. У бота без токенов может прийти `null`. */
  oauthClient: BotOAuthClient | null;
  /** Страница бота в витрине. `null`, если авторизация у бота выключена. */
  promo: BotPromo | null;
  /** Что вы можете делать с этим ботом */
  permissions: BotPermissions;
  /** Секрет клиента. Приходит один раз: при включении серверного клиента, при переходе на него и при ротации секрета. */
  clientSecret?: string;
  /** Токен доступа бота. Возвращается при создании бота и при ротации токена. Не приходит, если бот создан с `empty: true`. */
  accessToken?: string;
};

/** Событие исходящего вебхука бота */
export type BotEventName = "message_new" | "message_update" | "message_delete" | "reaction_new" | "reaction_delete" | "button_click" | "message_link_shared" | "chat_member_add" | "chat_member_remove" | "company_member_invite" | "company_member_confirm" | "company_member_suspend" | "company_member_activate" | "company_member_delete" | "company_member_update" | "video_call_started" | "video_call_finished" | "video_call_recording_ready";

/** Авторизация от имени сотрудника */
export type BotOAuthClient = {
  /** Идентификатор клиента для ссылки авторизации */
  clientId: string;
  /** Секрет клиента в маскированном виде. Полное значение приходит в `client_secret` один раз: при включении серверного клиента, при переключении клиента на серверный и при ротации секрета. */
  clientSecretPreview: string;
  /** Где хранится секрет: `true` — серверное приложение, `false` — приложение без секрета, обмен кода по PKCE */
  confidential: boolean;
  /** Адреса возврата после согласия */
  redirectUris: Array<string>;
  /** Права, которые бот запрашивает у сотрудника на экране согласия */
  scopes: Array<string>;
};

/** Настройки авторизации от имени сотрудника */
export type BotOAuthClientRequest = {
  /** Где хранится секрет: `true` — серверное приложение хранит `client_secret` и обменивает код у себя, `false` — приложение без секрета (браузер, мобильное, CLI) обменивает код по PKCE. Если не передать, значение не меняется, а у нового клиента — `true`. */
  confidential?: boolean;
  /** Адреса возврата после согласия. Веб-адресу нужен HTTPS: простой `http` допустим только для `localhost`, `127.0.0.1` и `[::1]`. Подходит и своя схема приложения вида `com.example.app:/oauth`. Фрагмент `#…` в адресе недопустим. Адрес в ссылке авторизации должен совпадать с одним из списка. Параметры запроса при этом сверяются, только если они есть у адреса в списке, а у адресов на этом же компьютере не сравнивается порт. Подробнее — в разделе [Включение](/guides/oauth/setup#vklyuchenie). При включении передайте хотя бы один адрес. Список заменяется целиком. */
  redirectUris?: Array<string>;
  /** Права, которые бот запрашивает у сотрудника на экране согласия. Доступны только права, которые можно выдать самому боту. Без поля набор не меняется, а при первом включении бот запрашивает набор по умолчанию: почти все права, доступные боту. Передавайте список явно. Список заменяется целиком. */
  scopes?: Array<string>;
};

/** Что текущий пользователь может делать с ботом */
export type BotPermissions = {
  /** Менять авторизацию от имени сотрудника, страницу в витрине и имя бота */
  updateOauthClient: boolean;
  /** Выпускать, менять и удалять токены бота, менять скоупы основного токена (`webhook.scopes`) и обновлять секрет клиента */
  recreateToken: boolean;
  /** Удалить бота */
  destroy: boolean;
};

/** Страница бота в витрине */
export type BotPromo = {
  /** Описание бота в Markdown. `null`, если не задано. */
  description: string | null;
  /** Опубликован ли бот в витрине */
  published: boolean;
  /** Скриншоты страницы бота */
  promoImages: Array<BotPromoImage>;
};

/** Скриншот страницы бота в витрине */
export type BotPromoImage = {
  /** Ключ изображения */
  key: string;
  /** Ссылка на изображение */
  url: string;
};

/** Страница бота в витрине */
export type BotPromoRequest = {
  /** Описание: чем бот занимается и зачем его подключать, в Markdown. Без описания бота нельзя опубликовать. Витрина показывает жирный, курсив, зачёркнутый текст, ссылки, списки, цитаты и код. Если в описании есть заголовок, таблица, картинка, чек-лист, горизонтальная линия или определение ссылки вида `[1]: https://example.com`, витрина показывает всё описание обычным текстом с символами разметки. */
  description?: string;
  /** Опубликовать бота в витрине: он появится карточкой на вкладке «Обзор». Публикация требует описания. */
  published?: boolean;
  /** Скриншоты страницы бота, не больше 5: ключи загруженных изображений (`key` из [Получение подписи, ключа и других параметров](POST /uploads)). Список заменяется целиком, порядок сохраняется. */
  promoImages?: Array<string>;
};

/** Параметры бота */
export type BotResponse = {
  /** Идентификатор бота (совпадает с `user_id` бота) */
  id: number;
  /** Имя бота */
  name: string;
  /** Никнейм бота */
  nickname: string;
  /** Ссылка на аватар бота. `null`, если аватар не задан. */
  avatarUrl: string | null;
  /** Идентификатор сотрудника, создавшего бота. `null`, если создатель не записан. */
  creatorId: number | null;
  /** Дата и время создания бота (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ */
  createdAt: string;
  /** Сколько сотрудников авторизовали бота */
  authorizedUsersCount: number;
  /** Дата и время, когда бот последний раз работал (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ: запрос на входящий вебхук или вызов API любым токеном бота, включая токены сотрудников. `null`, если такого не было. Использование токена учитывается не чаще раза в минуту. */
  lastUsedAt: string | null;
  /** Объект параметров вебхука */
  webhook: BotWebhook;
  /** Включена ли у бота авторизация от имени сотрудника */
  oauthClientEnabled: boolean;
  /** Параметры авторизации от имени сотрудника. Может прийти и у бота с выключенной авторизацией, поэтому включена ли она, смотрите в `oauth_client_enabled`. У бота без токенов может прийти `null`. */
  oauthClient: BotOAuthClient | null;
  /** Страница бота в витрине. `null`, если авторизация у бота выключена. */
  promo: BotPromo | null;
  /** Что вы можете делать с этим ботом */
  permissions: BotPermissions;
  /** Секрет клиента. Приходит один раз: при включении серверного клиента, при переходе на него и при ротации секрета. */
  clientSecret?: string;
};

/** Каталог прав, которые можно выдать боту */
export type BotScopeCatalog = {
  /** Права, доступные боту */
  scopes: Array<BotScopeCatalogItem>;
  /** Категории прав */
  groups: Array<BotScopeCatalogGroup>;
  /** Готовые наборы прав */
  presets: Array<BotScopeCatalogPreset>;
};

/** Категория прав */
export type BotScopeCatalogGroup = {
  /** Идентификатор категории */
  id: string;
  /** Название категории */
  title: string;
  /** Описание категории */
  description: string;
};

/** Право в каталоге прав бота */
export type BotScopeCatalogItem = {
  /** Право */
  id: string;
  /** Описание права */
  title: string;
  /** Категория права, `id` из `groups` */
  group: string;
  /** Наборы, в которые входит право, `id` из `presets` */
  preset: Array<string>;
};

/** Готовый набор прав */
export type BotScopeCatalogPreset = {
  /** Идентификатор набора: `read-only` или `admin` */
  id: string;
  /** Название набора */
  title: string;
};

/** Параметры бота в ответах методов самого бота */
export type BotSelfResponse = {
  /** Идентификатор бота (совпадает с `user_id` бота) */
  id: number;
  /** Параметры авторизации от имени сотрудника. Может прийти и у бота с выключенной авторизацией. У бота без токенов может прийти `null`. */
  oauthClient: BotOAuthClient | null;
  /** Объект параметров вебхука */
  webhook: BotSelfWebhook;
};

/** Параметры бота с новым токеном */
export type BotSelfTokenResponse = {
  /** Идентификатор бота (совпадает с `user_id` бота) */
  id: number;
  /** Параметры авторизации от имени сотрудника. Может прийти и у бота с выключенной авторизацией. У бота без токенов может прийти `null`. */
  oauthClient: BotOAuthClient | null;
  /** Объект параметров вебхука */
  webhook: BotSelfWebhook;
  /** Новый токен бота. Возвращается один раз. */
  accessToken: string;
};

/** Параметры вебхука бота в ответах методов самого бота */
export type BotSelfWebhook = {
  /** Имя бота */
  name: string;
  /** Никнейм бота */
  nickname: string;
  /** URL исходящего вебхука. `null` или пустая строка, если адрес не задан: бот тогда получает события только из истории событий, если она включена. */
  outgoingUrl: string | null;
  /** События, на которые подписан бот */
  events: Array<BotEventName>;
  /** Условие срабатывания исходящего вебхука */
  triggerOn: BotTriggerOn;
  /** Команды бота (триггер-слова) */
  commands: Array<string>;
  /** Скоупы (права доступа) токена бота. Набор по умолчанию шире того, что можно назначить явно, поэтому здесь могут встречаться значения, недоступные для явной установки. */
  scopes: Array<string>;
  /** Шаблон форматирования входящего вебхука. `null`, если не задан. */
  template: string | null;
  /** Шаблонизатор для обработки шаблона входящего вебхука */
  templateEngine: BotTemplateEngine;
  /** Название поля проверки для верификации входящего вебхука. `null`, если не задано. */
  challengeKey: string | null;
  /** Показывать превью ссылок в сообщениях входящего вебхука. При `true` ссылки из любых сообщений этого бота, в том числе отправленных через API, получают и [боты с разворачиванием ссылок](/guides/link-previews#vebhuk-o-ssylke). */
  linkPreviewEnabled: boolean;
  /** Не присылать боту события о сообщениях, которые он отправил сам, и о реакциях на эти сообщения, кто бы их ни поставил или снял. Нажатия кнопок приходят всегда. */
  ignoreSelfMessages: boolean;
  /** Сохранять историю событий бота для последующего получения через метод истории событий */
  eventsHistoryEnabled: boolean;
  /** Ограничивает бота одной беседой или каналом: `true` — бота можно добавить только в один такой чат, `false` — в несколько. Личные чаты и треды в ограничение не входят. */
  singleChat: boolean;
  /** Роли, которым, помимо создателя, разрешено редактировать настройки бота. Создатель может редактировать всегда. Пустой массив — редактировать может только создатель. */
  canEdit: Array<BotCanEdit>;
  /** Кто может добавлять бота в чаты */
  whoCanAdd: BotWhoCanAdd;
};

/** Шаблонизатор для форматирования входящих вебхуков */
export type BotTemplateEngine = "liquid" | "mustache";

/** Запрос на выпуск токена бота */
export type BotTokenCreateRequest = {
  /** Имя токена: по нему токены различают в списке */
  name: string;
  /** Права токена. Доступны только права, которые можно выдать боту. Если не передать, токен выпускается без прав. */
  scopes?: Array<string>;
};

/** Запрос на изменение токена бота */
export type BotTokenUpdateRequest = {
  /** Новое имя токена */
  name?: string;
  /** Новые права токена. Список заменяется целиком и действует сразу, перевыпускать токен не нужно. */
  scopes?: Array<string>;
};

/** Условие срабатывания исходящего вебхука бота */
export type BotTriggerOn = "commands" | "all_messages" | "unfurl";

/** Запрос на обновление бота */
export type BotUpdateRequest = {
  /** Объект параметров вебхука редактируемого бота */
  webhook?: {
    /** Имя бота */
    name?: string;
    /** Никнейм бота: латинские буквы, цифры и `_`, в конце `_bot`, свободный в пространстве. Ник не по формату отвечает `400` на поле `bot.nickname` с кодом `invalid`, а занятый ник — с кодом `taken`. */
    nickname?: string;
    /** URL исходящего вебхука: публичный адрес с протоколом `http` или `https`. Иначе ответ `400` на поле `webhook.outgoing_url` с кодом `webhook_url_invalid`, `webhook_url_unresolved` или `webhook_url_forbidden`. Пустая строка стирает адрес, а остальные настройки и секрет подписи сохраняются. Пустая строка вместе с пустым `events` и без `events_history_enabled: true` удаляет исходящий вебхук: история событий выключается, остальные настройки возвращаются к начальным, а `secret_token` выпускается новый. Подробнее — в разделе [Через API](/guides/webhook/events#cherez-api). */
    outgoingUrl?: string;
    /** События, на которые подписан бот. Список заменяется целиком. */
    events?: Array<BotEventName>;
    /** Условие срабатывания исходящего вебхука */
    triggerOn?: BotTriggerOn;
    /** Команды бота (триггер-слова), на которые он реагирует при trigger_on = commands. Событие о сообщении приходит боту, когда первое слово текста совпадает с одной из команд целиком, с учётом регистра. Команду можно задать и без слэша в начале. Суммарная длина команд вместе с разделителями `, ` (запятая и пробел) не должна превышать 255 символов. */
    commands?: Array<string>;
    /** Скоупы (права доступа) основного токена бота. Если не указано, скоупы не меняются. Если у бота нет токена, переданные скоупы создают основной токен, но его значение не возвращается: получите его методом [Ротация токена бота](POST /bots/{id}/recreate_token). Боту доступны не все скоупы: часть из них разрешена только пользовательским ролям, и попытка назначить такой скоуп возвращает `400`. Служебные значения `bot` и `all` назначать нельзя. Скоупы меняют только создатель бота и администратор пространства, если настройки бота открывают администраторам доступ к редактированию. Другим сотрудникам запрос с этим полем отвечает `403`, даже если скоупы не меняются, и не применяет ничего из запроса. */
    scopes?: Array<string>;
    /** Шаблон форматирования входящего вебхука. Шаблон проверяется, когда в запросе меняются `template`, `template_engine` или `kind`, поэтому смена одного шаблонизатора или включение `kind: simple` проверяет и уже сохранённый шаблон. Шаблон с синтаксической ошибкой у источника `simple` даёт ответ `400` на этом поле с кодом `invalid`, и запрос не применяется. Причина приходит в `message`. */
    template?: string;
    /** Шаблонизатор для обработки шаблона входящего вебхука. Когда `kind` включает входящий вебхук, действует сохранённый шаблонизатор, а у пустого бота и после `kind: null` это `mustache`: для шаблона на Liquid передайте `template_engine: "liquid"` в том же запросе. */
    templateEngine?: BotTemplateEngine;
    /** Название поля проверки для верификации входящего вебхука */
    challengeKey?: string;
    /** Показывать превью ссылок в сообщениях входящего вебхука. При `true` ссылки из любых сообщений этого бота, в том числе отправленных через API, получают и [боты с разворачиванием ссылок](/guides/link-previews#vebhuk-o-ssylke). */
    linkPreviewEnabled?: boolean;
    /** Не присылать боту события о сообщениях, которые он отправил сам, и о реакциях на эти сообщения, кто бы их ни поставил или снял. Нажатия кнопок приходят всегда. */
    ignoreSelfMessages?: boolean;
    /** Сохранять историю событий бота для последующего получения через метод истории событий. Пачка создаёт события, только пока у бота задан `outgoing_url` или включено это поле: произошедшее без них не придёт и позже. */
    eventsHistoryEnabled?: boolean;
    /** Кто может добавлять бота в чаты */
    whoCanAdd?: BotWhoCanAdd;
    /** Роли, которым, помимо создателя, разрешено редактировать настройки бота. Создатель может редактировать всегда. Пустой массив — редактировать может только создатель. Список заменяется целиком. */
    canEdit?: Array<BotCanEdit>;
    /** Ограничивает бота одной беседой или каналом: `true` — бота можно добавить только в один такой чат, `false` — в несколько. Личные чаты и треды в ограничение не входят. */
    singleChat?: boolean;
    /** Источник входящего вебхука. Если у бота входящего вебхука не было, он включается. `null` удаляет входящий вебхук: адрес перестаёт работать, шаблон и настройки входящего вебхука сбрасываются, а при следующем включении бот получает новый адрес. Для шаблона на Liquid передайте в том же запросе `template_engine: "liquid"`. */
    kind?: BotWebhookKind | null;
    /** Домены, ссылки на которые бот разворачивает, не больше 5. Работают вместе с событием `message_link_shared`. Каждый элемент — хост без протокола, пути и порта: домен с точкой, IPv4-адрес или `localhost`. Домен не по [правилам распознавания доменов](/guides/link-previews#pravila-raspoznavaniya-domenov), например на кириллице, получает ответ `400` с кодом `invalid`. Список заменяется целиком. */
    unfurlDomains?: Array<string>;
  };
  /** Настройки авторизации от имени сотрудника. Если авторизация выключена, объект её включает, а `null` выключает: выданные сотрудниками авторизации отзываются, страница в витрине удаляется, собственные токены бота продолжают работать. Когда объект включает авторизацию, в том числе повторно, или делает клиента серверным, в `client_secret` приходит прежний секрет серверного клиента. Новый секрет выпускает метод [Ротация секрета клиента](POST /bots/{id}/rotate_client_secret). */
  oauthClient?: BotOAuthClientRequest | null;
  /** Страница бота в витрине. Доступна, только когда у бота включена авторизация. */
  promo?: BotPromoRequest;
};

/** Параметры вебхука бота */
export type BotWebhook = {
  /** Имя бота */
  name: string;
  /** Никнейм бота */
  nickname: string;
  /** URL исходящего вебхука. `null` или пустая строка, если адрес не задан: бот тогда получает события только из истории событий, если она включена. */
  outgoingUrl: string | null;
  /** События, на которые подписан бот */
  events: Array<BotEventName>;
  /** Условие срабатывания исходящего вебхука */
  triggerOn: BotTriggerOn;
  /** Команды бота (триггер-слова) */
  commands: Array<string>;
  /** Скоупы (права доступа) токена бота. Набор по умолчанию шире того, что можно назначить явно, поэтому здесь могут встречаться значения, недоступные для явной установки. */
  scopes: Array<string>;
  /** Шаблон форматирования входящего вебхука. `null`, если не задан. */
  template: string | null;
  /** Шаблонизатор для обработки шаблона входящего вебхука */
  templateEngine: BotTemplateEngine;
  /** Название поля проверки для верификации входящего вебхука. `null`, если не задано. */
  challengeKey: string | null;
  /** Показывать превью ссылок в сообщениях входящего вебхука. При `true` ссылки из любых сообщений этого бота, в том числе отправленных через API, получают и [боты с разворачиванием ссылок](/guides/link-previews#vebhuk-o-ssylke). */
  linkPreviewEnabled: boolean;
  /** Не присылать боту события о сообщениях, которые он отправил сам, и о реакциях на эти сообщения, кто бы их ни поставил или снял. Нажатия кнопок приходят всегда. */
  ignoreSelfMessages: boolean;
  /** Сохранять историю событий бота для последующего получения через метод истории событий */
  eventsHistoryEnabled: boolean;
  /** Ограничивает бота одной беседой или каналом: `true` — бота можно добавить только в один такой чат, `false` — в несколько. Личные чаты и треды в ограничение не входят. */
  singleChat: boolean;
  /** Роли, которым, помимо создателя, разрешено редактировать настройки бота. Создатель может редактировать всегда. Пустой массив — редактировать может только создатель. */
  canEdit: Array<BotCanEdit>;
  /** Кто может добавлять бота в чаты */
  whoCanAdd: BotWhoCanAdd;
  /** Источник входящего вебхука. `null`, если входящий вебхук у бота выключен. */
  kind: BotWebhookKind | null;
  /** Домены, ссылки на которые бот разворачивает */
  unfurlDomains: Array<string>;
  /** Дата и время последнего запроса на входящий вебхук бота (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ. `null`, если запросов не было. */
  lastRequestAt: string | null;
  /** Адрес входящего вебхука. `null`, если входящий вебхук у бота выключен. Приходит в ответе об одном боте токену со скоупом `bots:write`, который может управлять токенами бота (`permissions.recreate_token`). */
  url?: string | null;
  /** Секрет подписи исходящего вебхука: им подписан заголовок `Pachca-Signature`. Приходит в ответе об одном боте токену со скоупом `bots:write`, который может управлять токенами бота (`permissions.recreate_token`). */
  secretToken?: string;
  /** Тело последнего запроса на входящий вебхук бота. Длиннее 128 КБ обрезается и заканчивается на `...[truncated]`. `null`, если запросов не было. Приходит в ответе об одном боте токену со скоупом `bots:write`, который может управлять токенами бота (`permissions.recreate_token`). */
  lastRequestBody?: string | null;
};

/** Источник входящего вебхука бота */
export type BotWebhookKind = "simple" | "gitlab" | "grafana";

/** Запрос на саморегистрацию вебхука бота */
export type BotWebhookSelfUpdateRequest = {
  /** Объект параметров вебхука */
  webhook: {
    /** URL исходящего вебхука: публичный адрес с протоколом `http` или `https`. Иначе ответ `400` на поле `webhook.outgoing_url` с кодом `webhook_url_invalid`, `webhook_url_unresolved` или `webhook_url_forbidden`. Пустая строка стирает адрес: события перестают приходить на URL, а при включённой истории событий продолжают сохраняться в ней. */
    outgoingUrl: string;
  };
};

/** Кто может добавлять бота в чаты */
export type BotWhoCanAdd = "creator" | "creator_admin" | "creator_admin_user" | "anyone";

/** Кнопка */
export type Button = {
  /** Текст, отображаемый на кнопке */
  text: string;
  /** Ссылка, которая будет открыта по нажатию кнопки. У кнопки должно быть заполнено ровно одно из полей `url` и `data`. */
  url?: string;
  /** Данные, которые будут отправлены в исходящем вебхуке по нажатию кнопки. У кнопки должно быть заполнено ровно одно из полей `url` и `data`. */
  data?: string;
};

/** Ряд кнопок */
export type ButtonRowItem = Array<Button>;

/** Структура исходящего вебхука о нажатии кнопки */
export type ButtonWebhookPayload = {
  /** Тип объекта */
  type: "button";
  /** Тип события */
  event: "click";
  /** Идентификатор сообщения, к которому относится кнопка */
  messageId: number;
  /** Уникальный идентификатор события. Время жизни — 3 секунды. Может быть использован, например, для открытия представления пользователю. */
  triggerId: string;
  /** Данные нажатой кнопки */
  data: string;
  /** Идентификатор пользователя, который нажал кнопку */
  userId: number;
  /** Идентификатор чата, в котором была нажата кнопка */
  chatId: number;
  /** Дата и время отправки вебхука (UTC+0) в формате UNIX */
  webhookTimestamp: number;
};

/** Чат */
export type Chat = {
  /** Идентификатор созданного чата */
  id: number;
  /** Название беседы или канала. У личного чата пустая строка, а в методе [Поиск чатов](GET /search/chats) у него приходит полное имя собеседника, в чате с самим собой — имя владельца токена. */
  name: string;
  /** Дата и время создания чата (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ */
  createdAt: string;
  /** Идентификатор пользователя, создавшего чат */
  ownerId: number;
  /** Массив идентификаторов участников. Приостановленные и удалённые сотрудники в него не входят. */
  memberIds: Array<number>;
  /** Массив идентификаторов тегов, участников */
  groupTagIds: Array<number>;
  /** Является каналом */
  channel: boolean;
  /** Находится в архиве */
  archived: boolean;
  /** Является личным чатом */
  personal: boolean;
  /** Открытый доступ */
  public: boolean;
  /** Дата и время создания последнего сообщения в чате (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ */
  lastMessageAt: string;
  /** Ссылка на Видеочат */
  meetRoomUrl: string;
  /** Ссылка на аватар чата. `null`, если аватар не задан. */
  avatarUrl: string | null;
};

/** Состояние чатов в выборке */
export type ChatActivity = "active" | "archived";

/** Доступность чатов для пользователя */
export type ChatAvailability = "is_member" | "public";

/** Запрос на создание чата */
export type ChatCreateRequest = {
  /** Собранный объект параметров создаваемого чата */
  chat: {
    /** Название беседы или канала. Пустое название или название из одних пробелов отвечает `422` с кодом `blank`. */
    name: string;
    /** Массив идентификаторов пользователей, которые станут участниками */
    memberIds?: Array<number>;
    /** Массив идентификаторов тегов, которые станут участниками */
    groupTagIds?: Array<number>;
    /** Канал: в нём пишут создатель, админы и редакторы чата, а подписчики читают, ставят реакции и пишут в тредах. Без этого флага создаётся беседа, где пишут все участники. */
    channel?: boolean;
    /** Открытый чат: его видят все сотрудники пространства, кроме гостей и мульти-гостей, и сами вступают в него. Без этого флага чат закрытый, и в нём только добавленные участники. */
    public?: boolean;
  };
};

/** Заказанный экспорт сообщений */
export type ChatExport = {
  /** Идентификатор экспорта */
  id: number;
};

/** Роль участника чата */
export type ChatMemberRole = "admin" | "editor" | "member";

/** Роль участника чата (с фильтром все) */
export type ChatMemberRoleFilter = "all" | "owner" | "admin" | "editor" | "member";

/** Структура исходящего вебхука об участниках чата */
export type ChatMemberWebhookPayload = {
  /** Тип объекта */
  type: "chat_member";
  /** Тип события */
  event: MemberEventType;
  /** Идентификатор чата, в котором изменился состав участников */
  chatId: number;
  /** Идентификатор треда. `null`, если участники добавлены в обычный чат или канал, а не в тред. */
  threadId?: number | null;
  /** Массив идентификаторов пользователей, с которыми произошло событие, не больше 100. Если событие затронуло больше пользователей, приходит несколько вебхуков. */
  userIds: Array<number>;
  /** Дата и время события (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ssZ. В этом вебхуке время приходит без долей секунды, в отличие от остальных. */
  createdAt: string;
  /** Дата и время отправки вебхука (UTC+0) в формате UNIX */
  webhookTimestamp: number;
};

/** Позиция чтения владельца токена в чате */
export type ChatReadPosition = {
  /** Идентификатор последнего прочитанного сообщения. `null`, если в чате нет сообщений. Последнее сообщение чата учитывается, даже если его удалили, поэтому это может быть идентификатор удалённого сообщения, которого нет в списке сообщений. */
  lastReadMessageId: number | null;
};

/** Поле сортировки чатов */
export type ChatSortField = "id" | "last_message_at";

/** Тип чата */
export type ChatSubtype = "discussion" | "thread";

/** Запрос на обновление чата */
export type ChatUpdateRequest = {
  /** Собранный объект параметров обновляемого чата */
  chat: {
    /** Название беседы или канала. Пустое название или название из одних пробелов отвечает `400` с кодом `blank`. */
    name?: string;
    /** Открытый чат: его видят все сотрудники пространства, кроме гостей и мульти-гостей, и сами вступают в него. С `false` чат становится закрытым, и его видят только участники. */
    public?: boolean;
  };
};

/** Пространство */
export type Company = {
  /** Идентификатор пространства */
  id: number;
  /** Название пространства */
  name: string;
  /** Идентификатор владельца пространства */
  ownerId: number;
  /** Видят ли сотрудники и боты `email` и `phone_number` коллег. Владелец и администраторы видят их всегда, гости и мульти-гости не видят. */
  showPersonalData: boolean;
  /** Настройка «Использовать сквозные треды»: с `true` упоминание в треде добавляет в него и сотрудника, которого нет в родительском чате. */
  useGlobalThreads: boolean;
  /** Кому доступен раздел интеграций, в том числе создание ботов и их токенов. Меняется только в интерфейсе. */
  integrationsManagement: CompanyManagementAccess;
  /** Кто может создавать персональные токены. С `admins` остальные сотрудники не создают токены и не входят через браузер и CLI. Меняется только в интерфейсе. */
  apiManagement: CompanyManagementAccess;
  /** Название тарифа текстом, как в интерфейсе */
  plan: string;
  /** Выгружаются ли личные переписки с текстом и тредами в [экспорт сообщений](/guides/export). Приходит только владельцу пространства. */
  exportPersonalChats?: boolean;
};

/** Параметры бота пространства */
export type CompanyBotResponse = {
  /** Идентификатор бота (совпадает с `user_id` бота) */
  id: number;
  /** Параметры авторизации от имени сотрудника. `null` у бота, недоступного вам для редактирования. Может прийти и у бота с выключенной авторизацией, а у бота без токенов может прийти `null`. */
  oauthClient: BotOAuthClient | null;
  /** Объект параметров вебхука */
  webhook: CompanyBotWebhook;
};

/** Параметры вебхука бота пространства. Настройки бота, недоступного вам для редактирования, приходят как `null` — остаются только имя и никнейм. */
export type CompanyBotWebhook = {
  /** Имя бота */
  name: string;
  /** Никнейм бота */
  nickname: string;
  /** URL исходящего вебхука. `null` или пустая строка, если адрес не задан: бот тогда получает события только из истории событий, если она включена. */
  outgoingUrl: string | null;
  /** События, на которые подписан бот */
  events: Array<BotEventName> | null;
  /** Условие срабатывания исходящего вебхука */
  triggerOn: BotTriggerOn | null;
  /** Команды бота (триггер-слова) */
  commands: Array<string> | null;
  /** Скоупы (права доступа) токена бота */
  scopes: Array<string> | null;
  /** Шаблон форматирования входящего вебхука. `null`, если не задан. */
  template: string | null;
  /** Шаблонизатор для обработки шаблона входящего вебхука */
  templateEngine: BotTemplateEngine | null;
  /** Название поля проверки для верификации входящего вебхука. `null`, если не задано. */
  challengeKey: string | null;
  /** Показывать превью ссылок в сообщениях входящего вебхука. При `true` ссылки из любых сообщений этого бота, в том числе отправленных через API, получают и [боты с разворачиванием ссылок](/guides/link-previews#vebhuk-o-ssylke). */
  linkPreviewEnabled: boolean | null;
  /** Не присылать боту события о сообщениях, которые он отправил сам, и о реакциях на эти сообщения, кто бы их ни поставил или снял. Нажатия кнопок приходят всегда. */
  ignoreSelfMessages: boolean | null;
  /** Сохранять историю событий бота для последующего получения через метод истории событий */
  eventsHistoryEnabled: boolean | null;
  /** Ограничивает бота одной беседой или каналом: `true` — бота можно добавить только в один такой чат, `false` — в несколько. Личные чаты и треды в ограничение не входят. */
  singleChat: boolean | null;
  /** Роли, которым, помимо создателя, разрешено редактировать настройки бота. Создатель может редактировать всегда. Пустой массив — редактировать может только создатель. */
  canEdit: Array<BotCanEdit> | null;
  /** Кто может добавлять бота в чаты */
  whoCanAdd: BotWhoCanAdd | null;
};

/** Кто может пользоваться возможностью в пространстве */
export type CompanyManagementAccess = "all" | "admins";

/** Структура исходящего вебхука об участниках пространства */
export type CompanyMemberWebhookPayload = {
  /** Тип объекта */
  type: "company_member";
  /** Тип события */
  event: UserEventType;
  /** Массив идентификаторов пользователей, с которыми произошло событие, не больше 100. Если событие затронуло больше пользователей, приходит несколько вебхуков. */
  userIds: Array<number>;
  /** Дата и время события (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ssZ. В этом вебхуке время приходит без долей секунды, в отличие от остальных. */
  createdAt: string;
  /** Дата и время отправки вебхука (UTC+0) в формате UNIX */
  webhookTimestamp: number;
};

/** Новые значения пространства. Поля передаются без обёртки, перезаписываются только переданные. Поля `api_management` и `integrations_management` в теле не учитываются, ответ при этом успешный. */
export type CompanyUpdateRequest = {
  /** Новое название пространства */
  name?: string;
  /** Видят ли сотрудники и боты `email` и `phone_number` коллег */
  showPersonalData?: boolean;
  /** Включена ли настройка «Использовать сквозные треды» */
  useGlobalThreads?: boolean;
};

/** Дополнительное поле */
export type CustomProperty = {
  /** Идентификатор поля */
  id: number;
  /** Название поля */
  name: string;
  /** Тип поля */
  dataType: CustomPropertyDataType;
  /** Значение. Возвращается `null`, если поле не заполнено. Число — целое и передаётся строкой, например `"42"`, дата — в формате ISO 8601. */
  value: string | null;
};

/** Тип данных дополнительного поля */
export type CustomPropertyDataType = "string" | "number" | "date" | "link";

/** Дополнительное поле */
export type CustomPropertyDefinition = {
  /** Идентификатор поля */
  id: number;
  /** Название поля */
  name: string;
  /** Тип поля */
  dataType: CustomPropertyDataType;
};

/** Черновик или отложенное сообщение */
export type Draft = {
  /** Идентификатор черновика */
  id: number;
  /** Куда уйдёт сообщение: в беседу или канал, в тред либо в личную переписку с сотрудником */
  entityType: MessageEntityType | null;
  /** Идентификатор того, что названо в `entity_type`: беседы или канала, треда либо сотрудника */
  entityId: number | null;
  /** Идентификатор чата, в котором лежит черновик. У черновика треда это чат самого треда. */
  chatId: number | null;
  /** Текст черновика. У черновика из одних вложений приходит пустая строка, а не `null`. */
  content: string;
  /** Идентификатор сообщения, ответом на которое уйдёт черновик. `null`, если это не ответ. */
  parentMessageId: number | null;
  /** Прикреплённые файлы */
  files: Array<File>;
  /** Голосовое сообщение. `null`, если голосового вложения нет. Расшифровка в `transcript` и её статус в `transcript_status` у черновика всегда `null` — она запускается после отправки. */
  voiceContent: VoiceContent | null;
  /** Расписание отправки. `null` у обычного черновика. */
  schedule: DraftSchedule | null;
  /** Ближайшая отправка (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ. `null` у обычного черновика. */
  nextSendAt: string | null;
  /** Дата и время создания (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ */
  createdAt: string;
  /** Дата и время последнего изменения (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ */
  updatedAt: string;
};

/** Запрос на создание черновика */
export type DraftCreateRequest = {
  /** Собранный объект параметров черновика */
  draft: {
    /** Куда пишется черновик: в беседу или канал, в тред либо в личную переписку с сотрудником */
    entityType: MessageEntityType;
    /** Идентификатор того, что названо в `entity_type`: беседы или канала, треда либо сотрудника */
    entityId: number;
    /** Текст черновика. Можно не передавать, если есть вложения, но пустым черновик быть не может. Поддерживает упоминания, как текст в методе [Новое сообщение](POST /messages). `<@user_id>` остаётся в тексте черновика как передан, а при отправке становится `@nickname`. До 40 000 байт в UTF-8. */
    content?: string;
    /** Идентификатор сообщения, ответом на которое уйдёт черновик. Сообщение должно быть в том же чате. */
    parentMessageId?: number | null;
    /** Прикрепляемые файлы, не больше десяти */
    files?: Array<DraftFileRequest>;
    /** Расписание отправки. С ним создаётся отложенное сообщение, без него — обычный черновик. */
    schedule?: DraftScheduleRequest | null;
  };
};

/** Прикрепляемый к черновику файл */
export type DraftFileRequest = {
  /** Идентификатор уже прикреплённого файла. Передаётся при редактировании, чтобы сохранить вложение как есть. У нового файла не указывается. */
  id?: number;
  /** Путь к файлу, полученный в методе [Загрузка файла](POST /direct_url) */
  key: string;
  /** Название файла, которое вы хотите отображать пользователю. Действует для нового файла: расширение должно совпадать с расширением файла в `key`, иначе ответ будет 422 с кодом `wrong_params`. */
  name: string;
  /** Тип файла */
  fileType?: FileType;
  /** Размер файла в байтах, отображаемый пользователю. Если не передан или равен 0, Пачка возьмёт размер из хранилища вскоре после сохранения. */
  size?: number;
  /** Ширина изображения в пикселях */
  width?: number;
  /** Высота изображения в пикселях */
  height?: number;
  /** Длительность в миллисекундах: обязательна у голосового сообщения (`voice`), по желанию у видео (`video`), у остальных типов не сохраняется. Файл с длительностью без `file_type` считается голосовым. Голосовое сообщение длиннее 30 минут (1 800 000 мс) отклоняется с `422` и кодом `wrong_params`. */
  durationMs?: number;
  /** Форма волны для визуализации. Обязательна для голосового сообщения (`file_type` — `voice`). */
  waveform?: string;
};

/** Правило повтора отложенного сообщения */
export type DraftRepetition = {
  /** Периодичность */
  interval: DraftRepetitionInterval;
  /** Дни недели, по которым уходит сообщение: 0 — воскресенье, 6 — суббота. Приходит только при периодичности `weekly`. */
  days?: Array<number>;
  /** Какой по счёту день недели в месяце: от 1 до 4 — первый, второй, третий, четвёртый, 5 — последний. Приходит только при периодичности по месяцам, а `null` в ней означает повтор по числу месяца из `start_date`. */
  nthDay?: number | null;
};

/** Периодичность повтора отложенного сообщения */
export type DraftRepetitionInterval = "once" | "daily" | "weekly" | "monthly" | "every_2_months" | "every_3_months" | "every_4_months" | "every_6_months" | "yearly";

/** Правило повтора в запросе */
export type DraftRepetitionRequest = {
  /** Периодичность */
  interval: DraftRepetitionInterval;
  /** Дни недели, по которым уходит сообщение: 0 — воскресенье, 6 — суббота, без повторов. Учитывается только при периодичности `weekly`, а если не передать, берётся день недели из `start_date`. */
  days?: Array<Weekday>;
  /** Какой по счёту день недели в месяце: от 1 до 4 — первый, второй, третий, четвёртый, 5 — последний. Учитывается только при периодичности по месяцам, а без него повтор идёт по числу месяца из `start_date`. */
  nthDay?: number | null;
};

/** Расписание отправки отложенного сообщения */
export type DraftSchedule = {
  /** Первая отправка (ISO-8601). Из неё берутся время суток, число месяца и день недели, по которым дальше строится повтор. */
  startDate: string;
  /** Дата, после которой повтор прекращается (ISO-8601). `null`, если конец не задан. */
  endDate: string | null;
  /** Правило повтора */
  repetition: DraftRepetition;
};

/** Расписание отправки в запросе */
export type DraftScheduleRequest = {
  /** Первая отправка (ISO-8601). Из неё берутся время суток, число месяца и день недели, по которым дальше строится повтор. У разовой отправки (`once`) смещение вида `+03:00` учитывается, а время без смещения считается UTC. У повтора время суток, число и день недели берутся как записаны и отсчитываются по UTC: `10:00+03:00` уходит в 10:00 UTC. Поэтому повтор задают в UTC, с `Z`, переведя в него местное время, и сверяют `next_send_at` в ответе. */
  startDate: string;
  /** Дата, после которой повтор прекращается (ISO-8601). Без неё повтор идёт бессрочно. */
  endDate?: string | null;
  /** Правило повтора */
  repetition: DraftRepetitionRequest;
};

/** Что возвращать в списке черновиков */
export type DraftType = "regular" | "scheduled" | "all";

/** Запрос на обновление черновика */
export type DraftUpdateRequest = {
  /** Собранный объект изменяемых параметров черновика */
  draft: {
    /** Текст черновика. Поддерживает упоминания, как текст в методе [Новое сообщение](POST /messages). `<@user_id>` остаётся в тексте черновика как передан, а при отправке становится `@nickname`. До 40 000 байт в UTF-8. */
    content?: string;
    /** Идентификатор сообщения, ответом на которое уйдёт черновик. `null` снимает ответ. */
    parentMessageId?: number | null;
    /** Прикрепляемые файлы, не больше десяти. Переданный массив заменяет прежний состав: пустой снимает все вложения, а чтобы сохранить уже прикреплённый файл, передайте его с `id`. Без этого поля вложения остаются как были. */
    files?: Array<DraftFileRequest>;
    /** Расписание отправки. У обычного черновика оно превращает его в отложенное сообщение. У отложенного расписание можно изменить, но не снять: `null` в ответ даст `422` с кодом `draft_type_change_forbidden`. */
    schedule?: DraftScheduleRequest | null;
  };
};

/** Запрос на экспорт сообщений */
export type ExportRequest = {
  /** Дата начала для экспорта в формате YYYY-MM-DD. Если прислать дату со временем, время молча отбрасывается — экспорт всегда идёт по календарным дням. */
  startAt: string;
  /** Дата окончания для экспорта в формате YYYY-MM-DD, включительно. Если прислать дату со временем, время молча отбрасывается. */
  endAt: string;
  /** Адрес, на который придёт вебхук с номером готовой выгрузки, когда архив будет собран. Номер приходит в поле `export_id`, а всё тело вебхука описано в разделе [Экспорт](/guides/export). */
  webhookUrl?: string;
  /** Массив идентификаторов чатов. Указывается, если нужно получить сообщения только некоторых чатов. Тред выгружается вместе с чатом родительского сообщения, поэтому идентификатор треда в списке ничего не добавляет, а самостоятельный тред не выгружается. Что попадает в архив, сказано в разделе [Экспорт](/guides/export#chto-popadaet-v-arhiv). */
  chatIds?: Array<number>;
  /** Пропуск формирования файла со списком чатов (chats.json) */
  skipChatsFile?: boolean;
};

/** Вебхук о готовой выгрузке: приходит на адрес из `webhook_url`, когда архив собран */
export type ExportWebhookPayload = {
  /** Тип объекта */
  type: "export";
  /** Тип события */
  event: "ready";
  /** Идентификатор экспорта: по нему архив отдаёт метод [Скачать архив экспорта](GET /chats/exports/{id}) */
  exportId: number;
  /** Дата и время заказа выгрузки (ISO-8601) */
  createdAt: string;
};

/** Файл */
export type File = {
  /** Идентификатор файла */
  id: number;
  /** Путь к файлу */
  key: string;
  /** Название файла с расширением */
  name: string;
  /** Тип файла */
  fileType: FileType;
  /** Ссылка на скачивание файла. Обычно ведёт прямо в хранилище и действует до 7 дней, а оставшийся срок может быть меньше — если такая ссылка вернула `403`, запросите сообщение заново и получите свежую. Если в пространстве включено шифрование или задан безопасный контур, ссылка ведёт на [Скачивание файла](GET /files/{id}): забирать такой файл нужно с заголовком `Authorization`, а токену нужен скоуп `files:read`. */
  url: string;
  /** Ширина изображения в пикселях. `null` для файлов, не являющихся изображением, а также если размер не был передан при загрузке. */
  width?: number | null;
  /** Высота изображения в пикселях. `null` для файлов, не являющихся изображением, а также если размер не был передан при загрузке. */
  height?: number | null;
  /** Длительность в миллисекундах у голосового сообщения и видеофайла. `null` у остальных файлов и если длительность не была передана при загрузке. */
  durationMs?: number | null;
};

/** Что отдать вместо исходного файла */
export type FileTarget = "pdf_preview" | "pdf_first_page" | "thumb" | "image";

/** Тип файла */
export type FileType = "file" | "image" | "audio" | "voice" | "video";

export type FileUploadRequest = {
  /** Параметр Content-Disposition, полученный в ответе на запрос [Получение подписи, ключа и других параметров](POST /uploads) */
  "Content-Disposition": string;
  /** Параметр acl, полученный в ответе на запрос [Получение подписи, ключа и других параметров](POST /uploads). Передаётся, если пришёл в ответе. */
  acl?: string;
  /** Параметр policy, полученный в ответе на запрос [Получение подписи, ключа и других параметров](POST /uploads) */
  policy: string;
  /** Параметр x-amz-credential, полученный в ответе на запрос [Получение подписи, ключа и других параметров](POST /uploads) */
  "x-amz-credential": string;
  /** Параметр x-amz-algorithm, полученный в ответе на запрос [Получение подписи, ключа и других параметров](POST /uploads) */
  "x-amz-algorithm": string;
  /** Параметр x-amz-date, полученный в ответе на запрос [Получение подписи, ключа и других параметров](POST /uploads) */
  "x-amz-date": string;
  /** Параметр x-amz-signature, полученный в ответе на запрос [Получение подписи, ключа и других параметров](POST /uploads) */
  "x-amz-signature": string;
  /** Параметр key, полученный в ответе на запрос [Получение подписи, ключа и других параметров](POST /uploads) */
  key: string;
  /** Параметр bucket, полученный в ответе на запрос [Получение подписи, ключа и других параметров](POST /uploads). Передаётся, если пришёл в ответе. */
  bucket?: string;
  /** Файл для загрузки */
  file: PachcaFileInput;
};

/** Информация о пересланном сообщении */
export type Forwarding = {
  /** Идентификатор оригинального сообщения */
  originalMessageId: number;
  /** Идентификатор чата, в котором находится оригинальное сообщение */
  originalChatId: number;
  /** Идентификатор пользователя, создавшего оригинальное сообщение */
  authorId: number;
  /** Дата и время создания оригинального сообщения (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ */
  originalCreatedAt: string;
  /** Идентификатор треда, в котором находится оригинальное сообщение */
  originalThreadId: number | null;
  /** Идентификатор сообщения, к которому был создан тред, в котором находится оригинальное сообщение. `null`, если оригинальное сообщение было не в треде или тред создан без привязки к сообщению. */
  originalThreadMessageId: number | null;
  /** Идентификатор чата сообщения, к которому был создан тред, в котором находится оригинальное сообщение. `null`, если оригинальное сообщение было не в треде или тред создан без привязки к сообщению. */
  originalThreadParentChatId: number | null;
};

/** Тег */
export type GroupTag = {
  /** Идентификатор тега */
  id: number;
  /** Название тега */
  name: string;
  /** Количество сотрудников, которые имеют этот тег */
  usersCount: number;
};

/** Запрос на создание или редактирование тега */
export type GroupTagRequest = {
  groupTag: {
    /** Название тега */
    name: string;
  };
};

/** Запрос на добавление сообщения в важные */
export type ImportantMessageRequest = {
  /** Идентификатор сообщения */
  messageId: number;
};

/** Ссылка-приглашение в пространство */
export type InviteLink = {
  /** Ссылка, по которой сотрудник входит в пространство */
  url: string;
  /** Дата и время, когда ссылка перестанет работать (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ */
  expiresAt: string;
};

/** Статус приглашения пользователя */
export type InviteStatus = "confirmed" | "sent";

/** Данные для предпросмотра ссылки */
export type LinkPreview = {
  /** Заголовок */
  title: string;
  /** Описание */
  description: string;
  /** Публичная ссылка на изображение (если вы хотите загрузить файл изображения в Пачку, то используйте параметр image) */
  imageUrl?: string;
  /** Изображение */
  image?: {
    /** Путь к изображению, полученный в методе [Загрузка файла](POST /direct_url) */
    key: string;
    /** Название изображения (рекомендуется писать вместе с расширением) */
    name: string;
    /** Размер изображения в байтах */
    size?: number;
  };
};

/** Запрос на разворачивание ссылок */
export type LinkPreviewsRequest = {
  /** `JSON` карта предпросмотров ссылок, где каждый ключ — `url` из массива `links` события `message_link_shared` (`type: message`, `event: link_shared`) */
  linkPreviews: Record<string, LinkPreview>;
};

/** Структура исходящего вебхука о разворачивании ссылок */
export type LinkSharedWebhookPayload = {
  /** Тип объекта */
  type: "message";
  /** Тип события */
  event: "link_shared";
  /** Идентификатор чата, в котором обнаружена ссылка */
  chatId: number;
  /** Идентификатор сообщения, содержащего ссылку */
  messageId: number;
  /** Массив обнаруженных ссылок на отслеживаемые домены */
  links: Array<WebhookLink>;
  /** Идентификатор отправителя сообщения */
  userId: number;
  /** Тип сущности, к которой относится сообщение со ссылкой */
  entityType: MessageEntityType;
  /** Идентификатор сущности: беседы или канала, треда. В личной переписке `null`: бот в ней не участвует, и собеседника ему не раскрывают. */
  entityId: number | null;
  /** Тред, в котором отправлено сообщение со ссылкой. `null`, если сообщение отправлено не в треде. */
  thread: WebhookMessageThread | null;
  /** Через что отправлено сообщение со ссылкой токеном сотрудника, так же, как поле `source` в объекте сообщения. В записях истории событий, сохранённых до появления поля, его нет. */
  source?: MessageSource | null;
  /** Программа, через которую отправлено сообщение со ссылкой, так же, как поле `application` в объекте сообщения. В записях истории событий, сохранённых до появления поля, его нет. */
  application?: MessageApplication | null;
  /** Дата и время создания сообщения (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ */
  createdAt: string;
  /** Дата и время отправки вебхука (UTC+0) в формате UNIX */
  webhookTimestamp: number;
};

/** Запрос на отметку чата непрочитанным */
export type MarkChatUnreadRequest = {
  /** Идентификатор сообщения, с которого чат становится непрочитанным: оно и все сообщения после него. Если не передать, непрочитанным становится последнее сообщение. */
  messageId?: number;
};

/** Тип события webhook для участников */
export type MemberEventType = "add" | "remove";

/** Сообщение */
export type Message = {
  /** Идентификатор сообщения */
  id: number;
  /** Тип сущности, к которой относится сообщение */
  entityType: MessageEntityType;
  /** Идентификатор сущности, к которой относится сообщение (беседы/канала, треда или пользователя) */
  entityId: number;
  /** Идентификатор чата, в котором находится сообщение */
  chatId: number;
  /** Идентификатор корневого чата. Для сообщения в треде — идентификатор чата, где находится родительское сообщение треда. У самостоятельного треда родительского сообщения нет, и `root_chat_id` совпадает с `chat_id`, как у обычных сообщений. Сообщение треда узнают по `entity_type: "thread"`. */
  rootChatId: number;
  /** Текст сообщения. Пустая строка, если текста нет: например, у сообщения из одних вложений или у стикера. Сам стикер API не отдаёт, такое сообщение приходит с пустым `files`, а отправить стикер через API нельзя. */
  content: string;
  /** Идентификатор пользователя, создавшего сообщение */
  userId: number;
  /** Дата и время создания сообщения (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ */
  createdAt: string;
  /** Прямая ссылка на сообщение */
  url: string;
  /** Прикрепленные файлы */
  files: Array<File>;
  /** Данные голосового сообщения. Заполняется только для голосовых сообщений (`file_type` файла — `voice`), иначе `null`. */
  voiceContent: VoiceContent | null;
  /** Массив строк, каждая из которых представлена массивом кнопок. `null`, если при отправке поле `buttons` не передавали, и у удалённого сообщения. Пустые `buttons` при отправке или правке приходят как `[]`: сообщение без кнопок узнают и по `null`, и по пустому массиву. */
  buttons: Array<Array<Button>> | null;
  /** Тред, созданный к этому сообщению. `null`, если тред не создан, а также у сообщений, которые сами находятся внутри треда. */
  thread: {
    /** Идентификатор треда. Чтобы написать в тред, передайте его в `entity_id` метода [Новое сообщение](POST /messages) с `entity_type: "thread"`. */
    id: number;
    /** Идентификатор чата треда. По нему читают сообщения треда методом [Список сообщений чата](GET /messages). */
    chatId: number;
  } | null;
  /** Информация о пересланном сообщении. `null`, если сообщение не является пересланным. */
  forwarding: Forwarding | null;
  /** Идентификатор сообщения, к которому написан ответ. `null`, если сообщение не является ответом на другое сообщение. */
  parentMessageId: number | null;
  /** Ссылка на аватарку отправителя сообщения. Поле присутствует только у сообщений от ботов; у сообщений от сотрудников его в ответе нет. `null`, если бот не переопределял значение при отправке. */
  displayAvatarUrl?: string | null;
  /** Полное имя отправителя сообщения. Поле присутствует только у сообщений от ботов; у сообщений от сотрудников его в ответе нет. `null`, если бот не переопределял значение при отправке. */
  displayName?: string | null;
  /** Дата и время последнего изменения сообщения (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ. Заполняется уже при создании сообщения и обычно отличается от `created_at` на доли секунды или больше: у `created_at` доли секунды всегда нулевые. `null` у сообщений, отправленных до появления этого поля. */
  changedAt: string | null;
  /** Дата и время удаления сообщения (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ. `null` у неудалённых сообщений. В списке сообщений удалённые не возвращаются. */
  deletedAt: string | null;
  /** Сообщение в разделе «Важное» владельца токена. У токена бота всегда `false`. */
  important: boolean;
  /** Через что отправлено сообщение токеном сотрудника, как в значке «Отправлено через …» на аватаре. `null` у сообщения, которое отправили из приложения Пачки, в том числе из черновика, у сообщений ботов, у отложенного сообщения, которое ушло по расписанию, и у сообщений, отправленных до появления значка. Подробнее в разделе [Как выглядят сообщения](/api/authorization#kak-vyglyadyat-soobscheniya). */
  source: MessageSource | null;
  /** Программа, через которую отправлено сообщение, при `source: "application"`. В остальных случаях `null`. */
  application: MessageApplication | null;
};

/** Программа, через которую отправлено сообщение */
export type MessageApplication = {
  /** Идентификатор программы */
  id: number;
  /** Название программы, как в подсказке «Отправлено через …» на аватаре: «Pachca CLI», название клиента MCP или имя бота. У старых сообщений тоже приходит текущее название. Клиент MCP задаёт название сам в документе, который публикует на своём домене, поэтому программу узнают по `id`. */
  name: string;
};

/** Запрос на создание сообщения */
export type MessageCreateRequest = {
  /** Собранный объект параметров создаваемого сообщения */
  message: {
    /** Тип сущности. Регистр значения не учитывается. Значение вне списка возвращает `400` с кодом `invalid`. */
    entityType?: MessageEntityType;
    /** Идентификатор того, что названо в `entity_type`: беседы или канала, треда либо пользователя. У треда их два: `id` треда указывают с `entity_type: "thread"`, а его `chat_id` — с `discussion`, как у любого чата. */
    entityId: number;
    /** Текст сообщения. Обязателен, если к сообщению не приложены файлы. Поддерживает упоминания: `@nickname` или `<@user_id>` (будет автоматически преобразовано в `@nickname`). Ник берут из ответа метода, а `user_id` — из данных: ник, составленный из имени, никого не упоминает. `@all` упоминает всех участников чата, `@here` — тех, кто сейчас в сети, а `@` с названием тега без пробелов — сотрудников этого тега. Имя без `@` и упоминание внутри строчного кода или блока кода упоминанием не считаются. У мульти-гостя `<@user_id>` недоступного ему сотрудника остаётся в тексте как есть. До 40 000 байт в UTF-8, для кириллицы это около 20 000 символов. Сообщение уходит под именем владельца токена, у бота — с бейджем «Бот». */
    content?: string;
    /** Прикрепляемые файлы */
    files?: Array<{
      /** Путь к файлу, полученный в методе [Загрузка файла](POST /direct_url) */
      key: string;
      /** Название файла, которое вы хотите отображать пользователю. Расширение должно совпадать с расширением файла в `key`, иначе ответ будет 422 с кодом `wrong_params`. */
      name: string;
      /** Тип файла. Из запроса учитываются `voice`, `video` и `file`: с `file` изображение отправляется обычным файлом. Без типа изображение или аудиофайл Пачка определяет по расширению. Файл с `duration_ms` без `file_type` считается голосовым. Голосовое сообщение (`voice`) отправляют с персональным токеном, а с токеном бота ответ `403`. */
      fileType?: FileType;
      /** Размер файла в байтах, отображаемый пользователю. Если не передан или равен 0, Пачка возьмёт размер из хранилища вскоре после сохранения. */
      size?: number;
      /** Ширина изображения в px (используется в случае, если file_type указан как image) */
      width?: number;
      /** Высота изображения в px (используется в случае, если file_type указан как image) */
      height?: number;
      /** Длительность в миллисекундах: обязательна у голосового сообщения (`voice`), по желанию у видео (`video`), у остальных типов не сохраняется. Голосовое сообщение длиннее 30 минут (1 800 000 мс) отклоняется с `422` и кодом `wrong_params`. */
      durationMs?: number;
      /** Форма волны для визуализации голосового сообщения. Обязательно для голосовых сообщений (`file_type` — `voice`), для других типов не используется. */
      waveform?: string;
    }>;
    /** Массив строк, каждая из которых представлена массивом кнопок. Максимум 100 кнопок у сообщения, до 8 кнопок в строке. Кнопки показываются под текстом. Кнопка с `url` ведёт по ссылке, кто бы ни отправил сообщение, и события не создаёт. Кнопка с `data` работает в сообщении бота: нажатие на неё приходит событием `button_click` тому боту, который отправил сообщение, а вместе с ним `trigger_id` — на открытие формы по нему есть 3 секунды, метод [Открытие представления](POST /views/open). Нажатие приходит, пока бот состоит в чате сообщения, а у сообщения в треде — в треде или в его родительском чате. Подробности — в разделе [Кнопки](/guides/buttons). */
    buttons?: Array<ButtonRowItem>;
    /** Идентификатор сообщения, на которое вы отвечаете с цитатой. Ответить можно на сообщение в любом чате, в том числе в треде: ответ отправляют в тот же чат или тред, где лежит это сообщение, иначе запрос вернёт ошибку `422`. Чтобы написать в тред под сообщением, укажите `entity_type: "thread"` и `id` треда в `entity_id`. */
    parentMessageId?: number;
    /** Ссылка на специальную аватарку отправителя для этого сообщения. Использование этого поля возможно только с access_token бота. До 255 байт в UTF-8. */
    displayAvatarUrl?: string;
    /** Полное специальное имя отправителя для этого сообщения. Вместе с `display_avatar_url` бот подписывает сообщение чужим именем и аватаром, и только это сообщение. Бейдж «Бот» остаётся, а в профиле отправителя видно настоящего бота. Так показывают автора из другой системы, когда переносят в Пачку чужую переписку. С личным токеном поле недоступно, ответ `403`. До 255 байт в UTF-8, для кириллицы это около 127 символов. Подробности — в разделе [Боты](/guides/bots/overview). */
    displayName?: string;
    /** Пропуск добавления упомянутых сотрудников в тред. В треде упоминание работает ещё и как приглашение: упомянутого сотрудника, которого в треде нет, Пачка туда добавляет, и он получает доступ к треду и родительскому сообщению. Если в пространстве включена настройка «Использовать сквозные треды» (так по умолчанию), упоминание добавляет и сотрудника не из родительского чата, а с `true` в этом поле упоминание никого не добавляет, и тот, кого в треде нет, не получает и уведомления. Упоминание от гостя или мульти-гостя при этом добавляет только тех, с кем у автора есть общий чат. Если настройка выключена, упоминание добавляет только участников родительского чата, и это поле ничего не меняет. В беседе и канале упоминание никого не добавляет, и этот параметр там ничего не меняет. */
    skipInviteMentions?: boolean;
  };
  /** Отображение предпросмотра первой найденной ссылки в тексте сообщения */
  linkPreview?: boolean;
};

/** Тип сущности для сообщений */
export type MessageEntityType = "discussion" | "thread" | "user";

/** Что произошло с состоянием сообщения */
export type MessageHistoryAction = "edited" | "deleted" | "current" | "unknown";

/** Файл в состоянии сообщения. Ссылки на скачивание нет. В старых записях часть полей может отсутствовать или прийти `null`. */
export type MessageHistoryFile = {
  /** Идентификатор файла */
  id?: number | null;
  /** Название файла с расширением */
  name?: string | null;
  /** Тип файла */
  fileType?: FileType | null;
  /** Размер файла в байтах */
  size?: number | null;
};

/** Сообщение, историю которого запросили. Текста в нём нет: текст приходит в состояниях. */
export type MessageHistoryMessage = {
  /** Идентификатор сообщения */
  id: number;
  /** Идентификатор чата сообщения. У сообщения в треде это чат сообщения-родителя треда, а у самостоятельного треда чат самого треда. */
  chatId: number;
  /** Идентификатор чата треда. `null`, если сообщение не в треде. */
  threadChatId: number | null;
  /** Идентификатор отправителя. У пересланного сообщения это тот, кто его переслал. */
  userId: number;
  /** Идентификатор автора исходного сообщения, если сообщение переслали. `null` у сообщения, которое не пересылали. */
  authorId: number | null;
  /** Дата и время создания сообщения (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ */
  createdAt: string;
  /** Дата и время удаления сообщения (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ. `null`, если сообщение не удалено. */
  deletedAt: string | null;
};

/** Полнота истории */
export type MessageHistoryMeta = {
  /** Ранние состояния известны не полностью: сообщение создано до 22 апреля 2026 года, удалено до 15 августа 2026 года, удалено без снимка на момент удаления или изменения его файлов нельзя восстановить однозначно. */
  historyIsPartial: boolean;
  /** Изменений больше 50: в историю вошли только 50 последних. */
  truncated: boolean;
};

/** История сообщения */
export type MessageHistoryResponse = {
  /** Сообщение, историю которого запросили */
  message: MessageHistoryMessage;
  /** Состояния сообщения от самого раннего к последнему. В историю входят 50 последних изменений. У удалённого сообщения без сохранённых состояний массив пустой, у сообщения, которое не меняли, в нём одно текущее состояние. */
  data: Array<MessageHistoryState>;
  /** Полнота истории */
  meta: MessageHistoryMeta;
};

/** Кто изменил сообщение */
export type MessageHistorySource = "employee" | "bot" | "dlp" | "system";

/** Состояние сообщения: текст и файлы до изменения, которое его закончило, и само это изменение */
export type MessageHistoryState = {
  /** Идентификатор изменения, которым закончилось состояние. Совпадает с `message_version_id` событий `message_updated` и `message_deleted` в [журнале аудита](GET /audit_events). `null` у текущего состояния. */
  versionId: number | null;
  /** Идентификатор сотрудника или бота, который внёс изменение. У изменений правила DLP и самой Пачки это отправитель сообщения. `null` у текущего состояния. */
  editorId: number | null;
  /** Дата и время изменения (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ. У текущего состояния это время последнего изменения сообщения, у давно не менявшегося сообщения может прийти `null`. */
  changedAt: string | null;
  /** Чем закончилось состояние */
  action: MessageHistoryAction;
  /** Кто внёс изменение. `null` у текущего состояния и в старых записях. */
  source: MessageHistorySource | null;
  /** Текст скрыт правилом DLP: вместо него приходит `***`, прежний текст не восстанавливается. */
  dlpMasked: boolean;
  /** Текст без форматирования, если сообщение хранит текст в таком виде. `null`, если такого текста нет или его не удалось получить. */
  text: string | null;
  /** Почему не пришёл текст в `text` или `content`. `null`, если текст пришёл или его в состоянии нет. В личной переписке при выключенной выгрузке личных переписок приходит `personal_chat_rule` у каждого состояния, даже без текста. */
  textUnavailableReason: MessageTextUnavailableReason | null;
  /** Текст в Markdown, если сообщение хранит текст в таком виде. Пустая строка или `null`, если текст хранится в `text`, текста в состоянии нет или его не удалось получить. */
  content: string | null;
  /** Файлы сообщения в этом состоянии */
  files: Array<MessageHistoryFile>;
};

/** Сортировка результатов поиска сообщений */
export type MessageSearchSort = "created_at" | "relevance";

/** Поле сортировки сообщений */
export type MessageSortField = "id";

/** Через что отправлено сообщение токеном сотрудника */
export type MessageSource = "application" | "personal_token";

/** Почему текст состояния не пришёл */
export type MessageTextUnavailableReason = "personal_chat_rule" | "no_key_snapshot" | "decrypt_failed";

/** Запрос на редактирование сообщения */
export type MessageUpdateRequest = {
  /** Собранный объект параметров редактируемого сообщения */
  message: {
    /** Текст сообщения. Поддерживает упоминания: `@nickname` или `<@user_id>` (будет автоматически преобразовано в `@nickname`). Ник берут из ответа метода, а `user_id` — из данных: ник, составленный из имени, никого не упоминает. У мульти-гостя `<@user_id>` недоступного ему сотрудника остаётся в тексте как есть. До 40 000 байт в UTF-8, для кириллицы это около 20 000 символов. */
    content?: string;
    /** Прикрепляемые файлы. Переданный набор заменяет прежний: чтобы оставить уже приложенный файл, передайте его снова с тем же `key`. Такой файл остаётся прежним вложением с тем же `id` и названием, а его поля из запроса не применяются. Чтобы показать файл под другим названием, загрузите его заново. */
    files?: Array<{
      /** Путь к файлу, полученный в методе [Загрузка файла](POST /direct_url) */
      key: string;
      /** Название файла, которое вы хотите отображать пользователю. Действует для нового файла: расширение должно совпадать с расширением файла в `key`, иначе ответ будет 422 с кодом `wrong_params`. */
      name: string;
      /** Тип файла. Голосовой файл правкой не прикрепить: файл с `file_type: voice` или с `duration_ms` без `file_type` отклоняется. У видео указывайте `file_type: video`. */
      fileType?: FileType;
      /** Размер файла в байтах, отображаемый пользователю. Если не передан или равен 0, Пачка возьмёт размер из хранилища вскоре после сохранения. */
      size?: number;
      /** Ширина изображения в px (используется в случае, если file_type указан как image) */
      width?: number;
      /** Высота изображения в px (используется в случае, если file_type указан как image) */
      height?: number;
      /** Длительность видео (`video`) в миллисекундах, по желанию. У остальных типов не сохраняется. Без `file_type` файл с длительностью считается голосовым, и правка отклоняется. */
      durationMs?: number;
      /** При редактировании не используется: значение не сохраняется. */
      waveform?: string;
    }>;
    /** Массив строк, каждая из которых представлена массивом кнопок. Максимум 100 кнопок у сообщения, до 8 кнопок в строке. Для удаления кнопок пришлите пустой массив. */
    buttons?: Array<ButtonRowItem>;
    /** Ссылка на специальную аватарку отправителя для этого сообщения. Использование этого поля возможно только с access_token бота. До 255 байт в UTF-8. */
    displayAvatarUrl?: string;
    /** Полное специальное имя отправителя для этого сообщения. Использование этого поля возможно только с access_token бота. До 255 байт в UTF-8, для кириллицы это около 127 символов. */
    displayName?: string;
  };
};

/** Структура исходящего вебхука о сообщении */
export type MessageWebhookPayload = {
  /** Тип объекта */
  type: "message";
  /** Идентификатор сообщения */
  id: number;
  /** Тип события */
  event: WebhookEventType;
  /** Тип сущности, к которой относится сообщение */
  entityType: MessageEntityType;
  /** Идентификатор сущности, к которой относится сообщение */
  entityId: number;
  /** Текст сообщения. Пустая строка, если текста нет: например, у сообщения из одних вложений или у стикера. Сам стикер в событие не попадает. */
  content: string;
  /** Идентификатор отправителя сообщения */
  userId: number;
  /** Дата и время создания сообщения (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ */
  createdAt: string;
  /** Дата и время последнего изменения сообщения (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ. Заполняется уже при создании сообщения и обычно отличается от `created_at` на доли секунды или больше: у `created_at` доли секунды всегда нулевые. `null` у сообщений, отправленных до появления этого поля. */
  changedAt?: string | null;
  /** Прямая ссылка на сообщение */
  url: string;
  /** Идентификатор чата, в котором находится сообщение */
  chatId: number;
  /** Идентификатор сообщения, к которому написан ответ. `null`, если сообщение не является ответом на другое сообщение. */
  parentMessageId?: number | null;
  /** Тред, в котором отправлено сообщение. `null`, если сообщение отправлено не в треде. В отличие от поля `thread` в объекте сообщения REST API, здесь описывается тред, внутри которого находится сообщение. */
  thread?: WebhookMessageThread | null;
  /** Через что отправлено сообщение токеном сотрудника, так же, как поле `source` в объекте сообщения. В записях истории событий, сохранённых до появления поля, его нет. */
  source?: MessageSource | null;
  /** Программа, через которую отправлено сообщение, так же, как поле `application` в объекте сообщения. В записях истории событий, сохранённых до появления поля, его нет. */
  application?: MessageApplication | null;
  /** Дата и время отправки вебхука (UTC+0) в формате UNIX */
  webhookTimestamp: number;
};

/** Ошибка OAuth авторизации (используется для 401 и 403) */
export type OAuthError = {
  /** Код ошибки. Методы API отвечают кодами `invalid_token` (`401`), `insufficient_scope` и `role_forbidden` (`403`). Остальными кодами отвечают методы обмена и отзыва токена. */
  error: OAuthErrorCode;
  /** Описание ошибки */
  errorDescription: string;
};

/** Код ошибки OAuth */
export type OAuthErrorCode = "invalid_token" | "insufficient_scope" | "role_forbidden" | "invalid_request" | "invalid_client" | "invalid_grant" | "unsupported_grant_type" | "unauthorized_client";

/** Запрос на отзыв токена */
export type OAuthRevokeRequest = {
  /** Токен сотрудника или его токен обновления */
  token: string;
  /** Что передано в `token`. Без подсказки сервер определит сам. */
  tokenTypeHint?: OAuthTokenTypeHint;
  /** Идентификатор клиента серверного приложения */
  clientId?: string;
  /** Секрет клиента серверного приложения. Вместе с `client_id` его можно передать заголовком `Authorization: Basic`. */
  clientSecret?: string;
};

/** Скоуп доступа OAuth токена */
export type OAuthScope = "chats:read" | "chats:create" | "chats:update" | "chats:mark_unread" | "chats:mark_read" | "chats:archive" | "chats:leave" | "chat_members:read" | "chat_members:write" | "chat_exports:read" | "chat_exports:write" | "messages:read" | "messages:create" | "messages:update" | "messages:delete" | "reactions:read" | "reactions:write" | "pins:write" | "threads:read" | "threads:create" | "link_previews:write" | "users:read" | "users:create" | "users:update" | "users:delete" | "group_tags:read" | "group_tags:write" | "bots:read" | "bots:write" | "bot_self:webhook:write" | "bot_self:write" | "profile:read" | "profile:write" | "profile_status:read" | "profile_status:write" | "profile_avatar:write" | "user_status:read" | "user_status:write" | "user_avatar:write" | "custom_properties:read" | "company:read" | "company:write" | "invite_links:write" | "audit_events:read" | "company_chats:read" | "company_bots:read" | "company_messages:read" | "tasks:read" | "tasks:create" | "tasks:update" | "tasks:delete" | "files:read" | "uploads:write" | "views:write" | "webhooks:events:read" | "webhooks:events:delete" | "search:users" | "search:chats" | "search:messages" | "drafts:read" | "drafts:write" | "important_messages:read" | "important_messages:write";

/** Токен сотрудника, выданный боту в обмен на код авторизации */
export type OAuthToken = {
  /** Токен сотрудника. Передаётся в заголовке `Authorization: Bearer` при запросах от его имени. */
  accessToken: string;
  /** Тип токена, всегда `Bearer` */
  tokenType: "Bearer";
  /** Токен обновления. Токен сотрудника бессрочный, поэтому обновлять его не нужно. */
  refreshToken: string;
  /** Выданные права через пробел. Набор берётся из настроек бота. */
  scope: string;
  /** Время выдачи токена в формате Unix time, в секундах */
  createdAt: number;
};

/** Запрос на обмен кода авторизации на токен */
export type OAuthTokenRequest = {
  /** Тип запроса, всегда `authorization_code` */
  grantType: "authorization_code";
  /** Код авторизации из адреса возврата */
  code: string;
  /** Адрес возврата — тот же, что в ссылке авторизации */
  redirectUri: string;
  /** Идентификатор клиента с вкладки «OAuth» в карточке бота. Не нужен, если клиент передаёт его заголовком `Authorization: Basic`. */
  clientId?: string;
  /** Секрет клиента серверного приложения. Вместе с `client_id` его можно передать заголовком `Authorization: Basic`. */
  clientSecret?: string;
  /** Проверочный код PKCE, из которого получен `code_challenge` ссылки авторизации. Обязателен для приложения без секрета. */
  codeVerifier?: string;
};

/** Что передано в запросе на отзыв токена */
export type OAuthTokenTypeHint = "access_token" | "refresh_token";

/** Представление */
export type OpenViewRequest = {
  /** Способ открытия представления */
  type: "modal";
  /** Уникальный идентификатор события (полученный, например, в исходящем вебхуке о нажатии кнопки) */
  triggerId: string;
  /** Необязательная строка, которая придёт в ваше приложение, когда сотрудник отправит заполненную форму. В ней можно, например, передать в формате `JSON` дополнительные данные к форме. Слишком длинное значение отклоняется с `422` и кодом `invalid` по ключу `private_metadata`. */
  privateMetadata?: string;
  /** Необязательный идентификатор представления, который придёт в ваше приложение, когда сотрудник отправит заполненную форму. По нему, например, понятно, какую форму заполнял сотрудник. Слишком длинное значение отклоняется с `422` и кодом `invalid` по ключу `callback_id`. */
  callbackId?: string;
  /** Собранный объект представления */
  view: {
    /** Заголовок представления */
    title: string;
    /** Текст кнопки закрытия представления. Отображается только в десктоп-вебе. В мобильных приложениях (iOS/Android) кнопка закрытия — это крестик в шапке, и заданный текст там не показывается. */
    closeText?: string;
    /** Текст кнопки отправки формы */
    submitText?: string;
    /** Массив блоков представления. Имена блоков (`name`) не повторяются, в select и radio заранее выбрано не больше одного варианта, а `min_length` поля ввода не больше его `max_length`. */
    blocks: Array<ViewBlockUnion>;
  };
};

/** Результат открытия представления */
export type OpenViewResult = {
  /** Признак того, что окно открыто. В успешном ответе всегда `true`. */
  success: boolean;
};

/** Метаданные пагинации */
export type PaginationMeta = {
  /** Вспомогательная информация */
  paginate: {
    /** Курсор пагинации следующей страницы */
    nextPage: string;
    /** Курсор пагинации предыдущей страницы. Используется для polling новых записей «сверху» списка. */
    prevPage?: string;
    /** Есть ли ещё данные на следующей странице. На последней странице — `false`. */
    hasNext?: boolean;
    /** Есть ли ещё данные на предыдущей странице. На первом запросе без курсора — `false`. */
    hasPrev?: boolean;
  };
};

/** Запрос на редактирование своего профиля */
export type ProfileUpdateRequest = {
  /** Поля своей карточки, которые нужно изменить. Все поля необязательные: пустой объект ничего не меняет. Любое другое поле отвечает `422` с кодом `not_applicable`. */
  user: {
    /** Имя */
    firstName?: string;
    /** Фамилия */
    lastName?: string;
    /** Телефон */
    phoneNumber?: string;
    /** Имя пользователя: латинские и кириллические буквы, цифры, `_`, `-` и `.`. Ники `here` и `all` зарезервированы. Ник, занятый другим сотрудником без учёта регистра, отвечает ошибкой с кодом `already_exists`, в том числе у сотрудника с `sso: true`. */
    nickname?: string;
    /** Департамент */
    department?: string;
    /** Должность */
    title?: string;
    /** Часовой пояс: идентификатор IANA, например `Europe/Moscow`, иначе ответ `422` с кодом `invalid`. Заданный пояс выключает его автоопределение по устройству. */
    timeZone?: string;
    /** Задаваемые дополнительные поля. Каждое поле указывается один раз. Поля типов «Файл» и «Множественный выбор» через API не меняются: ответ `422` с кодом `not_applicable`. Неизвестный `id` отвечает кодом `not_found`. Какое поле не прошло проверку, говорит `payload.id` ошибки. */
    customProperties?: Array<{
      /** Идентификатор поля */
      id: number;
      /** Устанавливаемое значение. Число передают целым, например `"3"`, а дату — в формате YYYY-MM-DD с годом не раньше 1583, иначе ответ `422` на поле `custom_properties.value` с кодом `invalid`. Пустая строка очищает поле. */
      value: string;
    }>;
  };
};

/** Реакция на сообщение */
export type Reaction = {
  /** Идентификатор пользователя, который добавил реакцию */
  userId: number;
  /** Дата и время добавления реакции (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ */
  createdAt: string;
  /** Emoji символ реакции */
  code: string;
  /** Название emoji реакции */
  name: string;
};

/** Тип события webhook для реакций */
export type ReactionEventType = "new" | "delete";

/** Запрос на добавление реакции */
export type ReactionRequest = {
  /** Emoji символ реакции. Без `name` нужен именно символ: текстовые записи вроде `+1` или `:+1:` отклоняются как неизвестный эмодзи. С `name` подходит любое непустое значение до 16 символов: оно сохраняется как передано. Длиннее — `400` с кодом `too_long`. */
  code: string;
  /** Имя кастомного эмодзи пространства. С ним реакцией ставится этот эмодзи, а если его в пространстве нет, ответ `404`. */
  name?: string;
};

/** Структура исходящего вебхука о реакции */
export type ReactionWebhookPayload = {
  /** Тип объекта */
  type: "reaction";
  /** Тип события */
  event: ReactionEventType;
  /** Идентификатор чата, в котором находится сообщение. Поле всегда присутствует в payload. В редких случаях (например, если сообщение было удалено к моменту отправки вебхука) может быть `null`. */
  chatId: number | null;
  /** Идентификатор сообщения, к которому относится реакция */
  messageId: number;
  /** Emoji символ реакции */
  code: string;
  /** Название реакции */
  name: string;
  /** Идентификатор пользователя, который добавил или удалил реакцию */
  userId: number;
  /** Дата и время добавления реакции (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ. Поле присутствует и для события удаления реакции. */
  createdAt: string;
  /** Дата и время отправки вебхука (UTC+0) в формате UNIX */
  webhookTimestamp: number;
};

/** Тип сущности для поиска */
export type SearchEntityType = "User" | "Task";

/** Мета-информация для пагинации поисковых результатов */
export type SearchPaginationMeta = {
  /** Общее количество найденных результатов */
  total: number;
  /** Вспомогательная информация */
  paginate: {
    /** Курсор пагинации следующей страницы */
    nextPage: string;
    /** Есть ли ещё данные на следующей странице. На последней странице — `false`. */
    hasNext: boolean;
  };
};

/** Сортировка результатов поиска */
export type SearchSortOrder = "by_score" | "alphabetical" | "creation";

/** Порядок сортировки */
export type SortOrder = "asc" | "desc";

/** Запрос на установку статуса */
export type StatusUpdateRequest = {
  status: {
    /** Emoji символ статуса. Обязателен, если статуса ещё нет. Эмодзи в текстовой форме (без U+FE0F или с U+FE0E) сохраняется и возвращается с U+FE0F. Пустое значение отвечает `400` с кодом `blank`, несколько эмодзи — с кодом `invalid`, текст вместо эмодзи или рядом с ним — с кодом `wrong_emoji`. */
    emoji?: string;
    /** Текст статуса. Обязателен, если статуса ещё нет. */
    title?: string;
    /** Срок жизни статуса (ISO-8601). Смещение вида `+03:00` учитывается, время без смещения считается UTC. `null` убирает срок: статус не снимется сам. */
    expiresAt?: string | null;
    /** Режим «Нет на месте» */
    isAway?: boolean;
    /** Текст сообщения при режиме «Нет на месте». Отображается в профиле и при личных сообщениях/упоминаниях. Поддерживает Markdown и упоминания `@nickname` и `<@user_id>`, но сохраняется и возвращается обычным текстом: разметка убирается, а упоминание сотрудника заменяется на `@` с его именем и фамилией. Предел 1024 символа действует и на присланный текст, и на получившийся, сверх него ответ `400` с кодом `too_long`. `null` или пустая строка убирает текст. */
    awayMessage?: string | null;
  };
};

/** Ответ бота на отправку формы */
export type SubmitViewResponseRequest = {
  /** Идентификатор отправки формы из вебхука `view_submit` */
  submitId: string;
  /** Ошибки заполнения полей. Ключ — `name` блока, значение — текст ошибки под полем. Без этого поля представление закрывается как успешно отправленное. */
  errors?: Record<string, string>;
};

/** Результат ответа на отправку формы */
export type SubmitViewResponseResult = {
  /** Признак успешной обработки */
  success: boolean;
};

/** Массив названий тегов */
export type TagNamesFilter = Array<string>;

/** Напоминание */
export type Task = {
  /** Идентификатор напоминания */
  id: number;
  /** Тип */
  kind: TaskKind;
  /** Описание */
  content: string;
  /** Срок выполнения напоминания (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ. `null`, если срок не задан. */
  dueAt: string | null;
  /** Приоритет */
  priority: number;
  /** Идентификатор пользователя-создателя напоминания */
  userId: number;
  /** Идентификатор чата, к которому привязано напоминание. `null`, если напоминание не привязано к чату. */
  chatId: number | null;
  /** Статус напоминания */
  status: TaskStatus;
  /** Дата и время создания напоминания (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ */
  createdAt: string;
  /** Массив идентификаторов пользователей, привязанных к напоминанию как «ответственные» */
  performerIds: Array<number>;
  /** Напоминание на весь день: `true`, если при создании передан `all_day: true` или срок стоит ровно на 23:59:59. Веб-версия Пачки показывает напоминание без времени только по такому сроку, а при другом времени срока показывает это время. */
  allDay: boolean;
  /** Дополнительные поля напоминания */
  customProperties: Array<CustomProperty>;
};

/** Запрос на создание напоминания */
export type TaskCreateRequest = {
  /** Собранный объект параметров создаваемого напоминания */
  task: {
    /** Тип */
    kind?: TaskKind;
    /** Описание, по умолчанию — название типа. До 40 000 байт в UTF-8. */
    content?: string;
    /** Срок выполнения напоминания (ISO-8601). Смещение вида `+03:00` учитывается, время без смещения считается UTC. Секунды отбрасываются: срок встаёт на начало минуты. Исключение — ровно 23:59:59: такое напоминание создаётся на весь день, без указания времени. */
    dueAt?: string;
    /** Приоритет: 1, 2 (важно) или 3 (очень важно) */
    priority?: number;
    /** Массив идентификаторов пользователей, привязываемых к напоминанию как «ответственные» (по умолчанию ответственным назначается вы) */
    performerIds?: Array<number>;
    /** Идентификатор чата, к которому привязывается напоминание */
    chatId?: number;
    /** Напоминание на весь день. Вместе с ним передайте `due_at` ровно на 23:59:59 нужного дня с местным смещением сотрудника, например `2026-10-29T23:59:59+03:00`. Веб-версия Пачки показывает напоминание без времени только по такому сроку, а при другом времени срока показывает это время и с `all_day: true`. */
    allDay?: boolean;
    /** Задаваемые дополнительные поля */
    customProperties?: Array<{
      /** Идентификатор поля */
      id: number;
      /** Устанавливаемое значение. Число передают целым и цифрами, например `"3"`, а дату — в формате YYYY-MM-DD: другая запись может сохраниться искажённой и без ошибки, например `"2,5"` станет 25. Пустая строка очищает поле. */
      value: string;
    }>;
  };
};

/** Тип напоминания */
export type TaskKind = "call" | "meeting" | "reminder" | "event" | "email";

/** Статус напоминания */
export type TaskStatus = "done" | "undone";

/** Запрос на обновление напоминания */
export type TaskUpdateRequest = {
  /** Собранный объект параметров обновляемого напоминания */
  task: {
    /** Тип */
    kind?: TaskKind;
    /** Описание. До 40 000 байт в UTF-8. */
    content?: string;
    /** Срок выполнения напоминания (ISO-8601). Смещение вида `+03:00` учитывается, время без смещения считается UTC. Секунды отбрасываются: срок встаёт на начало минуты. Исключение — ровно 23:59:59: такое напоминание создаётся на весь день, без указания времени. */
    dueAt?: string;
    /** Приоритет: 1, 2 (важно) или 3 (очень важно) */
    priority?: number;
    /** Массив идентификаторов пользователей, привязываемых к напоминанию как «ответственные». Список заменяет прежний целиком. */
    performerIds?: Array<number>;
    /** Статус */
    status?: TaskStatus;
    /** Напоминание на весь день. При правке поле не применяется: напоминание на весь день задаёт срок `due_at` ровно на 23:59:59 нужного дня с местным смещением сотрудника, например `2026-10-29T23:59:59+03:00`. */
    allDay?: boolean;
    /** Дата и время выполнения напоминания (ISO-8601). Смещение вида `+03:00` учитывается, время без смещения считается UTC. Значение, которое не удалось разобрать, отметку о выполнении снимает: ответ придёт успешный, а в нём `status` будет `undone`. */
    doneAt?: string;
    /** Задаваемые дополнительные поля */
    customProperties?: Array<{
      /** Идентификатор поля */
      id: number;
      /** Устанавливаемое значение. Число передают целым и цифрами, например `"3"`, а дату — в формате YYYY-MM-DD: другая запись может сохраниться искажённой и без ошибки, например `"2,5"` станет 25. Пустая строка очищает поле. */
      value: string;
    }>;
  };
};

/** Тред */
export type Thread = {
  /** Идентификатор треда. Чтобы написать в тред, передайте его в `entity_id` метода [Новое сообщение](POST /messages) с `entity_type: "thread"`. */
  id: number;
  /** Идентификатор чата треда. По нему читают сообщения треда методом [Список сообщений чата](GET /messages) и работают с его участниками. */
  chatId: number;
  /** Идентификатор сообщения, к которому был создан тред. `null` для самостоятельного треда, созданного без привязки к сообщению. */
  messageId: number | null;
  /** Идентификатор чата сообщения. `null` для самостоятельного треда, созданного без привязки к сообщению. */
  messageChatId: number | null;
  /** Дата и время обновления треда (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ */
  updatedAt: string;
};

/** Запрос на изменение роли участника */
export type UpdateMemberRoleRequest = {
  /** Роль */
  role: ChatMemberRole;
};

/** Параметры для загрузки файла */
export type UploadParams = {
  /** Используемый заголовок (в данном запросе — attachment) */
  "Content-Disposition": string;
  /** Уровень безопасности, `private`. Приходит не во всех пространствах: если поле есть в ответе, его передают в форме загрузки. */
  acl?: string;
  /** Уникальная policy для загрузки файла */
  policy: string;
  /** x-amz-credential для загрузки файла */
  "x-amz-credential": string;
  /** Используемый алгоритм (в данном запросе — AWS4-HMAC-SHA256) */
  "x-amz-algorithm": string;
  /** Уникальный x-amz-date для загрузки файла */
  "x-amz-date": string;
  /** Уникальная подпись для загрузки файла */
  "x-amz-signature": string;
  /** Уникальный ключ для загрузки файла. Чтобы приложить файл, в ключе заменяют `${filename}` на имя файла, а остальное передают как есть: начало ключа бывает разным. */
  key: string;
  /** Имя хранилища. Приходит не во всех пространствах: если поле есть в ответе, его передают в форме загрузки. */
  bucket?: string;
  /** Адрес хранилища, куда отправляется форма загрузки */
  directUrl: string;
};

/** Сотрудник */
export type User = {
  /** Идентификатор пользователя */
  id: number;
  /** Имя. Возвращается `null`, пока приглашённый сотрудник не завершил регистрацию (`invite_status` со значением `sent`). */
  firstName: string | null;
  /** Фамилия. Если не заполнена, возвращается `null` или пустая строка. */
  lastName: string | null;
  /** Имя пользователя */
  nickname: string;
  /** Электронная почта. В чужой карточке приходит `null`, если у вызывающего нет права видеть личные данные: у владельца пространства и администратора оно есть всегда, у сотрудника и бота — только когда в пространстве включён показ личных данных, у гостя и мульти-гостя — никогда. В своей карточке поле приходит всегда. */
  email: string | null;
  /** Телефон. В чужой карточке приходит `null`, если у вызывающего нет права видеть личные данные: у владельца пространства и администратора оно есть всегда, у сотрудника и бота — только когда в пространстве включён показ личных данных, у гостя и мульти-гостя — никогда. В своей карточке поле приходит всегда. */
  phoneNumber: string | null;
  /** Департамент. Если не указан, возвращается `null` или пустая строка. */
  department: string | null;
  /** Должность. Если не указана, возвращается `null` или пустая строка. */
  title: string | null;
  /** Уровень доступа */
  role: UserRole;
  /** Деактивация пользователя */
  suspended: boolean;
  /** Статус приглашения */
  inviteStatus: InviteStatus;
  /** Идентификатор сотрудника, который пригласил данного сотрудника. Возвращает `null`, если сотрудник зарегистрировался самостоятельно или если пригласивший сотрудник был удалён. */
  inviterId: number | null;
  /** Массив тегов, привязанных к сотруднику. Мульти-гостю в чужой карточке приходит пустым. */
  listTags: Array<string>;
  /** Дополнительные поля сотрудника */
  customProperties: Array<CustomProperty>;
  /** Статус. `null`, если у сотрудника не установлен статус. */
  userStatus: UserStatus | null;
  /** Является ботом */
  bot: boolean;
  /** Использует ли пользователь SSO */
  sso: boolean;
  /** Дата создания (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ */
  createdAt: string;
  /** Дата последней активности пользователя (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ. `null`, если сотрудник ещё ни разу не заходил в Пачку или не заходил после смены почты — в этом случае `invite_status` возвращает `sent`. */
  lastActivityAt: string | null;
  /** Часовой пояс пользователя. `null`, если сотрудник не задал личный часовой пояс — тогда применяется часовой пояс компании. */
  timeZone: string | null;
  /** Ссылка на скачивание аватарки пользователя. `null`, если аватарка не загружена. */
  imageUrl: string | null;
};

/** Запрос на создание сотрудника */
export type UserCreateRequest = {
  user: {
    /** Имя */
    firstName?: string;
    /** Фамилия */
    lastName?: string;
    /** Электронная почта. На неё уходит приглашение, а без письма (`skip_email_notify`) сотрудник входит в Пачку по этому адресу сам. */
    email: string;
    /** Телефон */
    phoneNumber?: string;
    /** Имя пользователя: латинские и кириллические буквы, цифры, `_`, `-` и `.`, иначе ответ `400` с кодом `invalid`. Ники `here` и `all` зарезервированы: на них ответ `400` с кодом `use_of_system_words`. */
    nickname?: string;
    /** Департамент */
    department?: string;
    /** Должность */
    title?: string;
    /** Уровень доступа, по умолчанию `user` */
    role?: UserCreateRole;
    /** Деактивация пользователя */
    suspended?: boolean;
    /** Массив названий тегов, привязываемых к сотруднику. Значение, которое не является массивом непустых строк, игнорируется. */
    listTags?: Array<string>;
    /** Идентификаторы чатов, в которые сотрудник будет добавлен сразу при создании. Для роли `guest` параметр обязателен и должен содержать ровно один активный чат. */
    chatIds?: Array<number>;
    /** Задаваемые дополнительные поля */
    customProperties?: Array<{
      /** Идентификатор поля */
      id: number;
      /** Устанавливаемое значение. Число передают целым и цифрами, например `"3"`, а дату — в формате YYYY-MM-DD: другая запись может сохраниться искажённой и без ошибки, например `"2,5"` станет 25. Пустая строка очищает поле. */
      value: string;
    }>;
  };
  /** Пропуск этапа отправки приглашения сотруднику. Сотруднику не будет отправлено письмо на электронную почту с приглашением создать аккаунт. Полезно при предварительном создании аккаунтов перед входом через SSO. */
  skipEmailNotify?: boolean;
};

/** Роль пользователя, допустимая при создании сотрудника. Для роли `guest` параметр `chat_ids` обязателен и должен содержать ровно один чат. */
export type UserCreateRole = "admin" | "user" | "multi_guest" | "guest";

/** Тип события webhook для пользователей */
export type UserEventType = "invite" | "confirm" | "update" | "suspend" | "activate" | "delete";

/** Роль пользователя в системе */
export type UserRole = "admin" | "user" | "multi_guest" | "guest";

/** Роль пользователя, допустимая при редактировании сотрудника. Роль `guest` передают вместе с `chat_ids`, в котором ровно один чат. */
export type UserRoleInput = "admin" | "user" | "multi_guest" | "guest";

/** Статус пользователя */
export type UserStatus = {
  /** Emoji символ статуса */
  emoji: string;
  /** Текст статуса */
  title: string;
  /** Срок жизни статуса (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ. `null`, если срок не задан — такой статус не сбрасывается автоматически. */
  expiresAt: string | null;
  /** Режим «Нет на месте» */
  isAway: boolean;
  /** Сообщение при режиме «Нет на месте». Отображается в профиле пользователя, а также при отправке ему личного сообщения или упоминании в чате. `null`, если текст не задан. */
  awayMessage: {
    /** Текст сообщения: обычный текст без разметки, упоминание сотрудника показано как `@` с именем и фамилией. */
    text: string;
  } | null;
};

/** Запрос на редактирование сотрудника */
export type UserUpdateRequest = {
  /** Собранный объект параметров редактируемого сотрудника */
  user: {
    /** Имя */
    firstName?: string;
    /** Фамилия */
    lastName?: string;
    /** Электронная почта. После её смены сотрудник считается ещё не входившим: `invite_status` приходит `sent`, а `last_activity_at` — `null`, пока он снова не зайдёт в Пачку. */
    email?: string;
    /** Телефон */
    phoneNumber?: string;
    /** Имя пользователя: латинские и кириллические буквы, цифры, `_`, `-` и `.`, иначе ответ `400` с кодом `invalid`. Ники `here` и `all` зарезервированы: на них ответ `400` с кодом `use_of_system_words`. Ник, занятый другим сотрудником без учёта регистра, отвечает `400` с кодом `already_exists`: случайные символы, как в методе [Новый сотрудник](POST /users), здесь не дописываются. У сотрудника с `sso: true` занятый ник молча остаётся прежним. Ник бота состоит из латинских букв, цифр и `_`, оканчивается на `_bot` и уникален в пространстве, иначе метод отвечает `422` с ошибкой на поле `nickname`: `invalid` или `already_exists`. Другие ошибки ника бота при его смене, например `blank` или `too_long`, тоже приходят с `422`. Прежний ник бота проверяется, только когда его меняют. */
    nickname?: string;
    /** Департамент */
    department?: string;
    /** Должность */
    title?: string;
    /** Уровень доступа. Роли в чатах, где сотрудник уже состоит, при смене между `user` и `admin` остаются прежними: их меняет метод [Редактирование роли участника](PUT /chats/{id}/members/{user_id}). Перевод сотрудника или мульти-гостя в гости (`guest` с `chat_ids`) снимает с него все теги и выводит его из остальных бесед и каналов, кроме личных переписок и тредов. В тредах роль администратора или редактора меняется на участника, владелец треда остаётся владельцем. Все его токены, включая доступы, выданные ботам и приложениям, отзываются и отвечают `401`. Повышение роли ничего из этого не возвращает. */
    role?: UserRoleInput;
    /** Чат, в котором останется сотрудник при переводе в гости (`role: "guest"`): ровно одна активная беседа или канал, куда у токена есть право добавлять участников. Без такого чата ответ `400` по этому полю, и не меняется ничего. При других ролях и у того, кто уже гость, поле не учитывается. При переводе в гости сотруднику с указанной почтой уходит письмо о смене роли со ссылкой на этот чат, даже если он ещё не входил в Пачку или приостановлен. В суточный лимит писем-приглашений оно не идёт. */
    chatIds?: Array<number>;
    /** Деактивация пользователя. Владельца пространства приостановить нельзя никому, в том числе ему самому: ответ `403`. */
    suspended?: boolean;
    /** Массив названий тегов, привязываемых к сотруднику. Список заменяет прежний целиком, пустой снимает все теги. Значение, которое не является массивом непустых строк, игнорируется: теги сотрудника не меняются. В тег можно добавить только бота, которого может добавить в чат любой сотрудник и у которого выключена настройка «Ограничить одним чатом». Если бот этим условиям не отвечает, а в списке есть тег, которого у него ещё нет, метод отвечает `422` на поле `group_tags` и ничего не меняет: с кодом `single_chat_bot_tag_denied`, когда бот ограничен одним чатом, и `restricted_bot_tag_denied`, когда в настройке «Кто может добавлять бота в чаты» выбран «Создатель» или «Создатель и Администраторы». Подробнее — в разделе [Бот в тегах](/guides/bots/settings#bot-v-tegah). */
    listTags?: Array<string>;
    /** Задаваемые дополнительные поля */
    customProperties?: Array<{
      /** Идентификатор поля */
      id: number;
      /** Устанавливаемое значение. Число передают целым и цифрами, например `"3"`, а дату — в формате YYYY-MM-DD: другая запись может сохраниться искажённой и без ошибки, например `"2,5"` станет 25. Пустая строка очищает поле. */
      value: string;
    }>;
  };
};

/** Коды ошибок валидации */
export type ValidationErrorCode = "blank" | "too_long" | "invalid" | "inclusion" | "exclusion" | "taken" | "wrong_emoji" | "not_found" | "already_exists" | "personal_chat" | "displayed_error" | "not_authorized" | "invalid_date_range" | "invalid_webhook_url" | "rate_limit" | "licenses_limit" | "user_limit" | "unique_limit" | "general_limit" | "unhandled" | "trigger_not_found" | "trigger_expired" | "required" | "in" | "not_applicable" | "self_update" | "owner_protected" | "already_assigned" | "next_send_at_invalid" | "schedule_invalid" | "schedule_end_date_invalid" | "scheduled_messages_limit" | "draft_type_change_forbidden" | "confidential_download_denied" | "decryption_failed" | "bot_add_denied" | "single_chat_bot_occupied" | "single_chat_bot_tag_denied" | "restricted_bot_tag_denied" | "bot_changed_concurrently" | "timeout" | "daily_invites_limit" | "webhook_url_invalid" | "webhook_url_unresolved" | "webhook_url_forbidden" | "blocked_by_sso" | "forbidden" | "permission_denied" | "access_denied" | "wrong_params" | "payment_required" | "min_length" | "max_length" | "use_of_system_words" | "export_file_not_found" | "cannot_kick_owner" | "pin_failed" | "message_deleted" | "thread_message" | "view_not_found" | "submit_expired" | "service_unavailable";

/** Тип события видеозвонка */
export type VideoCallEventType = "started" | "finished" | "recording_ready";

/** Структура исходящего вебхука о видеозвонке */
export type VideoCallWebhookPayload = {
  /** Тип объекта */
  type: "video_call";
  /** Тип события */
  event: VideoCallEventType;
  /** Идентификатор видеозвонка */
  videoRoomId: number;
  /** Идентификатор чата, в котором проходит видеозвонок */
  chatId: number;
  /** Идентификатор пользователя, начавшего видеозвонок */
  ownerId: number;
  /** Тред звонка. Для звонка в обычном чате или личной переписке это тред к системному сообщению о звонке: `message_id` — это сообщение, а `message_chat_id` совпадает с `chat_id`. Для звонка в треде это сам тред, и `thread.chat_id` совпадает с `chat_id`. `null` только в событии finished для звонка вне треда, который так и не начался. */
  thread?: WebhookVideoCallThread | null;
  /** Дата и время начала звонка (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ. Присутствует для событий started и finished. `null`, если звонок завершился, так и не начавшись. */
  startedAt?: string | null;
  /** Дата и время завершения звонка (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ. Присутствует для события finished. */
  finishedAt?: string;
  /** Длительность в секундах. Для события finished — длительность звонка, для recording_ready — длительность записи. `null`, если звонок завершился, так и не начавшись. */
  duration?: number | null;
  /** Список участников звонка. Присутствует для события finished. */
  members?: Array<WebhookVideoCallMember>;
  /** Идентификатор записи. Присутствует для события recording_ready. */
  recordingId?: number;
  /** Идентификатор файла записи. Присутствует для события recording_ready. `null`, если файл ещё не привязан. */
  fileId?: number | null;
  /** Прямая ссылка на файл записи. Присутствует для события recording_ready. */
  url?: string;
  /** Размер файла записи в байтах. Присутствует для события recording_ready. */
  size?: number;
  /** Дата и время отправки вебхука (UTC+0) в формате UNIX */
  webhookTimestamp: number;
};

/** Блок представления для форм (базовая модель, используйте конкретные типы блоков) */
export type ViewBlock = {
  /** Тип блока */
  type: string;
  /** Текст блока */
  text?: string;
  /** Имя поля */
  name?: string;
  /** Метка поля */
  label?: string;
  /** Начальная дата */
  initialDate?: string;
};

/** Блок checkbox — чекбоксы */
export type ViewBlockCheckbox = {
  /** Тип блока */
  type: "checkbox";
  /** Название, которое будет передано в ваше приложение как ключ указанного пользователем выбора */
  name: string;
  /** Подпись к группе чекбоксов */
  label: string;
  /** Массив чекбоксов */
  options: Array<ViewBlockCheckboxOption>;
  /** Обязательность */
  required?: boolean;
  /** Подсказка, которая отображается под группой чекбоксов серым цветом */
  hint?: string;
};

export type ViewBlockCheckboxOption = {
  /** Отображаемый текст */
  text: string;
  /** Уникальное строковое значение, которое будет передано в ваше приложение при выборе этого пункта */
  value: string;
  /** Пояснение, которое будет указано серым цветом в этом пункте под отображаемым текстом */
  description?: string;
  /** Изначально выбранный пункт */
  checked?: boolean;
};

/** Блок date — выбор даты */
export type ViewBlockDate = {
  /** Тип блока */
  type: "date";
  /** Название, которое будет передано в ваше приложение как ключ указанного пользователем значения */
  name: string;
  /** Подпись к полю */
  label: string;
  /** Начальное значение в поле в формате YYYY-MM-DD */
  initialDate?: string;
  /** Обязательность */
  required?: boolean;
  /** Подсказка, которая отображается под полем серым цветом */
  hint?: string;
};

/** Блок divider — разделитель */
export type ViewBlockDivider = {
  /** Тип блока */
  type: "divider";
};

/** Блок file_input — загрузка файлов */
export type ViewBlockFileInput = {
  /** Тип блока */
  type: "file_input";
  /** Название, которое будет передано в ваше приложение как ключ указанного пользователем значения */
  name: string;
  /** Подпись к полю */
  label: string;
  /** Массив допустимых расширений файлов, указанные в виде строк (например, ["png","jpg","gif"]). Точка в начале не нужна, но допустима — она подставляется сама. Значение с косой чертой считается MIME-типом и остаётся как есть. Если это поле не указано, все расширения файлов будут приняты. Значение подставляется в фильтр окна выбора файла, поэтому расширение полученного файла проверяйте у себя. */
  filetypes?: Array<string>;
  /** Максимальное количество файлов, которое может загрузить пользователь в это поле */
  maxFiles?: number;
  /** Обязательность */
  required?: boolean;
  /** Подсказка, которая отображается под полем серым цветом */
  hint?: string;
};

/** Блок header — заголовок */
export type ViewBlockHeader = {
  /** Тип блока */
  type: "header";
  /** Текст заголовка */
  text: string;
};

/** Блок input — текстовое поле ввода */
export type ViewBlockInput = {
  /** Тип блока */
  type: "input";
  /** Название, которое будет передано в ваше приложение как ключ указанного пользователем значения */
  name: string;
  /** Подпись к полю */
  label: string;
  /** Подсказка внутри поля ввода, пока оно пустое */
  placeholder?: string;
  /** Многострочное поле */
  multiline?: boolean;
  /** Начальное значение в поле */
  initialValue?: string;
  /** Минимальная длина текста, который должен написать пользователь. Если пользователь напишет меньше, он получит ошибку. */
  minLength?: number;
  /** Максимальная длина текста, который должен написать пользователь. Если пользователь напишет больше, он получит ошибку. */
  maxLength?: number;
  /** Обязательность */
  required?: boolean;
  /** Подсказка, которая отображается под полем серым цветом */
  hint?: string;
};

/** Блок markdown — форматированный текст */
export type ViewBlockMarkdown = {
  /** Тип блока */
  type: "markdown";
  /** Текст */
  text: string;
};

/** Блок plain_text — обычный текст */
export type ViewBlockPlainText = {
  /** Тип блока */
  type: "plain_text";
  /** Текст */
  text: string;
};

/** Блок radio — радиокнопки */
export type ViewBlockRadio = {
  /** Тип блока */
  type: "radio";
  /** Название, которое будет передано в ваше приложение как ключ указанного пользователем выбора */
  name: string;
  /** Подпись к группе радиокнопок */
  label: string;
  /** Массив радиокнопок */
  options: Array<ViewBlockSelectableOption>;
  /** Обязательность */
  required?: boolean;
  /** Подсказка, которая отображается под группой радиокнопок серым цветом */
  hint?: string;
};

/** Блок select — выпадающий список */
export type ViewBlockSelect = {
  /** Тип блока */
  type: "select";
  /** Название, которое будет передано в ваше приложение как ключ указанного пользователем выбора */
  name: string;
  /** Подпись к выпадающему списку */
  label: string;
  /** Массив доступных пунктов в выпадающем списке */
  options: Array<ViewBlockSelectOption>;
  /** Обязательность */
  required?: boolean;
  /** Подсказка, которая отображается под выпадающим списком серым цветом */
  hint?: string;
};

/** Пункт выпадающего списка (select). Изначальный выбор задаётся полем `selected`, а не `checked`, как у radio и checkbox. */
export type ViewBlockSelectOption = {
  /** Отображаемый текст */
  text: string;
  /** Уникальное строковое значение, которое будет передано в ваше приложение при выборе этого пункта */
  value: string;
  /** Пояснение, которое будет указано серым цветом в этом пункте под отображаемым текстом */
  description?: string;
  /** Изначально выбранный пункт. Только один пункт может быть выбран. */
  selected?: boolean;
};

/** Радиокнопка блока radio. Изначальный выбор задаётся полем `checked`, как у checkbox, а не `selected`, как у select. */
export type ViewBlockSelectableOption = {
  /** Отображаемый текст */
  text: string;
  /** Уникальное строковое значение, которое будет передано в ваше приложение при выборе этого пункта */
  value: string;
  /** Пояснение, которое будет указано серым цветом в этом пункте под отображаемым текстом */
  description?: string;
  /** Изначально выбранная радиокнопка. Только одна радиокнопка может быть выбрана. */
  checked?: boolean;
};

/** Блок time — выбор времени */
export type ViewBlockTime = {
  /** Тип блока */
  type: "time";
  /** Название, которое будет передано в ваше приложение как ключ указанного пользователем значения */
  name: string;
  /** Подпись к полю */
  label: string;
  /** Начальное значение в поле в формате HH:mm. Значение в формате HH:mm:ss тоже принимается — секунды отбрасываются. */
  initialTime?: string;
  /** Обязательность */
  required?: boolean;
  /** Подсказка, которая отображается под полем серым цветом */
  hint?: string;
};

/** Union-тип для всех возможных блоков представления */
export type ViewBlockUnion = (ViewBlockHeader | ViewBlockPlainText | ViewBlockMarkdown | ViewBlockDivider | ViewBlockInput | ViewBlockSelect | ViewBlockRadio | ViewBlockCheckbox | ViewBlockDate | ViewBlockTime | ViewBlockFileInput);

/** Структура исходящего вебхука о заполнении формы */
export type ViewSubmitWebhookPayload = {
  /** Тип объекта */
  type: "view";
  /** Тип события */
  event: "submit";
  /** Идентификатор обратного вызова, указанный при открытии представления. `null`, если при открытии формы он не был указан. */
  callbackId: string | null;
  /** Приватные метаданные, указанные при открытии представления. `null`, если при открытии формы они не были указаны. */
  privateMetadata: string | null;
  /** Идентификатор чата, в котором была нажата кнопка, открывшая форму. Фиксируется при открытии формы, а не при её отправке. */
  chatId: number | null;
  /** Идентификатор пользователя, который отправил форму */
  userId: number;
  /** Идентификатор представления. Нужен боту без адреса исходящего вебхука, чтобы ответить методом [Ответ на отправку формы](POST /views/{view_id}/submit_response). */
  viewId: string;
  /** Идентификатор отправки формы. Нужен боту без адреса исходящего вебхука, чтобы ответить методом [Ответ на отправку формы](POST /views/{view_id}/submit_response). */
  submitId: string;
  /** Данные заполненных полей представления. Ключ — `name` блока, значение — введённые данные. У блока `file_input` значение приходит массивом объектов с полями `name`, `size` и `url`, ссылка действует 2 часа. */
  data: Record<string, unknown>;
  /** Дата и время отправки вебхука (UTC+0) в формате UNIX */
  webhookTimestamp: number;
};

/** Данные голосового сообщения */
export type VoiceContent = {
  /** Длительность голосового сообщения в миллисекундах */
  durationMs: number;
  /** Форма волны (амплитуды) для визуализации голосового сообщения */
  waveform: string;
  /** Расшифровка голосового сообщения в текст. `null`, пока расшифровка не готова или недоступна. */
  transcript: string | null;
  /** Статус расшифровки. `null`, если расшифровка не запрашивалась: она выключена в пространстве, файл зашифрован, это черновик или сообщение отправлено до появления этого поля и расшифровки у него нет. При `success` текст лежит в `transcript`, а пустая строка в нём означает, что речи в записи нет. Пока расшифровка идёт, статус `pending`, и у расшифровки, которая не завершилась, он может держаться долго. `failed` означает, что расшифровка не удалась. */
  transcriptStatus: VoiceTranscriptStatus | null;
};

/** Статус расшифровки голосового сообщения */
export type VoiceTranscriptStatus = "pending" | "failed" | "success";

/** Событие исходящего вебхука */
export type WebhookEvent = {
  /** Идентификатор события */
  id: string;
  /** Тип события: значение из `events` бота, например `message_new`. У отправленной формы — `view_submit`, она приходит с подпиской на `button_click`. */
  eventType: string;
  /** Объект вебхука */
  payload: WebhookPayloadUnion;
  /** Дата и время создания события (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ */
  createdAt: string;
};

/** Тип события webhook */
export type WebhookEventType = "new" | "update" | "delete";

/** Ссылка на поток событий бота */
export type WebhookEventsStream = {
  /** Ссылка на поток событий в формате Server-Sent Events. Открывается без токена, поэтому храните её как секрет. */
  url: string;
  /** Дата и время, до которых действует ссылка (ISO-8601, UTC+0): от одного до двух часов после запроса. В этот момент сервер присылает `disconnect` и закрывает подключение по ней. */
  expiresAt: string;
};

/** Объект ссылки в вебхуке разворачивания ссылок */
export type WebhookLink = {
  /** URL ссылки */
  url: string;
  /** Домен ссылки */
  domain: string;
  /** Признак того, что автор сообщения скрыл превью для этой ссылки. Если `true` — бот не должен создавать превью. */
  skip: boolean;
};

/** Объект треда в вебхуке сообщения */
export type WebhookMessageThread = {
  /** Идентификатор сообщения, к которому был создан тред. `null` у треда без сообщения-родителя — такие создаёт [Новый самостоятельный тред](POST /threads). */
  messageId: number | null;
  /** Идентификатор чата сообщения, к которому был создан тред. `null` у треда без сообщения-родителя. */
  messageChatId: number | null;
};

/** Объединение всех типов payload вебхуков */
export type WebhookPayloadUnion = (MessageWebhookPayload | ReactionWebhookPayload | ButtonWebhookPayload | ViewSubmitWebhookPayload | ChatMemberWebhookPayload | CompanyMemberWebhookPayload | LinkSharedWebhookPayload | VideoCallWebhookPayload);

/** Участник видеозвонка */
export type WebhookVideoCallMember = {
  /** Идентификатор участника */
  userId: number;
  /** Дата и время первого подключения к звонку (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ */
  joinedAt: string;
  /** Дата и время выхода из звонка (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ. Если участник оставался в звонке до его завершения, совпадает с временем окончания звонка. */
  leftAt: string;
};

/** Параметры треда видеозвонка */
export type WebhookVideoCallThread = {
  /** Идентификатор треда */
  id: number;
  /** Идентификатор чата треда */
  chatId: number;
  /** Идентификатор сообщения, к которому создан тред. `null` у треда без сообщения-родителя — такие создаёт [Новый самостоятельный тред](POST /threads). */
  messageId: number | null;
  /** Идентификатор чата сообщения, к которому создан тред. `null` у треда без сообщения-родителя. */
  messageChatId: number | null;
};

/** День недели: 0 — воскресенье, 6 — суббота */
export type Weekday = number;

/** Методы API Пачки: `ctx.pachca.bot` и `ctx.pachca.user` с правами из манифеста. */
export interface PachcaApi {
  security: {
    /**
     * Журнал аудита событий
     *
     * Что происходило в пространстве: входы и выходы, изменения ролей и настроек, действия с чатами, сотрудниками и ботами. Записи только читаются — изменить или удалить их нельзя ни через API, ни из интерфейса.
     *
     * Метод доступен владельцу пространства на тарифе «Корпорация», остальным сотрудникам он отвечает `403`. Само обращение к журналу тоже записывается в журнал — событием `audit_events_accessed`.
     *
     * События приходят от новых к старым и отбираются фильтрами: период по `start_time` и `end_time`, вид события по `event_key`, инициатор по `actor_id` и `actor_type`. Без фильтров метод отдаёт все события пространства постранично.
     *
     * Скоуп `audit_events:read`. GET /audit_events
     */
    getAuditEvents: PachcaOp<"audit_events:read", false, {
      query?: {
        /** Начальная метка времени, включительно (ISO-8601). Смещение вида `+03:00` учитывается, время без смещения считается UTC. Значение, которое не удалось разобрать, фильтр снимает — ответ придёт полным, без ошибки. */
        startTime?: string;
        /** Конечная метка времени, включительно (ISO-8601). Смещение вида `+03:00` учитывается, время без смещения считается UTC. Значение, которое не удалось разобрать, фильтр снимает — ответ придёт полным, без ошибки. */
        endTime?: string;
        /** Фильтр по конкретному типу события */
        eventKey?: AuditEventKey;
        /** Идентификатор актора события, как в поле `actor_id` записи. Смену роли, добавление в чат и исключение из чата, назначение и снятие тегов фильтр находит по сотруднику, которого они коснулись. По тому, кто сменил роль или теги в профиле сотрудника, фильтр находит событие `user_updated` с `company_role` или `group_tags` в `changed_attrs`. */
        actorId?: string;
        /** Тип актора */
        actorType?: string;
        /** Идентификатор затронутой сущности */
        entityId?: string;
        /** Тип сущности */
        entityType?: string;
        /** Количество записей для возврата. Целое число вне допустимых значений заменяется ближайшей границей. */
        limit?: number;
        /** Курсор для пагинации (из `meta.paginate.next_page` или `meta.paginate.prev_page`) */
        cursor?: string;
      };
    }, {
        data: Array<AuditEvent>;
        meta: PaginationMeta;
      }>;
  };
  bots: {
    /**
     * Ротация собственного токена бота
     *
     * Метод позволяет боту сгенерировать себе новый `access_token` своим же токеном — без участия администратора и без знания собственного `id`.
     *
     * Перевыпускается основной токен бота — тот, что без имени, а если такого нет, самый старый, и он инвалидируется сразу. Новый основной токен создаётся с новым идентификатором и без имени. Если бот ходит отдельным токеном, этот токен остаётся прежним.
     *
     * Новый токен возвращается в ответе один раз — обязательно сохраните его, иначе бот потеряет доступ к API. Скоупы переносятся с прежнего токена.
     *
     * Скоуп `bot_self:write`. POST /bot/recreate_token
     */
    selfRecreateBotToken: PachcaOp<"bot_self:write", false, {}, BotSelfTokenResponse>;
    /**
     * Саморегистрация вебхука бота
     *
     * Метод позволяет боту самостоятельно изменить `URL` своего исходящего вебхука своим же токеном — без участия администратора и без знания собственного `id`. Меняется вебхук того бота, которому принадлежит токен. Пустая строка в `outgoing_url` стирает адрес: события перестают приходить на URL, а при включённой истории событий продолжают сохраняться в ней.
     *
     * Адрес бота с разворачиванием ссылок (событие `message_link_shared` или режим `trigger_on: unfurl`) меняет только администратор или владелец пространства методом [Редактирование бота](PUT /bots/{id}). Такому боту этот метод отвечает `400` с кодом `forbidden` на любой новый адрес, в том числе на пустую строку.
     *
     * Скоуп `bot_self:webhook:write`. PUT /bot/webhook
     */
    selfUpdateBotWebhook: PachcaOp<"bot_self:webhook:write", false, {
      body: BotWebhookSelfUpdateRequest;
    }, BotSelfResponse>;
    /**
     * Список ботов
     *
     * Боты, которых вызывающий вправе настраивать: созданные им самим и те, чьи настройки открывают ему доступ к редактированию. Если создавать интеграции разрешено только администраторам, сотруднику без этой роли метод отвечает `403`, даже для его собственных ботов.
     *
     * Параметр `query` отбирает ботов по части имени или ника, без опечаток. Токены ботов в списке не приходят: значение токена показывают один раз, а сами токены бота отдаёт [Список токенов бота](GET /bots/{id}/tokens).
     *
     * Перечень всех ботов пространства, включая чужих, доступен владельцу пространства на тарифе «Корпорация» — [Список ботов пространства](GET /company/bots). Там чужие боты приходят с одними лишь именем и ником, остальные настройки скрыты.
     *
     * Скоуп `bots:read`. GET /bots
     */
    listBots: PachcaOp<"bots:read", false, {
      query?: {
        /** Поисковая фраза для фильтрации ботов по имени или нику */
        query?: string;
        /** Количество возвращаемых сущностей за один запрос. Целое число вне допустимых значений заменяется ближайшей границей. */
        limit?: number;
        /** Курсор для пагинации (из `meta.paginate.next_page`) */
        cursor?: string;
      };
    }, {
        data: Array<BotResponse>;
        meta: PaginationMeta;
      }>;
    /**
     * Новый бот
     *
     * Создаёт бота в пространстве. По умолчанию бот получает входящий вебхук в своём формате и сразу отдаёт свой `access_token`. Сохраните токен при создании: тот же самый повторно не показывают, останется перевыпустить его методом [Ротация токена бота](POST /bots/{id}/recreate_token).
     *
     * С `empty: true` создаётся пустой бот, как в интерфейсе: только имя и ник, без входящего вебхука и, если не передан `scopes`, без токена. Токены ему выпускают методом [Новый токен бота](POST /bots/{id}/tokens), а входящий вебхук включают полем `kind`.
     *
     * Созданный бот ещё никуда не пишет. В беседу и канал он пишет только как участник, а добавляют его как сотрудника — методом [Добавление участников](POST /chats/{id}/members), передав `id` бота. В канале бот получает роль редактора. Личные сообщения и треды в открытых чатах членства не требуют.
     *
     * Входящий вебхук бота отправляет сообщение сразу во все беседы и каналы, где бот состоит, поэтому набор его чатов и решает, куда оно попадёт. Токен для этого не нужен, достаточно адреса вебхука. Чтобы написать в один конкретный чат, берите метод [Новое сообщение](POST /messages) — вот там токен уже нужен.
     *
     * Авторизацию от имени сотрудника можно включить сразу, передав `oauth_client`, а страницу в витрине заполнить в `promo`. У серверного клиента секрет приходит в `client_secret` один раз. Ссылку авторизации для кнопки собирает и код на токен обменивает сервер бота — по шагам в разделе [Получение токена](/guides/oauth/flow).
     *
     * Бота с разворачиванием ссылок создаёт только администратор или владелец пространства: остальным — `400` с кодом `forbidden`. Если создавать интеграции разрешено только администраторам, остальным метод отвечает `403`.
     *
     * Аватар боту ставят после создания методом [Загрузка аватара бота](PUT /bots/{id}/avatar).
     *
     * Скоуп `bots:write`. POST /bots
     */
    createBot: PachcaOp<"bots:write", false, {
      body: BotCreateRequest;
    }, BotCreateResponse>;
    /**
     * Информация о боте
     *
     * Настройки бота. Токен в ответе не приходит — его показывают один раз при создании бота и при вызове метода [Ротация токена бота](POST /bots/{id}/recreate_token). Токены бота отдаёт [Список токенов бота](GET /bots/{id}/tokens).
     *
     * Метод отдаёт только тех ботов, которых вызывающий вправе настраивать: своих, а также чужих, если настройки бота открывают доступ администраторам пространства или владельцам и администраторам бесед и каналов, где бот состоит. На остальных метод ответит `403`. Если создавать интеграции разрешено только администраторам, сотруднику без этой роли метод отвечает `403`, даже для его собственных ботов.
     *
     * Токену со скоупом `bots:write` метод отвечает и без `bots:read`. Если у токена есть скоуп `bots:write` и вы можете управлять токенами бота (`permissions.recreate_token`), в `webhook` приходят адрес входящего вебхука `url`, секрет подписи `secret_token` и тело последнего запроса на входящий вебхук `last_request_body`.
     *
     * Перечень всех ботов пространства, включая чужих, доступен владельцу пространства на тарифе «Корпорация» — [Список ботов пространства](GET /company/bots).
     *
     * Скоуп `bots:read`. GET /bots/{id}
     */
    getBot: PachcaOp<"bots:read", false, {
      path: {
        /** Идентификатор бота */
        id: number;
      };
    }, BotResponse>;
    /**
     * Редактирование бота
     *
     * Меняет настройки бота: перезаписываются только переданные поля.
     *
     * Команды, скоупы, события, домены разворачивания ссылок и роли редактирования заменяются переданным списком целиком. Скоупы относятся к основному токену бота — тому, что без имени, а если такого нет, к самому старому — и применяются к нему сразу, перевыпускать его не нужно. Права отдельного токена меняет [Изменение токена бота](PUT /bots/{id}/tokens/{token_id}).
     *
     * Когда `oauth_client` делает клиента серверным, его секрет приходит в `client_secret` один раз. Ссылку авторизации для кнопки собирает и код на токен обменивает сервер бота — по шагам в разделе [Получение токена](/guides/oauth/flow). Страницу в витрине задаёт `promo`, пока авторизация включена.
     *
     * Только администратор или владелец пространства включает и выключает событие `message_link_shared`, включает режим `trigger_on: unfurl`, а у бота с одним из них меняет домены и адрес вебхука и включает историю событий.
     *
     * Если изменение лишает бота права состоять в тегах (`single_chat: true` или `who_can_add` со значением `creator` или `creator_admin`), он выходит из всех тегов и из чатов, куда попал через них, а в чатах, куда его добавили напрямую, остаётся. Подробнее — в разделе [Бот в тегах](/guides/bots/settings#bot-v-tegah).
     *
     * Имя бота, авторизацию от имени сотрудника и страницу в витрине меняют только его создатель и администратор пространства, если настройки бота открывают администраторам доступ к редактированию. Остальные настройки нельзя менять у бота, настройки которого вам недоступны (поле «Кто может редактировать настройки бота» на вкладке «Основное»). Если создавать интеграции разрешено только администраторам, сотруднику без этой роли метод отвечает `403`, даже для его собственных ботов.
     *
     * Аватар бота ставят и убирают отдельные методы [Загрузка аватара бота](PUT /bots/{id}/avatar) и [Удаление аватара бота](DELETE /bots/{id}/avatar).
     *
     * Скоуп `bots:write`. PUT /bots/{id}
     */
    updateBot: PachcaOp<"bots:write", false, {
      path: {
        /** Идентификатор бота */
        id: number;
      };
      body: BotUpdateRequest;
    }, BotResponse>;
    /**
     * Удаление бота
     *
     * Убирает бота из пространства насовсем. Все токены бота сразу перестают работать, как и авторизации, выданные ему сотрудниками. Бот исключается из всех чатов, его вебхуки удаляются, страница в витрине тоже.
     *
     * Удаление доступно создателю бота, а также администратору пространства, если настройки бота открывают администраторам доступ к редактированию. Владельцы и администраторы чатов удалять бота не могут, даже если им разрешено его редактировать. Если создавать интеграции разрешено только администраторам, сотруднику без этой роли метод отвечает `403`, даже для его собственных ботов.
     *
     * Скоуп `bots:write`. DELETE /bots/{id}
     */
    deleteBot: PachcaOp<"bots:write", false, {
      path: {
        /** Идентификатор бота */
        id: number;
      };
    }, void>;
    /**
     * Загрузка аватара бота
     *
     * Ставит или заменяет аватар бота. Менять его может тот, кому доступно [Редактирование бота](PUT /bots/{id}).
     *
     * Файл передаётся в формате `multipart/form-data`, в ответе приходит только ссылка на новое изображение. Принимаются `jpg`, `jpeg`, `png` и `gif`, любой `gif` — не больше 2 МБ, картинка уменьшается до 1024 на 1024 пикселя, а `png` сохраняется как `jpg` на белом фоне. Прозрачным остаётся только небольшой `png`: до 100 КБ и не больше 256 пикселей по каждой стороне либо легче 10 КБ.
     *
     * Уменьшенная копия приходит в поле `avatar_url` бота, например в методе [Информация о боте](GET /bots/{id}).
     *
     * Скоуп `bots:write`. PUT /bots/{id}/avatar
     */
    updateBotAvatar: PachcaOp<"bots:write", false, {
      path: {
        /** Идентификатор бота */
        id: number;
      };
      body: {
        /** Файл изображения для аватара */
        image: PachcaFileInput;
      };
    }, AvatarData>;
    /**
     * Удаление аватара бота
     *
     * Убирает аватар бота. Доступно тому же, кому доступна [Загрузка аватара бота](PUT /bots/{id}/avatar).
     *
     * Если аватара не было, ответ всё равно `204`.
     *
     * Скоуп `bots:write`. DELETE /bots/{id}/avatar
     */
    deleteBotAvatar: PachcaOp<"bots:write", false, {
      path: {
        /** Идентификатор бота */
        id: number;
      };
    }, void>;
    /**
     * Ротация токена бота
     *
     * Метод генерирует боту новый `access_token` и сразу инвалидирует прежний. Используйте его при компрометации токена или плановой ротации секрета в `CI`.
     *
     * Перевыпускается основной токен бота — тот, что без имени, а если такого нет, самый старый. Прежний токен удаляется, а новый создаётся с новым идентификатором и без имени. Метод [Перевыпуск токена бота](POST /bots/{id}/tokens/{token_id}/reissue) сохраняет имя и идентификатор токена и меняет одно значение: так перевыпускают отдельный токен и основной токен с именем.
     *
     * Новый токен возвращается в ответе только один раз — сохраните его сразу. Права у него те же: скоупы переносятся с прежнего токена. Если у бота нет ни одного токена, новый основной токен получает набор прав по умолчанию. В `webhook` ответа приходят адрес входящего вебхука `url`, секрет подписи `secret_token` и тело последнего запроса на входящий вебхук `last_request_body`.
     *
     * Ротация доступна создателю бота, а также администратору пространства, если настройки бота открывают администраторам доступ к редактированию. Владелец чата, где состоит бот, ротировать токен не может, даже когда остальные настройки бота ему открыты. Если создавать интеграции разрешено только администраторам, сотруднику без этой роли метод отвечает `403`, даже для его собственных ботов.
     *
     * Скоуп `bots:write`. POST /bots/{id}/recreate_token
     */
    recreateBotToken: PachcaOp<"bots:write", false, {
      path: {
        /** Идентификатор бота */
        id: number;
      };
    }, BotCreateResponse>;
    /**
     * Ротация секрета клиента
     *
     * Выпускает новый `client_secret` для авторизации от имени сотрудника. Прежний секрет перестаёт работать сразу, поэтому сначала подготовьте бота к замене. Уже выданные авторизации и полученные токены продолжают работать.
     *
     * Новый секрет приходит в `client_secret` один раз. Метод работает только у бота с включённой авторизацией и серверным клиентом (`confidential: true`), иначе отвечает `400` с кодом `invalid`. В `webhook` ответа приходят адрес входящего вебхука `url`, секрет подписи `secret_token` и тело последнего запроса на входящий вебхук `last_request_body`.
     *
     * Ротация доступна создателю бота, а также администратору пространства, если настройки бота открывают администраторам доступ к редактированию. Если создавать интеграции разрешено только администраторам, сотруднику без этой роли метод отвечает `403`, даже для его собственных ботов.
     *
     * Скоуп `bots:write`. POST /bots/{id}/rotate_client_secret
     */
    rotateBotClientSecret: PachcaOp<"bots:write", false, {
      path: {
        /** Идентификатор бота */
        id: number;
      };
    }, BotResponse>;
    /**
     * Каталог прав бота
     *
     * Права, которые можно выдать этому боту: его токенам и авторизации от имени сотрудника. У каждого права есть описание, категория и готовые наборы, в которые оно входит, как при выборе прав в интерфейсе.
     *
     * Каталог доступен тем же, кто видит токены бота: создателю бота, а также администратору пространства, если настройки бота открывают администраторам доступ к редактированию.
     *
     * Скоуп `bots:read`. GET /bots/{id}/scopes
     */
    getBotScopes: PachcaOp<"bots:read", false, {
      path: {
        /** Идентификатор бота */
        id: number;
      };
    }, BotScopeCatalog>;
    /**
     * Список токенов бота
     *
     * Действующие токены бота: основной, выпущенный вместе с ботом, и отдельные — со своим именем и правами. Значение токена здесь замаскировано: полностью его показывают один раз, при выпуске и перевыпуске.
     *
     * Работать с токенами бота могут только его создатель и администратор пространства, если настройки бота открывают администраторам доступ к редактированию. Владельцу чата с ботом метод отвечает `403`, даже когда остальные настройки бота ему открыты. Если создавать интеграции разрешено только администраторам, сотруднику без этой роли метод отвечает `403`, даже для его собственных ботов.
     *
     * Скоуп `bots:read`. GET /bots/{id}/tokens
     */
    listBotTokens: PachcaOp<"bots:read", false, {
      path: {
        /** Идентификатор бота */
        id: number;
      };
      query?: {
        /** Количество возвращаемых сущностей за один запрос. Целое число вне допустимых значений заменяется ближайшей границей. */
        limit?: number;
        /** Курсор для пагинации (из `meta.paginate.next_page`) */
        cursor?: string;
      };
    }, {
        data: Array<BotAccessToken>;
        meta: PaginationMeta;
      }>;
    /**
     * Новый токен бота
     *
     * Выпускает боту ещё один токен со своим именем и правами. Токенов у бота может быть несколько: например, отдельный на каждый сервис, чтобы отзывать их по одному.
     *
     * Значение токена приходит в ответе один раз — сохраните его сразу. Токен бессрочный и работает, пока его не удалят.
     *
     * Права выбирают из тех, что можно выдать боту: их перечисляет [Каталог прав бота](GET /bots/{id}/scopes). На право не из каталога метод отвечает `400`. Без `scopes` токен выпускается без прав.
     *
     * Работать с токенами бота могут только его создатель и администратор пространства, если настройки бота открывают администраторам доступ к редактированию. Владельцу чата с ботом метод отвечает `403`, даже когда остальные настройки бота ему открыты. Если создавать интеграции разрешено только администраторам, сотруднику без этой роли метод отвечает `403`, даже для его собственных ботов.
     *
     * Скоуп `bots:write`. POST /bots/{id}/tokens
     */
    createBotToken: PachcaOp<"bots:write", false, {
      path: {
        /** Идентификатор бота */
        id: number;
      };
      body: BotTokenCreateRequest;
    }, BotAccessToken>;
    /**
     * Изменение токена бота
     *
     * Меняет имя или права токена. Новые права действуют сразу: перевыпускать токен не нужно, его значение остаётся прежним. Права заменяются переданным списком целиком.
     *
     * Работать с токенами бота могут только его создатель и администратор пространства, если настройки бота открывают администраторам доступ к редактированию. Владельцу чата с ботом метод отвечает `403`, даже когда остальные настройки бота ему открыты. Если создавать интеграции разрешено только администраторам, сотруднику без этой роли метод отвечает `403`, даже для его собственных ботов.
     *
     * Скоуп `bots:write`. PUT /bots/{id}/tokens/{token_id}
     */
    updateBotToken: PachcaOp<"bots:write", false, {
      path: {
        /** Идентификатор бота */
        id: number;
        /** Идентификатор токена */
        tokenId: number;
      };
      body: BotTokenUpdateRequest;
    }, BotAccessToken>;
    /**
     * Удаление токена бота
     *
     * Удаляет токен: запросы с ним сразу перестают проходить. Остальные токены бота продолжают работать.
     *
     * Работать с токенами бота могут только его создатель и администратор пространства, если настройки бота открывают администраторам доступ к редактированию. Владельцу чата с ботом метод отвечает `403`, даже когда остальные настройки бота ему открыты. Если создавать интеграции разрешено только администраторам, сотруднику без этой роли метод отвечает `403`, даже для его собственных ботов.
     *
     * Скоуп `bots:write`. DELETE /bots/{id}/tokens/{token_id}
     */
    deleteBotToken: PachcaOp<"bots:write", false, {
      path: {
        /** Идентификатор бота */
        id: number;
        /** Идентификатор токена */
        tokenId: number;
      };
    }, void>;
    /**
     * Перевыпуск токена бота
     *
     * Заменяет значение токена новым: прежнее сразу перестаёт работать, имя и права остаются. Новое значение приходит в ответе один раз — сохраните его сразу.
     *
     * Метод нужен, когда токен утёк или его меняют по плану. Основной токен бота перевыпускает и [Ротация токена бота](POST /bots/{id}/recreate_token).
     *
     * Работать с токенами бота могут только его создатель и администратор пространства, если настройки бота открывают администраторам доступ к редактированию. Владельцу чата с ботом метод отвечает `403`, даже когда остальные настройки бота ему открыты. Если создавать интеграции разрешено только администраторам, сотруднику без этой роли метод отвечает `403`, даже для его собственных ботов.
     *
     * Скоуп `bots:write`. POST /bots/{id}/tokens/{token_id}/reissue
     */
    reissueBotToken: PachcaOp<"bots:write", false, {
      path: {
        /** Идентификатор бота */
        id: number;
        /** Идентификатор токена */
        tokenId: number;
      };
    }, BotAccessToken>;
    /**
     * Список ботов пространства
     *
     * Все боты пространства, включая тех, кто недоступен вам для редактирования. У таких ботов приходят только имя и ник, остальные настройки — `null`. Только тех ботов, которых вы можете настраивать, возвращает метод [Список ботов](GET /bots).
     *
     * Метод доступен владельцу пространства. Каждый запрос записывается в [журнал аудита событий](/guides/audit-events) с типом `company_bots_accessed`.
     *
     * Скоуп `company_bots:read`. GET /company/bots
     */
    listCompanyBots: PachcaOp<"company_bots:read", false, {
      query?: {
        /** Поисковая фраза для фильтрации ботов по имени */
        query?: string;
        /** Количество возвращаемых сущностей за один запрос. Целое число вне допустимых значений заменяется ближайшей границей. */
        limit?: number;
        /** Курсор для пагинации (из `meta.paginate.next_page`) */
        cursor?: string;
      };
    }, {
        data: Array<CompanyBotResponse>;
        meta: PaginationMeta;
      }>;
    /**
     * История событий
     *
     * Журнал событий бота: то же самое, что уходит в исходящий вебхук, но забирается запросом. Метод нужен, когда принимать вебхуки на свой адрес нельзя — обработчик недоступен из интернета, поднимается не всегда или пишется прямо сейчас.
     *
     * Журнал ведётся, только когда в настройках бота включён пункт «Сохранять историю событий» на вкладке «Исходящий вебхук». Адрес вебхука при этом можно не указывать вовсе, а если он указан, событие и уедет на него, и ляжет в журнал.
     *
     * Метод работает только с токеном бота: у личного токена своего журнала нет. События отдаются от новых к старым, идентификатор события — строка, а не число.
     *
     * Сам журнал не очищается: обработанные события удаляйте методом [Удаление события истории](DELETE /webhooks/events/{id}), иначе они придут снова при повторном запросе.
     *
     * Журнал у бота один на всех, кто ходит его токеном: сервер бота, поток событий, команда CLI `pachca bots listen-events`. События, которые вы только просматриваете, оставляйте в журнале для них.
     *
     * Те же события можно получать сразу, как они происходят, по ссылке из метода [Поток событий](GET /webhooks/events/stream).
     *
     * Скоуп `webhooks:events:read`, только бот. GET /webhooks/events
     */
    getWebhookEvents: PachcaOp<"webhooks:events:read", true, {
      query?: {
        /** Количество возвращаемых сущностей за один запрос. Целое число вне допустимых значений заменяется ближайшей границей. */
        limit?: number;
        /** Курсор для пагинации (из `meta.paginate.next_page` или `meta.paginate.prev_page`) */
        cursor?: string;
      };
    }, {
        data: Array<WebhookEvent>;
        meta: PaginationMeta;
      }>;
    /**
     * Поток событий
     *
     * Ссылка, по которой события бота приходят сразу, как они происходят, в формате Server-Sent Events. Это те же события, что ложатся в [Историю событий](GET /webhooks/events). Поток подходит боту, который не принимает вебхуки на свой адрес, но должен отвечать быстро, например на нажатие кнопки или отправку формы.
     *
     * Поток работает, только когда в настройках бота включён пункт «Сохранять историю событий». Если пункт выключен или поток недоступен, метод отвечает `404` без тела. Метод работает только с токеном бота.
     *
     * Ссылку открывают без токена, например через `EventSource` или `curl -N`: доступ даёт сама ссылка, поэтому храните её как секрет. Каждое событие приходит сообщением SSE без имени, в нём запись истории с полями `id`, `event_type`, `payload` и `created_at`. Служебные сообщения приходят именованными событиями SSE и отличаются полем `type`: `confirm_subscription` подтверждает подписку, а `disconnect` сообщает, что сервер закрыл подключение.
     *
     * Ссылка действует от одного до двух часов, до `expires_at`. В этот момент сервер присылает по ней `disconnect` и закрывает подключение, а `EventSource` после него сам не переподключается. Запрос в пределах того же часа по UTC возвращает ту же ссылку, а запрос в последний час перед `expires_at` даёт новую. Меняйте ссылку примерно за пять минут до `expires_at`: подключитесь по новой, пока работает старая, и закройте старое подключение, когда новое подтвердит подписку. Если `disconnect` всё же пришёл, получите новую ссылку и подключитесь заново.
     *
     * Чтобы ничего не пропустить, после каждого подключения, в том числе после переподключения и смены ссылки, дождитесь подтверждения подписки и только потом прочитайте [Историю событий](GET /webhooks/events). Доставка в поток не гарантирована: обработанные события всё равно удаляйте методом [Удаление события истории](DELETE /webhooks/events/{id}), а повторы отсекайте по `id`. Если у бота есть адрес вебхука и запись удалена до повторной доставки на него, повтор приходит в поток ещё раз с новым `id`: такие повторы отсекают по ключу из `payload`, как в разделе [Идемпотентная обработка](/guides/webhook/handler#idempotentnaya-obrabotka). Подробнее — в разделе [События в реальном времени](/guides/webhook/polling#sobytiya-v-realnom-vremeni).
     *
     * Скоуп `webhooks:events:read`, только бот. GET /webhooks/events/stream
     */
    getWebhookEventsStream: PachcaOp<"webhooks:events:read", true, {}, WebhookEventsStream>;
    /**
     * Удаление события истории
     *
     * Убирает событие из журнала бота. Разбирая журнал, удаляйте событие сразу после обработки: журнал не очищается сам, и всё, что осталось, придёт снова при повторном запросе.
     *
     * Метод работает только с токеном того бота, которому принадлежит событие. Журнал у бота один на всех, кто ходит его токеном, поэтому удаляйте только события, которые обработал ваш код.
     *
     * Скоуп `webhooks:events:delete`, только бот. DELETE /webhooks/events/{id}
     */
    deleteWebhookEvent: PachcaOp<"webhooks:events:delete", true, {
      path: {
        /** Идентификатор события */
        id: string;
      };
    }, void>;
  };
  chats: {
    /**
     * Новый чат
     *
     * Создаёт беседу или канал. Владелец токена становится владельцем чата, и роль эта в дальнейшем не передаётся.
     *
     * Мульти-гость, как и в интерфейсе, создавать чаты не может: метод отвечает ему `403`.
     *
     * Для создания личной переписки 1 на 1 с пользователем пользуйтесь методом [Новое сообщение](POST /messages). Чтобы обсудить конкретное сообщение, чат заводить не нужно — под ним заводят тред методом [Новый тред](POST /messages/{id}/thread). Разговору на одну тему постоянное место тоже не нужно: для него есть метод [Новый самостоятельный тред](POST /threads).
     *
     * Участников можно передать сразу: `member_ids` добавляет поимённо, `group_tag_ids` приводит всех, кто состоит в теге, и дальше поддерживает состав сам. Идентификаторы, которых в пространстве нет, а также приостановленные и удалённые сотрудники запрос не останавливают: чат создаётся с остальными участниками, а такие идентификаторы приходят в `meta.not_found_member_ids`. То же с идентификаторами из `group_tag_ids`, которых нет среди тегов пространства: чат создаётся с остальными тегами, а такие идентификаторы приходят в `meta.not_found_group_tag_ids`. С ботами строже: если настройка бота «Кто может добавлять бота в чаты» не разрешает вам его добавить, чат не создаётся, а метод отвечает `403` с кодом `bot_add_denied` и идентификаторами таких ботов в `value`. Бот с настройкой «Ограничить одним чатом», который уже состоит в другой беседе или канале (архивные не в счёт), тоже останавливает запрос, если он есть в `member_ids` или создаёт чат сам: чат не создаётся, а метод отвечает `409` с кодом `single_chat_bot_occupied` и идентификаторами таких ботов в `value`.
     *
     * Аватар чату ставят после создания методом [Загрузка аватара чата](PUT /chats/{id}/avatar).
     *
     * Скоуп `chats:create`. POST /chats
     */
    createChat: PachcaOp<"chats:create", false, {
      body: ChatCreateRequest;
    }, {
        data: Chat;
        /** Метаданные ответа */
        meta: {
          /** Идентификаторы из `member_ids`, которые не удалось добавить: такого сотрудника нет в пространстве, он приостановлен или удалён. Пустой массив, если добавлены все. */
          notFoundMemberIds: Array<number>;
          /** Идентификаторы из `group_tag_ids`, которых нет среди тегов пространства. Пустой массив, если подключены все. */
          notFoundGroupTagIds: Array<number>;
        };
      }>;
    /**
     * Список чатов
     *
     * По умолчанию — беседы, каналы и личные переписки, где состоит владелец токена. С `availability=public` метод отдаёт вместо этого все открытые чаты пространства, включая те, куда вызывающий не вступал. Мульти-гостю — только открытые чаты, где он участник.
     *
     * Закрытые чаты метод отдаёт только их участникам, при любых `availability` и `archived`. Перечень всех чатов пространства, включая закрытые, доступен владельцу пространства на тарифе «Корпорация» — [Список чатов пространства](GET /company/chats).
     *
     * Треды в списке не приходят никогда, для них есть [Список тредов](GET /threads).
     *
     * `archived=true` не переключает выдачу на архив, а добавляет архивные чаты к активным.
     *
     * Скоуп `chats:read`. GET /chats
     */
    listChats: PachcaOp<"chats:read", false, {
      query?: {
        /** Поле сортировки */
        sort?: ChatSortField;
        /** Направление сортировки по полю `sort`, например `sort=last_message_at&order=desc`. Без `sort` направление применяется к `id`. */
        order?: SortOrder;
        /** Параметр, который отвечает за доступность и выборку чатов для пользователя */
        availability?: ChatAvailability;
        /** Добавляет к выдаче архивные чаты. По умолчанию возвращаются только активные. Работает при любом значении `availability`. */
        archived?: boolean;
        /** Фильтрация по времени создания последнего сообщения: вернутся чаты, где оно позже указанного. Значение в ISO-8601, смещение вида `+03:00` учитывается, время без смещения считается UTC. */
        lastMessageAtAfter?: string;
        /** Фильтрация по времени создания последнего сообщения: вернутся чаты, где оно раньше указанного. Значение в ISO-8601, смещение вида `+03:00` учитывается, время без смещения считается UTC. */
        lastMessageAtBefore?: string;
        /** Фильтрация по личным и групповым чатам. Если параметр не указан, возвращаются любые чаты. */
        personal?: boolean;
        /** Количество возвращаемых сущностей за один запрос. Целое число вне допустимых значений заменяется ближайшей границей. */
        limit?: number;
        /** Курсор для пагинации (из `meta.paginate.next_page` или `meta.paginate.prev_page`) */
        cursor?: string;
      };
    }, {
        data: Array<Chat>;
        meta: PaginationMeta;
      }>;
    /**
     * Экспорт сообщений
     *
     * Заказ выгрузки сообщений пространства за период. Архив готовится в фоне.
     *
     * Личные переписки выгружаются с текстом и тредами, когда поле `export_personal_chats` метода [Информация о пространстве](GET /company) равно `true`. Иначе в `content` их сообщений приходит `-`, а их треды не выгружаются.
     *
     * Период выгрузки — не больше 45 дней, с `chat_ids` — до 366 дней, а `end_at` не может быть раньше `start_at`. Другой период отвечает `422` с кодом `invalid_date_range`. Больше 50 `chat_ids` отвечают `422` с кодом `too_long`, а дата не в формате YYYY-MM-DD — `422` с кодом `invalid` по ключу этого поля.
     *
     * С заголовком `Prefer: return=representation` ответ приходит со статусом `202` и идентификатором экспорта в `data.id`. Без заголовка ответ пустой, со статусом `204`. По идентификатору архив отдаёт метод [Скачать архив экспорта](GET /chats/exports/{id}), когда сборка закончится.
     *
     * Когда архив готов, на адрес из `webhook_url` приходит вебхук с идентификатором в поле `export_id`. Заказавший получает письмо и уведомление в Пачке со ссылкой вида `/full_exports/{id}` — число в ней и есть идентификатор.
     *
     * Следующую выгрузку пространство может заказать через 90 секунд после предыдущей, даже если та ещё собирается. Более ранний запрос отвечает `422` с кодом `rate_limit`. Запрос, отклонённый из-за периода, списка чатов или формата даты, паузу не запускает.
     *
     * Адрес в `webhook_url` должен быть доступен из интернета по `http` или `https`, иначе метод отвечает `422` с кодом `invalid_webhook_url` и экспорт не запускается. Адрес с ошибкой в записи, без хоста, с другой схемой или с IP-адресом из приватного диапазона отклоняется до паузы, и исправленный запрос можно отправить сразу. Имя хоста, которое не резолвится или ведёт на приватный адрес (например, `localhost`), проверяется уже после того, как запрос запустил паузу, поэтому исправленный запрос получится отправить только после неё.
     *
     * Скоуп `chat_exports:write`. POST /chats/exports
     */
    requestExport: PachcaOp<"chat_exports:write", false, {
      body: ExportRequest;
    }, ChatExport>;
    /**
     * Скачать архив экспорта
     *
     * В ответ на запрос сервер вернёт `302 Found` с заголовком `Location`, содержащим временную ссылку на скачивание файла. Большинство HTTP-клиентов автоматически следуют редиректу и скачивают файл.
     *
     * Ссылка действует 5 минут, используйте её сразу. Скачать архив может только тот, кто заказал выгрузку: другому сотруднику с тем же правом метод откажет.
     *
     * Сам архив хранится 7 дней. После этого метод по-прежнему отвечает `302`, но хранилище по ссылке возвращает ошибку, и выгрузку нужно заказать заново.
     *
     * Пока архив собирается, метод отвечает `404` с кодом `export_file_not_found`.
     *
     * Скоуп `chat_exports:read`. GET /chats/exports/{id}
     */
    downloadExport: PachcaOp<"chat_exports:read", false, {
      path: {
        /** Идентификатор экспорта: `export_id` из вебхука о готовом архиве или число из ссылки вида `/full_exports/{id}` в уведомлении в Пачке */
        id: number;
      };
    }, void>;
    /**
     * Информация о чате
     *
     * Карточка чата вместе с составом участников и привязанными тегами. Что в чате написано, возвращает [Список сообщений чата](GET /messages).
     *
     * Закрытая беседа своего пространства, в которой вызывающий не состоит, отвечает `403`. Чат другого пространства отвечает `404`, как несуществующий. Открытый канал своего пространства отдаётся и тому, кто в него не вступал. Владельцу пространства метод тоже не открывает чужие закрытые чаты — весь их перечень отдаёт [Список чатов пространства](GET /company/chats).
     *
     * Скоуп `chats:read`. GET /chats/{id}
     */
    getChat: PachcaOp<"chats:read", false, {
      path: {
        /** Идентификатор чата: в ссылке веб-приложения это число из пути `/chats/{id}` */
        id: number;
      };
    }, Chat>;
    /**
     * Редактирование чата
     *
     * Меняет название беседы или канала и его доступность. Оба изменения видны участникам системным сообщением в ленте чата.
     *
     * Личный чат переименовать нельзя, архивный — тоже: сначала верните его из архива методом [Разархивация чата](PUT /chats/{id}/unarchive). У треда названия и доступности нет, и на его `chat_id` метод отвечает `403`. Метод доступен только владельцу и администратору чата, и в открытом чате, и в закрытом. Остальным участникам и тем, кто в чате не состоит, он отвечает `403`.
     *
     * Состав участников этим методом не меняется, для него есть [Добавление участников](POST /chats/{id}/members) и [Исключение участника](DELETE /chats/{id}/members/{user_id}).
     *
     * Аватар ставят и убирают отдельные методы [Загрузка аватара чата](PUT /chats/{id}/avatar) и [Удаление аватара чата](DELETE /chats/{id}/avatar).
     *
     * Скоуп `chats:update`. PUT /chats/{id}
     */
    updateChat: PachcaOp<"chats:update", false, {
      path: {
        /** Идентификатор чата */
        id: number;
      };
      body: ChatUpdateRequest;
    }, Chat>;
    /**
     * Архивация чата
     *
     * Отправляет беседу или канал в архив: чат пропадает из списков у всех участников, новые сообщения в него не принимаются, а история сохраняется.
     *
     * Архивация не только замораживает чат. Из него исключаются гости с ролью `guest`, а теги от него отвязываются. Мульти-гости (`multi_guest`) в чате остаются. Приведённые тегом сотрудники при этом остаются обычными участниками, но состав чата больше не поддерживается сам. Метод [Разархивация чата](PUT /chats/{id}/unarchive) не возвращает ни гостей, ни привязку тегов.
     *
     * Треды, заведённые в чате, остаются открытыми: комментарии в них пишут, правят и удаляют и после архивации.
     *
     * Личный чат и тред в архив не отправляются. Повторная архивация уже архивного чата отвечает `403`.
     *
     * Скоуп `chats:archive`. PUT /chats/{id}/archive
     */
    archiveChat: PachcaOp<"chats:archive", false, {
      path: {
        /** Идентификатор чата */
        id: number;
      };
    }, void>;
    /**
     * Загрузка аватара чата
     *
     * Ставит или заменяет аватар беседы или канала. Менять его может тот, кому доступно [Редактирование чата](PUT /chats/{id}). У личного чата и треда своего аватара нет, и на них метод отвечает `403`. Тот же ответ придёт для архивного чата: сначала верните его из архива методом [Разархивация чата](PUT /chats/{id}/unarchive).
     *
     * Файл передаётся в формате `multipart/form-data`, в ответе приходит только ссылка на новое изображение. Принимаются `jpg`, `jpeg`, `png` и `gif`, любой `gif` — не больше 2 МБ, картинка уменьшается до 1024 на 1024 пикселя, а `png` сохраняется как `jpg` на белом фоне. Прозрачным остаётся только небольшой `png`: до 100 КБ и не больше 256 пикселей по каждой стороне либо легче 10 КБ.
     *
     * Та же ссылка приходит в поле `avatar_url` чата, например в методе [Информация о чате](GET /chats/{id}).
     *
     * Скоуп `chats:update`. PUT /chats/{id}/avatar
     */
    updateChatAvatar: PachcaOp<"chats:update", false, {
      path: {
        /** Идентификатор чата */
        id: number;
      };
      body: {
        /** Файл изображения для аватара */
        image: PachcaFileInput;
      };
    }, AvatarData>;
    /**
     * Удаление аватара чата
     *
     * Убирает аватар беседы или канала. Доступно тому же, кому доступна [Загрузка аватара чата](PUT /chats/{id}/avatar).
     *
     * Если аватара не было, ответ всё равно `204`.
     *
     * Скоуп `chats:update`. DELETE /chats/{id}/avatar
     */
    deleteChatAvatar: PachcaOp<"chats:update", false, {
      path: {
        /** Идентификатор чата */
        id: number;
      };
    }, void>;
    /**
     * Отметка чата прочитанным
     *
     * Отмечает чат прочитанным для владельца токена до последнего сообщения на момент запроса, как если дочитать его до конца в интерфейсе. Прочитанными станут и сообщения, пришедшие уже после того, как вы получили историю. Чтобы оставить новые сообщения непрочитанными, после вызова отметьте чат методом [Отметка чата непрочитанным](PUT /chats/{id}/unread).
     *
     * Метод обнуляет счётчик непрочитанного и снимает отметку непрочитанного упоминания «@» и ручную отметку «Непрочитанное». Чат пропадает из непрочитанных чатов, а тред из непрочитанных тредов. Так же это работает в архивном чате и с выключенными уведомлениями, и ни архив, ни уведомления метод не меняет. Треды чата — отдельные чаты: каждый тред отмечают по его `chat_id`.
     *
     * Остальные участники видят свои сообщения прочитанными, а владелец токена появляется в [Списке прочитавших сообщение](GET /messages/{id}/read_member_ids) у всех сообщений до конца чата. С персональным токеном это выглядит так, будто чат прочитал сам сотрудник. С токеном бота чат отмечается прочитанным для бота, и авторы увидят «Прочитано», даже если сообщения не открыл ни один сотрудник. Отправка сообщения тоже двигает позицию чтения, но «Прочитано» у чужих сообщений появляется только после этого метода.
     *
     * В ответе приходит `last_read_message_id`, позиция чтения после вызова. В чате без сообщений она `null`, и метод ничего не меняет. Повторный запрос ничего не меняет и не рассылает событие о прочтении повторно.
     *
     * Работает в беседах, каналах, личных чатах и тредах, где владелец токена состоит, и никуда его не добавляет: тред передают его `chat_id`. Открытый чат или доступный тред, где владелец токена не состоит, и чат другого пространства отвечают `404`. Закрытый чат, где владелец токена не состоит, отвечает `403`, в том числе владельцу и администраторам пространства. `403` отвечают и недоступный тред, и открытый чат, где не состоит мульти-гость. У метода свой [лимит](/api/limits) на частоту запросов.
     *
     * Скоуп `chats:mark_read`. PUT /chats/{id}/read
     */
    markChatRead: PachcaOp<"chats:mark_read", false, {
      path: {
        /** Идентификатор чата (беседы, канала, личного чата или чата треда) */
        id: number;
      };
    }, ChatReadPosition>;
    /**
     * Разархивация чата
     *
     * Возвращает беседу или канал из архива: чат снова появляется в списках, и в него снова можно писать.
     *
     * Если чат и так не в архиве, метод всё равно отвечает успехом.
     *
     * Скоуп `chats:archive`. PUT /chats/{id}/unarchive
     */
    unarchiveChat: PachcaOp<"chats:archive", false, {
      path: {
        /** Идентификатор чата */
        id: number;
      };
    }, void>;
    /**
     * Отметка чата непрочитанным
     *
     * Помечает чат непрочитанным для владельца токена, как «Отметить непрочитанным» в интерфейсе. Меняется только его собственный счётчик, остальные участники ничего не замечают.
     *
     * Без `message_id` непрочитанным становится последнее сообщение чата, с `message_id` — это сообщение и все после него. Повторный запрос с тем же сообщением ничего не меняет, а в чате без сообщений метод отвечает успехом и ничего не делает.
     *
     * Работает в беседах, каналах, личных чатах и тредах, где владелец токена состоит: тред передают его `chat_id`. Скрытый личный чат снова появляется в списке. Открытый чат или доступный тред, где владелец токена не состоит, сообщение из другого чата и чат другого пространства отвечают `404`. Закрытый чат и недоступный тред отвечают `403`.
     *
     * Скоуп `chats:mark_unread`. PUT /chats/{id}/unread
     */
    markChatUnread: PachcaOp<"chats:mark_unread", false, {
      path: {
        /** Идентификатор чата (беседы, канала, личного чата или чата треда) */
        id: number;
      };
      body?: MarkChatUnreadRequest;
    }, void>;
    /**
     * Список чатов пространства
     *
     * Беседы и каналы всего пространства, включая закрытые, где вы не состоите участником. Личные переписки и треды не возвращаются.
     *
     * По умолчанию отдаются и активные, и архивные чаты. Параметр `activity` оставляет в выдаче только одно из состояний.
     *
     * Метод доступен владельцу пространства. Каждый запрос записывается в [журнал аудита событий](/guides/audit-events) с типом `company_chats_accessed`.
     *
     * Скоуп `company_chats:read`. GET /company/chats
     */
    listCompanyChats: PachcaOp<"company_chats:read", false, {
      query?: {
        /** Состояние чатов. Если параметр не указан, возвращаются и активные, и архивные чаты. */
        activity?: ChatActivity;
        /** Количество возвращаемых сущностей за один запрос. Целое число вне допустимых значений заменяется ближайшей границей. */
        limit?: number;
        /** Курсор для пагинации (из `meta.paginate.next_page`) */
        cursor?: string;
      };
    }, {
        data: Array<Chat>;
        meta: PaginationMeta;
      }>;
  };
  members: {
    /**
     * Добавление тегов
     *
     * Привязывает теги к беседе или каналу, чтобы состав чата поддерживался сам.
     *
     * После добавления тега все его участники автоматически становятся участниками чата. Состав участников тега и чата синхронизируется автоматически: при добавлении нового участника в тег он сразу появляется в чате, при удалении из тега — удаляется из чата.
     *
     * Если хотя бы один из переданных тегов не найден, метод отвечает `404` и не привязывает ни одного. Тег, который к чату уже привязан, повторно не привязывается, а его участники всё равно догружаются в чат. Бот, которому нельзя состоять в тегах, по тегу в чат не приходит.
     *
     * Привязать тег может участник закрытой беседы и любой сотрудник пространства в открытом чате, а отцепить — только владелец или администратор чата методом [Исключение тега из чата](DELETE /chats/{id}/group_tags/{tag_id}). Гостю и мульти-гостю метод отвечает `403`, какая бы роль в чате у них ни была.
     *
     * Скоуп `chat_members:write`. POST /chats/{id}/group_tags
     */
    addTags: PachcaOp<"chat_members:write", false, {
      path: {
        /** Идентификатор чата */
        id: number;
      };
      body: AddTagsRequest;
    }, void>;
    /**
     * Исключение тега из чата
     *
     * Отцепляет тег от беседы или канала и выводит оттуда сотрудников, которых держал только он.
     *
     * Выход происходит фоном, уже после ответа: метод отвечает `204` сразу, а состав чата меняется через несколько мгновений. Останутся владелец чата, те, кого приводит другой тег этого же чата, и те, кого добавляли в чат вручную.
     *
     * Снять тег с чата может владелец или администратор чата. Привязать его обратно можно методом [Добавление тегов](POST /chats/{id}/group_tags).
     *
     * Скоуп `chat_members:write`. DELETE /chats/{id}/group_tags/{tag_id}
     */
    removeTag: PachcaOp<"chat_members:write", false, {
      path: {
        /** Идентификатор чата */
        id: number;
        /** Идентификатор тега */
        tagId: number;
      };
    }, void>;
    /**
     * Выход из чата
     *
     * Владелец токена выходит из беседы или канала сам. В закрытой беседе остальные видят системное сообщение о выходе, в открытом чате и канале — нет.
     *
     * Выйти нельзя, если сотрудника держит в чате привязанный тег: метод ответит `403`, пока тег не снимут с сотрудника или с чата. Гостю и мульти-гостю метод тоже отвечает `403`, какая бы роль в чате у них ни была. Из личной переписки выйти нельзя: метод отвечает `400` с кодом `personal_chat`. На тред метод отвечает `403`: из треда выходят методом [Исключение участника](DELETE /chats/{id}/members/{user_id}) со своим идентификатором, по правилам исключения и с правом `chat_members:write`. А вот из архивного чата выйти можно.
     *
     * Вернуться в открытый чат можно самому, в закрытый — только если кто-то из участников добавит обратно. Другого сотрудника выводит [Исключение участника](DELETE /chats/{id}/members/{user_id}).
     *
     * Скоуп `chats:leave`. DELETE /chats/{id}/leave
     */
    leaveChat: PachcaOp<"chats:leave", false, {
      path: {
        /** Идентификатор чата */
        id: number;
      };
    }, void>;
    /**
     * Список участников чата
     *
     * Кто состоит в беседе, канале или треде. Боты приходят наравне с сотрудниками, с `bot: true`.
     *
     * Владелец пространства может получить состав участников любого чата пространства. Администраторы и боты получают состав только тех чатов, где состоят сами, и открытых чатов пространства. Состав треда получает каждый, кто видит тред, подробнее — в разделе [Кто видит тред](/guides/threads#kto-vidit-tred).
     *
     * В выдачу попадают только действующие сотрудники: приостановленные не приходят, хотя членство у них сохраняется. Поле `role` в записи — роль сотрудника в пространстве. Роль участника в чате метод не отдаёт: кто в какой роли, показывает только фильтр `role` — по запросу на каждую роль.
     *
     * Скоуп `chat_members:read`. GET /chats/{id}/members
     */
    listMembers: PachcaOp<"chat_members:read", false, {
      path: {
        /** Идентификатор чата */
        id: number;
      };
      query?: {
        /** Роль в чате. В канале пишут создатель, админы и редакторы, а участник там — подписчик. */
        role?: ChatMemberRoleFilter;
        /** Количество возвращаемых сущностей за один запрос. Целое число вне допустимых значений заменяется ближайшей границей. */
        limit?: number;
        /** Курсор для пагинации (из `meta.paginate.next_page` или `meta.paginate.prev_page`) */
        cursor?: string;
      };
    }, {
        data: Array<User>;
        meta: PaginationMeta;
      }>;
    /**
     * Добавление участников
     *
     * Добавляет сотрудников и ботов в беседу, канал или тред. Бота добавляют так же, как сотрудника: его `id` в `member_ids`. В канале он получает роль редактора, а в беседе становится обычным участником — и только после этого может туда писать.
     *
     * Добавлять участников могут сотрудники и боты. Гостю и мульти-гостю метод отвечает `403`, как и в интерфейсе, какая бы роль в чате у них ни была.
     *
     * Роль в чате назначается в момент добавления: в беседе и канале владелец пространства и администратор становятся администраторами чата, остальные — обычными участниками. Дальше роль в чате сама не пересчитывается: повышение сотрудника в пространстве не меняет его роль там, где он уже состоит. Менять роль нужно методом [Редактирование роли участника](PUT /chats/{id}/members/{user_id}).
     *
     * Тех, кто уже состоит в чате, метод пропускает молча и ошибкой это не считает. А вот неизвестный или неактивный идентификатор останавливает весь запрос: метод отвечает `404` и перечисляет такие значения, никто при этом не добавляется.
     *
     * Бота добавляет только тот, кому это разрешает настройка бота «Кто может добавлять бота в чаты» — подробнее в разделе [Настройки бота](/guides/bots/settings#kto-mozhet-dobavlyat-bota-v-chaty). Если в `member_ids` есть бот, которого вам добавлять нельзя, метод не добавляет никого и отвечает `403` с кодом `bot_add_denied` и идентификаторами таких ботов в `value`. Если в том же запросе есть и неизвестный идентификатор, ответ — `404` с обеими ошибками.
     *
     * Бота с настройкой «Ограничить одним чатом», который уже состоит в другой беседе или канале (архивные не в счёт), метод тоже не добавляет: ответ `409` с кодом `single_chat_bot_occupied` и идентификаторами таких ботов в `value`, никто из запроса не добавляется. В треды такого бота добавлять можно.
     *
     * Добавить сразу целый отдел удобнее тегом — [Добавление тегов](POST /chats/{id}/group_tags): тогда состав чата поддерживается сам.
     *
     * Скоуп `chat_members:write`. POST /chats/{id}/members
     */
    addMembers: PachcaOp<"chat_members:write", false, {
      path: {
        /** Идентификатор чата (беседа, канал или чат треда). В тред метод добавляет без уведомления, поэтому упомяните добавленных в сообщении треда. Сотрудников не из родительского чата он добавляет в тред при любой настройке «Использовать сквозные треды». В треде у сообщения все становятся обычными участниками, а в самостоятельном треде владелец и администраторы пространства становятся Админами. */
        id: number;
      };
      body: AddMembersRequest;
    }, void>;
    /**
     * Исключение участника
     *
     * Убирает сотрудника или бота из беседы, канала или треда. Из треда исключают по его `chat_id`: это может любой участник треда или чата, где находится родительское сообщение, в том числе бот, а мульти-гость — только если он Создатель или Админ этого чата или владелец самостоятельного треда. Роль исключаемого в треде не важна, кроме `owner`. По тем же правилам метод со своим идентификатором выводит из треда самого владельца токена. В закрытой беседе исключённый теряет доступ к чату, но остаётся в тредах, где состоял.
     *
     * Сотрудника, которого держит в чате привязанный тег, этим методом убрать нельзя: ответ придёт успешный, а сотрудник останется в чате. Снимите с него тег методом [Редактирование сотрудника](PUT /users/{id}) или отцепите тег от чата методом [Исключение тега из чата](DELETE /chats/{id}/group_tags/{tag_id}).
     *
     * Владельца чата исключить нельзя: метод ответит `400` с кодом `cannot_kick_owner`. В треде так же защищена роль `owner` в списке участников треда: она у создателя самостоятельного треда и бывает у участника треда у сообщения. Из беседы или канала владелец может выйти только сам, методом [Выход из чата](DELETE /chats/{id}/leave), а владелец самостоятельного треда остаётся в нём.
     *
     * Скоуп `chat_members:write`. DELETE /chats/{id}/members/{user_id}
     */
    removeMember: PachcaOp<"chat_members:write", false, {
      path: {
        /** Идентификатор чата */
        id: number;
        /** Идентификатор пользователя */
        userId: number;
      };
    }, void>;
    /**
     * Редактирование роли участника
     *
     * Меняет роль участника беседы или канала. Роль в чате с ролью в пространстве не связана: рядовой сотрудник может быть администратором чата, а повышение в пространстве роли в чатах не меняет.
     *
     * Роль `editor` существует только в каналах. Себе роль сменить нельзя, как и тому, кто в чате не состоит, и владельцу чата: он всегда имеет права администратора чата. Повторная установка той же роли считается ошибкой, а не повтором.
     *
     * Отказ приходит со статусом `400`, а причину называет код: `not_applicable` — роль `editor` вне канала, `self_update` — своя роль, `owner_protected` — роль владельца чата, `already_assigned` — у участника уже эта роль, `forbidden` — эту роль вам менять нельзя. На сотрудника, который в чате не состоит, метод отвечает `404`.
     *
     * Скоуп `chat_members:write`. PUT /chats/{id}/members/{user_id}
     */
    updateMemberRole: PachcaOp<"chat_members:write", false, {
      path: {
        /** Идентификатор чата */
        id: number;
        /** Идентификатор пользователя */
        userId: number;
      };
      body: UpdateMemberRoleRequest;
    }, void>;
  };
  messages: {
    /**
     * Список закреплённых сообщений
     *
     * Сообщения, закреплённые в шапке беседы, канала или личной переписки, от последних закреплённых к ранним, как в шапке чата в интерфейсе. Закрепляют и открепляют методами [Закрепление сообщения](POST /messages/{id}/pin) и [Открепление сообщения](DELETE /messages/{id}/pin).
     *
     * Сообщения приходят в том же виде, что в методе [Список сообщений чата](GET /messages). Удалённое сообщение из списка пропадает. Архивный чат тоже отдаёт свои закреплённые сообщения. В тредах сообщения не закрепляют, поэтому для треда список всегда пустой.
     *
     * Доступ такой же, как к ленте чата: чаты, где владелец токена состоит, и открытые чаты пространства. Мульти-гостю открыты только чаты, где он состоит. Владелец пространства в закрытый чат без членства не попадает. Закрытый чат и недоступный тред отвечают `403`, а чат другого пространства и неизвестный идентификатор отвечают `404`.
     *
     * Скоуп `messages:read`. GET /chats/{id}/pinned_messages
     */
    listPinnedMessages: PachcaOp<"messages:read", false, {
      path: {
        /** Идентификатор чата (беседы, канала или личного чата) */
        id: number;
      };
      query?: {
        /** Количество возвращаемых сущностей за один запрос. Целое число вне допустимых значений заменяется ближайшей границей. */
        limit?: number;
        /** Курсор для пагинации (из `meta.paginate.next_page` или `meta.paginate.prev_page`) */
        cursor?: string;
      };
    }, {
        data: Array<Message>;
        meta: PaginationMeta;
      }>;
    /**
     * История сообщения
     *
     * Сохранённые состояния сообщения от раннего к последнему: текст и файлы до каждой правки текста или файлов и на момент удаления, кто и когда их изменил. В историю входят 50 последних изменений. Сообщение может быть из любого чата пространства, включая закрытые чаты, где вы не состоите, личные переписки и треды. Удалённое сообщение тоже отдаётся.
     *
     * Каждое состояние в `data`, кроме текущего, заканчивается правкой или удалением. Последнее состояние живого сообщения текущее (`action: current`), а удалённого — снимок на момент удаления (`action: deleted`), если снимок сохранился. `version_id` совпадает с `message_version_id` событий `message_updated` и `message_deleted` в [журнале аудита событий](GET /audit_events): так от записи журнала переходят к тексту до правки или удаления.
     *
     * Текст личных переписок и тредов в них приходит, только если поле `export_personal_chats` метода [Информация о пространстве](GET /company) равно `true`. Иначе `text` и `content` у их состояний — `null` с причиной `personal_chat_rule`, а файлы, авторы и время изменений приходят.
     *
     * Метод доступен владельцу пространства. Каждый успешный запрос записывается в [журнал аудита событий](/guides/audit-events) с типом `company_messages_accessed`. Сообщение другого пространства отвечает `404`, как несуществующее. Если сервис временно недоступен, метод отвечает `503` с кодом `service_unavailable`.
     *
     * Скоуп `company_messages:read`. GET /company/messages/{id}/history
     */
    getMessageHistory: PachcaOp<"company_messages:read", false, {
      path: {
        /** Идентификатор сообщения */
        id: number;
      };
    }, MessageHistoryResponse>;
    /**
     * Новое сообщение
     *
     * Отправляет сообщение в беседу или канал, личное сообщение пользователю или комментарий в тред.
     *
     * С `entity_type: "discussion"` — это значение по умолчанию — в `entity_id` можно передать `chat_id` любого чата, так что для отправки достаточно знать идентификатор чата. Сообщение в тред можно адресовать и идентификатором самого треда, а личное — идентификатором пользователя, но тогда нужен соответствующий `entity_type`: `thread` или `user`.
     *
     * Личный чат для этого создавать не требуется: он появится сам, если между вами ещё не было переписки. Между двумя пользователями может быть только один личный чат. Со своим собственным идентификатором сообщение уйдёт в чат с самим собой, где пишут заметки себе. С токеном бота это чат, где состоит только сам бот: его не видит ни один сотрудник.
     *
     * Тред, в отличие от личного чата, сам не появляется: если у сообщения треда ещё нет, его сначала создают методом [Новый тред](POST /messages/{id}/thread).
     *
     * Подписчик канала пишет только в тредах его сообщений, а в сам канал метод отвечает ему `403`. Кто где может писать — в разделе [Права и роли](/guides/permissions).
     *
     * Текст в поле `content` разбирается как markdown: жирный, курсив, зачёркнутый, строчный код, блок кода и ссылки. Списки и таблицы не разбираются — `-`, `1.` и `|` остаются как есть, у цитаты пропадает `>`, а строка с решёткой и пробелом становится жирной. Таблицу, чек-лист или диаграмму приложите файлом `.md`: Пачка показывает такой файл оформленным, а если он единственный документ в сообщении, его начало видно прямо в чате. Подробности — в разделе [Форматирование текста](/guides/markdown).
     *
     * К сообщению можно приложить не больше 10 файлов. Превью ссылки строится, только если передать `link_preview` в корне тела запроса.
     *
     * Действуют лимиты на частоту отправки и суточный предел на число сообщений в один чат от одного отправителя. При превышении любого из них метод отвечает `429`, а в заголовке `Retry-After` приходит пауза до следующей попытки. Значения пределов — в разделе [Лимиты](/api/limits).
     *
     * Скоуп `messages:create`. POST /messages
     */
    createMessage: PachcaOp<"messages:create", false, {
      body: MessageCreateRequest;
    }, Message>;
    /**
     * Список сообщений чата
     *
     * Лента сообщений беседы, канала, треда или личной переписки — по `chat_id` нужного чата.
     *
     * По умолчанию сообщения приходят от новых к старым, то есть первыми идут последние сообщения чата. За более ранними обращайтесь с параметрами `limit` и `cursor`.
     *
     * Чтобы получить сообщения после известного, передайте его `id` в `after_message_id`: придут только более новые сообщения, от старых к новым. Следующие страницы берите по `meta.paginate.next_page` с `order=asc`. Если новых сообщений нет, ответ пустой, но `next_page` в нём есть: по этому курсору опрашивайте чат дальше. Само сообщение-граница может быть удалено.
     *
     * Удалённые сообщения в список не попадают.
     *
     * Сообщения треда отдаются по `chat_id` самого треда, а не по чату, где висит родительское сообщение. Этот `chat_id` приходит в поле `thread.chat_id` родительского сообщения. Родительское сообщение в ленту треда не входит: его отдаёт метод [Информация о сообщении](GET /messages/{id}) по `message_id` треда.
     *
     * Скоуп `messages:read`. GET /messages
     */
    listChatMessages: PachcaOp<"messages:read", false, {
      query: {
        /** Идентификатор чата (беседа, канал, диалог или чат треда) */
        chatId: number;
        /** Поле сортировки */
        sort?: MessageSortField;
        /** Направление сортировки по `id`: `asc` отдаёт сообщения от старых к новым, `desc` от новых к старым. Курсор направление не хранит: передавайте `order` и в запросах со `cursor`. */
        order?: SortOrder;
        /** Количество возвращаемых сущностей за один запрос. Целое число вне допустимых значений заменяется ближайшей границей. */
        limit?: number;
        /** Курсор для пагинации (из `meta.paginate.next_page` или `meta.paginate.prev_page`) */
        cursor?: string;
        /** Идентификатор сообщения, после которого нужны сообщения: придут сообщения с бо́льшим `id`, от старых к новым. Сочетается с `limit` и `cursor`. Из `order` допускается только `asc`, а `page` и `per` не допускаются, иначе метод отвечает `400`. Сообщение может быть удалено: оно служит только границей. */
        afterMessageId?: number;
      };
    }, {
        data: Array<Message>;
        meta: PaginationMeta;
      }>;
    /**
     * Информация о сообщении
     *
     * Сообщение вместе с автором, вложениями и кнопками.
     *
     * Удалённое сообщение метод всё равно отдаёт — с пустым `content` и заполненным `deleted_at`, без файлов и реакций.
     *
     * Ссылки на файлы в ответе временные. Обычный файл отдаётся прямой ссылкой на хранилище, а защищённый и зашифрованный — адресом API, по которому нужен токен со скоупом `files:read`.
     *
     * Скоуп `messages:read`. GET /messages/{id}
     */
    getMessage: PachcaOp<"messages:read", false, {
      path: {
        /** Идентификатор сообщения. Ссылка веб-приложения указывает на сообщение параметром `sidebar_message`, а без него — параметром `message`. Число из `thread_message_id` — сообщение, под которым висит тред. */
        id: number;
      };
    }, Message>;
    /**
     * Редактирование сообщения
     *
     * Меняет текст, файлы и кнопки уже отправленного сообщения. В интерфейсе у него появляется пометка о правке, а уведомлений правка не присылает и непрочитанным сообщение не делает: кто его уже прочитал, изменений не заметит. Кто прочитал, показывает метод [Список прочитавших сообщение](GET /messages/{id}/read_member_ids). Текст оформляется по тем же правилам, что и в методе [Новое сообщение](POST /messages).
     *
     * Править можно только свои сообщения, и только обычные: на системное, пересланное, голосовое сообщение и стикер метод отвечает `403`. Тот же ответ придёт на удалённое сообщение и на сообщение в ленте архивного чата. Комментарии в тредах архивного чата правятся как обычно. Ограничений по давности отправки нет.
     *
     * Файлы и кнопки заменяются целиком: пустой массив снимает их все, а отсутствие поля в теле оставляет как было. Превью ссылок, которые остались в тексте, правка сохраняет, а превью удалённых ссылок убирает. По ссылкам, добавленным правкой, автоматическое превью не строится, но бот с событием `message_link_shared` получает по ним вебхук `link_shared`.
     *
     * Скоуп `messages:update`. PUT /messages/{id}
     */
    updateMessage: PachcaOp<"messages:update", false, {
      path: {
        /** Идентификатор сообщения */
        id: number;
      };
      body: MessageUpdateRequest;
    }, Message>;
    /**
     * Удаление сообщения
     *
     * Удаление сообщения доступно отправителю, админам и редакторам в чате. В личных сообщениях оба собеседника — админы и удаляют сообщения друг друга, а гость и мульти-гость удаляют там только свои. В треде чужие сообщения удаляют по роли в чате, где находится родительское сообщение, а в самостоятельном треде — его владелец и Админы треда. Владельцем становится создатель, а Админами — владелец и администраторы пространства, когда их добавляют в тред. Ограничений по давности отправки сообщения нет. В ленте архивного чата сообщения не удаляются, метод отвечает `403`, а комментарии в его тредах удаляются как обычно.
     *
     * Текст, файлы и реакции пропадают у всех и не восстанавливаются, закрепление снимается, а в переписке на месте сообщения остаётся пометка «Сообщение удалено».
     *
     * Тред, заведённый под этим сообщением, остаётся вместе со всей перепиской в нём. На уже удалённое сообщение метод отвечает `403`, а удалено ли оно, видно по полю `deleted_at` в ответе метода [Информация о сообщении](GET /messages/{id}).
     *
     * Скоуп `messages:delete`. DELETE /messages/{id}
     */
    deleteMessage: PachcaOp<"messages:delete", false, {
      path: {
        /** Идентификатор сообщения */
        id: number;
      };
    }, void>;
    /**
     * Unfurl (разворачивание ссылок)
     *
     * Подставляет в сообщение предпросмотр ссылки, собранный самим ботом: заголовок, описание и картинку. Так внутренние адреса компании, которые Пачка сама открыть не может, показываются в переписке карточкой.
     *
     * Метод доступен только боту, у которого исходящий вебхук настроен на разворачивание ссылок. Такой бот получает событие `message_link_shared` и отвечает на него этим методом, причём состоять в чате с сообщением ему не нужно — достаточно, чтобы чат был в его пространстве.
     *
     * Домен ссылки должен быть в списке разрешённых у бота, а сама ссылка — присутствовать в тексте сообщения, иначе метод ответит ошибкой. Ответ приходит пустым даже тогда, когда ни одно превью не применилось. В объекте сообщения превью нет: их видно только в приложении.
     *
     * Скоуп `link_previews:write`, только бот. POST /messages/{id}/link_previews
     */
    unfurl: PachcaOp<"link_previews:write", true, {
      path: {
        /** Идентификатор сообщения */
        id: number;
      };
      body: LinkPreviewsRequest;
    }, void>;
    /**
     * Закрепление сообщения
     *
     * Закрепляет сообщение в шапке беседы, канала или личной переписки, где его видят все участники. Ограничения на число закреплённых сообщений нет.
     *
     * Метод отвечает `403` в треде, в архивном чате и подписчику канала. Уже закреплённое сообщение отвечает `409`, а удалённое — `422`.
     *
     * Скоуп `pins:write`. POST /messages/{id}/pin
     */
    pinMessage: PachcaOp<"pins:write", false, {
      path: {
        /** Идентификатор сообщения */
        id: number;
      };
    }, void>;
    /**
     * Открепление сообщения
     *
     * Снимает закрепление с сообщения. Если сообщение не было закреплено, ответ всё равно `204`, поэтому повторный вызов безопасен.
     *
     * Скоуп `pins:write`. DELETE /messages/{id}/pin
     */
    unpinMessage: PachcaOp<"pins:write", false, {
      path: {
        /** Идентификатор сообщения */
        id: number;
      };
    }, void>;
  };
  company: {
    /**
     * Информация о пространстве
     *
     * Название пространства, его владелец, тариф и основные настройки: показ личных данных, сквозные треды, кто может создавать персональные токены и интеграции. Метод работает, даже когда пространство заблокировано и другие методы отвечают `402`.
     *
     * Название, показ личных данных и сквозные треды меняет [Редактирование пространства](PUT /company).
     *
     * Скоуп `company:read`. GET /company
     */
    getCompany: PachcaOp<"company:read", false, {}, Company>;
    /**
     * Редактирование пространства
     *
     * Меняет название пространства, показ личных данных и сквозные треды. Поля передаются без обёртки, перезаписываются только переданные. В ответе приходит пространство целиком, как в методе [Информация о пространстве](GET /company).
     *
     * Метод доступен владельцу и администраторам пространства. Слишком длинное название отклоняется с `422` и кодом `too_long`, а название, похожее на спам, с `422` и кодом `invalid`. Ключ ошибки в обоих случаях `company.name`.
     *
     * Аватар пространства и остальные настройки из веб-интерфейса, включая то, кто может создавать персональные токены и интеграции, меняются только там. Выгрузку личных переписок включает поддержка Пачки по запросу владельца.
     *
     * Скоуп `company:write`. PUT /company
     */
    updateCompany: PachcaOp<"company:write", false, {
      body: CompanyUpdateRequest;
    }, Company>;
    /**
     * Ссылка-приглашение
     *
     * Ссылка, по которой сотрудник сам входит в пространство. Это та же ссылка, что администратор получает в интерфейсе: у каждого администратора она своя, и метод отдаёт ссылку владельца токена.
     *
     * Ссылка действует 14 дней, срок приходит в `expires_at`. Если действующей ссылки нет или ей осталось меньше часа, метод выпускает новую, а прежняя перестаёт работать. Перевыпустить ссылку раньше срока можно методом [Перевыпуск ссылки-приглашения](POST /company/invite_link).
     *
     * Вошедший по ссылке становится сотрудником с ролью `user` и без тегов, а в его `inviter_id` записан владелец ссылки. Теги ему назначает [Редактирование сотрудника](PUT /users/{id}), и с ними он попадает в беседы и каналы этих тегов.
     *
     * Метод доступен владельцу и администраторам пространства. Пока название пространства похоже на спам, ссылка не выдаётся и метод отвечает `403`. Чтение ссылки входит в общий [лимит](/api/limits) со списками чатов и ботов пространства.
     *
     * Скоуп `invite_links:write`. GET /company/invite_link
     */
    getInviteLink: PachcaOp<"invite_links:write", false, {}, InviteLink>;
    /**
     * Перевыпуск ссылки-приглашения
     *
     * Выпускает новую ссылку-приглашение владельца токена. Прежняя ссылка этого администратора сразу перестаёт работать, в том числе уже разосланная из интерфейса. Ссылки других администраторов остаются.
     *
     * Метод нужен, когда ссылка попала к посторонним или её меняют по плану. Текущую ссылку без перевыпуска отдаёт [Ссылка-приглашение](GET /company/invite_link).
     *
     * Метод доступен владельцу и администраторам пространства. Пока название пространства похоже на спам, метод отвечает `403`.
     *
     * Скоуп `invite_links:write`. POST /company/invite_link
     */
    reissueInviteLink: PachcaOp<"invite_links:write", false, {}, InviteLink>;
  };
  customProperties: {
    /**
     * Список дополнительных полей
     *
     * Схема дополнительных полей пространства: идентификатор, название и тип каждого. Такие поля доступны только для сотрудников и напоминаний, наборы у них независимые, а нужный выбирает параметр `entity_type`. Значения приходят в самой сущности — в карточке сотрудника или в напоминании. Идентификаторы отсюда нужны, чтобы эти значения задавать.
     *
     * Поля типов «Файл» и «Множественный выбор» через API недоступны и в выдачу не попадают. Базовые поля карточки — имя, телефон, почта, отдел, теги — тоже: это не дополнительные поля.
     *
     * Набор полей задаёт администратор пространства, он же их переименовывает и удаляет. Поэтому список стоит перечитывать перед работой: значение для поля, которого уже нет, или для поля другой сущности молча пропускается, и ответ приходит успешный.
     *
     * Скоуп `custom_properties:read`. GET /custom_properties
     */
    listProperties: PachcaOp<"custom_properties:read", false, {
      query: {
        /** Тип сущности */
        entityType: SearchEntityType;
      };
    }, Array<CustomPropertyDefinition>>;
  };
  drafts: {
    /**
     * Новый черновик
     *
     * Кладёт черновик в беседу, тред или личную переписку. В интерфейсе Пачки он появляется в поле ввода этого чата, где сотрудник его допишет и отправит. Этим же методом создаётся отложенное сообщение: с полем `schedule` черновик уходит сам в назначенное время, без него просто лежит. Сам метод ничего не отправляет: черновик отправляют методом [Новое сообщение](POST /messages), передав в него `content` и `parent_message_id` черновика, а у каждого файла из `files` — `key`, `name` и `file_type`. Отправка сообщения черновик не удаляет: приложение Пачки убирает его само, а через API — методом [Удаление черновика](DELETE /drafts/{id}), иначе текст останется в поле ввода.
     *
     * Черновик виден только своему автору — его не видит ни собеседник, ни администратор пространства. Обычный черновик в чате может быть только один. Повторный вызов отвечает `409` с кодом `already_exists` и идентификатором существующего в `payload.draft_id`. Дописывают его методом [Редактирование черновика](PUT /drafts/{id}). У автора в одном чате или треде — не больше 50 отложенных сообщений.
     *
     * Для треда в `entity_id` передают идентификатор самого треда, а не сообщения, под которым он висит. Личной переписки с сотрудником может ещё не быть — тогда она заводится сама, как при обычной отправке сообщения.
     *
     * Пустой черновик создать нельзя: нужен либо текст, либо вложения.
     *
     * Токенам ботов метод недоступен.
     *
     * Скоуп `drafts:write`. POST /drafts
     */
    createDraft: PachcaOp<"drafts:write", false, {
      body: DraftCreateRequest;
    }, Draft>;
    /**
     * Список черновиков
     *
     * Свои черновики, от новых к старым.
     *
     * По умолчанию возвращаются только обычные черновики: отложенные нужно запросить параметром `type`. Отличить их в ответе можно по полю `schedule`.
     *
     * Пара `entity_type` и `entity_id` сужает выдачу до одного чата, треда или личной переписки. Если такого чата нет или он недоступен, метод отвечает пустым списком, а не ошибкой.
     *
     * Скоуп `drafts:read`. GET /drafts
     */
    listDrafts: PachcaOp<"drafts:read", false, {
      query?: {
        /** Что возвращать: `regular` — обычные черновики, `scheduled` — отложенные сообщения, `all` — и те и другие */
        type?: DraftType;
        /** Тип чата для фильтра по одному чату. Указывается вместе с `entity_id`: если прислать только один из двух, ответ будет `422`. */
        entityType?: MessageEntityType;
        /** Идентификатор того, что названо в `entity_type`. Указывается вместе с ним. */
        entityId?: number;
        /** Количество возвращаемых сущностей за один запрос. Целое число вне допустимых значений заменяется ближайшей границей. */
        limit?: number;
        /** Курсор для пагинации (из `meta.paginate.next_page` или `meta.paginate.prev_page`) */
        cursor?: string;
      };
    }, {
        data: Array<Draft>;
        meta: PaginationMeta;
      }>;
    /**
     * Информация о черновике
     *
     * Черновик. У отложенного сообщения сюда же приходит его расписание.
     *
     * Скоуп `drafts:read`. GET /drafts/{id}
     */
    getDraft: PachcaOp<"drafts:read", false, {
      path: {
        /** Идентификатор черновика */
        id: number;
      };
    }, Draft>;
    /**
     * Редактирование черновика
     *
     * Меняет свой черновик: текст, вложения, расписание и сообщение, ответом на которое он уйдёт (`parent_message_id`). Перезаписываются только переданные поля, поэтому дописать текст, не трогая вложения, можно одним `content`.
     *
     * Обычный черновик превращается в отложенное сообщение, если передать `schedule`. Обратный переход запрещён: `schedule: null` у отложенного отвечает `422` с кодом `draft_type_change_forbidden`. Чтобы отменить отправку, черновик убирают методом [Удаление черновика](DELETE /drafts/{id}).
     *
     * Править можно, только пока в чат разрешено писать. Если доступ к чату потерян, редактирование ответит `403`, а удаление всё равно сработает.
     *
     * Чат черновика этим методом не меняется, `entity_type` и `entity_id` он не принимает. Чтобы перенести черновик в другой чат, создайте новый и удалите прежний.
     *
     * Скоуп `drafts:write`. PUT /drafts/{id}
     */
    updateDraft: PachcaOp<"drafts:write", false, {
      path: {
        /** Идентификатор черновика */
        id: number;
      };
      body: DraftUpdateRequest;
    }, Draft>;
    /**
     * Удаление черновика
     *
     * Убирает свой черновик насовсем: восстановить его нельзя, вложения удаляются вместе с ним. У отложенного сообщения удаление и есть отмена отправки.
     *
     * Работает, даже если в чат уже нельзя писать. Повторный вызов отвечает `404`.
     *
     * Скоуп `drafts:write`. DELETE /drafts/{id}
     */
    deleteDraft: PachcaOp<"drafts:write", false, {
      path: {
        /** Идентификатор черновика */
        id: number;
      };
    }, void>;
  };
  files: {
    /**
     * Скачивание файла
     *
     * Отдаёт сам файл, а не ссылку на него, и подходит для любого вложения, которое видно токену. Для вложений без прямой ссылки на хранилище это единственный способ: в поле `url` у них стоит адрес этого метода, и открыть его можно только с токеном. Так отдаются зашифрованные файлы и отправленные из безопасного контура пространства — обе настройки описаны в разделе [Шифрование и безопасный контур](/guides/data-protection).
     *
     * Отказ приходит `403` с кодом `confidential_download_denied`. Сверяется при этом адрес, с которого пришёл запрос, то есть адрес вашего сервера, а не сотрудника, чьим токеном вы пользуетесь: для серверной интеграции это самая частая причина отказа. В пространстве с безопасным контуром файлы проверяет антивирус, и на файл, в котором найден вирус, метод отвечает тем же `403` с любого адреса.
     *
     * Ответ — тело файла и заголовок `Content-Disposition` с его именем, а не `JSON`. Зашифрованный файл расшифровывается на лету и приходит вложением целиком: `target` для него не действует. Если расшифровать не удалось, ответ — `400` с кодом `decryption_failed`.
     *
     * Вложение сообщения доступно тому, кто видит само сообщение, а вложение черновика — только его автору.
     *
     * Запрос `HEAD` на тот же адрес проходит те же проверки и отвечает только заголовками: `Content-Length` — размер файла или варианта из `target`, `Content-Disposition` — его имя. У зашифрованного файла `Content-Length` нет. Отказы приходят с теми же статусами, но без тела, а на отсутствующий файл или вариант — `404`.
     *
     * Скоуп `files:read`. GET /files/{id}
     */
    downloadFile: PachcaOp<"files:read", false, {
      path: {
        /** Идентификатор файла из поля `id` вложения */
        id: number;
      };
      query?: {
        /** Что отдать вместо исходного файла: `pdf_preview` — документ, переведённый в PDF, `pdf_first_page` — первая страница картинкой, `thumb` — уменьшенная копия изображения, `image` — изображение как есть. Без параметра приходит исходный файл. Вариант, которого у этого файла нет, приводит к `400`. */
        target?: FileTarget;
      };
    }, PachcaDownload>;
  };
  groupTags: {
    /**
     * Новый тег
     *
     * Создаёт тег. Тег — это способ держать состав чатов сам собой: его привязывают к беседе или каналу, и все, у кого этот тег есть, оказываются там автоматически.
     *
     * Сотрудников в тег добавляют не здесь, а в карточке каждого — [Редактирование сотрудника](PUT /users/{id}) с полем `list_tags`. Свежий тег создаётся пустым, с `users_count: 0`. К чату его привязывает метод [Добавление тегов](POST /chats/{id}/group_tags).
     *
     * Название уникально в пространстве без учёта регистра. Название с `@` отвечает `400` с кодом `invalid`, а названия `here` и `all` зарезервированы и отвечают `400` с кодом `use_of_system_words`. Пустое название или название из одних пробелов отвечает `400` с кодом `blank`. Занятое название отвечает `400` с кодом `taken`, а `409` приходит, только если такой же тег создали одновременно с запросом. Создавать теги могут владелец пространства и администратор, боту метод недоступен.
     *
     * Скоуп `group_tags:write`. POST /group_tags
     */
    createTag: PachcaOp<"group_tags:write", false, {
      body: GroupTagRequest;
    }, GroupTag>;
    /**
     * Список тегов
     *
     * Все теги пространства с числом сотрудников в каждом, независимо от того, к каким чатам они привязаны. Мульти-гостю приходят только теги активных бесед и каналов, где он участник.
     *
     * Параметр `names` ищет теги по названиям — это способ получить `id` по имени, известному из интерфейса. За один запрос он принимает не больше 100 имён, на большее число метод отвечает `400` с кодом `too_long`. Без `limit` и `cursor` все найденные по `names` теги приходят одной страницей.
     *
     * Кто состоит в конкретном теге, отдаёт [Список сотрудников тега](GET /group_tags/{id}/users).
     *
     * Скоуп `group_tags:read`. GET /group_tags
     */
    listTags: PachcaOp<"group_tags:read", false, {
      query?: {
        /** Массив названий тегов, по которым вы хотите отфильтровать список */
        names?: TagNamesFilter;
        /** Количество возвращаемых сущностей за один запрос. Целое число вне допустимых значений заменяется ближайшей границей. */
        limit?: number;
        /** Курсор для пагинации (из `meta.paginate.next_page` или `meta.paginate.prev_page`) */
        cursor?: string;
      };
    }, {
        data: Array<GroupTag>;
        meta: PaginationMeta;
      }>;
    /**
     * Информация о теге
     *
     * Название тега и число сотрудников в нём.
     *
     * В `users_count` считаются только действующие сотрудники: приостановленные в счётчик не попадают, хотя в методе [Список сотрудников тега](GET /group_tags/{id}/users) остаются.
     *
     * Мульти-гостю доступны только теги, которые приходят ему в [Список тегов](GET /group_tags), а на остальные метод отвечает `404`.
     *
     * Скоуп `group_tags:read`. GET /group_tags/{id}
     */
    getTag: PachcaOp<"group_tags:read", false, {
      path: {
        /** Идентификатор тега: в ссылке веб-приложения это число из параметра `tag_id` */
        id: number;
      };
    }, GroupTag>;
    /**
     * Редактирование тега
     *
     * Переименовывает тег. Состав сотрудников и привязки к чатам при этом не меняются: у всех, кто был в теге, он остаётся, только под новым названием.
     *
     * Название уникально в пространстве без учёта регистра. Название с `@` отвечает `400` с кодом `invalid`, а названия `here` и `all` зарезервированы и отвечают `400` с кодом `use_of_system_words`. Пустое название или название из одних пробелов отвечает `400` с кодом `blank`. Занятое название отвечает `400` с кодом `taken`, а `409` приходит, только если такое же название задали одновременно с запросом. Переименовывать теги могут владелец пространства и администратор, боту метод недоступен.
     *
     * Скоуп `group_tags:write`. PUT /group_tags/{id}
     */
    updateTag: PachcaOp<"group_tags:write", false, {
      path: {
        /** Идентификатор тега */
        id: number;
      };
      body: GroupTagRequest;
    }, GroupTag>;
    /**
     * Удаление тега
     *
     * Убирает тег из пространства: он снимается со всех сотрудников и отвязывается от всех чатов.
     *
     * Из чатов при этом никто не выходит. Сотрудники, которых тег привёл в беседу или канал, остаются там обычными участниками, и дальше их состав тегом уже не поддерживается. Чтобы вывести их из конкретного чата, пользуйтесь методом [Исключение тега из чата](DELETE /chats/{id}/group_tags/{tag_id}) до удаления самого тега.
     *
     * Удалять теги могут владелец пространства и администратор, боту метод недоступен.
     *
     * Скоуп `group_tags:write`. DELETE /group_tags/{id}
     */
    deleteTag: PachcaOp<"group_tags:write", false, {
      path: {
        /** Идентификатор тега */
        id: number;
      };
    }, void>;
    /**
     * Список сотрудников тега
     *
     * Кто состоит в теге. Приостановленные сотрудники в списке приходят, хотя в `users_count` самого тега они не учтены. Удалённые не приходят, а боты, помеченные тегом, в выдачу попадают.
     *
     * Состав тега меняют в карточке сотрудника — [Редактирование сотрудника](PUT /users/{id}) с полем `list_tags`, по одному сотруднику за раз.
     *
     * Мульти-гостю метод отвечает `403`: список сотрудников пространства ему закрыт, как и в интерфейсе.
     *
     * Скоуп `group_tags:read`. GET /group_tags/{id}/users
     */
    getTagUsers: PachcaOp<"group_tags:read", false, {
      path: {
        /** Идентификатор тега: в ссылке веб-приложения это число из параметра `tag_id` */
        id: number;
      };
      query?: {
        /** Количество возвращаемых сущностей за один запрос. Целое число вне допустимых значений заменяется ближайшей границей. */
        limit?: number;
        /** Курсор для пагинации (из `meta.paginate.next_page` или `meta.paginate.prev_page`) */
        cursor?: string;
      };
    }, {
        data: Array<User>;
        meta: PaginationMeta;
      }>;
  };
  importantMessages: {
    /**
     * Список важных сообщений
     *
     * Сообщения, которые владелец токена добавил в раздел «Важное», от последних добавленных к ранним.
     *
     * Отметка личная и видна только самому сотруднику. Она остаётся, даже если сотрудник вышел из чата или его исключили: такие сообщения тоже приходят в списке. Удалённое сообщение из раздела пропадает.
     *
     * Токенам ботов метод недоступен.
     *
     * Скоуп `important_messages:read`. GET /important_messages
     */
    listImportantMessages: PachcaOp<"important_messages:read", false, {
      query?: {
        /** Количество возвращаемых сущностей за один запрос. Целое число вне допустимых значений заменяется ближайшей границей. */
        limit?: number;
        /** Курсор для пагинации (из `meta.paginate.next_page` или `meta.paginate.prev_page`) */
        cursor?: string;
      };
    }, {
        data: Array<Message>;
        meta: PaginationMeta;
      }>;
    /**
     * Добавление сообщения в важные
     *
     * Добавляет сообщение в раздел «Важное» владельца токена, как «Добавить в важное» в интерфейсе. Отметка личная и видна только самому сотруднику. Закрепление, которое видят все участники чата, ставит метод [Закрепление сообщения](POST /messages/{id}/pin).
     *
     * Повторный вызов отвечает `204` и ничего не меняет. Сообщение, которое владелец токена не видит, отвечает `404`, как несуществующее, а удалённое — `404` с кодом `message_deleted`.
     *
     * Ботам чата при добавлении приходит вебхук `update` об этом сообщении, хотя его текст и `changed_at` не меняются. У добавления в важные и удаления из важных свой [лимит](/api/limits) на частоту запросов.
     *
     * Токенам ботов метод недоступен.
     *
     * Скоуп `important_messages:write`. POST /important_messages
     */
    addMessageToImportant: PachcaOp<"important_messages:write", false, {
      body: ImportantMessageRequest;
    }, void>;
    /**
     * Удаление сообщения из важных
     *
     * Убирает сообщение из раздела «Важное» владельца токена по идентификатору сообщения. Если сообщения в важных не было, ответ всё равно `204`, поэтому повторный вызов безопасен. Убрать можно и сообщение из чата, где сотрудник больше не состоит.
     *
     * Ботам чата при удалении приходит вебхук `update` об этом сообщении, хотя его текст и `changed_at` не меняются.
     *
     * Токенам ботов метод недоступен.
     *
     * Скоуп `important_messages:write`. DELETE /important_messages/{id}
     */
    removeMessageFromImportant: PachcaOp<"important_messages:write", false, {
      path: {
        /** Идентификатор сообщения */
        id: number;
      };
    }, void>;
  };
  reactions: {
    /**
     * Добавление реакции
     *
     * Ставит эмодзи-реакцию на сообщение от имени владельца токена.
     *
     * В поле `code` передаётся сам символ эмодзи: текстовые записи вроде `+1` или `:+1:` метод не принимает. Кастомный эмодзи пространства ставят по имени в поле `name`. Если пользователь уже ставил реакцию, повторно она установлена не будет. Для удаления реакции надо воспользоваться методом [Удаление реакции](DELETE /messages/{id}/reactions).
     *
     * Если под сообщением есть тред, реагирующий заодно подписывается на него и начинает получать новые сообщения треда.
     *
     * Сообщение, которое токену не видно, отвечает `404` с кодом `not_found`, как несуществующее, а удалённое — `404` с кодом `message_deleted`.
     *
     * **Лимиты реакций:**
     *
     * - Каждый пользователь может установить на сообщение не более **20 уникальных** реакций
     * - Сообщение может иметь не более **30 уникальных** реакций
     * - Общее количество реакций на сообщение не может превышать **1000**
     *
     * Скоуп `reactions:write`. POST /messages/{id}/reactions
     */
    addReaction: PachcaOp<"reactions:write", false, {
      path: {
        /** Идентификатор сообщения */
        id: number;
      };
      body: ReactionRequest;
    }, Reaction>;
    /**
     * Удаление реакции
     *
     * Снимает с сообщения свою реакцию.
     *
     * Чужая реакция и реакция, которой нет, отвечают `404`. Подписку на тред, если она появилась вместе с реакцией, снятие реакции не отменяет.
     *
     * Скоуп `reactions:write`. DELETE /messages/{id}/reactions
     */
    removeReaction: PachcaOp<"reactions:write", false, {
      path: {
        /** Идентификатор сообщения */
        id: number;
      };
      query?: {
        /** Emoji символ реакции. Обязателен без `name`: нужен именно символ, текстовые записи вроде `+1` или `:+1:` отклоняются как неизвестный эмодзи. С `name` не используется. */
        code?: string;
        /** Имя реакции, как в её поле `name`. С ним реакция ищется по имени, так снимается и кастомный эмодзи пространства. */
        name?: string;
      };
    }, void>;
    /**
     * Список реакций
     *
     * Все реакции на сообщении и кто их поставил: в каждой записи приходит `user_id` и сам символ.
     *
     * У удалённого сообщения список пуст — реакции пропадают вместе с текстом и файлами.
     *
     * Скоуп `reactions:read`. GET /messages/{id}/reactions
     */
    listReactions: PachcaOp<"reactions:read", false, {
      path: {
        /** Идентификатор сообщения */
        id: number;
      };
      query?: {
        /** Количество возвращаемых сущностей за один запрос. Целое число вне допустимых значений заменяется ближайшей границей. */
        limit?: number;
        /** Курсор для пагинации (из `meta.paginate.next_page` или `meta.paginate.prev_page`) */
        cursor?: string;
      };
    }, {
        data: Array<Reaction>;
        meta: PaginationMeta;
      }>;
  };
  readMembers: {
    /**
     * Список прочитавших сообщение
     *
     * Кто из участников чата дочитал ленту до этого сообщения. Отдаётся плоский массив идентификаторов.
     *
     * Самого вызывающего и автора сообщения в списке не будет никогда — считаются только остальные участники. Для сообщения в треде это участники треда, а не родительского чата.
     *
     * Имён метод не отдаёт. За ними ходят методом [Информация о сотруднике](GET /users/{id}) по каждому идентификатору.
     *
     * Метод помогает решить, поправить своё сообщение или дописать новое. [Редактирование сообщения](PUT /messages/{id}) никого не уведомляет: пока адресаты сообщение не прочитали, его проще поправить, а прочитанное лучше дополнить ответом. Если исходный текст должен остаться верным, поправьте его и коротко ответьте, что изменили. Проверяйте прямо перед правкой, когда новый текст готов: сообщение могут прочитать, пока вы его пишете.
     *
     * Скоуп `messages:read`. GET /messages/{id}/read_member_ids
     */
    listReadMembers: PachcaOp<"messages:read", false, {
      path: {
        /** Идентификатор сообщения */
        id: number;
      };
      query?: {
        /** Количество возвращаемых сущностей за один запрос. Целое число вне допустимых значений заменяется ближайшей границей. */
        limit?: number;
        /** Курсор для пагинации (из `meta.paginate.next_page` или `meta.paginate.prev_page`) */
        cursor?: string;
      };
    }, {
        data: Array<number>;
        meta: PaginationMeta;
      }>;
  };
  threads: {
    /**
     * Новый тред
     *
     * Заводит тред под сообщением — место, где обсуждают сказанное, не засоряя ленту чата. Тред — это отдельный доступ: в него можно позвать сотрудника, не открывая ему сам чат, и он увидит только тред и родительское сообщение. Если обсуждать нужно тему, а не сообщение, заводите тред методом [Новый самостоятельный тред](POST /threads).
     *
     * В новый тред сразу попадают тот, кто его создал, автор сообщения, все, кто ставил на сообщение реакции, и участники чата, включившие уведомления о тредах. Упомянутых в родительском сообщении — и поимённо, и тегом — добавляет фоновая задача сразу после создания, поэтому в первом ответе их может ещё не быть. Общие упоминания вроде `@all` в тред никого не приводят, а упомянутого, которого нет в самом чате, тред не подхватит.
     *
     * Чтобы разговаривать в треде, сразу отправьте в него первое сообщение методом [Новое сообщение](POST /messages) с `entity_type: "thread"` и `id` треда из ответа. Чтобы только следить за тредом, как пункт «Подписаться на тред» в меню сообщения, первое сообщение не нужно: тема треда — родительское сообщение. Названия у треда нет, и удалить его нельзя ни через API, ни в приложении.
     *
     * Если тред у сообщения уже есть, метод возвращает его. У удалённого сообщения метод отвечает `404` с кодом `message_deleted`, даже если тред под ним уже есть: его идентификатор приходит в поле `thread` метода [Информация о сообщении](GET /messages/{id}). Новый тред заводит только участник чата, и только пока чат не в архиве: тому, кто видит открытую беседу или канал, но не состоит в них, и в архивном чате метод отвечает `403`, а уже созданный тред возвращает. Чтобы прочитать тред, метод не нужен: его идентификатор приходит в поле `thread` самого сообщения. Тред под сообщением, которое само лежит в треде, завести нельзя: вложенных тредов в Пачке нет, и метод отвечает `400` с кодом `thread_message`.
     *
     * Скоуп `threads:create`. POST /messages/{id}/thread
     */
    createThread: PachcaOp<"threads:create", false, {
      path: {
        /** Идентификатор сообщения */
        id: number;
      };
    }, Thread>;
    /**
     * Новый самостоятельный тред
     *
     * Заводит тред, который ни к чему не привязан: место для разговора, диалога с агентом или звонка, которому не нужен отдельный чат. Собрать в нём можно любых сотрудников.
     *
     * Создатель треда становится его единственным участником и владельцем: он удаляет чужие сообщения в треде, а его самого исключить нельзя. Владелец и администраторы пространства, которых добавят в тред, становятся в нём Админами и тоже удаляют чужие сообщения. В самостоятельных тредах, созданных до появления у тредов владельцев, создатель — обычный участник: есть ли у треда владелец, показывает [Список участников чата](GET /chats/{id}/members) с `role=owner`. Поля `message_id` и `message_chat_id` в ответе возвращаются как `null`. Участников добавляет метод [Добавление участников](POST /chats/{id}/members) по `chat_id` треда. Уведомления он не присылает, поэтому в первом сообщении упомяните добавленных. Упоминание `@ник` или `@тег` в сообщении треда тоже добавляет участников, но только пока в пространстве включена настройка «Использовать сквозные треды» (так по умолчанию). Её значение показывает поле `use_global_threads` метода [Информация о пространстве](GET /company).
     *
     * Названия у треда нет, поэтому сразу отправьте в него первое сообщение — по нему сотрудники и поймут, о чём речь. Его адресуют `id` треда с `entity_type: "thread"`. Удалить тред нельзя. Если обсуждать нужно конкретное сообщение в чате, заводите тред под ним методом [Новый тред](POST /messages/{id}/thread), а если нужно постоянное место с названием — создайте его методом [Новый чат](POST /chats).
     *
     * Скоуп `threads:create`. POST /threads
     */
    createStandaloneThread: PachcaOp<"threads:create", false, {}, Thread>;
    /**
     * Список тредов
     *
     * Треды, доступные владельцу токена.
     *
     * Возвращаются треды, где вы состоите в самом треде или в чате, в котором он заведён. Участия в треде достаточно: входить в чат с родительским сообщением не нужно, самостоятельные треды тоже приходят. А вот треды из открытых чатов пространства, где вы не состоите, в список не попадают, хотя сами чаты вам доступны.
     *
     * Сортировка — по убыванию времени последнего сообщения в треде.
     *
     * В элементе списка нет ни названия, ни текста: только идентификаторы треда, его чата и родительского сообщения. Чтобы понять, о чём тред, прочитайте его сообщения методом [Список сообщений чата](GET /messages) по `chat_id`, а нужный тред по содержанию ищут методом [Поиск сообщений](GET /search/messages).
     *
     * Скоуп `threads:read`. GET /threads
     */
    listThreads: PachcaOp<"threads:read", false, {
      query?: {
        /** Фильтрация по времени последнего сообщения в треде: вернутся треды, где оно позже указанного. Значение в ISO-8601, смещение вида `+03:00` учитывается, время без смещения считается UTC. */
        lastMessageAtAfter?: string;
        /** Фильтрация по времени последнего сообщения в треде: вернутся треды, где оно раньше указанного. Значение в ISO-8601, смещение вида `+03:00` учитывается, время без смещения считается UTC. */
        lastMessageAtBefore?: string;
        /** Количество возвращаемых сущностей за один запрос. Целое число вне допустимых значений заменяется ближайшей границей. */
        limit?: number;
        /** Курсор для пагинации (из `meta.paginate.next_page` или `meta.paginate.prev_page`) */
        cursor?: string;
      };
    }, {
        data: Array<Thread>;
        meta: PaginationMeta;
      }>;
    /**
     * Информация о треде
     *
     * Идентификаторы треда и сообщения, под которым он висит. По `id` в тред пишут методом [Новое сообщение](POST /messages) с `entity_type: "thread"`, а по `chat_id` читают его сообщения. У самостоятельного треда `message_id` и `message_chat_id` приходят как `null`.
     *
     * В ответе только идентификаторы: названия и счётчика сообщений у треда нет, о чём он — видно по переписке внутри. Сообщения треда читаются методом [Список сообщений чата](GET /messages), а состав участников — методом [Список участников чата](GET /chats/{id}/members), оба по `chat_id` треда.
     *
     * Доступ к треду шире, чем выдача метода [Список тредов](GET /threads): тред, который открывается по `id`, в списке может и не появиться.
     *
     * В ссылке веб-приложения `thread_message_id` — это идентификатор сообщения, под которым висит тред. Сам тред — в поле `thread` этого сообщения, а сообщение отдаёт метод [Информация о сообщении](GET /messages/{id}).
     *
     * Скоуп `threads:read`. GET /threads/{id}
     */
    getThread: PachcaOp<"threads:read", false, {
      path: {
        /** Идентификатор треда: в ссылке веб-приложения это число из параметра `thread_id` */
        id: number;
      };
    }, Thread>;
  };
  profile: {
    /**
     * Свой профиль
     *
     * Карточка владельца токена. У бот-токена это карточка самого бота.
     *
     * Часовой пояс нужен, чтобы правильно понимать сроки, названные словами: «до 15:00» и «к пятнице» считаются в поясе сотрудника, а не в UTC. Пустое значение означает часовой пояс пространства.
     *
     * Чужую карточку отдаёт [Информация о сотруднике](GET /users/{id}).
     *
     * Свою карточку меняет [Редактирование своего профиля](PUT /profile). Свой аватар ставит [Загрузка своего аватара](PUT /profile/avatar), а убирает [Удаление своего аватара](DELETE /profile/avatar).
     *
     * Скоуп `profile:read`. GET /profile
     */
    getProfile: PachcaOp<"profile:read", false, {}, User>;
    /**
     * Редактирование своего профиля
     *
     * Меняет карточку владельца токена: перезаписываются только переданные поля. Метод доступен любому сотруднику и мульти-гостю, право `users:update` для него не нужно. Идентификаторы дополнительных полей отдаёт [Список дополнительных полей](GET /custom_properties).
     *
     * Запрос применяется целиком: если какое-то поле не прошло проверку, не меняется ничего, а ответ `422` перечисляет все ошибки. Почту, роль, теги и приостановку меняет администратор методом [Редактирование сотрудника](PUT /users/{id}): здесь на них ответ `422` с кодом `not_applicable`, как и на любое другое незнакомое поле.
     *
     * У сотрудника, который входит через SSO, часть полей заполняется из SSO. Их правка отвечает `422` с кодом `blocked_by_sso`. Тот же код приходит на `time_zone`, когда автоопределение пояса закреплено настройками SSO, и на дополнительное поле, по которому SSO находит профиль сотрудника.
     *
     * Бот-токен этот метод не вызывает: имя и ник бота меняет [Редактирование бота](PUT /bots/{id}).
     *
     * В ответе карточка, как у метода [Свой профиль](GET /profile).
     *
     * Скоуп `profile:write`. PUT /profile
     */
    updateProfile: PachcaOp<"profile:write", false, {
      body: ProfileUpdateRequest;
    }, User>;
    /**
     * Загрузка своего аватара
     *
     * Ставит или заменяет аватар владельца токена. Файл передаётся в формате `multipart/form-data`, в ответе приходит только ссылка на новое изображение.
     *
     * Принимаются `jpg`, `jpeg`, `png` и `gif`, причём любой `gif` — не больше 2 МБ. Картинка уменьшается до 1024 на 1024 пикселя, а `png` сохраняется как `jpg` на белом фоне. Прозрачным остаётся только небольшой `png`: до 100 КБ и не больше 256 пикселей по каждой стороне либо легче 10 КБ.
     *
     * Аватар другого сотрудника ставит [Загрузка аватара сотрудника](PUT /users/{user_id}/avatar), и это доступно только владельцу пространства и администратору.
     *
     * Скоуп `profile_avatar:write`. PUT /profile/avatar
     */
    updateProfileAvatar: PachcaOp<"profile_avatar:write", false, {
      body: {
        /** Файл изображения для аватара */
        image: PachcaFileInput;
      };
    }, AvatarData>;
    /**
     * Удаление своего аватара
     *
     * Убирает аватар владельца токена, дальше в интерфейсе показываются инициалы. Если аватара не было, ответ всё равно `204`.
     *
     * Скоуп `profile_avatar:write`. DELETE /profile/avatar
     */
    deleteProfileAvatar: PachcaOp<"profile_avatar:write", false, {}, void>;
    /**
     * Свой статус
     *
     * Статус владельца токена: эмодзи, подпись, срок и режим «Нет на месте».
     *
     * Если статус не установлен, метод возвращает `200` и `null` в теле ответа — без объекта-обёртки. Статус с истёкшим `expires_at` какое-то время ещё возвращается, пока не будет очищен, поэтому проверяйте `expires_at` на стороне клиента.
     *
     * Скоуп `profile_status:read`. GET /profile/status
     */
    getStatus: PachcaOp<"profile_status:read", false, {}, UserStatus>;
    /**
     * Новый свой статус
     *
     * Ставит статус владельцу токена: эмодзи, подпись и, если нужно, срок. Метод доступен и боту — статус появится в карточке самого бота.
     *
     * Режим «Нет на месте» включается этим же методом, флагом `is_away`. В `away_message` кладут текст, который увидят в профиле и при попытке написать или упомянуть. Когда срок из `expires_at` истекает, статус снимается целиком, вместе с режимом и этим текстом.
     *
     * Перезаписываются только переданные поля. Чтобы продлить текущий статус, достаточно прислать один `expires_at`.
     *
     * Срок, названный словами («до трёх», «до конца дня»), — это `expires_at`, а не часть подписи. Считается он в часовом поясе сотрудника, а пояс приходит в методе [Свой профиль](GET /profile).
     *
     * Эмодзи и подпись обязательны, только когда статуса ещё нет. Эмодзи должен быть ровно один, без текста вокруг, а подпись — не длиннее 50 символов.
     *
     * Скоуп `profile_status:write`. PUT /profile/status
     */
    updateStatus: PachcaOp<"profile_status:write", false, {
      body: StatusUpdateRequest;
    }, UserStatus>;
    /**
     * Удаление своего статуса
     *
     * Снимает статус с владельца токена вместе с режимом «Нет на месте» и его текстом. Если статуса не было, ответ всё равно `204`, поэтому повторный вызов безопасен.
     *
     * Скоуп `profile_status:write`. DELETE /profile/status
     */
    deleteStatus: PachcaOp<"profile_status:write", false, {}, void>;
  };
  search: {
    /**
     * Поиск чатов
     *
     * Ищет беседы и каналы по названию, прощая опечатки. Находит и открытые чаты пространства, куда вызывающий не вступал, а закрытые — только те, где он состоит.
     *
     * Личные переписки по умолчанию не ищутся. Передайте `personal=true`, и поиск пойдёт по имени собеседника, а не по названию чата.
     *
     * Метод ищет по названиям, а не по содержанию. Если нужно найти, где что-то обсуждали или о чём договорились, это [Поиск сообщений](GET /search/messages).
     *
     * Слишком тяжёлый запрос может не уложиться по времени: тогда метод отвечает `504` с кодом `timeout`, и запрос стоит сузить.
     *
     * Скоуп `search:chats`. GET /search/chats
     */
    searchChats: PachcaOp<"search:chats", false, {
      query?: {
        /** Текст поискового запроса. Запрос длиннее 256 знаков обрезается. */
        query?: string;
        /** Количество возвращаемых результатов за один запрос. Целое число вне допустимых значений заменяется ближайшей границей. */
        limit?: number;
        /** Курсор для пагинации (из `meta.paginate.next_page`) */
        cursor?: string;
        /** Направление сортировки */
        order?: SortOrder;
        /** Фильтр по дате создания (от) */
        createdFrom?: string;
        /** Фильтр по дате создания (до) */
        createdTo?: string;
        /** Фильтр по активности чата */
        active?: boolean;
        /** Фильтр по типу чата */
        chatSubtype?: ChatSubtype;
        /** Фильтр по личным чатам */
        personal?: boolean;
      };
    }, {
        data: Array<Chat>;
        meta: SearchPaginationMeta;
      }>;
    /**
     * Поиск сообщений
     *
     * Ищет по тексту сообщений и по именам вложенных файлов, но только в чатах, где владелец токена состоит. Открытый канал, в который он не вступал, в поиск не попадает, хотя ленту его читать можно.
     *
     * Без `chat_ids` поиск идёт по беседам и каналам владельца токена, его личным чатам и тредам этих бесед и каналов. Треды личных чатов, самостоятельные треды и треды, куда его добавили без родительского чата, попадают в выдачу, только если в `chat_ids` передан идентификатор чата треда или чата с его родительским сообщением.
     *
     * Слова запроса ищутся по словоформам и по части слова, опечатки при этом не исправляются. Запрос, целиком взятый в кавычки, ищется строгой фразой, поиск по части слова в нём не работает. Подходят прямые кавычки `"…"` и типографские `«…»`, `“…”`, `„…“`.
     *
     * По умолчанию сообщения приходят от новых к старым. `sort=relevance` переключает выдачу на соответствие запросу, где свежие сообщения всё равно ценятся выше.
     *
     * Без `query` в выдачу попадают и удалённые сообщения: с пустыми `content` и `files` и заполненным `deleted_at`, и они входят в `total`. Запрос с `query` их не находит.
     *
     * Слишком тяжёлый запрос может не уложиться по времени: тогда метод отвечает `504` с кодом `timeout`, и запрос стоит сузить.
     *
     * Скоуп `search:messages`. GET /search/messages
     */
    searchMessages: PachcaOp<"search:messages", false, {
      query?: {
        /** Текст поискового запроса. Без него сообщения отбираются только фильтрами. Запрос длиннее 256 знаков обрезается. */
        query?: string;
        /** Количество возвращаемых результатов за один запрос. Целое число вне допустимых значений заменяется ближайшей границей. */
        limit?: number;
        /** Курсор для пагинации (из `meta.paginate.next_page`) */
        cursor?: string;
        /** Направление сортировки */
        order?: SortOrder;
        /** Сортировка результатов */
        sort?: MessageSearchSort;
        /** Фильтр по дате создания (от) */
        createdFrom?: string;
        /** Фильтр по дате создания (до) */
        createdTo?: string;
        /** Фильтр по ID чатов */
        chatIds?: Array<number>;
        /** Фильтр по ID авторов сообщений */
        userIds?: Array<number>;
        /** Фильтр по активности чата */
        active?: boolean;
      };
    }, {
        data: Array<Message>;
        meta: SearchPaginationMeta;
      }>;
    /**
     * Поиск сотрудников
     *
     * Ищет сотрудников по имени и фамилии, нику, должности и отделу. Опечатки прощаются только в имени и фамилии, остальным полям нужно точное слово.
     *
     * По почте метод ищет лишь тем, кому в пространстве видны личные данные. По телефону он не ищет вовсе — для этого есть [Список сотрудников](GET /users) с параметром `query`.
     *
     * Удалённые сотрудники не находятся никогда, приостановленные — только когда задан текстовый запрос, и стоят в выдаче ниже остальных. Из ботов находятся лишь публичные.
     *
     * Слишком тяжёлый запрос может не уложиться по времени: тогда метод отвечает `504` с кодом `timeout`, и запрос стоит сузить.
     *
     * Скоуп `search:users`. GET /search/users
     */
    searchUsers: PachcaOp<"search:users", false, {
      query?: {
        /** Текст поискового запроса. Запрос длиннее 256 знаков обрезается. */
        query?: string;
        /** Количество возвращаемых результатов за один запрос. Целое число вне допустимых значений заменяется ближайшей границей. */
        limit?: number;
        /** Курсор для пагинации (из `meta.paginate.next_page`) */
        cursor?: string;
        /** Сортировка результатов */
        sort?: SearchSortOrder;
        /** Направление сортировки */
        order?: SortOrder;
        /** Фильтр по дате создания (от) */
        createdFrom?: string;
        /** Фильтр по дате создания (до) */
        createdTo?: string;
        /** Фильтр по ролям сотрудников */
        companyRoles?: Array<UserRole>;
      };
    }, {
        data: Array<User>;
        meta: SearchPaginationMeta;
      }>;
  };
  tasks: {
    /**
     * Новое напоминание
     *
     * Создаёт напоминание и назначает на него ответственных.
     *
     * Тип напоминания можно выбрать: звонок, встреча, простое напоминание, событие или письмо. Без типа создаётся простое напоминание. Описание тоже не требуется — напоминание создастся с текстом по типу. Если описание передано, именно оно и станет текстом напоминания.
     *
     * У напоминания должны быть ответственные. Если их не указать, ответственным становится владелец токена.
     *
     * Ответственным для напоминания без привязки к каким-либо сущностям может стать любой сотрудник компании. Актуальный состав сотрудников компании вы можете получить в методе [Список сотрудников](GET /users). Если сотрудника с идентификатором из `performer_ids` не существует, метод отвечает `404`. Если вызывающий сотрудника не видит, ответ — `403`: так бывает с сотрудником другого пространства, приостановленным или удалённым, а у гостя — с теми, с кем у него нет общих чатов. Напоминание в обоих случаях не создаётся.
     *
     * Напоминание можно привязать полем `chat_id` к беседе или к личному чату, в том числе к чату с самим собой. Тогда кроме автора и ответственных его видят участники этого чата. Привязывающий должен сам в нём состоять. В канале, в треде и в архивном чате напоминания не создаются.
     *
     * Передать напоминание другому сотруднику — значит сменить ответственного методом [Редактирование напоминания](PUT /tasks/{id}).
     *
     * Напоминание со сроком заодно появляется событием в календаре, если он подключён к пространству или к профилю владельца токена. Ответственных приглашают в это событие участниками. Их собственные подключённые календари событие не создают.
     *
     * Скоуп `tasks:create`. POST /tasks
     */
    createTask: PachcaOp<"tasks:create", false, {
      body: TaskCreateRequest;
    }, Task>;
    /**
     * Список напоминаний
     *
     * Напоминания, доступные владельцу токена.
     *
     * Без параметра `chat_ids` возвращаются все напоминания активных чатов, где вы состоите участником, в том числе чужие, а также напоминания без привязки к чату, которые вы создали или которые назначены вам. Напоминания, где ответственный вы, отбирает фильтр `performer_ids` с вашим идентификатором. Параметр `chat_ids` меняет выборку — возвращаются все напоминания указанных чатов.
     *
     * Скоуп `tasks:read`. GET /tasks
     */
    listTasks: PachcaOp<"tasks:read", false, {
      query?: {
        /** Фильтр по состоянию. Если параметр не указан, возвращаются напоминания в любом состоянии. */
        status?: TaskStatus;
        /** Фильтр по чатам, к которым привязаны напоминания. Доступными считаются чаты, где вы состоите участником, открытые беседы и каналы пространства, а также треды, доступные вам по родительскому чату. Мульти-гостю открытые беседы и каналы доступны, только если он в них участник. Остальные переданные идентификаторы игнорируются без ошибки. Не более 100 идентификаторов. */
        chatIds?: Array<number>;
        /** Фильтр по ответственным за напоминание. Не более 100 идентификаторов. */
        performerIds?: Array<number>;
        /** Фильтр по автору напоминания */
        authorId?: number;
        /** Количество возвращаемых сущностей за один запрос. Целое число вне допустимых значений заменяется ближайшей границей. */
        limit?: number;
        /** Курсор для пагинации (из `meta.paginate.next_page` или `meta.paginate.prev_page`) */
        cursor?: string;
      };
    }, {
        data: Array<Task>;
        meta: PaginationMeta;
      }>;
    /**
     * Информация о напоминании
     *
     * Напоминание вместе с его автором, ответственными и чатом, к которому оно привязано.
     *
     * Напоминание видят его автор, ответственные и все, кому доступен его чат. Правило то же, что у фильтра `chat_ids` в методе [Список напоминаний](GET /tasks): участники чата, а в открытых беседах и каналах — любой сотрудник пространства. Доступа к чату хватает, чтобы прочитать, но не чтобы изменить: править и удалять напоминание могут только автор и ответственные.
     *
     * Скоуп `tasks:read`. GET /tasks/{id}
     */
    getTask: PachcaOp<"tasks:read", false, {
      path: {
        /** Идентификатор напоминания: в ссылке веб-приложения это число из пути `/tasks/{id}` или из параметра `task_id` */
        id: number;
      };
    }, Task>;
    /**
     * Редактирование напоминания
     *
     * Меняет напоминание: перезаписываются только переданные поля.
     *
     * Передать напоминание другому сотруднику — это тоже правка. `performer_ids` заменяет список ответственных целиком: прочитайте текущий список методом [Информация о напоминании](GET /tasks/{id}) и передайте всех, кто остаётся, вместе с новым ответственным.
     *
     * Выполненное напоминание закрывают этим же методом: `status: "done"` ставит галочку и оставляет напоминание в списке, `status: "undone"` возвращает его в работу.
     *
     * Доступно автору и ответственным. Участник чата, где висит напоминание, его видит, но менять не может. Привязку к чату изменить нельзя: чтобы перевесить напоминание в другой чат, удалите его и создайте заново с нужным `chat_id`.
     *
     * Скоуп `tasks:update`. PUT /tasks/{id}
     */
    updateTask: PachcaOp<"tasks:update", false, {
      path: {
        /** Идентификатор напоминания */
        id: number;
      };
      body: TaskUpdateRequest;
    }, Task>;
    /**
     * Удаление напоминания
     *
     * Убирает напоминание насовсем: восстановить его нельзя, и у ответственных оно тоже пропадает. Если напоминание уехало в подключённый календарь, событие удаляется и там, когда напоминание удаляет его автор. Если удаляет ответственный, событие может остаться в календаре автора.
     *
     * Доступно автору и ответственным. Повторный вызов отвечает `404`.
     *
     * Закрыть выполненное напоминание, сохранив его в списке, можно методом [Редактирование напоминания](PUT /tasks/{id}) со `status: "done"`.
     *
     * Скоуп `tasks:delete`. DELETE /tasks/{id}
     */
    deleteTask: PachcaOp<"tasks:delete", false, {
      path: {
        /** Идентификатор напоминания */
        id: number;
      };
    }, void>;
  };
  users: {
    /**
     * Новый сотрудник
     *
     * Заводит сотрудника в пространстве и отправляет ему приглашение на почту. Доступно владельцу пространства и администратору, боту метод недоступен.
     *
     * Если сотрудник с этим адресом уже есть в пространстве, метод отвечает `409`. Занятый ник ошибкой не считается: к нему молча дописываются случайные символы, и в ответе приходит уже изменённый.
     *
     * Бесплатное пространство, в том числе на пробном периоде, может отправить за сутки ограниченное число писем: приглашения и письма о смене почты считаются вместе, а предел указан на странице [Лимиты](/api/limits). Сверх него метод отвечает `422` с кодом `daily_invites_limit` и сотрудника не заводит, а остаток и время сброса приходят в `payload`. С `skip_email_notify: true` письмо не отправляется и в лимит не идёт.
     *
     * Вы можете заполнять дополнительные поля сотрудника, которые созданы в вашей компании. Получить актуальный список идентификаторов дополнительных полей сотрудника вы можете в методе [Список дополнительных полей](GET /custom_properties).
     *
     * Поле `list_tags` сразу заводит сотрудника в теги, а вместе с тегами — и в чаты, к которым эти теги привязаны. Имя, которого в пространстве ещё нет, создаёт новый тег. У гостя теги не назначаются вовсе: ответ приходит успешный, а `list_tags` в нём пустой.
     *
     * Через параметр `chat_ids` сотрудника можно сразу добавить в указанные чаты. Чтобы создать гостя, передайте `role: "guest"` — для этой роли `chat_ids` обязателен и должен содержать ровно один активный чат, в который у токена есть право добавлять участников. При нарушении правил гостевого доступа возвращается `400` с ошибкой по полю `chat_ids`. При любой роли тот же `400` приходит, если в `chat_ids` есть чат, куда у токена нет права добавлять участников, в том числе архивный: сотрудник тогда не заводится. Несуществующие идентификаторы пропускаются.
     *
     * Аватар сотруднику ставят после создания методом [Загрузка аватара сотрудника](PUT /users/{user_id}/avatar).
     *
     * Скоуп `users:create`. POST /users
     */
    createUser: PachcaOp<"users:create", false, {
      body: UserCreateRequest;
    }, User>;
    /**
     * Список сотрудников
     *
     * Все сотрудники пространства, кроме удалённых. Приостановленные приходят вместе с остальными и отличаются полем `suspended`.
     *
     * Боты в пространстве — тоже сотрудники и приходят в общем списке с `bot: true`. Но из выдачи по `query` они исключены: чтобы найти бота по имени, перебирайте страницы без поискового запроса.
     *
     * Мульти-гостю метод отдаёт не всё пространство, а тех, кого он видит в интерфейсе: его самого, участников общих с ним чатов вместе с ботами и публичных ботов. Треды и архивные чаты общими не считаются.
     *
     * Почта и телефон приходят `null`, если в пространстве выключен показ личных данных, а вызывающий не администратор. Мульти-гостю они всегда приходят `null`.
     *
     * Поиск по `query` может не уложиться по времени: тогда метод отвечает `504` с кодом `timeout`, и запрос стоит сузить.
     *
     * Карточку одного сотрудника отдаёт [Информация о сотруднике](GET /users/{id}), свою — [Свой профиль](GET /profile).
     *
     * Скоуп `users:read`. GET /users
     */
    listUsers: PachcaOp<"users:read", false, {
      query?: {
        /** Поисковая фраза для фильтрации результатов. Поиск работает по полям: `first_name` (имя), `last_name` (фамилия), `nickname` (никнейм), `title` (должность) и `department` (департамент). Если вызывающему видны личные данные (правило то же, что у поля `email`), поиск идёт ещё по `phone_number` (телефон), значениям дополнительных полей и по полному адресу `email`. */
        query?: string;
        /** Количество возвращаемых сущностей за один запрос. Целое число вне допустимых значений заменяется ближайшей границей. */
        limit?: number;
        /** Курсор для пагинации (из `meta.paginate.next_page` или `meta.paginate.prev_page`) */
        cursor?: string;
      };
    }, {
        data: Array<User>;
        meta: PaginationMeta;
      }>;
    /**
     * Информация о сотруднике
     *
     * Карточка сотрудника.
     *
     * Приостановленный сотрудник отдаётся с `suspended: true`, удалённый — `404`, как несуществующий. Бот тоже приходит сюда как сотрудник, с `bot: true`.
     *
     * Мульти-гостю метод отдаёт только тех, кто приходит ему в [Список сотрудников](GET /users), а на остальных отвечает `404`.
     *
     * Почта и телефон приходят `null`, если в пространстве выключен показ личных данных, а вызывающий не администратор. Мульти-гостю они всегда приходят `null`. Свою карточку сотрудник видит целиком — она же отдаётся методом [Свой профиль](GET /profile) и без скоупа `users:read`.
     *
     * Скоуп `users:read`. GET /users/{id}
     */
    getUser: PachcaOp<"users:read", false, {
      path: {
        /** Идентификатор пользователя. В ссылке веб-приложения это число из параметра `user_id`. Параметры `profile_id` и `user-id` называют сотрудника, которому ссылку отправили. */
        id: number;
      };
    }, User>;
    /**
     * Редактирование сотрудника
     *
     * Меняет карточку сотрудника: перезаписываются только переданные поля. Идентификаторы дополнительных полей отдаёт [Список дополнительных полей](GET /custom_properties).
     *
     * Запрос применяется целиком: если какое-то поле не прошло проверку, например новый `email` уже занят, не меняется ничего. Смена почты отправляет письма на прежний и новый адрес. В бесплатном пространстве они идут в тот же суточный лимит, что и приглашения из метода [Новый сотрудник](POST /users), и сверх него ответ `422` с кодом `daily_invites_limit`.
     *
     * Поле `list_tags` заменяет набор тегов целиком, поэтому присылайте вместе с новым тегом и те, что сохраняются. Снятый тег выводит сотрудника из чатов, куда его привёл этот тег, а имя, которого в пространстве ещё нет, создаёт новый тег вместе с назначением.
     *
     * `suspended: true` приостанавливает сотрудника: он теряет доступ, но остаётся в чатах, тегах и напоминаниях, а `suspended: false` возвращает его обратно. Насовсем убирает сотрудника [Удаление сотрудника](DELETE /users/{id}).
     *
     * Владельца пространства редактирует только он сам, а его роль меняется лишь на администратора, иначе ответ `403`.
     *
     * Незнакомое значение роли метод молча пропускает: ответ приходит успешный, а роль остаётся прежней.
     *
     * У бота метод меняет только имя (`first_name`), ник, теги и `suspended`, остальные поля в запросе пропускает. Какой ник и какие теги можно дать боту, сказано у полей `nickname` и `list_tags`. Если настройки бота поменялись во время запроса, ответ `422` приходит с кодом `bot_changed_concurrently`: повторите запрос.
     *
     * Аватар сотрудника ставят и убирают отдельные методы [Загрузка аватара сотрудника](PUT /users/{user_id}/avatar) и [Удаление аватара сотрудника](DELETE /users/{user_id}/avatar). Свою карточку без права `users:update` меняет [Редактирование своего профиля](PUT /profile).
     *
     * Скоуп `users:update`. PUT /users/{id}
     */
    updateUser: PachcaOp<"users:update", false, {
      path: {
        /** Идентификатор пользователя */
        id: number;
      };
      body: UserUpdateRequest;
    }, User>;
    /**
     * Удаление сотрудника
     *
     * Убирает сотрудника из пространства. Отменить это нельзя: вернуть его можно только новым приглашением, и это будет уже другой сотрудник.
     *
     * Что происходит: он выходит из всех бесед и каналов, кроме личных переписок, с него снимаются все теги, напоминания, где он был единственным ответственным, удаляются, а из остальных он убирается. Написанные им сообщения и файлы остаются на месте.
     *
     * Владельца пространства удалить нельзя — метод ответит `403`. Повторный вызов отвечает `404`: удалённого сотрудника метод уже не находит.
     *
     * Если сотрудник уходит в отпуск или увольнение ещё не финальное, пользуйтесь методом [Редактирование сотрудника](PUT /users/{id}) с `suspended: true`. Приостановка обратима и сохраняет чаты, теги и напоминания.
     *
     * Скоуп `users:delete`. DELETE /users/{id}
     */
    deleteUser: PachcaOp<"users:delete", false, {
      path: {
        /** Идентификатор пользователя */
        id: number;
      };
    }, void>;
    /**
     * Загрузка аватара сотрудника
     *
     * Ставит или заменяет аватар другому сотруднику. Доступно владельцу пространства и администратору, боту метод недоступен. Аватар владельца пространства меняет только он сам.
     *
     * Файл передаётся в формате `multipart/form-data`, в ответе приходит только ссылка на новое изображение. Принимаются `jpg`, `jpeg`, `png` и `gif`, любой `gif` — не больше 2 МБ, картинка уменьшается до 1024 на 1024 пикселя, а `png` сохраняется как `jpg` на белом фоне. Прозрачным остаётся только небольшой `png`: до 100 КБ и не больше 256 пикселей по каждой стороне либо легче 10 КБ.
     *
     * Свой аватар ставят методом [Загрузка своего аватара](PUT /profile/avatar) — он доступен всем ролям и ботам.
     *
     * Скоуп `user_avatar:write`. PUT /users/{user_id}/avatar
     */
    updateUserAvatar: PachcaOp<"user_avatar:write", false, {
      path: {
        /** Идентификатор пользователя */
        userId: number;
      };
      body: {
        /** Файл изображения для аватара */
        image: PachcaFileInput;
      };
    }, AvatarData>;
    /**
     * Удаление аватара сотрудника
     *
     * Убирает аватар другому сотруднику, дальше в интерфейсе показываются инициалы. Доступно владельцу пространства и администратору, боту метод недоступен, а аватар владельца пространства убирает только он сам.
     *
     * Если аватара не было, ответ всё равно `204`.
     *
     * Скоуп `user_avatar:write`. DELETE /users/{user_id}/avatar
     */
    deleteUserAvatar: PachcaOp<"user_avatar:write", false, {
      path: {
        /** Идентификатор пользователя */
        userId: number;
      };
    }, void>;
    /**
     * Статус сотрудника
     *
     * Статус другого сотрудника: эмодзи, подпись, срок и режим «Нет на месте».
     *
     * Мульти-гостю метод отдаёт статусы только тех, кто приходит ему в [Список сотрудников](GET /users), а на остальных отвечает `404`.
     *
     * Если статус не установлен, метод возвращает `200` и `null` в теле ответа — без объекта-обёртки. Статус с истёкшим `expires_at` какое-то время ещё возвращается, пока не будет очищен, поэтому проверяйте `expires_at` на стороне клиента.
     *
     * Скоуп `user_status:read`. GET /users/{user_id}/status
     */
    getUserStatus: PachcaOp<"user_status:read", false, {
      path: {
        /** Идентификатор пользователя */
        userId: number;
      };
    }, UserStatus>;
    /**
     * Новый статус сотрудника
     *
     * Ставит статус другому сотруднику — например, «в отпуске» на время отсутствия. Доступно владельцу пространства и администратору, боту метод недоступен даже с выданным скоупом.
     *
     * Этим же методом сотруднику включают режим «Нет на месте» флагом `is_away` и задают текст `away_message`, который увидят при попытке к нему обратиться.
     *
     * Статус видят все, кто видит сотрудника в пространстве. Перезаписываются только переданные поля, поэтому продлить чужой статус можно одним `expires_at`.
     *
     * Срок, названный словами, — это `expires_at`, а не часть подписи, и считается он в часовом поясе того сотрудника, которому ставят статус.
     *
     * Эмодзи и подпись обязательны, только когда статуса ещё нет. Эмодзи должен быть ровно один, без текста вокруг, а подпись — не длиннее 50 символов.
     *
     * Свой статус ставят методом [Новый свой статус](PUT /profile/status) — он доступен всем ролям и ботам.
     *
     * Скоуп `user_status:write`. PUT /users/{user_id}/status
     */
    updateUserStatus: PachcaOp<"user_status:write", false, {
      path: {
        /** Идентификатор пользователя */
        userId: number;
      };
      body: StatusUpdateRequest;
    }, UserStatus>;
    /**
     * Удаление статуса сотрудника
     *
     * Снимает статус с другого сотрудника вместе с режимом «Нет на месте» и его текстом. Доступно владельцу пространства и администратору, боту метод недоступен.
     *
     * Если статуса не было, ответ всё равно `204`. Свой статус снимает [Удаление своего статуса](DELETE /profile/status).
     *
     * Скоуп `user_status:write`. DELETE /users/{user_id}/status
     */
    deleteUserStatus: PachcaOp<"user_status:write", false, {
      path: {
        /** Идентификатор пользователя */
        userId: number;
      };
    }, void>;
  };
  views: {
    /**
     * Открытие представления
     *
     * Показывает пользователю модальное окно с формой в ответ на его действие. Метод вызывают токеном бота: события о нажатии кнопок приходят только ботам, от имени бота окно и открывается.
     *
     * Открыть окно можно единственным способом — по `trigger_id` из события о нажатии кнопки. Один `trigger_id` открывает одно окно и живёт 3 секунды. У бота с вебхуком они отсчитываются с момента, когда Пачка передала нажатие, а у бота, который читает [Историю событий](GET /webhooks/events), с момента записи нажатия в журнал. Поэтому окно открывают первым делом, а всё остальное по событию делают уже после.
     *
     * Заполненная форма приходит обратно событием `view_submit`: на исходящий вебхук и, если включена история событий, в журнал. На вебхук отвечают прямо в ответе на него, и Пачка ждёт его 3 секунды. Бот без адреса вебхука закрывает событие из журнала методом [Ответ на отправку формы](POST /views/{view_id}/submit_response), на это есть 5 секунд. Не успели — пользователь увидит ошибку отправки.
     *
     * Скоуп `views:write`, только бот. POST /views/open
     */
    openView: PachcaOp<"views:write", true, {
      body: OpenViewRequest;
    }, OpenViewResult>;
    /**
     * Ответ на отправку формы
     *
     * Закрывает форму сотруднику или показывает ему ошибки под полями. Метод работает только у бота, у которого не задан адрес исходящего вебхука и включена история событий. Такой бот получает событие `view_submit` из метода [История событий](GET /webhooks/events) и отвечает на него этим методом. Бот с адресом вебхука отвечает на сам вебхук, а вызов метода получает `410` с кодом `submit_expired`, даже если история событий у бота тоже включена.
     *
     * Идентификаторы `view_id` и `submit_id` приходят в теле события. Ответить нужно в течение 5 секунд с момента отправки формы, иначе сотрудник увидит ошибку отправки, а значения полей сохранятся для повторной попытки.
     *
     * Тело без поля `errors` закрывает форму как успешно отправленную, с полем `errors` — показывает текст ошибки под каждым названным полем.
     *
     * Ответ принимается один раз. Повторный вызов с той же парой `view_id` и `submit_id`, как и опоздавший, получает `410` с кодом `submit_expired`. Если формы нет или её открыл другой бот, метод отвечает `404` с кодом `view_not_found`. Статус `503` значит, что ответ не дошёл до сотрудника: повторите вызов, пока не истекли 5 секунд.
     *
     * Скоуп `views:write`, только бот. POST /views/{view_id}/submit_response
     */
    submitViewResponse: PachcaOp<"views:write", true, {
      path: {
        /** Идентификатор представления */
        viewId: string;
      };
      body: SubmitViewResponseRequest;
    }, SubmitViewResponseResult>;
  };
}
