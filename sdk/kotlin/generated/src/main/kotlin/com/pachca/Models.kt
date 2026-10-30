package com.pachca.sdk

import java.time.OffsetDateTime
import java.time.format.DateTimeFormatter
import kotlinx.serialization.KSerializer
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.Transient
import kotlinx.serialization.descriptors.PrimitiveKind
import kotlinx.serialization.descriptors.PrimitiveSerialDescriptor
import kotlinx.serialization.descriptors.buildClassSerialDescriptor
import kotlinx.serialization.encoding.Decoder
import kotlinx.serialization.encoding.Encoder
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonDecoder
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonEncoder
import kotlinx.serialization.json.contentOrNull
import kotlinx.serialization.json.decodeFromJsonElement
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive

object OffsetDateTimeSerializer : KSerializer<OffsetDateTime> {
    override val descriptor = PrimitiveSerialDescriptor("OffsetDateTime", PrimitiveKind.STRING)
    override fun serialize(encoder: Encoder, value: OffsetDateTime) = encoder.encodeString(value.format(DateTimeFormatter.ISO_OFFSET_DATE_TIME))
    override fun deserialize(decoder: Decoder): OffsetDateTime = OffsetDateTime.parse(decoder.decodeString(), DateTimeFormatter.ISO_OFFSET_DATE_TIME)
}

/** Тип аудит-события */
@Serializable
@JvmInline
value class AuditEventKey(val value: String) {
    /** Whether this SDK version lists the value */
    val isKnown: Boolean get() = value in knownNames
    /** Constant name of a listed value, the raw value otherwise */
    val name: String get() = knownNames[value] ?: value
    override fun toString(): String = value

    companion object {
        /** Пользователь успешно вошел в систему */
        val USER_LOGIN = AuditEventKey("user_login")
        /** Пользователь вышел из системы */
        val USER_LOGOUT = AuditEventKey("user_logout")
        /** Неудачная попытка двухфакторной аутентификации */
        val USER_2FA_FAIL = AuditEventKey("user_2fa_fail")
        /** Успешная двухфакторная аутентификация */
        val USER_2FA_SUCCESS = AuditEventKey("user_2fa_success")
        /** Двухфакторная аутентификация отключена у сотрудника */
        val USER_2FA_DISABLED = AuditEventKey("user_2fa_disabled")
        /** Создан QR-код для входа в мобильное приложение */
        val LOGIN_GRANT_CREATED = AuditEventKey("login_grant_created")
        /** Сотрудник подтвердил вход по QR-коду */
        val LOGIN_GRANT_APPROVED = AuditEventKey("login_grant_approved")
        /** Вход по QR-коду отклонён */
        val LOGIN_GRANT_DENIED = AuditEventKey("login_grant_denied")
        /** Создана новая учетная запись пользователя */
        val USER_CREATED = AuditEventKey("user_created")
        /** Учетная запись пользователя удалена */
        val USER_DELETED = AuditEventKey("user_deleted")
        /** Роль пользователя была изменена */
        val USER_ROLE_CHANGED = AuditEventKey("user_role_changed")
        /** Данные пользователя обновлены */
        val USER_UPDATED = AuditEventKey("user_updated")
        /** Создан новый тег */
        val TAG_CREATED = AuditEventKey("tag_created")
        /** Тег удален */
        val TAG_DELETED = AuditEventKey("tag_deleted")
        /** Пользователь добавлен в тег */
        val USER_ADDED_TO_TAG = AuditEventKey("user_added_to_tag")
        /** Пользователь удален из тега */
        val USER_REMOVED_FROM_TAG = AuditEventKey("user_removed_from_tag")
        /** Создан новый чат */
        val CHAT_CREATED = AuditEventKey("chat_created")
        /** Чат переименован */
        val CHAT_RENAMED = AuditEventKey("chat_renamed")
        /** Изменены права доступа к чату */
        val CHAT_PERMISSION_CHANGED = AuditEventKey("chat_permission_changed")
        /** Пользователь присоединился к чату */
        val USER_CHAT_JOIN = AuditEventKey("user_chat_join")
        /** Пользователь покинул чат */
        val USER_CHAT_LEAVE = AuditEventKey("user_chat_leave")
        /** Тег добавлен в чат */
        val TAG_ADDED_TO_CHAT = AuditEventKey("tag_added_to_chat")
        /** Тег удален из чата */
        val TAG_REMOVED_FROM_CHAT = AuditEventKey("tag_removed_from_chat")
        /** Сообщение отредактировано */
        val MESSAGE_UPDATED = AuditEventKey("message_updated")
        /** Сообщение удалено */
        val MESSAGE_DELETED = AuditEventKey("message_deleted")
        /** Сообщение создано */
        val MESSAGE_CREATED = AuditEventKey("message_created")
        /** Реакция добавлена */
        val REACTION_CREATED = AuditEventKey("reaction_created")
        /** Реакция удалена */
        val REACTION_DELETED = AuditEventKey("reaction_deleted")
        /** Тред создан */
        val THREAD_CREATED = AuditEventKey("thread_created")
        /** Создан новый токен доступа */
        val ACCESS_TOKEN_CREATED = AuditEventKey("access_token_created")
        /** Токен доступа обновлен */
        val ACCESS_TOKEN_UPDATED = AuditEventKey("access_token_updated")
        /** Токен доступа удален */
        val ACCESS_TOKEN_DESTROY = AuditEventKey("access_token_destroy")
        /** Данные зашифрованы */
        val KMS_ENCRYPT = AuditEventKey("kms_encrypt")
        /** Данные расшифрованы */
        val KMS_DECRYPT = AuditEventKey("kms_decrypt")
        /** Доступ к журналам аудита получен */
        val AUDIT_EVENTS_ACCESSED = AuditEventKey("audit_events_accessed")
        /** Получен список всех чатов пространства */
        val COMPANY_CHATS_ACCESSED = AuditEventKey("company_chats_accessed")
        /** Получен список всех ботов пространства */
        val COMPANY_BOTS_ACCESSED = AuditEventKey("company_bots_accessed")
        /** Срабатывание правила DLP-системы */
        val DLP_VIOLATION_DETECTED = AuditEventKey("dlp_violation_detected")
        /** Поиск сотрудников через API */
        val SEARCH_USERS_API = AuditEventKey("search_users_api")
        /** Поиск чатов через API */
        val SEARCH_CHATS_API = AuditEventKey("search_chats_api")
        /** Поиск сообщений через API */
        val SEARCH_MESSAGES_API = AuditEventKey("search_messages_api")
        /** Изменены скоупы токена бота */
        val BOT_SCOPES_UPDATED = AuditEventKey("bot_scopes_updated")
        /** Изменены настройки исходящего вебхука бота */
        val BOT_WEBHOOK_SETTINGS_UPDATED = AuditEventKey("bot_webhook_settings_updated")
        /** Токен бота перевыпущен (ротация) */
        val BOT_TOKEN_RECREATED = AuditEventKey("bot_token_recreated")
        /** Бот удалён */
        val BOT_DELETED = AuditEventKey("bot_deleted")
        /** Изменены параметры OAuth-клиента бота */
        val BOT_OAUTH_CLIENT_UPDATED = AuditEventKey("bot_oauth_client_updated")
        /** У бота выключена авторизация от имени сотрудника */
        val BOT_OAUTH_CLIENT_DISABLED = AuditEventKey("bot_oauth_client_disabled")
        /** Обновлён секрет OAuth-клиента бота */
        val BOT_OAUTH_CLIENT_SECRET_ROTATED = AuditEventKey("bot_oauth_client_secret_rotated")
        /** Выпущен секрет OAuth-клиента бота */
        val BOT_OAUTH_CLIENT_SECRET_ISSUED = AuditEventKey("bot_oauth_client_secret_issued")
        /** Выпущен токен бота */
        val BOT_TOKEN_CREATED = AuditEventKey("bot_token_created")
        /** Изменены имя или скоупы токена бота */
        val BOT_TOKEN_UPDATED = AuditEventKey("bot_token_updated")
        /** Отдельный токен бота перевыпущен */
        val BOT_TOKEN_REISSUED = AuditEventKey("bot_token_reissued")
        /** Токен бота удалён */
        val BOT_TOKEN_DELETED = AuditEventKey("bot_token_deleted")
        /** Пользователь выдал OAuth-клиенту доступ к своим данным */
        val OAUTH_AUTHORIZATION_GRANTED = AuditEventKey("oauth_authorization_granted")
        /** Доступ OAuth-клиента к данным пользователя отозван */
        val OAUTH_AUTHORIZATION_REVOKED = AuditEventKey("oauth_authorization_revoked")
        /** OAuth-клиент отозвал выданный ему токен */
        val OAUTH_TOKEN_REVOKED = AuditEventKey("oauth_token_revoked")
        /** Сотрудник подтвердил вход приложения с устройства */
        val OAUTH_DEVICE_AUTHORIZATION_APPROVED = AuditEventKey("oauth_device_authorization_approved")
        /** Сотрудник отклонил вход приложения с устройства */
        val OAUTH_DEVICE_AUTHORIZATION_DENIED = AuditEventKey("oauth_device_authorization_denied")
        /** Видеозвонок начат */
        val VIDEO_CALL_STARTED = AuditEventKey("video_call_started")
        /** Видеозвонок завершён */
        val VIDEO_CALL_FINISHED = AuditEventKey("video_call_finished")
        /** Запись видеозвонка готова */
        val VIDEO_CALL_RECORDING_READY = AuditEventKey("video_call_recording_ready")
        /** Отключена интеграция с Exchange */
        val EXCHANGE_DISABLED = AuditEventKey("exchange_disabled")

        /** Every value this SDK version lists */
        val entries: List<AuditEventKey> = listOf(USER_LOGIN, USER_LOGOUT, USER_2FA_FAIL, USER_2FA_SUCCESS, USER_2FA_DISABLED, LOGIN_GRANT_CREATED, LOGIN_GRANT_APPROVED, LOGIN_GRANT_DENIED, USER_CREATED, USER_DELETED, USER_ROLE_CHANGED, USER_UPDATED, TAG_CREATED, TAG_DELETED, USER_ADDED_TO_TAG, USER_REMOVED_FROM_TAG, CHAT_CREATED, CHAT_RENAMED, CHAT_PERMISSION_CHANGED, USER_CHAT_JOIN, USER_CHAT_LEAVE, TAG_ADDED_TO_CHAT, TAG_REMOVED_FROM_CHAT, MESSAGE_UPDATED, MESSAGE_DELETED, MESSAGE_CREATED, REACTION_CREATED, REACTION_DELETED, THREAD_CREATED, ACCESS_TOKEN_CREATED, ACCESS_TOKEN_UPDATED, ACCESS_TOKEN_DESTROY, KMS_ENCRYPT, KMS_DECRYPT, AUDIT_EVENTS_ACCESSED, COMPANY_CHATS_ACCESSED, COMPANY_BOTS_ACCESSED, DLP_VIOLATION_DETECTED, SEARCH_USERS_API, SEARCH_CHATS_API, SEARCH_MESSAGES_API, BOT_SCOPES_UPDATED, BOT_WEBHOOK_SETTINGS_UPDATED, BOT_TOKEN_RECREATED, BOT_DELETED, BOT_OAUTH_CLIENT_UPDATED, BOT_OAUTH_CLIENT_DISABLED, BOT_OAUTH_CLIENT_SECRET_ROTATED, BOT_OAUTH_CLIENT_SECRET_ISSUED, BOT_TOKEN_CREATED, BOT_TOKEN_UPDATED, BOT_TOKEN_REISSUED, BOT_TOKEN_DELETED, OAUTH_AUTHORIZATION_GRANTED, OAUTH_AUTHORIZATION_REVOKED, OAUTH_TOKEN_REVOKED, OAUTH_DEVICE_AUTHORIZATION_APPROVED, OAUTH_DEVICE_AUTHORIZATION_DENIED, VIDEO_CALL_STARTED, VIDEO_CALL_FINISHED, VIDEO_CALL_RECORDING_READY, EXCHANGE_DISABLED)

        /** The same values as an array, like `values()` of an enum class */
        fun values(): Array<AuditEventKey> = entries.toTypedArray()

        private val knownNames: Map<String, String> = mapOf("user_login" to "USER_LOGIN", "user_logout" to "USER_LOGOUT", "user_2fa_fail" to "USER_2FA_FAIL", "user_2fa_success" to "USER_2FA_SUCCESS", "user_2fa_disabled" to "USER_2FA_DISABLED", "login_grant_created" to "LOGIN_GRANT_CREATED", "login_grant_approved" to "LOGIN_GRANT_APPROVED", "login_grant_denied" to "LOGIN_GRANT_DENIED", "user_created" to "USER_CREATED", "user_deleted" to "USER_DELETED", "user_role_changed" to "USER_ROLE_CHANGED", "user_updated" to "USER_UPDATED", "tag_created" to "TAG_CREATED", "tag_deleted" to "TAG_DELETED", "user_added_to_tag" to "USER_ADDED_TO_TAG", "user_removed_from_tag" to "USER_REMOVED_FROM_TAG", "chat_created" to "CHAT_CREATED", "chat_renamed" to "CHAT_RENAMED", "chat_permission_changed" to "CHAT_PERMISSION_CHANGED", "user_chat_join" to "USER_CHAT_JOIN", "user_chat_leave" to "USER_CHAT_LEAVE", "tag_added_to_chat" to "TAG_ADDED_TO_CHAT", "tag_removed_from_chat" to "TAG_REMOVED_FROM_CHAT", "message_updated" to "MESSAGE_UPDATED", "message_deleted" to "MESSAGE_DELETED", "message_created" to "MESSAGE_CREATED", "reaction_created" to "REACTION_CREATED", "reaction_deleted" to "REACTION_DELETED", "thread_created" to "THREAD_CREATED", "access_token_created" to "ACCESS_TOKEN_CREATED", "access_token_updated" to "ACCESS_TOKEN_UPDATED", "access_token_destroy" to "ACCESS_TOKEN_DESTROY", "kms_encrypt" to "KMS_ENCRYPT", "kms_decrypt" to "KMS_DECRYPT", "audit_events_accessed" to "AUDIT_EVENTS_ACCESSED", "company_chats_accessed" to "COMPANY_CHATS_ACCESSED", "company_bots_accessed" to "COMPANY_BOTS_ACCESSED", "dlp_violation_detected" to "DLP_VIOLATION_DETECTED", "search_users_api" to "SEARCH_USERS_API", "search_chats_api" to "SEARCH_CHATS_API", "search_messages_api" to "SEARCH_MESSAGES_API", "bot_scopes_updated" to "BOT_SCOPES_UPDATED", "bot_webhook_settings_updated" to "BOT_WEBHOOK_SETTINGS_UPDATED", "bot_token_recreated" to "BOT_TOKEN_RECREATED", "bot_deleted" to "BOT_DELETED", "bot_oauth_client_updated" to "BOT_OAUTH_CLIENT_UPDATED", "bot_oauth_client_disabled" to "BOT_OAUTH_CLIENT_DISABLED", "bot_oauth_client_secret_rotated" to "BOT_OAUTH_CLIENT_SECRET_ROTATED", "bot_oauth_client_secret_issued" to "BOT_OAUTH_CLIENT_SECRET_ISSUED", "bot_token_created" to "BOT_TOKEN_CREATED", "bot_token_updated" to "BOT_TOKEN_UPDATED", "bot_token_reissued" to "BOT_TOKEN_REISSUED", "bot_token_deleted" to "BOT_TOKEN_DELETED", "oauth_authorization_granted" to "OAUTH_AUTHORIZATION_GRANTED", "oauth_authorization_revoked" to "OAUTH_AUTHORIZATION_REVOKED", "oauth_token_revoked" to "OAUTH_TOKEN_REVOKED", "oauth_device_authorization_approved" to "OAUTH_DEVICE_AUTHORIZATION_APPROVED", "oauth_device_authorization_denied" to "OAUTH_DEVICE_AUTHORIZATION_DENIED", "video_call_started" to "VIDEO_CALL_STARTED", "video_call_finished" to "VIDEO_CALL_FINISHED", "video_call_recording_ready" to "VIDEO_CALL_RECORDING_READY", "exchange_disabled" to "EXCHANGE_DISABLED")

        fun valueOf(name: String): AuditEventKey =
            entries.firstOrNull { it.name == name } ?: throw IllegalArgumentException("No AuditEventKey constant $name")
    }
}

/** Причина отказа во входе по QR-коду */
@Serializable
@JvmInline
value class AuditLoginGrantDenyReason(val value: String) {
    /** Whether this SDK version lists the value */
    val isKnown: Boolean get() = value in knownNames
    /** Constant name of a listed value, the raw value otherwise */
    val name: String get() = knownNames[value] ?: value
    override fun toString(): String = value

    companion object {
        /** Сотрудник отклонил вход */
        val DENIED = AuditLoginGrantDenyReason("denied")
        /** Сотрудник ввёл не те цифры, что показало устройство */
        val VERIFICATION_FAILED = AuditLoginGrantDenyReason("verification_failed")

        /** Every value this SDK version lists */
        val entries: List<AuditLoginGrantDenyReason> = listOf(DENIED, VERIFICATION_FAILED)

        /** The same values as an array, like `values()` of an enum class */
        fun values(): Array<AuditLoginGrantDenyReason> = entries.toTypedArray()

        private val knownNames: Map<String, String> = mapOf("denied" to "DENIED", "verification_failed" to "VERIFICATION_FAILED")

        fun valueOf(name: String): AuditLoginGrantDenyReason =
            entries.firstOrNull { it.name == name } ?: throw IllegalArgumentException("No AuditLoginGrantDenyReason constant $name")
    }
}

/** Платформа мобильного приложения, в котором выполняется вход по QR-коду */
@Serializable
@JvmInline
value class AuditLoginGrantDevicePlatform(val value: String) {
    /** Whether this SDK version lists the value */
    val isKnown: Boolean get() = value in knownNames
    /** Constant name of a listed value, the raw value otherwise */
    val name: String get() = knownNames[value] ?: value
    override fun toString(): String = value

    companion object {
        /** Приложение для iOS */
        val IOS = AuditLoginGrantDevicePlatform("iOS")
        /** Приложение для Android */
        val ANDROID = AuditLoginGrantDevicePlatform("Android")
        /** Приложение для Android из RuStore */
        val RUSTORE = AuditLoginGrantDevicePlatform("Rustore")
        /** Приложение для Android из AppGallery */
        val APPGALLERY = AuditLoginGrantDevicePlatform("Appgallery")

        /** Every value this SDK version lists */
        val entries: List<AuditLoginGrantDevicePlatform> = listOf(IOS, ANDROID, RUSTORE, APPGALLERY)

        /** The same values as an array, like `values()` of an enum class */
        fun values(): Array<AuditLoginGrantDevicePlatform> = entries.toTypedArray()

        private val knownNames: Map<String, String> = mapOf("iOS" to "IOS", "Android" to "ANDROID", "Rustore" to "RUSTORE", "Appgallery" to "APPGALLERY")

        fun valueOf(name: String): AuditLoginGrantDevicePlatform =
            entries.firstOrNull { it.name == name } ?: throw IllegalArgumentException("No AuditLoginGrantDevicePlatform constant $name")
    }
}

