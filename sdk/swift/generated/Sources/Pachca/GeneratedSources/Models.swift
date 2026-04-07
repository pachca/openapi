import Foundation
#if canImport(FoundationNetworking)
import FoundationNetworking
#endif

public enum AuditEventKey: String, Codable, CaseIterable {
    /// Пользователь успешно вошел в систему
    case userLogin = "user_login"
    /// Пользователь вышел из системы
    case userLogout = "user_logout"
    /// Неудачная попытка двухфакторной аутентификации
    case user2faFail = "user_2fa_fail"
    /// Успешная двухфакторная аутентификация
    case user2faSuccess = "user_2fa_success"
    /// Создана новая учетная запись пользователя
    case userCreated = "user_created"
    /// Учетная запись пользователя удалена
    case userDeleted = "user_deleted"
    /// Роль пользователя была изменена
    case userRoleChanged = "user_role_changed"
    /// Данные пользователя обновлены
    case userUpdated = "user_updated"
    /// Создан новый тег
    case tagCreated = "tag_created"
    /// Тег удален
    case tagDeleted = "tag_deleted"
    /// Пользователь добавлен в тег
    case userAddedToTag = "user_added_to_tag"
    /// Пользователь удален из тега
    case userRemovedFromTag = "user_removed_from_tag"
    /// Создан новый чат
    case chatCreated = "chat_created"
    /// Чат переименован
    case chatRenamed = "chat_renamed"
    /// Изменены права доступа к чату
    case chatPermissionChanged = "chat_permission_changed"
    /// Пользователь присоединился к чату
    case userChatJoin = "user_chat_join"
    /// Пользователь покинул чат
    case userChatLeave = "user_chat_leave"
    /// Тег добавлен в чат
    case tagAddedToChat = "tag_added_to_chat"
    /// Тег удален из чата
    case tagRemovedFromChat = "tag_removed_from_chat"
    /// Сообщение отредактировано
    case messageUpdated = "message_updated"
    /// Сообщение удалено
    case messageDeleted = "message_deleted"
    /// Сообщение создано
    case messageCreated = "message_created"
    /// Реакция добавлена
    case reactionCreated = "reaction_created"
    /// Реакция удалена
    case reactionDeleted = "reaction_deleted"
    /// Тред создан
    case threadCreated = "thread_created"
    /// Создан новый токен доступа
    case accessTokenCreated = "access_token_created"
    /// Токен доступа обновлен
    case accessTokenUpdated = "access_token_updated"
    /// Токен доступа удален
    case accessTokenDestroy = "access_token_destroy"
    /// Данные зашифрованы
    case kmsEncrypt = "kms_encrypt"
    /// Данные расшифрованы
    case kmsDecrypt = "kms_decrypt"
    /// Доступ к журналам аудита получен
    case auditEventsAccessed = "audit_events_accessed"
    /// Срабатывание правила DLP-системы
    case dlpViolationDetected = "dlp_violation_detected"
    /// Поиск сотрудников через API
    case searchUsersApi = "search_users_api"
    /// Поиск чатов через API
    case searchChatsApi = "search_chats_api"
    /// Поиск сообщений через API
    case searchMessagesApi = "search_messages_api"
}

public enum ChatAvailability: String, Codable, CaseIterable {
    /// Чаты, где пользователь является участником
    case isMember = "is_member"
    /// Все открытые чаты компании, вне зависимости от участия в них пользователя
    case `public` = "public"
}

public enum ChatMemberRole: String, Codable, CaseIterable {
    /// Админ
    case admin
    /// Редактор (доступно только для каналов)
    case editor
    /// Участник или подписчик
    case member
}

public enum ChatMemberRoleFilter: String, Codable, CaseIterable {
    /// Любая роль
    case all
    /// Создатель
    case owner
    /// Админ
    case admin
    /// Редактор
    case editor
    /// Участник/подписчик
    case member
}

public enum ChatSortField: String, Codable, CaseIterable {
    /// По идентификатору чата
    case id
    /// По дате и времени создания последнего сообщения
    case lastMessageAt = "last_message_at"
}

public enum ChatSubtype: String, Codable, CaseIterable {
    /// Канал или беседа
    case discussion
    /// Тред
    case thread
}

public enum CustomPropertyDataType: String, Codable, CaseIterable {
    /// Строковое значение
    case string
    /// Числовое значение
    case number
    /// Дата
    case date
    /// Ссылка
    case link
}

public enum FileType: String, Codable, CaseIterable {
    /// Обычный файл
    case file
    /// Изображение
    case image
}

public enum InviteStatus: String, Codable, CaseIterable {
    /// Принято
    case confirmed
    /// Отправлено
    case sent
}

public enum MemberEventType: String, Codable, CaseIterable {
    /// Добавление
    case add
    /// Удаление
    case remove
}

public enum MessageEntityType: String, Codable, CaseIterable {
    /// Беседа или канал
    case discussion
    /// Тред
    case thread
    /// Пользователь
    case user
}

public enum MessageSortField: String, Codable, CaseIterable {
    /// По идентификатору сообщения
    case id
}

public enum OAuthScope: String, Codable, CaseIterable {
    /// Просмотр чатов и списка чатов
    case chatsRead = "chats:read"
    /// Создание новых чатов
    case chatsCreate = "chats:create"
    /// Изменение настроек чата
    case chatsUpdate = "chats:update"
    /// Архивация и разархивация чатов
    case chatsArchive = "chats:archive"
    /// Выход из чатов
    case chatsLeave = "chats:leave"
    /// Просмотр участников чата
    case chatMembersRead = "chat_members:read"
    /// Добавление, изменение и удаление участников чата
    case chatMembersWrite = "chat_members:write"
    /// Скачивание экспортов чата
    case chatExportsRead = "chat_exports:read"
    /// Создание экспортов чата
    case chatExportsWrite = "chat_exports:write"
    /// Просмотр сообщений в чатах
    case messagesRead = "messages:read"
    /// Отправка сообщений
    case messagesCreate = "messages:create"
    /// Редактирование сообщений
    case messagesUpdate = "messages:update"
    /// Удаление сообщений
    case messagesDelete = "messages:delete"
    /// Просмотр реакций на сообщения
    case reactionsRead = "reactions:read"
    /// Добавление и удаление реакций
    case reactionsWrite = "reactions:write"
    /// Закрепление и открепление сообщений
    case pinsWrite = "pins:write"
    /// Просмотр тредов (комментариев)
    case threadsRead = "threads:read"
    /// Создание тредов (комментариев)
    case threadsCreate = "threads:create"
    /// Unfurl (разворачивание ссылок)
    case linkPreviewsWrite = "link_previews:write"
    /// Просмотр информации о сотрудниках и списка сотрудников
    case usersRead = "users:read"
    /// Создание новых сотрудников
    case usersCreate = "users:create"
    /// Редактирование данных сотрудника
    case usersUpdate = "users:update"
    /// Удаление сотрудников
    case usersDelete = "users:delete"
    /// Просмотр тегов
    case groupTagsRead = "group_tags:read"
    /// Создание, редактирование и удаление тегов
    case groupTagsWrite = "group_tags:write"
    /// Изменение настроек бота
    case botsWrite = "bots:write"
    /// Просмотр информации о своем профиле
    case profileRead = "profile:read"
    /// Просмотр статуса профиля
    case profileStatusRead = "profile_status:read"
    /// Изменение и удаление статуса профиля
    case profileStatusWrite = "profile_status:write"
    /// Изменение и удаление аватара профиля
    case profileAvatarWrite = "profile_avatar:write"
    /// Просмотр статуса сотрудника
    case userStatusRead = "user_status:read"
    /// Изменение и удаление статуса сотрудника
    case userStatusWrite = "user_status:write"
    /// Изменение и удаление аватара сотрудника
    case userAvatarWrite = "user_avatar:write"
    /// Просмотр дополнительных полей
    case customPropertiesRead = "custom_properties:read"
    /// Просмотр журнала аудита
    case auditEventsRead = "audit_events:read"
    /// Просмотр задач
    case tasksRead = "tasks:read"
    /// Создание задач
    case tasksCreate = "tasks:create"
    /// Изменение задачи
    case tasksUpdate = "tasks:update"
    /// Удаление задачи
    case tasksDelete = "tasks:delete"
    /// Скачивание файлов
    case filesRead = "files:read"
    /// Загрузка файлов
    case filesWrite = "files:write"
    /// Получение данных для загрузки файлов
    case uploadsWrite = "uploads:write"
    /// Открытие форм (представлений)
    case viewsWrite = "views:write"
    /// Просмотр вебхуков
    case webhooksRead = "webhooks:read"
    /// Создание и управление вебхуками
    case webhooksWrite = "webhooks:write"
    /// Просмотр лога вебхуков
    case webhooksEventsRead = "webhooks:events:read"
    /// Удаление записи в логе вебхука
    case webhooksEventsDelete = "webhooks:events:delete"
    /// Поиск сотрудников
    case searchUsers = "search:users"
    /// Поиск чатов
    case searchChats = "search:chats"
    /// Поиск сообщений
    case searchMessages = "search:messages"
}

public enum ReactionEventType: String, Codable, CaseIterable {
    /// Создание
    case new
    /// Удаление
    case delete
}

public enum SearchEntityType: String, Codable, CaseIterable {
    /// Пользователь
    case User
    /// Задача
    case Task
}

public enum SearchSortOrder: String, Codable, CaseIterable {
    /// По релевантности
    case byScore = "by_score"
    /// По алфавиту
    case alphabetical
}

public enum SortOrder: String, Codable, CaseIterable {
    /// По возрастанию
    case asc
    /// По убыванию
    case desc
}

public enum TaskKind: String, Codable, CaseIterable {
    /// Позвонить контакту
    case call
    /// Встреча
    case meeting
    /// Простое напоминание
    case reminder
    /// Событие
    case event
    /// Написать письмо
    case email
}

public enum TaskStatus: String, Codable, CaseIterable {
    /// Выполнено
    case done
    /// Активно
    case undone
}

