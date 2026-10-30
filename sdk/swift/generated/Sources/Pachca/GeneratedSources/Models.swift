import Foundation
#if canImport(FoundationNetworking)
import FoundationNetworking
#endif

public enum AuditEventKey: Codable, Hashable, RawRepresentable, CaseIterable, ExpressibleByStringLiteral, Sendable {
    /// Пользователь успешно вошел в систему
    case userLogin
    /// Пользователь вышел из системы
    case userLogout
    /// Неудачная попытка двухфакторной аутентификации
    case user2faFail
    /// Успешная двухфакторная аутентификация
    case user2faSuccess
    /// Двухфакторная аутентификация отключена у сотрудника
    case user2faDisabled
    /// Создан QR-код для входа в мобильное приложение
    case loginGrantCreated
    /// Сотрудник подтвердил вход по QR-коду
    case loginGrantApproved
    /// Вход по QR-коду отклонён
    case loginGrantDenied
    /// Создана новая учетная запись пользователя
    case userCreated
    /// Учетная запись пользователя удалена
    case userDeleted
    /// Роль пользователя была изменена
    case userRoleChanged
    /// Данные пользователя обновлены
    case userUpdated
    /// Создан новый тег
    case tagCreated
    /// Тег удален
    case tagDeleted
    /// Пользователь добавлен в тег
    case userAddedToTag
    /// Пользователь удален из тега
    case userRemovedFromTag
    /// Создан новый чат
    case chatCreated
    /// Чат переименован
    case chatRenamed
    /// Изменены права доступа к чату
    case chatPermissionChanged
    /// Пользователь присоединился к чату
    case userChatJoin
    /// Пользователь покинул чат
    case userChatLeave
    /// Тег добавлен в чат
    case tagAddedToChat
    /// Тег удален из чата
    case tagRemovedFromChat
    /// Сообщение отредактировано
    case messageUpdated
    /// Сообщение удалено
    case messageDeleted
    /// Сообщение создано
    case messageCreated
    /// Реакция добавлена
    case reactionCreated
    /// Реакция удалена
    case reactionDeleted
    /// Тред создан
    case threadCreated
    /// Создан новый токен доступа
    case accessTokenCreated
    /// Токен доступа обновлен
    case accessTokenUpdated
    /// Токен доступа удален
    case accessTokenDestroy
    /// Данные зашифрованы
    case kmsEncrypt
    /// Данные расшифрованы
    case kmsDecrypt
    /// Доступ к журналам аудита получен
    case auditEventsAccessed
    /// Получен список всех чатов пространства
    case companyChatsAccessed
    /// Получен список всех ботов пространства
    case companyBotsAccessed
    /// Срабатывание правила DLP-системы
    case dlpViolationDetected
    /// Поиск сотрудников через API
    case searchUsersApi
    /// Поиск чатов через API
    case searchChatsApi
    /// Поиск сообщений через API
    case searchMessagesApi
    /// Изменены скоупы токена бота
    case botScopesUpdated
    /// Изменены настройки исходящего вебхука бота
    case botWebhookSettingsUpdated
    /// Токен бота перевыпущен (ротация)
    case botTokenRecreated
    /// Бот удалён
    case botDeleted
    /// Изменены параметры OAuth-клиента бота
    case botOauthClientUpdated
    /// У бота выключена авторизация от имени сотрудника
    case botOauthClientDisabled
    /// Обновлён секрет OAuth-клиента бота
    case botOauthClientSecretRotated
    /// Выпущен секрет OAuth-клиента бота
    case botOauthClientSecretIssued
    /// Выпущен токен бота
    case botTokenCreated
    /// Изменены имя или скоупы токена бота
    case botTokenUpdated
    /// Отдельный токен бота перевыпущен
    case botTokenReissued
    /// Токен бота удалён
    case botTokenDeleted
    /// Пользователь выдал OAuth-клиенту доступ к своим данным
    case oauthAuthorizationGranted
    /// Доступ OAuth-клиента к данным пользователя отозван
    case oauthAuthorizationRevoked
    /// OAuth-клиент отозвал выданный ему токен
    case oauthTokenRevoked
    /// Сотрудник подтвердил вход приложения с устройства
    case oauthDeviceAuthorizationApproved
    /// Сотрудник отклонил вход приложения с устройства
    case oauthDeviceAuthorizationDenied
    /// Видеозвонок начат
    case videoCallStarted
    /// Видеозвонок завершён
    case videoCallFinished
    /// Запись видеозвонка готова
    case videoCallRecordingReady
    /// Отключена интеграция с Exchange
    case exchangeDisabled
    /// A value this SDK version does not list yet
    case unknown(String)

    /// Every value this SDK version lists
    public static let allCases: [AuditEventKey] = [.userLogin, .userLogout, .user2faFail, .user2faSuccess, .user2faDisabled, .loginGrantCreated, .loginGrantApproved, .loginGrantDenied, .userCreated, .userDeleted, .userRoleChanged, .userUpdated, .tagCreated, .tagDeleted, .userAddedToTag, .userRemovedFromTag, .chatCreated, .chatRenamed, .chatPermissionChanged, .userChatJoin, .userChatLeave, .tagAddedToChat, .tagRemovedFromChat, .messageUpdated, .messageDeleted, .messageCreated, .reactionCreated, .reactionDeleted, .threadCreated, .accessTokenCreated, .accessTokenUpdated, .accessTokenDestroy, .kmsEncrypt, .kmsDecrypt, .auditEventsAccessed, .companyChatsAccessed, .companyBotsAccessed, .dlpViolationDetected, .searchUsersApi, .searchChatsApi, .searchMessagesApi, .botScopesUpdated, .botWebhookSettingsUpdated, .botTokenRecreated, .botDeleted, .botOauthClientUpdated, .botOauthClientDisabled, .botOauthClientSecretRotated, .botOauthClientSecretIssued, .botTokenCreated, .botTokenUpdated, .botTokenReissued, .botTokenDeleted, .oauthAuthorizationGranted, .oauthAuthorizationRevoked, .oauthTokenRevoked, .oauthDeviceAuthorizationApproved, .oauthDeviceAuthorizationDenied, .videoCallStarted, .videoCallFinished, .videoCallRecordingReady, .exchangeDisabled]

    public init(_ rawValue: String) {
        switch rawValue {
        case "user_login": self = .userLogin
        case "user_logout": self = .userLogout
        case "user_2fa_fail": self = .user2faFail
        case "user_2fa_success": self = .user2faSuccess
        case "user_2fa_disabled": self = .user2faDisabled
        case "login_grant_created": self = .loginGrantCreated
        case "login_grant_approved": self = .loginGrantApproved
        case "login_grant_denied": self = .loginGrantDenied
        case "user_created": self = .userCreated
        case "user_deleted": self = .userDeleted
        case "user_role_changed": self = .userRoleChanged
        case "user_updated": self = .userUpdated
        case "tag_created": self = .tagCreated
        case "tag_deleted": self = .tagDeleted
        case "user_added_to_tag": self = .userAddedToTag
        case "user_removed_from_tag": self = .userRemovedFromTag
        case "chat_created": self = .chatCreated
        case "chat_renamed": self = .chatRenamed
        case "chat_permission_changed": self = .chatPermissionChanged
        case "user_chat_join": self = .userChatJoin
        case "user_chat_leave": self = .userChatLeave
        case "tag_added_to_chat": self = .tagAddedToChat
        case "tag_removed_from_chat": self = .tagRemovedFromChat
        case "message_updated": self = .messageUpdated
        case "message_deleted": self = .messageDeleted
        case "message_created": self = .messageCreated
        case "reaction_created": self = .reactionCreated
        case "reaction_deleted": self = .reactionDeleted
        case "thread_created": self = .threadCreated
        case "access_token_created": self = .accessTokenCreated
        case "access_token_updated": self = .accessTokenUpdated
        case "access_token_destroy": self = .accessTokenDestroy
        case "kms_encrypt": self = .kmsEncrypt
        case "kms_decrypt": self = .kmsDecrypt
        case "audit_events_accessed": self = .auditEventsAccessed
        case "company_chats_accessed": self = .companyChatsAccessed
        case "company_bots_accessed": self = .companyBotsAccessed
        case "dlp_violation_detected": self = .dlpViolationDetected
        case "search_users_api": self = .searchUsersApi
        case "search_chats_api": self = .searchChatsApi
        case "search_messages_api": self = .searchMessagesApi
        case "bot_scopes_updated": self = .botScopesUpdated
        case "bot_webhook_settings_updated": self = .botWebhookSettingsUpdated
        case "bot_token_recreated": self = .botTokenRecreated
        case "bot_deleted": self = .botDeleted
        case "bot_oauth_client_updated": self = .botOauthClientUpdated
        case "bot_oauth_client_disabled": self = .botOauthClientDisabled
        case "bot_oauth_client_secret_rotated": self = .botOauthClientSecretRotated
        case "bot_oauth_client_secret_issued": self = .botOauthClientSecretIssued
        case "bot_token_created": self = .botTokenCreated
        case "bot_token_updated": self = .botTokenUpdated
        case "bot_token_reissued": self = .botTokenReissued
        case "bot_token_deleted": self = .botTokenDeleted
        case "oauth_authorization_granted": self = .oauthAuthorizationGranted
        case "oauth_authorization_revoked": self = .oauthAuthorizationRevoked
        case "oauth_token_revoked": self = .oauthTokenRevoked
        case "oauth_device_authorization_approved": self = .oauthDeviceAuthorizationApproved
        case "oauth_device_authorization_denied": self = .oauthDeviceAuthorizationDenied
        case "video_call_started": self = .videoCallStarted
        case "video_call_finished": self = .videoCallFinished
        case "video_call_recording_ready": self = .videoCallRecordingReady
        case "exchange_disabled": self = .exchangeDisabled
        default: self = .unknown(rawValue)
        }
    }

    public init?(rawValue: String) { self.init(rawValue) }

    public init(stringLiteral value: String) { self.init(value) }

    public var rawValue: String {
        switch self {
        case .userLogin: return "user_login"
        case .userLogout: return "user_logout"
        case .user2faFail: return "user_2fa_fail"
        case .user2faSuccess: return "user_2fa_success"
        case .user2faDisabled: return "user_2fa_disabled"
        case .loginGrantCreated: return "login_grant_created"
        case .loginGrantApproved: return "login_grant_approved"
        case .loginGrantDenied: return "login_grant_denied"
        case .userCreated: return "user_created"
        case .userDeleted: return "user_deleted"
        case .userRoleChanged: return "user_role_changed"
        case .userUpdated: return "user_updated"
        case .tagCreated: return "tag_created"
        case .tagDeleted: return "tag_deleted"
        case .userAddedToTag: return "user_added_to_tag"
        case .userRemovedFromTag: return "user_removed_from_tag"
        case .chatCreated: return "chat_created"
        case .chatRenamed: return "chat_renamed"
        case .chatPermissionChanged: return "chat_permission_changed"
        case .userChatJoin: return "user_chat_join"
        case .userChatLeave: return "user_chat_leave"
        case .tagAddedToChat: return "tag_added_to_chat"
        case .tagRemovedFromChat: return "tag_removed_from_chat"
        case .messageUpdated: return "message_updated"
        case .messageDeleted: return "message_deleted"
        case .messageCreated: return "message_created"
        case .reactionCreated: return "reaction_created"
        case .reactionDeleted: return "reaction_deleted"
        case .threadCreated: return "thread_created"
        case .accessTokenCreated: return "access_token_created"
        case .accessTokenUpdated: return "access_token_updated"
        case .accessTokenDestroy: return "access_token_destroy"
        case .kmsEncrypt: return "kms_encrypt"
        case .kmsDecrypt: return "kms_decrypt"
        case .auditEventsAccessed: return "audit_events_accessed"
        case .companyChatsAccessed: return "company_chats_accessed"
        case .companyBotsAccessed: return "company_bots_accessed"
        case .dlpViolationDetected: return "dlp_violation_detected"
        case .searchUsersApi: return "search_users_api"
        case .searchChatsApi: return "search_chats_api"
        case .searchMessagesApi: return "search_messages_api"
        case .botScopesUpdated: return "bot_scopes_updated"
        case .botWebhookSettingsUpdated: return "bot_webhook_settings_updated"
        case .botTokenRecreated: return "bot_token_recreated"
        case .botDeleted: return "bot_deleted"
        case .botOauthClientUpdated: return "bot_oauth_client_updated"
        case .botOauthClientDisabled: return "bot_oauth_client_disabled"
        case .botOauthClientSecretRotated: return "bot_oauth_client_secret_rotated"
        case .botOauthClientSecretIssued: return "bot_oauth_client_secret_issued"
        case .botTokenCreated: return "bot_token_created"
        case .botTokenUpdated: return "bot_token_updated"
        case .botTokenReissued: return "bot_token_reissued"
        case .botTokenDeleted: return "bot_token_deleted"
        case .oauthAuthorizationGranted: return "oauth_authorization_granted"
        case .oauthAuthorizationRevoked: return "oauth_authorization_revoked"
        case .oauthTokenRevoked: return "oauth_token_revoked"
        case .oauthDeviceAuthorizationApproved: return "oauth_device_authorization_approved"
        case .oauthDeviceAuthorizationDenied: return "oauth_device_authorization_denied"
        case .videoCallStarted: return "video_call_started"
        case .videoCallFinished: return "video_call_finished"
        case .videoCallRecordingReady: return "video_call_recording_ready"
        case .exchangeDisabled: return "exchange_disabled"
        case .unknown(let value): return value
        }
    }

    public init(from decoder: Decoder) throws {
        self.init(try decoder.singleValueContainer().decode(String.self))
    }

    public func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        try container.encode(rawValue)
    }
}

public enum AuditLoginGrantDenyReason: Codable, Hashable, RawRepresentable, CaseIterable, ExpressibleByStringLiteral, Sendable {
    /// Сотрудник отклонил вход
    case denied
    /// Сотрудник ввёл не те цифры, что показало устройство
    case verificationFailed
    /// A value this SDK version does not list yet
    case unknown(String)

    /// Every value this SDK version lists
    public static let allCases: [AuditLoginGrantDenyReason] = [.denied, .verificationFailed]

    public init(_ rawValue: String) {
        switch rawValue {
        case "denied": self = .denied
        case "verification_failed": self = .verificationFailed
        default: self = .unknown(rawValue)
        }
    }

    public init?(rawValue: String) { self.init(rawValue) }

    public init(stringLiteral value: String) { self.init(value) }

    public var rawValue: String {
        switch self {
        case .denied: return "denied"
        case .verificationFailed: return "verification_failed"
        case .unknown(let value): return value
        }
    }

    public init(from decoder: Decoder) throws {
        self.init(try decoder.singleValueContainer().decode(String.self))
    }

    public func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        try container.encode(rawValue)
    }
}

public enum AuditLoginGrantDevicePlatform: Codable, Hashable, RawRepresentable, CaseIterable, ExpressibleByStringLiteral, Sendable {
    /// Приложение для iOS
    case iOS
    /// Приложение для Android
    case Android
    /// Приложение для Android из RuStore
    case Rustore
    /// Приложение для Android из AppGallery
    case Appgallery
    /// A value this SDK version does not list yet
    case unknown(String)

    /// Every value this SDK version lists
    public static let allCases: [AuditLoginGrantDevicePlatform] = [.iOS, .Android, .Rustore, .Appgallery]

    public init(_ rawValue: String) {
        switch rawValue {
        case "iOS": self = .iOS
        case "Android": self = .Android
        case "Rustore": self = .Rustore
        case "Appgallery": self = .Appgallery
        default: self = .unknown(rawValue)
        }
    }

    public init?(rawValue: String) { self.init(rawValue) }

    public init(stringLiteral value: String) { self.init(value) }

    public var rawValue: String {
        switch self {
        case .iOS: return "iOS"
        case .Android: return "Android"
        case .Rustore: return "Rustore"
        case .Appgallery: return "Appgallery"
        case .unknown(let value): return value
        }
    }

    public init(from decoder: Decoder) throws {
        self.init(try decoder.singleValueContainer().decode(String.self))
    }

    public func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        try container.encode(rawValue)
    }
}

public enum BotCanEdit: Codable, Hashable, RawRepresentable, CaseIterable, ExpressibleByStringLiteral, Sendable {
    /// Администраторы компании
    case admin
    /// Владельцы чатов, в которые добавлен бот
    case chatOwners
    /// A value this SDK version does not list yet
    case unknown(String)

    /// Every value this SDK version lists
    public static let allCases: [BotCanEdit] = [.admin, .chatOwners]

    public init(_ rawValue: String) {
        switch rawValue {
        case "admin": self = .admin
        case "chat_owners": self = .chatOwners
        default: self = .unknown(rawValue)
        }
    }

    public init?(rawValue: String) { self.init(rawValue) }

    public init(stringLiteral value: String) { self.init(value) }

    public var rawValue: String {
        switch self {
        case .admin: return "admin"
        case .chatOwners: return "chat_owners"
        case .unknown(let value): return value
        }
    }

    public init(from decoder: Decoder) throws {
        self.init(try decoder.singleValueContainer().decode(String.self))
    }

    public func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        try container.encode(rawValue)
    }
}

public enum BotEventName: Codable, Hashable, RawRepresentable, CaseIterable, ExpressibleByStringLiteral, Sendable {
    /// Новое сообщение
    case messageNew
    /// Сообщение отредактировано
    case messageUpdate
    /// Сообщение удалено
    case messageDelete
    /// Добавлена реакция
    case reactionNew
    /// Реакция удалена
    case reactionDelete
    /// Нажата кнопка
    case buttonClick
    /// В сообщении отправлена ссылка (для unfurl)
    case messageLinkShared
    /// Участник добавлен в чат
    case chatMemberAdd
    /// Участник удалён из чата
    case chatMemberRemove
    /// Сотрудник приглашён в компанию
    case companyMemberInvite
    /// Сотрудник подтвердил приглашение
    case companyMemberConfirm
    /// Сотрудник деактивирован
    case companyMemberSuspend
    /// Сотрудник активирован
    case companyMemberActivate
    /// Сотрудник удалён из компании
    case companyMemberDelete
    /// Данные сотрудника изменены
    case companyMemberUpdate
    /// Видеозвонок начался
    case videoCallStarted
    /// Видеозвонок завершился
    case videoCallFinished
    /// Запись видеозвонка готова
    case videoCallRecordingReady
    /// A value this SDK version does not list yet
    case unknown(String)

    /// Every value this SDK version lists
    public static let allCases: [BotEventName] = [.messageNew, .messageUpdate, .messageDelete, .reactionNew, .reactionDelete, .buttonClick, .messageLinkShared, .chatMemberAdd, .chatMemberRemove, .companyMemberInvite, .companyMemberConfirm, .companyMemberSuspend, .companyMemberActivate, .companyMemberDelete, .companyMemberUpdate, .videoCallStarted, .videoCallFinished, .videoCallRecordingReady]

    public init(_ rawValue: String) {
        switch rawValue {
        case "message_new": self = .messageNew
        case "message_update": self = .messageUpdate
        case "message_delete": self = .messageDelete
        case "reaction_new": self = .reactionNew
        case "reaction_delete": self = .reactionDelete
        case "button_click": self = .buttonClick
        case "message_link_shared": self = .messageLinkShared
        case "chat_member_add": self = .chatMemberAdd
        case "chat_member_remove": self = .chatMemberRemove
        case "company_member_invite": self = .companyMemberInvite
        case "company_member_confirm": self = .companyMemberConfirm
        case "company_member_suspend": self = .companyMemberSuspend
        case "company_member_activate": self = .companyMemberActivate
        case "company_member_delete": self = .companyMemberDelete
        case "company_member_update": self = .companyMemberUpdate
        case "video_call_started": self = .videoCallStarted
        case "video_call_finished": self = .videoCallFinished
        case "video_call_recording_ready": self = .videoCallRecordingReady
        default: self = .unknown(rawValue)
        }
    }

    public init?(rawValue: String) { self.init(rawValue) }

    public init(stringLiteral value: String) { self.init(value) }

    public var rawValue: String {
        switch self {
        case .messageNew: return "message_new"
        case .messageUpdate: return "message_update"
        case .messageDelete: return "message_delete"
        case .reactionNew: return "reaction_new"
        case .reactionDelete: return "reaction_delete"
        case .buttonClick: return "button_click"
        case .messageLinkShared: return "message_link_shared"
        case .chatMemberAdd: return "chat_member_add"
        case .chatMemberRemove: return "chat_member_remove"
        case .companyMemberInvite: return "company_member_invite"
        case .companyMemberConfirm: return "company_member_confirm"
        case .companyMemberSuspend: return "company_member_suspend"
        case .companyMemberActivate: return "company_member_activate"
        case .companyMemberDelete: return "company_member_delete"
        case .companyMemberUpdate: return "company_member_update"
        case .videoCallStarted: return "video_call_started"
        case .videoCallFinished: return "video_call_finished"
        case .videoCallRecordingReady: return "video_call_recording_ready"
        case .unknown(let value): return value
        }
    }