/** Роль, которой разрешено редактировать настройки бота */
@Serializable
@JvmInline
value class BotCanEdit(val value: String) {
    /** Whether this SDK version lists the value */
    val isKnown: Boolean get() = value in knownNames
    /** Constant name of a listed value, the raw value otherwise */
    val name: String get() = knownNames[value] ?: value
    override fun toString(): String = value

    companion object {
        /** Администраторы компании */
        val ADMIN = BotCanEdit("admin")
        /** Владельцы чатов, в которые добавлен бот */
        val CHAT_OWNERS = BotCanEdit("chat_owners")

        /** Every value this SDK version lists */
        val entries: List<BotCanEdit> = listOf(ADMIN, CHAT_OWNERS)

        /** The same values as an array, like `values()` of an enum class */
        fun values(): Array<BotCanEdit> = entries.toTypedArray()

        private val knownNames: Map<String, String> = mapOf("admin" to "ADMIN", "chat_owners" to "CHAT_OWNERS")

        fun valueOf(name: String): BotCanEdit =
            entries.firstOrNull { it.name == name } ?: throw IllegalArgumentException("No BotCanEdit constant $name")
    }
}

/** Событие исходящего вебхука бота */
@Serializable
@JvmInline
value class BotEventName(val value: String) {
    /** Whether this SDK version lists the value */
    val isKnown: Boolean get() = value in knownNames
    /** Constant name of a listed value, the raw value otherwise */
    val name: String get() = knownNames[value] ?: value
    override fun toString(): String = value

    companion object {
        /** Новое сообщение */
        val MESSAGE_NEW = BotEventName("message_new")
        /** Сообщение отредактировано */
        val MESSAGE_UPDATE = BotEventName("message_update")
        /** Сообщение удалено */
        val MESSAGE_DELETE = BotEventName("message_delete")
        /** Добавлена реакция */
        val REACTION_NEW = BotEventName("reaction_new")
        /** Реакция удалена */
        val REACTION_DELETE = BotEventName("reaction_delete")
        /** Нажата кнопка */
        val BUTTON_CLICK = BotEventName("button_click")
        /** В сообщении отправлена ссылка (для unfurl) */
        val MESSAGE_LINK_SHARED = BotEventName("message_link_shared")
        /** Участник добавлен в чат */
        val CHAT_MEMBER_ADD = BotEventName("chat_member_add")
        /** Участник удалён из чата */
        val CHAT_MEMBER_REMOVE = BotEventName("chat_member_remove")
        /** Сотрудник приглашён в компанию */
        val COMPANY_MEMBER_INVITE = BotEventName("company_member_invite")
        /** Сотрудник подтвердил приглашение */
        val COMPANY_MEMBER_CONFIRM = BotEventName("company_member_confirm")
        /** Сотрудник деактивирован */
        val COMPANY_MEMBER_SUSPEND = BotEventName("company_member_suspend")
        /** Сотрудник активирован */
        val COMPANY_MEMBER_ACTIVATE = BotEventName("company_member_activate")
        /** Сотрудник удалён из компании */
        val COMPANY_MEMBER_DELETE = BotEventName("company_member_delete")
        /** Данные сотрудника изменены */
        val COMPANY_MEMBER_UPDATE = BotEventName("company_member_update")
        /** Видеозвонок начался */
        val VIDEO_CALL_STARTED = BotEventName("video_call_started")
        /** Видеозвонок завершился */
        val VIDEO_CALL_FINISHED = BotEventName("video_call_finished")
        /** Запись видеозвонка готова */
        val VIDEO_CALL_RECORDING_READY = BotEventName("video_call_recording_ready")

        /** Every value this SDK version lists */
        val entries: List<BotEventName> = listOf(MESSAGE_NEW, MESSAGE_UPDATE, MESSAGE_DELETE, REACTION_NEW, REACTION_DELETE, BUTTON_CLICK, MESSAGE_LINK_SHARED, CHAT_MEMBER_ADD, CHAT_MEMBER_REMOVE, COMPANY_MEMBER_INVITE, COMPANY_MEMBER_CONFIRM, COMPANY_MEMBER_SUSPEND, COMPANY_MEMBER_ACTIVATE, COMPANY_MEMBER_DELETE, COMPANY_MEMBER_UPDATE, VIDEO_CALL_STARTED, VIDEO_CALL_FINISHED, VIDEO_CALL_RECORDING_READY)

        /** The same values as an array, like `values()` of an enum class */
        fun values(): Array<BotEventName> = entries.toTypedArray()

        private val knownNames: Map<String, String> = mapOf("message_new" to "MESSAGE_NEW", "message_update" to "MESSAGE_UPDATE", "message_delete" to "MESSAGE_DELETE", "reaction_new" to "REACTION_NEW", "reaction_delete" to "REACTION_DELETE", "button_click" to "BUTTON_CLICK", "message_link_shared" to "MESSAGE_LINK_SHARED", "chat_member_add" to "CHAT_MEMBER_ADD", "chat_member_remove" to "CHAT_MEMBER_REMOVE", "company_member_invite" to "COMPANY_MEMBER_INVITE", "company_member_confirm" to "COMPANY_MEMBER_CONFIRM", "company_member_suspend" to "COMPANY_MEMBER_SUSPEND", "company_member_activate" to "COMPANY_MEMBER_ACTIVATE", "company_member_delete" to "COMPANY_MEMBER_DELETE", "company_member_update" to "COMPANY_MEMBER_UPDATE", "video_call_started" to "VIDEO_CALL_STARTED", "video_call_finished" to "VIDEO_CALL_FINISHED", "video_call_recording_ready" to "VIDEO_CALL_RECORDING_READY")

        fun valueOf(name: String): BotEventName =
            entries.firstOrNull { it.name == name } ?: throw IllegalArgumentException("No BotEventName constant $name")
    }
}

/** Шаблонизатор для форматирования входящих вебхуков */
@Serializable
@JvmInline
value class BotTemplateEngine(val value: String) {
    /** Whether this SDK version lists the value */
    val isKnown: Boolean get() = value in knownNames
    /** Constant name of a listed value, the raw value otherwise */
    val name: String get() = knownNames[value] ?: value
    override fun toString(): String = value

    companion object {
        /** Liquid — условия, циклы и фильтры */
        val LIQUID = BotTemplateEngine("liquid")
        /** Mustache — простая подстановка без логики */
        val MUSTACHE = BotTemplateEngine("mustache")

        /** Every value this SDK version lists */
        val entries: List<BotTemplateEngine> = listOf(LIQUID, MUSTACHE)

        /** The same values as an array, like `values()` of an enum class */
        fun values(): Array<BotTemplateEngine> = entries.toTypedArray()

        private val knownNames: Map<String, String> = mapOf("liquid" to "LIQUID", "mustache" to "MUSTACHE")

        fun valueOf(name: String): BotTemplateEngine =
            entries.firstOrNull { it.name == name } ?: throw IllegalArgumentException("No BotTemplateEngine constant $name")
    }
}

/** Условие срабатывания исходящего вебхука бота */
@Serializable
@JvmInline
value class BotTriggerOn(val value: String) {
    /** Whether this SDK version lists the value */
    val isKnown: Boolean get() = value in knownNames
    /** Constant name of a listed value, the raw value otherwise */
    val name: String get() = knownNames[value] ?: value
    override fun toString(): String = value

    companion object {
        /** Только на команды (триггер-слова) из commands */
        val COMMANDS = BotTriggerOn("commands")
        /** На все сообщения в чатах, где есть бот */
        val ALL_MESSAGES = BotTriggerOn("all_messages")
        /** На развёртывание ссылок (link previews) */
        val UNFURL = BotTriggerOn("unfurl")

        /** Every value this SDK version lists */
        val entries: List<BotTriggerOn> = listOf(COMMANDS, ALL_MESSAGES, UNFURL)

        /** The same values as an array, like `values()` of an enum class */
        fun values(): Array<BotTriggerOn> = entries.toTypedArray()

        private val knownNames: Map<String, String> = mapOf("commands" to "COMMANDS", "all_messages" to "ALL_MESSAGES", "unfurl" to "UNFURL")

        fun valueOf(name: String): BotTriggerOn =
            entries.firstOrNull { it.name == name } ?: throw IllegalArgumentException("No BotTriggerOn constant $name")
    }
}

/** Источник входящего вебхука бота */
@Serializable
@JvmInline
value class BotWebhookKind(val value: String) {
    /** Whether this SDK version lists the value */
    val isKnown: Boolean get() = value in knownNames
    /** Constant name of a listed value, the raw value otherwise */
    val name: String get() = knownNames[value] ?: value
    override fun toString(): String = value

    companion object {
        /** Свой формат: сообщение собирается из тела запроса по шаблону бота */
        val SIMPLE = BotWebhookKind("simple")
        /** GitLab: Пачка сама разбирает запрос и собирает сообщение */
        val GITLAB = BotWebhookKind("gitlab")
        /** Grafana: Пачка сама разбирает запрос и собирает сообщение */
        val GRAFANA = BotWebhookKind("grafana")

        /** Every value this SDK version lists */
        val entries: List<BotWebhookKind> = listOf(SIMPLE, GITLAB, GRAFANA)

        /** The same values as an array, like `values()` of an enum class */
        fun values(): Array<BotWebhookKind> = entries.toTypedArray()

        private val knownNames: Map<String, String> = mapOf("simple" to "SIMPLE", "gitlab" to "GITLAB", "grafana" to "GRAFANA")

        fun valueOf(name: String): BotWebhookKind =
            entries.firstOrNull { it.name == name } ?: throw IllegalArgumentException("No BotWebhookKind constant $name")
    }
}

/** Кто может добавлять бота в чаты */
@Serializable
@JvmInline
value class BotWhoCanAdd(val value: String) {
    /** Whether this SDK version lists the value */
    val isKnown: Boolean get() = value in knownNames
    /** Constant name of a listed value, the raw value otherwise */
    val name: String get() = knownNames[value] ?: value
    override fun toString(): String = value

    companion object {
        /** Только создатель бота */
        val CREATOR = BotWhoCanAdd("creator")
        /** Создатель и администраторы компании */
        val CREATOR_ADMIN = BotWhoCanAdd("creator_admin")
        /** Создатель, администраторы и участники компании */
        val CREATOR_ADMIN_USER = BotWhoCanAdd("creator_admin_user")
        /** Публичный бот: добавить его может любой сотрудник, кроме гостей и мульти-гостей */
        val ANYONE = BotWhoCanAdd("anyone")

        /** Every value this SDK version lists */
        val entries: List<BotWhoCanAdd> = listOf(CREATOR, CREATOR_ADMIN, CREATOR_ADMIN_USER, ANYONE)

        /** The same values as an array, like `values()` of an enum class */
        fun values(): Array<BotWhoCanAdd> = entries.toTypedArray()

        private val knownNames: Map<String, String> = mapOf("creator" to "CREATOR", "creator_admin" to "CREATOR_ADMIN", "creator_admin_user" to "CREATOR_ADMIN_USER", "anyone" to "ANYONE")

        fun valueOf(name: String): BotWhoCanAdd =
            entries.firstOrNull { it.name == name } ?: throw IllegalArgumentException("No BotWhoCanAdd constant $name")
    }
}

/** Состояние чатов в выборке */
@Serializable
enum class ChatActivity(val value: String) {
    /** Только активные чаты */
    @SerialName("active") ACTIVE("active"),
    /** Только архивные чаты */
    @SerialName("archived") ARCHIVED("archived"),
}

/** Доступность чатов для пользователя */
@Serializable
enum class ChatAvailability(val value: String) {
    /** Чаты, где пользователь является участником */
    @SerialName("is_member") IS_MEMBER("is_member"),
    /** Все открытые чаты компании, вне зависимости от участия в них пользователя */
    @SerialName("public") PUBLIC("public"),
}

/** Роль участника чата */
@Serializable
enum class ChatMemberRole(val value: String) {
    /** Админ */
    @SerialName("admin") ADMIN("admin"),
    /** Редактор (доступно только для каналов) */
    @SerialName("editor") EDITOR("editor"),
    /** Участник или подписчик */
    @SerialName("member") MEMBER("member"),
}

/** Роль участника чата (с фильтром все) */
@Serializable
enum class ChatMemberRoleFilter(val value: String) {
    /** Любая роль */
    @SerialName("all") ALL("all"),
    /** Создатель */
    @SerialName("owner") OWNER("owner"),
    /** Админ */
    @SerialName("admin") ADMIN("admin"),
    /** Редактор */
    @SerialName("editor") EDITOR("editor"),
    /** Участник/подписчик */
    @SerialName("member") MEMBER("member"),
}

/** Поле сортировки чатов */
@Serializable
enum class ChatSortField(val value: String) {
    /** По идентификатору чата */
    @SerialName("id") ID("id"),
    /** По дате и времени создания последнего сообщения */
    @SerialName("last_message_at") LAST_MESSAGE_AT("last_message_at"),
}

/** Тип чата */
@Serializable
enum class ChatSubtype(val value: String) {
    /** Канал или беседа */
    @SerialName("discussion") DISCUSSION("discussion"),
    /** Тред */
    @SerialName("thread") THREAD("thread"),
}

/** Тип данных дополнительного поля */
@Serializable
@JvmInline
value class CustomPropertyDataType(val value: String) {
    /** Whether this SDK version lists the value */
    val isKnown: Boolean get() = value in knownNames
    /** Constant name of a listed value, the raw value otherwise */
    val name: String get() = knownNames[value] ?: value
    override fun toString(): String = value

    companion object {
        /** Строковое значение */
        val STRING = CustomPropertyDataType("string")
        /** Числовое значение */
        val NUMBER = CustomPropertyDataType("number")
        /** Дата */
        val DATE = CustomPropertyDataType("date")
        /** Ссылка */
        val LINK = CustomPropertyDataType("link")

        /** Every value this SDK version lists */
        val entries: List<CustomPropertyDataType> = listOf(STRING, NUMBER, DATE, LINK)

        /** The same values as an array, like `values()` of an enum class */
        fun values(): Array<CustomPropertyDataType> = entries.toTypedArray()

        private val knownNames: Map<String, String> = mapOf("string" to "STRING", "number" to "NUMBER", "date" to "DATE", "link" to "LINK")

        fun valueOf(name: String): CustomPropertyDataType =
            entries.firstOrNull { it.name == name } ?: throw IllegalArgumentException("No CustomPropertyDataType constant $name")
    }
}

/** Периодичность повтора отложенного сообщения */
@Serializable
@JvmInline
value class DraftRepetitionInterval(val value: String) {
    /** Whether this SDK version lists the value */
    val isKnown: Boolean get() = value in knownNames
    /** Constant name of a listed value, the raw value otherwise */
    val name: String get() = knownNames[value] ?: value
    override fun toString(): String = value

    companion object {
        /** Один раз */
        val ONCE = DraftRepetitionInterval("once")
        /** Каждый день */
        val DAILY = DraftRepetitionInterval("daily")
        /** Каждую неделю */
        val WEEKLY = DraftRepetitionInterval("weekly")
        /** Каждый месяц */
        val MONTHLY = DraftRepetitionInterval("monthly")
        /** Раз в два месяца */
        val EVERY_2_MONTHS = DraftRepetitionInterval("every_2_months")
        /** Раз в три месяца */
        val EVERY_3_MONTHS = DraftRepetitionInterval("every_3_months")
        /** Раз в четыре месяца */
        val EVERY_4_MONTHS = DraftRepetitionInterval("every_4_months")
        /** Раз в полгода */
        val EVERY_6_MONTHS = DraftRepetitionInterval("every_6_months")
        /** Раз в год */
        val YEARLY = DraftRepetitionInterval("yearly")

        /** Every value this SDK version lists */
        val entries: List<DraftRepetitionInterval> = listOf(ONCE, DAILY, WEEKLY, MONTHLY, EVERY_2_MONTHS, EVERY_3_MONTHS, EVERY_4_MONTHS, EVERY_6_MONTHS, YEARLY)

        /** The same values as an array, like `values()` of an enum class */
        fun values(): Array<DraftRepetitionInterval> = entries.toTypedArray()

        private val knownNames: Map<String, String> = mapOf("once" to "ONCE", "daily" to "DAILY", "weekly" to "WEEKLY", "monthly" to "MONTHLY", "every_2_months" to "EVERY_2_MONTHS", "every_3_months" to "EVERY_3_MONTHS", "every_4_months" to "EVERY_4_MONTHS", "every_6_months" to "EVERY_6_MONTHS", "yearly" to "YEARLY")

        fun valueOf(name: String): DraftRepetitionInterval =
            entries.firstOrNull { it.name == name } ?: throw IllegalArgumentException("No DraftRepetitionInterval constant $name")
    }
}

/** Что возвращать в списке черновиков */
@Serializable
enum class DraftType(val value: String) {
    /** Обычные черновики */
    @SerialName("regular") REGULAR("regular"),
    /** Отложенные сообщения */
    @SerialName("scheduled") SCHEDULED("scheduled"),
    /** И черновики, и отложенные сообщения */
    @SerialName("all") ALL("all"),
}

/** Что отдать вместо исходного файла */
@Serializable
enum class FileTarget(val value: String) {
    /** Документ, переведённый в PDF */
    @SerialName("pdf_preview") PDF_PREVIEW("pdf_preview"),
    /** Первая страница документа картинкой */
    @SerialName("pdf_first_page") PDF_FIRST_PAGE("pdf_first_page"),
    /** Уменьшенная копия изображения */
    @SerialName("thumb") THUMB("thumb"),
    /** Изображение как есть */
    @SerialName("image") IMAGE("image"),
}

/** Тип файла */
@Serializable
@JvmInline
value class FileType(val value: String) {
    /** Whether this SDK version lists the value */
    val isKnown: Boolean get() = value in knownNames
    /** Constant name of a listed value, the raw value otherwise */
    val name: String get() = knownNames[value] ?: value
    override fun toString(): String = value

    companion object {
        /** Обычный файл */
        val FILE = FileType("file")
        /** Изображение */
        val IMAGE = FileType("image")
        /** Аудиофайл */
        val AUDIO = FileType("audio")
        /** Голосовое сообщение */
        val VOICE = FileType("voice")
        /** Видеофайл */
        val VIDEO = FileType("video")

        /** Every value this SDK version lists */
        val entries: List<FileType> = listOf(FILE, IMAGE, AUDIO, VOICE, VIDEO)

        /** The same values as an array, like `values()` of an enum class */
        fun values(): Array<FileType> = entries.toTypedArray()

        private val knownNames: Map<String, String> = mapOf("file" to "FILE", "image" to "IMAGE", "audio" to "AUDIO", "voice" to "VOICE", "video" to "VIDEO")

        fun valueOf(name: String): FileType =
            entries.firstOrNull { it.name == name } ?: throw IllegalArgumentException("No FileType constant $name")
    }
}

/** Статус приглашения пользователя */
@Serializable
@JvmInline
value class InviteStatus(val value: String) {
    /** Whether this SDK version lists the value */
    val isKnown: Boolean get() = value in knownNames
    /** Constant name of a listed value, the raw value otherwise */
    val name: String get() = knownNames[value] ?: value
    override fun toString(): String = value

    companion object {
        /** Принято */
        val CONFIRMED = InviteStatus("confirmed")
        /** Отправлено */
        val SENT = InviteStatus("sent")

        /** Every value this SDK version lists */
        val entries: List<InviteStatus> = listOf(CONFIRMED, SENT)

        /** The same values as an array, like `values()` of an enum class */
        fun values(): Array<InviteStatus> = entries.toTypedArray()

        private val knownNames: Map<String, String> = mapOf("confirmed" to "CONFIRMED", "sent" to "SENT")

        fun valueOf(name: String): InviteStatus =
            entries.firstOrNull { it.name == name } ?: throw IllegalArgumentException("No InviteStatus constant $name")
    }
}