public enum UserEventType: String, Codable, CaseIterable {
    /// Приглашение
    case invite
    /// Подтверждение
    case confirm
    /// Обновление
    case update
    /// Приостановка
    case suspend
    /// Активация
    case activate
    /// Удаление
    case delete
}

public enum UserRole: String, Codable, CaseIterable {
    /// Администратор
    case admin
    /// Сотрудник
    case user
    /// Мульти-гость
    case multiGuest = "multi_guest"
    /// Гость
    case guest
}

public enum UserRoleInput: String, Codable, CaseIterable {
    /// Администратор
    case admin
    /// Сотрудник
    case user
    /// Мульти-гость
    case multiGuest = "multi_guest"
}

public enum ValidationErrorCode: String, Codable, CaseIterable {
    /// Обязательное поле (не может быть пустым)
    case blank
    /// Слишком длинное значение (пояснения вы получите в поле message)
    case tooLong = "too_long"
    /// Поле не соответствует правилам (пояснения вы получите в поле message)
    case invalid
    /// Поле имеет непредусмотренное значение
    case inclusion
    /// Поле имеет недопустимое значение
    case exclusion
    /// Название для этого поля уже существует
    case taken
    /// Emoji статуса не может содержать значения отличные от Emoji символа
    case wrongEmoji = "wrong_emoji"
    /// Объект не найден
    case notFound = "not_found"
    /// Объект уже существует (пояснения вы получите в поле message)
    case alreadyExists = "already_exists"
    /// Ошибка личного чата (пояснения вы получите в поле message)
    case personalChat = "personal_chat"
    /// Отображаемая ошибка (пояснения вы получите в поле message)
    case displayedError = "displayed_error"
    /// Действие запрещено
    case notAuthorized = "not_authorized"
    /// Выбран слишком большой диапазон дат
    case invalidDateRange = "invalid_date_range"
    /// Некорректный URL вебхука
    case invalidWebhookUrl = "invalid_webhook_url"
    /// Достигнут лимит запросов
    case rateLimit = "rate_limit"
    /// Превышен лимит активных сотрудников (пояснения вы получите в поле message)
    case licensesLimit = "licenses_limit"
    /// Превышен лимит количества реакций, которые может добавить пользователь (20 уникальных реакций)
    case userLimit = "user_limit"
    /// Превышен лимит количества уникальных реакций, которые можно добавить на сообщение (30 уникальных реакций)
    case uniqueLimit = "unique_limit"
    /// Превышен лимит количества реакций, которые можно добавить на сообщение (1000 реакций)
    case generalLimit = "general_limit"
    /// Ошибка выполнения запроса (пояснения вы получите в поле message)
    case unhandled
    /// Не удалось найти идентификатор события
    case triggerNotFound = "trigger_not_found"
    /// Время жизни идентификатора события истекло
    case triggerExpired = "trigger_expired"
    /// Обязательный параметр не передан
    case required
    /// Недопустимое значение (не входит в список допустимых)
    case `in` = "in"
    /// Значение неприменимо в данном контексте (пояснения вы получите в поле message)
    case notApplicable = "not_applicable"
    /// Нельзя изменить свои собственные данные
    case selfUpdate = "self_update"
    /// Нельзя изменить данные владельца
    case ownerProtected = "owner_protected"
    /// Значение уже назначено
    case alreadyAssigned = "already_assigned"
    /// Недостаточно прав для выполнения действия (пояснения вы получите в поле message)
    case forbidden
    /// Доступ запрещён (недостаточно прав)
    case permissionDenied = "permission_denied"
    /// Доступ запрещён
    case accessDenied = "access_denied"
    /// Некорректные параметры запроса (пояснения вы получите в поле message)
    case wrongParams = "wrong_params"
    /// Требуется оплата
    case paymentRequired = "payment_required"
    /// Значение слишком короткое (пояснения вы получите в поле message)
    case minLength = "min_length"
    /// Значение слишком длинное (пояснения вы получите в поле message)
    case maxLength = "max_length"
    /// Использовано зарезервированное системное слово (here, all)
    case useOfSystemWords = "use_of_system_words"
}

public enum WebhookEventType: String, Codable, CaseIterable {
    /// Создание
    case new
    /// Обновление
    case update
    /// Удаление
    case delete
}

public struct AccessTokenInfo: Codable {
    public let id: Int64
    public let token: String
    public let name: String?
    public let userId: Int64
    public let scopes: [OAuthScope]
    public let createdAt: String
    public let revokedAt: String?
    public let expiresIn: Int?
    public let lastUsedAt: String?

    public init(id: Int64, token: String, name: String? = nil, userId: Int64, scopes: [OAuthScope], createdAt: String, revokedAt: String? = nil, expiresIn: Int? = nil, lastUsedAt: String? = nil) {
        self.id = id
        self.token = token
        self.name = name
        self.userId = userId
        self.scopes = scopes
        self.createdAt = createdAt
        self.revokedAt = revokedAt
        self.expiresIn = expiresIn
        self.lastUsedAt = lastUsedAt
    }

    enum CodingKeys: String, CodingKey {
        case id
        case token
        case name
        case userId = "user_id"
        case scopes
        case createdAt = "created_at"
        case revokedAt = "revoked_at"
        case expiresIn = "expires_in"
        case lastUsedAt = "last_used_at"
    }
}

public struct AddMembersRequest: Codable {
    public let memberIds: [Int]
    public let silent: Bool?

    public init(memberIds: [Int], silent: Bool? = nil) {
        self.memberIds = memberIds
        self.silent = silent
    }

    enum CodingKeys: String, CodingKey {
        case memberIds = "member_ids"
        case silent
    }
}

public struct AddTagsRequest: Codable {
    public let groupTagIds: [Int]

    public init(groupTagIds: [Int]) {
        self.groupTagIds = groupTagIds
    }

    enum CodingKeys: String, CodingKey {
        case groupTagIds = "group_tag_ids"
    }
}

public struct ApiError: Codable, Error {
    public let errors: [ApiErrorItem]

    public init(errors: [ApiErrorItem]) {
        self.errors = errors
    }
}

public struct ApiErrorItem: Codable {
    public let key: String
    public let value: String?
    public let message: String
    public let code: ValidationErrorCode
    public let payload: [String: String]?

    public init(key: String, value: String? = nil, message: String, code: ValidationErrorCode, payload: [String: String]? = nil) {
        self.key = key
        self.value = value
        self.message = message
        self.code = code
        self.payload = payload
    }
}

public struct AuditDetailsChatId: Codable {
    public let chatId: Int

    public init(chatId: Int) {
        self.chatId = chatId
    }

    enum CodingKeys: String, CodingKey {
        case chatId = "chat_id"
    }
}

public struct AuditDetailsChatPermission: Codable {
    public let publicAccess: Bool

    public init(publicAccess: Bool) {
        self.publicAccess = publicAccess
    }

    enum CodingKeys: String, CodingKey {
        case publicAccess = "public_access"
    }
}

public struct AuditDetailsChatRenamed: Codable {
    public let oldName: String
    public let newName: String

    public init(oldName: String, newName: String) {
        self.oldName = oldName
        self.newName = newName
    }

    enum CodingKeys: String, CodingKey {
        case oldName = "old_name"
        case newName = "new_name"
    }
}

public struct AuditDetailsDlp: Codable {
    public let dlpRuleId: Int
    public let dlpRuleName: String
    public let messageId: Int
    public let chatId: Int
    public let userId: Int
    public let actionMessage: String
    public let conditionsMatched: Bool

    public init(dlpRuleId: Int, dlpRuleName: String, messageId: Int, chatId: Int, userId: Int, actionMessage: String, conditionsMatched: Bool) {
        self.dlpRuleId = dlpRuleId
        self.dlpRuleName = dlpRuleName
        self.messageId = messageId
        self.chatId = chatId
        self.userId = userId
        self.actionMessage = actionMessage
        self.conditionsMatched = conditionsMatched
    }

    enum CodingKeys: String, CodingKey {
        case dlpRuleId = "dlp_rule_id"
        case dlpRuleName = "dlp_rule_name"
        case messageId = "message_id"
        case chatId = "chat_id"
        case userId = "user_id"
        case actionMessage = "action_message"
        case conditionsMatched = "conditions_matched"
    }
}

public struct AuditDetailsEmpty: Codable {
}

public struct AuditDetailsInitiator: Codable {
    public let initiatorId: Int

    public init(initiatorId: Int) {
        self.initiatorId = initiatorId
    }

    enum CodingKeys: String, CodingKey {
        case initiatorId = "initiator_id"
    }
}

public struct AuditDetailsInviter: Codable {
    public let inviterId: Int

    public init(inviterId: Int) {
        self.inviterId = inviterId
    }

    enum CodingKeys: String, CodingKey {
        case inviterId = "inviter_id"
    }
}

public struct AuditDetailsKms: Codable {
    public let chatId: Int
    public let messageId: Int
    public let reason: String

    public init(chatId: Int, messageId: Int, reason: String) {
        self.chatId = chatId
        self.messageId = messageId
        self.reason = reason
    }

    enum CodingKeys: String, CodingKey {
        case chatId = "chat_id"
        case messageId = "message_id"
        case reason
    }
}

public struct AuditDetailsRoleChanged: Codable {
    public let newCompanyRole: String
    public let previousCompanyRole: String
    public let initiatorId: Int

    public init(newCompanyRole: String, previousCompanyRole: String, initiatorId: Int) {
        self.newCompanyRole = newCompanyRole
        self.previousCompanyRole = previousCompanyRole
        self.initiatorId = initiatorId
    }

    enum CodingKeys: String, CodingKey {
        case newCompanyRole = "new_company_role"
        case previousCompanyRole = "previous_company_role"
        case initiatorId = "initiator_id"
    }
}

public struct AuditDetailsSearch: Codable {
    public let searchType: String
    public let queryPresent: Bool
    public let cursorPresent: Bool
    public let limit: Int
    public let filters: [String: String]

    public init(searchType: String, queryPresent: Bool, cursorPresent: Bool, limit: Int, filters: [String: String]) {
        self.searchType = searchType
        self.queryPresent = queryPresent
        self.cursorPresent = cursorPresent
        self.limit = limit
        self.filters = filters
    }

