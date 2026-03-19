package com.pachca.sdk

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.Transient

/** Тип аудит-события */
@Serializable
enum class AuditEventKey(val value: String) {
    /** Пользователь успешно вошел в систему */
    @SerialName("user_login") USER_LOGIN("user_login"),
    /** Пользователь вышел из системы */
    @SerialName("user_logout") USER_LOGOUT("user_logout"),
    /** Неудачная попытка двухфакторной аутентификации */
    @SerialName("user_2fa_fail") USER_2FA_FAIL("user_2fa_fail"),
    /** Успешная двухфакторная аутентификация */
    @SerialName("user_2fa_success") USER_2FA_SUCCESS("user_2fa_success"),
    /** Создана новая учетная запись пользователя */
    @SerialName("user_created") USER_CREATED("user_created"),
    /** Учетная запись пользователя удалена */
    @SerialName("user_deleted") USER_DELETED("user_deleted"),
    /** Роль пользователя была изменена */
    @SerialName("user_role_changed") USER_ROLE_CHANGED("user_role_changed"),
    /** Данные пользователя обновлены */
    @SerialName("user_updated") USER_UPDATED("user_updated"),
    /** Создан новый тег */
    @SerialName("tag_created") TAG_CREATED("tag_created"),
    /** Тег удален */
    @SerialName("tag_deleted") TAG_DELETED("tag_deleted"),
    /** Пользователь добавлен в тег */
    @SerialName("user_added_to_tag") USER_ADDED_TO_TAG("user_added_to_tag"),
    /** Пользователь удален из тега */
    @SerialName("user_removed_from_tag") USER_REMOVED_FROM_TAG("user_removed_from_tag"),
    /** Создан новый чат */
    @SerialName("chat_created") CHAT_CREATED("chat_created"),
    /** Чат переименован */
    @SerialName("chat_renamed") CHAT_RENAMED("chat_renamed"),
    /** Изменены права доступа к чату */
    @SerialName("chat_permission_changed") CHAT_PERMISSION_CHANGED("chat_permission_changed"),
    /** Пользователь присоединился к чату */
    @SerialName("user_chat_join") USER_CHAT_JOIN("user_chat_join"),
    /** Пользователь покинул чат */
    @SerialName("user_chat_leave") USER_CHAT_LEAVE("user_chat_leave"),
    /** Тег добавлен в чат */
    @SerialName("tag_added_to_chat") TAG_ADDED_TO_CHAT("tag_added_to_chat"),
    /** Тег удален из чата */
    @SerialName("tag_removed_from_chat") TAG_REMOVED_FROM_CHAT("tag_removed_from_chat"),
    /** Сообщение отредактировано */
    @SerialName("message_updated") MESSAGE_UPDATED("message_updated"),
    /** Сообщение удалено */
    @SerialName("message_deleted") MESSAGE_DELETED("message_deleted"),
    /** Сообщение создано */
    @SerialName("message_created") MESSAGE_CREATED("message_created"),
    /** Реакция добавлена */
    @SerialName("reaction_created") REACTION_CREATED("reaction_created"),
    /** Реакция удалена */
    @SerialName("reaction_deleted") REACTION_DELETED("reaction_deleted"),
    /** Тред создан */
    @SerialName("thread_created") THREAD_CREATED("thread_created"),
    /** Создан новый токен доступа */
    @SerialName("access_token_created") ACCESS_TOKEN_CREATED("access_token_created"),
    /** Токен доступа обновлен */
    @SerialName("access_token_updated") ACCESS_TOKEN_UPDATED("access_token_updated"),
    /** Токен доступа удален */
    @SerialName("access_token_destroy") ACCESS_TOKEN_DESTROY("access_token_destroy"),
    /** Данные зашифрованы */
    @SerialName("kms_encrypt") KMS_ENCRYPT("kms_encrypt"),
    /** Данные расшифрованы */
    @SerialName("kms_decrypt") KMS_DECRYPT("kms_decrypt"),
    /** Доступ к журналам аудита получен */
    @SerialName("audit_events_accessed") AUDIT_EVENTS_ACCESSED("audit_events_accessed"),
    /** Срабатывание правила DLP-системы */
    @SerialName("dlp_violation_detected") DLP_VIOLATION_DETECTED("dlp_violation_detected"),
    /** Поиск сотрудников через API */
    @SerialName("search_users_api") SEARCH_USERS_API("search_users_api"),
    /** Поиск чатов через API */
    @SerialName("search_chats_api") SEARCH_CHATS_API("search_chats_api"),
    /** Поиск сообщений через API */
    @SerialName("search_messages_api") SEARCH_MESSAGES_API("search_messages_api"),
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
enum class CustomPropertyDataType(val value: String) {
    /** Строковое значение */
    @SerialName("string") STRING("string"),
    /** Числовое значение */
    @SerialName("number") NUMBER("number"),
    /** Дата */
    @SerialName("date") DATE("date"),
    /** Ссылка */
    @SerialName("link") LINK("link"),
}

/** Тип файла */
@Serializable
enum class FileType(val value: String) {
    /** Обычный файл */
    @SerialName("file") FILE("file"),
    /** Изображение */
    @SerialName("image") IMAGE("image"),
}

/** Статус приглашения пользователя */
@Serializable
enum class InviteStatus(val value: String) {
    /** Принято */
    @SerialName("confirmed") CONFIRMED("confirmed"),
    /** Отправлено */
    @SerialName("sent") SENT("sent"),
}

/** Тип события webhook для участников */
@Serializable
enum class MemberEventType(val value: String) {
    /** Добавление */
    @SerialName("add") ADD("add"),
    /** Удаление */
    @SerialName("remove") REMOVE("remove"),
}

/** Тип сущности для сообщений */
@Serializable
enum class MessageEntityType(val value: String) {
    /** Беседа или канал */
    @SerialName("discussion") DISCUSSION("discussion"),
    /** Тред */
    @SerialName("thread") THREAD("thread"),
    /** Пользователь */
    @SerialName("user") USER("user"),
}

/** Скоуп доступа OAuth токена */
@Serializable
enum class OAuthScope(val value: String) {
    /** Просмотр чатов и списка чатов */
    @SerialName("chats:read") CHATS_READ("chats:read"),
    /** Создание новых чатов */
    @SerialName("chats:create") CHATS_CREATE("chats:create"),
    /** Изменение настроек чата */
    @SerialName("chats:update") CHATS_UPDATE("chats:update"),
    /** Архивация и разархивация чатов */
    @SerialName("chats:archive") CHATS_ARCHIVE("chats:archive"),
    /** Выход из чатов */
    @SerialName("chats:leave") CHATS_LEAVE("chats:leave"),
    /** Просмотр участников чата */
    @SerialName("chat_members:read") CHAT_MEMBERS_READ("chat_members:read"),
    /** Добавление, изменение и удаление участников чата */
    @SerialName("chat_members:write") CHAT_MEMBERS_WRITE("chat_members:write"),
    /** Скачивание экспортов чата */
    @SerialName("chat_exports:read") CHAT_EXPORTS_READ("chat_exports:read"),
    /** Создание экспортов чата */
    @SerialName("chat_exports:write") CHAT_EXPORTS_WRITE("chat_exports:write"),
    /** Просмотр сообщений в чатах */
    @SerialName("messages:read") MESSAGES_READ("messages:read"),
    /** Отправка сообщений */
    @SerialName("messages:create") MESSAGES_CREATE("messages:create"),
    /** Редактирование сообщений */
    @SerialName("messages:update") MESSAGES_UPDATE("messages:update"),
    /** Удаление сообщений */
    @SerialName("messages:delete") MESSAGES_DELETE("messages:delete"),
    /** Просмотр реакций на сообщения */
    @SerialName("reactions:read") REACTIONS_READ("reactions:read"),
    /** Добавление и удаление реакций */
    @SerialName("reactions:write") REACTIONS_WRITE("reactions:write"),
    /** Закрепление и открепление сообщений */
    @SerialName("pins:write") PINS_WRITE("pins:write"),
    /** Просмотр тредов (комментариев) */
    @SerialName("threads:read") THREADS_READ("threads:read"),
    /** Создание тредов (комментариев) */
    @SerialName("threads:create") THREADS_CREATE("threads:create"),
    /** Unfurl (разворачивание ссылок) */
    @SerialName("link_previews:write") LINK_PREVIEWS_WRITE("link_previews:write"),
    /** Просмотр информации о сотрудниках и списка сотрудников */
    @SerialName("users:read") USERS_READ("users:read"),
    /** Создание новых сотрудников */
    @SerialName("users:create") USERS_CREATE("users:create"),
    /** Редактирование данных сотрудника */
    @SerialName("users:update") USERS_UPDATE("users:update"),
    /** Удаление сотрудников */
    @SerialName("users:delete") USERS_DELETE("users:delete"),
    /** Просмотр тегов */
    @SerialName("group_tags:read") GROUP_TAGS_READ("group_tags:read"),
    /** Создание, редактирование и удаление тегов */
    @SerialName("group_tags:write") GROUP_TAGS_WRITE("group_tags:write"),
    /** Изменение настроек бота */
    @SerialName("bots:write") BOTS_WRITE("bots:write"),
    /** Просмотр информации о своем профиле */
    @SerialName("profile:read") PROFILE_READ("profile:read"),
    /** Просмотр статуса профиля */
    @SerialName("profile_status:read") PROFILE_STATUS_READ("profile_status:read"),
    /** Изменение и удаление статуса профиля */
    @SerialName("profile_status:write") PROFILE_STATUS_WRITE("profile_status:write"),
    /** Просмотр статуса сотрудника */
    @SerialName("user_status:read") USER_STATUS_READ("user_status:read"),
    /** Изменение и удаление статуса сотрудника */
    @SerialName("user_status:write") USER_STATUS_WRITE("user_status:write"),
    /** Просмотр дополнительных полей */
    @SerialName("custom_properties:read") CUSTOM_PROPERTIES_READ("custom_properties:read"),
    /** Просмотр журнала аудита */
    @SerialName("audit_events:read") AUDIT_EVENTS_READ("audit_events:read"),
    /** Просмотр задач */
    @SerialName("tasks:read") TASKS_READ("tasks:read"),
    /** Создание задач */
    @SerialName("tasks:create") TASKS_CREATE("tasks:create"),
    /** Изменение задачи */
    @SerialName("tasks:update") TASKS_UPDATE("tasks:update"),
    /** Удаление задачи */
    @SerialName("tasks:delete") TASKS_DELETE("tasks:delete"),
    /** Скачивание файлов */
    @SerialName("files:read") FILES_READ("files:read"),
    /** Загрузка файлов */
    @SerialName("files:write") FILES_WRITE("files:write"),
    /** Получение данных для загрузки файлов */
    @SerialName("uploads:write") UPLOADS_WRITE("uploads:write"),
    /** Открытие форм (представлений) */
    @SerialName("views:write") VIEWS_WRITE("views:write"),
    /** Просмотр вебхуков */
    @SerialName("webhooks:read") WEBHOOKS_READ("webhooks:read"),
    /** Создание и управление вебхуками */
    @SerialName("webhooks:write") WEBHOOKS_WRITE("webhooks:write"),
    /** Просмотр лога вебхуков */
    @SerialName("webhooks:events:read") WEBHOOKS_EVENTS_READ("webhooks:events:read"),
    /** Удаление записи в логе вебхука */
    @SerialName("webhooks:events:delete") WEBHOOKS_EVENTS_DELETE("webhooks:events:delete"),
    /** Поиск сотрудников */
    @SerialName("search:users") SEARCH_USERS("search:users"),
    /** Поиск чатов */
    @SerialName("search:chats") SEARCH_CHATS("search:chats"),
    /** Поиск сообщений */
    @SerialName("search:messages") SEARCH_MESSAGES("search:messages"),
}

/** Тип события webhook для реакций */
@Serializable
enum class ReactionEventType(val value: String) {
    /** Создание */
    @SerialName("new") NEW("new"),
    /** Удаление */
    @SerialName("delete") DELETE("delete"),
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
enum class TaskKind(val value: String) {
    /** Позвонить контакту */
    @SerialName("call") CALL("call"),
    /** Встреча */
    @SerialName("meeting") MEETING("meeting"),
    /** Простое напоминание */
    @SerialName("reminder") REMINDER("reminder"),
    /** Событие */
    @SerialName("event") EVENT("event"),
    /** Написать письмо */
    @SerialName("email") EMAIL("email"),
}

/** Статус напоминания */
@Serializable
enum class TaskStatus(val value: String) {
    /** Выполнено */
    @SerialName("done") DONE("done"),
    /** Активно */
    @SerialName("undone") UNDONE("undone"),
}

/** Тип события webhook для пользователей */
@Serializable
enum class UserEventType(val value: String) {
    /** Приглашение */
    @SerialName("invite") INVITE("invite"),
    /** Подтверждение */
    @SerialName("confirm") CONFIRM("confirm"),
    /** Обновление */
    @SerialName("update") UPDATE("update"),
    /** Приостановка */
    @SerialName("suspend") SUSPEND("suspend"),
    /** Активация */
    @SerialName("activate") ACTIVATE("activate"),
    /** Удаление */
    @SerialName("delete") DELETE("delete"),
}

/** Роль пользователя в системе */
@Serializable
enum class UserRole(val value: String) {
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
enum class ValidationErrorCode(val value: String) {
    /** Обязательное поле (не может быть пустым) */
    @SerialName("blank") BLANK("blank"),
    /** Слишком длинное значение (пояснения вы получите в поле message) */
    @SerialName("too_long") TOO_LONG("too_long"),
    /** Поле не соответствует правилам (пояснения вы получите в поле message) */
    @SerialName("invalid") INVALID("invalid"),
    /** Поле имеет непредусмотренное значение */
    @SerialName("inclusion") INCLUSION("inclusion"),
    /** Поле имеет недопустимое значение */
    @SerialName("exclusion") EXCLUSION("exclusion"),
    /** Название для этого поля уже существует */
    @SerialName("taken") TAKEN("taken"),
    /** Emoji статуса не может содержать значения отличные от Emoji символа */
    @SerialName("wrong_emoji") WRONG_EMOJI("wrong_emoji"),
    /** Объект не найден */
    @SerialName("not_found") NOT_FOUND("not_found"),
    /** Объект уже существует (пояснения вы получите в поле message) */
    @SerialName("already_exists") ALREADY_EXISTS("already_exists"),
    /** Ошибка личного чата (пояснения вы получите в поле message) */
    @SerialName("personal_chat") PERSONAL_CHAT("personal_chat"),
    /** Отображаемая ошибка (пояснения вы получите в поле message) */
    @SerialName("displayed_error") DISPLAYED_ERROR("displayed_error"),
    /** Действие запрещено */
    @SerialName("not_authorized") NOT_AUTHORIZED("not_authorized"),
    /** Выбран слишком большой диапазон дат */
    @SerialName("invalid_date_range") INVALID_DATE_RANGE("invalid_date_range"),
    /** Некорректный URL вебхука */
    @SerialName("invalid_webhook_url") INVALID_WEBHOOK_URL("invalid_webhook_url"),
    /** Достигнут лимит запросов */
    @SerialName("rate_limit") RATE_LIMIT("rate_limit"),
    /** Превышен лимит активных сотрудников (пояснения вы получите в поле message) */
    @SerialName("licenses_limit") LICENSES_LIMIT("licenses_limit"),
    /** Превышен лимит количества реакций, которые может добавить пользователь (20 уникальных реакций) */
    @SerialName("user_limit") USER_LIMIT("user_limit"),
    /** Превышен лимит количества уникальных реакций, которые можно добавить на сообщение (30 уникальных реакций) */
    @SerialName("unique_limit") UNIQUE_LIMIT("unique_limit"),
    /** Превышен лимит количества реакций, которые можно добавить на сообщение (1000 реакций) */
    @SerialName("general_limit") GENERAL_LIMIT("general_limit"),
    /** Ошибка выполнения запроса (пояснения вы получите в поле message) */
    @SerialName("unhandled") UNHANDLED("unhandled"),
    /** Не удалось найти идентификатор события */
    @SerialName("trigger_not_found") TRIGGER_NOT_FOUND("trigger_not_found"),
    /** Время жизни идентификатора события истекло */
    @SerialName("trigger_expired") TRIGGER_EXPIRED("trigger_expired"),
    /** Обязательный параметр не передан */
    @SerialName("required") REQUIRED("required"),
    /** Недопустимое значение (не входит в список допустимых) */
    @SerialName("in") IN("in"),
    /** Значение неприменимо в данном контексте (пояснения вы получите в поле message) */
    @SerialName("not_applicable") NOT_APPLICABLE("not_applicable"),
    /** Нельзя изменить свои собственные данные */
    @SerialName("self_update") SELF_UPDATE("self_update"),
    /** Нельзя изменить данные владельца */
    @SerialName("owner_protected") OWNER_PROTECTED("owner_protected"),
    /** Значение уже назначено */
    @SerialName("already_assigned") ALREADY_ASSIGNED("already_assigned"),
    /** Недостаточно прав для выполнения действия (пояснения вы получите в поле message) */
    @SerialName("forbidden") FORBIDDEN("forbidden"),
    /** Доступ запрещён (недостаточно прав) */
    @SerialName("permission_denied") PERMISSION_DENIED("permission_denied"),
    /** Доступ запрещён */
    @SerialName("access_denied") ACCESS_DENIED("access_denied"),
    /** Некорректные параметры запроса (пояснения вы получите в поле message) */
    @SerialName("wrong_params") WRONG_PARAMS("wrong_params"),
    /** Требуется оплата */
    @SerialName("payment_required") PAYMENT_REQUIRED("payment_required"),
    /** Значение слишком короткое (пояснения вы получите в поле message) */
    @SerialName("min_length") MIN_LENGTH("min_length"),
    /** Значение слишком длинное (пояснения вы получите в поле message) */
    @SerialName("max_length") MAX_LENGTH("max_length"),
    /** Использовано зарезервированное системное слово (here, all) */
    @SerialName("use_of_system_words") USE_OF_SYSTEM_WORDS("use_of_system_words"),
}

/** Тип события webhook */
@Serializable
enum class WebhookEventType(val value: String) {
    /** Создание */
    @SerialName("new") NEW("new"),
    /** Обновление */
    @SerialName("update") UPDATE("update"),
    /** Удаление */
    @SerialName("delete") DELETE("delete"),
}

@Serializable
sealed interface AuditEventDetailsUnion {
    val type: String
}

@Serializable
@SerialName("")
data class AuditDetailsEmpty(
    override val type: String = "",
) : AuditEventDetailsUnion

@Serializable
@SerialName("")
data class AuditDetailsUserUpdated(
    override val type: String = "",
    @SerialName("changed_attrs") val changedAttrs: List<String>,
) : AuditEventDetailsUnion

@Serializable
@SerialName("")
data class AuditDetailsRoleChanged(
    override val type: String = "",
    @SerialName("new_company_role") val newCompanyRole: String,
    @SerialName("previous_company_role") val previousCompanyRole: String,
    @SerialName("initiator_id") val initiatorId: Int,
) : AuditEventDetailsUnion

@Serializable
@SerialName("")
data class AuditDetailsTagName(
    override val type: String = "",
    val name: String,
) : AuditEventDetailsUnion

@Serializable
@SerialName("")
data class AuditDetailsInitiator(
    override val type: String = "",
    @SerialName("initiator_id") val initiatorId: Int,
) : AuditEventDetailsUnion

@Serializable
@SerialName("")
data class AuditDetailsInviter(
    override val type: String = "",
    @SerialName("inviter_id") val inviterId: Int,
) : AuditEventDetailsUnion

@Serializable
@SerialName("")
data class AuditDetailsChatRenamed(
    override val type: String = "",
    @SerialName("old_name") val oldName: String,
    @SerialName("new_name") val newName: String,
) : AuditEventDetailsUnion

@Serializable
@SerialName("")
data class AuditDetailsChatPermission(
    override val type: String = "",
    @SerialName("public_access") val publicAccess: Boolean,
) : AuditEventDetailsUnion

@Serializable
@SerialName("")
data class AuditDetailsTagChat(
    override val type: String = "",
    @SerialName("chat_id") val chatId: Int,
    @SerialName("tag_name") val tagName: String,
) : AuditEventDetailsUnion

@Serializable
@SerialName("")
data class AuditDetailsChatId(
    override val type: String = "",
    @SerialName("chat_id") val chatId: Int,
) : AuditEventDetailsUnion

@Serializable
@SerialName("")
data class AuditDetailsTokenScopes(
    override val type: String = "",
    val scopes: List<String>,
) : AuditEventDetailsUnion

@Serializable
@SerialName("")
data class AuditDetailsKms(
    override val type: String = "",
    @SerialName("chat_id") val chatId: Int,
    @SerialName("message_id") val messageId: Int,
    val reason: String,
) : AuditEventDetailsUnion

@Serializable
@SerialName("")
data class AuditDetailsDlp(
    override val type: String = "",
    @SerialName("dlp_rule_id") val dlpRuleId: Int,
    @SerialName("dlp_rule_name") val dlpRuleName: String,
    @SerialName("message_id") val messageId: Int,
    @SerialName("chat_id") val chatId: Int,
    @SerialName("user_id") val userId: Int,
    @SerialName("action_message") val actionMessage: String,
    @SerialName("conditions_matched") val conditionsMatched: Boolean,
) : AuditEventDetailsUnion

@Serializable
@SerialName("")
data class AuditDetailsSearch(
    override val type: String = "",
    @SerialName("search_type") val searchType: String,
    @SerialName("query_present") val queryPresent: Boolean,
    @SerialName("cursor_present") val cursorPresent: Boolean,
    val limit: Int,
    val filters: Map<String, String>,
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
    val options: List<ViewBlockSelectableOption>? = null,
    val required: Boolean? = null,
    val hint: String? = null,
) : ViewBlockUnion

@Serializable
@SerialName("radio")
data class ViewBlockRadio(
    override val type: String = "radio",
    val name: String,
    val label: String,
    val options: List<ViewBlockSelectableOption>? = null,
    val required: Boolean? = null,
    val hint: String? = null,
) : ViewBlockUnion

@Serializable
@SerialName("checkbox")
data class ViewBlockCheckbox(
    override val type: String = "checkbox",
    val name: String,
    val label: String,
    val options: List<ViewBlockCheckboxOption>? = null,
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

@Serializable
sealed interface WebhookPayloadUnion {
    val type: String
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
    @SerialName("created_at") val createdAt: String,
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
    @SerialName("message_id") val messageId: Int,
    val code: String,
    val name: String,
    @SerialName("user_id") val userId: Int,
    @SerialName("created_at") val createdAt: String,
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
) : WebhookPayloadUnion

@Serializable
@SerialName("chat_member")
data class ChatMemberWebhookPayload(
    override val type: String = "chat_member",
    val event: MemberEventType,
    @SerialName("chat_id") val chatId: Int,
    @SerialName("thread_id") val threadId: Int? = null,
    @SerialName("user_ids") val userIds: List<Int>,
    @SerialName("created_at") val createdAt: String,
    @SerialName("webhook_timestamp") val webhookTimestamp: Int,
) : WebhookPayloadUnion

@Serializable
@SerialName("company_member")
data class CompanyMemberWebhookPayload(
    override val type: String = "company_member",
    val event: UserEventType,
    @SerialName("user_ids") val userIds: List<Int>,
    @SerialName("created_at") val createdAt: String,
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
    @SerialName("created_at") val createdAt: String,
    @SerialName("webhook_timestamp") val webhookTimestamp: Int,
) : WebhookPayloadUnion

@Serializable
data class AccessTokenInfo(
    val id: Long,
    val token: String,
    val name: String? = null,
    @SerialName("user_id") val userId: Long,
    val scopes: List<OAuthScope>,
    @SerialName("created_at") val createdAt: String,
    @SerialName("revoked_at") val revokedAt: String? = null,
    @SerialName("expires_in") val expiresIn: Int? = null,
    @SerialName("last_used_at") val lastUsedAt: String? = null,
)

@Serializable
data class AddMembersRequest(
    @SerialName("member_ids") val memberIds: List<Int>,
    val silent: Boolean? = null,
)

@Serializable
data class AddTagsRequest(
    @SerialName("group_tag_ids") val groupTagIds: List<Int>,
)

@Serializable
data class ApiError(
    val errors: List<ApiErrorItem>,
) : Exception()

@Serializable
data class ApiErrorItem(
    val key: String,
    val value: String? = null,
    val message: String,
    val code: ValidationErrorCode,
    val payload: Map<String, String>? = null,
)

@Serializable
data class AuditEvent(
    val id: String,
    @SerialName("created_at") val createdAt: String,
    @SerialName("event_key") val eventKey: AuditEventKey,
    @SerialName("entity_id") val entityId: String,
    @SerialName("entity_type") val entityType: String,
    @SerialName("actor_id") val actorId: String,
    @SerialName("actor_type") val actorType: String,
    val details: AuditEventDetailsUnion,
    @SerialName("ip_address") val ipAddress: String,
    @SerialName("user_agent") val userAgent: String,
)

@Serializable
data class BotResponseWebhook(
    @SerialName("outgoing_url") val outgoingUrl: String,
)

@Serializable
data class BotResponse(
    val id: Int,
    val webhook: BotResponseWebhook,
)

@Serializable
data class BotUpdateRequestBotWebhook(
    @SerialName("outgoing_url") val outgoingUrl: String,
)

@Serializable
data class BotUpdateRequestBot(
    val webhook: BotUpdateRequestBotWebhook,
)

@Serializable
data class BotUpdateRequest(
    val bot: BotUpdateRequestBot,
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
    @SerialName("created_at") val createdAt: String,
    @SerialName("owner_id") val ownerId: Int,
    @SerialName("member_ids") val memberIds: List<Int>,
    @SerialName("group_tag_ids") val groupTagIds: List<Int>,
    val channel: Boolean,
    val personal: Boolean,
    val public: Boolean,
    @SerialName("last_message_at") val lastMessageAt: String,
    @SerialName("meet_room_url") val meetRoomUrl: String,
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
data class ChatUpdateRequestChat(
    val name: String? = null,
    val public: Boolean? = null,
)

@Serializable
data class ChatUpdateRequest(
    val chat: ChatUpdateRequestChat,
)

@Serializable
data class CustomProperty(
    val id: Int,
    val name: String,
    @SerialName("data_type") val dataType: CustomPropertyDataType,
    val value: String,
)

@Serializable
data class CustomPropertyDefinition(
    val id: Int,
    val name: String,
    @SerialName("data_type") val dataType: CustomPropertyDataType,
)

@Serializable
data class ExportRequest(
    @SerialName("start_at") val startAt: String,
    @SerialName("end_at") val endAt: String,
    @SerialName("webhook_url") val webhookUrl: String,
    @SerialName("chat_ids") val chatIds: List<Int>? = null,
    @SerialName("skip_chats_file") val skipChatsFile: Boolean? = null,
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
)

@Serializable
data class FileUploadRequest(
    @SerialName("Content-Disposition") val contentDisposition: String,
    val acl: String,
    val policy: String,
    @SerialName("x-amz-credential") val xAmzCredential: String,
    @SerialName("x-amz-algorithm") val xAmzAlgorithm: String,
    @SerialName("x-amz-date") val xAmzDate: String,
    @SerialName("x-amz-signature") val xAmzSignature: String,
    val key: String,
    @Transient val file: ByteArray = ByteArray(0),
)

@Serializable
data class Forwarding(
    @SerialName("original_message_id") val originalMessageId: Int,
    @SerialName("original_chat_id") val originalChatId: Int,
    @SerialName("author_id") val authorId: Int,
    @SerialName("original_created_at") val originalCreatedAt: String,
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
    @SerialName("created_at") val createdAt: String,
    val url: String,
    val files: List<File>,
    val buttons: List<List<Button>>? = null,
    val thread: MessageThread? = null,
    val forwarding: Forwarding? = null,
    @SerialName("parent_message_id") val parentMessageId: Int? = null,
    @SerialName("display_avatar_url") val displayAvatarUrl: String? = null,
    @SerialName("display_name") val displayName: String? = null,
    @SerialName("changed_at") val changedAt: String? = null,
    @SerialName("deleted_at") val deletedAt: String? = null,
)

@Serializable
data class MessageCreateRequestFile(
    val key: String,
    val name: String,
    @SerialName("file_type") val fileType: FileType,
    val size: Int,
    val width: Int? = null,
    val height: Int? = null,
)

@Serializable
data class MessageCreateRequestMessage(
    @SerialName("entity_type") val entityType: MessageEntityType? = MessageEntityType.DISCUSSION,
    @SerialName("entity_id") val entityId: Int,
    val content: String,
    val files: List<MessageCreateRequestFile>? = null,
    val buttons: List<List<Button>>? = null,
    @SerialName("parent_message_id") val parentMessageId: Int? = null,
    @SerialName("display_avatar_url") val displayAvatarUrl: String? = null,
    @SerialName("display_name") val displayName: String? = null,
    @SerialName("skip_invite_mentions") val skipInviteMentions: Boolean? = false,
    @SerialName("link_preview") val linkPreview: Boolean? = false,
)

@Serializable
data class MessageCreateRequest(
    val message: MessageCreateRequestMessage,
)

@Serializable
data class MessageUpdateRequestFile(
    val key: String,
    val name: String,
    @SerialName("file_type") val fileType: String? = null,
    val size: Int? = null,
    val width: Int? = null,
    val height: Int? = null,
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
    val error: String,
    @SerialName("error_description") val errorDescription: String,
) : Exception()

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
    @SerialName("next_page") val nextPage: String? = null,
)

@Serializable
data class PaginationMeta(
    val paginate: PaginationMetaPaginate? = null,
)

@Serializable
data class Reaction(
    @SerialName("user_id") val userId: Int,
    @SerialName("created_at") val createdAt: String,
    val code: String,
    val name: String? = null,
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
    val emoji: String,
    val title: String,
    @SerialName("expires_at") val expiresAt: String? = null,
    @SerialName("is_away") val isAway: Boolean? = null,
    @SerialName("away_message") val awayMessage: String? = null,
)

@Serializable
data class StatusUpdateRequest(
    val status: StatusUpdateRequestStatus,
)

@Serializable
class TagNamesFilter

@Serializable
data class Task(
    val id: Int,
    val kind: TaskKind,
    val content: String,
    @SerialName("due_at") val dueAt: String? = null,
    val priority: Int,
    @SerialName("user_id") val userId: Int,
    @SerialName("chat_id") val chatId: Int? = null,
    val status: TaskStatus,
    @SerialName("created_at") val createdAt: String,
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
    @SerialName("due_at") val dueAt: String? = null,
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
    @SerialName("due_at") val dueAt: String? = null,
    val priority: Int? = null,
    @SerialName("performer_ids") val performerIds: List<Int>? = null,
    val status: TaskStatus? = null,
    @SerialName("all_day") val allDay: Boolean? = null,
    @SerialName("done_at") val doneAt: String? = null,
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
    @SerialName("message_id") val messageId: Long,
    @SerialName("message_chat_id") val messageChatId: Long,
    @SerialName("updated_at") val updatedAt: String,
)

@Serializable
data class UpdateMemberRoleRequest(
    val role: ChatMemberRole,
)

@Serializable
data class UploadParams(
    @SerialName("Content-Disposition") val contentDisposition: String,
    val acl: String,
    val policy: String,
    @SerialName("x-amz-credential") val xAmzCredential: String,
    @SerialName("x-amz-algorithm") val xAmzAlgorithm: String,
    @SerialName("x-amz-date") val xAmzDate: String,
    @SerialName("x-amz-signature") val xAmzSignature: String,
    val key: String,
    @SerialName("direct_url") val directUrl: String,
)

@Serializable
data class User(
    val id: Int,
    @SerialName("first_name") val firstName: String,
    @SerialName("last_name") val lastName: String,
    val nickname: String,
    val email: String,
    @SerialName("phone_number") val phoneNumber: String,
    val department: String,
    val title: String,
    val role: UserRole,
    val suspended: Boolean,
    @SerialName("invite_status") val inviteStatus: InviteStatus,
    @SerialName("list_tags") val listTags: List<String>,
    @SerialName("custom_properties") val customProperties: List<CustomProperty>,
    @SerialName("user_status") val userStatus: UserStatus? = null,
    val bot: Boolean,
    val sso: Boolean,
    @SerialName("created_at") val createdAt: String,
    @SerialName("last_activity_at") val lastActivityAt: String,
    @SerialName("time_zone") val timeZone: String,
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
    val role: UserRole? = null,
    val suspended: Boolean? = null,
    @SerialName("list_tags") val listTags: List<String>? = null,
    @SerialName("custom_properties") val customProperties: List<UserCreateRequestCustomProperty>? = null,
)

@Serializable
data class UserCreateRequest(
    val user: UserCreateRequestUser,
    @SerialName("skip_email_notify") val skipEmailNotify: Boolean? = null,
)

@Serializable
data class UserStatusAwayMessage(
    val text: String,
)

@Serializable
data class UserStatus(
    val emoji: String,
    val title: String,
    @SerialName("expires_at") val expiresAt: String? = null,
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
    val role: UserRole? = null,
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
    @SerialName("initial_date") val initialDate: String? = null,
)

@Serializable
data class ViewBlockCheckboxOption(
    val text: String,
    val value: String,
    val description: String? = null,
    val checked: Boolean? = null,
)

@Serializable
data class ViewBlockSelectableOption(
    val text: String,
    val value: String,
    val description: String? = null,
    val selected: Boolean? = null,
)

@Serializable
data class WebhookEvent(
    val id: String,
    @SerialName("event_type") val eventType: String,
    val payload: WebhookPayloadUnion,
    @SerialName("created_at") val createdAt: String,
)

@Serializable
data class WebhookLink(
    val url: String,
    val domain: String,
)

@Serializable
data class WebhookMessageThread(
    @SerialName("message_id") val messageId: Int,
    @SerialName("message_chat_id") val messageChatId: Int,
)

@Serializable
data class GetAuditEventsResponse(
    val data: List<AuditEvent>,
    val meta: PaginationMeta? = null,
)

@Serializable
data class ListChatsResponse(
    val data: List<Chat>,
    val meta: PaginationMeta? = null,
)

@Serializable
data class ListMembersResponse(
    val data: List<User>,
    val meta: PaginationMeta? = null,
)

@Serializable
data class ListPropertiesResponse(
    val data: List<CustomPropertyDefinition>,
)

@Serializable
data class ListTagsResponse(
    val data: List<GroupTag>,
    val meta: PaginationMeta? = null,
)

@Serializable
data class GetTagUsersResponse(
    val data: List<User>,
    val meta: PaginationMeta? = null,
)

@Serializable
data class ListChatMessagesResponse(
    val data: List<Message>,
    val meta: PaginationMeta? = null,
)

@Serializable
data class ListReactionsResponse(
    val data: List<Reaction>,
    val meta: PaginationMeta? = null,
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
    val meta: PaginationMeta? = null,
)

@Serializable
data class ListUsersResponse(
    val data: List<User>,
    val meta: PaginationMeta? = null,
)

@Serializable
data class GetWebhookEventsResponse(
    val data: List<WebhookEvent>,
    val meta: PaginationMeta? = null,
)

@Serializable
data class BotResponseDataWrapper(val data: BotResponse)

@Serializable
data class ChatDataWrapper(val data: Chat)

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