/** Тип события webhook для участников */
@Serializable
@JvmInline
value class MemberEventType(val value: String) {
    /** Whether this SDK version lists the value */
    val isKnown: Boolean get() = value in knownNames
    /** Constant name of a listed value, the raw value otherwise */
    val name: String get() = knownNames[value] ?: value
    override fun toString(): String = value

    companion object {
        /** Добавление */
        val ADD = MemberEventType("add")
        /** Удаление */
        val REMOVE = MemberEventType("remove")

        /** Every value this SDK version lists */
        val entries: List<MemberEventType> = listOf(ADD, REMOVE)

        /** The same values as an array, like `values()` of an enum class */
        fun values(): Array<MemberEventType> = entries.toTypedArray()

        private val knownNames: Map<String, String> = mapOf("add" to "ADD", "remove" to "REMOVE")

        fun valueOf(name: String): MemberEventType =
            entries.firstOrNull { it.name == name } ?: throw IllegalArgumentException("No MemberEventType constant $name")
    }
}

/** Тип сущности для сообщений */
@Serializable
@JvmInline
value class MessageEntityType(val value: String) {
    /** Whether this SDK version lists the value */
    val isKnown: Boolean get() = value in knownNames
    /** Constant name of a listed value, the raw value otherwise */
    val name: String get() = knownNames[value] ?: value
    override fun toString(): String = value

    companion object {
        /** Беседа или канал */
        val DISCUSSION = MessageEntityType("discussion")
        /** Тред */
        val THREAD = MessageEntityType("thread")
        /** Пользователь */
        val USER = MessageEntityType("user")

        /** Every value this SDK version lists */
        val entries: List<MessageEntityType> = listOf(DISCUSSION, THREAD, USER)

        /** The same values as an array, like `values()` of an enum class */
        fun values(): Array<MessageEntityType> = entries.toTypedArray()

        private val knownNames: Map<String, String> = mapOf("discussion" to "DISCUSSION", "thread" to "THREAD", "user" to "USER")

        fun valueOf(name: String): MessageEntityType =
            entries.firstOrNull { it.name == name } ?: throw IllegalArgumentException("No MessageEntityType constant $name")
    }
}

/** Сортировка результатов поиска сообщений */
@Serializable
enum class MessageSearchSort(val value: String) {
    /** По дате создания (хронология) */
    @SerialName("created_at") CREATED_AT("created_at"),
    /** По релевантности */
    @SerialName("relevance") RELEVANCE("relevance"),
}

@Serializable
enum class MessageSortField(val value: String) {
    /** По идентификатору сообщения */
    @SerialName("id") ID("id"),
}

/** Код ошибки OAuth */
@Serializable
@JvmInline
value class OAuthErrorCode(val value: String) {
    /** Whether this SDK version lists the value */
    val isKnown: Boolean get() = value in knownNames
    /** Constant name of a listed value, the raw value otherwise */
    val name: String get() = knownNames[value] ?: value
    override fun toString(): String = value

    companion object {
        /** Токен не передан, не найден, истёк или отозван */
        val INVALID_TOKEN = OAuthErrorCode("invalid_token")
        /** У токена нет скоупа, который нужен методу */
        val INSUFFICIENT_SCOPE = OAuthErrorCode("insufficient_scope")
        /** Скоуп у токена есть, но роль его владельца не позволяет действие */
        val ROLE_FORBIDDEN = OAuthErrorCode("role_forbidden")
        /** В запросе нет обязательного параметра или он передан неверно */
        val INVALID_REQUEST = OAuthErrorCode("invalid_request")
        /** Неверный `client_id` или `client_secret` */
        val INVALID_CLIENT = OAuthErrorCode("invalid_client")
        /** Код истёк, уже использован, выдан для другого `redirect_uri` или не подходит `code_verifier` */
        val INVALID_GRANT = OAuthErrorCode("invalid_grant")
        /** Значение `grant_type` не поддерживается */
        val UNSUPPORTED_GRANT_TYPE = OAuthErrorCode("unsupported_grant_type")
        /** Токен выдан другому боту или клиент не подтвердил себя */
        val UNAUTHORIZED_CLIENT = OAuthErrorCode("unauthorized_client")

        /** Every value this SDK version lists */
        val entries: List<OAuthErrorCode> = listOf(INVALID_TOKEN, INSUFFICIENT_SCOPE, ROLE_FORBIDDEN, INVALID_REQUEST, INVALID_CLIENT, INVALID_GRANT, UNSUPPORTED_GRANT_TYPE, UNAUTHORIZED_CLIENT)

        /** The same values as an array, like `values()` of an enum class */
        fun values(): Array<OAuthErrorCode> = entries.toTypedArray()

        private val knownNames: Map<String, String> = mapOf("invalid_token" to "INVALID_TOKEN", "insufficient_scope" to "INSUFFICIENT_SCOPE", "role_forbidden" to "ROLE_FORBIDDEN", "invalid_request" to "INVALID_REQUEST", "invalid_client" to "INVALID_CLIENT", "invalid_grant" to "INVALID_GRANT", "unsupported_grant_type" to "UNSUPPORTED_GRANT_TYPE", "unauthorized_client" to "UNAUTHORIZED_CLIENT")

        fun valueOf(name: String): OAuthErrorCode =
            entries.firstOrNull { it.name == name } ?: throw IllegalArgumentException("No OAuthErrorCode constant $name")
    }
}

/** Скоуп доступа OAuth токена */
@Serializable
@JvmInline
value class OAuthScope(val value: String) {
    /** Whether this SDK version lists the value */
    val isKnown: Boolean get() = value in knownNames
    /** Constant name of a listed value, the raw value otherwise */
    val name: String get() = knownNames[value] ?: value
    override fun toString(): String = value

    companion object {
        /** Просмотр чатов и списка чатов */
        val CHATS_READ = OAuthScope("chats:read")
        /** Создание новых чатов */
        val CHATS_CREATE = OAuthScope("chats:create")
        /** Изменение настроек чата */
        val CHATS_UPDATE = OAuthScope("chats:update")
        /** Отметка чатов непрочитанными */
        val CHATS_MARK_UNREAD = OAuthScope("chats:mark_unread")
        /** Архивация и разархивация чатов */
        val CHATS_ARCHIVE = OAuthScope("chats:archive")
        /** Выход из чатов */
        val CHATS_LEAVE = OAuthScope("chats:leave")
        /** Просмотр участников чата */
        val CHAT_MEMBERS_READ = OAuthScope("chat_members:read")
        /** Добавление, изменение и удаление участников чата */
        val CHAT_MEMBERS_WRITE = OAuthScope("chat_members:write")
        /** Скачивание экспортов чата */
        val CHAT_EXPORTS_READ = OAuthScope("chat_exports:read")
        /** Создание экспортов чата */
        val CHAT_EXPORTS_WRITE = OAuthScope("chat_exports:write")
        /** Просмотр сообщений в чатах */
        val MESSAGES_READ = OAuthScope("messages:read")
        /** Отправка сообщений */
        val MESSAGES_CREATE = OAuthScope("messages:create")
        /** Редактирование сообщений */
        val MESSAGES_UPDATE = OAuthScope("messages:update")
        /** Удаление сообщений */
        val MESSAGES_DELETE = OAuthScope("messages:delete")
        /** Просмотр реакций на сообщения */
        val REACTIONS_READ = OAuthScope("reactions:read")
        /** Добавление и удаление реакций */
        val REACTIONS_WRITE = OAuthScope("reactions:write")
        /** Закрепление и открепление сообщений */
        val PINS_WRITE = OAuthScope("pins:write")
        /** Просмотр тредов (комментариев) */
        val THREADS_READ = OAuthScope("threads:read")
        /** Создание тредов (комментариев) */
        val THREADS_CREATE = OAuthScope("threads:create")
        /** Unfurl (разворачивание ссылок) */
        val LINK_PREVIEWS_WRITE = OAuthScope("link_previews:write")
        /** Просмотр информации о сотрудниках и списка сотрудников */
        val USERS_READ = OAuthScope("users:read")
        /** Создание новых сотрудников */
        val USERS_CREATE = OAuthScope("users:create")
        /** Редактирование данных сотрудника */
        val USERS_UPDATE = OAuthScope("users:update")
        /** Удаление сотрудников */
        val USERS_DELETE = OAuthScope("users:delete")
        /** Просмотр тегов */
        val GROUP_TAGS_READ = OAuthScope("group_tags:read")
        /** Создание, редактирование и удаление тегов */
        val GROUP_TAGS_WRITE = OAuthScope("group_tags:write")
        /** Просмотр ботов */
        val BOTS_READ = OAuthScope("bots:read")
        /** Управление ботами */
        val BOTS_WRITE = OAuthScope("bots:write")
        /** Самостоятельное управление адресом вебхука бота */
        val BOT_SELF_WEBHOOK_WRITE = OAuthScope("bot_self:webhook:write")
        /** Самостоятельное управление настройками бота */
        val BOT_SELF_WRITE = OAuthScope("bot_self:write")
        /** Просмотр информации о своем профиле */
        val PROFILE_READ = OAuthScope("profile:read")
        /** Просмотр статуса профиля */
        val PROFILE_STATUS_READ = OAuthScope("profile_status:read")
        /** Изменение и удаление статуса профиля */
        val PROFILE_STATUS_WRITE = OAuthScope("profile_status:write")
        /** Изменение и удаление аватара профиля */
        val PROFILE_AVATAR_WRITE = OAuthScope("profile_avatar:write")
        /** Просмотр статуса сотрудника */
        val USER_STATUS_READ = OAuthScope("user_status:read")
        /** Изменение и удаление статуса сотрудника */
        val USER_STATUS_WRITE = OAuthScope("user_status:write")
        /** Изменение и удаление аватара сотрудника */
        val USER_AVATAR_WRITE = OAuthScope("user_avatar:write")
        /** Просмотр дополнительных полей */
        val CUSTOM_PROPERTIES_READ = OAuthScope("custom_properties:read")
        /** Просмотр журнала аудита */
        val AUDIT_EVENTS_READ = OAuthScope("audit_events:read")
        /** Просмотр списка всех чатов пространства */
        val COMPANY_CHATS_READ = OAuthScope("company_chats:read")
        /** Просмотр списка всех ботов пространства */
        val COMPANY_BOTS_READ = OAuthScope("company_bots:read")
        /** Просмотр задач */
        val TASKS_READ = OAuthScope("tasks:read")
        /** Создание задач */
        val TASKS_CREATE = OAuthScope("tasks:create")
        /** Изменение задачи */
        val TASKS_UPDATE = OAuthScope("tasks:update")
        /** Удаление задачи */
        val TASKS_DELETE = OAuthScope("tasks:delete")
        /** Скачивание файлов */
        val FILES_READ = OAuthScope("files:read")
        /** Загрузка файлов */
        val FILES_WRITE = OAuthScope("files:write")
        /** Получение данных для загрузки файлов */
        val UPLOADS_WRITE = OAuthScope("uploads:write")
        /** Открытие форм (представлений) */
        val VIEWS_WRITE = OAuthScope("views:write")
        /** Просмотр вебхуков */
        val WEBHOOKS_READ = OAuthScope("webhooks:read")
        /** Создание и управление вебхуками */
        val WEBHOOKS_WRITE = OAuthScope("webhooks:write")
        /** Просмотр лога вебхуков */
        val WEBHOOKS_EVENTS_READ = OAuthScope("webhooks:events:read")
        /** Удаление записи в логе вебхука */
        val WEBHOOKS_EVENTS_DELETE = OAuthScope("webhooks:events:delete")
        /** Поиск сотрудников */
        val SEARCH_USERS = OAuthScope("search:users")
        /** Поиск чатов */
        val SEARCH_CHATS = OAuthScope("search:chats")
        /** Поиск сообщений */
        val SEARCH_MESSAGES = OAuthScope("search:messages")
        /** Просмотр черновиков и отложенных сообщений */
        val DRAFTS_READ = OAuthScope("drafts:read")
        /** Создание, изменение и удаление черновиков и отложенных сообщений */
        val DRAFTS_WRITE = OAuthScope("drafts:write")
        /** Просмотр важных сообщений */
        val IMPORTANT_MESSAGES_READ = OAuthScope("important_messages:read")
        /** Добавление сообщений в важные и удаление из важных */
        val IMPORTANT_MESSAGES_WRITE = OAuthScope("important_messages:write")

        /** Every value this SDK version lists */
        val entries: List<OAuthScope> = listOf(CHATS_READ, CHATS_CREATE, CHATS_UPDATE, CHATS_MARK_UNREAD, CHATS_ARCHIVE, CHATS_LEAVE, CHAT_MEMBERS_READ, CHAT_MEMBERS_WRITE, CHAT_EXPORTS_READ, CHAT_EXPORTS_WRITE, MESSAGES_READ, MESSAGES_CREATE, MESSAGES_UPDATE, MESSAGES_DELETE, REACTIONS_READ, REACTIONS_WRITE, PINS_WRITE, THREADS_READ, THREADS_CREATE, LINK_PREVIEWS_WRITE, USERS_READ, USERS_CREATE, USERS_UPDATE, USERS_DELETE, GROUP_TAGS_READ, GROUP_TAGS_WRITE, BOTS_READ, BOTS_WRITE, BOT_SELF_WEBHOOK_WRITE, BOT_SELF_WRITE, PROFILE_READ, PROFILE_STATUS_READ, PROFILE_STATUS_WRITE, PROFILE_AVATAR_WRITE, USER_STATUS_READ, USER_STATUS_WRITE, USER_AVATAR_WRITE, CUSTOM_PROPERTIES_READ, AUDIT_EVENTS_READ, COMPANY_CHATS_READ, COMPANY_BOTS_READ, TASKS_READ, TASKS_CREATE, TASKS_UPDATE, TASKS_DELETE, FILES_READ, FILES_WRITE, UPLOADS_WRITE, VIEWS_WRITE, WEBHOOKS_READ, WEBHOOKS_WRITE, WEBHOOKS_EVENTS_READ, WEBHOOKS_EVENTS_DELETE, SEARCH_USERS, SEARCH_CHATS, SEARCH_MESSAGES, DRAFTS_READ, DRAFTS_WRITE, IMPORTANT_MESSAGES_READ, IMPORTANT_MESSAGES_WRITE)

        /** The same values as an array, like `values()` of an enum class */
        fun values(): Array<OAuthScope> = entries.toTypedArray()

        private val knownNames: Map<String, String> = mapOf("chats:read" to "CHATS_READ", "chats:create" to "CHATS_CREATE", "chats:update" to "CHATS_UPDATE", "chats:mark_unread" to "CHATS_MARK_UNREAD", "chats:archive" to "CHATS_ARCHIVE", "chats:leave" to "CHATS_LEAVE", "chat_members:read" to "CHAT_MEMBERS_READ", "chat_members:write" to "CHAT_MEMBERS_WRITE", "chat_exports:read" to "CHAT_EXPORTS_READ", "chat_exports:write" to "CHAT_EXPORTS_WRITE", "messages:read" to "MESSAGES_READ", "messages:create" to "MESSAGES_CREATE", "messages:update" to "MESSAGES_UPDATE", "messages:delete" to "MESSAGES_DELETE", "reactions:read" to "REACTIONS_READ", "reactions:write" to "REACTIONS_WRITE", "pins:write" to "PINS_WRITE", "threads:read" to "THREADS_READ", "threads:create" to "THREADS_CREATE", "link_previews:write" to "LINK_PREVIEWS_WRITE", "users:read" to "USERS_READ", "users:create" to "USERS_CREATE", "users:update" to "USERS_UPDATE", "users:delete" to "USERS_DELETE", "group_tags:read" to "GROUP_TAGS_READ", "group_tags:write" to "GROUP_TAGS_WRITE", "bots:read" to "BOTS_READ", "bots:write" to "BOTS_WRITE", "bot_self:webhook:write" to "BOT_SELF_WEBHOOK_WRITE", "bot_self:write" to "BOT_SELF_WRITE", "profile:read" to "PROFILE_READ", "profile_status:read" to "PROFILE_STATUS_READ", "profile_status:write" to "PROFILE_STATUS_WRITE", "profile_avatar:write" to "PROFILE_AVATAR_WRITE", "user_status:read" to "USER_STATUS_READ", "user_status:write" to "USER_STATUS_WRITE", "user_avatar:write" to "USER_AVATAR_WRITE", "custom_properties:read" to "CUSTOM_PROPERTIES_READ", "audit_events:read" to "AUDIT_EVENTS_READ", "company_chats:read" to "COMPANY_CHATS_READ", "company_bots:read" to "COMPANY_BOTS_READ", "tasks:read" to "TASKS_READ", "tasks:create" to "TASKS_CREATE", "tasks:update" to "TASKS_UPDATE", "tasks:delete" to "TASKS_DELETE", "files:read" to "FILES_READ", "files:write" to "FILES_WRITE", "uploads:write" to "UPLOADS_WRITE", "views:write" to "VIEWS_WRITE", "webhooks:read" to "WEBHOOKS_READ", "webhooks:write" to "WEBHOOKS_WRITE", "webhooks:events:read" to "WEBHOOKS_EVENTS_READ", "webhooks:events:delete" to "WEBHOOKS_EVENTS_DELETE", "search:users" to "SEARCH_USERS", "search:chats" to "SEARCH_CHATS", "search:messages" to "SEARCH_MESSAGES", "drafts:read" to "DRAFTS_READ", "drafts:write" to "DRAFTS_WRITE", "important_messages:read" to "IMPORTANT_MESSAGES_READ", "important_messages:write" to "IMPORTANT_MESSAGES_WRITE")

        fun valueOf(name: String): OAuthScope =
            entries.firstOrNull { it.name == name } ?: throw IllegalArgumentException("No OAuthScope constant $name")
    }
}

/** Что передано в запросе на отзыв токена */
@Serializable
enum class OAuthTokenTypeHint(val value: String) {
    /** Токен сотрудника */
    @SerialName("access_token") ACCESS_TOKEN("access_token"),
    /** Токен обновления */
    @SerialName("refresh_token") REFRESH_TOKEN("refresh_token"),
}

/** Тип события webhook для реакций */
@Serializable
@JvmInline
value class ReactionEventType(val value: String) {
    /** Whether this SDK version lists the value */
    val isKnown: Boolean get() = value in knownNames
    /** Constant name of a listed value, the raw value otherwise */
    val name: String get() = knownNames[value] ?: value
    override fun toString(): String = value

    companion object {
        /** Создание */
        val NEW = ReactionEventType("new")
        /** Удаление */
        val DELETE = ReactionEventType("delete")

        /** Every value this SDK version lists */
        val entries: List<ReactionEventType> = listOf(NEW, DELETE)

        /** The same values as an array, like `values()` of an enum class */
        fun values(): Array<ReactionEventType> = entries.toTypedArray()

        private val knownNames: Map<String, String> = mapOf("new" to "NEW", "delete" to "DELETE")

        fun valueOf(name: String): ReactionEventType =
            entries.firstOrNull { it.name == name } ?: throw IllegalArgumentException("No ReactionEventType constant $name")
    }
}