    enum CodingKeys: String, CodingKey {
        case searchType = "search_type"
        case queryPresent = "query_present"
        case cursorPresent = "cursor_present"
        case limit
        case filters
    }
}

public struct AuditDetailsTagChat: Codable {
    public let chatId: Int
    public let tagName: String

    public init(chatId: Int, tagName: String) {
        self.chatId = chatId
        self.tagName = tagName
    }

    enum CodingKeys: String, CodingKey {
        case chatId = "chat_id"
        case tagName = "tag_name"
    }
}

public struct AuditDetailsTagName: Codable {
    public let name: String

    public init(name: String) {
        self.name = name
    }
}

public struct AuditDetailsTokenScopes: Codable {
    public let scopes: [String]

    public init(scopes: [String]) {
        self.scopes = scopes
    }
}

public struct AuditDetailsUserUpdated: Codable {
    public let changedAttrs: [String]

    public init(changedAttrs: [String]) {
        self.changedAttrs = changedAttrs
    }

    enum CodingKeys: String, CodingKey {
        case changedAttrs = "changed_attrs"
    }
}

public struct AuditEvent: Codable {
    public let id: String
    public let createdAt: String
    public let eventKey: AuditEventKey
    public let entityId: String
    public let entityType: String
    public let actorId: String
    public let actorType: String
    public let details: AuditEventDetailsUnion
    public let ipAddress: String
    public let userAgent: String

    public init(id: String, createdAt: String, eventKey: AuditEventKey, entityId: String, entityType: String, actorId: String, actorType: String, details: AuditEventDetailsUnion, ipAddress: String, userAgent: String) {
        self.id = id
        self.createdAt = createdAt
        self.eventKey = eventKey
        self.entityId = entityId
        self.entityType = entityType
        self.actorId = actorId
        self.actorType = actorType
        self.details = details
        self.ipAddress = ipAddress
        self.userAgent = userAgent
    }

    enum CodingKeys: String, CodingKey {
        case id
        case createdAt = "created_at"
        case eventKey = "event_key"
        case entityId = "entity_id"
        case entityType = "entity_type"
        case actorId = "actor_id"
        case actorType = "actor_type"
        case details
        case ipAddress = "ip_address"
        case userAgent = "user_agent"
    }
}

public struct AvatarData: Codable {
    public let imageUrl: String

    public init(imageUrl: String) {
        self.imageUrl = imageUrl
    }

    enum CodingKeys: String, CodingKey {
        case imageUrl = "image_url"
    }
}

public struct BotResponseWebhook: Codable {
    public let outgoingUrl: String

    public init(outgoingUrl: String) {
        self.outgoingUrl = outgoingUrl
    }

    enum CodingKeys: String, CodingKey {
        case outgoingUrl = "outgoing_url"
    }
}

public struct BotResponse: Codable {
    public let id: Int
    public let webhook: BotResponseWebhook

    public init(id: Int, webhook: BotResponseWebhook) {
        self.id = id
        self.webhook = webhook
    }
}

public struct BotUpdateRequestBotWebhook: Codable {
    public let outgoingUrl: String

    public init(outgoingUrl: String) {
        self.outgoingUrl = outgoingUrl
    }

    enum CodingKeys: String, CodingKey {
        case outgoingUrl = "outgoing_url"
    }
}

public struct BotUpdateRequestBot: Codable {
    public let webhook: BotUpdateRequestBotWebhook

    public init(webhook: BotUpdateRequestBotWebhook) {
        self.webhook = webhook
    }
}

public struct BotUpdateRequest: Codable {
    public let bot: BotUpdateRequestBot

    public init(bot: BotUpdateRequestBot) {
        self.bot = bot
    }
}

public struct Button: Codable {
    public let text: String
    public let url: String?
    public let data: String?

    public init(text: String, url: String? = nil, data: String? = nil) {
        self.text = text
        self.url = url
        self.data = data
    }
}

public struct ButtonWebhookPayload: Codable {
    public let type: String
    public let event: String
    public let messageId: Int
    public let triggerId: String
    public let data: String
    public let userId: Int
    public let chatId: Int
    public let webhookTimestamp: Int

    public init(type: String, event: String, messageId: Int, triggerId: String, data: String, userId: Int, chatId: Int, webhookTimestamp: Int) {
        self.type = type
        self.event = event
        self.messageId = messageId
        self.triggerId = triggerId
        self.data = data
        self.userId = userId
        self.chatId = chatId
        self.webhookTimestamp = webhookTimestamp
    }

    enum CodingKeys: String, CodingKey {
        case type
        case event
        case messageId = "message_id"
        case triggerId = "trigger_id"
        case data
        case userId = "user_id"
        case chatId = "chat_id"
        case webhookTimestamp = "webhook_timestamp"
    }
}

public struct Chat: Codable {
    public let id: Int
    public let name: String
    public let createdAt: String
    public let ownerId: Int
    public let memberIds: [Int]
    public let groupTagIds: [Int]
    public let channel: Bool
    public let personal: Bool
    public let `public`: Bool
    public let lastMessageAt: String
    public let meetRoomUrl: String

    public init(id: Int, name: String, createdAt: String, ownerId: Int, memberIds: [Int], groupTagIds: [Int], channel: Bool, personal: Bool, `public`: Bool, lastMessageAt: String, meetRoomUrl: String) {
        self.id = id
        self.name = name
        self.createdAt = createdAt
        self.ownerId = ownerId
        self.memberIds = memberIds
        self.groupTagIds = groupTagIds
        self.channel = channel
        self.personal = personal
        self.`public` = `public`
        self.lastMessageAt = lastMessageAt
        self.meetRoomUrl = meetRoomUrl
    }

    enum CodingKeys: String, CodingKey {
        case id
        case name
        case createdAt = "created_at"
        case ownerId = "owner_id"
        case memberIds = "member_ids"
        case groupTagIds = "group_tag_ids"
        case channel
        case personal
        case `public` = "public"
        case lastMessageAt = "last_message_at"
        case meetRoomUrl = "meet_room_url"
    }
}

public struct ChatCreateRequestChat: Codable {
    public let name: String
    public let memberIds: [Int]?
    public let groupTagIds: [Int]?
    public let channel: Bool?
    public let `public`: Bool?

    public init(name: String, memberIds: [Int]? = nil, groupTagIds: [Int]? = nil, channel: Bool? = nil, `public`: Bool? = nil) {
        self.name = name
        self.memberIds = memberIds
        self.groupTagIds = groupTagIds
        self.channel = channel
        self.`public` = `public`
    }

    enum CodingKeys: String, CodingKey {
        case name
        case memberIds = "member_ids"
        case groupTagIds = "group_tag_ids"
        case channel
        case `public` = "public"
    }
}

public struct ChatCreateRequest: Codable {
    public let chat: ChatCreateRequestChat

    public init(chat: ChatCreateRequestChat) {
        self.chat = chat
    }
}

public struct ChatMemberWebhookPayload: Codable {
    public let type: String
    public let event: MemberEventType
    public let chatId: Int
    public let threadId: Int?
    public let userIds: [Int]
    public let createdAt: String
    public let webhookTimestamp: Int

    public init(type: String, event: MemberEventType, chatId: Int, threadId: Int? = nil, userIds: [Int], createdAt: String, webhookTimestamp: Int) {
        self.type = type
        self.event = event
        self.chatId = chatId
        self.threadId = threadId
        self.userIds = userIds
        self.createdAt = createdAt
        self.webhookTimestamp = webhookTimestamp
    }

    enum CodingKeys: String, CodingKey {
        case type
        case event
        case chatId = "chat_id"
        case threadId = "thread_id"
        case userIds = "user_ids"
        case createdAt = "created_at"
        case webhookTimestamp = "webhook_timestamp"
    }
}

public struct ChatUpdateRequestChat: Codable {
    public let name: String?
    public let `public`: Bool?

    public init(name: String? = nil, `public`: Bool? = nil) {
        self.name = name
        self.`public` = `public`
    }

    enum CodingKeys: String, CodingKey {
        case name
        case `public` = "public"
    }
}

public struct ChatUpdateRequest: Codable {
    public let chat: ChatUpdateRequestChat

    public init(chat: ChatUpdateRequestChat) {
        self.chat = chat
    }
}

public struct CompanyMemberWebhookPayload: Codable {
    public let type: String
    public let event: UserEventType
    public let userIds: [Int]
    public let createdAt: String
    public let webhookTimestamp: Int

    public init(type: String, event: UserEventType, userIds: [Int], createdAt: String, webhookTimestamp: Int) {
        self.type = type
        self.event = event
        self.userIds = userIds
        self.createdAt = createdAt
        self.webhookTimestamp = webhookTimestamp
    }

    enum CodingKeys: String, CodingKey {
        case type
        case event
        case userIds = "user_ids"
        case createdAt = "created_at"
        case webhookTimestamp = "webhook_timestamp"
    }
}

public struct CustomProperty: Codable {
    public let id: Int
    public let name: String
    public let dataType: CustomPropertyDataType
    public let value: String

    public init(id: Int, name: String, dataType: CustomPropertyDataType, value: String) {
        self.id = id
        self.name = name
        self.dataType = dataType
        self.value = value
    }

    enum CodingKeys: String, CodingKey {
        case id
        case name
        case dataType = "data_type"
        case value
    }
}

public struct CustomPropertyDefinition: Codable {
    public let id: Int
    public let name: String
    public let dataType: CustomPropertyDataType

    public init(id: Int, name: String, dataType: CustomPropertyDataType) {
        self.id = id
        self.name = name
        self.dataType = dataType
    }

    enum CodingKeys: String, CodingKey {
        case id
        case name
        case dataType = "data_type"
    }
}

public struct ExportRequest: Codable {
    public let startAt: String
    public let endAt: String
    public let webhookUrl: String
    public let chatIds: [Int]?
    public let skipChatsFile: Bool?

    public init(startAt: String, endAt: String, webhookUrl: String, chatIds: [Int]? = nil, skipChatsFile: Bool? = nil) {
        self.startAt = startAt
        self.endAt = endAt
        self.webhookUrl = webhookUrl
        self.chatIds = chatIds
        self.skipChatsFile = skipChatsFile
    }