    public init(from decoder: Decoder) throws {
        self.init(try decoder.singleValueContainer().decode(String.self))
    }

    public func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        try container.encode(rawValue)
    }
}

public enum BotTemplateEngine: Codable, Hashable, RawRepresentable, CaseIterable, ExpressibleByStringLiteral, Sendable {
    /// Liquid — условия, циклы и фильтры
    case liquid
    /// Mustache — простая подстановка без логики
    case mustache
    /// A value this SDK version does not list yet
    case unknown(String)

    /// Every value this SDK version lists
    public static let allCases: [BotTemplateEngine] = [.liquid, .mustache]

    public init(_ rawValue: String) {
        switch rawValue {
        case "liquid": self = .liquid
        case "mustache": self = .mustache
        default: self = .unknown(rawValue)
        }
    }

    public init?(rawValue: String) { self.init(rawValue) }

    public init(stringLiteral value: String) { self.init(value) }

    public var rawValue: String {
        switch self {
        case .liquid: return "liquid"
        case .mustache: return "mustache"
        case .unknown(let value): return value
        }
    }

    public init(from decoder: Decoder) throws {
        self.init(try decoder.singleValueContainer().decode(String.self))
    }

    public func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        try container.encode(rawValue)
    }
}

public enum BotTriggerOn: Codable, Hashable, RawRepresentable, CaseIterable, ExpressibleByStringLiteral, Sendable {
    /// Только на команды (триггер-слова) из commands
    case commands
    /// На все сообщения в чатах, где есть бот
    case allMessages
    /// На развёртывание ссылок (link previews)
    case unfurl
    /// A value this SDK version does not list yet
    case unknown(String)

    /// Every value this SDK version lists
    public static let allCases: [BotTriggerOn] = [.commands, .allMessages, .unfurl]

    public init(_ rawValue: String) {
        switch rawValue {
        case "commands": self = .commands
        case "all_messages": self = .allMessages
        case "unfurl": self = .unfurl
        default: self = .unknown(rawValue)
        }
    }

    public init?(rawValue: String) { self.init(rawValue) }

    public init(stringLiteral value: String) { self.init(value) }

    public var rawValue: String {
        switch self {
        case .commands: return "commands"
        case .allMessages: return "all_messages"
        case .unfurl: return "unfurl"
        case .unknown(let value): return value
        }
    }

    public init(from decoder: Decoder) throws {
        self.init(try decoder.singleValueContainer().decode(String.self))
    }

    public func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        try container.encode(rawValue)
    }
}

public enum BotWebhookKind: Codable, Hashable, RawRepresentable, CaseIterable, ExpressibleByStringLiteral, Sendable {
    /// Свой формат: сообщение собирается из тела запроса по шаблону бота
    case simple
    /// GitLab: Пачка сама разбирает запрос и собирает сообщение
    case gitlab
    /// Grafana: Пачка сама разбирает запрос и собирает сообщение
    case grafana
    /// A value this SDK version does not list yet
    case unknown(String)

    /// Every value this SDK version lists
    public static let allCases: [BotWebhookKind] = [.simple, .gitlab, .grafana]

    public init(_ rawValue: String) {
        switch rawValue {
        case "simple": self = .simple
        case "gitlab": self = .gitlab
        case "grafana": self = .grafana
        default: self = .unknown(rawValue)
        }
    }

    public init?(rawValue: String) { self.init(rawValue) }

    public init(stringLiteral value: String) { self.init(value) }

    public var rawValue: String {
        switch self {
        case .simple: return "simple"
        case .gitlab: return "gitlab"
        case .grafana: return "grafana"
        case .unknown(let value): return value
        }
    }

    public init(from decoder: Decoder) throws {
        self.init(try decoder.singleValueContainer().decode(String.self))
    }

    public func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        try container.encode(rawValue)
    }
}

public enum BotWhoCanAdd: Codable, Hashable, RawRepresentable, CaseIterable, ExpressibleByStringLiteral, Sendable {
    /// Только создатель бота
    case creator
    /// Создатель и администраторы компании
    case creatorAdmin
    /// Создатель, администраторы и участники компании
    case creatorAdminUser
    /// Публичный бот: добавить его может любой сотрудник, кроме гостей и мульти-гостей
    case anyone
    /// A value this SDK version does not list yet
    case unknown(String)

    /// Every value this SDK version lists
    public static let allCases: [BotWhoCanAdd] = [.creator, .creatorAdmin, .creatorAdminUser, .anyone]

    public init(_ rawValue: String) {
        switch rawValue {
        case "creator": self = .creator
        case "creator_admin": self = .creatorAdmin
        case "creator_admin_user": self = .creatorAdminUser
        case "anyone": self = .anyone
        default: self = .unknown(rawValue)
        }
    }

    public init?(rawValue: String) { self.init(rawValue) }

    public init(stringLiteral value: String) { self.init(value) }

    public var rawValue: String {
        switch self {
        case .creator: return "creator"
        case .creatorAdmin: return "creator_admin"
        case .creatorAdminUser: return "creator_admin_user"
        case .anyone: return "anyone"
        case .unknown(let value): return value
        }
    }

    public init(from decoder: Decoder) throws {
        self.init(try decoder.singleValueContainer().decode(String.self))
    }

    public func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        try container.encode(rawValue)
    }
}

public enum ChatActivity: String, Codable, CaseIterable {
    /// Только активные чаты
    case active
    /// Только архивные чаты
    case archived
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

public enum CustomPropertyDataType: Codable, Hashable, RawRepresentable, CaseIterable, ExpressibleByStringLiteral, Sendable {
    /// Строковое значение
    case string
    /// Числовое значение
    case number
    /// Дата
    case date
    /// Ссылка
    case link
    /// A value this SDK version does not list yet
    case unknown(String)

    /// Every value this SDK version lists
    public static let allCases: [CustomPropertyDataType] = [.string, .number, .date, .link]

    public init(_ rawValue: String) {
        switch rawValue {
        case "string": self = .string
        case "number": self = .number
        case "date": self = .date
        case "link": self = .link
        default: self = .unknown(rawValue)
        }
    }

    public init?(rawValue: String) { self.init(rawValue) }

    public init(stringLiteral value: String) { self.init(value) }

    public var rawValue: String {
        switch self {
        case .string: return "string"
        case .number: return "number"
        case .date: return "date"
        case .link: return "link"
        case .unknown(let value): return value
        }
    }

    public init(from decoder: Decoder) throws {
        self.init(try decoder.singleValueContainer().decode(String.self))
    }

    public func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        try container.encode(rawValue)
    }
}

public enum DraftRepetitionInterval: Codable, Hashable, RawRepresentable, CaseIterable, ExpressibleByStringLiteral, Sendable {
    /// Один раз
    case once
    /// Каждый день
    case daily
    /// Каждую неделю
    case weekly
    /// Каждый месяц
    case monthly
    /// Раз в два месяца
    case every2Months
    /// Раз в три месяца
    case every3Months
    /// Раз в четыре месяца
    case every4Months
    /// Раз в полгода
    case every6Months
    /// Раз в год
    case yearly
    /// A value this SDK version does not list yet
    case unknown(String)

    /// Every value this SDK version lists
    public static let allCases: [DraftRepetitionInterval] = [.once, .daily, .weekly, .monthly, .every2Months, .every3Months, .every4Months, .every6Months, .yearly]

    public init(_ rawValue: String) {
        switch rawValue {
        case "once": self = .once
        case "daily": self = .daily
        case "weekly": self = .weekly
        case "monthly": self = .monthly
        case "every_2_months": self = .every2Months
        case "every_3_months": self = .every3Months
        case "every_4_months": self = .every4Months
        case "every_6_months": self = .every6Months
        case "yearly": self = .yearly
        default: self = .unknown(rawValue)
        }
    }

    public init?(rawValue: String) { self.init(rawValue) }

    public init(stringLiteral value: String) { self.init(value) }

    public var rawValue: String {
        switch self {
        case .once: return "once"
        case .daily: return "daily"
        case .weekly: return "weekly"
        case .monthly: return "monthly"
        case .every2Months: return "every_2_months"
        case .every3Months: return "every_3_months"
        case .every4Months: return "every_4_months"
        case .every6Months: return "every_6_months"
        case .yearly: return "yearly"
        case .unknown(let value): return value
        }
    }

    public init(from decoder: Decoder) throws {
        self.init(try decoder.singleValueContainer().decode(String.self))
    }

    public func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        try container.encode(rawValue)
    }
}

public enum DraftType: String, Codable, CaseIterable {
    /// Обычные черновики
    case regular
    /// Отложенные сообщения
    case scheduled
    /// И черновики, и отложенные сообщения
    case all
}

public enum FileTarget: String, Codable, CaseIterable {
    /// Документ, переведённый в PDF
    case pdfPreview = "pdf_preview"
    /// Первая страница документа картинкой
    case pdfFirstPage = "pdf_first_page"
    /// Уменьшенная копия изображения
    case thumb
    /// Изображение как есть
    case image
}

public enum FileType: Codable, Hashable, RawRepresentable, CaseIterable, ExpressibleByStringLiteral, Sendable {
    /// Обычный файл
    case file
    /// Изображение
    case image
    /// Аудиофайл
    case audio
    /// Голосовое сообщение
    case voice
    /// Видеофайл
    case video
    /// A value this SDK version does not list yet
    case unknown(String)

    /// Every value this SDK version lists
    public static let allCases: [FileType] = [.file, .image, .audio, .voice, .video]

    public init(_ rawValue: String) {
        switch rawValue {
        case "file": self = .file
        case "image": self = .image
        case "audio": self = .audio
        case "voice": self = .voice
        case "video": self = .video
        default: self = .unknown(rawValue)
        }
    }

    public init?(rawValue: String) { self.init(rawValue) }

    public init(stringLiteral value: String) { self.init(value) }

    public var rawValue: String {
        switch self {
        case .file: return "file"
        case .image: return "image"
        case .audio: return "audio"
        case .voice: return "voice"
        case .video: return "video"
        case .unknown(let value): return value
        }
    }

    public init(from decoder: Decoder) throws {
        self.init(try decoder.singleValueContainer().decode(String.self))
    }

    public func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        try container.encode(rawValue)
    }
}

public enum InviteStatus: Codable, Hashable, RawRepresentable, CaseIterable, ExpressibleByStringLiteral, Sendable {
    /// Принято
    case confirmed
    /// Отправлено
    case sent
    /// A value this SDK version does not list yet
    case unknown(String)

    /// Every value this SDK version lists
    public static let allCases: [InviteStatus] = [.confirmed, .sent]

    public init(_ rawValue: String) {
        switch rawValue {
        case "confirmed": self = .confirmed
        case "sent": self = .sent
        default: self = .unknown(rawValue)
        }
    }

    public init?(rawValue: String) { self.init(rawValue) }

    public init(stringLiteral value: String) { self.init(value) }

    public var rawValue: String {
        switch self {
        case .confirmed: return "confirmed"
        case .sent: return "sent"
        case .unknown(let value): return value
        }
    }

    public init(from decoder: Decoder) throws {
        self.init(try decoder.singleValueContainer().decode(String.self))
    }

    public func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        try container.encode(rawValue)
    }
}

public enum MemberEventType: Codable, Hashable, RawRepresentable, CaseIterable, ExpressibleByStringLiteral, Sendable {
    /// Добавление
    case add
    /// Удаление
    case remove
    /// A value this SDK version does not list yet
    case unknown(String)

    /// Every value this SDK version lists
    public static let allCases: [MemberEventType] = [.add, .remove]

    public init(_ rawValue: String) {
        switch rawValue {
        case "add": self = .add
        case "remove": self = .remove
        default: self = .unknown(rawValue)
        }
    }

    public init?(rawValue: String) { self.init(rawValue) }

    public init(stringLiteral value: String) { self.init(value) }

    public var rawValue: String {
        switch self {
        case .add: return "add"
        case .remove: return "remove"
        case .unknown(let value): return value
        }
    }

    public init(from decoder: Decoder) throws {
        self.init(try decoder.singleValueContainer().decode(String.self))
    }

    public func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        try container.encode(rawValue)
    }
}

public enum MessageEntityType: Codable, Hashable, RawRepresentable, CaseIterable, ExpressibleByStringLiteral, Sendable {
    /// Беседа или канал
    case discussion
    /// Тред
    case thread
    /// Пользователь
    case user
    /// A value this SDK version does not list yet
    case unknown(String)

    /// Every value this SDK version lists
    public static let allCases: [MessageEntityType] = [.discussion, .thread, .user]

    public init(_ rawValue: String) {
        switch rawValue {
        case "discussion": self = .discussion
        case "thread": self = .thread
        case "user": self = .user
        default: self = .unknown(rawValue)
        }
    }

    public init?(rawValue: String) { self.init(rawValue) }

    public init(stringLiteral value: String) { self.init(value) }

    public var rawValue: String {
        switch self {
        case .discussion: return "discussion"
        case .thread: return "thread"
        case .user: return "user"
        case .unknown(let value): return value
        }
    }

    public init(from decoder: Decoder) throws {
        self.init(try decoder.singleValueContainer().decode(String.self))
    }

    public func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        try container.encode(rawValue)
    }
}

public enum MessageSearchSort: String, Codable, CaseIterable {
    /// По дате создания (хронология)
    case createdAt = "created_at"
    /// По релевантности
    case relevance
}

public enum MessageSortField: String, Codable, CaseIterable {
    /// По идентификатору сообщения
    case id
}

public enum OAuthErrorCode: Codable, Hashable, RawRepresentable, CaseIterable, ExpressibleByStringLiteral, Sendable {
    /// Токен не передан, не найден, истёк или отозван
    case invalidToken
    /// У токена нет скоупа, который нужен методу
    case insufficientScope
    /// Скоуп у токена есть, но роль его владельца не позволяет действие
    case roleForbidden
    /// В запросе нет обязательного параметра или он передан неверно
    case invalidRequest
    /// Неверный `client_id` или `client_secret`
    case invalidClient
    /// Код истёк, уже использован, выдан для другого `redirect_uri` или не подходит `code_verifier`
    case invalidGrant
    /// Значение `grant_type` не поддерживается
    case unsupportedGrantType
    /// Токен выдан другому боту или клиент не подтвердил себя
    case unauthorizedClient
    /// A value this SDK version does not list yet
    case unknown(String)

    /// Every value this SDK version lists
    public static let allCases: [OAuthErrorCode] = [.invalidToken, .insufficientScope, .roleForbidden, .invalidRequest, .invalidClient, .invalidGrant, .unsupportedGrantType, .unauthorizedClient]

    public init(_ rawValue: String) {
        switch rawValue {
        case "invalid_token": self = .invalidToken
        case "insufficient_scope": self = .insufficientScope
        case "role_forbidden": self = .roleForbidden
        case "invalid_request": self = .invalidRequest
        case "invalid_client": self = .invalidClient
        case "invalid_grant": self = .invalidGrant
        case "unsupported_grant_type": self = .unsupportedGrantType
        case "unauthorized_client": self = .unauthorizedClient
        default: self = .unknown(rawValue)
        }
    }

    public init?(rawValue: String) { self.init(rawValue) }

    public init(stringLiteral value: String) { self.init(value) }

    public var rawValue: String {
        switch self {
        case .invalidToken: return "invalid_token"
        case .insufficientScope: return "insufficient_scope"
        case .roleForbidden: return "role_forbidden"
        case .invalidRequest: return "invalid_request"
        case .invalidClient: return "invalid_client"
        case .invalidGrant: return "invalid_grant"
        case .unsupportedGrantType: return "unsupported_grant_type"
        case .unauthorizedClient: return "unauthorized_client"
        case .unknown(let value): return value
        }
    }

    public init(from decoder: Decoder) throws {
        self.init(try decoder.singleValueContainer().decode(String.self))
    }

    public func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        try container.encode(rawValue)
    }
}

public enum OAuthScope: Codable, Hashable, RawRepresentable, CaseIterable, ExpressibleByStringLiteral, Sendable {
    /// Просмотр чатов и списка чатов
    case chatsRead
    /// Создание новых чатов
    case chatsCreate
    /// Изменение настроек чата
    case chatsUpdate
    /// Отметка чатов непрочитанными
    case chatsMarkUnread
    /// Архивация и разархивация чатов
    case chatsArchive
    /// Выход из чатов
    case chatsLeave
    /// Просмотр участников чата
    case chatMembersRead
    /// Добавление, изменение и удаление участников чата
    case chatMembersWrite
    /// Скачивание экспортов чата
    case chatExportsRead
    /// Создание экспортов чата
    case chatExportsWrite
    /// Просмотр сообщений в чатах
    case messagesRead
    /// Отправка сообщений
    case messagesCreate
    /// Редактирование сообщений
    case messagesUpdate
    /// Удаление сообщений
    case messagesDelete
    /// Просмотр реакций на сообщения
    case reactionsRead
    /// Добавление и удаление реакций
    case reactionsWrite
    /// Закрепление и открепление сообщений
    case pinsWrite
    /// Просмотр тредов (комментариев)
    case threadsRead
    /// Создание тредов (комментариев)
    case threadsCreate
    /// Unfurl (разворачивание ссылок)
    case linkPreviewsWrite
    /// Просмотр информации о сотрудниках и списка сотрудников
    case usersRead
    /// Создание новых сотрудников
    case usersCreate
    /// Редактирование данных сотрудника
    case usersUpdate
    /// Удаление сотрудников
    case usersDelete
    /// Просмотр тегов
    case groupTagsRead
    /// Создание, редактирование и удаление тегов
    case groupTagsWrite
    /// Просмотр ботов
    case botsRead
    /// Управление ботами
    case botsWrite
    /// Самостоятельное управление адресом вебхука бота
    case botSelfWebhookWrite
    /// Самостоятельное управление настройками бота
    case botSelfWrite
    /// Просмотр информации о своем профиле
    case profileRead
    /// Просмотр статуса профиля
    case profileStatusRead
    /// Изменение и удаление статуса профиля
    case profileStatusWrite
    /// Изменение и удаление аватара профиля
    case profileAvatarWrite
    /// Просмотр статуса сотрудника
    case userStatusRead
    /// Изменение и удаление статуса сотрудника
    case userStatusWrite
    /// Изменение и удаление аватара сотрудника
    case userAvatarWrite
    /// Просмотр дополнительных полей
    case customPropertiesRead
    /// Просмотр журнала аудита
    case auditEventsRead
    /// Просмотр списка всех чатов пространства
    case companyChatsRead
    /// Просмотр списка всех ботов пространства
    case companyBotsRead
    /// Просмотр задач
    case tasksRead
    /// Создание задач
    case tasksCreate
    /// Изменение задачи
    case tasksUpdate
    /// Удаление задачи
    case tasksDelete
    /// Скачивание файлов
    case filesRead
    /// Загрузка файлов
    case filesWrite
    /// Получение данных для загрузки файлов
    case uploadsWrite
    /// Открытие форм (представлений)
    case viewsWrite
    /// Просмотр вебхуков
    case webhooksRead
    /// Создание и управление вебхуками
    case webhooksWrite
    /// Просмотр лога вебхуков
    case webhooksEventsRead
    /// Удаление записи в логе вебхука
    case webhooksEventsDelete
    /// Поиск сотрудников
    case searchUsers
    /// Поиск чатов
    case searchChats
    /// Поиск сообщений
    case searchMessages
    /// Просмотр черновиков и отложенных сообщений
    case draftsRead
    /// Создание, изменение и удаление черновиков и отложенных сообщений
    case draftsWrite
    /// Просмотр важных сообщений
    case importantMessagesRead
    /// Добавление сообщений в важные и удаление из важных
    case importantMessagesWrite
    /// A value this SDK version does not list yet
    case unknown(String)