/** Тип сущности для поиска */
@Serializable
enum class SearchEntityType(val value: String) {
    /** Пользователь */
    @SerialName("User") USER("User"),
    /** Задача */
    @SerialName("Task") TASK("Task"),
}

/** Сортировка результатов поиска */
@Serializable
enum class SearchSortOrder(val value: String) {
    /** По релевантности */
    @SerialName("by_score") BY_SCORE("by_score"),
    /** По алфавиту */
    @SerialName("alphabetical") ALPHABETICAL("alphabetical"),
    /** По дате создания */
    @SerialName("creation") CREATION("creation"),
}

/** Порядок сортировки */
@Serializable
enum class SortOrder(val value: String) {
    /** По возрастанию */
    @SerialName("asc") ASC("asc"),
    /** По убыванию */
    @SerialName("desc") DESC("desc"),
}

/** Тип задачи */
@Serializable
@JvmInline
value class TaskKind(val value: String) {
    /** Whether this SDK version lists the value */
    val isKnown: Boolean get() = value in knownNames
    /** Constant name of a listed value, the raw value otherwise */
    val name: String get() = knownNames[value] ?: value
    override fun toString(): String = value

    companion object {
        /** Позвонить контакту */
        val CALL = TaskKind("call")
        /** Встреча */
        val MEETING = TaskKind("meeting")
        /** Простое напоминание */
        val REMINDER = TaskKind("reminder")
        /** Событие */
        val EVENT = TaskKind("event")
        /** Написать письмо */
        val EMAIL = TaskKind("email")

        /** Every value this SDK version lists */
        val entries: List<TaskKind> = listOf(CALL, MEETING, REMINDER, EVENT, EMAIL)

        /** The same values as an array, like `values()` of an enum class */
        fun values(): Array<TaskKind> = entries.toTypedArray()

        private val knownNames: Map<String, String> = mapOf("call" to "CALL", "meeting" to "MEETING", "reminder" to "REMINDER", "event" to "EVENT", "email" to "EMAIL")

        fun valueOf(name: String): TaskKind =
            entries.firstOrNull { it.name == name } ?: throw IllegalArgumentException("No TaskKind constant $name")
    }
}

/** Статус напоминания */
@Serializable
@JvmInline
value class TaskStatus(val value: String) {
    /** Whether this SDK version lists the value */
    val isKnown: Boolean get() = value in knownNames
    /** Constant name of a listed value, the raw value otherwise */
    val name: String get() = knownNames[value] ?: value
    override fun toString(): String = value

    companion object {
        /** Выполнено */
        val DONE = TaskStatus("done")
        /** Активно */
        val UNDONE = TaskStatus("undone")

        /** Every value this SDK version lists */
        val entries: List<TaskStatus> = listOf(DONE, UNDONE)

        /** The same values as an array, like `values()` of an enum class */
        fun values(): Array<TaskStatus> = entries.toTypedArray()

        private val knownNames: Map<String, String> = mapOf("done" to "DONE", "undone" to "UNDONE")

        fun valueOf(name: String): TaskStatus =
            entries.firstOrNull { it.name == name } ?: throw IllegalArgumentException("No TaskStatus constant $name")
    }
}

/** Роль пользователя, допустимая при создании сотрудника. Для роли `guest` параметр `chat_ids` обязателен и должен содержать ровно один чат. */
@Serializable
enum class UserCreateRole(val value: String) {
    /** Администратор */
    @SerialName("admin") ADMIN("admin"),
    /** Сотрудник */
    @SerialName("user") USER("user"),
    /** Мульти-гость */
    @SerialName("multi_guest") MULTI_GUEST("multi_guest"),
    /** Гость */
    @SerialName("guest") GUEST("guest"),
}

/** Тип события webhook для пользователей */
@Serializable
@JvmInline
value class UserEventType(val value: String) {
    /** Whether this SDK version lists the value */
    val isKnown: Boolean get() = value in knownNames
    /** Constant name of a listed value, the raw value otherwise */
    val name: String get() = knownNames[value] ?: value
    override fun toString(): String = value

    companion object {
        /** Приглашение */
        val INVITE = UserEventType("invite")
        /** Подтверждение */
        val CONFIRM = UserEventType("confirm")
        /** Обновление */
        val UPDATE = UserEventType("update")
        /** Приостановка */
        val SUSPEND = UserEventType("suspend")
        /** Активация */
        val ACTIVATE = UserEventType("activate")
        /** Удаление */
        val DELETE = UserEventType("delete")

        /** Every value this SDK version lists */
        val entries: List<UserEventType> = listOf(INVITE, CONFIRM, UPDATE, SUSPEND, ACTIVATE, DELETE)

        /** The same values as an array, like `values()` of an enum class */
        fun values(): Array<UserEventType> = entries.toTypedArray()

        private val knownNames: Map<String, String> = mapOf("invite" to "INVITE", "confirm" to "CONFIRM", "update" to "UPDATE", "suspend" to "SUSPEND", "activate" to "ACTIVATE", "delete" to "DELETE")

        fun valueOf(name: String): UserEventType =
            entries.firstOrNull { it.name == name } ?: throw IllegalArgumentException("No UserEventType constant $name")
    }
}

/** Роль пользователя в системе */
@Serializable
@JvmInline
value class UserRole(val value: String) {
    /** Whether this SDK version lists the value */
    val isKnown: Boolean get() = value in knownNames
    /** Constant name of a listed value, the raw value otherwise */
    val name: String get() = knownNames[value] ?: value
    override fun toString(): String = value

    companion object {
        /** Администратор */
        val ADMIN = UserRole("admin")
        /** Сотрудник */
        val USER = UserRole("user")
        /** Мульти-гость */
        val MULTI_GUEST = UserRole("multi_guest")
        /** Гость */
        val GUEST = UserRole("guest")

        /** Every value this SDK version lists */
        val entries: List<UserRole> = listOf(ADMIN, USER, MULTI_GUEST, GUEST)

        /** The same values as an array, like `values()` of an enum class */
        fun values(): Array<UserRole> = entries.toTypedArray()

        private val knownNames: Map<String, String> = mapOf("admin" to "ADMIN", "user" to "USER", "multi_guest" to "MULTI_GUEST", "guest" to "GUEST")

        fun valueOf(name: String): UserRole =
            entries.firstOrNull { it.name == name } ?: throw IllegalArgumentException("No UserRole constant $name")
    }
}

/** Роль пользователя, допустимая при редактировании сотрудника. Роль `guest` передают вместе с `chat_ids`, в котором ровно один чат. */
@Serializable
enum class UserRoleInput(val value: String) {
    /** Администратор */
    @SerialName("admin") ADMIN("admin"),
    /** Сотрудник */
    @SerialName("user") USER("user"),
    /** Мульти-гость */
    @SerialName("multi_guest") MULTI_GUEST("multi_guest"),
    /** Гость */
    @SerialName("guest") GUEST("guest"),
}

/** Коды ошибок валидации */
@Serializable
@JvmInline
value class ValidationErrorCode(val value: String) {
    /** Whether this SDK version lists the value */
    val isKnown: Boolean get() = value in knownNames
    /** Constant name of a listed value, the raw value otherwise */
    val name: String get() = knownNames[value] ?: value
    override fun toString(): String = value

    companion object {
        /** Обязательное поле (не может быть пустым) */
        val BLANK = ValidationErrorCode("blank")
        /** Слишком длинное значение (пояснения вы получите в поле message) */
        val TOO_LONG = ValidationErrorCode("too_long")
        /** Поле не соответствует правилам (пояснения вы получите в поле message) */
        val INVALID = ValidationErrorCode("invalid")
        /** Поле имеет непредусмотренное значение */
        val INCLUSION = ValidationErrorCode("inclusion")
        /** Поле имеет недопустимое значение */
        val EXCLUSION = ValidationErrorCode("exclusion")
        /** Название для этого поля уже существует */
        val TAKEN = ValidationErrorCode("taken")
        /** Emoji статуса не может содержать значения отличные от Emoji символа */
        val WRONG_EMOJI = ValidationErrorCode("wrong_emoji")
        /** Объект не найден */
        val NOT_FOUND = ValidationErrorCode("not_found")
        /** Объект с такими данными уже есть. Конфликтующее поле приходит в key, если его удалось определить */
        val ALREADY_EXISTS = ValidationErrorCode("already_exists")
        /** Ошибка личного чата (пояснения вы получите в поле message) */
        val PERSONAL_CHAT = ValidationErrorCode("personal_chat")
        /** Отображаемая ошибка (пояснения вы получите в поле message) */
        val DISPLAYED_ERROR = ValidationErrorCode("displayed_error")
        /** Действие запрещено */
        val NOT_AUTHORIZED = ValidationErrorCode("not_authorized")
        /** Выбран слишком большой диапазон дат */
        val INVALID_DATE_RANGE = ValidationErrorCode("invalid_date_range")
        /** Некорректный URL вебхука */
        val INVALID_WEBHOOK_URL = ValidationErrorCode("invalid_webhook_url")
        /** Достигнут лимит запросов */
        val RATE_LIMIT = ValidationErrorCode("rate_limit")
        /** Превышен лимит активных сотрудников. Больше не возвращается */
        val LICENSES_LIMIT = ValidationErrorCode("licenses_limit")
        /** Превышен лимит количества реакций, которые может добавить пользователь (20 уникальных реакций) */
        val USER_LIMIT = ValidationErrorCode("user_limit")
        /** Превышен лимит количества уникальных реакций, которые можно добавить на сообщение (30 уникальных реакций) */
        val UNIQUE_LIMIT = ValidationErrorCode("unique_limit")
        /** Превышен лимит количества реакций, которые можно добавить на сообщение (1000 реакций) */
        val GENERAL_LIMIT = ValidationErrorCode("general_limit")
        /** Запрос не выполнен: сбой на сервере или значение, которое сервер не смог разобрать, а текст в message всегда общий */
        val UNHANDLED = ValidationErrorCode("unhandled")
        /** Не удалось найти идентификатор события */
        val TRIGGER_NOT_FOUND = ValidationErrorCode("trigger_not_found")
        /** Время жизни идентификатора события истекло */
        val TRIGGER_EXPIRED = ValidationErrorCode("trigger_expired")
        /** Обязательный параметр не передан */
        val REQUIRED = ValidationErrorCode("required")
        /** Недопустимое значение (не входит в список допустимых) */
        val IN = ValidationErrorCode("in")
        /** Значение неприменимо в данном контексте (пояснения вы получите в поле message) */
        val NOT_APPLICABLE = ValidationErrorCode("not_applicable")
        /** Нельзя изменить свои собственные данные */
        val SELF_UPDATE = ValidationErrorCode("self_update")
        /** Нельзя изменить данные владельца */
        val OWNER_PROTECTED = ValidationErrorCode("owner_protected")
        /** Значение уже назначено */
        val ALREADY_ASSIGNED = ValidationErrorCode("already_assigned")
        /** Ближайшая отправка отложенного сообщения приходится на прошлое */
        val NEXT_SEND_AT_INVALID = ValidationErrorCode("next_send_at_invalid")
        /** Расписание отложенного сообщения не складывается в повтор */
        val SCHEDULE_INVALID = ValidationErrorCode("schedule_invalid")
        /** Расписание заканчивается раньше ближайшей отправки */
        val SCHEDULE_END_DATE_INVALID = ValidationErrorCode("schedule_end_date_invalid")
        /** Превышен лимит отложенных сообщений на чат (50) */
        val SCHEDULED_MESSAGES_LIMIT = ValidationErrorCode("scheduled_messages_limit")
        /** Отложенное сообщение нельзя превратить обратно в черновик */
        val DRAFT_TYPE_CHANGE_FORBIDDEN = ValidationErrorCode("draft_type_change_forbidden")
        /** Скачивание файла запрещено: нужен запрос из безопасного контура или в файле найден вирус */
        val CONFIDENTIAL_DOWNLOAD_DENIED = ValidationErrorCode("confidential_download_denied")
        /** Не удалось расшифровать файл */
        val DECRYPTION_FAILED = ValidationErrorCode("decryption_failed")
        /** Правило бота «Кто может добавлять бота в чаты» не разрешает вам добавить его: `id` таких ботов приходят в `value` */
        val BOT_ADD_DENIED = ValidationErrorCode("bot_add_denied")
        /** Бот с настройкой «Ограничить одним чатом» уже состоит в другой беседе или канале: `id` таких ботов приходят в `value` */
        val SINGLE_CHAT_BOT_OCCUPIED = ValidationErrorCode("single_chat_bot_occupied")
        /** Бота с настройкой «Ограничить одним чатом» нельзя добавить в тег */
        val SINGLE_CHAT_BOT_TAG_DENIED = ValidationErrorCode("single_chat_bot_tag_denied")
        /** В тег можно добавить только бота, которого может добавить в чат любой сотрудник */
        val RESTRICTED_BOT_TAG_DENIED = ValidationErrorCode("restricted_bot_tag_denied")
        /** Настройки бота изменились во время запроса: повторите его */
        val BOT_CHANGED_CONCURRENTLY = ValidationErrorCode("bot_changed_concurrently")
        /** Поиск не уложился по времени: сузьте запрос и повторите */
        val TIMEOUT = ValidationErrorCode("timeout")
        /** Бесплатное пространство исчерпало суточный лимит писем-приглашений: остаток и время сброса — в `payload` */
        val DAILY_INVITES_LIMIT = ValidationErrorCode("daily_invites_limit")
        /** Недостаточно прав для выполнения действия (пояснения вы получите в поле message) */
        val FORBIDDEN = ValidationErrorCode("forbidden")
        /** Доступ запрещён (недостаточно прав) */
        val PERMISSION_DENIED = ValidationErrorCode("permission_denied")
        /** Доступ запрещён */
        val ACCESS_DENIED = ValidationErrorCode("access_denied")
        /** Некорректные параметры запроса (пояснения вы получите в поле message) */
        val WRONG_PARAMS = ValidationErrorCode("wrong_params")
        /** Требуется оплата */
        val PAYMENT_REQUIRED = ValidationErrorCode("payment_required")
        /** Значение слишком короткое (пояснения вы получите в поле message) */
        val MIN_LENGTH = ValidationErrorCode("min_length")
        /** Значение слишком длинное (пояснения вы получите в поле message) */
        val MAX_LENGTH = ValidationErrorCode("max_length")
        /** Использовано зарезервированное системное слово (here, all) */
        val USE_OF_SYSTEM_WORDS = ValidationErrorCode("use_of_system_words")
        /** Файл экспорта не найден или ещё не готов */
        val EXPORT_FILE_NOT_FOUND = ValidationErrorCode("export_file_not_found")
        /** Нельзя исключить владельца чата */
        val CANNOT_KICK_OWNER = ValidationErrorCode("cannot_kick_owner")
        /** Не удалось закрепить сообщение */
        val PIN_FAILED = ValidationErrorCode("pin_failed")
        /** Сообщение удалено */
        val MESSAGE_DELETED = ValidationErrorCode("message_deleted")
        /** Нельзя создать тред для сообщения, которое уже находится в треде */
        val THREAD_MESSAGE = ValidationErrorCode("thread_message")
        /** Представление не найдено или принадлежит другому боту */
        val VIEW_NOT_FOUND = ValidationErrorCode("view_not_found")
        /** Время на ответ об отправке формы истекло или ответ уже был принят */
        val SUBMIT_EXPIRED = ValidationErrorCode("submit_expired")
        /** Сервис временно недоступен, повторите запрос */
        val SERVICE_UNAVAILABLE = ValidationErrorCode("service_unavailable")

        /** Every value this SDK version lists */
        val entries: List<ValidationErrorCode> = listOf(BLANK, TOO_LONG, INVALID, INCLUSION, EXCLUSION, TAKEN, WRONG_EMOJI, NOT_FOUND, ALREADY_EXISTS, PERSONAL_CHAT, DISPLAYED_ERROR, NOT_AUTHORIZED, INVALID_DATE_RANGE, INVALID_WEBHOOK_URL, RATE_LIMIT, LICENSES_LIMIT, USER_LIMIT, UNIQUE_LIMIT, GENERAL_LIMIT, UNHANDLED, TRIGGER_NOT_FOUND, TRIGGER_EXPIRED, REQUIRED, IN, NOT_APPLICABLE, SELF_UPDATE, OWNER_PROTECTED, ALREADY_ASSIGNED, NEXT_SEND_AT_INVALID, SCHEDULE_INVALID, SCHEDULE_END_DATE_INVALID, SCHEDULED_MESSAGES_LIMIT, DRAFT_TYPE_CHANGE_FORBIDDEN, CONFIDENTIAL_DOWNLOAD_DENIED, DECRYPTION_FAILED, BOT_ADD_DENIED, SINGLE_CHAT_BOT_OCCUPIED, SINGLE_CHAT_BOT_TAG_DENIED, RESTRICTED_BOT_TAG_DENIED, BOT_CHANGED_CONCURRENTLY, TIMEOUT, DAILY_INVITES_LIMIT, FORBIDDEN, PERMISSION_DENIED, ACCESS_DENIED, WRONG_PARAMS, PAYMENT_REQUIRED, MIN_LENGTH, MAX_LENGTH, USE_OF_SYSTEM_WORDS, EXPORT_FILE_NOT_FOUND, CANNOT_KICK_OWNER, PIN_FAILED, MESSAGE_DELETED, THREAD_MESSAGE, VIEW_NOT_FOUND, SUBMIT_EXPIRED, SERVICE_UNAVAILABLE)

        /** The same values as an array, like `values()` of an enum class */
        fun values(): Array<ValidationErrorCode> = entries.toTypedArray()

        private val knownNames: Map<String, String> = mapOf("blank" to "BLANK", "too_long" to "TOO_LONG", "invalid" to "INVALID", "inclusion" to "INCLUSION", "exclusion" to "EXCLUSION", "taken" to "TAKEN", "wrong_emoji" to "WRONG_EMOJI", "not_found" to "NOT_FOUND", "already_exists" to "ALREADY_EXISTS", "personal_chat" to "PERSONAL_CHAT", "displayed_error" to "DISPLAYED_ERROR", "not_authorized" to "NOT_AUTHORIZED", "invalid_date_range" to "INVALID_DATE_RANGE", "invalid_webhook_url" to "INVALID_WEBHOOK_URL", "rate_limit" to "RATE_LIMIT", "licenses_limit" to "LICENSES_LIMIT", "user_limit" to "USER_LIMIT", "unique_limit" to "UNIQUE_LIMIT", "general_limit" to "GENERAL_LIMIT", "unhandled" to "UNHANDLED", "trigger_not_found" to "TRIGGER_NOT_FOUND", "trigger_expired" to "TRIGGER_EXPIRED", "required" to "REQUIRED", "in" to "IN", "not_applicable" to "NOT_APPLICABLE", "self_update" to "SELF_UPDATE", "owner_protected" to "OWNER_PROTECTED", "already_assigned" to "ALREADY_ASSIGNED", "next_send_at_invalid" to "NEXT_SEND_AT_INVALID", "schedule_invalid" to "SCHEDULE_INVALID", "schedule_end_date_invalid" to "SCHEDULE_END_DATE_INVALID", "scheduled_messages_limit" to "SCHEDULED_MESSAGES_LIMIT", "draft_type_change_forbidden" to "DRAFT_TYPE_CHANGE_FORBIDDEN", "confidential_download_denied" to "CONFIDENTIAL_DOWNLOAD_DENIED", "decryption_failed" to "DECRYPTION_FAILED", "bot_add_denied" to "BOT_ADD_DENIED", "single_chat_bot_occupied" to "SINGLE_CHAT_BOT_OCCUPIED", "single_chat_bot_tag_denied" to "SINGLE_CHAT_BOT_TAG_DENIED", "restricted_bot_tag_denied" to "RESTRICTED_BOT_TAG_DENIED", "bot_changed_concurrently" to "BOT_CHANGED_CONCURRENTLY", "timeout" to "TIMEOUT", "daily_invites_limit" to "DAILY_INVITES_LIMIT", "forbidden" to "FORBIDDEN", "permission_denied" to "PERMISSION_DENIED", "access_denied" to "ACCESS_DENIED", "wrong_params" to "WRONG_PARAMS", "payment_required" to "PAYMENT_REQUIRED", "min_length" to "MIN_LENGTH", "max_length" to "MAX_LENGTH", "use_of_system_words" to "USE_OF_SYSTEM_WORDS", "export_file_not_found" to "EXPORT_FILE_NOT_FOUND", "cannot_kick_owner" to "CANNOT_KICK_OWNER", "pin_failed" to "PIN_FAILED", "message_deleted" to "MESSAGE_DELETED", "thread_message" to "THREAD_MESSAGE", "view_not_found" to "VIEW_NOT_FOUND", "submit_expired" to "SUBMIT_EXPIRED", "service_unavailable" to "SERVICE_UNAVAILABLE")

        fun valueOf(name: String): ValidationErrorCode =
            entries.firstOrNull { it.name == name } ?: throw IllegalArgumentException("No ValidationErrorCode constant $name")
    }
}