    enum CodingKeys: String, CodingKey {
        case startAt = "start_at"
        case endAt = "end_at"
        case webhookUrl = "webhook_url"
        case chatIds = "chat_ids"
        case skipChatsFile = "skip_chats_file"
    }
}

public struct File: Codable {
    public let id: Int
    public let key: String
    public let name: String
    public let fileType: FileType
    public let url: String
    public let width: Int?
    public let height: Int?

    public init(id: Int, key: String, name: String, fileType: FileType, url: String, width: Int? = nil, height: Int? = nil) {
        self.id = id
        self.key = key
        self.name = name
        self.fileType = fileType
        self.url = url
        self.width = width
        self.height = height
    }

    enum CodingKeys: String, CodingKey {
        case id
        case key
        case name
        case fileType = "file_type"
        case url
        case width
        case height
    }
}

public struct FileUploadRequest: Codable {
    public let ContentDisposition: String
    public let acl: String
    public let policy: String
    public let xAmzCredential: String
    public let xAmzAlgorithm: String
    public let xAmzDate: String
    public let xAmzSignature: String
    public let key: String
    public var file: Data

    public init(ContentDisposition: String, acl: String, policy: String, xAmzCredential: String, xAmzAlgorithm: String, xAmzDate: String, xAmzSignature: String, key: String, file: Data) {
        self.ContentDisposition = ContentDisposition
        self.acl = acl
        self.policy = policy
        self.xAmzCredential = xAmzCredential
        self.xAmzAlgorithm = xAmzAlgorithm
        self.xAmzDate = xAmzDate
        self.xAmzSignature = xAmzSignature
        self.key = key
        self.file = file
    }

    enum CodingKeys: String, CodingKey {
        case ContentDisposition = "Content-Disposition"
        case acl
        case policy
        case xAmzCredential = "x-amz-credential"
        case xAmzAlgorithm = "x-amz-algorithm"
        case xAmzDate = "x-amz-date"
        case xAmzSignature = "x-amz-signature"
        case key
        case file
    }
}

public struct Forwarding: Codable {
    public let originalMessageId: Int
    public let originalChatId: Int
    public let authorId: Int
    public let originalCreatedAt: String
    public let originalThreadId: Int?
    public let originalThreadMessageId: Int?
    public let originalThreadParentChatId: Int?

    public init(originalMessageId: Int, originalChatId: Int, authorId: Int, originalCreatedAt: String, originalThreadId: Int? = nil, originalThreadMessageId: Int? = nil, originalThreadParentChatId: Int? = nil) {
        self.originalMessageId = originalMessageId
        self.originalChatId = originalChatId
        self.authorId = authorId
        self.originalCreatedAt = originalCreatedAt
        self.originalThreadId = originalThreadId
        self.originalThreadMessageId = originalThreadMessageId
        self.originalThreadParentChatId = originalThreadParentChatId
    }

    enum CodingKeys: String, CodingKey {
        case originalMessageId = "original_message_id"
        case originalChatId = "original_chat_id"
        case authorId = "author_id"
        case originalCreatedAt = "original_created_at"
        case originalThreadId = "original_thread_id"
        case originalThreadMessageId = "original_thread_message_id"
        case originalThreadParentChatId = "original_thread_parent_chat_id"
    }
}

public struct GroupTag: Codable {
    public let id: Int
    public let name: String
    public let usersCount: Int

    public init(id: Int, name: String, usersCount: Int) {
        self.id = id
        self.name = name
        self.usersCount = usersCount
    }

    enum CodingKeys: String, CodingKey {
        case id
        case name
        case usersCount = "users_count"
    }
}

public struct GroupTagRequestGroupTag: Codable {
    public let name: String

    public init(name: String) {
        self.name = name
    }
}

public struct GroupTagRequest: Codable {
    public let groupTag: GroupTagRequestGroupTag

    public init(groupTag: GroupTagRequestGroupTag) {
        self.groupTag = groupTag
    }

    enum CodingKeys: String, CodingKey {
        case groupTag = "group_tag"
    }
}

public struct LinkPreviewImage: Codable {
    public let key: String
    public let name: String
    public let size: Int?

    public init(key: String, name: String, size: Int? = nil) {
        self.key = key
        self.name = name
        self.size = size
    }
}

public struct LinkPreview: Codable {
    public let title: String
    public let description: String
    public let imageUrl: String?
    public let image: LinkPreviewImage?

    public init(title: String, description: String, imageUrl: String? = nil, image: LinkPreviewImage? = nil) {
        self.title = title
        self.description = description
        self.imageUrl = imageUrl
        self.image = image
    }

    enum CodingKeys: String, CodingKey {
        case title
        case description
        case imageUrl = "image_url"
        case image
    }
}

public struct LinkPreviewsRequest: Codable {
    public let linkPreviews: [String: LinkPreview]

    public init(linkPreviews: [String: LinkPreview]) {
        self.linkPreviews = linkPreviews
    }

    enum CodingKeys: String, CodingKey {
        case linkPreviews = "link_previews"
    }
}

public struct LinkSharedWebhookPayload: Codable {
    public let type: String
    public let event: String
    public let chatId: Int
    public let messageId: Int
    public let links: [WebhookLink]
    public let userId: Int
    public let createdAt: String
    public let webhookTimestamp: Int

    public init(type: String, event: String, chatId: Int, messageId: Int, links: [WebhookLink], userId: Int, createdAt: String, webhookTimestamp: Int) {
        self.type = type
        self.event = event
        self.chatId = chatId
        self.messageId = messageId
        self.links = links
        self.userId = userId
        self.createdAt = createdAt
        self.webhookTimestamp = webhookTimestamp
    }

    enum CodingKeys: String, CodingKey {
        case type
        case event
        case chatId = "chat_id"
        case messageId = "message_id"
        case links
        case userId = "user_id"
        case createdAt = "created_at"
        case webhookTimestamp = "webhook_timestamp"
    }
}

public struct MessageThread: Codable {
    public let id: Int64
    public let chatId: Int64

    public init(id: Int64, chatId: Int64) {
        self.id = id
        self.chatId = chatId
    }

    enum CodingKeys: String, CodingKey {
        case id
        case chatId = "chat_id"
    }
}

public struct Message: Codable {
    public let id: Int
    public let entityType: MessageEntityType
    public let entityId: Int
    public let chatId: Int
    public let rootChatId: Int
    public let content: String
    public let userId: Int
    public let createdAt: String
    public let url: String
    public let files: [File]
    public let buttons: [[Button]]?
    public let thread: MessageThread?
    public let forwarding: Forwarding?
    public let parentMessageId: Int?
    public let displayAvatarUrl: String?
    public let displayName: String?
    public let changedAt: String?
    public let deletedAt: String?

    public init(id: Int, entityType: MessageEntityType, entityId: Int, chatId: Int, rootChatId: Int, content: String, userId: Int, createdAt: String, url: String, files: [File], buttons: [[Button]]? = nil, thread: MessageThread? = nil, forwarding: Forwarding? = nil, parentMessageId: Int? = nil, displayAvatarUrl: String? = nil, displayName: String? = nil, changedAt: String? = nil, deletedAt: String? = nil) {
        self.id = id
        self.entityType = entityType
        self.entityId = entityId
        self.chatId = chatId
        self.rootChatId = rootChatId
        self.content = content
        self.userId = userId
        self.createdAt = createdAt
        self.url = url
        self.files = files
        self.buttons = buttons
        self.thread = thread
        self.forwarding = forwarding
        self.parentMessageId = parentMessageId
        self.displayAvatarUrl = displayAvatarUrl
        self.displayName = displayName
        self.changedAt = changedAt
        self.deletedAt = deletedAt
    }

    enum CodingKeys: String, CodingKey {
        case id
        case entityType = "entity_type"
        case entityId = "entity_id"
        case chatId = "chat_id"
        case rootChatId = "root_chat_id"
        case content
        case userId = "user_id"
        case createdAt = "created_at"
        case url
        case files
        case buttons
        case thread
        case forwarding
        case parentMessageId = "parent_message_id"
        case displayAvatarUrl = "display_avatar_url"
        case displayName = "display_name"
        case changedAt = "changed_at"
        case deletedAt = "deleted_at"
    }
}

public struct MessageCreateRequestFile: Codable {
    public let key: String
    public let name: String
    public let fileType: FileType
    public let size: Int
    public let width: Int?
    public let height: Int?

    public init(key: String, name: String, fileType: FileType, size: Int, width: Int? = nil, height: Int? = nil) {
        self.key = key
        self.name = name
        self.fileType = fileType
        self.size = size
        self.width = width
        self.height = height
    }

    enum CodingKeys: String, CodingKey {
        case key
        case name
        case fileType = "file_type"
        case size
        case width
        case height
    }
}

public struct MessageCreateRequestMessage: Codable {
    public let entityType: MessageEntityType?
    public let entityId: Int
    public let content: String
    public let files: [MessageCreateRequestFile]?
    public let buttons: [[Button]]?
    public let parentMessageId: Int?
    public let displayAvatarUrl: String?
    public let displayName: String?
    public let skipInviteMentions: Bool?

    public init(entityType: MessageEntityType? = nil, entityId: Int, content: String, files: [MessageCreateRequestFile]? = nil, buttons: [[Button]]? = nil, parentMessageId: Int? = nil, displayAvatarUrl: String? = nil, displayName: String? = nil, skipInviteMentions: Bool? = nil) {
        self.entityType = entityType
        self.entityId = entityId
        self.content = content
        self.files = files
        self.buttons = buttons
        self.parentMessageId = parentMessageId
        self.displayAvatarUrl = displayAvatarUrl
        self.displayName = displayName
        self.skipInviteMentions = skipInviteMentions
    }

    enum CodingKeys: String, CodingKey {
        case entityType = "entity_type"
        case entityId = "entity_id"
        case content
        case files
        case buttons
        case parentMessageId = "parent_message_id"
        case displayAvatarUrl = "display_avatar_url"
        case displayName = "display_name"
        case skipInviteMentions = "skip_invite_mentions"
    }
}