    /// Every value this SDK version lists
    public static let allCases: [OAuthScope] = [.chatsRead, .chatsCreate, .chatsUpdate, .chatsMarkUnread, .chatsArchive, .chatsLeave, .chatMembersRead, .chatMembersWrite, .chatExportsRead, .chatExportsWrite, .messagesRead, .messagesCreate, .messagesUpdate, .messagesDelete, .reactionsRead, .reactionsWrite, .pinsWrite, .threadsRead, .threadsCreate, .linkPreviewsWrite, .usersRead, .usersCreate, .usersUpdate, .usersDelete, .groupTagsRead, .groupTagsWrite, .botsRead, .botsWrite, .botSelfWebhookWrite, .botSelfWrite, .profileRead, .profileStatusRead, .profileStatusWrite, .profileAvatarWrite, .userStatusRead, .userStatusWrite, .userAvatarWrite, .customPropertiesRead, .auditEventsRead, .companyChatsRead, .companyBotsRead, .tasksRead, .tasksCreate, .tasksUpdate, .tasksDelete, .filesRead, .filesWrite, .uploadsWrite, .viewsWrite, .webhooksRead, .webhooksWrite, .webhooksEventsRead, .webhooksEventsDelete, .searchUsers, .searchChats, .searchMessages, .draftsRead, .draftsWrite, .importantMessagesRead, .importantMessagesWrite]

    public init(_ rawValue: String) {
        switch rawValue {
        case "chats:read": self = .chatsRead
        case "chats:create": self = .chatsCreate
        case "chats:update": self = .chatsUpdate
        case "chats:mark_unread": self = .chatsMarkUnread
        case "chats:archive": self = .chatsArchive
        case "chats:leave": self = .chatsLeave
        case "chat_members:read": self = .chatMembersRead
        case "chat_members:write": self = .chatMembersWrite
        case "chat_exports:read": self = .chatExportsRead
        case "chat_exports:write": self = .chatExportsWrite
        case "messages:read": self = .messagesRead
        case "messages:create": self = .messagesCreate
        case "messages:update": self = .messagesUpdate
        case "messages:delete": self = .messagesDelete
        case "reactions:read": self = .reactionsRead
        case "reactions:write": self = .reactionsWrite
        case "pins:write": self = .pinsWrite
        case "threads:read": self = .threadsRead
        case "threads:create": self = .threadsCreate
        case "link_previews:write": self = .linkPreviewsWrite
        case "users:read": self = .usersRead
        case "users:create": self = .usersCreate
        case "users:update": self = .usersUpdate
        case "users:delete": self = .usersDelete
        case "group_tags:read": self = .groupTagsRead
        case "group_tags:write": self = .groupTagsWrite
        case "bots:read": self = .botsRead
        case "bots:write": self = .botsWrite
        case "bot_self:webhook:write": self = .botSelfWebhookWrite
        case "bot_self:write": self = .botSelfWrite
        case "profile:read": self = .profileRead
        case "profile_status:read": self = .profileStatusRead
        case "profile_status:write": self = .profileStatusWrite
        case "profile_avatar:write": self = .profileAvatarWrite
        case "user_status:read": self = .userStatusRead
        case "user_status:write": self = .userStatusWrite
        case "user_avatar:write": self = .userAvatarWrite
        case "custom_properties:read": self = .customPropertiesRead
        case "audit_events:read": self = .auditEventsRead
        case "company_chats:read": self = .companyChatsRead
        case "company_bots:read": self = .companyBotsRead
        case "tasks:read": self = .tasksRead
        case "tasks:create": self = .tasksCreate
        case "tasks:update": self = .tasksUpdate
        case "tasks:delete": self = .tasksDelete
        case "files:read": self = .filesRead
        case "files:write": self = .filesWrite
        case "uploads:write": self = .uploadsWrite
        case "views:write": self = .viewsWrite
        case "webhooks:read": self = .webhooksRead
        case "webhooks:write": self = .webhooksWrite
        case "webhooks:events:read": self = .webhooksEventsRead
        case "webhooks:events:delete": self = .webhooksEventsDelete
        case "search:users": self = .searchUsers
        case "search:chats": self = .searchChats
        case "search:messages": self = .searchMessages
        case "drafts:read": self = .draftsRead
        case "drafts:write": self = .draftsWrite
        case "important_messages:read": self = .importantMessagesRead
        case "important_messages:write": self = .importantMessagesWrite
        default: self = .unknown(rawValue)
        }
    }

    public init?(rawValue: String) { self.init(rawValue) }

    public init(stringLiteral value: String) { self.init(value) }

    public var rawValue: String {
        switch self {
        case .chatsRead: return "chats:read"
        case .chatsCreate: return "chats:create"
        case .chatsUpdate: return "chats:update"
        case .chatsMarkUnread: return "chats:mark_unread"
        case .chatsArchive: return "chats:archive"
        case .chatsLeave: return "chats:leave"
        case .chatMembersRead: return "chat_members:read"
        case .chatMembersWrite: return "chat_members:write"
        case .chatExportsRead: return "chat_exports:read"
        case .chatExportsWrite: return "chat_exports:write"
        case .messagesRead: return "messages:read"
        case .messagesCreate: return "messages:create"
        case .messagesUpdate: return "messages:update"
        case .messagesDelete: return "messages:delete"
        case .reactionsRead: return "reactions:read"
        case .reactionsWrite: return "reactions:write"
        case .pinsWrite: return "pins:write"
        case .threadsRead: return "threads:read"
        case .threadsCreate: return "threads:create"
        case .linkPreviewsWrite: return "link_previews:write"
        case .usersRead: return "users:read"
        case .usersCreate: return "users:create"
        case .usersUpdate: return "users:update"
        case .usersDelete: return "users:delete"
        case .groupTagsRead: return "group_tags:read"
        case .groupTagsWrite: return "group_tags:write"
        case .botsRead: return "bots:read"
        case .botsWrite: return "bots:write"
        case .botSelfWebhookWrite: return "bot_self:webhook:write"
        case .botSelfWrite: return "bot_self:write"
        case .profileRead: return "profile:read"
        case .profileStatusRead: return "profile_status:read"
        case .profileStatusWrite: return "profile_status:write"
        case .profileAvatarWrite: return "profile_avatar:write"
        case .userStatusRead: return "user_status:read"
        case .userStatusWrite: return "user_status:write"
        case .userAvatarWrite: return "user_avatar:write"
        case .customPropertiesRead: return "custom_properties:read"
        case .auditEventsRead: return "audit_events:read"
        case .companyChatsRead: return "company_chats:read"
        case .companyBotsRead: return "company_bots:read"
        case .tasksRead: return "tasks:read"
        case .tasksCreate: return "tasks:create"
        case .tasksUpdate: return "tasks:update"
        case .tasksDelete: return "tasks:delete"
        case .filesRead: return "files:read"
        case .filesWrite: return "files:write"
        case .uploadsWrite: return "uploads:write"
        case .viewsWrite: return "views:write"
        case .webhooksRead: return "webhooks:read"
        case .webhooksWrite: return "webhooks:write"
        case .webhooksEventsRead: return "webhooks:events:read"
        case .webhooksEventsDelete: return "webhooks:events:delete"
        case .searchUsers: return "search:users"
        case .searchChats: return "search:chats"
        case .searchMessages: return "search:messages"
        case .draftsRead: return "drafts:read"
        case .draftsWrite: return "drafts:write"
        case .importantMessagesRead: return "important_messages:read"
        case .importantMessagesWrite: return "important_messages:write"
        case .unknown(let value): return value
        }
    }

    public init(from decoder: Decoder) throws {
        self.init(try decoder.singleValueContainer().decode(String.self))
    }

    public func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        try container.encode(rawValue)
    }
}

public enum OAuthTokenTypeHint: String, Codable, CaseIterable {
    /// Токен сотрудника
    case accessToken = "access_token"
    /// Токен обновления
    case refreshToken = "refresh_token"
}

public enum ReactionEventType: Codable, Hashable, RawRepresentable, CaseIterable, ExpressibleByStringLiteral, Sendable {
    /// Создание
    case new
    /// Удаление
    case delete
    /// A value this SDK version does not list yet
    case unknown(String)

    /// Every value this SDK version lists
    public static let allCases: [ReactionEventType] = [.new, .delete]

    public init(_ rawValue: String) {
        switch rawValue {
        case "new": self = .new
        case "delete": self = .delete
        default: self = .unknown(rawValue)
        }
    }

    public init?(rawValue: String) { self.init(rawValue) }

    public init(stringLiteral value: String) { self.init(value) }

    public var rawValue: String {
        switch self {
        case .new: return "new"
        case .delete: return "delete"
        case .unknown(let value): return value
        }
    }

    public init(from decoder: Decoder) throws {
        self.init(try decoder.singleValueContainer().decode(String.self))
    }

    public func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        try container.encode(rawValue)
    }
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
    /// По дате создания
    case creation
}

public enum SortOrder: String, Codable, CaseIterable {
    /// По возрастанию
    case asc
    /// По убыванию
    case desc
}

public enum TaskKind: Codable, Hashable, RawRepresentable, CaseIterable, ExpressibleByStringLiteral, Sendable {
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
    /// A value this SDK version does not list yet
    case unknown(String)

    /// Every value this SDK version lists
    public static let allCases: [TaskKind] = [.call, .meeting, .reminder, .event, .email]

    public init(_ rawValue: String) {
        switch rawValue {
        case "call": self = .call
        case "meeting": self = .meeting
        case "reminder": self = .reminder
        case "event": self = .event
        case "email": self = .email
        default: self = .unknown(rawValue)
        }
    }

    public init?(rawValue: String) { self.init(rawValue) }

    public init(stringLiteral value: String) { self.init(value) }

    public var rawValue: String {
        switch self {
        case .call: return "call"
        case .meeting: return "meeting"
        case .reminder: return "reminder"
        case .event: return "event"
        case .email: return "email"
        case .unknown(let value): return value
        }
    }

    public init(from decoder: Decoder) throws {
        self.init(try decoder.singleValueContainer().decode(String.self))
    }

    public func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        try container.encode(rawValue)
    }
}

public enum TaskStatus: Codable, Hashable, RawRepresentable, CaseIterable, ExpressibleByStringLiteral, Sendable {
    /// Выполнено
    case done
    /// Активно
    case undone
    /// A value this SDK version does not list yet
    case unknown(String)

    /// Every value this SDK version lists
    public static let allCases: [TaskStatus] = [.done, .undone]

    public init(_ rawValue: String) {
        switch rawValue {
        case "done": self = .done
        case "undone": self = .undone
        default: self = .unknown(rawValue)
        }
    }

    public init?(rawValue: String) { self.init(rawValue) }

    public init(stringLiteral value: String) { self.init(value) }

    public var rawValue: String {
        switch self {
        case .done: return "done"
        case .undone: return "undone"
        case .unknown(let value): return value
        }
    }

    public init(from decoder: Decoder) throws {
        self.init(try decoder.singleValueContainer().decode(String.self))
    }

    public func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        try container.encode(rawValue)
    }
}

public enum UserCreateRole: String, Codable, CaseIterable {
    /// Администратор
    case admin
    /// Сотрудник
    case user
    /// Мульти-гость
    case multiGuest = "multi_guest"
    /// Гость
    case guest
}

public enum UserEventType: Codable, Hashable, RawRepresentable, CaseIterable, ExpressibleByStringLiteral, Sendable {
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
    /// A value this SDK version does not list yet
    case unknown(String)

    /// Every value this SDK version lists
    public static let allCases: [UserEventType] = [.invite, .confirm, .update, .suspend, .activate, .delete]

    public init(_ rawValue: String) {
        switch rawValue {
        case "invite": self = .invite
        case "confirm": self = .confirm
        case "update": self = .update
        case "suspend": self = .suspend
        case "activate": self = .activate
        case "delete": self = .delete
        default: self = .unknown(rawValue)
        }
    }

    public init?(rawValue: String) { self.init(rawValue) }

    public init(stringLiteral value: String) { self.init(value) }

    public var rawValue: String {
        switch self {
        case .invite: return "invite"
        case .confirm: return "confirm"
        case .update: return "update"
        case .suspend: return "suspend"
        case .activate: return "activate"
        case .delete: return "delete"
        case .unknown(let value): return value
        }
    }

    public init(from decoder: Decoder) throws {
        self.init(try decoder.singleValueContainer().decode(String.self))
    }

    public func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        try container.encode(rawValue)
    }
}

public enum UserRole: Codable, Hashable, RawRepresentable, CaseIterable, ExpressibleByStringLiteral, Sendable {
    /// Администратор
    case admin
    /// Сотрудник
    case user
    /// Мульти-гость
    case multiGuest
    /// Гость
    case guest
    /// A value this SDK version does not list yet
    case unknown(String)

    /// Every value this SDK version lists
    public static let allCases: [UserRole] = [.admin, .user, .multiGuest, .guest]

    public init(_ rawValue: String) {
        switch rawValue {
        case "admin": self = .admin
        case "user": self = .user
        case "multi_guest": self = .multiGuest
        case "guest": self = .guest
        default: self = .unknown(rawValue)
        }
    }

    public init?(rawValue: String) { self.init(rawValue) }

    public init(stringLiteral value: String) { self.init(value) }

    public var rawValue: String {
        switch self {
        case .admin: return "admin"
        case .user: return "user"
        case .multiGuest: return "multi_guest"
        case .guest: return "guest"
        case .unknown(let value): return value
        }
    }

    public init(from decoder: Decoder) throws {
        self.init(try decoder.singleValueContainer().decode(String.self))
    }

    public func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        try container.encode(rawValue)
    }
}

public enum UserRoleInput: String, Codable, CaseIterable {
    /// Администратор
    case admin
    /// Сотрудник
    case user
    /// Мульти-гость
    case multiGuest = "multi_guest"
    /// Гость
    case guest
}

public enum ValidationErrorCode: Codable, Hashable, RawRepresentable, CaseIterable, ExpressibleByStringLiteral, Sendable {
    /// Обязательное поле (не может быть пустым)
    case blank
    /// Слишком длинное значение (пояснения вы получите в поле message)
    case tooLong
    /// Поле не соответствует правилам (пояснения вы получите в поле message)
    case invalid
    /// Поле имеет непредусмотренное значение
    case inclusion
    /// Поле имеет недопустимое значение
    case exclusion
    /// Название для этого поля уже существует
    case taken
    /// Emoji статуса не может содержать значения отличные от Emoji символа
    case wrongEmoji
    /// Объект не найден
    case notFound
    /// Объект с такими данными уже есть. Конфликтующее поле приходит в key, если его удалось определить
    case alreadyExists
    /// Ошибка личного чата (пояснения вы получите в поле message)
    case personalChat
    /// Отображаемая ошибка (пояснения вы получите в поле message)
    case displayedError
    /// Действие запрещено
    case notAuthorized
    /// Выбран слишком большой диапазон дат
    case invalidDateRange
    /// Некорректный URL вебхука
    case invalidWebhookUrl
    /// Достигнут лимит запросов
    case rateLimit
    /// Превышен лимит активных сотрудников. Больше не возвращается
    case licensesLimit
    /// Превышен лимит количества реакций, которые может добавить пользователь (20 уникальных реакций)
    case userLimit
    /// Превышен лимит количества уникальных реакций, которые можно добавить на сообщение (30 уникальных реакций)
    case uniqueLimit
    /// Превышен лимит количества реакций, которые можно добавить на сообщение (1000 реакций)
    case generalLimit
    /// Запрос не выполнен: сбой на сервере или значение, которое сервер не смог разобрать, а текст в message всегда общий
    case unhandled
    /// Не удалось найти идентификатор события
    case triggerNotFound
    /// Время жизни идентификатора события истекло
    case triggerExpired
    /// Обязательный параметр не передан
    case required
    /// Недопустимое значение (не входит в список допустимых)
    case `in`
    /// Значение неприменимо в данном контексте (пояснения вы получите в поле message)
    case notApplicable
    /// Нельзя изменить свои собственные данные
    case selfUpdate
    /// Нельзя изменить данные владельца
    case ownerProtected
    /// Значение уже назначено
    case alreadyAssigned
    /// Ближайшая отправка отложенного сообщения приходится на прошлое
    case nextSendAtInvalid
    /// Расписание отложенного сообщения не складывается в повтор
    case scheduleInvalid
    /// Расписание заканчивается раньше ближайшей отправки
    case scheduleEndDateInvalid
    /// Превышен лимит отложенных сообщений на чат (50)
    case scheduledMessagesLimit
    /// Отложенное сообщение нельзя превратить обратно в черновик
    case draftTypeChangeForbidden
    /// Скачивание файла запрещено: нужен запрос из безопасного контура или в файле найден вирус
    case confidentialDownloadDenied
    /// Не удалось расшифровать файл
    case decryptionFailed
    /// Правило бота «Кто может добавлять бота в чаты» не разрешает вам добавить его: `id` таких ботов приходят в `value`
    case botAddDenied
    /// Бот с настройкой «Ограничить одним чатом» уже состоит в другой беседе или канале: `id` таких ботов приходят в `value`
    case singleChatBotOccupied
    /// Бота с настройкой «Ограничить одним чатом» нельзя добавить в тег
    case singleChatBotTagDenied
    /// В тег можно добавить только бота, которого может добавить в чат любой сотрудник
    case restrictedBotTagDenied
    /// Настройки бота изменились во время запроса: повторите его
    case botChangedConcurrently
    /// Поиск не уложился по времени: сузьте запрос и повторите
    case timeout
    /// Бесплатное пространство исчерпало суточный лимит писем-приглашений: остаток и время сброса — в `payload`
    case dailyInvitesLimit
    /// Недостаточно прав для выполнения действия (пояснения вы получите в поле message)
    case forbidden
    /// Доступ запрещён (недостаточно прав)
    case permissionDenied
    /// Доступ запрещён
    case accessDenied
    /// Некорректные параметры запроса (пояснения вы получите в поле message)
    case wrongParams
    /// Требуется оплата
    case paymentRequired
    /// Значение слишком короткое (пояснения вы получите в поле message)
    case minLength
    /// Значение слишком длинное (пояснения вы получите в поле message)
    case maxLength
    /// Использовано зарезервированное системное слово (here, all)
    case useOfSystemWords
    /// Файл экспорта не найден или ещё не готов
    case exportFileNotFound
    /// Нельзя исключить владельца чата
    case cannotKickOwner
    /// Не удалось закрепить сообщение
    case pinFailed
    /// Сообщение удалено
    case messageDeleted
    /// Нельзя создать тред для сообщения, которое уже находится в треде
    case threadMessage
    /// Представление не найдено или принадлежит другому боту
    case viewNotFound
    /// Время на ответ об отправке формы истекло или ответ уже был принят
    case submitExpired
    /// Сервис временно недоступен, повторите запрос
    case serviceUnavailable
    /// A value this SDK version does not list yet
    case unknown(String)

    /// Every value this SDK version lists
    public static let allCases: [ValidationErrorCode] = [.blank, .tooLong, .invalid, .inclusion, .exclusion, .taken, .wrongEmoji, .notFound, .alreadyExists, .personalChat, .displayedError, .notAuthorized, .invalidDateRange, .invalidWebhookUrl, .rateLimit, .licensesLimit, .userLimit, .uniqueLimit, .generalLimit, .unhandled, .triggerNotFound, .triggerExpired, .required, .`in`, .notApplicable, .selfUpdate, .ownerProtected, .alreadyAssigned, .nextSendAtInvalid, .scheduleInvalid, .scheduleEndDateInvalid, .scheduledMessagesLimit, .draftTypeChangeForbidden, .confidentialDownloadDenied, .decryptionFailed, .botAddDenied, .singleChatBotOccupied, .singleChatBotTagDenied, .restrictedBotTagDenied, .botChangedConcurrently, .timeout, .dailyInvitesLimit, .forbidden, .permissionDenied, .accessDenied, .wrongParams, .paymentRequired, .minLength, .maxLength, .useOfSystemWords, .exportFileNotFound, .cannotKickOwner, .pinFailed, .messageDeleted, .threadMessage, .viewNotFound, .submitExpired, .serviceUnavailable]