/** Тип события видеозвонка */
@Serializable
@JvmInline
value class VideoCallEventType(val value: String) {
    /** Whether this SDK version lists the value */
    val isKnown: Boolean get() = value in knownNames
    /** Constant name of a listed value, the raw value otherwise */
    val name: String get() = knownNames[value] ?: value
    override fun toString(): String = value

    companion object {
        /** Видеозвонок начался */
        val STARTED = VideoCallEventType("started")
        /** Видеозвонок завершился */
        val FINISHED = VideoCallEventType("finished")
        /** Запись видеозвонка готова */
        val RECORDING_READY = VideoCallEventType("recording_ready")

        /** Every value this SDK version lists */
        val entries: List<VideoCallEventType> = listOf(STARTED, FINISHED, RECORDING_READY)

        /** The same values as an array, like `values()` of an enum class */
        fun values(): Array<VideoCallEventType> = entries.toTypedArray()

        private val knownNames: Map<String, String> = mapOf("started" to "STARTED", "finished" to "FINISHED", "recording_ready" to "RECORDING_READY")

        fun valueOf(name: String): VideoCallEventType =
            entries.firstOrNull { it.name == name } ?: throw IllegalArgumentException("No VideoCallEventType constant $name")
    }
}

/** Тип события webhook */
@Serializable
@JvmInline
value class WebhookEventType(val value: String) {
    /** Whether this SDK version lists the value */
    val isKnown: Boolean get() = value in knownNames
    /** Constant name of a listed value, the raw value otherwise */
    val name: String get() = knownNames[value] ?: value
    override fun toString(): String = value

    companion object {
        /** Создание */
        val NEW = WebhookEventType("new")
        /** Обновление */
        val UPDATE = WebhookEventType("update")
        /** Удаление */
        val DELETE = WebhookEventType("delete")

        /** Every value this SDK version lists */
        val entries: List<WebhookEventType> = listOf(NEW, UPDATE, DELETE)

        /** The same values as an array, like `values()` of an enum class */
        fun values(): Array<WebhookEventType> = entries.toTypedArray()

        private val knownNames: Map<String, String> = mapOf("new" to "NEW", "update" to "UPDATE", "delete" to "DELETE")

        fun valueOf(name: String): WebhookEventType =
            entries.firstOrNull { it.name == name } ?: throw IllegalArgumentException("No WebhookEventType constant $name")
    }
}

@Serializable(with = AuditEventDetailsUnionSerializer::class)
sealed interface AuditEventDetailsUnion

// AuditEventDetailsUnion carries no discriminator field: the member is chosen by which one
// best matches the payload keys (most recognised, then fewest unrecognised,
// then fewest declared).
object AuditEventDetailsUnionSerializer : KSerializer<AuditEventDetailsUnion> {
    override val descriptor = buildClassSerialDescriptor("AuditEventDetailsUnion")

    private val shapes: List<Pair<Set<String>, (Json, JsonElement) -> AuditEventDetailsUnion>> = listOf(
        setOf<String>() to { json, element -> json.decodeFromJsonElement(AuditDetailsEmpty.serializer(), element) },
        setOf("changed_attrs", "context") to { json, element -> json.decodeFromJsonElement(AuditDetailsUserUpdated.serializer(), element) },
        setOf("new_company_role", "previous_company_role", "initiator_id") to { json, element -> json.decodeFromJsonElement(AuditDetailsRoleChanged.serializer(), element) },
        setOf("name") to { json, element -> json.decodeFromJsonElement(AuditDetailsTagName.serializer(), element) },
        setOf("initiator_id") to { json, element -> json.decodeFromJsonElement(AuditDetailsInitiator.serializer(), element) },
        setOf("inviter_id") to { json, element -> json.decodeFromJsonElement(AuditDetailsInviter.serializer(), element) },
        setOf("old_name", "new_name") to { json, element -> json.decodeFromJsonElement(AuditDetailsChatRenamed.serializer(), element) },
        setOf("public_access") to { json, element -> json.decodeFromJsonElement(AuditDetailsChatPermission.serializer(), element) },
        setOf("chat_id", "tag_name") to { json, element -> json.decodeFromJsonElement(AuditDetailsTagChat.serializer(), element) },
        setOf("chat_id") to { json, element -> json.decodeFromJsonElement(AuditDetailsChatId.serializer(), element) },
        setOf("scopes") to { json, element -> json.decodeFromJsonElement(AuditDetailsTokenScopes.serializer(), element) },
        setOf("chat_id", "message_id", "reason") to { json, element -> json.decodeFromJsonElement(AuditDetailsKms.serializer(), element) },
        setOf("dlp_rule_id", "dlp_rule_name", "message_id", "chat_id", "user_id", "action_message", "conditions_matched") to { json, element -> json.decodeFromJsonElement(AuditDetailsDlp.serializer(), element) },
        setOf("search_type", "query_present", "cursor_present", "limit", "filters") to { json, element -> json.decodeFromJsonElement(AuditDetailsSearch.serializer(), element) },
        setOf("bot_id", "actor_id") to { json, element -> json.decodeFromJsonElement(AuditDetailsBot.serializer(), element) },
        setOf("bot_id", "actor_id", "added_scopes", "removed_scopes") to { json, element -> json.decodeFromJsonElement(AuditDetailsBotScopes.serializer(), element) },
        setOf("bot_id", "actor_id", "changes") to { json, element -> json.decodeFromJsonElement(AuditDetailsBotWebhookSettings.serializer(), element) },
        setOf("bot_id", "actor_id", "client_id", "changes") to { json, element -> json.decodeFromJsonElement(AuditDetailsBotOAuthClient.serializer(), element) },
        setOf("client_id", "scopes") to { json, element -> json.decodeFromJsonElement(AuditDetailsOAuthAuthorizationGranted.serializer(), element) },
        setOf("client_id", "revoked_tokens_count", "user_id") to { json, element -> json.decodeFromJsonElement(AuditDetailsOAuthAuthorizationRevoked.serializer(), element) },
        setOf("client_id", "scopes", "device_name") to { json, element -> json.decodeFromJsonElement(AuditDetailsDeviceAuthorizationApproved.serializer(), element) },
        setOf("client_id", "scopes", "device_name") to { json, element -> json.decodeFromJsonElement(AuditDetailsDeviceAuthorizationDenied.serializer(), element) },
        setOf("chat_id", "started_message_id") to { json, element -> json.decodeFromJsonElement(AuditDetailsVideoCallStarted.serializer(), element) },
        setOf("chat_id", "started_message_id", "duration", "max_members_count") to { json, element -> json.decodeFromJsonElement(AuditDetailsVideoCallFinished.serializer(), element) },
        setOf("chat_id", "started_message_id", "recording_id", "file_id", "duration", "size") to { json, element -> json.decodeFromJsonElement(AuditDetailsVideoCallRecording.serializer(), element) },
        setOf("bot_id", "actor_id", "client_id") to { json, element -> json.decodeFromJsonElement(AuditDetailsBotOAuthClientSecretRotated.serializer(), element) },
        setOf("bot_id", "actor_id", "client_id", "deleted_access_tokens_count", "deleted_access_grants_count") to { json, element -> json.decodeFromJsonElement(AuditDetailsBotOAuthClientDisabled.serializer(), element) },
        setOf("token_kind", "token_name", "resource_owner_id", "scopes", "bot_id", "reason") to { json, element -> json.decodeFromJsonElement(AuditDetailsToken.serializer(), element) },
        setOf("token_kind", "token_name", "resource_owner_id", "current_scopes", "bot_id", "actor_id") to { json, element -> json.decodeFromJsonElement(AuditDetailsBotTokenUpdated.serializer(), element) },
        setOf("method", "login_grant_id") to { json, element -> json.decodeFromJsonElement(AuditDetailsUserLoginQr.serializer(), element) },
        setOf("login_grant_id") to { json, element -> json.decodeFromJsonElement(AuditDetailsLoginGrantCreated.serializer(), element) },
        setOf("login_grant_id", "device") to { json, element -> json.decodeFromJsonElement(AuditDetailsLoginGrantApproved.serializer(), element) },
        setOf("login_grant_id", "device", "reason") to { json, element -> json.decodeFromJsonElement(AuditDetailsLoginGrantDenied.serializer(), element) },
    )

    override fun serialize(encoder: Encoder, value: AuditEventDetailsUnion) {
        val jsonEncoder = encoder as? JsonEncoder ?: error("AuditEventDetailsUnionSerializer only supports JSON")
        when (value) {
            is AuditDetailsEmpty -> jsonEncoder.encodeSerializableValue(AuditDetailsEmpty.serializer(), value)
            is AuditDetailsUserUpdated -> jsonEncoder.encodeSerializableValue(AuditDetailsUserUpdated.serializer(), value)
            is AuditDetailsRoleChanged -> jsonEncoder.encodeSerializableValue(AuditDetailsRoleChanged.serializer(), value)
            is AuditDetailsTagName -> jsonEncoder.encodeSerializableValue(AuditDetailsTagName.serializer(), value)
            is AuditDetailsInitiator -> jsonEncoder.encodeSerializableValue(AuditDetailsInitiator.serializer(), value)
            is AuditDetailsInviter -> jsonEncoder.encodeSerializableValue(AuditDetailsInviter.serializer(), value)
            is AuditDetailsChatRenamed -> jsonEncoder.encodeSerializableValue(AuditDetailsChatRenamed.serializer(), value)
            is AuditDetailsChatPermission -> jsonEncoder.encodeSerializableValue(AuditDetailsChatPermission.serializer(), value)
            is AuditDetailsTagChat -> jsonEncoder.encodeSerializableValue(AuditDetailsTagChat.serializer(), value)
            is AuditDetailsChatId -> jsonEncoder.encodeSerializableValue(AuditDetailsChatId.serializer(), value)
            is AuditDetailsTokenScopes -> jsonEncoder.encodeSerializableValue(AuditDetailsTokenScopes.serializer(), value)
            is AuditDetailsKms -> jsonEncoder.encodeSerializableValue(AuditDetailsKms.serializer(), value)
            is AuditDetailsDlp -> jsonEncoder.encodeSerializableValue(AuditDetailsDlp.serializer(), value)
            is AuditDetailsSearch -> jsonEncoder.encodeSerializableValue(AuditDetailsSearch.serializer(), value)
            is AuditDetailsBot -> jsonEncoder.encodeSerializableValue(AuditDetailsBot.serializer(), value)
            is AuditDetailsBotScopes -> jsonEncoder.encodeSerializableValue(AuditDetailsBotScopes.serializer(), value)
            is AuditDetailsBotWebhookSettings -> jsonEncoder.encodeSerializableValue(AuditDetailsBotWebhookSettings.serializer(), value)
            is AuditDetailsBotOAuthClient -> jsonEncoder.encodeSerializableValue(AuditDetailsBotOAuthClient.serializer(), value)
            is AuditDetailsOAuthAuthorizationGranted -> jsonEncoder.encodeSerializableValue(AuditDetailsOAuthAuthorizationGranted.serializer(), value)
            is AuditDetailsOAuthAuthorizationRevoked -> jsonEncoder.encodeSerializableValue(AuditDetailsOAuthAuthorizationRevoked.serializer(), value)
            is AuditDetailsDeviceAuthorizationApproved -> jsonEncoder.encodeSerializableValue(AuditDetailsDeviceAuthorizationApproved.serializer(), value)
            is AuditDetailsDeviceAuthorizationDenied -> jsonEncoder.encodeSerializableValue(AuditDetailsDeviceAuthorizationDenied.serializer(), value)
            is AuditDetailsVideoCallStarted -> jsonEncoder.encodeSerializableValue(AuditDetailsVideoCallStarted.serializer(), value)
            is AuditDetailsVideoCallFinished -> jsonEncoder.encodeSerializableValue(AuditDetailsVideoCallFinished.serializer(), value)
            is AuditDetailsVideoCallRecording -> jsonEncoder.encodeSerializableValue(AuditDetailsVideoCallRecording.serializer(), value)
            is AuditDetailsBotOAuthClientSecretRotated -> jsonEncoder.encodeSerializableValue(AuditDetailsBotOAuthClientSecretRotated.serializer(), value)
            is AuditDetailsBotOAuthClientDisabled -> jsonEncoder.encodeSerializableValue(AuditDetailsBotOAuthClientDisabled.serializer(), value)
            is AuditDetailsToken -> jsonEncoder.encodeSerializableValue(AuditDetailsToken.serializer(), value)
            is AuditDetailsBotTokenUpdated -> jsonEncoder.encodeSerializableValue(AuditDetailsBotTokenUpdated.serializer(), value)
            is AuditDetailsUserLoginQr -> jsonEncoder.encodeSerializableValue(AuditDetailsUserLoginQr.serializer(), value)
            is AuditDetailsLoginGrantCreated -> jsonEncoder.encodeSerializableValue(AuditDetailsLoginGrantCreated.serializer(), value)
            is AuditDetailsLoginGrantApproved -> jsonEncoder.encodeSerializableValue(AuditDetailsLoginGrantApproved.serializer(), value)
            is AuditDetailsLoginGrantDenied -> jsonEncoder.encodeSerializableValue(AuditDetailsLoginGrantDenied.serializer(), value)
        }
    }

    override fun deserialize(decoder: Decoder): AuditEventDetailsUnion {
        val jsonDecoder = decoder as? JsonDecoder ?: error("AuditEventDetailsUnionSerializer only supports JSON")
        val element = jsonDecoder.decodeJsonElement()
        val keys = element.jsonObject.keys
        var best: Pair<Set<String>, (Json, JsonElement) -> AuditEventDetailsUnion>? = null
        var bestMatched = 0
        var bestUnknown = 0
        var bestDeclared = 0
        for (shape in shapes) {
            val matched = keys.count { it in shape.first }
            val unknown = keys.size - matched
            val declared = shape.first.size
            val better = best == null ||
                matched > bestMatched ||
                (matched == bestMatched && unknown < bestUnknown) ||
                (matched == bestMatched && unknown == bestUnknown && declared < bestDeclared)
            if (better) {
                best = shape
                bestMatched = matched
                bestUnknown = unknown
                bestDeclared = declared
            }
        }
        val chosen = best ?: error("No AuditEventDetailsUnion member matched the payload")
        return chosen.second(jsonDecoder.json, element)
    }
}

@Serializable
class AuditDetailsEmpty : AuditEventDetailsUnion

@Serializable
data class AuditDetailsUserUpdated(
    @SerialName("changed_attrs") val changedAttrs: List<String>,
    val context: String? = null,
) : AuditEventDetailsUnion

@Serializable
data class AuditDetailsRoleChanged(
    @SerialName("new_company_role") val newCompanyRole: String,
    @SerialName("previous_company_role") val previousCompanyRole: String,
    @SerialName("initiator_id") val initiatorId: Int,
) : AuditEventDetailsUnion

@Serializable
data class AuditDetailsTagName(
    val name: String,
) : AuditEventDetailsUnion

@Serializable
data class AuditDetailsInitiator(
    @SerialName("initiator_id") val initiatorId: Int,
) : AuditEventDetailsUnion

@Serializable
data class AuditDetailsInviter(
    @SerialName("inviter_id") val inviterId: Int,
) : AuditEventDetailsUnion

@Serializable
data class AuditDetailsChatRenamed(
    @SerialName("old_name") val oldName: String,
    @SerialName("new_name") val newName: String,
) : AuditEventDetailsUnion

@Serializable
data class AuditDetailsChatPermission(
    @SerialName("public_access") val publicAccess: Boolean,
) : AuditEventDetailsUnion

@Serializable
data class AuditDetailsTagChat(
    @SerialName("chat_id") val chatId: Int,
    @SerialName("tag_name") val tagName: String,
) : AuditEventDetailsUnion

@Serializable
data class AuditDetailsChatId(
    @SerialName("chat_id") val chatId: Int,
) : AuditEventDetailsUnion

@Serializable
data class AuditDetailsTokenScopes(
    val scopes: List<String>,
) : AuditEventDetailsUnion

@Serializable
data class AuditDetailsKms(
    @SerialName("chat_id") val chatId: Int,
    @SerialName("message_id") val messageId: Int,
    val reason: String,
) : AuditEventDetailsUnion

@Serializable
data class AuditDetailsDlp(
    @SerialName("dlp_rule_id") val dlpRuleId: String,
    @SerialName("dlp_rule_name") val dlpRuleName: String,
    @SerialName("message_id") val messageId: Int,
    @SerialName("chat_id") val chatId: Int,
    @SerialName("user_id") val userId: Int,
    @SerialName("action_message") val actionMessage: String,
    @SerialName("conditions_matched") val conditionsMatched: Boolean,
) : AuditEventDetailsUnion

@Serializable
data class AuditDetailsSearch(
    @SerialName("search_type") val searchType: String,
    @SerialName("query_present") val queryPresent: Boolean,
    @SerialName("cursor_present") val cursorPresent: Boolean,
    val limit: Int,
    val filters: Map<String, JsonElement>,
) : AuditEventDetailsUnion

@Serializable
data class AuditDetailsBot(
    @SerialName("bot_id") val botId: Int,
    @SerialName("actor_id") val actorId: Int,
) : AuditEventDetailsUnion

@Serializable
data class AuditDetailsBotScopes(
    @SerialName("bot_id") val botId: Int,
    @SerialName("actor_id") val actorId: Int,
    @SerialName("added_scopes") val addedScopes: List<String>,
    @SerialName("removed_scopes") val removedScopes: List<String>,
) : AuditEventDetailsUnion

@Serializable
data class AuditDetailsBotWebhookSettings(
    @SerialName("bot_id") val botId: Int,
    @SerialName("actor_id") val actorId: Int,
    val changes: Map<String, JsonElement>,
) : AuditEventDetailsUnion