public struct MessageCreateRequest: Codable {
    public let message: MessageCreateRequestMessage
    public let linkPreview: Bool?

    public init(message: MessageCreateRequestMessage, linkPreview: Bool? = nil) {
        self.message = message
        self.linkPreview = linkPreview
    }

    enum CodingKeys: String, CodingKey {
        case message
        case linkPreview = "link_preview"
    }
}

public struct MessageUpdateRequestFile: Codable {
    public let key: String
    public let name: String
    public let fileType: String?
    public let size: Int?
    public let width: Int?
    public let height: Int?

    public init(key: String, name: String, fileType: String? = nil, size: Int? = nil, width: Int? = nil, height: Int? = nil) {
        self.key = key
        self.name = name
        self.fileType = fileType
        self.size = size
        self.width = width
        self.height = height
    }

    enum CodingKeys: String, CodingKey {
        case key
        case name
        case fileType = "file_type"
        case size
        case width
        case height
    }
}

public struct MessageUpdateRequestMessage: Codable {
    public let content: String?
    public let files: [MessageUpdateRequestFile]?
    public let buttons: [[Button]]?
    public let displayAvatarUrl: String?
    public let displayName: String?

    public init(content: String? = nil, files: [MessageUpdateRequestFile]? = nil, buttons: [[Button]]? = nil, displayAvatarUrl: String? = nil, displayName: String? = nil) {
        self.content = content
        self.files = files
        self.buttons = buttons
        self.displayAvatarUrl = displayAvatarUrl
        self.displayName = displayName
    }

    enum CodingKeys: String, CodingKey {
        case content
        case files
        case buttons
        case displayAvatarUrl = "display_avatar_url"
        case displayName = "display_name"
    }
}

public struct MessageUpdateRequest: Codable {
    public let message: MessageUpdateRequestMessage

    public init(message: MessageUpdateRequestMessage) {
        self.message = message
    }
}

public struct MessageWebhookPayload: Codable {
    public let type: String
    public let id: Int
    public let event: WebhookEventType
    public let entityType: MessageEntityType
    public let entityId: Int
    public let content: String
    public let userId: Int
    public let createdAt: String
    public let url: String
    public let chatId: Int
    public let parentMessageId: Int?
    public let thread: WebhookMessageThread?
    public let webhookTimestamp: Int

    public init(type: String, id: Int, event: WebhookEventType, entityType: MessageEntityType, entityId: Int, content: String, userId: Int, createdAt: String, url: String, chatId: Int, parentMessageId: Int? = nil, thread: WebhookMessageThread? = nil, webhookTimestamp: Int) {
        self.type = type
        self.id = id
        self.event = event
        self.entityType = entityType
        self.entityId = entityId
        self.content = content
        self.userId = userId
        self.createdAt = createdAt
        self.url = url
        self.chatId = chatId
        self.parentMessageId = parentMessageId
        self.thread = thread
        self.webhookTimestamp = webhookTimestamp
    }

    enum CodingKeys: String, CodingKey {
        case type
        case id
        case event
        case entityType = "entity_type"
        case entityId = "entity_id"
        case content
        case userId = "user_id"
        case createdAt = "created_at"
        case url
        case chatId = "chat_id"
        case parentMessageId = "parent_message_id"
        case thread
        case webhookTimestamp = "webhook_timestamp"
    }
}

public struct OAuthError: Codable, Error {
    public let error: String
    public let errorDescription: String

    public init(error: String, errorDescription: String) {
        self.error = error
        self.errorDescription = errorDescription
    }

    enum CodingKeys: String, CodingKey {
        case error
        case errorDescription = "error_description"
    }
}

public struct OpenViewRequestView: Codable {
    public let title: String
    public let closeText: String?
    public let submitText: String?
    public let blocks: [ViewBlockUnion]

    public init(title: String, closeText: String? = nil, submitText: String? = nil, blocks: [ViewBlockUnion]) {
        self.title = title
        self.closeText = closeText
        self.submitText = submitText
        self.blocks = blocks
    }

    enum CodingKeys: String, CodingKey {
        case title
        case closeText = "close_text"
        case submitText = "submit_text"
        case blocks
    }
}

public struct OpenViewRequest: Codable {
    public let type: String
    public let triggerId: String
    public let privateMetadata: String?
    public let callbackId: String?
    public let view: OpenViewRequestView

    public init(type: String, triggerId: String, privateMetadata: String? = nil, callbackId: String? = nil, view: OpenViewRequestView) {
        self.type = type
        self.triggerId = triggerId
        self.privateMetadata = privateMetadata
        self.callbackId = callbackId
        self.view = view
    }

    enum CodingKeys: String, CodingKey {
        case type
        case triggerId = "trigger_id"
        case privateMetadata = "private_metadata"
        case callbackId = "callback_id"
        case view
    }
}

public struct PaginationMetaPaginate: Codable {
    public let nextPage: String

    public init(nextPage: String) {
        self.nextPage = nextPage
    }

    enum CodingKeys: String, CodingKey {
        case nextPage = "next_page"
    }
}

public struct PaginationMeta: Codable {
    public let paginate: PaginationMetaPaginate

    public init(paginate: PaginationMetaPaginate) {
        self.paginate = paginate
    }
}

public struct Reaction: Codable {
    public let userId: Int
    public let createdAt: String
    public let code: String
    public let name: String?

    public init(userId: Int, createdAt: String, code: String, name: String? = nil) {
        self.userId = userId
        self.createdAt = createdAt
        self.code = code
        self.name = name
    }

    enum CodingKeys: String, CodingKey {
        case userId = "user_id"
        case createdAt = "created_at"
        case code
        case name
    }
}

public struct ReactionRequest: Codable {
    public let code: String
    public let name: String?

    public init(code: String, name: String? = nil) {
        self.code = code
        self.name = name
    }
}

public struct ReactionWebhookPayload: Codable {
    public let type: String
    public let event: ReactionEventType
    public let messageId: Int
    public let code: String
    public let name: String
    public let userId: Int
    public let createdAt: String
    public let webhookTimestamp: Int

    public init(type: String, event: ReactionEventType, messageId: Int, code: String, name: String, userId: Int, createdAt: String, webhookTimestamp: Int) {
        self.type = type
        self.event = event
        self.messageId = messageId
        self.code = code
        self.name = name
        self.userId = userId
        self.createdAt = createdAt
        self.webhookTimestamp = webhookTimestamp
    }

    enum CodingKeys: String, CodingKey {
        case type
        case event
        case messageId = "message_id"
        case code
        case name
        case userId = "user_id"
        case createdAt = "created_at"
        case webhookTimestamp = "webhook_timestamp"
    }
}

public struct SearchPaginationMetaPaginate: Codable {
    public let nextPage: String

    public init(nextPage: String) {
        self.nextPage = nextPage
    }

    enum CodingKeys: String, CodingKey {
        case nextPage = "next_page"
    }
}

public struct SearchPaginationMeta: Codable {
    public let total: Int
    public let paginate: SearchPaginationMetaPaginate

    public init(total: Int, paginate: SearchPaginationMetaPaginate) {
        self.total = total
        self.paginate = paginate
    }
}

public struct StatusUpdateRequestStatus: Codable {
    public let emoji: String
    public let title: String
    public let expiresAt: String?
    public let isAway: Bool?
    public let awayMessage: String?

    public init(emoji: String, title: String, expiresAt: String? = nil, isAway: Bool? = nil, awayMessage: String? = nil) {
        self.emoji = emoji
        self.title = title
        self.expiresAt = expiresAt
        self.isAway = isAway
        self.awayMessage = awayMessage
    }

    enum CodingKeys: String, CodingKey {
        case emoji
        case title
        case expiresAt = "expires_at"
        case isAway = "is_away"
        case awayMessage = "away_message"
    }
}

public struct StatusUpdateRequest: Codable {
    public let status: StatusUpdateRequestStatus

    public init(status: StatusUpdateRequestStatus) {
        self.status = status
    }
}

public struct Task: Codable {
    public let id: Int
    public let kind: TaskKind
    public let content: String
    public let dueAt: String?
    public let priority: Int
    public let userId: Int
    public let chatId: Int?
    public let status: TaskStatus
    public let createdAt: String
    public let performerIds: [Int]
    public let allDay: Bool
    public let customProperties: [CustomProperty]

    public init(id: Int, kind: TaskKind, content: String, dueAt: String? = nil, priority: Int, userId: Int, chatId: Int? = nil, status: TaskStatus, createdAt: String, performerIds: [Int], allDay: Bool, customProperties: [CustomProperty]) {
        self.id = id
        self.kind = kind
        self.content = content
        self.dueAt = dueAt
        self.priority = priority
        self.userId = userId
        self.chatId = chatId
        self.status = status
        self.createdAt = createdAt
        self.performerIds = performerIds
        self.allDay = allDay
        self.customProperties = customProperties
    }

    enum CodingKeys: String, CodingKey {
        case id
        case kind
        case content
        case dueAt = "due_at"
        case priority
        case userId = "user_id"
        case chatId = "chat_id"
        case status
        case createdAt = "created_at"
        case performerIds = "performer_ids"
        case allDay = "all_day"
        case customProperties = "custom_properties"
    }
}

public struct TaskCreateRequestCustomProperty: Codable {
    public let id: Int
    public let value: String

    public init(id: Int, value: String) {
        self.id = id
        self.value = value
    }
}

public struct TaskCreateRequestTask: Codable {
    public let kind: TaskKind
    public let content: String?
    public let dueAt: String?
    public let priority: Int?
    public let performerIds: [Int]?
    public let chatId: Int?
    public let allDay: Bool?
    public let customProperties: [TaskCreateRequestCustomProperty]?

    public init(kind: TaskKind, content: String? = nil, dueAt: String? = nil, priority: Int? = nil, performerIds: [Int]? = nil, chatId: Int? = nil, allDay: Bool? = nil, customProperties: [TaskCreateRequestCustomProperty]? = nil) {
        self.kind = kind
        self.content = content
        self.dueAt = dueAt
        self.priority = priority
        self.performerIds = performerIds
        self.chatId = chatId
        self.allDay = allDay
        self.customProperties = customProperties
    }