    public init(_ rawValue: String) {
        switch rawValue {
        case "blank": self = .blank
        case "too_long": self = .tooLong
        case "invalid": self = .invalid
        case "inclusion": self = .inclusion
        case "exclusion": self = .exclusion
        case "taken": self = .taken
        case "wrong_emoji": self = .wrongEmoji
        case "not_found": self = .notFound
        case "already_exists": self = .alreadyExists
        case "personal_chat": self = .personalChat
        case "displayed_error": self = .displayedError
        case "not_authorized": self = .notAuthorized
        case "invalid_date_range": self = .invalidDateRange
        case "invalid_webhook_url": self = .invalidWebhookUrl
        case "rate_limit": self = .rateLimit
        case "licenses_limit": self = .licensesLimit
        case "user_limit": self = .userLimit
        case "unique_limit": self = .uniqueLimit
        case "general_limit": self = .generalLimit
        case "unhandled": self = .unhandled
        case "trigger_not_found": self = .triggerNotFound
        case "trigger_expired": self = .triggerExpired
        case "required": self = .required
        case "in": self = .`in`
        case "not_applicable": self = .notApplicable
        case "self_update": self = .selfUpdate
        case "owner_protected": self = .ownerProtected
        case "already_assigned": self = .alreadyAssigned
        case "next_send_at_invalid": self = .nextSendAtInvalid
        case "schedule_invalid": self = .scheduleInvalid
        case "schedule_end_date_invalid": self = .scheduleEndDateInvalid
        case "scheduled_messages_limit": self = .scheduledMessagesLimit
        case "draft_type_change_forbidden": self = .draftTypeChangeForbidden
        case "confidential_download_denied": self = .confidentialDownloadDenied
        case "decryption_failed": self = .decryptionFailed
        case "bot_add_denied": self = .botAddDenied
        case "single_chat_bot_occupied": self = .singleChatBotOccupied
        case "single_chat_bot_tag_denied": self = .singleChatBotTagDenied
        case "restricted_bot_tag_denied": self = .restrictedBotTagDenied
        case "bot_changed_concurrently": self = .botChangedConcurrently
        case "timeout": self = .timeout
        case "daily_invites_limit": self = .dailyInvitesLimit
        case "forbidden": self = .forbidden
        case "permission_denied": self = .permissionDenied
        case "access_denied": self = .accessDenied
        case "wrong_params": self = .wrongParams
        case "payment_required": self = .paymentRequired
        case "min_length": self = .minLength
        case "max_length": self = .maxLength
        case "use_of_system_words": self = .useOfSystemWords
        case "export_file_not_found": self = .exportFileNotFound
        case "cannot_kick_owner": self = .cannotKickOwner
        case "pin_failed": self = .pinFailed
        case "message_deleted": self = .messageDeleted
        case "thread_message": self = .threadMessage
        case "view_not_found": self = .viewNotFound
        case "submit_expired": self = .submitExpired
        case "service_unavailable": self = .serviceUnavailable
        default: self = .unknown(rawValue)
        }
    }

    public init?(rawValue: String) { self.init(rawValue) }

    public init(stringLiteral value: String) { self.init(value) }

    public var rawValue: String {
        switch self {
        case .blank: return "blank"
        case .tooLong: return "too_long"
        case .invalid: return "invalid"
        case .inclusion: return "inclusion"
        case .exclusion: return "exclusion"
        case .taken: return "taken"
        case .wrongEmoji: return "wrong_emoji"
        case .notFound: return "not_found"
        case .alreadyExists: return "already_exists"
        case .personalChat: return "personal_chat"
        case .displayedError: return "displayed_error"
        case .notAuthorized: return "not_authorized"
        case .invalidDateRange: return "invalid_date_range"
        case .invalidWebhookUrl: return "invalid_webhook_url"
        case .rateLimit: return "rate_limit"
        case .licensesLimit: return "licenses_limit"
        case .userLimit: return "user_limit"
        case .uniqueLimit: return "unique_limit"
        case .generalLimit: return "general_limit"
        case .unhandled: return "unhandled"
        case .triggerNotFound: return "trigger_not_found"
        case .triggerExpired: return "trigger_expired"
        case .required: return "required"
        case .`in`: return "in"
        case .notApplicable: return "not_applicable"
        case .selfUpdate: return "self_update"
        case .ownerProtected: return "owner_protected"
        case .alreadyAssigned: return "already_assigned"
        case .nextSendAtInvalid: return "next_send_at_invalid"
        case .scheduleInvalid: return "schedule_invalid"
        case .scheduleEndDateInvalid: return "schedule_end_date_invalid"
        case .scheduledMessagesLimit: return "scheduled_messages_limit"
        case .draftTypeChangeForbidden: return "draft_type_change_forbidden"
        case .confidentialDownloadDenied: return "confidential_download_denied"
        case .decryptionFailed: return "decryption_failed"
        case .botAddDenied: return "bot_add_denied"
        case .singleChatBotOccupied: return "single_chat_bot_occupied"
        case .singleChatBotTagDenied: return "single_chat_bot_tag_denied"
        case .restrictedBotTagDenied: return "restricted_bot_tag_denied"
        case .botChangedConcurrently: return "bot_changed_concurrently"
        case .timeout: return "timeout"
        case .dailyInvitesLimit: return "daily_invites_limit"
        case .forbidden: return "forbidden"
        case .permissionDenied: return "permission_denied"
        case .accessDenied: return "access_denied"
        case .wrongParams: return "wrong_params"
        case .paymentRequired: return "payment_required"
        case .minLength: return "min_length"
        case .maxLength: return "max_length"
        case .useOfSystemWords: return "use_of_system_words"
        case .exportFileNotFound: return "export_file_not_found"
        case .cannotKickOwner: return "cannot_kick_owner"
        case .pinFailed: return "pin_failed"
        case .messageDeleted: return "message_deleted"
        case .threadMessage: return "thread_message"
        case .viewNotFound: return "view_not_found"
        case .submitExpired: return "submit_expired"
        case .serviceUnavailable: return "service_unavailable"
        case .unknown(let value): return value
        }
    }

    public init(from decoder: Decoder) throws {
        self.init(try decoder.singleValueContainer().decode(String.self))
    }

    public func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        try container.encode(rawValue)
    }
}

public enum VideoCallEventType: Codable, Hashable, RawRepresentable, CaseIterable, ExpressibleByStringLiteral, Sendable {
    /// Видеозвонок начался
    case started
    /// Видеозвонок завершился
    case finished
    /// Запись видеозвонка готова
    case recordingReady
    /// A value this SDK version does not list yet
    case unknown(String)

    /// Every value this SDK version lists
    public static let allCases: [VideoCallEventType] = [.started, .finished, .recordingReady]

    public init(_ rawValue: String) {
        switch rawValue {
        case "started": self = .started
        case "finished": self = .finished
        case "recording_ready": self = .recordingReady
        default: self = .unknown(rawValue)
        }
    }

    public init?(rawValue: String) { self.init(rawValue) }

    public init(stringLiteral value: String) { self.init(value) }

    public var rawValue: String {
        switch self {
        case .started: return "started"
        case .finished: return "finished"
        case .recordingReady: return "recording_ready"
        case .unknown(let value): return value
        }
    }

    public init(from decoder: Decoder) throws {
        self.init(try decoder.singleValueContainer().decode(String.self))
    }

    public func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        try container.encode(rawValue)
    }
}

public enum WebhookEventType: Codable, Hashable, RawRepresentable, CaseIterable, ExpressibleByStringLiteral, Sendable {
    /// Создание
    case new
    /// Обновление
    case update
    /// Удаление
    case delete
    /// A value this SDK version does not list yet
    case unknown(String)

    /// Every value this SDK version lists
    public static let allCases: [WebhookEventType] = [.new, .update, .delete]

    public init(_ rawValue: String) {
        switch rawValue {
        case "new": self = .new
        case "update": self = .update
        case "delete": self = .delete
        default: self = .unknown(rawValue)
        }
    }

    public init?(rawValue: String) { self.init(rawValue) }

    public init(stringLiteral value: String) { self.init(value) }

    public var rawValue: String {
        switch self {
        case .new: return "new"
        case .update: return "update"
        case .delete: return "delete"
        case .unknown(let value): return value
        }
    }

    public init(from decoder: Decoder) throws {
        self.init(try decoder.singleValueContainer().decode(String.self))
    }

    public func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        try container.encode(rawValue)
    }
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
    public let authorizedAt: String?

    public init(id: Int64, token: String, name: String? = nil, userId: Int64, scopes: [OAuthScope], createdAt: String, revokedAt: String? = nil, expiresIn: Int? = nil, lastUsedAt: String? = nil, authorizedAt: String? = nil) {
        self.id = id
        self.token = token
        self.name = name
        self.userId = userId
        self.scopes = scopes
        self.createdAt = createdAt
        self.revokedAt = revokedAt
        self.expiresIn = expiresIn
        self.lastUsedAt = lastUsedAt
        self.authorizedAt = authorizedAt
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
        case authorizedAt = "authorized_at"
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
    /// HTTP status code of the answer, set by the client. An empty body or one that is not JSON leaves errors empty.
    public var statusCode: Int?

    public init(errors: [ApiErrorItem], statusCode: Int? = nil) {
        self.errors = errors
        self.statusCode = statusCode
    }

    public var localizedDescription: String {
        guard !errors.isEmpty else { return statusCode.map { "HTTP \($0)" } ?? "api error" }
        if errors.count == 1 { return errors[0].message }
        return "Errors: " + errors.map(\.message).joined(separator: "; ")
    }

    enum CodingKeys: String, CodingKey {
        case errors
    }
}

public struct ApiErrorItem: Codable {
    public let key: String
    public let value: AnyCodable?
    public let message: String
    public let code: ValidationErrorCode
    public let payload: [String: AnyCodable]?

    public init(key: String, value: AnyCodable? = nil, message: String, code: ValidationErrorCode, payload: [String: AnyCodable]? = nil) {
        self.key = key
        self.value = value
        self.message = message
        self.code = code
        self.payload = payload
    }
}

public struct AuditDetailsBot: Codable {
    public let botId: Int
    public let actorId: Int?
    public let webhookId: Int?
    public let applicationId: Int?
    public let accessTokenId: Int?
    public let accessTokenPreview: String?
    public let scopes: [String]?
    public let name: AuditDetailsTokenNameChange?

    public init(botId: Int, actorId: Int? = nil, webhookId: Int? = nil, applicationId: Int? = nil, accessTokenId: Int? = nil, accessTokenPreview: String? = nil, scopes: [String]? = nil, name: AuditDetailsTokenNameChange? = nil) {
        self.botId = botId
        self.actorId = actorId
        self.webhookId = webhookId
        self.applicationId = applicationId
        self.accessTokenId = accessTokenId
        self.accessTokenPreview = accessTokenPreview
        self.scopes = scopes
        self.name = name
    }

    enum CodingKeys: String, CodingKey {
        case botId = "bot_id"
        case actorId = "actor_id"
        case webhookId = "webhook_id"
        case applicationId = "application_id"
        case accessTokenId = "access_token_id"
        case accessTokenPreview = "access_token_preview"
        case scopes
        case name
    }
}

public struct AuditDetailsBotOAuthClient: Codable {
    public let botId: Int
    public let actorId: Int?
    public let clientId: String
    public let changes: [String: AnyCodable]
    public let applicationId: Int?
    public let applicationName: String?
    public let botName: String?
    public let webhookId: Int?
    public let scopes: [String]?
    public let accessTokenId: Int?
    public let accessTokenPreview: String?

    public init(botId: Int, actorId: Int? = nil, clientId: String, changes: [String: AnyCodable], applicationId: Int? = nil, applicationName: String? = nil, botName: String? = nil, webhookId: Int? = nil, scopes: [String]? = nil, accessTokenId: Int? = nil, accessTokenPreview: String? = nil) {
        self.botId = botId
        self.actorId = actorId
        self.clientId = clientId
        self.changes = changes
        self.applicationId = applicationId
        self.applicationName = applicationName
        self.botName = botName
        self.webhookId = webhookId
        self.scopes = scopes
        self.accessTokenId = accessTokenId
        self.accessTokenPreview = accessTokenPreview
    }

    enum CodingKeys: String, CodingKey {
        case botId = "bot_id"
        case actorId = "actor_id"
        case clientId = "client_id"
        case changes
        case applicationId = "application_id"
        case applicationName = "application_name"
        case botName = "bot_name"
        case webhookId = "webhook_id"
        case scopes
        case accessTokenId = "access_token_id"
        case accessTokenPreview = "access_token_preview"
    }
}

public struct AuditDetailsBotOAuthClientDisabled: Codable {
    public let botId: Int
    public let actorId: Int?
    public let clientId: String
    public let deletedAccessTokensCount: Int
    public let deletedAccessGrantsCount: Int
    public let applicationId: Int?
    public let applicationName: String?
    public let botName: String?
    public let webhookId: Int?
    public let scopes: [String]?
    public let accessTokenId: Int?
    public let accessTokenPreview: String?

    public init(botId: Int, actorId: Int? = nil, clientId: String, deletedAccessTokensCount: Int, deletedAccessGrantsCount: Int, applicationId: Int? = nil, applicationName: String? = nil, botName: String? = nil, webhookId: Int? = nil, scopes: [String]? = nil, accessTokenId: Int? = nil, accessTokenPreview: String? = nil) {
        self.botId = botId
        self.actorId = actorId
        self.clientId = clientId
        self.deletedAccessTokensCount = deletedAccessTokensCount
        self.deletedAccessGrantsCount = deletedAccessGrantsCount
        self.applicationId = applicationId
        self.applicationName = applicationName
        self.botName = botName
        self.webhookId = webhookId
        self.scopes = scopes
        self.accessTokenId = accessTokenId
        self.accessTokenPreview = accessTokenPreview
    }

    enum CodingKeys: String, CodingKey {
        case botId = "bot_id"
        case actorId = "actor_id"
        case clientId = "client_id"
        case deletedAccessTokensCount = "deleted_access_tokens_count"
        case deletedAccessGrantsCount = "deleted_access_grants_count"
        case applicationId = "application_id"
        case applicationName = "application_name"
        case botName = "bot_name"
        case webhookId = "webhook_id"
        case scopes
        case accessTokenId = "access_token_id"
        case accessTokenPreview = "access_token_preview"
    }
}

public struct AuditDetailsBotOAuthClientSecretRotated: Codable {
    public let botId: Int
    public let actorId: Int?
    public let clientId: String
    public let applicationId: Int?
    public let applicationName: String?
    public let botName: String?
    public let webhookId: Int?
    public let scopes: [String]?
    public let accessTokenId: Int?
    public let accessTokenPreview: String?

    public init(botId: Int, actorId: Int? = nil, clientId: String, applicationId: Int? = nil, applicationName: String? = nil, botName: String? = nil, webhookId: Int? = nil, scopes: [String]? = nil, accessTokenId: Int? = nil, accessTokenPreview: String? = nil) {
        self.botId = botId
        self.actorId = actorId
        self.clientId = clientId
        self.applicationId = applicationId
        self.applicationName = applicationName
        self.botName = botName
        self.webhookId = webhookId
        self.scopes = scopes
        self.accessTokenId = accessTokenId
        self.accessTokenPreview = accessTokenPreview
    }

    enum CodingKeys: String, CodingKey {
        case botId = "bot_id"
        case actorId = "actor_id"
        case clientId = "client_id"
        case applicationId = "application_id"
        case applicationName = "application_name"
        case botName = "bot_name"
        case webhookId = "webhook_id"
        case scopes
        case accessTokenId = "access_token_id"
        case accessTokenPreview = "access_token_preview"
    }
}

public struct AuditDetailsBotScopes: Codable {
    public let botId: Int
    public let actorId: Int?
    public let addedScopes: [String]
    public let removedScopes: [String]
    public let botName: String?
    public let webhookId: Int
    public let previousScopes: [String]
    public let newScopes: [String]

    public init(botId: Int, actorId: Int? = nil, addedScopes: [String], removedScopes: [String], botName: String? = nil, webhookId: Int, previousScopes: [String], newScopes: [String]) {
        self.botId = botId
        self.actorId = actorId
        self.addedScopes = addedScopes
        self.removedScopes = removedScopes
        self.botName = botName
        self.webhookId = webhookId
        self.previousScopes = previousScopes
        self.newScopes = newScopes
    }

    enum CodingKeys: String, CodingKey {
        case botId = "bot_id"
        case actorId = "actor_id"
        case addedScopes = "added_scopes"
        case removedScopes = "removed_scopes"
        case botName = "bot_name"
        case webhookId = "webhook_id"
        case previousScopes = "previous_scopes"
        case newScopes = "new_scopes"
    }
}

public struct AuditDetailsBotTokenUpdated: Codable {
    public let tokenKind: String
    public let tokenName: String?
    public let resourceOwnerId: Int
    public let currentScopes: [String]
    public let botId: Int?
    public let actorId: Int?
    public let accessTokenId: Int
    public let accessTokenPreview: String?
    public let applicationId: Int?
    public let applicationName: String?
    public let clientId: String?
    public let botName: String?
    public let webhookId: Int
    public let name: AuditDetailsTokenNameChange?

    public init(tokenKind: String, tokenName: String? = nil, resourceOwnerId: Int, currentScopes: [String], botId: Int? = nil, actorId: Int? = nil, accessTokenId: Int, accessTokenPreview: String? = nil, applicationId: Int? = nil, applicationName: String? = nil, clientId: String? = nil, botName: String? = nil, webhookId: Int, name: AuditDetailsTokenNameChange? = nil) {
        self.tokenKind = tokenKind
        self.tokenName = tokenName
        self.resourceOwnerId = resourceOwnerId
        self.currentScopes = currentScopes
        self.botId = botId
        self.actorId = actorId
        self.accessTokenId = accessTokenId
        self.accessTokenPreview = accessTokenPreview
        self.applicationId = applicationId
        self.applicationName = applicationName
        self.clientId = clientId
        self.botName = botName
        self.webhookId = webhookId
        self.name = name
    }

    enum CodingKeys: String, CodingKey {
        case tokenKind = "token_kind"
        case tokenName = "token_name"
        case resourceOwnerId = "resource_owner_id"
        case currentScopes = "current_scopes"
        case botId = "bot_id"
        case actorId = "actor_id"
        case accessTokenId = "access_token_id"
        case accessTokenPreview = "access_token_preview"
        case applicationId = "application_id"
        case applicationName = "application_name"
        case clientId = "client_id"
        case botName = "bot_name"
        case webhookId = "webhook_id"
        case name
    }
}

public struct AuditDetailsBotWebhookSettings: Codable {
    public let botId: Int
    public let actorId: Int?
    public let changes: [String: AnyCodable]
    public let botName: String?
    public let webhookId: Int?
    public let accessTokenId: Int?
    public let accessTokenPreview: String?
    public let applicationId: Int?

    public init(botId: Int, actorId: Int? = nil, changes: [String: AnyCodable], botName: String? = nil, webhookId: Int? = nil, accessTokenId: Int? = nil, accessTokenPreview: String? = nil, applicationId: Int? = nil) {
        self.botId = botId
        self.actorId = actorId
        self.changes = changes
        self.botName = botName
        self.webhookId = webhookId
        self.accessTokenId = accessTokenId
        self.accessTokenPreview = accessTokenPreview
        self.applicationId = applicationId
    }

    enum CodingKeys: String, CodingKey {
        case botId = "bot_id"
        case actorId = "actor_id"
        case changes
        case botName = "bot_name"
        case webhookId = "webhook_id"
        case accessTokenId = "access_token_id"
        case accessTokenPreview = "access_token_preview"
        case applicationId = "application_id"
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

public struct AuditDetailsDeviceAuthorizationApproved: Codable {
    public let clientId: String
    public let scopes: [String]
    public let deviceName: String?
    public let applicationId: Int
    public let applicationName: String?
    public let deviceGrantId: Int
    public let tokenKind: String?

    public init(clientId: String, scopes: [String], deviceName: String? = nil, applicationId: Int, applicationName: String? = nil, deviceGrantId: Int, tokenKind: String? = nil) {
        self.clientId = clientId
        self.scopes = scopes
        self.deviceName = deviceName
        self.applicationId = applicationId
        self.applicationName = applicationName
        self.deviceGrantId = deviceGrantId
        self.tokenKind = tokenKind
    }

    enum CodingKeys: String, CodingKey {
        case clientId = "client_id"
        case scopes
        case deviceName = "device_name"
        case applicationId = "application_id"
        case applicationName = "application_name"
        case deviceGrantId = "device_grant_id"
        case tokenKind = "token_kind"
    }
}

public struct AuditDetailsDeviceAuthorizationDenied: Codable {
    public let clientId: String
    public let scopes: [String]
    public let deviceName: String?
    public let applicationId: Int?
    public let deviceGrantId: Int
    public let tokenKind: String?

    public init(clientId: String, scopes: [String], deviceName: String? = nil, applicationId: Int? = nil, deviceGrantId: Int, tokenKind: String? = nil) {
        self.clientId = clientId
        self.scopes = scopes
        self.deviceName = deviceName
        self.applicationId = applicationId
        self.deviceGrantId = deviceGrantId
        self.tokenKind = tokenKind
    }

    enum CodingKeys: String, CodingKey {
        case clientId = "client_id"
        case scopes
        case deviceName = "device_name"
        case applicationId = "application_id"
        case deviceGrantId = "device_grant_id"
        case tokenKind = "token_kind"
    }
}

public struct AuditDetailsDlp: Codable {
    public let dlpRuleId: String
    public let dlpRuleName: String
    public let messageId: Int
    public let chatId: Int
    public let userId: Int
    public let actionMessage: String?
    public let conditionsMatched: Bool