@Serializable
data class AuditDetailsBotOAuthClient(
    @SerialName("bot_id") val botId: Int,
    @SerialName("actor_id") val actorId: Int,
    @SerialName("client_id") val clientId: String,
    val changes: Map<String, JsonElement>,
) : AuditEventDetailsUnion

@Serializable
data class AuditDetailsOAuthAuthorizationGranted(
    @SerialName("client_id") val clientId: String,
    val scopes: List<String>,
) : AuditEventDetailsUnion

@Serializable
data class AuditDetailsOAuthAuthorizationRevoked(
    @SerialName("client_id") val clientId: String,
    @SerialName("revoked_tokens_count") val revokedTokensCount: Int,
    @SerialName("user_id") val userId: Int? = null,
) : AuditEventDetailsUnion

@Serializable
data class AuditDetailsDeviceAuthorizationApproved(
    @SerialName("client_id") val clientId: String,
    val scopes: List<String>,
    @SerialName("device_name") val deviceName: String? = null,
) : AuditEventDetailsUnion

@Serializable
data class AuditDetailsDeviceAuthorizationDenied(
    @SerialName("client_id") val clientId: String,
    val scopes: List<String>,
    @SerialName("device_name") val deviceName: String? = null,
) : AuditEventDetailsUnion

@Serializable
data class AuditDetailsVideoCallStarted(
    @SerialName("chat_id") val chatId: Int,
    @SerialName("started_message_id") val startedMessageId: Int,
) : AuditEventDetailsUnion

@Serializable
data class AuditDetailsVideoCallFinished(
    @SerialName("chat_id") val chatId: Int,
    @SerialName("started_message_id") val startedMessageId: Int,
    val duration: Int,
    @SerialName("max_members_count") val maxMembersCount: Int,
) : AuditEventDetailsUnion

@Serializable
data class AuditDetailsVideoCallRecording(
    @SerialName("chat_id") val chatId: Int,
    @SerialName("started_message_id") val startedMessageId: Int,
    @SerialName("recording_id") val recordingId: Int,
    @SerialName("file_id") val fileId: Int,
    val duration: Int,
    val size: Long,
) : AuditEventDetailsUnion

@Serializable
data class AuditDetailsBotOAuthClientSecretRotated(
    @SerialName("bot_id") val botId: Int,
    @SerialName("actor_id") val actorId: Int,
    @SerialName("client_id") val clientId: String,
) : AuditEventDetailsUnion

@Serializable
data class AuditDetailsBotOAuthClientDisabled(
    @SerialName("bot_id") val botId: Int,
    @SerialName("actor_id") val actorId: Int,
    @SerialName("client_id") val clientId: String,
    @SerialName("deleted_access_tokens_count") val deletedAccessTokensCount: Int,
    @SerialName("deleted_access_grants_count") val deletedAccessGrantsCount: Int,
) : AuditEventDetailsUnion

@Serializable
data class AuditDetailsToken(
    @SerialName("token_kind") val tokenKind: String,
    @SerialName("token_name") val tokenName: String,
    @SerialName("resource_owner_id") val resourceOwnerId: Int,
    val scopes: List<String>,
    @SerialName("bot_id") val botId: Int? = null,
    val reason: String? = null,
) : AuditEventDetailsUnion

@Serializable
data class AuditDetailsBotTokenUpdated(
    @SerialName("token_kind") val tokenKind: String,
    @SerialName("token_name") val tokenName: String,
    @SerialName("resource_owner_id") val resourceOwnerId: Int,
    @SerialName("current_scopes") val currentScopes: List<String>,
    @SerialName("bot_id") val botId: Int? = null,
    @SerialName("actor_id") val actorId: Int,
) : AuditEventDetailsUnion

@Serializable
data class AuditDetailsUserLoginQr(
    val method: String,
    @SerialName("login_grant_id") val loginGrantId: String,
) : AuditEventDetailsUnion

@Serializable
data class AuditDetailsLoginGrantCreated(
    @SerialName("login_grant_id") val loginGrantId: String,
) : AuditEventDetailsUnion

@Serializable
data class AuditDetailsLoginGrantApproved(
    @SerialName("login_grant_id") val loginGrantId: String,
    val device: AuditLoginGrantDevice,
) : AuditEventDetailsUnion

@Serializable
data class AuditDetailsLoginGrantDenied(
    @SerialName("login_grant_id") val loginGrantId: String,
    val device: AuditLoginGrantDevice,
    val reason: AuditLoginGrantDenyReason,
) : AuditEventDetailsUnion

@Serializable
sealed interface ViewBlockUnion {
    val type: String
}

@Serializable
@SerialName("header")
data class ViewBlockHeader(
    override val type: String = "header",
    val text: String,
) : ViewBlockUnion

@Serializable
@SerialName("plain_text")
data class ViewBlockPlainText(
    override val type: String = "plain_text",
    val text: String,
) : ViewBlockUnion

@Serializable
@SerialName("markdown")
data class ViewBlockMarkdown(
    override val type: String = "markdown",
    val text: String,
) : ViewBlockUnion

@Serializable
@SerialName("divider")
data class ViewBlockDivider(
    override val type: String = "divider",
) : ViewBlockUnion

@Serializable
@SerialName("input")
data class ViewBlockInput(
    override val type: String = "input",
    val name: String,
    val label: String,
    val placeholder: String? = null,
    val multiline: Boolean? = null,
    @SerialName("initial_value") val initialValue: String? = null,
    @SerialName("min_length") val minLength: Int? = null,
    @SerialName("max_length") val maxLength: Int? = null,
    val required: Boolean? = null,
    val hint: String? = null,
) : ViewBlockUnion

@Serializable
@SerialName("select")
data class ViewBlockSelect(
    override val type: String = "select",
    val name: String,
    val label: String,
    val options: List<ViewBlockSelectOption>,
    val required: Boolean? = null,
    val hint: String? = null,
) : ViewBlockUnion

@Serializable
@SerialName("radio")
data class ViewBlockRadio(
    override val type: String = "radio",
    val name: String,
    val label: String,
    val options: List<ViewBlockSelectableOption>,
    val required: Boolean? = null,
    val hint: String? = null,
) : ViewBlockUnion

@Serializable
@SerialName("checkbox")
data class ViewBlockCheckbox(
    override val type: String = "checkbox",
    val name: String,
    val label: String,
    val options: List<ViewBlockCheckboxOption>,
    val required: Boolean? = null,
    val hint: String? = null,
) : ViewBlockUnion

@Serializable
@SerialName("date")
data class ViewBlockDate(
    override val type: String = "date",
    val name: String,
    val label: String,
    @SerialName("initial_date") val initialDate: String? = null,
    val required: Boolean? = null,
    val hint: String? = null,
) : ViewBlockUnion

@Serializable
@SerialName("time")
data class ViewBlockTime(
    override val type: String = "time",
    val name: String,
    val label: String,
    @SerialName("initial_time") val initialTime: String? = null,
    val required: Boolean? = null,
    val hint: String? = null,
) : ViewBlockUnion

@Serializable
@SerialName("file_input")
data class ViewBlockFileInput(
    override val type: String = "file_input",
    val name: String,
    val label: String,
    val filetypes: List<String>? = null,
    @SerialName("max_files") val maxFiles: Int? = null,
    val required: Boolean? = null,
    val hint: String? = null,
) : ViewBlockUnion

@Serializable(with = WebhookPayloadUnionSerializer::class)
sealed interface WebhookPayloadUnion {
    val type: String
}

object WebhookPayloadUnionSerializer : KSerializer<WebhookPayloadUnion> {
    override val descriptor = buildClassSerialDescriptor("WebhookPayloadUnion")

    override fun serialize(encoder: Encoder, value: WebhookPayloadUnion) {
        val jsonEncoder = encoder as? JsonEncoder ?: error("WebhookPayloadUnionSerializer only supports JSON")
        when (value) {
            is MessageWebhookPayload -> jsonEncoder.encodeSerializableValue(MessageWebhookPayload.serializer(), value)
            is ReactionWebhookPayload -> jsonEncoder.encodeSerializableValue(ReactionWebhookPayload.serializer(), value)
            is ButtonWebhookPayload -> jsonEncoder.encodeSerializableValue(ButtonWebhookPayload.serializer(), value)
            is ViewSubmitWebhookPayload -> jsonEncoder.encodeSerializableValue(ViewSubmitWebhookPayload.serializer(), value)
            is ChatMemberWebhookPayload -> jsonEncoder.encodeSerializableValue(ChatMemberWebhookPayload.serializer(), value)
            is CompanyMemberWebhookPayload -> jsonEncoder.encodeSerializableValue(CompanyMemberWebhookPayload.serializer(), value)
            is LinkSharedWebhookPayload -> jsonEncoder.encodeSerializableValue(LinkSharedWebhookPayload.serializer(), value)
            is VideoCallWebhookPayload -> jsonEncoder.encodeSerializableValue(VideoCallWebhookPayload.serializer(), value)
        }
    }

    override fun deserialize(decoder: Decoder): WebhookPayloadUnion {
        val jsonDecoder = decoder as? JsonDecoder ?: error("WebhookPayloadUnionSerializer only supports JSON")
        val element = jsonDecoder.decodeJsonElement()
        val type = element.jsonObject["type"]?.jsonPrimitive?.contentOrNull
        val event = element.jsonObject["event"]?.jsonPrimitive?.contentOrNull
        return when {
            type == "message" && event == "link_shared" -> jsonDecoder.json.decodeFromJsonElement(LinkSharedWebhookPayload.serializer(), element)
            type == "message" -> jsonDecoder.json.decodeFromJsonElement(MessageWebhookPayload.serializer(), element)
            type == "reaction" -> jsonDecoder.json.decodeFromJsonElement(ReactionWebhookPayload.serializer(), element)
            type == "button" -> jsonDecoder.json.decodeFromJsonElement(ButtonWebhookPayload.serializer(), element)
            type == "view" -> jsonDecoder.json.decodeFromJsonElement(ViewSubmitWebhookPayload.serializer(), element)
            type == "chat_member" -> jsonDecoder.json.decodeFromJsonElement(ChatMemberWebhookPayload.serializer(), element)
            type == "company_member" -> jsonDecoder.json.decodeFromJsonElement(CompanyMemberWebhookPayload.serializer(), element)
            type == "video_call" -> jsonDecoder.json.decodeFromJsonElement(VideoCallWebhookPayload.serializer(), element)
            else -> error("Unknown WebhookPayloadUnion type: $type")
        }
    }
}

@Serializable
@SerialName("message")
data class MessageWebhookPayload(
    override val type: String = "message",
    val id: Int,
    val event: WebhookEventType,
    @SerialName("entity_type") val entityType: MessageEntityType,
    @SerialName("entity_id") val entityId: Int,
    val content: String,
    @SerialName("user_id") val userId: Int,
    @Serializable(with = OffsetDateTimeSerializer::class) @SerialName("created_at") val createdAt: OffsetDateTime,
    @Serializable(with = OffsetDateTimeSerializer::class) @SerialName("changed_at") val changedAt: OffsetDateTime? = null,
    val url: String,
    @SerialName("chat_id") val chatId: Int,
    @SerialName("parent_message_id") val parentMessageId: Int? = null,
    val thread: WebhookMessageThread? = null,
    @SerialName("webhook_timestamp") val webhookTimestamp: Int,
) : WebhookPayloadUnion

@Serializable
@SerialName("reaction")
data class ReactionWebhookPayload(
    override val type: String = "reaction",
    val event: ReactionEventType,
    @SerialName("chat_id") val chatId: Int,
    @SerialName("message_id") val messageId: Int,
    val code: String,
    val name: String,
    @SerialName("user_id") val userId: Int,
    @Serializable(with = OffsetDateTimeSerializer::class) @SerialName("created_at") val createdAt: OffsetDateTime,
    @SerialName("webhook_timestamp") val webhookTimestamp: Int,
) : WebhookPayloadUnion

@Serializable
@SerialName("button")
data class ButtonWebhookPayload(
    override val type: String = "button",
    @SerialName("message_id") val messageId: Int,
    @SerialName("trigger_id") val triggerId: String,
    val data: String,
    @SerialName("user_id") val userId: Int,
    @SerialName("chat_id") val chatId: Int,
    @SerialName("webhook_timestamp") val webhookTimestamp: Int,
) : WebhookPayloadUnion {
    val event: String = "click"
}

@Serializable
@SerialName("view")
data class ViewSubmitWebhookPayload(
    override val type: String = "view",
    @SerialName("callback_id") val callbackId: String,
    @SerialName("private_metadata") val privateMetadata: String,
    @SerialName("chat_id") val chatId: Int,
    @SerialName("user_id") val userId: Int,
    @SerialName("view_id") val viewId: String,
    @SerialName("submit_id") val submitId: String,
    val data: Map<String, JsonElement>,
    @SerialName("webhook_timestamp") val webhookTimestamp: Int,
) : WebhookPayloadUnion {
    val event: String = "submit"
}

@Serializable
@SerialName("chat_member")
data class ChatMemberWebhookPayload(
    override val type: String = "chat_member",
    val event: MemberEventType,
    @SerialName("chat_id") val chatId: Int,
    @SerialName("thread_id") val threadId: Int? = null,
    @SerialName("user_ids") val userIds: List<Int>,
    @Serializable(with = OffsetDateTimeSerializer::class) @SerialName("created_at") val createdAt: OffsetDateTime,
    @SerialName("webhook_timestamp") val webhookTimestamp: Int,
) : WebhookPayloadUnion

@Serializable
@SerialName("company_member")
data class CompanyMemberWebhookPayload(
    override val type: String = "company_member",
    val event: UserEventType,
    @SerialName("user_ids") val userIds: List<Int>,
    @Serializable(with = OffsetDateTimeSerializer::class) @SerialName("created_at") val createdAt: OffsetDateTime,
    @SerialName("webhook_timestamp") val webhookTimestamp: Int,
) : WebhookPayloadUnion

@Serializable
@SerialName("message")
data class LinkSharedWebhookPayload(
    override val type: String = "message",
    @SerialName("chat_id") val chatId: Int,
    @SerialName("message_id") val messageId: Int,
    val links: List<WebhookLink>,
    @SerialName("user_id") val userId: Int,
    @SerialName("entity_type") val entityType: MessageEntityType,
    @SerialName("entity_id") val entityId: Int,
    val thread: WebhookMessageThread,
    @Serializable(with = OffsetDateTimeSerializer::class) @SerialName("created_at") val createdAt: OffsetDateTime,
    @SerialName("webhook_timestamp") val webhookTimestamp: Int,
) : WebhookPayloadUnion {
    val event: String = "link_shared"
}

@Serializable
@SerialName("video_call")
data class VideoCallWebhookPayload(
    override val type: String = "video_call",
    val event: VideoCallEventType,
    @SerialName("video_room_id") val videoRoomId: Int,
    @SerialName("chat_id") val chatId: Int,
    @SerialName("owner_id") val ownerId: Int,
    val thread: WebhookVideoCallThread? = null,
    @Serializable(with = OffsetDateTimeSerializer::class) @SerialName("started_at") val startedAt: OffsetDateTime? = null,
    @Serializable(with = OffsetDateTimeSerializer::class) @SerialName("finished_at") val finishedAt: OffsetDateTime? = null,
    val duration: Int? = null,
    val members: List<WebhookVideoCallMember>? = null,
    @SerialName("recording_id") val recordingId: Int? = null,
    @SerialName("file_id") val fileId: Int? = null,
    val url: String? = null,
    val size: Long? = null,
    @SerialName("webhook_timestamp") val webhookTimestamp: Int,
) : WebhookPayloadUnion

@Serializable
data class AccessTokenInfo(
    val id: Long,
    val token: String,
    val name: String? = null,
    @SerialName("user_id") val userId: Long,
    val scopes: List<OAuthScope>,
    @Serializable(with = OffsetDateTimeSerializer::class) @SerialName("created_at") val createdAt: OffsetDateTime,
    @Serializable(with = OffsetDateTimeSerializer::class) @SerialName("revoked_at") val revokedAt: OffsetDateTime? = null,
    @SerialName("expires_in") val expiresIn: Int? = null,
    @Serializable(with = OffsetDateTimeSerializer::class) @SerialName("last_used_at") val lastUsedAt: OffsetDateTime? = null,
    @Serializable(with = OffsetDateTimeSerializer::class) @SerialName("authorized_at") val authorizedAt: OffsetDateTime? = null,
)

@Serializable
data class AddMembersRequest(
    @SerialName("member_ids") val memberIds: List<Int>,
    val silent: Boolean? = false,
)

@Serializable
data class AddTagsRequest(
    @SerialName("group_tag_ids") val groupTagIds: List<Int>,
)

@Serializable
data class ApiError(
    val errors: List<ApiErrorItem>,
    /** HTTP status code of the answer, set by the client. An empty body or one that is not JSON leaves errors empty. */
    @Transient val statusCode: Int? = null,
) : Exception()
 {
    override val message: String
        get() = when {
            errors.isEmpty() -> if (statusCode != null) "HTTP $statusCode" else "api error"
            errors.size == 1 -> errors[0].message
            else -> "Errors: " + errors.joinToString("; ") { it.message }
        }
}

@Serializable
data class ApiErrorItem(
    val key: String,
    val value: JsonElement? = null,
    val message: String,
    val code: ValidationErrorCode,
    val payload: Map<String, JsonElement>? = null,
)

@Serializable
data class AuditEvent(
    val id: String,
    @Serializable(with = OffsetDateTimeSerializer::class) @SerialName("created_at") val createdAt: OffsetDateTime,
    @SerialName("event_key") val eventKey: AuditEventKey,
    @SerialName("entity_id") val entityId: String,
    @SerialName("entity_type") val entityType: String,
    @SerialName("actor_id") val actorId: String,
    @SerialName("actor_type") val actorType: String,
    val details: AuditEventDetailsUnion,
    @SerialName("ip_address") val ipAddress: String? = null,
    @SerialName("user_agent") val userAgent: String? = null,
)

@Serializable
data class AuditLoginGrantDevice(
    val name: String,
    val platform: AuditLoginGrantDevicePlatform,
    @SerialName("os_version") val osVersion: String? = null,
    @SerialName("app_version") val appVersion: String? = null,
)

@Serializable
data class AvatarData(
    @SerialName("image_url") val imageUrl: String,
)

@Serializable
data class BotAccessToken(
    val id: Long,
    val token: String,
    val name: String? = null,
    @SerialName("user_id") val userId: Long,
    val scopes: List<String>,
    @Serializable(with = OffsetDateTimeSerializer::class) @SerialName("created_at") val createdAt: OffsetDateTime,
    @Serializable(with = OffsetDateTimeSerializer::class) @SerialName("revoked_at") val revokedAt: OffsetDateTime? = null,
    @SerialName("expires_in") val expiresIn: Int? = null,
    @Serializable(with = OffsetDateTimeSerializer::class) @SerialName("last_used_at") val lastUsedAt: OffsetDateTime? = null,
    @Serializable(with = OffsetDateTimeSerializer::class) @SerialName("authorized_at") val authorizedAt: OffsetDateTime? = null,
)