    enum CodingKeys: String, CodingKey {
        case kind
        case content
        case dueAt = "due_at"
        case priority
        case performerIds = "performer_ids"
        case chatId = "chat_id"
        case allDay = "all_day"
        case customProperties = "custom_properties"
    }
}

public struct TaskCreateRequest: Codable {
    public let task: TaskCreateRequestTask

    public init(task: TaskCreateRequestTask) {
        self.task = task
    }
}

public struct TaskUpdateRequestCustomProperty: Codable {
    public let id: Int
    public let value: String

    public init(id: Int, value: String) {
        self.id = id
        self.value = value
    }
}

public struct TaskUpdateRequestTask: Codable {
    public let kind: TaskKind?
    public let content: String?
    public let dueAt: String?
    public let priority: Int?
    public let performerIds: [Int]?
    public let status: TaskStatus?
    public let allDay: Bool?
    public let doneAt: String?
    public let customProperties: [TaskUpdateRequestCustomProperty]?

    public init(kind: TaskKind? = nil, content: String? = nil, dueAt: String? = nil, priority: Int? = nil, performerIds: [Int]? = nil, status: TaskStatus? = nil, allDay: Bool? = nil, doneAt: String? = nil, customProperties: [TaskUpdateRequestCustomProperty]? = nil) {
        self.kind = kind
        self.content = content
        self.dueAt = dueAt
        self.priority = priority
        self.performerIds = performerIds
        self.status = status
        self.allDay = allDay
        self.doneAt = doneAt
        self.customProperties = customProperties
    }

    enum CodingKeys: String, CodingKey {
        case kind
        case content
        case dueAt = "due_at"
        case priority
        case performerIds = "performer_ids"
        case status
        case allDay = "all_day"
        case doneAt = "done_at"
        case customProperties = "custom_properties"
    }
}

public struct TaskUpdateRequest: Codable {
    public let task: TaskUpdateRequestTask

    public init(task: TaskUpdateRequestTask) {
        self.task = task
    }
}

public struct Thread: Codable {
    public let id: Int64
    public let chatId: Int64
    public let messageId: Int64
    public let messageChatId: Int64
    public let updatedAt: String

    public init(id: Int64, chatId: Int64, messageId: Int64, messageChatId: Int64, updatedAt: String) {
        self.id = id
        self.chatId = chatId
        self.messageId = messageId
        self.messageChatId = messageChatId
        self.updatedAt = updatedAt
    }

    enum CodingKeys: String, CodingKey {
        case id
        case chatId = "chat_id"
        case messageId = "message_id"
        case messageChatId = "message_chat_id"
        case updatedAt = "updated_at"
    }
}

public struct UpdateMemberRoleRequest: Codable {
    public let role: ChatMemberRole

    public init(role: ChatMemberRole) {
        self.role = role
    }
}

public struct UploadParams: Codable {
    public let ContentDisposition: String
    public let acl: String
    public let policy: String
    public let xAmzCredential: String
    public let xAmzAlgorithm: String
    public let xAmzDate: String
    public let xAmzSignature: String
    public let key: String
    public let directUrl: String

    public init(ContentDisposition: String, acl: String, policy: String, xAmzCredential: String, xAmzAlgorithm: String, xAmzDate: String, xAmzSignature: String, key: String, directUrl: String) {
        self.ContentDisposition = ContentDisposition
        self.acl = acl
        self.policy = policy
        self.xAmzCredential = xAmzCredential
        self.xAmzAlgorithm = xAmzAlgorithm
        self.xAmzDate = xAmzDate
        self.xAmzSignature = xAmzSignature
        self.key = key
        self.directUrl = directUrl
    }

    enum CodingKeys: String, CodingKey {
        case ContentDisposition = "Content-Disposition"
        case acl
        case policy
        case xAmzCredential = "x-amz-credential"
        case xAmzAlgorithm = "x-amz-algorithm"
        case xAmzDate = "x-amz-date"
        case xAmzSignature = "x-amz-signature"
        case key
        case directUrl = "direct_url"
    }
}

public struct User: Codable {
    public let id: Int
    public let firstName: String
    public let lastName: String
    public let nickname: String
    public let email: String
    public let phoneNumber: String
    public let department: String
    public let title: String
    public let role: UserRole
    public let suspended: Bool
    public let inviteStatus: InviteStatus
    public let listTags: [String]
    public let customProperties: [CustomProperty]
    public let userStatus: UserStatus?
    public let bot: Bool
    public let sso: Bool
    public let createdAt: String
    public let lastActivityAt: String
    public let timeZone: String
    public let imageUrl: String?

    public init(id: Int, firstName: String, lastName: String, nickname: String, email: String, phoneNumber: String, department: String, title: String, role: UserRole, suspended: Bool, inviteStatus: InviteStatus, listTags: [String], customProperties: [CustomProperty], userStatus: UserStatus? = nil, bot: Bool, sso: Bool, createdAt: String, lastActivityAt: String, timeZone: String, imageUrl: String? = nil) {
        self.id = id
        self.firstName = firstName
        self.lastName = lastName
        self.nickname = nickname
        self.email = email
        self.phoneNumber = phoneNumber
        self.department = department
        self.title = title
        self.role = role
        self.suspended = suspended
        self.inviteStatus = inviteStatus
        self.listTags = listTags
        self.customProperties = customProperties
        self.userStatus = userStatus
        self.bot = bot
        self.sso = sso
        self.createdAt = createdAt
        self.lastActivityAt = lastActivityAt
        self.timeZone = timeZone
        self.imageUrl = imageUrl
    }

    enum CodingKeys: String, CodingKey {
        case id
        case firstName = "first_name"
        case lastName = "last_name"
        case nickname
        case email
        case phoneNumber = "phone_number"
        case department
        case title
        case role
        case suspended
        case inviteStatus = "invite_status"
        case listTags = "list_tags"
        case customProperties = "custom_properties"
        case userStatus = "user_status"
        case bot
        case sso
        case createdAt = "created_at"
        case lastActivityAt = "last_activity_at"
        case timeZone = "time_zone"
        case imageUrl = "image_url"
    }
}

public struct UserCreateRequestCustomProperty: Codable {
    public let id: Int
    public let value: String

    public init(id: Int, value: String) {
        self.id = id
        self.value = value
    }
}

public struct UserCreateRequestUser: Codable {
    public let firstName: String?
    public let lastName: String?
    public let email: String
    public let phoneNumber: String?
    public let nickname: String?
    public let department: String?
    public let title: String?
    public let role: UserRoleInput?
    public let suspended: Bool?
    public let listTags: [String]?
    public let customProperties: [UserCreateRequestCustomProperty]?

    public init(firstName: String? = nil, lastName: String? = nil, email: String, phoneNumber: String? = nil, nickname: String? = nil, department: String? = nil, title: String? = nil, role: UserRoleInput? = nil, suspended: Bool? = nil, listTags: [String]? = nil, customProperties: [UserCreateRequestCustomProperty]? = nil) {
        self.firstName = firstName
        self.lastName = lastName
        self.email = email
        self.phoneNumber = phoneNumber
        self.nickname = nickname
        self.department = department
        self.title = title
        self.role = role
        self.suspended = suspended
        self.listTags = listTags
        self.customProperties = customProperties
    }

    enum CodingKeys: String, CodingKey {
        case firstName = "first_name"
        case lastName = "last_name"
        case email
        case phoneNumber = "phone_number"
        case nickname
        case department
        case title
        case role
        case suspended
        case listTags = "list_tags"
        case customProperties = "custom_properties"
    }
}

public struct UserCreateRequest: Codable {
    public let user: UserCreateRequestUser
    public let skipEmailNotify: Bool?

    public init(user: UserCreateRequestUser, skipEmailNotify: Bool? = nil) {
        self.user = user
        self.skipEmailNotify = skipEmailNotify
    }

    enum CodingKeys: String, CodingKey {
        case user
        case skipEmailNotify = "skip_email_notify"
    }
}

public struct UserStatusAwayMessage: Codable {
    public let text: String

    public init(text: String) {
        self.text = text
    }
}

public struct UserStatus: Codable {
    public let emoji: String
    public let title: String
    public let expiresAt: String?
    public let isAway: Bool
    public let awayMessage: UserStatusAwayMessage?

    public init(emoji: String, title: String, expiresAt: String? = nil, isAway: Bool, awayMessage: UserStatusAwayMessage? = nil) {
        self.emoji = emoji
        self.title = title
        self.expiresAt = expiresAt
        self.isAway = isAway
        self.awayMessage = awayMessage
    }

    enum CodingKeys: String, CodingKey {
        case emoji
        case title
        case expiresAt = "expires_at"
        case isAway = "is_away"
        case awayMessage = "away_message"
    }
}

public struct UserUpdateRequestCustomProperty: Codable {
    public let id: Int
    public let value: String

    public init(id: Int, value: String) {
        self.id = id
        self.value = value
    }
}

public struct UserUpdateRequestUser: Codable {
    public let firstName: String?
    public let lastName: String?
    public let email: String?
    public let phoneNumber: String?
    public let nickname: String?
    public let department: String?
    public let title: String?
    public let role: UserRoleInput?
    public let suspended: Bool?
    public let listTags: [String]?
    public let customProperties: [UserUpdateRequestCustomProperty]?

    public init(firstName: String? = nil, lastName: String? = nil, email: String? = nil, phoneNumber: String? = nil, nickname: String? = nil, department: String? = nil, title: String? = nil, role: UserRoleInput? = nil, suspended: Bool? = nil, listTags: [String]? = nil, customProperties: [UserUpdateRequestCustomProperty]? = nil) {
        self.firstName = firstName
        self.lastName = lastName
        self.email = email
        self.phoneNumber = phoneNumber
        self.nickname = nickname
        self.department = department
        self.title = title
        self.role = role
        self.suspended = suspended
        self.listTags = listTags
        self.customProperties = customProperties
    }