    public init(dlpRuleId: String, dlpRuleName: String, messageId: Int, chatId: Int, userId: Int, actionMessage: String? = nil, conditionsMatched: Bool) {
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

public struct AuditDetailsLoginGrantApproved: Codable {
    public let loginGrantId: String
    public let device: AuditLoginGrantDevice

    public init(loginGrantId: String, device: AuditLoginGrantDevice) {
        self.loginGrantId = loginGrantId
        self.device = device
    }

    enum CodingKeys: String, CodingKey {
        case loginGrantId = "login_grant_id"
        case device
    }
}

public struct AuditDetailsLoginGrantCreated: Codable {
    public let loginGrantId: String

    public init(loginGrantId: String) {
        self.loginGrantId = loginGrantId
    }

    enum CodingKeys: String, CodingKey {
        case loginGrantId = "login_grant_id"
    }
}

public struct AuditDetailsLoginGrantDenied: Codable {
    public let loginGrantId: String
    public let device: AuditLoginGrantDevice
    public let reason: AuditLoginGrantDenyReason

    public init(loginGrantId: String, device: AuditLoginGrantDevice, reason: AuditLoginGrantDenyReason) {
        self.loginGrantId = loginGrantId
        self.device = device
        self.reason = reason
    }

    enum CodingKeys: String, CodingKey {
        case loginGrantId = "login_grant_id"
        case device
        case reason
    }
}

public struct AuditDetailsOAuthAuthorizationGranted: Codable {
    public let clientId: String?
    public let scopes: [String]
    public let applicationId: Int
    public let applicationName: String?
    public let botId: Int?
    public let botName: String?
    public let authorizationGrantId: Int

    public init(clientId: String? = nil, scopes: [String], applicationId: Int, applicationName: String? = nil, botId: Int? = nil, botName: String? = nil, authorizationGrantId: Int) {
        self.clientId = clientId
        self.scopes = scopes
        self.applicationId = applicationId
        self.applicationName = applicationName
        self.botId = botId
        self.botName = botName
        self.authorizationGrantId = authorizationGrantId
    }

    enum CodingKeys: String, CodingKey {
        case clientId = "client_id"
        case scopes
        case applicationId = "application_id"
        case applicationName = "application_name"
        case botId = "bot_id"
        case botName = "bot_name"
        case authorizationGrantId = "authorization_grant_id"
    }
}

public struct AuditDetailsOAuthAuthorizationRevoked: Codable {
    public let clientId: String
    public let revokedTokensCount: Int
    public let userId: Int?
    public let applicationId: Int
    public let applicationName: String?
    public let botId: Int?
    public let botName: String?

    public init(clientId: String, revokedTokensCount: Int, userId: Int? = nil, applicationId: Int, applicationName: String? = nil, botId: Int? = nil, botName: String? = nil) {
        self.clientId = clientId
        self.revokedTokensCount = revokedTokensCount
        self.userId = userId
        self.applicationId = applicationId
        self.applicationName = applicationName
        self.botId = botId
        self.botName = botName
    }

    enum CodingKeys: String, CodingKey {
        case clientId = "client_id"
        case revokedTokensCount = "revoked_tokens_count"
        case userId = "user_id"
        case applicationId = "application_id"
        case applicationName = "application_name"
        case botId = "bot_id"
        case botName = "bot_name"
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
    public let limit: Int?
    public let filters: [String: AnyCodable]

    public init(searchType: String, queryPresent: Bool, cursorPresent: Bool, limit: Int? = nil, filters: [String: AnyCodable]) {
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

public struct AuditDetailsToken: Codable {
    public let tokenKind: String
    public let tokenName: String?
    public let resourceOwnerId: Int
    public let scopes: [String]
    public let accessTokenId: Int
    public let accessTokenPreview: String?
    public let applicationId: Int?
    public let applicationName: String?
    public let clientId: String?
    public let botId: Int?
    public let botName: String?
    public let deviceName: String?
    public let actorId: Int?
    public let webhookId: Int?
    public let userId: Int?
    public let source: String?
    public let reason: String?

    public init(tokenKind: String, tokenName: String? = nil, resourceOwnerId: Int, scopes: [String], accessTokenId: Int, accessTokenPreview: String? = nil, applicationId: Int? = nil, applicationName: String? = nil, clientId: String? = nil, botId: Int? = nil, botName: String? = nil, deviceName: String? = nil, actorId: Int? = nil, webhookId: Int? = nil, userId: Int? = nil, source: String? = nil, reason: String? = nil) {
        self.tokenKind = tokenKind
        self.tokenName = tokenName
        self.resourceOwnerId = resourceOwnerId
        self.scopes = scopes
        self.accessTokenId = accessTokenId
        self.accessTokenPreview = accessTokenPreview
        self.applicationId = applicationId
        self.applicationName = applicationName
        self.clientId = clientId
        self.botId = botId
        self.botName = botName
        self.deviceName = deviceName
        self.actorId = actorId
        self.webhookId = webhookId
        self.userId = userId
        self.source = source
        self.reason = reason
    }

    enum CodingKeys: String, CodingKey {
        case tokenKind = "token_kind"
        case tokenName = "token_name"
        case resourceOwnerId = "resource_owner_id"
        case scopes
        case accessTokenId = "access_token_id"
        case accessTokenPreview = "access_token_preview"
        case applicationId = "application_id"
        case applicationName = "application_name"
        case clientId = "client_id"
        case botId = "bot_id"
        case botName = "bot_name"
        case deviceName = "device_name"
        case actorId = "actor_id"
        case webhookId = "webhook_id"
        case userId = "user_id"
        case source
        case reason
    }
}

public struct AuditDetailsTokenNameChange: Codable {
    public let previous: String?
    public let new: String?

    public init(previous: String? = nil, new: String? = nil) {
        self.previous = previous
        self.new = new
    }
}

public struct AuditDetailsTokenScopes: Codable {
    public let scopes: [String]

    public init(scopes: [String]) {
        self.scopes = scopes
    }
}

public struct AuditDetailsUserLoginQr: Codable {
    public let method: String
    public let loginGrantId: String

    public init(method: String, loginGrantId: String) {
        self.method = method
        self.loginGrantId = loginGrantId
    }

    enum CodingKeys: String, CodingKey {
        case method
        case loginGrantId = "login_grant_id"
    }
}

public struct AuditDetailsUserUpdated: Codable {
    public let changedAttrs: [String]
    public let context: String?

    public init(changedAttrs: [String], context: String? = nil) {
        self.changedAttrs = changedAttrs
        self.context = context
    }

    enum CodingKeys: String, CodingKey {
        case changedAttrs = "changed_attrs"
        case context
    }
}

public struct AuditDetailsVideoCallFinished: Codable {
    public let chatId: Int
    public let startedMessageId: Int?
    public let duration: Int?
    public let maxMembersCount: Int

    public init(chatId: Int, startedMessageId: Int? = nil, duration: Int? = nil, maxMembersCount: Int) {
        self.chatId = chatId
        self.startedMessageId = startedMessageId
        self.duration = duration
        self.maxMembersCount = maxMembersCount
    }

    enum CodingKeys: String, CodingKey {
        case chatId = "chat_id"
        case startedMessageId = "started_message_id"
        case duration
        case maxMembersCount = "max_members_count"
    }
}

public struct AuditDetailsVideoCallRecording: Codable {
    public let chatId: Int
    public let startedMessageId: Int?
    public let recordingId: Int
    public let fileId: Int
    public let duration: Int
    public let size: Int64

    public init(chatId: Int, startedMessageId: Int? = nil, recordingId: Int, fileId: Int, duration: Int, size: Int64) {
        self.chatId = chatId
        self.startedMessageId = startedMessageId
        self.recordingId = recordingId
        self.fileId = fileId
        self.duration = duration
        self.size = size
    }

    enum CodingKeys: String, CodingKey {
        case chatId = "chat_id"
        case startedMessageId = "started_message_id"
        case recordingId = "recording_id"
        case fileId = "file_id"
        case duration
        case size
    }
}

public struct AuditDetailsVideoCallStarted: Codable {
    public let chatId: Int
    public let startedMessageId: Int?

    public init(chatId: Int, startedMessageId: Int? = nil) {
        self.chatId = chatId
        self.startedMessageId = startedMessageId
    }

    enum CodingKeys: String, CodingKey {
        case chatId = "chat_id"
        case startedMessageId = "started_message_id"
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
    public let ipAddress: String?
    public let userAgent: String?

    public init(id: String, createdAt: String, eventKey: AuditEventKey, entityId: String, entityType: String, actorId: String, actorType: String, details: AuditEventDetailsUnion, ipAddress: String? = nil, userAgent: String? = nil) {
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

public struct AuditLoginGrantDevice: Codable {
    public let name: String
    public let platform: AuditLoginGrantDevicePlatform
    public let osVersion: String?
    public let appVersion: String?

    public init(name: String, platform: AuditLoginGrantDevicePlatform, osVersion: String? = nil, appVersion: String? = nil) {
        self.name = name
        self.platform = platform
        self.osVersion = osVersion
        self.appVersion = appVersion
    }

    enum CodingKeys: String, CodingKey {
        case name
        case platform
        case osVersion = "os_version"
        case appVersion = "app_version"
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

public struct BotAccessToken: Codable {
    public let id: Int64
    public let token: String
    public let name: String?
    public let userId: Int64
    public let scopes: [String]
    public let createdAt: String
    public let revokedAt: String?
    public let expiresIn: Int?
    public let lastUsedAt: String?
    public let authorizedAt: String?

    public init(id: Int64, token: String, name: String? = nil, userId: Int64, scopes: [String], createdAt: String, revokedAt: String? = nil, expiresIn: Int? = nil, lastUsedAt: String? = nil, authorizedAt: String? = nil) {
        self.id = id
        self.token = token
        self.name = name
        self.userId = userId
        self.scopes = scopes
        self.createdAt = createdAt
        self.revokedAt = revokedAt
        self.expiresIn = expiresIn
        self.lastUsedAt = lastUsedAt
        self.authorizedAt = authorizedAt
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
        case authorizedAt = "authorized_at"
    }
}

public struct BotCreateRequestWebhook: Codable {
    public let name: String
    public let nickname: String?
    public let outgoingUrl: String?
    public let events: [BotEventName]?
    public let triggerOn: BotTriggerOn?
    public let commands: [String]?
    public let scopes: [String]?
    public let template: String?
    public let templateEngine: BotTemplateEngine?
    public let challengeKey: String?
    public let linkPreviewEnabled: Bool?
    public let ignoreSelfMessages: Bool?
    public let eventsHistoryEnabled: Bool?
    public let whoCanAdd: BotWhoCanAdd?
    public let canEdit: [BotCanEdit]?
    public let singleChat: Bool?
    public let kind: BotWebhookKind?
    public let unfurlDomains: [String]?

    public init(name: String, nickname: String? = nil, outgoingUrl: String? = nil, events: [BotEventName]? = nil, triggerOn: BotTriggerOn? = nil, commands: [String]? = nil, scopes: [String]? = nil, template: String? = nil, templateEngine: BotTemplateEngine? = nil, challengeKey: String? = nil, linkPreviewEnabled: Bool? = nil, ignoreSelfMessages: Bool? = nil, eventsHistoryEnabled: Bool? = nil, whoCanAdd: BotWhoCanAdd? = nil, canEdit: [BotCanEdit]? = nil, singleChat: Bool? = nil, kind: BotWebhookKind? = nil, unfurlDomains: [String]? = nil) {
        self.name = name
        self.nickname = nickname
        self.outgoingUrl = outgoingUrl
        self.events = events
        self.triggerOn = triggerOn
        self.commands = commands
        self.scopes = scopes
        self.template = template
        self.templateEngine = templateEngine
        self.challengeKey = challengeKey
        self.linkPreviewEnabled = linkPreviewEnabled
        self.ignoreSelfMessages = ignoreSelfMessages
        self.eventsHistoryEnabled = eventsHistoryEnabled
        self.whoCanAdd = whoCanAdd
        self.canEdit = canEdit
        self.singleChat = singleChat
        self.kind = kind
        self.unfurlDomains = unfurlDomains
    }

    enum CodingKeys: String, CodingKey {
        case name
        case nickname
        case outgoingUrl = "outgoing_url"
        case events
        case triggerOn = "trigger_on"
        case commands
        case scopes
        case template
        case templateEngine = "template_engine"
        case challengeKey = "challenge_key"
        case linkPreviewEnabled = "link_preview_enabled"
        case ignoreSelfMessages = "ignore_self_messages"
        case eventsHistoryEnabled = "events_history_enabled"
        case whoCanAdd = "who_can_add"
        case canEdit = "can_edit"
        case singleChat = "single_chat"
        case kind
        case unfurlDomains = "unfurl_domains"
    }
}

public struct BotCreateRequest: Codable {
    public let empty: Bool?
    public let webhook: BotCreateRequestWebhook
    public let oauthClient: BotOAuthClientRequest?
    public let promo: BotPromoRequest?

    public init(empty: Bool? = nil, webhook: BotCreateRequestWebhook, oauthClient: BotOAuthClientRequest? = nil, promo: BotPromoRequest? = nil) {
        self.empty = empty
        self.webhook = webhook
        self.oauthClient = oauthClient
        self.promo = promo
    }

    enum CodingKeys: String, CodingKey {
        case empty
        case webhook
        case oauthClient = "oauth_client"
        case promo
    }
}

public struct BotCreateResponse: Codable {
    public let id: Int
    public let name: String
    public let nickname: String
    public let avatarUrl: String?
    public let creatorId: Int?
    public let createdAt: String
    public let authorizedUsersCount: Int
    public let lastUsedAt: String?
    public let webhook: BotWebhook
    public let oauthClientEnabled: Bool
    public let oauthClient: BotOAuthClient?
    public let promo: BotPromo?
    public let permissions: BotPermissions
    public let clientSecret: String?
    public let accessToken: String?

    public init(id: Int, name: String, nickname: String, avatarUrl: String? = nil, creatorId: Int? = nil, createdAt: String, authorizedUsersCount: Int, lastUsedAt: String? = nil, webhook: BotWebhook, oauthClientEnabled: Bool, oauthClient: BotOAuthClient? = nil, promo: BotPromo? = nil, permissions: BotPermissions, clientSecret: String? = nil, accessToken: String? = nil) {
        self.id = id
        self.name = name
        self.nickname = nickname
        self.avatarUrl = avatarUrl
        self.creatorId = creatorId
        self.createdAt = createdAt
        self.authorizedUsersCount = authorizedUsersCount
        self.lastUsedAt = lastUsedAt
        self.webhook = webhook
        self.oauthClientEnabled = oauthClientEnabled
        self.oauthClient = oauthClient
        self.promo = promo
        self.permissions = permissions
        self.clientSecret = clientSecret
        self.accessToken = accessToken
    }

    enum CodingKeys: String, CodingKey {
        case id
        case name
        case nickname
        case avatarUrl = "avatar_url"
        case creatorId = "creator_id"
        case createdAt = "created_at"
        case authorizedUsersCount = "authorized_users_count"
        case lastUsedAt = "last_used_at"
        case webhook
        case oauthClientEnabled = "oauth_client_enabled"
        case oauthClient = "oauth_client"
        case promo
        case permissions
        case clientSecret = "client_secret"
        case accessToken = "access_token"
    }
}

public struct BotOAuthClient: Codable {
    public let clientId: String
    public let clientSecretPreview: String
    public let confidential: Bool
    public let redirectUris: [String]
    public let scopes: [String]

    public init(clientId: String, clientSecretPreview: String, confidential: Bool, redirectUris: [String], scopes: [String]) {
        self.clientId = clientId
        self.clientSecretPreview = clientSecretPreview
        self.confidential = confidential
        self.redirectUris = redirectUris
        self.scopes = scopes
    }

    enum CodingKeys: String, CodingKey {
        case clientId = "client_id"
        case clientSecretPreview = "client_secret_preview"
        case confidential
        case redirectUris = "redirect_uris"
        case scopes
    }
}

public struct BotOAuthClientRequest: Codable {
    public let confidential: Bool?
    public let redirectUris: [String]?
    public let scopes: [String]?

    public init(confidential: Bool? = nil, redirectUris: [String]? = nil, scopes: [String]? = nil) {
        self.confidential = confidential
        self.redirectUris = redirectUris
        self.scopes = scopes
    }

    enum CodingKeys: String, CodingKey {
        case confidential
        case redirectUris = "redirect_uris"
        case scopes
    }
}

public struct BotPermissions: Codable {
    public let updateOauthClient: Bool
    public let recreateToken: Bool
    public let destroy: Bool

    public init(updateOauthClient: Bool, recreateToken: Bool, destroy: Bool) {
        self.updateOauthClient = updateOauthClient
        self.recreateToken = recreateToken
        self.destroy = destroy
    }

    enum CodingKeys: String, CodingKey {
        case updateOauthClient = "update_oauth_client"
        case recreateToken = "recreate_token"
        case destroy
    }
}

public struct BotPromo: Codable {
    public let description: String?
    public let published: Bool
    public let promoImages: [BotPromoImage]

    public init(description: String? = nil, published: Bool, promoImages: [BotPromoImage]) {
        self.description = description
        self.published = published
        self.promoImages = promoImages
    }

    enum CodingKeys: String, CodingKey {
        case description
        case published
        case promoImages = "promo_images"
    }
}

public struct BotPromoImage: Codable {
    public let key: String
    public let url: String

    public init(key: String, url: String) {
        self.key = key
        self.url = url
    }
}

public struct BotPromoRequest: Codable {
    public let description: String?
    public let published: Bool?
    public let promoImages: [String]?

    public init(description: String? = nil, published: Bool? = nil, promoImages: [String]? = nil) {
        self.description = description
        self.published = published
        self.promoImages = promoImages
    }

    enum CodingKeys: String, CodingKey {
        case description
        case published
        case promoImages = "promo_images"
    }
}

public struct BotResponse: Codable {
    public let id: Int
    public let name: String
    public let nickname: String
    public let avatarUrl: String?
    public let creatorId: Int?
    public let createdAt: String
    public let authorizedUsersCount: Int
    public let lastUsedAt: String?
    public let webhook: BotWebhook
    public let oauthClientEnabled: Bool
    public let oauthClient: BotOAuthClient?
    public let promo: BotPromo?
    public let permissions: BotPermissions
    public let clientSecret: String?

    public init(id: Int, name: String, nickname: String, avatarUrl: String? = nil, creatorId: Int? = nil, createdAt: String, authorizedUsersCount: Int, lastUsedAt: String? = nil, webhook: BotWebhook, oauthClientEnabled: Bool, oauthClient: BotOAuthClient? = nil, promo: BotPromo? = nil, permissions: BotPermissions, clientSecret: String? = nil) {
        self.id = id
        self.name = name
        self.nickname = nickname
        self.avatarUrl = avatarUrl
        self.creatorId = creatorId
        self.createdAt = createdAt
        self.authorizedUsersCount = authorizedUsersCount
        self.lastUsedAt = lastUsedAt
        self.webhook = webhook
        self.oauthClientEnabled = oauthClientEnabled
        self.oauthClient = oauthClient
        self.promo = promo
        self.permissions = permissions
        self.clientSecret = clientSecret
    }

    enum CodingKeys: String, CodingKey {
        case id
        case name
        case nickname
        case avatarUrl = "avatar_url"
        case creatorId = "creator_id"
        case createdAt = "created_at"
        case authorizedUsersCount = "authorized_users_count"
        case lastUsedAt = "last_used_at"
        case webhook
        case oauthClientEnabled = "oauth_client_enabled"
        case oauthClient = "oauth_client"
        case promo
        case permissions
        case clientSecret = "client_secret"
    }
}

public struct BotScopeCatalog: Codable {
    public let scopes: [BotScopeCatalogItem]
    public let groups: [BotScopeCatalogGroup]
    public let presets: [BotScopeCatalogPreset]

    public init(scopes: [BotScopeCatalogItem], groups: [BotScopeCatalogGroup], presets: [BotScopeCatalogPreset]) {
        self.scopes = scopes
        self.groups = groups
        self.presets = presets
    }
}

public struct BotScopeCatalogGroup: Codable {
    public let id: String
    public let title: String
    public let description: String

    public init(id: String, title: String, description: String) {
        self.id = id
        self.title = title
        self.description = description
    }
}

public struct BotScopeCatalogItem: Codable {
    public let id: String
    public let title: String
    public let group: String
    public let preset: [String]

    public init(id: String, title: String, group: String, preset: [String]) {
        self.id = id
        self.title = title
        self.group = group
        self.preset = preset
    }
}

public struct BotScopeCatalogPreset: Codable {
    public let id: String
    public let title: String

    public init(id: String, title: String) {
        self.id = id
        self.title = title
    }
}

public struct BotSelfResponse: Codable {
    public let id: Int
    public let oauthClient: BotOAuthClient?
    public let webhook: BotSelfWebhook

    public init(id: Int, oauthClient: BotOAuthClient? = nil, webhook: BotSelfWebhook) {
        self.id = id
        self.oauthClient = oauthClient
        self.webhook = webhook
    }

    enum CodingKeys: String, CodingKey {
        case id
        case oauthClient = "oauth_client"
        case webhook
    }
}

public struct BotSelfTokenResponse: Codable {
    public let id: Int
    public let oauthClient: BotOAuthClient?
    public let webhook: BotSelfWebhook
    public let accessToken: String

    public init(id: Int, oauthClient: BotOAuthClient? = nil, webhook: BotSelfWebhook, accessToken: String) {
        self.id = id
        self.oauthClient = oauthClient
        self.webhook = webhook
        self.accessToken = accessToken
    }

    enum CodingKeys: String, CodingKey {
        case id
        case oauthClient = "oauth_client"
        case webhook
        case accessToken = "access_token"
    }
}

public struct BotSelfWebhook: Codable {
    public let name: String
    public let nickname: String
    public let outgoingUrl: String?
    public let events: [BotEventName]
    public let triggerOn: BotTriggerOn
    public let commands: [String]
    public let scopes: [String]
    public let template: String?
    public let templateEngine: BotTemplateEngine
    public let challengeKey: String?
    public let linkPreviewEnabled: Bool
    public let ignoreSelfMessages: Bool
    public let eventsHistoryEnabled: Bool
    public let singleChat: Bool
    public let canEdit: [BotCanEdit]
    public let whoCanAdd: BotWhoCanAdd

    public init(name: String, nickname: String, outgoingUrl: String? = nil, events: [BotEventName], triggerOn: BotTriggerOn, commands: [String], scopes: [String], template: String? = nil, templateEngine: BotTemplateEngine, challengeKey: String? = nil, linkPreviewEnabled: Bool, ignoreSelfMessages: Bool, eventsHistoryEnabled: Bool, singleChat: Bool, canEdit: [BotCanEdit], whoCanAdd: BotWhoCanAdd) {
        self.name = name
        self.nickname = nickname
        self.outgoingUrl = outgoingUrl
        self.events = events
        self.triggerOn = triggerOn
        self.commands = commands
        self.scopes = scopes
        self.template = template
        self.templateEngine = templateEngine
        self.challengeKey = challengeKey
        self.linkPreviewEnabled = linkPreviewEnabled
        self.ignoreSelfMessages = ignoreSelfMessages
        self.eventsHistoryEnabled = eventsHistoryEnabled
        self.singleChat = singleChat
        self.canEdit = canEdit
        self.whoCanAdd = whoCanAdd
    }

    enum CodingKeys: String, CodingKey {
        case name
        case nickname
        case outgoingUrl = "outgoing_url"
        case events
        case triggerOn = "trigger_on"
        case commands
        case scopes
        case template
        case templateEngine = "template_engine"
        case challengeKey = "challenge_key"
        case linkPreviewEnabled = "link_preview_enabled"
        case ignoreSelfMessages = "ignore_self_messages"
        case eventsHistoryEnabled = "events_history_enabled"
        case singleChat = "single_chat"
        case canEdit = "can_edit"
        case whoCanAdd = "who_can_add"
    }
}

public struct BotTokenCreateRequest: Codable {
    public let name: String
    public let scopes: [String]?

    public init(name: String, scopes: [String]? = nil) {
        self.name = name
        self.scopes = scopes
    }
}

public struct BotTokenUpdateRequest: Codable {
    public let name: String?
    public let scopes: [String]?

    public init(name: String? = nil, scopes: [String]? = nil) {
        self.name = name
        self.scopes = scopes
    }
}

public struct BotUpdateRequestWebhook: Codable {
    public let name: String?
    public let nickname: String?
    public let outgoingUrl: String?
    public let events: [BotEventName]?
    public let triggerOn: BotTriggerOn?
    public let commands: [String]?
    public let scopes: [String]?
    public let template: String?
    public let templateEngine: BotTemplateEngine?
    public let challengeKey: String?
    public let linkPreviewEnabled: Bool?
    public let ignoreSelfMessages: Bool?
    public let eventsHistoryEnabled: Bool?
    public let whoCanAdd: BotWhoCanAdd?
    public let canEdit: [BotCanEdit]?
    public let singleChat: Bool?
    public let kind: BotWebhookKind?
    public let unfurlDomains: [String]?

    public init(name: String? = nil, nickname: String? = nil, outgoingUrl: String? = nil, events: [BotEventName]? = nil, triggerOn: BotTriggerOn? = nil, commands: [String]? = nil, scopes: [String]? = nil, template: String? = nil, templateEngine: BotTemplateEngine? = nil, challengeKey: String? = nil, linkPreviewEnabled: Bool? = nil, ignoreSelfMessages: Bool? = nil, eventsHistoryEnabled: Bool? = nil, whoCanAdd: BotWhoCanAdd? = nil, canEdit: [BotCanEdit]? = nil, singleChat: Bool? = nil, kind: BotWebhookKind? = nil, unfurlDomains: [String]? = nil) {
        self.name = name
        self.nickname = nickname
        self.outgoingUrl = outgoingUrl
        self.events = events
        self.triggerOn = triggerOn
        self.commands = commands
        self.scopes = scopes
        self.template = template
        self.templateEngine = templateEngine
        self.challengeKey = challengeKey
        self.linkPreviewEnabled = linkPreviewEnabled
        self.ignoreSelfMessages = ignoreSelfMessages
        self.eventsHistoryEnabled = eventsHistoryEnabled
        self.whoCanAdd = whoCanAdd
        self.canEdit = canEdit
        self.singleChat = singleChat
        self.kind = kind
        self.unfurlDomains = unfurlDomains
    }

    enum CodingKeys: String, CodingKey {
        case name
        case nickname
        case outgoingUrl = "outgoing_url"
        case events
        case triggerOn = "trigger_on"
        case commands
        case scopes
        case template
        case templateEngine = "template_engine"
        case challengeKey = "challenge_key"
        case linkPreviewEnabled = "link_preview_enabled"
        case ignoreSelfMessages = "ignore_self_messages"
        case eventsHistoryEnabled = "events_history_enabled"
        case whoCanAdd = "who_can_add"
        case canEdit = "can_edit"
        case singleChat = "single_chat"
        case kind
        case unfurlDomains = "unfurl_domains"
    }
}

public struct BotUpdateRequest: Codable {
    public let webhook: BotUpdateRequestWebhook?
    public let oauthClient: BotOAuthClientRequest?
    public let promo: BotPromoRequest?

    public init(webhook: BotUpdateRequestWebhook? = nil, oauthClient: BotOAuthClientRequest? = nil, promo: BotPromoRequest? = nil) {
        self.webhook = webhook
        self.oauthClient = oauthClient
        self.promo = promo
    }

    enum CodingKeys: String, CodingKey {
        case webhook
        case oauthClient = "oauth_client"
        case promo
    }
}

public struct BotWebhook: Codable {
    public let name: String
    public let nickname: String
    public let outgoingUrl: String?
    public let events: [BotEventName]
    public let triggerOn: BotTriggerOn
    public let commands: [String]
    public let scopes: [String]
    public let template: String?
    public let templateEngine: BotTemplateEngine
    public let challengeKey: String?
    public let linkPreviewEnabled: Bool
    public let ignoreSelfMessages: Bool
    public let eventsHistoryEnabled: Bool
    public let singleChat: Bool
    public let canEdit: [BotCanEdit]
    public let whoCanAdd: BotWhoCanAdd
    public let kind: BotWebhookKind?
    public let unfurlDomains: [String]
    public let lastRequestAt: String?
    public let url: String?
    public let secretToken: String?
    public let lastRequestBody: String?

    public init(name: String, nickname: String, outgoingUrl: String? = nil, events: [BotEventName], triggerOn: BotTriggerOn, commands: [String], scopes: [String], template: String? = nil, templateEngine: BotTemplateEngine, challengeKey: String? = nil, linkPreviewEnabled: Bool, ignoreSelfMessages: Bool, eventsHistoryEnabled: Bool, singleChat: Bool, canEdit: [BotCanEdit], whoCanAdd: BotWhoCanAdd, kind: BotWebhookKind? = nil, unfurlDomains: [String], lastRequestAt: String? = nil, url: String? = nil, secretToken: String? = nil, lastRequestBody: String? = nil) {
        self.name = name
        self.nickname = nickname
        self.outgoingUrl = outgoingUrl
        self.events = events
        self.triggerOn = triggerOn
        self.commands = commands
        self.scopes = scopes
        self.template = template
        self.templateEngine = templateEngine
        self.challengeKey = challengeKey
        self.linkPreviewEnabled = linkPreviewEnabled
        self.ignoreSelfMessages = ignoreSelfMessages
        self.eventsHistoryEnabled = eventsHistoryEnabled
        self.singleChat = singleChat
        self.canEdit = canEdit
        self.whoCanAdd = whoCanAdd
        self.kind = kind
        self.unfurlDomains = unfurlDomains
        self.lastRequestAt = lastRequestAt
        self.url = url
        self.secretToken = secretToken
        self.lastRequestBody = lastRequestBody
    }

    enum CodingKeys: String, CodingKey {
        case name
        case nickname
        case outgoingUrl = "outgoing_url"
        case events
        case triggerOn = "trigger_on"
        case commands
        case scopes
        case template
        case templateEngine = "template_engine"
        case challengeKey = "challenge_key"
        case linkPreviewEnabled = "link_preview_enabled"
        case ignoreSelfMessages = "ignore_self_messages"
        case eventsHistoryEnabled = "events_history_enabled"
        case singleChat = "single_chat"
        case canEdit = "can_edit"
        case whoCanAdd = "who_can_add"
        case kind
        case unfurlDomains = "unfurl_domains"
        case lastRequestAt = "last_request_at"
        case url
        case secretToken = "secret_token"
        case lastRequestBody = "last_request_body"
    }
}

public struct BotWebhookSelfUpdateRequestWebhook: Codable {
    public let outgoingUrl: String

    public init(outgoingUrl: String) {
        self.outgoingUrl = outgoingUrl
    }

    enum CodingKeys: String, CodingKey {
        case outgoingUrl = "outgoing_url"
    }
}

public struct BotWebhookSelfUpdateRequest: Codable {
    public let webhook: BotWebhookSelfUpdateRequestWebhook

    public init(webhook: BotWebhookSelfUpdateRequestWebhook) {
        self.webhook = webhook
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
    public let archived: Bool
    public let personal: Bool
    public let `public`: Bool
    public let lastMessageAt: String
    public let meetRoomUrl: String
    public let avatarUrl: String?

    public init(id: Int, name: String, createdAt: String, ownerId: Int, memberIds: [Int], groupTagIds: [Int], channel: Bool, archived: Bool, personal: Bool, `public`: Bool, lastMessageAt: String, meetRoomUrl: String, avatarUrl: String? = nil) {
        self.id = id
        self.name = name
        self.createdAt = createdAt
        self.ownerId = ownerId
        self.memberIds = memberIds
        self.groupTagIds = groupTagIds
        self.channel = channel
        self.archived = archived
        self.personal = personal
        self.`public` = `public`
        self.lastMessageAt = lastMessageAt
        self.meetRoomUrl = meetRoomUrl
        self.avatarUrl = avatarUrl
    }

    enum CodingKeys: String, CodingKey {
        case id
        case name
        case createdAt = "created_at"
        case ownerId = "owner_id"
        case memberIds = "member_ids"
        case groupTagIds = "group_tag_ids"
        case channel
        case archived
        case personal
        case `public` = "public"
        case lastMessageAt = "last_message_at"
        case meetRoomUrl = "meet_room_url"
        case avatarUrl = "avatar_url"
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

public struct ChatExport: Codable {
    public let id: Int

    public init(id: Int) {
        self.id = id
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

public struct CompanyBotResponse: Codable {
    public let id: Int
    public let oauthClient: BotOAuthClient?
    public let webhook: CompanyBotWebhook

    public init(id: Int, oauthClient: BotOAuthClient? = nil, webhook: CompanyBotWebhook) {
        self.id = id
        self.oauthClient = oauthClient
        self.webhook = webhook
    }

    enum CodingKeys: String, CodingKey {
        case id
        case oauthClient = "oauth_client"
        case webhook
    }
}

public struct CompanyBotWebhook: Codable {
    public let name: String
    public let nickname: String
    public let outgoingUrl: String?
    public let events: [BotEventName]?
    public let triggerOn: BotTriggerOn?
    public let commands: [String]?
    public let scopes: [String]?
    public let template: String?
    public let templateEngine: BotTemplateEngine?
    public let challengeKey: String?
    public let linkPreviewEnabled: Bool?
    public let ignoreSelfMessages: Bool?
    public let eventsHistoryEnabled: Bool?
    public let singleChat: Bool?
    public let canEdit: [BotCanEdit]?
    public let whoCanAdd: BotWhoCanAdd?

    public init(name: String, nickname: String, outgoingUrl: String? = nil, events: [BotEventName]? = nil, triggerOn: BotTriggerOn? = nil, commands: [String]? = nil, scopes: [String]? = nil, template: String? = nil, templateEngine: BotTemplateEngine? = nil, challengeKey: String? = nil, linkPreviewEnabled: Bool? = nil, ignoreSelfMessages: Bool? = nil, eventsHistoryEnabled: Bool? = nil, singleChat: Bool? = nil, canEdit: [BotCanEdit]? = nil, whoCanAdd: BotWhoCanAdd? = nil) {
        self.name = name
        self.nickname = nickname
        self.outgoingUrl = outgoingUrl
        self.events = events
        self.triggerOn = triggerOn
        self.commands = commands
        self.scopes = scopes
        self.template = template
        self.templateEngine = templateEngine
        self.challengeKey = challengeKey
        self.linkPreviewEnabled = linkPreviewEnabled
        self.ignoreSelfMessages = ignoreSelfMessages
        self.eventsHistoryEnabled = eventsHistoryEnabled
        self.singleChat = singleChat
        self.canEdit = canEdit
        self.whoCanAdd = whoCanAdd
    }

    enum CodingKeys: String, CodingKey {
        case name
        case nickname
        case outgoingUrl = "outgoing_url"
        case events
        case triggerOn = "trigger_on"
        case commands
        case scopes
        case template
        case templateEngine = "template_engine"
        case challengeKey = "challenge_key"
        case linkPreviewEnabled = "link_preview_enabled"
        case ignoreSelfMessages = "ignore_self_messages"
        case eventsHistoryEnabled = "events_history_enabled"
        case singleChat = "single_chat"
        case canEdit = "can_edit"
        case whoCanAdd = "who_can_add"
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
    public let value: String?

    public init(id: Int, name: String, dataType: CustomPropertyDataType, value: String? = nil) {
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

public struct Draft: Codable {
    public let id: Int
    public let entityType: MessageEntityType?
    public let entityId: Int?
    public let chatId: Int?
    public let content: String
    public let parentMessageId: Int?
    public let files: [File]
    public let voiceContent: VoiceContent?
    public let schedule: DraftSchedule?
    public let nextSendAt: String?
    public let createdAt: String
    public let updatedAt: String

    public init(id: Int, entityType: MessageEntityType? = nil, entityId: Int? = nil, chatId: Int? = nil, content: String, parentMessageId: Int? = nil, files: [File], voiceContent: VoiceContent? = nil, schedule: DraftSchedule? = nil, nextSendAt: String? = nil, createdAt: String, updatedAt: String) {
        self.id = id
        self.entityType = entityType
        self.entityId = entityId
        self.chatId = chatId
        self.content = content
        self.parentMessageId = parentMessageId
        self.files = files
        self.voiceContent = voiceContent
        self.schedule = schedule
        self.nextSendAt = nextSendAt
        self.createdAt = createdAt
        self.updatedAt = updatedAt
    }

    enum CodingKeys: String, CodingKey {
        case id
        case entityType = "entity_type"
        case entityId = "entity_id"
        case chatId = "chat_id"
        case content
        case parentMessageId = "parent_message_id"
        case files
        case voiceContent = "voice_content"
        case schedule
        case nextSendAt = "next_send_at"
        case createdAt = "created_at"
        case updatedAt = "updated_at"
    }
}

public struct DraftCreateRequestDraft: Codable {
    public let entityType: MessageEntityType
    public let entityId: Int
    public let content: String?
    public let parentMessageId: Int?
    public let files: [DraftFileRequest]?
    public let schedule: DraftScheduleRequest?

    public init(entityType: MessageEntityType, entityId: Int, content: String? = nil, parentMessageId: Int? = nil, files: [DraftFileRequest]? = nil, schedule: DraftScheduleRequest? = nil) {
        self.entityType = entityType
        self.entityId = entityId
        self.content = content
        self.parentMessageId = parentMessageId
        self.files = files
        self.schedule = schedule
    }

    enum CodingKeys: String, CodingKey {
        case entityType = "entity_type"
        case entityId = "entity_id"
        case content
        case parentMessageId = "parent_message_id"
        case files
        case schedule
    }
}

public struct DraftCreateRequest: Codable {
    public let draft: DraftCreateRequestDraft

    public init(draft: DraftCreateRequestDraft) {
        self.draft = draft
    }
}

public struct DraftFileRequest: Codable {
    public let id: Int?
    public let key: String
    public let name: String
    public let fileType: FileType?
    public let size: Int64?
    public let width: Int?
    public let height: Int?
    public let durationMs: Int?
    public let waveform: String?

    public init(id: Int? = nil, key: String, name: String, fileType: FileType? = nil, size: Int64? = nil, width: Int? = nil, height: Int? = nil, durationMs: Int? = nil, waveform: String? = nil) {
        self.id = id
        self.key = key
        self.name = name
        self.fileType = fileType
        self.size = size
        self.width = width
        self.height = height
        self.durationMs = durationMs
        self.waveform = waveform
    }

    enum CodingKeys: String, CodingKey {
        case id
        case key
        case name
        case fileType = "file_type"
        case size
        case width
        case height
        case durationMs = "duration_ms"
        case waveform
    }
}

public struct DraftRepetition: Codable {
    public let interval: DraftRepetitionInterval
    public let days: [Int]?
    public let nthDay: Int?

    public init(interval: DraftRepetitionInterval, days: [Int]? = nil, nthDay: Int? = nil) {
        self.interval = interval
        self.days = days
        self.nthDay = nthDay
    }

    enum CodingKeys: String, CodingKey {
        case interval
        case days
        case nthDay = "nth_day"
    }
}

public struct DraftRepetitionRequest: Codable {
    public let interval: DraftRepetitionInterval
    public let days: [Int]?
    public let nthDay: Int?

    public init(interval: DraftRepetitionInterval, days: [Int]? = nil, nthDay: Int? = nil) {
        self.interval = interval
        self.days = days
        self.nthDay = nthDay
    }

    enum CodingKeys: String, CodingKey {
        case interval
        case days
        case nthDay = "nth_day"
    }
}

public struct DraftSchedule: Codable {
    public let startDate: String
    public let endDate: String?
    public let repetition: DraftRepetition

    public init(startDate: String, endDate: String? = nil, repetition: DraftRepetition) {
        self.startDate = startDate
        self.endDate = endDate
        self.repetition = repetition
    }

    enum CodingKeys: String, CodingKey {
        case startDate = "start_date"
        case endDate = "end_date"
        case repetition
    }
}

public struct DraftScheduleRequest: Codable {
    public let startDate: String
    public let endDate: String?
    public let repetition: DraftRepetitionRequest

    public init(startDate: String, endDate: String? = nil, repetition: DraftRepetitionRequest) {
        self.startDate = startDate
        self.endDate = endDate
        self.repetition = repetition
    }

    enum CodingKeys: String, CodingKey {
        case startDate = "start_date"
        case endDate = "end_date"
        case repetition
    }
}

public struct DraftUpdateRequestDraft: Codable {
    public let content: String?
    public let parentMessageId: Int?
    public let files: [DraftFileRequest]?
    public let schedule: DraftScheduleRequest?

    public init(content: String? = nil, parentMessageId: Int? = nil, files: [DraftFileRequest]? = nil, schedule: DraftScheduleRequest? = nil) {
        self.content = content
        self.parentMessageId = parentMessageId
        self.files = files
        self.schedule = schedule
    }

    enum CodingKeys: String, CodingKey {
        case content
        case parentMessageId = "parent_message_id"
        case files
        case schedule
    }
}

public struct DraftUpdateRequest: Codable {
    public let draft: DraftUpdateRequestDraft

    public init(draft: DraftUpdateRequestDraft) {
        self.draft = draft
    }
}

public struct ExportRequest: Codable {
    public let startAt: String
    public let endAt: String
    public let webhookUrl: String?
    public let chatIds: [Int]?
    public let skipChatsFile: Bool?

    public init(startAt: String, endAt: String, webhookUrl: String? = nil, chatIds: [Int]? = nil, skipChatsFile: Bool? = nil) {
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

public struct ExportWebhookPayload: Codable {
    public let type: String
    public let event: String
    public let exportId: Int
    public let createdAt: String

    public init(type: String, event: String, exportId: Int, createdAt: String) {
        self.type = type
        self.event = event
        self.exportId = exportId
        self.createdAt = createdAt
    }

    enum CodingKeys: String, CodingKey {
        case type
        case event
        case exportId = "export_id"
        case createdAt = "created_at"
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
    public let durationMs: Int?

    public init(id: Int, key: String, name: String, fileType: FileType, url: String, width: Int? = nil, height: Int? = nil, durationMs: Int? = nil) {
        self.id = id
        self.key = key
        self.name = name
        self.fileType = fileType
        self.url = url
        self.width = width
        self.height = height
        self.durationMs = durationMs
    }

    enum CodingKeys: String, CodingKey {
        case id
        case key
        case name
        case fileType = "file_type"
        case url
        case width
        case height
        case durationMs = "duration_ms"
    }
}

public struct FileUploadRequest: Codable {
    public let ContentDisposition: String
    public let acl: String?
    public let policy: String
    public let xAmzCredential: String
    public let xAmzAlgorithm: String
    public let xAmzDate: String
    public let xAmzSignature: String
    public let key: String
    public let bucket: String?
    public var file: Data

    public init(ContentDisposition: String, acl: String? = nil, policy: String, xAmzCredential: String, xAmzAlgorithm: String, xAmzDate: String, xAmzSignature: String, key: String, bucket: String? = nil, file: Data) {
        self.ContentDisposition = ContentDisposition
        self.acl = acl
        self.policy = policy
        self.xAmzCredential = xAmzCredential
        self.xAmzAlgorithm = xAmzAlgorithm
        self.xAmzDate = xAmzDate
        self.xAmzSignature = xAmzSignature
        self.key = key
        self.bucket = bucket
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
        case bucket
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

public struct ImportantMessageRequest: Codable {
    public let messageId: Int

    public init(messageId: Int) {
        self.messageId = messageId
    }

    enum CodingKeys: String, CodingKey {
        case messageId = "message_id"
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
    public let entityType: MessageEntityType
    public let entityId: Int?
    public let thread: WebhookMessageThread?
    public let createdAt: String
    public let webhookTimestamp: Int

    public init(type: String, event: String, chatId: Int, messageId: Int, links: [WebhookLink], userId: Int, entityType: MessageEntityType, entityId: Int? = nil, thread: WebhookMessageThread? = nil, createdAt: String, webhookTimestamp: Int) {
        self.type = type
        self.event = event
        self.chatId = chatId
        self.messageId = messageId
        self.links = links
        self.userId = userId
        self.entityType = entityType
        self.entityId = entityId
        self.thread = thread
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
        case entityType = "entity_type"
        case entityId = "entity_id"
        case thread
        case createdAt = "created_at"
        case webhookTimestamp = "webhook_timestamp"
    }
}

public struct MarkChatUnreadRequest: Codable {
    public let messageId: Int?

    public init(messageId: Int? = nil) {
        self.messageId = messageId
    }

    enum CodingKeys: String, CodingKey {
        case messageId = "message_id"
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
    public let voiceContent: VoiceContent?
    public let buttons: [[Button]]?
    public let thread: MessageThread?
    public let forwarding: Forwarding?
    public let parentMessageId: Int?
    public let displayAvatarUrl: String?
    public let displayName: String?
    public let changedAt: String?
    public let deletedAt: String?
    public let important: Bool

    public init(id: Int, entityType: MessageEntityType, entityId: Int, chatId: Int, rootChatId: Int, content: String, userId: Int, createdAt: String, url: String, files: [File], voiceContent: VoiceContent? = nil, buttons: [[Button]]? = nil, thread: MessageThread? = nil, forwarding: Forwarding? = nil, parentMessageId: Int? = nil, displayAvatarUrl: String? = nil, displayName: String? = nil, changedAt: String? = nil, deletedAt: String? = nil, important: Bool) {
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
        self.voiceContent = voiceContent
        self.buttons = buttons
        self.thread = thread
        self.forwarding = forwarding
        self.parentMessageId = parentMessageId
        self.displayAvatarUrl = displayAvatarUrl
        self.displayName = displayName
        self.changedAt = changedAt
        self.deletedAt = deletedAt
        self.important = important
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
        case voiceContent = "voice_content"
        case buttons
        case thread
        case forwarding
        case parentMessageId = "parent_message_id"
        case displayAvatarUrl = "display_avatar_url"
        case displayName = "display_name"
        case changedAt = "changed_at"
        case deletedAt = "deleted_at"
        case important
    }
}

public struct MessageCreateRequestFile: Codable {
    public let key: String
    public let name: String
    public let fileType: FileType
    public let size: Int64?
    public let width: Int?
    public let height: Int?
    public let durationMs: Int?
    public let waveform: String?

    public init(key: String, name: String, fileType: FileType, size: Int64? = nil, width: Int? = nil, height: Int? = nil, durationMs: Int? = nil, waveform: String? = nil) {
        self.key = key
        self.name = name
        self.fileType = fileType
        self.size = size
        self.width = width
        self.height = height
        self.durationMs = durationMs
        self.waveform = waveform
    }

    enum CodingKeys: String, CodingKey {
        case key
        case name
        case fileType = "file_type"
        case size
        case width
        case height
        case durationMs = "duration_ms"
        case waveform
    }
}

public struct MessageCreateRequestMessage: Codable {
    public let entityType: MessageEntityType?
    public let entityId: Int
    public let content: String?
    public let files: [MessageCreateRequestFile]?
    public let buttons: [[Button]]?
    public let parentMessageId: Int?
    public let displayAvatarUrl: String?
    public let displayName: String?
    public let skipInviteMentions: Bool?

    public init(entityType: MessageEntityType? = nil, entityId: Int, content: String? = nil, files: [MessageCreateRequestFile]? = nil, buttons: [[Button]]? = nil, parentMessageId: Int? = nil, displayAvatarUrl: String? = nil, displayName: String? = nil, skipInviteMentions: Bool? = nil) {
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
    public let fileType: FileType?
    public let size: Int64?
    public let width: Int?
    public let height: Int?
    public let durationMs: Int?
    public let waveform: String?

    public init(key: String, name: String, fileType: FileType? = nil, size: Int64? = nil, width: Int? = nil, height: Int? = nil, durationMs: Int? = nil, waveform: String? = nil) {
        self.key = key
        self.name = name
        self.fileType = fileType
        self.size = size
        self.width = width
        self.height = height
        self.durationMs = durationMs
        self.waveform = waveform
    }

    enum CodingKeys: String, CodingKey {
        case key
        case name
        case fileType = "file_type"
        case size
        case width
        case height
        case durationMs = "duration_ms"
        case waveform
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
    public let changedAt: String?
    public let url: String
    public let chatId: Int
    public let parentMessageId: Int?
    public let thread: WebhookMessageThread?
    public let webhookTimestamp: Int

    public init(type: String, id: Int, event: WebhookEventType, entityType: MessageEntityType, entityId: Int, content: String, userId: Int, createdAt: String, changedAt: String? = nil, url: String, chatId: Int, parentMessageId: Int? = nil, thread: WebhookMessageThread? = nil, webhookTimestamp: Int) {
        self.type = type
        self.id = id
        self.event = event
        self.entityType = entityType
        self.entityId = entityId
        self.content = content
        self.userId = userId
        self.createdAt = createdAt
        self.changedAt = changedAt
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
        case changedAt = "changed_at"
        case url
        case chatId = "chat_id"
        case parentMessageId = "parent_message_id"
        case thread
        case webhookTimestamp = "webhook_timestamp"
    }
}

public struct OAuthError: Codable, Error {
    public let error: OAuthErrorCode
    public let errorDescription: String

    public init(error: OAuthErrorCode, errorDescription: String) {
        self.error = error
        self.errorDescription = errorDescription
    }

    public var localizedDescription: String { error.rawValue }

    enum CodingKeys: String, CodingKey {
        case error
        case errorDescription = "error_description"
    }
}

public struct OAuthRevokeRequest: Codable {
    public let token: String
    public let tokenTypeHint: OAuthTokenTypeHint?
    public let clientId: String?
    public let clientSecret: String?

    public init(token: String, tokenTypeHint: OAuthTokenTypeHint? = nil, clientId: String? = nil, clientSecret: String? = nil) {
        self.token = token
        self.tokenTypeHint = tokenTypeHint
        self.clientId = clientId
        self.clientSecret = clientSecret
    }

    enum CodingKeys: String, CodingKey {
        case token
        case tokenTypeHint = "token_type_hint"
        case clientId = "client_id"
        case clientSecret = "client_secret"
    }
}

public struct OAuthToken: Codable {
    public let accessToken: String
    public let tokenType: String
    public let refreshToken: String
    public let scope: String
    public let createdAt: Int64

    public init(accessToken: String, tokenType: String, refreshToken: String, scope: String, createdAt: Int64) {
        self.accessToken = accessToken
        self.tokenType = tokenType
        self.refreshToken = refreshToken
        self.scope = scope
        self.createdAt = createdAt
    }

    enum CodingKeys: String, CodingKey {
        case accessToken = "access_token"
        case tokenType = "token_type"
        case refreshToken = "refresh_token"
        case scope
        case createdAt = "created_at"
    }
}

public struct OAuthTokenRequest: Codable {
    public let grantType: String
    public let code: String
    public let redirectUri: String
    public let clientId: String?
    public let clientSecret: String?
    public let codeVerifier: String?

    public init(grantType: String, code: String, redirectUri: String, clientId: String? = nil, clientSecret: String? = nil, codeVerifier: String? = nil) {
        self.grantType = grantType
        self.code = code
        self.redirectUri = redirectUri
        self.clientId = clientId
        self.clientSecret = clientSecret
        self.codeVerifier = codeVerifier
    }

    enum CodingKeys: String, CodingKey {
        case grantType = "grant_type"
        case code
        case redirectUri = "redirect_uri"
        case clientId = "client_id"
        case clientSecret = "client_secret"
        case codeVerifier = "code_verifier"
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

public struct OpenViewResult: Codable {
    public let success: Bool

    public init(success: Bool) {
        self.success = success
    }
}

public struct PaginationMetaPaginate: Codable {
    public let nextPage: String
    public let prevPage: String?
    public let hasNext: Bool?
    public let hasPrev: Bool?

    public init(nextPage: String, prevPage: String? = nil, hasNext: Bool? = nil, hasPrev: Bool? = nil) {
        self.nextPage = nextPage
        self.prevPage = prevPage
        self.hasNext = hasNext
        self.hasPrev = hasPrev
    }

    enum CodingKeys: String, CodingKey {
        case nextPage = "next_page"
        case prevPage = "prev_page"
        case hasNext = "has_next"
        case hasPrev = "has_prev"
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
    public let name: String

    public init(userId: Int, createdAt: String, code: String, name: String) {
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
    public let chatId: Int?
    public let messageId: Int
    public let code: String
    public let name: String
    public let userId: Int
    public let createdAt: String
    public let webhookTimestamp: Int

    public init(type: String, event: ReactionEventType, chatId: Int? = nil, messageId: Int, code: String, name: String, userId: Int, createdAt: String, webhookTimestamp: Int) {
        self.type = type
        self.event = event
        self.chatId = chatId
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
        case chatId = "chat_id"
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
    public let emoji: String?
    public let title: String?
    public let expiresAt: String?
    public let isAway: Bool?
    public let awayMessage: String?

    public init(emoji: String? = nil, title: String? = nil, expiresAt: String? = nil, isAway: Bool? = nil, awayMessage: String? = nil) {
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

public struct SubmitViewResponseRequest: Codable {
    public let submitId: String
    public let errors: [String: String]?

    public init(submitId: String, errors: [String: String]? = nil) {
        self.submitId = submitId
        self.errors = errors
    }

    enum CodingKeys: String, CodingKey {
        case submitId = "submit_id"
        case errors
    }
}

public struct SubmitViewResponseResult: Codable {
    public let success: Bool

    public init(success: Bool) {
        self.success = success
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
    public let messageId: Int64?
    public let messageChatId: Int64?
    public let updatedAt: String

    public init(id: Int64, chatId: Int64, messageId: Int64? = nil, messageChatId: Int64? = nil, updatedAt: String) {
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
    public let acl: String?
    public let policy: String
    public let xAmzCredential: String
    public let xAmzAlgorithm: String
    public let xAmzDate: String
    public let xAmzSignature: String
    public let key: String
    public let bucket: String?
    public let directUrl: String

    public init(ContentDisposition: String, acl: String? = nil, policy: String, xAmzCredential: String, xAmzAlgorithm: String, xAmzDate: String, xAmzSignature: String, key: String, bucket: String? = nil, directUrl: String) {
        self.ContentDisposition = ContentDisposition
        self.acl = acl
        self.policy = policy
        self.xAmzCredential = xAmzCredential
        self.xAmzAlgorithm = xAmzAlgorithm
        self.xAmzDate = xAmzDate
        self.xAmzSignature = xAmzSignature
        self.key = key
        self.bucket = bucket
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
        case bucket
        case directUrl = "direct_url"
    }
}

public struct User: Codable {
    public let id: Int
    public let firstName: String?
    public let lastName: String?
    public let nickname: String
    public let email: String?
    public let phoneNumber: String?
    public let department: String?
    public let title: String?
    public let role: UserRole
    public let suspended: Bool
    public let inviteStatus: InviteStatus
    public let inviterId: Int?
    public let listTags: [String]
    public let customProperties: [CustomProperty]
    public let userStatus: UserStatus?
    public let bot: Bool
    public let sso: Bool
    public let createdAt: String
    public let lastActivityAt: String?
    public let timeZone: String?
    public let imageUrl: String?

    public init(id: Int, firstName: String? = nil, lastName: String? = nil, nickname: String, email: String? = nil, phoneNumber: String? = nil, department: String? = nil, title: String? = nil, role: UserRole, suspended: Bool, inviteStatus: InviteStatus, inviterId: Int? = nil, listTags: [String], customProperties: [CustomProperty], userStatus: UserStatus? = nil, bot: Bool, sso: Bool, createdAt: String, lastActivityAt: String? = nil, timeZone: String? = nil, imageUrl: String? = nil) {
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
        self.inviterId = inviterId
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
        case inviterId = "inviter_id"
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
    public let role: UserCreateRole?
    public let suspended: Bool?
    public let listTags: [String]?
    public let chatIds: [Int]?
    public let customProperties: [UserCreateRequestCustomProperty]?

    public init(firstName: String? = nil, lastName: String? = nil, email: String, phoneNumber: String? = nil, nickname: String? = nil, department: String? = nil, title: String? = nil, role: UserCreateRole? = nil, suspended: Bool? = nil, listTags: [String]? = nil, chatIds: [Int]? = nil, customProperties: [UserCreateRequestCustomProperty]? = nil) {
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
        self.chatIds = chatIds
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
        case chatIds = "chat_ids"
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
    public let chatIds: [Int]?
    public let suspended: Bool?
    public let listTags: [String]?
    public let customProperties: [UserUpdateRequestCustomProperty]?

    public init(firstName: String? = nil, lastName: String? = nil, email: String? = nil, phoneNumber: String? = nil, nickname: String? = nil, department: String? = nil, title: String? = nil, role: UserRoleInput? = nil, chatIds: [Int]? = nil, suspended: Bool? = nil, listTags: [String]? = nil, customProperties: [UserUpdateRequestCustomProperty]? = nil) {
        self.firstName = firstName
        self.lastName = lastName
        self.email = email
        self.phoneNumber = phoneNumber
        self.nickname = nickname
        self.department = department
        self.title = title
        self.role = role
        self.chatIds = chatIds
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
        case chatIds = "chat_ids"
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

public struct VideoCallWebhookPayload: Codable {
    public let type: String
    public let event: VideoCallEventType
    public let videoRoomId: Int
    public let chatId: Int
    public let ownerId: Int
    public let thread: WebhookVideoCallThread?
    public let startedAt: String?
    public let finishedAt: String?
    public let duration: Int?
    public let members: [WebhookVideoCallMember]?
    public let recordingId: Int?
    public let fileId: Int?
    public let url: String?
    public let size: Int64?
    public let webhookTimestamp: Int

    public init(type: String, event: VideoCallEventType, videoRoomId: Int, chatId: Int, ownerId: Int, thread: WebhookVideoCallThread? = nil, startedAt: String? = nil, finishedAt: String? = nil, duration: Int? = nil, members: [WebhookVideoCallMember]? = nil, recordingId: Int? = nil, fileId: Int? = nil, url: String? = nil, size: Int64? = nil, webhookTimestamp: Int) {
        self.type = type
        self.event = event
        self.videoRoomId = videoRoomId
        self.chatId = chatId
        self.ownerId = ownerId
        self.thread = thread
        self.startedAt = startedAt
        self.finishedAt = finishedAt
        self.duration = duration
        self.members = members
        self.recordingId = recordingId
        self.fileId = fileId
        self.url = url
        self.size = size
        self.webhookTimestamp = webhookTimestamp
    }

    enum CodingKeys: String, CodingKey {
        case type
        case event
        case videoRoomId = "video_room_id"
        case chatId = "chat_id"
        case ownerId = "owner_id"
        case thread
        case startedAt = "started_at"
        case finishedAt = "finished_at"
        case duration
        case members
        case recordingId = "recording_id"
        case fileId = "file_id"
        case url
        case size
        case webhookTimestamp = "webhook_timestamp"
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
    public let options: [ViewBlockCheckboxOption]
    public let required: Bool?
    public let hint: String?

    public init(type: String, name: String, label: String, options: [ViewBlockCheckboxOption], required: Bool? = nil, hint: String? = nil) {
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
    public let options: [ViewBlockSelectableOption]
    public let required: Bool?
    public let hint: String?

    public init(type: String, name: String, label: String, options: [ViewBlockSelectableOption], required: Bool? = nil, hint: String? = nil) {
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
    public let options: [ViewBlockSelectOption]
    public let required: Bool?
    public let hint: String?

    public init(type: String, name: String, label: String, options: [ViewBlockSelectOption], required: Bool? = nil, hint: String? = nil) {
        self.type = type
        self.name = name
        self.label = label
        self.options = options
        self.required = required
        self.hint = hint
    }
}

public struct ViewBlockSelectOption: Codable {
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

public struct ViewBlockSelectableOption: Codable {
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
    public let chatId: Int?
    public let userId: Int
    public let viewId: String
    public let submitId: String
    public let data: [String: AnyCodable]
    public let webhookTimestamp: Int

    public init(type: String, event: String, callbackId: String? = nil, privateMetadata: String? = nil, chatId: Int? = nil, userId: Int, viewId: String, submitId: String, data: [String: AnyCodable], webhookTimestamp: Int) {
        self.type = type
        self.event = event
        self.callbackId = callbackId
        self.privateMetadata = privateMetadata
        self.chatId = chatId
        self.userId = userId
        self.viewId = viewId
        self.submitId = submitId
        self.data = data
        self.webhookTimestamp = webhookTimestamp
    }

    enum CodingKeys: String, CodingKey {
        case type
        case event
        case callbackId = "callback_id"
        case privateMetadata = "private_metadata"
        case chatId = "chat_id"
        case userId = "user_id"
        case viewId = "view_id"
        case submitId = "submit_id"
        case data
        case webhookTimestamp = "webhook_timestamp"
    }
}

public struct VoiceContent: Codable {
    public let durationMs: Int
    public let waveform: String
    public let transcript: String?

    public init(durationMs: Int, waveform: String, transcript: String? = nil) {
        self.durationMs = durationMs
        self.waveform = waveform
        self.transcript = transcript
    }

    enum CodingKeys: String, CodingKey {
        case durationMs = "duration_ms"
        case waveform
        case transcript
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

public struct WebhookEventsStream: Codable {
    public let url: String
    public let expiresAt: String

    public init(url: String, expiresAt: String) {
        self.url = url
        self.expiresAt = expiresAt
    }

    enum CodingKeys: String, CodingKey {
        case url
        case expiresAt = "expires_at"
    }
}

public struct WebhookLink: Codable {
    public let url: String
    public let domain: String
    public let skip: Bool

    public init(url: String, domain: String, skip: Bool) {
        self.url = url
        self.domain = domain
        self.skip = skip
    }
}

public struct WebhookMessageThread: Codable {
    public let messageId: Int?
    public let messageChatId: Int?

    public init(messageId: Int? = nil, messageChatId: Int? = nil) {
        self.messageId = messageId
        self.messageChatId = messageChatId
    }

    enum CodingKeys: String, CodingKey {
        case messageId = "message_id"
        case messageChatId = "message_chat_id"
    }
}

public struct WebhookVideoCallMember: Codable {
    public let userId: Int
    public let joinedAt: String
    public let leftAt: String

    public init(userId: Int, joinedAt: String, leftAt: String) {
        self.userId = userId
        self.joinedAt = joinedAt
        self.leftAt = leftAt
    }

    enum CodingKeys: String, CodingKey {
        case userId = "user_id"
        case joinedAt = "joined_at"
        case leftAt = "left_at"
    }
}

public struct WebhookVideoCallThread: Codable {
    public let id: Int
    public let chatId: Int
    public let messageId: Int?
    public let messageChatId: Int?

    public init(id: Int, chatId: Int, messageId: Int? = nil, messageChatId: Int? = nil) {
        self.id = id
        self.chatId = chatId
        self.messageId = messageId
        self.messageChatId = messageChatId
    }

    enum CodingKeys: String, CodingKey {
        case id
        case chatId = "chat_id"
        case messageId = "message_id"
        case messageChatId = "message_chat_id"
    }
}

public struct UpdateBotAvatarRequest: Codable {
    public var image: Data

    public init(image: Data) {
        self.image = image
    }
}

public struct CreateChatResponseMeta: Codable {
    public let notFoundMemberIds: [Int]
    public let notFoundGroupTagIds: [Int]

    public init(notFoundMemberIds: [Int], notFoundGroupTagIds: [Int]) {
        self.notFoundMemberIds = notFoundMemberIds
        self.notFoundGroupTagIds = notFoundGroupTagIds
    }

    enum CodingKeys: String, CodingKey {
        case notFoundMemberIds = "not_found_member_ids"
        case notFoundGroupTagIds = "not_found_group_tag_ids"
    }
}

public struct UpdateChatAvatarRequest: Codable {
    public var image: Data

    public init(image: Data) {
        self.image = image
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
    case auditDetailsBot(AuditDetailsBot)
    case auditDetailsBotScopes(AuditDetailsBotScopes)
    case auditDetailsBotWebhookSettings(AuditDetailsBotWebhookSettings)
    case auditDetailsBotOAuthClient(AuditDetailsBotOAuthClient)
    case auditDetailsOAuthAuthorizationGranted(AuditDetailsOAuthAuthorizationGranted)
    case auditDetailsOAuthAuthorizationRevoked(AuditDetailsOAuthAuthorizationRevoked)
    case auditDetailsDeviceAuthorizationApproved(AuditDetailsDeviceAuthorizationApproved)
    case auditDetailsDeviceAuthorizationDenied(AuditDetailsDeviceAuthorizationDenied)
    case auditDetailsVideoCallStarted(AuditDetailsVideoCallStarted)
    case auditDetailsVideoCallFinished(AuditDetailsVideoCallFinished)
    case auditDetailsVideoCallRecording(AuditDetailsVideoCallRecording)
    case auditDetailsBotOAuthClientSecretRotated(AuditDetailsBotOAuthClientSecretRotated)
    case auditDetailsBotOAuthClientDisabled(AuditDetailsBotOAuthClientDisabled)
    case auditDetailsToken(AuditDetailsToken)
    case auditDetailsBotTokenUpdated(AuditDetailsBotTokenUpdated)
    case auditDetailsUserLoginQr(AuditDetailsUserLoginQr)
    case auditDetailsLoginGrantCreated(AuditDetailsLoginGrantCreated)
    case auditDetailsLoginGrantApproved(AuditDetailsLoginGrantApproved)
    case auditDetailsLoginGrantDenied(AuditDetailsLoginGrantDenied)

    private struct AnyKey: CodingKey {
        let stringValue: String
        var intValue: Int? { nil }
        init?(stringValue: String) { self.stringValue = stringValue }
        init?(intValue: Int) { nil }
    }

    public init(from decoder: Decoder) throws {
        // AuditEventDetailsUnion carries no discriminator field: members are tried in the order
        // they match the payload keys, and the first one that decodes wins.
        let shapes: [(keys: Set<String>, decode: (Decoder) throws -> AuditEventDetailsUnion)] = [
            ([], { .auditDetailsEmpty(try AuditDetailsEmpty(from: $0)) }),
            (["changed_attrs", "context"], { .auditDetailsUserUpdated(try AuditDetailsUserUpdated(from: $0)) }),
            (["new_company_role", "previous_company_role", "initiator_id"], { .auditDetailsRoleChanged(try AuditDetailsRoleChanged(from: $0)) }),
            (["name"], { .auditDetailsTagName(try AuditDetailsTagName(from: $0)) }),
            (["initiator_id"], { .auditDetailsInitiator(try AuditDetailsInitiator(from: $0)) }),
            (["inviter_id"], { .auditDetailsInviter(try AuditDetailsInviter(from: $0)) }),
            (["old_name", "new_name"], { .auditDetailsChatRenamed(try AuditDetailsChatRenamed(from: $0)) }),
            (["public_access"], { .auditDetailsChatPermission(try AuditDetailsChatPermission(from: $0)) }),
            (["chat_id", "tag_name"], { .auditDetailsTagChat(try AuditDetailsTagChat(from: $0)) }),
            (["chat_id"], { .auditDetailsChatId(try AuditDetailsChatId(from: $0)) }),
            (["scopes"], { .auditDetailsTokenScopes(try AuditDetailsTokenScopes(from: $0)) }),
            (["chat_id", "message_id", "reason"], { .auditDetailsKms(try AuditDetailsKms(from: $0)) }),
            (["dlp_rule_id", "dlp_rule_name", "message_id", "chat_id", "user_id", "action_message", "conditions_matched"], { .auditDetailsDlp(try AuditDetailsDlp(from: $0)) }),
            (["search_type", "query_present", "cursor_present", "limit", "filters"], { .auditDetailsSearch(try AuditDetailsSearch(from: $0)) }),
            (["bot_id", "actor_id", "webhook_id", "application_id", "access_token_id", "access_token_preview", "scopes", "name"], { .auditDetailsBot(try AuditDetailsBot(from: $0)) }),
            (["bot_id", "actor_id", "added_scopes", "removed_scopes", "bot_name", "webhook_id", "previous_scopes", "new_scopes"], { .auditDetailsBotScopes(try AuditDetailsBotScopes(from: $0)) }),
            (["bot_id", "actor_id", "changes", "bot_name", "webhook_id", "access_token_id", "access_token_preview", "application_id"], { .auditDetailsBotWebhookSettings(try AuditDetailsBotWebhookSettings(from: $0)) }),
            (["bot_id", "actor_id", "client_id", "changes", "application_id", "application_name", "bot_name", "webhook_id", "scopes", "access_token_id", "access_token_preview"], { .auditDetailsBotOAuthClient(try AuditDetailsBotOAuthClient(from: $0)) }),
            (["client_id", "scopes", "application_id", "application_name", "bot_id", "bot_name", "authorization_grant_id"], { .auditDetailsOAuthAuthorizationGranted(try AuditDetailsOAuthAuthorizationGranted(from: $0)) }),
            (["client_id", "revoked_tokens_count", "user_id", "application_id", "application_name", "bot_id", "bot_name"], { .auditDetailsOAuthAuthorizationRevoked(try AuditDetailsOAuthAuthorizationRevoked(from: $0)) }),
            (["client_id", "scopes", "device_name", "application_id", "application_name", "device_grant_id", "token_kind"], { .auditDetailsDeviceAuthorizationApproved(try AuditDetailsDeviceAuthorizationApproved(from: $0)) }),
            (["client_id", "scopes", "device_name", "application_id", "device_grant_id", "token_kind"], { .auditDetailsDeviceAuthorizationDenied(try AuditDetailsDeviceAuthorizationDenied(from: $0)) }),
            (["chat_id", "started_message_id"], { .auditDetailsVideoCallStarted(try AuditDetailsVideoCallStarted(from: $0)) }),
            (["chat_id", "started_message_id", "duration", "max_members_count"], { .auditDetailsVideoCallFinished(try AuditDetailsVideoCallFinished(from: $0)) }),
            (["chat_id", "started_message_id", "recording_id", "file_id", "duration", "size"], { .auditDetailsVideoCallRecording(try AuditDetailsVideoCallRecording(from: $0)) }),
            (["bot_id", "actor_id", "client_id", "application_id", "application_name", "bot_name", "webhook_id", "scopes", "access_token_id", "access_token_preview"], { .auditDetailsBotOAuthClientSecretRotated(try AuditDetailsBotOAuthClientSecretRotated(from: $0)) }),
            (["bot_id", "actor_id", "client_id", "deleted_access_tokens_count", "deleted_access_grants_count", "application_id", "application_name", "bot_name", "webhook_id", "scopes", "access_token_id", "access_token_preview"], { .auditDetailsBotOAuthClientDisabled(try AuditDetailsBotOAuthClientDisabled(from: $0)) }),
            (["token_kind", "token_name", "resource_owner_id", "scopes", "access_token_id", "access_token_preview", "application_id", "application_name", "client_id", "bot_id", "bot_name", "device_name", "actor_id", "webhook_id", "user_id", "source", "reason"], { .auditDetailsToken(try AuditDetailsToken(from: $0)) }),
            (["token_kind", "token_name", "resource_owner_id", "current_scopes", "bot_id", "actor_id", "access_token_id", "access_token_preview", "application_id", "application_name", "client_id", "bot_name", "webhook_id", "name"], { .auditDetailsBotTokenUpdated(try AuditDetailsBotTokenUpdated(from: $0)) }),
            (["method", "login_grant_id"], { .auditDetailsUserLoginQr(try AuditDetailsUserLoginQr(from: $0)) }),
            (["login_grant_id"], { .auditDetailsLoginGrantCreated(try AuditDetailsLoginGrantCreated(from: $0)) }),
            (["login_grant_id", "device"], { .auditDetailsLoginGrantApproved(try AuditDetailsLoginGrantApproved(from: $0)) }),
            (["login_grant_id", "device", "reason"], { .auditDetailsLoginGrantDenied(try AuditDetailsLoginGrantDenied(from: $0)) }),
        ]
        let keys = Set((try? decoder.container(keyedBy: AnyKey.self))?.allKeys.map(\.stringValue) ?? [])
        let ranked = shapes.indices.sorted { a, b in
            let matchedA = keys.intersection(shapes[a].keys).count
            let matchedB = keys.intersection(shapes[b].keys).count
            if matchedA != matchedB { return matchedA > matchedB }
            if shapes[a].keys.count != shapes[b].keys.count { return shapes[a].keys.count < shapes[b].keys.count }
            return a < b
        }
        var firstError: Error?
        for index in ranked {
            do {
                self = try shapes[index].decode(decoder)
                return
            } catch {
                if firstError == nil { firstError = error }
            }
        }
        throw firstError ?? DecodingError.dataCorrupted(
            DecodingError.Context(codingPath: decoder.codingPath, debugDescription: "No AuditEventDetailsUnion member matched the payload")
        )
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
        case .auditDetailsBot(let value):
            try value.encode(to: encoder)
        case .auditDetailsBotScopes(let value):
            try value.encode(to: encoder)
        case .auditDetailsBotWebhookSettings(let value):
            try value.encode(to: encoder)
        case .auditDetailsBotOAuthClient(let value):
            try value.encode(to: encoder)
        case .auditDetailsOAuthAuthorizationGranted(let value):
            try value.encode(to: encoder)
        case .auditDetailsOAuthAuthorizationRevoked(let value):
            try value.encode(to: encoder)
        case .auditDetailsDeviceAuthorizationApproved(let value):
            try value.encode(to: encoder)
        case .auditDetailsDeviceAuthorizationDenied(let value):
            try value.encode(to: encoder)
        case .auditDetailsVideoCallStarted(let value):
            try value.encode(to: encoder)
        case .auditDetailsVideoCallFinished(let value):
            try value.encode(to: encoder)
        case .auditDetailsVideoCallRecording(let value):
            try value.encode(to: encoder)
        case .auditDetailsBotOAuthClientSecretRotated(let value):
            try value.encode(to: encoder)
        case .auditDetailsBotOAuthClientDisabled(let value):
            try value.encode(to: encoder)
        case .auditDetailsToken(let value):
            try value.encode(to: encoder)
        case .auditDetailsBotTokenUpdated(let value):
            try value.encode(to: encoder)
        case .auditDetailsUserLoginQr(let value):
            try value.encode(to: encoder)
        case .auditDetailsLoginGrantCreated(let value):
            try value.encode(to: encoder)
        case .auditDetailsLoginGrantApproved(let value):
            try value.encode(to: encoder)
        case .auditDetailsLoginGrantDenied(let value):
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
    case videoCallWebhookPayload(VideoCallWebhookPayload)

    private enum CodingKeys: String, CodingKey {
        case type
        case event
    }

    public init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        let type = try container.decode(String.self, forKey: .type)
        let event = try? container.decode(String.self, forKey: .event)
        switch (type, event) {
        case ("message", "link_shared"):
            self = .linkSharedWebhookPayload(try LinkSharedWebhookPayload(from: decoder))
        case ("message", _):
            self = .messageWebhookPayload(try MessageWebhookPayload(from: decoder))
        case ("reaction", _):
            self = .reactionWebhookPayload(try ReactionWebhookPayload(from: decoder))
        case ("button", _):
            self = .buttonWebhookPayload(try ButtonWebhookPayload(from: decoder))
        case ("view", _):
            self = .viewSubmitWebhookPayload(try ViewSubmitWebhookPayload(from: decoder))
        case ("chat_member", _):
            self = .chatMemberWebhookPayload(try ChatMemberWebhookPayload(from: decoder))
        case ("company_member", _):
            self = .companyMemberWebhookPayload(try CompanyMemberWebhookPayload(from: decoder))
        case ("video_call", _):
            self = .videoCallWebhookPayload(try VideoCallWebhookPayload(from: decoder))
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
        case .videoCallWebhookPayload(let value):
            try value.encode(to: encoder)
        }
    }
}

public struct GetAuditEventsResponse: Codable {
    public let data: [AuditEvent]
    public let meta: PaginationMeta

    public init(data: [AuditEvent], meta: PaginationMeta) {
        self.data = data
        self.meta = meta
    }
}

public struct ListBotsResponse: Codable {
    public let data: [BotResponse]
    public let meta: PaginationMeta

    public init(data: [BotResponse], meta: PaginationMeta) {
        self.data = data
        self.meta = meta
    }
}

public struct ListBotTokensResponse: Codable {
    public let data: [BotAccessToken]
    public let meta: PaginationMeta

    public init(data: [BotAccessToken], meta: PaginationMeta) {
        self.data = data
        self.meta = meta
    }
}

public struct CreateChatResponse: Codable {
    public let data: Chat
    public let meta: CreateChatResponseMeta

    public init(data: Chat, meta: CreateChatResponseMeta) {
        self.data = data
        self.meta = meta
    }
}

public struct ListChatsResponse: Codable {
    public let data: [Chat]
    public let meta: PaginationMeta

    public init(data: [Chat], meta: PaginationMeta) {
        self.data = data
        self.meta = meta
    }
}

public struct ListMembersResponse: Codable {
    public let data: [User]
    public let meta: PaginationMeta

    public init(data: [User], meta: PaginationMeta) {
        self.data = data
        self.meta = meta
    }
}

public struct ListCompanyBotsResponse: Codable {
    public let data: [CompanyBotResponse]
    public let meta: PaginationMeta

    public init(data: [CompanyBotResponse], meta: PaginationMeta) {
        self.data = data
        self.meta = meta
    }
}

public struct ListCompanyChatsResponse: Codable {
    public let data: [Chat]
    public let meta: PaginationMeta

    public init(data: [Chat], meta: PaginationMeta) {
        self.data = data
        self.meta = meta
    }
}

public struct ListPropertiesResponse: Codable {
    public let data: [CustomPropertyDefinition]

    public init(data: [CustomPropertyDefinition]) {
        self.data = data
    }
}

public struct ListDraftsResponse: Codable {
    public let data: [Draft]
    public let meta: PaginationMeta

    public init(data: [Draft], meta: PaginationMeta) {
        self.data = data
        self.meta = meta
    }
}

public struct ListTagsResponse: Codable {
    public let data: [GroupTag]
    public let meta: PaginationMeta

    public init(data: [GroupTag], meta: PaginationMeta) {
        self.data = data
        self.meta = meta
    }
}

public struct GetTagUsersResponse: Codable {
    public let data: [User]
    public let meta: PaginationMeta

    public init(data: [User], meta: PaginationMeta) {
        self.data = data
        self.meta = meta
    }
}

public struct ListImportantMessagesResponse: Codable {
    public let data: [Message]
    public let meta: PaginationMeta

    public init(data: [Message], meta: PaginationMeta) {
        self.data = data
        self.meta = meta
    }
}

public struct ListChatMessagesResponse: Codable {
    public let data: [Message]
    public let meta: PaginationMeta

    public init(data: [Message], meta: PaginationMeta) {
        self.data = data
        self.meta = meta
    }
}

public struct ListReactionsResponse: Codable {
    public let data: [Reaction]
    public let meta: PaginationMeta

    public init(data: [Reaction], meta: PaginationMeta) {
        self.data = data
        self.meta = meta
    }
}

public struct SearchChatsResponse: Codable {
    public let data: [Chat]
    public let meta: SearchPaginationMeta

    public init(data: [Chat], meta: SearchPaginationMeta) {
        self.data = data
        self.meta = meta
    }
}

public struct SearchMessagesResponse: Codable {
    public let data: [Message]
    public let meta: SearchPaginationMeta

    public init(data: [Message], meta: SearchPaginationMeta) {
        self.data = data
        self.meta = meta
    }
}

public struct SearchUsersResponse: Codable {
    public let data: [User]
    public let meta: SearchPaginationMeta

    public init(data: [User], meta: SearchPaginationMeta) {
        self.data = data
        self.meta = meta
    }
}

public struct ListTasksResponse: Codable {
    public let data: [Task]
    public let meta: PaginationMeta

    public init(data: [Task], meta: PaginationMeta) {
        self.data = data
        self.meta = meta
    }
}

public struct ListThreadsResponse: Codable {
    public let data: [Thread]
    public let meta: PaginationMeta

    public init(data: [Thread], meta: PaginationMeta) {
        self.data = data
        self.meta = meta
    }
}

public struct ListUsersResponse: Codable {
    public let data: [User]
    public let meta: PaginationMeta

    public init(data: [User], meta: PaginationMeta) {
        self.data = data
        self.meta = meta
    }
}

public struct GetWebhookEventsResponse: Codable {
    public let data: [WebhookEvent]
    public let meta: PaginationMeta

    public init(data: [WebhookEvent], meta: PaginationMeta) {
        self.data = data
        self.meta = meta
    }
}

struct BotResponseDataWrapper: Codable {
    let data: BotResponse
}

struct WebhookEventsStreamDataWrapper: Codable {
    let data: WebhookEventsStream
}

struct BotSelfTokenResponseDataWrapper: Codable {
    let data: BotSelfTokenResponse
}

struct BotCreateResponseDataWrapper: Codable {
    let data: BotCreateResponse
}

struct BotAccessTokenDataWrapper: Codable {
    let data: BotAccessToken
}

struct BotSelfResponseDataWrapper: Codable {
    let data: BotSelfResponse
}

struct AvatarDataDataWrapper: Codable {
    let data: AvatarData
}

struct ChatDataWrapper: Codable {
    let data: Chat
}

struct ChatExportDataWrapper: Codable {
    let data: ChatExport
}

struct DraftDataWrapper: Codable {
    let data: Draft
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

struct UserStatusDataWrapper: Codable {
    let data: UserStatus
}

struct TaskDataWrapper: Codable {
    let data: Task
}