@Serializable
data class BotCreateRequestWebhook(
    val name: String,
    val nickname: String? = null,
    @SerialName("outgoing_url") val outgoingUrl: String? = null,
    val events: List<BotEventName>? = null,
    @SerialName("trigger_on") val triggerOn: BotTriggerOn? = BotTriggerOn.COMMANDS,
    val commands: List<String>? = null,
    val scopes: List<String>? = null,
    val template: String? = null,
    @SerialName("template_engine") val templateEngine: BotTemplateEngine? = null,
    @SerialName("challenge_key") val challengeKey: String? = null,
    @SerialName("link_preview_enabled") val linkPreviewEnabled: Boolean? = true,
    @SerialName("ignore_self_messages") val ignoreSelfMessages: Boolean? = false,
    @SerialName("events_history_enabled") val eventsHistoryEnabled: Boolean? = false,
    @SerialName("who_can_add") val whoCanAdd: BotWhoCanAdd? = BotWhoCanAdd.CREATOR,
    @SerialName("can_edit") val canEdit: List<BotCanEdit>? = null,
    @SerialName("single_chat") val singleChat: Boolean? = false,
    val kind: BotWebhookKind? = null,
    @SerialName("unfurl_domains") val unfurlDomains: List<String>? = null,
)

@Serializable
data class BotCreateRequest(
    val empty: Boolean? = false,
    val webhook: BotCreateRequestWebhook,
    @SerialName("oauth_client") val oauthClient: BotOAuthClientRequest? = null,
    val promo: BotPromoRequest? = null,
)

@Serializable
data class BotCreateResponse(
    val id: Int,
    val name: String,
    val nickname: String,
    @SerialName("avatar_url") val avatarUrl: String? = null,
    @SerialName("creator_id") val creatorId: Int? = null,
    @Serializable(with = OffsetDateTimeSerializer::class) @SerialName("created_at") val createdAt: OffsetDateTime,
    @SerialName("authorized_users_count") val authorizedUsersCount: Int,
    @Serializable(with = OffsetDateTimeSerializer::class) @SerialName("last_used_at") val lastUsedAt: OffsetDateTime? = null,
    val webhook: BotWebhook,
    @SerialName("oauth_client_enabled") val oauthClientEnabled: Boolean,
    @SerialName("oauth_client") val oauthClient: BotOAuthClient? = null,
    val promo: BotPromo? = null,
    val permissions: BotPermissions,
    @SerialName("client_secret") val clientSecret: String? = null,
    @SerialName("access_token") val accessToken: String? = null,
)

@Serializable
data class BotOAuthClient(
    @SerialName("client_id") val clientId: String,
    @SerialName("client_secret_preview") val clientSecretPreview: String,
    val confidential: Boolean,
    @SerialName("redirect_uris") val redirectUris: List<String>,
    val scopes: List<String>,
)

@Serializable
data class BotOAuthClientRequest(
    val confidential: Boolean? = null,
    @SerialName("redirect_uris") val redirectUris: List<String>? = null,
    val scopes: List<String>? = null,
)

@Serializable
data class BotPermissions(
    @SerialName("update_oauth_client") val updateOauthClient: Boolean,
    @SerialName("recreate_token") val recreateToken: Boolean,
    val destroy: Boolean,
)

@Serializable
data class BotPromo(
    val description: String? = null,
    val published: Boolean,
    @SerialName("promo_images") val promoImages: List<BotPromoImage>,
)

@Serializable
data class BotPromoImage(
    val key: String,
    val url: String,
)

@Serializable
data class BotPromoRequest(
    val description: String? = null,
    val published: Boolean? = null,
    @SerialName("promo_images") val promoImages: List<String>? = null,
)

@Serializable
data class BotResponse(
    val id: Int,
    val name: String,
    val nickname: String,
    @SerialName("avatar_url") val avatarUrl: String? = null,
    @SerialName("creator_id") val creatorId: Int? = null,
    @Serializable(with = OffsetDateTimeSerializer::class) @SerialName("created_at") val createdAt: OffsetDateTime,
    @SerialName("authorized_users_count") val authorizedUsersCount: Int,
    @Serializable(with = OffsetDateTimeSerializer::class) @SerialName("last_used_at") val lastUsedAt: OffsetDateTime? = null,
    val webhook: BotWebhook,
    @SerialName("oauth_client_enabled") val oauthClientEnabled: Boolean,
    @SerialName("oauth_client") val oauthClient: BotOAuthClient? = null,
    val promo: BotPromo? = null,
    val permissions: BotPermissions,
    @SerialName("client_secret") val clientSecret: String? = null,
)

@Serializable
data class BotScopeCatalog(
    val scopes: List<BotScopeCatalogItem>,
    val groups: List<BotScopeCatalogGroup>,
    val presets: List<BotScopeCatalogPreset>,
)

@Serializable
data class BotScopeCatalogGroup(
    val id: String,
    val title: String,
    val description: String,
)

@Serializable
data class BotScopeCatalogItem(
    val id: String,
    val title: String,
    val group: String,
    val preset: List<String>,
)

@Serializable
data class BotScopeCatalogPreset(
    val id: String,
    val title: String,
)

@Serializable
data class BotSelfResponse(
    val id: Int,
    @SerialName("oauth_client") val oauthClient: BotOAuthClient? = null,
    val webhook: BotSelfWebhook,
)

@Serializable
data class BotSelfTokenResponse(
    val id: Int,
    @SerialName("oauth_client") val oauthClient: BotOAuthClient? = null,
    val webhook: BotSelfWebhook,
    @SerialName("access_token") val accessToken: String,
)

@Serializable
data class BotSelfWebhook(
    val name: String,
    val nickname: String,
    @SerialName("outgoing_url") val outgoingUrl: String? = null,
    val events: List<BotEventName>,
    @SerialName("trigger_on") val triggerOn: BotTriggerOn,
    val commands: List<String>,
    val scopes: List<String>,
    val template: String? = null,
    @SerialName("template_engine") val templateEngine: BotTemplateEngine,
    @SerialName("challenge_key") val challengeKey: String? = null,
    @SerialName("link_preview_enabled") val linkPreviewEnabled: Boolean,
    @SerialName("ignore_self_messages") val ignoreSelfMessages: Boolean,
    @SerialName("events_history_enabled") val eventsHistoryEnabled: Boolean,
    @SerialName("single_chat") val singleChat: Boolean,
    @SerialName("can_edit") val canEdit: List<BotCanEdit>,
    @SerialName("who_can_add") val whoCanAdd: BotWhoCanAdd,
)

@Serializable
data class BotTokenCreateRequest(
    val name: String,
    val scopes: List<String>? = null,
)

@Serializable
data class BotTokenUpdateRequest(
    val name: String? = null,
    val scopes: List<String>? = null,
)

@Serializable
data class BotUpdateRequestWebhook(
    val name: String? = null,
    val nickname: String? = null,
    @SerialName("outgoing_url") val outgoingUrl: String? = null,
    val events: List<BotEventName>? = null,
    @SerialName("trigger_on") val triggerOn: BotTriggerOn? = null,
    val commands: List<String>? = null,
    val scopes: List<String>? = null,
    val template: String? = null,
    @SerialName("template_engine") val templateEngine: BotTemplateEngine? = null,
    @SerialName("challenge_key") val challengeKey: String? = null,
    @SerialName("link_preview_enabled") val linkPreviewEnabled: Boolean? = null,
    @SerialName("ignore_self_messages") val ignoreSelfMessages: Boolean? = null,
    @SerialName("events_history_enabled") val eventsHistoryEnabled: Boolean? = null,
    @SerialName("who_can_add") val whoCanAdd: BotWhoCanAdd? = null,
    @SerialName("can_edit") val canEdit: List<BotCanEdit>? = null,
    @SerialName("single_chat") val singleChat: Boolean? = null,
    val kind: BotWebhookKind? = null,
    @SerialName("unfurl_domains") val unfurlDomains: List<String>? = null,
)

@Serializable
data class BotUpdateRequest(
    val webhook: BotUpdateRequestWebhook? = null,
    @SerialName("oauth_client") val oauthClient: BotOAuthClientRequest? = null,
    val promo: BotPromoRequest? = null,
)

@Serializable
data class BotWebhook(
    val name: String,
    val nickname: String,
    @SerialName("outgoing_url") val outgoingUrl: String? = null,
    val events: List<BotEventName>,
    @SerialName("trigger_on") val triggerOn: BotTriggerOn,
    val commands: List<String>,
    val scopes: List<String>,
    val template: String? = null,
    @SerialName("template_engine") val templateEngine: BotTemplateEngine,
    @SerialName("challenge_key") val challengeKey: String? = null,
    @SerialName("link_preview_enabled") val linkPreviewEnabled: Boolean,
    @SerialName("ignore_self_messages") val ignoreSelfMessages: Boolean,
    @SerialName("events_history_enabled") val eventsHistoryEnabled: Boolean,
    @SerialName("single_chat") val singleChat: Boolean,
    @SerialName("can_edit") val canEdit: List<BotCanEdit>,
    @SerialName("who_can_add") val whoCanAdd: BotWhoCanAdd,
    val kind: BotWebhookKind? = null,
    @SerialName("unfurl_domains") val unfurlDomains: List<String>,
    @Serializable(with = OffsetDateTimeSerializer::class) @SerialName("last_request_at") val lastRequestAt: OffsetDateTime? = null,
    val url: String? = null,
    @SerialName("secret_token") val secretToken: String? = null,
    @SerialName("last_request_body") val lastRequestBody: String? = null,
)

@Serializable
data class BotWebhookSelfUpdateRequestWebhook(
    @SerialName("outgoing_url") val outgoingUrl: String,
)

@Serializable
data class BotWebhookSelfUpdateRequest(
    val webhook: BotWebhookSelfUpdateRequestWebhook,
)

@Serializable
data class Button(
    val text: String,
    val url: String? = null,
    val data: String? = null,
)

@Serializable
data class Chat(
    val id: Int,
    val name: String,
    @Serializable(with = OffsetDateTimeSerializer::class) @SerialName("created_at") val createdAt: OffsetDateTime,
    @SerialName("owner_id") val ownerId: Int,
    @SerialName("member_ids") val memberIds: List<Int>,
    @SerialName("group_tag_ids") val groupTagIds: List<Int>,
    val channel: Boolean,
    val archived: Boolean,
    val personal: Boolean,
    val public: Boolean,
    @Serializable(with = OffsetDateTimeSerializer::class) @SerialName("last_message_at") val lastMessageAt: OffsetDateTime,
    @SerialName("meet_room_url") val meetRoomUrl: String,
    @SerialName("avatar_url") val avatarUrl: String? = null,
)

@Serializable
data class ChatCreateRequestChat(
    val name: String,
    @SerialName("member_ids") val memberIds: List<Int>? = null,
    @SerialName("group_tag_ids") val groupTagIds: List<Int>? = null,
    val channel: Boolean? = false,
    val public: Boolean? = false,
)

@Serializable
data class ChatCreateRequest(
    val chat: ChatCreateRequestChat,
)

@Serializable
data class ChatExport(
    val id: Int,
)

@Serializable
data class ChatUpdateRequestChat(
    val name: String? = null,
    val public: Boolean? = null,
)

@Serializable
data class ChatUpdateRequest(
    val chat: ChatUpdateRequestChat,
)

@Serializable
data class CompanyBotResponse(
    val id: Int,
    @SerialName("oauth_client") val oauthClient: BotOAuthClient? = null,
    val webhook: CompanyBotWebhook,
)

@Serializable
data class CompanyBotWebhook(
    val name: String,
    val nickname: String,
    @SerialName("outgoing_url") val outgoingUrl: String? = null,
    val events: List<BotEventName>? = null,
    @SerialName("trigger_on") val triggerOn: BotTriggerOn? = null,
    val commands: List<String>? = null,
    val scopes: List<String>? = null,
    val template: String? = null,
    @SerialName("template_engine") val templateEngine: BotTemplateEngine? = null,
    @SerialName("challenge_key") val challengeKey: String? = null,
    @SerialName("link_preview_enabled") val linkPreviewEnabled: Boolean? = null,
    @SerialName("ignore_self_messages") val ignoreSelfMessages: Boolean? = null,
    @SerialName("events_history_enabled") val eventsHistoryEnabled: Boolean? = null,
    @SerialName("single_chat") val singleChat: Boolean? = null,
    @SerialName("can_edit") val canEdit: List<BotCanEdit>? = null,
    @SerialName("who_can_add") val whoCanAdd: BotWhoCanAdd? = null,
)

@Serializable
data class CustomProperty(
    val id: Int,
    val name: String,
    @SerialName("data_type") val dataType: CustomPropertyDataType,
    val value: String? = null,
)

@Serializable
data class CustomPropertyDefinition(
    val id: Int,
    val name: String,
    @SerialName("data_type") val dataType: CustomPropertyDataType,
)

@Serializable
data class Draft(
    val id: Int,
    @SerialName("entity_type") val entityType: MessageEntityType? = null,
    @SerialName("entity_id") val entityId: Int? = null,
    @SerialName("chat_id") val chatId: Int? = null,
    val content: String,
    @SerialName("parent_message_id") val parentMessageId: Int? = null,
    val files: List<File>,
    @SerialName("voice_content") val voiceContent: VoiceContent? = null,
    val schedule: DraftSchedule? = null,
    @Serializable(with = OffsetDateTimeSerializer::class) @SerialName("next_send_at") val nextSendAt: OffsetDateTime? = null,
    @Serializable(with = OffsetDateTimeSerializer::class) @SerialName("created_at") val createdAt: OffsetDateTime,
    @Serializable(with = OffsetDateTimeSerializer::class) @SerialName("updated_at") val updatedAt: OffsetDateTime,
)

@Serializable
data class DraftCreateRequestDraft(
    @SerialName("entity_type") val entityType: MessageEntityType,
    @SerialName("entity_id") val entityId: Int,
    val content: String? = null,
    @SerialName("parent_message_id") val parentMessageId: Int? = null,
    val files: List<DraftFileRequest>? = null,
    val schedule: DraftScheduleRequest? = null,
)

@Serializable
data class DraftCreateRequest(
    val draft: DraftCreateRequestDraft,
)

@Serializable
data class DraftFileRequest(
    val id: Int? = null,
    val key: String,
    val name: String,
    @SerialName("file_type") val fileType: FileType? = null,
    val size: Long? = null,
    val width: Int? = null,
    val height: Int? = null,
    @SerialName("duration_ms") val durationMs: Int? = null,
    val waveform: String? = null,
)

@Serializable
data class DraftRepetition(
    val interval: DraftRepetitionInterval,
    val days: List<Int>? = null,
    @SerialName("nth_day") val nthDay: Int? = null,
)

@Serializable
data class DraftRepetitionRequest(
    val interval: DraftRepetitionInterval,
    val days: List<Int>? = null,
    @SerialName("nth_day") val nthDay: Int? = null,
)

@Serializable
data class DraftSchedule(
    @Serializable(with = OffsetDateTimeSerializer::class) @SerialName("start_date") val startDate: OffsetDateTime,
    @Serializable(with = OffsetDateTimeSerializer::class) @SerialName("end_date") val endDate: OffsetDateTime? = null,
    val repetition: DraftRepetition,
)

@Serializable
data class DraftScheduleRequest(
    @Serializable(with = OffsetDateTimeSerializer::class) @SerialName("start_date") val startDate: OffsetDateTime,
    @Serializable(with = OffsetDateTimeSerializer::class) @SerialName("end_date") val endDate: OffsetDateTime? = null,
    val repetition: DraftRepetitionRequest,
)

@Serializable
data class DraftUpdateRequestDraft(
    val content: String? = null,
    @SerialName("parent_message_id") val parentMessageId: Int? = null,
    val files: List<DraftFileRequest>? = null,
    val schedule: DraftScheduleRequest? = null,
)

@Serializable
data class DraftUpdateRequest(
    val draft: DraftUpdateRequestDraft,
)

@Serializable
data class ExportRequest(
    @SerialName("start_at") val startAt: String,
    @SerialName("end_at") val endAt: String,
    @SerialName("webhook_url") val webhookUrl: String? = null,
    @SerialName("chat_ids") val chatIds: List<Int>? = null,
    @SerialName("skip_chats_file") val skipChatsFile: Boolean? = false,
)

@Serializable
data class ExportWebhookPayload(
    val type: String,
    val event: String,
    @SerialName("export_id") val exportId: Int,
    @Serializable(with = OffsetDateTimeSerializer::class) @SerialName("created_at") val createdAt: OffsetDateTime,
)

@Serializable
data class File(
    val id: Int,
    val key: String,
    val name: String,
    @SerialName("file_type") val fileType: FileType,
    val url: String,
    val width: Int? = null,
    val height: Int? = null,
    @SerialName("duration_ms") val durationMs: Int? = null,
)

@Serializable
data class FileUploadRequest(
    @SerialName("Content-Disposition") val contentDisposition: String,
    val policy: String,
    @SerialName("x-amz-credential") val xAmzCredential: String,
    @SerialName("x-amz-algorithm") val xAmzAlgorithm: String,
    @SerialName("x-amz-date") val xAmzDate: String,
    @SerialName("x-amz-signature") val xAmzSignature: String,
    val key: String,
    val acl: String? = null,
    val bucket: String? = null,
    @Transient val file: ByteArray = ByteArray(0),
)

@Serializable
data class Forwarding(
    @SerialName("original_message_id") val originalMessageId: Int,
    @SerialName("original_chat_id") val originalChatId: Int,
    @SerialName("author_id") val authorId: Int,
    @Serializable(with = OffsetDateTimeSerializer::class) @SerialName("original_created_at") val originalCreatedAt: OffsetDateTime,
    @SerialName("original_thread_id") val originalThreadId: Int? = null,
    @SerialName("original_thread_message_id") val originalThreadMessageId: Int? = null,
    @SerialName("original_thread_parent_chat_id") val originalThreadParentChatId: Int? = null,
)

@Serializable
data class GroupTag(
    val id: Int,
    val name: String,
    @SerialName("users_count") val usersCount: Int,
)

@Serializable
data class GroupTagRequestGroupTag(
    val name: String,
)

@Serializable
data class GroupTagRequest(
    @SerialName("group_tag") val groupTag: GroupTagRequestGroupTag,
)

@Serializable
data class ImportantMessageRequest(
    @SerialName("message_id") val messageId: Int,
)

@Serializable
data class LinkPreviewImage(
    val key: String,
    val name: String,
    val size: Int? = null,
)

@Serializable
data class LinkPreview(
    val title: String,
    val description: String,
    @SerialName("image_url") val imageUrl: String? = null,
    val image: LinkPreviewImage? = null,
)

@Serializable
data class LinkPreviewsRequest(
    @SerialName("link_previews") val linkPreviews: Map<String, LinkPreview>,
)

@Serializable
data class MarkChatUnreadRequest(
    @SerialName("message_id") val messageId: Int? = null,
)

@Serializable
data class MessageThread(
    val id: Long,
    @SerialName("chat_id") val chatId: Long,
)