    enum CodingKeys: String, CodingKey {
        case firstName = "first_name"
        case lastName = "last_name"
        case email
        case phoneNumber = "phone_number"
        case nickname
        case department
        case title
        case role
        case suspended
        case listTags = "list_tags"
        case customProperties = "custom_properties"
    }
}

public struct UserUpdateRequest: Codable {
    public let user: UserUpdateRequestUser

    public init(user: UserUpdateRequestUser) {
        self.user = user
    }
}

public struct ViewBlock: Codable {
    public let type: String
    public let text: String?
    public let name: String?
    public let label: String?
    public let initialDate: String?

    public init(type: String, text: String? = nil, name: String? = nil, label: String? = nil, initialDate: String? = nil) {
        self.type = type
        self.text = text
        self.name = name
        self.label = label
        self.initialDate = initialDate
    }

    enum CodingKeys: String, CodingKey {
        case type
        case text
        case name
        case label
        case initialDate = "initial_date"
    }
}

public struct ViewBlockCheckbox: Codable {
    public let type: String
    public let name: String
    public let label: String
    public let options: [ViewBlockCheckboxOption]?
    public let required: Bool?
    public let hint: String?

    public init(type: String, name: String, label: String, options: [ViewBlockCheckboxOption]? = nil, required: Bool? = nil, hint: String? = nil) {
        self.type = type
        self.name = name
        self.label = label
        self.options = options
        self.required = required
        self.hint = hint
    }
}

public struct ViewBlockCheckboxOption: Codable {
    public let text: String
    public let value: String
    public let description: String?
    public let checked: Bool?

    public init(text: String, value: String, description: String? = nil, checked: Bool? = nil) {
        self.text = text
        self.value = value
        self.description = description
        self.checked = checked
    }
}

public struct ViewBlockDate: Codable {
    public let type: String
    public let name: String
    public let label: String
    public let initialDate: String?
    public let required: Bool?
    public let hint: String?

    public init(type: String, name: String, label: String, initialDate: String? = nil, required: Bool? = nil, hint: String? = nil) {
        self.type = type
        self.name = name
        self.label = label
        self.initialDate = initialDate
        self.required = required
        self.hint = hint
    }

    enum CodingKeys: String, CodingKey {
        case type
        case name
        case label
        case initialDate = "initial_date"
        case required
        case hint
    }
}

public struct ViewBlockDivider: Codable {
    public let type: String

    public init(type: String) {
        self.type = type
    }
}

public struct ViewBlockFileInput: Codable {
    public let type: String
    public let name: String
    public let label: String
    public let filetypes: [String]?
    public let maxFiles: Int?
    public let required: Bool?
    public let hint: String?

    public init(type: String, name: String, label: String, filetypes: [String]? = nil, maxFiles: Int? = nil, required: Bool? = nil, hint: String? = nil) {
        self.type = type
        self.name = name
        self.label = label
        self.filetypes = filetypes
        self.maxFiles = maxFiles
        self.required = required
        self.hint = hint
    }

    enum CodingKeys: String, CodingKey {
        case type
        case name
        case label
        case filetypes
        case maxFiles = "max_files"
        case required
        case hint
    }
}

public struct ViewBlockHeader: Codable {
    public let type: String
    public let text: String

    public init(type: String, text: String) {
        self.type = type
        self.text = text
    }
}

public struct ViewBlockInput: Codable {
    public let type: String
    public let name: String
    public let label: String
    public let placeholder: String?
    public let multiline: Bool?
    public let initialValue: String?
    public let minLength: Int?
    public let maxLength: Int?
    public let required: Bool?
    public let hint: String?

    public init(type: String, name: String, label: String, placeholder: String? = nil, multiline: Bool? = nil, initialValue: String? = nil, minLength: Int? = nil, maxLength: Int? = nil, required: Bool? = nil, hint: String? = nil) {
        self.type = type
        self.name = name
        self.label = label
        self.placeholder = placeholder
        self.multiline = multiline
        self.initialValue = initialValue
        self.minLength = minLength
        self.maxLength = maxLength
        self.required = required
        self.hint = hint
    }

    enum CodingKeys: String, CodingKey {
        case type
        case name
        case label
        case placeholder
        case multiline
        case initialValue = "initial_value"
        case minLength = "min_length"
        case maxLength = "max_length"
        case required
        case hint
    }
}

public struct ViewBlockMarkdown: Codable {
    public let type: String
    public let text: String

    public init(type: String, text: String) {
        self.type = type
        self.text = text
    }
}

public struct ViewBlockPlainText: Codable {
    public let type: String
    public let text: String

    public init(type: String, text: String) {
        self.type = type
        self.text = text
    }
}

public struct ViewBlockRadio: Codable {
    public let type: String
    public let name: String
    public let label: String
    public let options: [ViewBlockSelectableOption]?
    public let required: Bool?
    public let hint: String?

    public init(type: String, name: String, label: String, options: [ViewBlockSelectableOption]? = nil, required: Bool? = nil, hint: String? = nil) {
        self.type = type
        self.name = name
        self.label = label
        self.options = options
        self.required = required
        self.hint = hint
    }
}

public struct ViewBlockSelect: Codable {
    public let type: String
    public let name: String
    public let label: String
    public let options: [ViewBlockSelectableOption]?
    public let required: Bool?
    public let hint: String?

    public init(type: String, name: String, label: String, options: [ViewBlockSelectableOption]? = nil, required: Bool? = nil, hint: String? = nil) {
        self.type = type
        self.name = name
        self.label = label
        self.options = options
        self.required = required
        self.hint = hint
    }
}

public struct ViewBlockSelectableOption: Codable {
    public let text: String
    public let value: String
    public let description: String?
    public let selected: Bool?

    public init(text: String, value: String, description: String? = nil, selected: Bool? = nil) {
        self.text = text
        self.value = value
        self.description = description
        self.selected = selected
    }
}

public struct ViewBlockTime: Codable {
    public let type: String
    public let name: String
    public let label: String
    public let initialTime: String?
    public let required: Bool?
    public let hint: String?

    public init(type: String, name: String, label: String, initialTime: String? = nil, required: Bool? = nil, hint: String? = nil) {
        self.type = type
        self.name = name
        self.label = label
        self.initialTime = initialTime
        self.required = required
        self.hint = hint
    }

    enum CodingKeys: String, CodingKey {
        case type
        case name
        case label
        case initialTime = "initial_time"
        case required
        case hint
    }
}

public struct ViewSubmitWebhookPayload: Codable {
    public let type: String
    public let event: String
    public let callbackId: String?
    public let privateMetadata: String?
    public let userId: Int
    public let data: [String: String]
    public let webhookTimestamp: Int

    public init(type: String, event: String, callbackId: String? = nil, privateMetadata: String? = nil, userId: Int, data: [String: String], webhookTimestamp: Int) {
        self.type = type
        self.event = event
        self.callbackId = callbackId
        self.privateMetadata = privateMetadata
        self.userId = userId
        self.data = data
        self.webhookTimestamp = webhookTimestamp
    }

    enum CodingKeys: String, CodingKey {
        case type
        case event
        case callbackId = "callback_id"
        case privateMetadata = "private_metadata"
        case userId = "user_id"
        case data
        case webhookTimestamp = "webhook_timestamp"
    }
}

public struct WebhookEvent: Codable {
    public let id: String
    public let eventType: String
    public let payload: WebhookPayloadUnion
    public let createdAt: String

    public init(id: String, eventType: String, payload: WebhookPayloadUnion, createdAt: String) {
        self.id = id
        self.eventType = eventType
        self.payload = payload
        self.createdAt = createdAt
    }

    enum CodingKeys: String, CodingKey {
        case id
        case eventType = "event_type"
        case payload
        case createdAt = "created_at"
    }
}

public struct WebhookLink: Codable {
    public let url: String
    public let domain: String

    public init(url: String, domain: String) {
        self.url = url
        self.domain = domain
    }
}

public struct WebhookMessageThread: Codable {
    public let messageId: Int
    public let messageChatId: Int

    public init(messageId: Int, messageChatId: Int) {
        self.messageId = messageId
        self.messageChatId = messageChatId
    }

    enum CodingKeys: String, CodingKey {
        case messageId = "message_id"
        case messageChatId = "message_chat_id"
    }
}

public struct UpdateProfileAvatarRequest: Codable {
    public var image: Data

    public init(image: Data) {
        self.image = image
    }
}

public struct UpdateUserAvatarRequest: Codable {
    public var image: Data

    public init(image: Data) {
        self.image = image
    }
}

public enum AuditEventDetailsUnion: Codable {
    case auditDetailsEmpty(AuditDetailsEmpty)
    case auditDetailsUserUpdated(AuditDetailsUserUpdated)
    case auditDetailsRoleChanged(AuditDetailsRoleChanged)
    case auditDetailsTagName(AuditDetailsTagName)
    case auditDetailsInitiator(AuditDetailsInitiator)
    case auditDetailsInviter(AuditDetailsInviter)
    case auditDetailsChatRenamed(AuditDetailsChatRenamed)
    case auditDetailsChatPermission(AuditDetailsChatPermission)
    case auditDetailsTagChat(AuditDetailsTagChat)
    case auditDetailsChatId(AuditDetailsChatId)
    case auditDetailsTokenScopes(AuditDetailsTokenScopes)
    case auditDetailsKms(AuditDetailsKms)
    case auditDetailsDlp(AuditDetailsDlp)
    case auditDetailsSearch(AuditDetailsSearch)

    private enum CodingKeys: String, CodingKey {
        case type
    }