@Serializable
data class Message(
    val id: Int,
    @SerialName("entity_type") val entityType: MessageEntityType,
    @SerialName("entity_id") val entityId: Int,
    @SerialName("chat_id") val chatId: Int,
    @SerialName("root_chat_id") val rootChatId: Int,
    val content: String,
    @SerialName("user_id") val userId: Int,
    @Serializable(with = OffsetDateTimeSerializer::class) @SerialName("created_at") val createdAt: OffsetDateTime,
    val url: String,
    val files: List<File>,
    @SerialName("voice_content") val voiceContent: VoiceContent? = null,
    val buttons: List<List<Button>>? = null,
    val thread: MessageThread? = null,
    val forwarding: Forwarding? = null,
    @SerialName("parent_message_id") val parentMessageId: Int? = null,
    @SerialName("display_avatar_url") val displayAvatarUrl: String? = null,
    @SerialName("display_name") val displayName: String? = null,
    @Serializable(with = OffsetDateTimeSerializer::class) @SerialName("changed_at") val changedAt: OffsetDateTime? = null,
    @Serializable(with = OffsetDateTimeSerializer::class) @SerialName("deleted_at") val deletedAt: OffsetDateTime? = null,
    val important: Boolean,
)

@Serializable
data class MessageCreateRequestFile(
    val key: String,
    val name: String,
    @SerialName("file_type") val fileType: FileType,
    val size: Long? = null,
    val width: Int? = null,
    val height: Int? = null,
    @SerialName("duration_ms") val durationMs: Int? = null,
    val waveform: String? = null,
)

@Serializable
data class MessageCreateRequestMessage(
    @SerialName("entity_type") val entityType: MessageEntityType? = MessageEntityType.DISCUSSION,
    @SerialName("entity_id") val entityId: Int,
    val content: String? = null,
    val files: List<MessageCreateRequestFile>? = null,
    val buttons: List<List<Button>>? = null,
    @SerialName("parent_message_id") val parentMessageId: Int? = null,
    @SerialName("display_avatar_url") val displayAvatarUrl: String? = null,
    @SerialName("display_name") val displayName: String? = null,
    @SerialName("skip_invite_mentions") val skipInviteMentions: Boolean? = false,
)

@Serializable
data class MessageCreateRequest(
    val message: MessageCreateRequestMessage,
    @SerialName("link_preview") val linkPreview: Boolean? = false,
)

@Serializable
data class MessageUpdateRequestFile(
    val key: String,
    val name: String,
    @SerialName("file_type") val fileType: FileType? = null,
    val size: Long? = null,
    val width: Int? = null,
    val height: Int? = null,
    @SerialName("duration_ms") val durationMs: Int? = null,
    val waveform: String? = null,
)

@Serializable
data class MessageUpdateRequestMessage(
    val content: String? = null,
    val files: List<MessageUpdateRequestFile>? = null,
    val buttons: List<List<Button>>? = null,
    @SerialName("display_avatar_url") val displayAvatarUrl: String? = null,
    @SerialName("display_name") val displayName: String? = null,
)

@Serializable
data class MessageUpdateRequest(
    val message: MessageUpdateRequestMessage,
)

@Serializable
data class OAuthError(
    val error: OAuthErrorCode,
    @SerialName("error_description") val errorDescription: String,
) : Exception()
 {
    override val message: String get() = error.value
}

@Serializable
data class OAuthRevokeRequest(
    val token: String,
    @SerialName("token_type_hint") val tokenTypeHint: OAuthTokenTypeHint? = null,
    @SerialName("client_id") val clientId: String? = null,
    @SerialName("client_secret") val clientSecret: String? = null,
)

@Serializable
data class OAuthToken(
    @SerialName("access_token") val accessToken: String,
    @SerialName("token_type") val tokenType: String,
    @SerialName("refresh_token") val refreshToken: String,
    val scope: String,
    @SerialName("created_at") val createdAt: Long,
)

@Serializable
data class OAuthTokenRequest(
    @SerialName("grant_type") val grantType: String,
    val code: String,
    @SerialName("redirect_uri") val redirectUri: String,
    @SerialName("client_id") val clientId: String? = null,
    @SerialName("client_secret") val clientSecret: String? = null,
    @SerialName("code_verifier") val codeVerifier: String? = null,
)

@Serializable
data class OpenViewRequestView(
    val title: String,
    @SerialName("close_text") val closeText: String? = "Отменить",
    @SerialName("submit_text") val submitText: String? = "Отправить",
    val blocks: List<ViewBlockUnion>,
)

@Serializable
data class OpenViewRequest(
    val type: String,
    @SerialName("trigger_id") val triggerId: String,
    @SerialName("private_metadata") val privateMetadata: String? = null,
    @SerialName("callback_id") val callbackId: String? = null,
    val view: OpenViewRequestView,
)

@Serializable
data class PaginationMetaPaginate(
    @SerialName("next_page") val nextPage: String,
    @SerialName("prev_page") val prevPage: String? = null,
    @SerialName("has_next") val hasNext: Boolean? = null,
    @SerialName("has_prev") val hasPrev: Boolean? = null,
)

@Serializable
data class PaginationMeta(
    val paginate: PaginationMetaPaginate,
)

@Serializable
data class Reaction(
    @SerialName("user_id") val userId: Int,
    @Serializable(with = OffsetDateTimeSerializer::class) @SerialName("created_at") val createdAt: OffsetDateTime,
    val code: String,
    val name: String,
)

@Serializable
data class ReactionRequest(
    val code: String,
    val name: String? = null,
)

@Serializable
data class SearchPaginationMetaPaginate(
    @SerialName("next_page") val nextPage: String,
)

@Serializable
data class SearchPaginationMeta(
    val total: Int,
    val paginate: SearchPaginationMetaPaginate,
)

@Serializable
data class StatusUpdateRequestStatus(
    val emoji: String? = null,
    val title: String? = null,
    @Serializable(with = OffsetDateTimeSerializer::class) @SerialName("expires_at") val expiresAt: OffsetDateTime? = null,
    @SerialName("is_away") val isAway: Boolean? = null,
    @SerialName("away_message") val awayMessage: String? = null,
)

@Serializable
data class StatusUpdateRequest(
    val status: StatusUpdateRequestStatus,
)

@Serializable
data class SubmitViewResponseRequest(
    @SerialName("submit_id") val submitId: String,
    val errors: Map<String, String>? = null,
)

@Serializable
data class SubmitViewResponseResult(
    val success: Boolean,
)

@Serializable
data class Task(
    val id: Int,
    val kind: TaskKind,
    val content: String,
    @Serializable(with = OffsetDateTimeSerializer::class) @SerialName("due_at") val dueAt: OffsetDateTime? = null,
    val priority: Int,
    @SerialName("user_id") val userId: Int,
    @SerialName("chat_id") val chatId: Int? = null,
    val status: TaskStatus,
    @Serializable(with = OffsetDateTimeSerializer::class) @SerialName("created_at") val createdAt: OffsetDateTime,
    @SerialName("performer_ids") val performerIds: List<Int>,
    @SerialName("all_day") val allDay: Boolean,
    @SerialName("custom_properties") val customProperties: List<CustomProperty>,
)

@Serializable
data class TaskCreateRequestCustomProperty(
    val id: Int,
    val value: String,
)

@Serializable
data class TaskCreateRequestTask(
    val kind: TaskKind,
    val content: String? = null,
    @Serializable(with = OffsetDateTimeSerializer::class) @SerialName("due_at") val dueAt: OffsetDateTime? = null,
    val priority: Int? = 1,
    @SerialName("performer_ids") val performerIds: List<Int>? = null,
    @SerialName("chat_id") val chatId: Int? = null,
    @SerialName("all_day") val allDay: Boolean? = null,
    @SerialName("custom_properties") val customProperties: List<TaskCreateRequestCustomProperty>? = null,
)

@Serializable
data class TaskCreateRequest(
    val task: TaskCreateRequestTask,
)

@Serializable
data class TaskUpdateRequestCustomProperty(
    val id: Int,
    val value: String,
)

@Serializable
data class TaskUpdateRequestTask(
    val kind: TaskKind? = null,
    val content: String? = null,
    @Serializable(with = OffsetDateTimeSerializer::class) @SerialName("due_at") val dueAt: OffsetDateTime? = null,
    val priority: Int? = null,
    @SerialName("performer_ids") val performerIds: List<Int>? = null,
    val status: TaskStatus? = null,
    @SerialName("all_day") val allDay: Boolean? = null,
    @Serializable(with = OffsetDateTimeSerializer::class) @SerialName("done_at") val doneAt: OffsetDateTime? = null,
    @SerialName("custom_properties") val customProperties: List<TaskUpdateRequestCustomProperty>? = null,
)

@Serializable
data class TaskUpdateRequest(
    val task: TaskUpdateRequestTask,
)

@Serializable
data class Thread(
    val id: Long,
    @SerialName("chat_id") val chatId: Long,
    @SerialName("message_id") val messageId: Long? = null,
    @SerialName("message_chat_id") val messageChatId: Long? = null,
    @Serializable(with = OffsetDateTimeSerializer::class) @SerialName("updated_at") val updatedAt: OffsetDateTime,
)

@Serializable
data class UpdateMemberRoleRequest(
    val role: ChatMemberRole,
)

@Serializable
data class UploadParams(
    @SerialName("Content-Disposition") val contentDisposition: String,
    val acl: String? = null,
    val policy: String,
    @SerialName("x-amz-credential") val xAmzCredential: String,
    @SerialName("x-amz-algorithm") val xAmzAlgorithm: String,
    @SerialName("x-amz-date") val xAmzDate: String,
    @SerialName("x-amz-signature") val xAmzSignature: String,
    val key: String,
    val bucket: String? = null,
    @SerialName("direct_url") val directUrl: String,
)

@Serializable
data class User(
    val id: Int,
    @SerialName("first_name") val firstName: String? = null,
    @SerialName("last_name") val lastName: String? = null,
    val nickname: String,
    val email: String? = null,
    @SerialName("phone_number") val phoneNumber: String? = null,
    val department: String? = null,
    val title: String? = null,
    val role: UserRole,
    val suspended: Boolean,
    @SerialName("invite_status") val inviteStatus: InviteStatus,
    @SerialName("inviter_id") val inviterId: Int? = null,
    @SerialName("list_tags") val listTags: List<String>,
    @SerialName("custom_properties") val customProperties: List<CustomProperty>,
    @SerialName("user_status") val userStatus: UserStatus? = null,
    val bot: Boolean,
    val sso: Boolean,
    @Serializable(with = OffsetDateTimeSerializer::class) @SerialName("created_at") val createdAt: OffsetDateTime,
    @Serializable(with = OffsetDateTimeSerializer::class) @SerialName("last_activity_at") val lastActivityAt: OffsetDateTime? = null,
    @SerialName("time_zone") val timeZone: String? = null,
    @SerialName("image_url") val imageUrl: String? = null,
)

@Serializable
data class UserCreateRequestCustomProperty(
    val id: Int,
    val value: String,
)

@Serializable
data class UserCreateRequestUser(
    @SerialName("first_name") val firstName: String? = null,
    @SerialName("last_name") val lastName: String? = null,
    val email: String,
    @SerialName("phone_number") val phoneNumber: String? = null,
    val nickname: String? = null,
    val department: String? = null,
    val title: String? = null,
    val role: UserCreateRole? = null,
    val suspended: Boolean? = false,
    @SerialName("list_tags") val listTags: List<String>? = null,
    @SerialName("chat_ids") val chatIds: List<Int>? = null,
    @SerialName("custom_properties") val customProperties: List<UserCreateRequestCustomProperty>? = null,
)

@Serializable
data class UserCreateRequest(
    val user: UserCreateRequestUser,
    @SerialName("skip_email_notify") val skipEmailNotify: Boolean? = false,
)

@Serializable
data class UserStatusAwayMessage(
    val text: String,
)

@Serializable
data class UserStatus(
    val emoji: String,
    val title: String,
    @Serializable(with = OffsetDateTimeSerializer::class) @SerialName("expires_at") val expiresAt: OffsetDateTime? = null,
    @SerialName("is_away") val isAway: Boolean,
    @SerialName("away_message") val awayMessage: UserStatusAwayMessage? = null,
)

@Serializable
data class UserUpdateRequestCustomProperty(
    val id: Int,
    val value: String,
)

@Serializable
data class UserUpdateRequestUser(
    @SerialName("first_name") val firstName: String? = null,
    @SerialName("last_name") val lastName: String? = null,
    val email: String? = null,
    @SerialName("phone_number") val phoneNumber: String? = null,
    val nickname: String? = null,
    val department: String? = null,
    val title: String? = null,
    val role: UserRoleInput? = null,
    @SerialName("chat_ids") val chatIds: List<Int>? = null,
    val suspended: Boolean? = null,
    @SerialName("list_tags") val listTags: List<String>? = null,
    @SerialName("custom_properties") val customProperties: List<UserUpdateRequestCustomProperty>? = null,
)

@Serializable
data class UserUpdateRequest(
    val user: UserUpdateRequestUser,
)

@Serializable
data class ViewBlock(
    val type: String,
    val text: String? = null,
    val name: String? = null,
    val label: String? = null,
    @Serializable(with = OffsetDateTimeSerializer::class) @SerialName("initial_date") val initialDate: OffsetDateTime? = null,
)

@Serializable
data class ViewBlockCheckboxOption(
    val text: String,
    val value: String,
    val description: String? = null,
    val checked: Boolean? = null,
)

@Serializable
data class ViewBlockSelectOption(
    val text: String,
    val value: String,
    val description: String? = null,
    val selected: Boolean? = null,
)

@Serializable
data class ViewBlockSelectableOption(
    val text: String,
    val value: String,
    val description: String? = null,
    val checked: Boolean? = null,
)

@Serializable
data class VoiceContent(
    @SerialName("duration_ms") val durationMs: Int,
    val waveform: String,
    val transcript: String? = null,
)

@Serializable
data class WebhookEvent(
    val id: String,
    @SerialName("event_type") val eventType: String,
    val payload: WebhookPayloadUnion,
    @Serializable(with = OffsetDateTimeSerializer::class) @SerialName("created_at") val createdAt: OffsetDateTime,
)

@Serializable
data class WebhookEventsStream(
    val url: String,
    @Serializable(with = OffsetDateTimeSerializer::class) @SerialName("expires_at") val expiresAt: OffsetDateTime,
)

@Serializable
data class WebhookLink(
    val url: String,
    val domain: String,
    val skip: Boolean,
)

@Serializable
data class WebhookMessageThread(
    @SerialName("message_id") val messageId: Int? = null,
    @SerialName("message_chat_id") val messageChatId: Int? = null,
)

@Serializable
data class WebhookVideoCallMember(
    @SerialName("user_id") val userId: Int,
    @Serializable(with = OffsetDateTimeSerializer::class) @SerialName("joined_at") val joinedAt: OffsetDateTime,
    @Serializable(with = OffsetDateTimeSerializer::class) @SerialName("left_at") val leftAt: OffsetDateTime,
)

@Serializable
data class WebhookVideoCallThread(
    val id: Int,
    @SerialName("chat_id") val chatId: Int,
    @SerialName("message_id") val messageId: Int? = null,
    @SerialName("message_chat_id") val messageChatId: Int? = null,
)

@Serializable
data class UpdateBotAvatarRequest(
    @Transient val image: ByteArray = ByteArray(0),
)

@Serializable
data class CreateChatResponseMeta(
    @SerialName("not_found_member_ids") val notFoundMemberIds: List<Int>,
    @SerialName("not_found_group_tag_ids") val notFoundGroupTagIds: List<Int>,
)

@Serializable
data class UpdateChatAvatarRequest(
    @Transient val image: ByteArray = ByteArray(0),
)

@Serializable
data class UpdateProfileAvatarRequest(
    @Transient val image: ByteArray = ByteArray(0),
)

@Serializable
data class UpdateUserAvatarRequest(
    @Transient val image: ByteArray = ByteArray(0),
)

@Serializable
data class GetAuditEventsResponse(
    val data: List<AuditEvent>,
    val meta: PaginationMeta,
)

@Serializable
data class ListBotsResponse(
    val data: List<BotResponse>,
    val meta: PaginationMeta,
)

@Serializable
data class ListBotTokensResponse(
    val data: List<BotAccessToken>,
    val meta: PaginationMeta,
)

@Serializable
data class CreateChatResponse(
    val data: Chat,
    val meta: CreateChatResponseMeta,
)

@Serializable
data class ListChatsResponse(
    val data: List<Chat>,
    val meta: PaginationMeta,
)

@Serializable
data class ListMembersResponse(
    val data: List<User>,
    val meta: PaginationMeta,
)

@Serializable
data class ListCompanyBotsResponse(
    val data: List<CompanyBotResponse>,
    val meta: PaginationMeta,
)

@Serializable
data class ListCompanyChatsResponse(
    val data: List<Chat>,
    val meta: PaginationMeta,
)

@Serializable
data class ListPropertiesResponse(
    val data: List<CustomPropertyDefinition>,
)

@Serializable
data class ListDraftsResponse(
    val data: List<Draft>,
    val meta: PaginationMeta,
)

@Serializable
data class ListTagsResponse(
    val data: List<GroupTag>,
    val meta: PaginationMeta,
)

@Serializable
data class GetTagUsersResponse(
    val data: List<User>,
    val meta: PaginationMeta,
)

@Serializable
data class ListImportantMessagesResponse(
    val data: List<Message>,
    val meta: PaginationMeta,
)

@Serializable
data class ListChatMessagesResponse(
    val data: List<Message>,
    val meta: PaginationMeta,
)

@Serializable
data class ListReactionsResponse(
    val data: List<Reaction>,
    val meta: PaginationMeta,
)

@Serializable
data class SearchChatsResponse(
    val data: List<Chat>,
    val meta: SearchPaginationMeta,
)

@Serializable
data class SearchMessagesResponse(
    val data: List<Message>,
    val meta: SearchPaginationMeta,
)

@Serializable
data class SearchUsersResponse(
    val data: List<User>,
    val meta: SearchPaginationMeta,
)

@Serializable
data class ListTasksResponse(
    val data: List<Task>,
    val meta: PaginationMeta,
)

@Serializable
data class ListThreadsResponse(
    val data: List<Thread>,
    val meta: PaginationMeta,
)

@Serializable
data class ListUsersResponse(
    val data: List<User>,
    val meta: PaginationMeta,
)

@Serializable
data class GetWebhookEventsResponse(
    val data: List<WebhookEvent>,
    val meta: PaginationMeta,
)

@Serializable
data class BotResponseDataWrapper(val data: BotResponse)

@Serializable
data class WebhookEventsStreamDataWrapper(val data: WebhookEventsStream)

@Serializable
data class BotSelfTokenResponseDataWrapper(val data: BotSelfTokenResponse)

@Serializable
data class BotCreateResponseDataWrapper(val data: BotCreateResponse)

@Serializable
data class BotAccessTokenDataWrapper(val data: BotAccessToken)

@Serializable
data class BotSelfResponseDataWrapper(val data: BotSelfResponse)

@Serializable
data class AvatarDataDataWrapper(val data: AvatarData)

@Serializable
data class ChatDataWrapper(val data: Chat)

@Serializable
data class ChatExportDataWrapper(val data: ChatExport)

@Serializable
data class DraftDataWrapper(val data: Draft)

@Serializable
data class GroupTagDataWrapper(val data: GroupTag)

@Serializable
data class MessageDataWrapper(val data: Message)

@Serializable
data class ThreadDataWrapper(val data: Thread)

@Serializable
data class AccessTokenInfoDataWrapper(val data: AccessTokenInfo)

@Serializable
data class UserDataWrapper(val data: User)

@Serializable
data class UserStatusDataWrapper(val data: UserStatus)

@Serializable
data class TaskDataWrapper(val data: Task)