    public init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        let type = try container.decode(String.self, forKey: .type)
        switch type {
        case "auditDetailsEmpty":
            self = .auditDetailsEmpty(try AuditDetailsEmpty(from: decoder))
        case "auditDetailsUserUpdated":
            self = .auditDetailsUserUpdated(try AuditDetailsUserUpdated(from: decoder))
        case "auditDetailsRoleChanged":
            self = .auditDetailsRoleChanged(try AuditDetailsRoleChanged(from: decoder))
        case "auditDetailsTagName":
            self = .auditDetailsTagName(try AuditDetailsTagName(from: decoder))
        case "auditDetailsInitiator":
            self = .auditDetailsInitiator(try AuditDetailsInitiator(from: decoder))
        case "auditDetailsInviter":
            self = .auditDetailsInviter(try AuditDetailsInviter(from: decoder))
        case "auditDetailsChatRenamed":
            self = .auditDetailsChatRenamed(try AuditDetailsChatRenamed(from: decoder))
        case "auditDetailsChatPermission":
            self = .auditDetailsChatPermission(try AuditDetailsChatPermission(from: decoder))
        case "auditDetailsTagChat":
            self = .auditDetailsTagChat(try AuditDetailsTagChat(from: decoder))
        case "auditDetailsChatId":
            self = .auditDetailsChatId(try AuditDetailsChatId(from: decoder))
        case "auditDetailsTokenScopes":
            self = .auditDetailsTokenScopes(try AuditDetailsTokenScopes(from: decoder))
        case "auditDetailsKms":
            self = .auditDetailsKms(try AuditDetailsKms(from: decoder))
        case "auditDetailsDlp":
            self = .auditDetailsDlp(try AuditDetailsDlp(from: decoder))
        case "auditDetailsSearch":
            self = .auditDetailsSearch(try AuditDetailsSearch(from: decoder))
        default:
            throw DecodingError.dataCorrupted(
                DecodingError.Context(codingPath: decoder.codingPath, debugDescription: "Unknown type: \(type)")
            )
        }
    }

    public func encode(to encoder: Encoder) throws {
        switch self {
        case .auditDetailsEmpty(let value):
            try value.encode(to: encoder)
        case .auditDetailsUserUpdated(let value):
            try value.encode(to: encoder)
        case .auditDetailsRoleChanged(let value):
            try value.encode(to: encoder)
        case .auditDetailsTagName(let value):
            try value.encode(to: encoder)
        case .auditDetailsInitiator(let value):
            try value.encode(to: encoder)
        case .auditDetailsInviter(let value):
            try value.encode(to: encoder)
        case .auditDetailsChatRenamed(let value):
            try value.encode(to: encoder)
        case .auditDetailsChatPermission(let value):
            try value.encode(to: encoder)
        case .auditDetailsTagChat(let value):
            try value.encode(to: encoder)
        case .auditDetailsChatId(let value):
            try value.encode(to: encoder)
        case .auditDetailsTokenScopes(let value):
            try value.encode(to: encoder)
        case .auditDetailsKms(let value):
            try value.encode(to: encoder)
        case .auditDetailsDlp(let value):
            try value.encode(to: encoder)
        case .auditDetailsSearch(let value):
            try value.encode(to: encoder)
        }
    }
}

public enum ViewBlockUnion: Codable {
    case viewBlockHeader(ViewBlockHeader)
    case viewBlockPlainText(ViewBlockPlainText)
    case viewBlockMarkdown(ViewBlockMarkdown)
    case viewBlockDivider(ViewBlockDivider)
    case viewBlockInput(ViewBlockInput)
    case viewBlockSelect(ViewBlockSelect)
    case viewBlockRadio(ViewBlockRadio)
    case viewBlockCheckbox(ViewBlockCheckbox)
    case viewBlockDate(ViewBlockDate)
    case viewBlockTime(ViewBlockTime)
    case viewBlockFileInput(ViewBlockFileInput)

    private enum CodingKeys: String, CodingKey {
        case type
    }

    public init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        let type = try container.decode(String.self, forKey: .type)
        switch type {
        case "header":
            self = .viewBlockHeader(try ViewBlockHeader(from: decoder))
        case "plain_text":
            self = .viewBlockPlainText(try ViewBlockPlainText(from: decoder))
        case "markdown":
            self = .viewBlockMarkdown(try ViewBlockMarkdown(from: decoder))
        case "divider":
            self = .viewBlockDivider(try ViewBlockDivider(from: decoder))
        case "input":
            self = .viewBlockInput(try ViewBlockInput(from: decoder))
        case "select":
            self = .viewBlockSelect(try ViewBlockSelect(from: decoder))
        case "radio":
            self = .viewBlockRadio(try ViewBlockRadio(from: decoder))
        case "checkbox":
            self = .viewBlockCheckbox(try ViewBlockCheckbox(from: decoder))
        case "date":
            self = .viewBlockDate(try ViewBlockDate(from: decoder))
        case "time":
            self = .viewBlockTime(try ViewBlockTime(from: decoder))
        case "file_input":
            self = .viewBlockFileInput(try ViewBlockFileInput(from: decoder))
        default:
            throw DecodingError.dataCorrupted(
                DecodingError.Context(codingPath: decoder.codingPath, debugDescription: "Unknown type: \(type)")
            )
        }
    }

    public func encode(to encoder: Encoder) throws {
        switch self {
        case .viewBlockHeader(let value):
            try value.encode(to: encoder)
        case .viewBlockPlainText(let value):
            try value.encode(to: encoder)
        case .viewBlockMarkdown(let value):
            try value.encode(to: encoder)
        case .viewBlockDivider(let value):
            try value.encode(to: encoder)
        case .viewBlockInput(let value):
            try value.encode(to: encoder)
        case .viewBlockSelect(let value):
            try value.encode(to: encoder)
        case .viewBlockRadio(let value):
            try value.encode(to: encoder)
        case .viewBlockCheckbox(let value):
            try value.encode(to: encoder)
        case .viewBlockDate(let value):
            try value.encode(to: encoder)
        case .viewBlockTime(let value):
            try value.encode(to: encoder)
        case .viewBlockFileInput(let value):
            try value.encode(to: encoder)
        }
    }
}

public enum WebhookPayloadUnion: Codable {
    case messageWebhookPayload(MessageWebhookPayload)
    case reactionWebhookPayload(ReactionWebhookPayload)
    case buttonWebhookPayload(ButtonWebhookPayload)
    case viewSubmitWebhookPayload(ViewSubmitWebhookPayload)
    case chatMemberWebhookPayload(ChatMemberWebhookPayload)
    case companyMemberWebhookPayload(CompanyMemberWebhookPayload)
    case linkSharedWebhookPayload(LinkSharedWebhookPayload)

    private enum CodingKeys: String, CodingKey {
        case type
    }

    public init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        let type = try container.decode(String.self, forKey: .type)
        switch type {
        case "message":
            self = .messageWebhookPayload(try MessageWebhookPayload(from: decoder))
        case "reaction":
            self = .reactionWebhookPayload(try ReactionWebhookPayload(from: decoder))
        case "button":
            self = .buttonWebhookPayload(try ButtonWebhookPayload(from: decoder))
        case "view":
            self = .viewSubmitWebhookPayload(try ViewSubmitWebhookPayload(from: decoder))
        case "chat_member":
            self = .chatMemberWebhookPayload(try ChatMemberWebhookPayload(from: decoder))
        case "company_member":
            self = .companyMemberWebhookPayload(try CompanyMemberWebhookPayload(from: decoder))
        default:
            throw DecodingError.dataCorrupted(
                DecodingError.Context(codingPath: decoder.codingPath, debugDescription: "Unknown type: \(type)")
            )
        }
    }

    public func encode(to encoder: Encoder) throws {
        switch self {
        case .messageWebhookPayload(let value):
            try value.encode(to: encoder)
        case .reactionWebhookPayload(let value):
            try value.encode(to: encoder)
        case .buttonWebhookPayload(let value):
            try value.encode(to: encoder)
        case .viewSubmitWebhookPayload(let value):
            try value.encode(to: encoder)
        case .chatMemberWebhookPayload(let value):
            try value.encode(to: encoder)
        case .companyMemberWebhookPayload(let value):
            try value.encode(to: encoder)
        case .linkSharedWebhookPayload(let value):
            try value.encode(to: encoder)
        }
    }
}

public struct GetAuditEventsResponse: Codable {
    public let data: [AuditEvent]
    public let meta: PaginationMeta
}

public struct ListChatsResponse: Codable {
    public let data: [Chat]
    public let meta: PaginationMeta
}

public struct ListMembersResponse: Codable {
    public let data: [User]
    public let meta: PaginationMeta
}

public struct ListPropertiesResponse: Codable {
    public let data: [CustomPropertyDefinition]
}

public struct ListTagsResponse: Codable {
    public let data: [GroupTag]
    public let meta: PaginationMeta
}

public struct GetTagUsersResponse: Codable {
    public let data: [User]
    public let meta: PaginationMeta
}

public struct ListChatMessagesResponse: Codable {
    public let data: [Message]
    public let meta: PaginationMeta
}

public struct ListReactionsResponse: Codable {
    public let data: [Reaction]
    public let meta: PaginationMeta
}

public struct SearchChatsResponse: Codable {
    public let data: [Chat]
    public let meta: SearchPaginationMeta
}

public struct SearchMessagesResponse: Codable {
    public let data: [Message]
    public let meta: SearchPaginationMeta
}

public struct SearchUsersResponse: Codable {
    public let data: [User]
    public let meta: SearchPaginationMeta
}

public struct ListTasksResponse: Codable {
    public let data: [Task]
    public let meta: PaginationMeta
}

public struct ListUsersResponse: Codable {
    public let data: [User]
    public let meta: PaginationMeta
}

public struct GetWebhookEventsResponse: Codable {
    public let data: [WebhookEvent]
    public let meta: PaginationMeta
}

struct BotResponseDataWrapper: Codable {
    let data: BotResponse
}

struct ChatDataWrapper: Codable {
    let data: Chat
}

struct GroupTagDataWrapper: Codable {
    let data: GroupTag
}

struct MessageDataWrapper: Codable {
    let data: Message
}

struct ThreadDataWrapper: Codable {
    let data: Thread
}

struct AccessTokenInfoDataWrapper: Codable {
    let data: AccessTokenInfo
}

struct UserDataWrapper: Codable {
    let data: User
}

struct AvatarDataDataWrapper: Codable {
    let data: AvatarData
}

struct UserStatusDataWrapper: Codable {
    let data: UserStatus
}

struct TaskDataWrapper: Codable {
    let data: Task
}
