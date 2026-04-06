package pachca

import (
	"encoding/json"
	"fmt"
	"io"
	"strings"
	"time"
)

type AuditEventKey string

const (
	AuditEventKeyUserLogin             AuditEventKey = "user_login" // Пользователь успешно вошел в систему
	AuditEventKeyUserLogout            AuditEventKey = "user_logout" // Пользователь вышел из системы
	AuditEventKeyUser2faFail           AuditEventKey = "user_2fa_fail" // Неудачная попытка двухфакторной аутентификации
	AuditEventKeyUser2faSuccess        AuditEventKey = "user_2fa_success" // Успешная двухфакторная аутентификация
	AuditEventKeyUserCreated           AuditEventKey = "user_created" // Создана новая учетная запись пользователя
	AuditEventKeyUserDeleted           AuditEventKey = "user_deleted" // Учетная запись пользователя удалена
	AuditEventKeyUserRoleChanged       AuditEventKey = "user_role_changed" // Роль пользователя была изменена
	AuditEventKeyUserUpdated           AuditEventKey = "user_updated" // Данные пользователя обновлены
	AuditEventKeyTagCreated            AuditEventKey = "tag_created" // Создан новый тег
	AuditEventKeyTagDeleted            AuditEventKey = "tag_deleted" // Тег удален
	AuditEventKeyUserAddedToTag        AuditEventKey = "user_added_to_tag" // Пользователь добавлен в тег
	AuditEventKeyUserRemovedFromTag    AuditEventKey = "user_removed_from_tag" // Пользователь удален из тега
	AuditEventKeyChatCreated           AuditEventKey = "chat_created" // Создан новый чат
	AuditEventKeyChatRenamed           AuditEventKey = "chat_renamed" // Чат переименован
	AuditEventKeyChatPermissionChanged AuditEventKey = "chat_permission_changed" // Изменены права доступа к чату
	AuditEventKeyUserChatJoin          AuditEventKey = "user_chat_join" // Пользователь присоединился к чату
	AuditEventKeyUserChatLeave         AuditEventKey = "user_chat_leave" // Пользователь покинул чат
	AuditEventKeyTagAddedToChat        AuditEventKey = "tag_added_to_chat" // Тег добавлен в чат
	AuditEventKeyTagRemovedFromChat    AuditEventKey = "tag_removed_from_chat" // Тег удален из чата
	AuditEventKeyMessageUpdated        AuditEventKey = "message_updated" // Сообщение отредактировано
	AuditEventKeyMessageDeleted        AuditEventKey = "message_deleted" // Сообщение удалено
	AuditEventKeyMessageCreated        AuditEventKey = "message_created" // Сообщение создано
	AuditEventKeyReactionCreated       AuditEventKey = "reaction_created" // Реакция добавлена
	AuditEventKeyReactionDeleted       AuditEventKey = "reaction_deleted" // Реакция удалена
	AuditEventKeyThreadCreated         AuditEventKey = "thread_created" // Тред создан
	AuditEventKeyAccessTokenCreated    AuditEventKey = "access_token_created" // Создан новый токен доступа
	AuditEventKeyAccessTokenUpdated    AuditEventKey = "access_token_updated" // Токен доступа обновлен
	AuditEventKeyAccessTokenDestroy    AuditEventKey = "access_token_destroy" // Токен доступа удален
	AuditEventKeyKmsEncrypt            AuditEventKey = "kms_encrypt" // Данные зашифрованы
	AuditEventKeyKmsDecrypt            AuditEventKey = "kms_decrypt" // Данные расшифрованы
	AuditEventKeyAuditEventsAccessed   AuditEventKey = "audit_events_accessed" // Доступ к журналам аудита получен
	AuditEventKeyDlpViolationDetected  AuditEventKey = "dlp_violation_detected" // Срабатывание правила DLP-системы
	AuditEventKeySearchUsersApi        AuditEventKey = "search_users_api" // Поиск сотрудников через API
	AuditEventKeySearchChatsApi        AuditEventKey = "search_chats_api" // Поиск чатов через API
	AuditEventKeySearchMessagesApi     AuditEventKey = "search_messages_api" // Поиск сообщений через API
)

type ChatAvailability string

const (
	ChatAvailabilityIsMember ChatAvailability = "is_member" // Чаты, где пользователь является участником
	ChatAvailabilityPublic   ChatAvailability = "public" // Все открытые чаты компании, вне зависимости от участия в них пользователя
)

type ChatMemberRole string

const (
	ChatMemberRoleAdmin  ChatMemberRole = "admin" // Админ
	ChatMemberRoleEditor ChatMemberRole = "editor" // Редактор (доступно только для каналов)
	ChatMemberRoleMember ChatMemberRole = "member" // Участник или подписчик
)

type ChatMemberRoleFilter string

const (
	ChatMemberRoleFilterAll    ChatMemberRoleFilter = "all" // Любая роль
	ChatMemberRoleFilterOwner  ChatMemberRoleFilter = "owner" // Создатель
	ChatMemberRoleFilterAdmin  ChatMemberRoleFilter = "admin" // Админ
	ChatMemberRoleFilterEditor ChatMemberRoleFilter = "editor" // Редактор
	ChatMemberRoleFilterMember ChatMemberRoleFilter = "member" // Участник/подписчик
)

type ChatSubtype string

const (
	ChatSubtypeDiscussion ChatSubtype = "discussion" // Канал или беседа
	ChatSubtypeThread     ChatSubtype = "thread" // Тред
)

type CustomPropertyDataType string

const (
	CustomPropertyDataTypeString CustomPropertyDataType = "string" // Строковое значение
	CustomPropertyDataTypeNumber CustomPropertyDataType = "number" // Числовое значение
	CustomPropertyDataTypeDate   CustomPropertyDataType = "date" // Дата
	CustomPropertyDataTypeLink   CustomPropertyDataType = "link" // Ссылка
)

type FileType string

const (
	FileTypeFile  FileType = "file" // Обычный файл
	FileTypeImage FileType = "image" // Изображение
)

type InviteStatus string

const (
	InviteStatusConfirmed InviteStatus = "confirmed" // Принято
	InviteStatusSent      InviteStatus = "sent" // Отправлено
)

type MemberEventType string

const (
	MemberEventTypeAdd    MemberEventType = "add" // Добавление
	MemberEventTypeRemove MemberEventType = "remove" // Удаление
)

type MessageEntityType string

const (
	MessageEntityTypeDiscussion MessageEntityType = "discussion" // Беседа или канал
	MessageEntityTypeThread     MessageEntityType = "thread" // Тред
	MessageEntityTypeUser       MessageEntityType = "user" // Пользователь
)

type OAuthScope string

const (
	OAuthScopeChatsRead            OAuthScope = "chats:read" // Просмотр чатов и списка чатов
	OAuthScopeChatsCreate          OAuthScope = "chats:create" // Создание новых чатов
	OAuthScopeChatsUpdate          OAuthScope = "chats:update" // Изменение настроек чата
	OAuthScopeChatsArchive         OAuthScope = "chats:archive" // Архивация и разархивация чатов
	OAuthScopeChatsLeave           OAuthScope = "chats:leave" // Выход из чатов
	OAuthScopeChatMembersRead      OAuthScope = "chat_members:read" // Просмотр участников чата
	OAuthScopeChatMembersWrite     OAuthScope = "chat_members:write" // Добавление, изменение и удаление участников чата
	OAuthScopeChatExportsRead      OAuthScope = "chat_exports:read" // Скачивание экспортов чата
	OAuthScopeChatExportsWrite     OAuthScope = "chat_exports:write" // Создание экспортов чата
	OAuthScopeMessagesRead         OAuthScope = "messages:read" // Просмотр сообщений в чатах
	OAuthScopeMessagesCreate       OAuthScope = "messages:create" // Отправка сообщений
	OAuthScopeMessagesUpdate       OAuthScope = "messages:update" // Редактирование сообщений
	OAuthScopeMessagesDelete       OAuthScope = "messages:delete" // Удаление сообщений
	OAuthScopeReactionsRead        OAuthScope = "reactions:read" // Просмотр реакций на сообщения
	OAuthScopeReactionsWrite       OAuthScope = "reactions:write" // Добавление и удаление реакций
	OAuthScopePinsWrite            OAuthScope = "pins:write" // Закрепление и открепление сообщений
	OAuthScopeThreadsRead          OAuthScope = "threads:read" // Просмотр тредов (комментариев)
	OAuthScopeThreadsCreate        OAuthScope = "threads:create" // Создание тредов (комментариев)
	OAuthScopeLinkPreviewsWrite    OAuthScope = "link_previews:write" // Unfurl (разворачивание ссылок)
	OAuthScopeUsersRead            OAuthScope = "users:read" // Просмотр информации о сотрудниках и списка сотрудников
	OAuthScopeUsersCreate          OAuthScope = "users:create" // Создание новых сотрудников
	OAuthScopeUsersUpdate          OAuthScope = "users:update" // Редактирование данных сотрудника
	OAuthScopeUsersDelete          OAuthScope = "users:delete" // Удаление сотрудников
	OAuthScopeGroupTagsRead        OAuthScope = "group_tags:read" // Просмотр тегов
	OAuthScopeGroupTagsWrite       OAuthScope = "group_tags:write" // Создание, редактирование и удаление тегов
	OAuthScopeBotsWrite            OAuthScope = "bots:write" // Изменение настроек бота
	OAuthScopeProfileRead          OAuthScope = "profile:read" // Просмотр информации о своем профиле
	OAuthScopeProfileStatusRead    OAuthScope = "profile_status:read" // Просмотр статуса профиля
	OAuthScopeProfileStatusWrite   OAuthScope = "profile_status:write" // Изменение и удаление статуса профиля
	OAuthScopeUserStatusRead       OAuthScope = "user_status:read" // Просмотр статуса сотрудника
	OAuthScopeUserStatusWrite      OAuthScope = "user_status:write" // Изменение и удаление статуса сотрудника
	OAuthScopeCustomPropertiesRead OAuthScope = "custom_properties:read" // Просмотр дополнительных полей
	OAuthScopeAuditEventsRead      OAuthScope = "audit_events:read" // Просмотр журнала аудита
	OAuthScopeTasksRead            OAuthScope = "tasks:read" // Просмотр задач
	OAuthScopeTasksCreate          OAuthScope = "tasks:create" // Создание задач
	OAuthScopeTasksUpdate          OAuthScope = "tasks:update" // Изменение задачи
	OAuthScopeTasksDelete          OAuthScope = "tasks:delete" // Удаление задачи
	OAuthScopeFilesRead            OAuthScope = "files:read" // Скачивание файлов
	OAuthScopeFilesWrite           OAuthScope = "files:write" // Загрузка файлов
	OAuthScopeUploadsWrite         OAuthScope = "uploads:write" // Получение данных для загрузки файлов
	OAuthScopeViewsWrite           OAuthScope = "views:write" // Открытие форм (представлений)
	OAuthScopeWebhooksRead         OAuthScope = "webhooks:read" // Просмотр вебхуков
	OAuthScopeWebhooksWrite        OAuthScope = "webhooks:write" // Создание и управление вебхуками
	OAuthScopeWebhooksEventsRead   OAuthScope = "webhooks:events:read" // Просмотр лога вебхуков
	OAuthScopeWebhooksEventsDelete OAuthScope = "webhooks:events:delete" // Удаление записи в логе вебхука
	OAuthScopeSearchUsers          OAuthScope = "search:users" // Поиск сотрудников
	OAuthScopeSearchChats          OAuthScope = "search:chats" // Поиск чатов
	OAuthScopeSearchMessages       OAuthScope = "search:messages" // Поиск сообщений
)

type ReactionEventType string

const (
	ReactionEventTypeNew    ReactionEventType = "new" // Создание
	ReactionEventTypeDelete ReactionEventType = "delete" // Удаление
)

type SearchEntityType string

const (
	SearchEntityTypeUser SearchEntityType = "User" // Пользователь
	SearchEntityTypeTask SearchEntityType = "Task" // Задача
)

type SearchSortOrder string

const (
	SearchSortOrderByScore      SearchSortOrder = "by_score" // По релевантности
	SearchSortOrderAlphabetical SearchSortOrder = "alphabetical" // По алфавиту
)

type SortOrder string

const (
	SortOrderAsc  SortOrder = "asc" // По возрастанию
	SortOrderDesc SortOrder = "desc" // По убыванию
)

type TaskKind string

const (
	TaskKindCall     TaskKind = "call" // Позвонить контакту
	TaskKindMeeting  TaskKind = "meeting" // Встреча
	TaskKindReminder TaskKind = "reminder" // Простое напоминание
	TaskKindEvent    TaskKind = "event" // Событие
	TaskKindEmail    TaskKind = "email" // Написать письмо
)

type TaskStatus string

const (
	TaskStatusDone   TaskStatus = "done" // Выполнено
	TaskStatusUndone TaskStatus = "undone" // Активно
)

type UserEventType string

const (
	UserEventTypeInvite   UserEventType = "invite" // Приглашение
	UserEventTypeConfirm  UserEventType = "confirm" // Подтверждение
	UserEventTypeUpdate   UserEventType = "update" // Обновление
	UserEventTypeSuspend  UserEventType = "suspend" // Приостановка
	UserEventTypeActivate UserEventType = "activate" // Активация
	UserEventTypeDelete   UserEventType = "delete" // Удаление
)

type UserRole string

const (
	UserRoleAdmin      UserRole = "admin" // Администратор
	UserRoleUser       UserRole = "user" // Сотрудник
	UserRoleMultiGuest UserRole = "multi_guest" // Мульти-гость
	UserRoleGuest      UserRole = "guest" // Гость
)

type UserRoleInput string

const (
	UserRoleInputAdmin      UserRoleInput = "admin" // Администратор
	UserRoleInputUser       UserRoleInput = "user" // Сотрудник
	UserRoleInputMultiGuest UserRoleInput = "multi_guest" // Мульти-гость
)

type ValidationErrorCode string

const (
	ValidationErrorCodeBlank             ValidationErrorCode = "blank" // Обязательное поле (не может быть пустым)
	ValidationErrorCodeTooLong           ValidationErrorCode = "too_long" // Слишком длинное значение (пояснения вы получите в поле message)
	ValidationErrorCodeInvalid           ValidationErrorCode = "invalid" // Поле не соответствует правилам (пояснения вы получите в поле message)
	ValidationErrorCodeInclusion         ValidationErrorCode = "inclusion" // Поле имеет непредусмотренное значение
	ValidationErrorCodeExclusion         ValidationErrorCode = "exclusion" // Поле имеет недопустимое значение
	ValidationErrorCodeTaken             ValidationErrorCode = "taken" // Название для этого поля уже существует
	ValidationErrorCodeWrongEmoji        ValidationErrorCode = "wrong_emoji" // Emoji статуса не может содержать значения отличные от Emoji символа
	ValidationErrorCodeNotFound          ValidationErrorCode = "not_found" // Объект не найден
	ValidationErrorCodeAlreadyExists     ValidationErrorCode = "already_exists" // Объект уже существует (пояснения вы получите в поле message)
	ValidationErrorCodePersonalChat      ValidationErrorCode = "personal_chat" // Ошибка личного чата (пояснения вы получите в поле message)
	ValidationErrorCodeDisplayedError    ValidationErrorCode = "displayed_error" // Отображаемая ошибка (пояснения вы получите в поле message)
	ValidationErrorCodeNotAuthorized     ValidationErrorCode = "not_authorized" // Действие запрещено
	ValidationErrorCodeInvalidDateRange  ValidationErrorCode = "invalid_date_range" // Выбран слишком большой диапазон дат
	ValidationErrorCodeInvalidWebhookURL ValidationErrorCode = "invalid_webhook_url" // Некорректный URL вебхука
	ValidationErrorCodeRateLimit         ValidationErrorCode = "rate_limit" // Достигнут лимит запросов
	ValidationErrorCodeLicensesLimit     ValidationErrorCode = "licenses_limit" // Превышен лимит активных сотрудников (пояснения вы получите в поле message)
	ValidationErrorCodeUserLimit         ValidationErrorCode = "user_limit" // Превышен лимит количества реакций, которые может добавить пользователь (20 уникальных реакций)
	ValidationErrorCodeUniqueLimit       ValidationErrorCode = "unique_limit" // Превышен лимит количества уникальных реакций, которые можно добавить на сообщение (30 уникальных реакций)
	ValidationErrorCodeGeneralLimit      ValidationErrorCode = "general_limit" // Превышен лимит количества реакций, которые можно добавить на сообщение (1000 реакций)
	ValidationErrorCodeUnhandled         ValidationErrorCode = "unhandled" // Ошибка выполнения запроса (пояснения вы получите в поле message)
	ValidationErrorCodeTriggerNotFound   ValidationErrorCode = "trigger_not_found" // Не удалось найти идентификатор события
	ValidationErrorCodeTriggerExpired    ValidationErrorCode = "trigger_expired" // Время жизни идентификатора события истекло
	ValidationErrorCodeRequired          ValidationErrorCode = "required" // Обязательный параметр не передан
	ValidationErrorCodeIn                ValidationErrorCode = "in" // Недопустимое значение (не входит в список допустимых)
	ValidationErrorCodeNotApplicable     ValidationErrorCode = "not_applicable" // Значение неприменимо в данном контексте (пояснения вы получите в поле message)
	ValidationErrorCodeSelfUpdate        ValidationErrorCode = "self_update" // Нельзя изменить свои собственные данные
	ValidationErrorCodeOwnerProtected    ValidationErrorCode = "owner_protected" // Нельзя изменить данные владельца
	ValidationErrorCodeAlreadyAssigned   ValidationErrorCode = "already_assigned" // Значение уже назначено
	ValidationErrorCodeForbidden         ValidationErrorCode = "forbidden" // Недостаточно прав для выполнения действия (пояснения вы получите в поле message)
	ValidationErrorCodePermissionDenied  ValidationErrorCode = "permission_denied" // Доступ запрещён (недостаточно прав)
	ValidationErrorCodeAccessDenied      ValidationErrorCode = "access_denied" // Доступ запрещён
	ValidationErrorCodeWrongParams       ValidationErrorCode = "wrong_params" // Некорректные параметры запроса (пояснения вы получите в поле message)
	ValidationErrorCodePaymentRequired   ValidationErrorCode = "payment_required" // Требуется оплата
	ValidationErrorCodeMinLength         ValidationErrorCode = "min_length" // Значение слишком короткое (пояснения вы получите в поле message)
	ValidationErrorCodeMaxLength         ValidationErrorCode = "max_length" // Значение слишком длинное (пояснения вы получите в поле message)
	ValidationErrorCodeUseOfSystemWords  ValidationErrorCode = "use_of_system_words" // Использовано зарезервированное системное слово (here, all)
)

type WebhookEventType string

const (
	WebhookEventTypeNew    WebhookEventType = "new" // Создание
	WebhookEventTypeUpdate WebhookEventType = "update" // Обновление
	WebhookEventTypeDelete WebhookEventType = "delete" // Удаление
)

type AccessTokenInfo struct {
	ID         int64        `json:"id"`
	Token      string       `json:"token"`
	UserID     int64        `json:"user_id"`
	Scopes     []OAuthScope `json:"scopes"`
	CreatedAt  time.Time    `json:"created_at"`
	Name       *string      `json:"name"`
	RevokedAt  *string      `json:"revoked_at"`
	ExpiresIn  *int32       `json:"expires_in"`
	LastUsedAt *string      `json:"last_used_at"`
}

type AddMembersRequest struct {
	MemberIDs []int32 `json:"member_ids"`
	Silent    *bool   `json:"silent,omitempty"`
}

type AddTagsRequest struct {
	GroupTagIDs []int32 `json:"group_tag_ids"`
}

type ApiError struct {
	Errors []ApiErrorItem `json:"errors"`
}

func (e *ApiError) Error() string {
	if len(e.Errors) == 0 {
		return "api error"
	}
	parts := make([]string, 0, len(e.Errors))
	for _, item := range e.Errors {
		parts = append(parts, item.Message)
	}
	if len(parts) == 0 {
		return "api error"
	}
	return strings.Join(parts, ", ")
}

type ApiErrorItem struct {
	Key     string              `json:"key"`
	Message string              `json:"message"`
	Code    ValidationErrorCode `json:"code"`
	Value   *string             `json:"value"`
	Payload map[string]string   `json:"payload"`
}

type AuditDetailsChatId struct {
	ChatID int32 `json:"chat_id"`
}

type AuditDetailsChatPermission struct {
	PublicAccess bool `json:"public_access"`
}

type AuditDetailsChatRenamed struct {
	OldName string `json:"old_name"`
	NewName string `json:"new_name"`
}

type AuditDetailsDlp struct {
	DlpRuleID         int32  `json:"dlp_rule_id"`
	DlpRuleName       string `json:"dlp_rule_name"`
	MessageID         int32  `json:"message_id"`
	ChatID            int32  `json:"chat_id"`
	UserID            int32  `json:"user_id"`
	ActionMessage     string `json:"action_message"`
	ConditionsMatched bool   `json:"conditions_matched"`
}

type AuditDetailsEmpty struct {
}

type AuditDetailsInitiator struct {
	InitiatorID int32 `json:"initiator_id"`
}

type AuditDetailsInviter struct {
	InviterID int32 `json:"inviter_id"`
}

type AuditDetailsKms struct {
	ChatID    int32  `json:"chat_id"`
	MessageID int32  `json:"message_id"`
	Reason    string `json:"reason"`
}

type AuditDetailsRoleChanged struct {
	NewCompanyRole      string `json:"new_company_role"`
	PreviousCompanyRole string `json:"previous_company_role"`
	InitiatorID         int32  `json:"initiator_id"`
}

type AuditDetailsSearch struct {
	SearchType    string            `json:"search_type"`
	QueryPresent  bool              `json:"query_present"`
	CursorPresent bool              `json:"cursor_present"`
	Limit         int32             `json:"limit"`
	Filters       map[string]string `json:"filters"`
}

type AuditDetailsTagChat struct {
	ChatID  int32  `json:"chat_id"`
	TagName string `json:"tag_name"`
}

type AuditDetailsTagName struct {
	Name string `json:"name"`
}

type AuditDetailsTokenScopes struct {
	Scopes []string `json:"scopes"`
}

type AuditDetailsUserUpdated struct {
	ChangedAttrs []string `json:"changed_attrs"`
}

type AuditEvent struct {
	ID         string                 `json:"id"`
	CreatedAt  time.Time              `json:"created_at"`
	EventKey   AuditEventKey          `json:"event_key"`
	EntityID   string                 `json:"entity_id"`
	EntityType string                 `json:"entity_type"`
	ActorID    string                 `json:"actor_id"`
	ActorType  string                 `json:"actor_type"`
	Details    AuditEventDetailsUnion `json:"details"`
	IpAddress  string                 `json:"ip_address"`
	UserAgent  string                 `json:"user_agent"`
}

type BotResponseWebhook struct {
	OutgoingURL string `json:"outgoing_url"`
}

type BotResponse struct {
	ID      int32              `json:"id"`
	Webhook BotResponseWebhook `json:"webhook"`
}

type BotUpdateRequestBotWebhook struct {
	OutgoingURL string `json:"outgoing_url"`
}

type BotUpdateRequestBot struct {
	Webhook BotUpdateRequestBotWebhook `json:"webhook"`
}

type BotUpdateRequest struct {
	Bot BotUpdateRequestBot `json:"bot"`
}

type Button struct {
	Text string  `json:"text"`
	URL  *string `json:"url,omitempty"`
	Data *string `json:"data,omitempty"`
}

type ButtonWebhookPayload struct {
	Type             string `json:"type"` // always "button"
	Event            string `json:"event"` // always "click"
	MessageID        int32  `json:"message_id"`
	TriggerID        string `json:"trigger_id"`
	Data             string `json:"data"`
	UserID           int32  `json:"user_id"`
	ChatID           int32  `json:"chat_id"`
	WebhookTimestamp int32  `json:"webhook_timestamp"`
}

type Chat struct {
	ID            int32     `json:"id"`
	Name          string    `json:"name"`
	CreatedAt     time.Time `json:"created_at"`
	OwnerID       int32     `json:"owner_id"`
	MemberIDs     []int32   `json:"member_ids"`
	GroupTagIDs   []int32   `json:"group_tag_ids"`
	Channel       bool      `json:"channel"`
	Personal      bool      `json:"personal"`
	Public        bool      `json:"public"`
	LastMessageAt time.Time `json:"last_message_at"`
	MeetRoomURL   string    `json:"meet_room_url"`
}

type ChatCreateRequestChat struct {
	Name        string  `json:"name"`
	MemberIDs   []int32 `json:"member_ids,omitempty"`
	GroupTagIDs []int32 `json:"group_tag_ids,omitempty"`
	Channel     *bool   `json:"channel,omitempty"`
	Public      *bool   `json:"public,omitempty"`
}

type ChatCreateRequest struct {
	Chat ChatCreateRequestChat `json:"chat"`
}

type ChatMemberWebhookPayload struct {
	Type             string          `json:"type"` // always "chat_member"
	Event            MemberEventType `json:"event"`
	ChatID           int32           `json:"chat_id"`
	UserIDs          []int32         `json:"user_ids"`
	CreatedAt        time.Time       `json:"created_at"`
	WebhookTimestamp int32           `json:"webhook_timestamp"`
	ThreadID         *int32          `json:"thread_id"`
}

type ChatUpdateRequestChat struct {
	Name   *string `json:"name,omitempty"`
	Public *bool   `json:"public,omitempty"`
}

type ChatUpdateRequest struct {
	Chat ChatUpdateRequestChat `json:"chat"`
}

type CompanyMemberWebhookPayload struct {
	Type             string        `json:"type"` // always "company_member"
	Event            UserEventType `json:"event"`
	UserIDs          []int32       `json:"user_ids"`
	CreatedAt        time.Time     `json:"created_at"`
	WebhookTimestamp int32         `json:"webhook_timestamp"`
}

type CustomProperty struct {
	ID       int32                  `json:"id"`
	Name     string                 `json:"name"`
	DataType CustomPropertyDataType `json:"data_type"`
	Value    string                 `json:"value"`
}

type CustomPropertyDefinition struct {
	ID       int32                  `json:"id"`
	Name     string                 `json:"name"`
	DataType CustomPropertyDataType `json:"data_type"`
}

type ExportRequest struct {
	StartAt       string  `json:"start_at"`
	EndAt         string  `json:"end_at"`
	WebhookURL    string  `json:"webhook_url"`
	ChatIDs       []int32 `json:"chat_ids,omitempty"`
	SkipChatsFile *bool   `json:"skip_chats_file,omitempty"`
}

type File struct {
	ID       int32    `json:"id"`
	Key      string   `json:"key"`
	Name     string   `json:"name"`
	FileType FileType `json:"file_type"`
	URL      string   `json:"url"`
	Width    *int32   `json:"width"`
	Height   *int32   `json:"height"`
}

type FileUploadRequest struct {
	ContentDisposition string    `json:"Content-Disposition"`
	ACL                string    `json:"acl"`
	Policy             string    `json:"policy"`
	XAMZCredential     string    `json:"x-amz-credential"`
	XAMZAlgorithm      string    `json:"x-amz-algorithm"`
	XAMZDate           string    `json:"x-amz-date"`
	XAMZSignature      string    `json:"x-amz-signature"`
	Key                string    `json:"key"`
	File               io.Reader `json:"file"`
}

type Forwarding struct {
	OriginalMessageID          int32     `json:"original_message_id"`
	OriginalChatID             int32     `json:"original_chat_id"`
	AuthorID                   int32     `json:"author_id"`
	OriginalCreatedAt          time.Time `json:"original_created_at"`
	OriginalThreadID           *int32    `json:"original_thread_id"`
	OriginalThreadMessageID    *int32    `json:"original_thread_message_id"`
	OriginalThreadParentChatID *int32    `json:"original_thread_parent_chat_id"`
}

type GroupTag struct {
	ID         int32  `json:"id"`
	Name       string `json:"name"`
	UsersCount int32  `json:"users_count"`
}

type GroupTagRequestGroupTag struct {
	Name string `json:"name"`
}

type GroupTagRequest struct {
	GroupTag GroupTagRequestGroupTag `json:"group_tag"`
}

type LinkPreviewImage struct {
	Key  string `json:"key"`
	Name string `json:"name"`
	Size *int32 `json:"size,omitempty"`
}

type LinkPreview struct {
	Title       string            `json:"title"`
	Description string            `json:"description"`
	ImageURL    *string           `json:"image_url,omitempty"`
	Image       *LinkPreviewImage `json:"image,omitempty"`
}

type LinkPreviewsRequest struct {
	LinkPreviews map[string]LinkPreview `json:"link_previews"`
}

type LinkSharedWebhookPayload struct {
	Type             string        `json:"type"` // always "message"
	Event            string        `json:"event"` // always "link_shared"
	ChatID           int32         `json:"chat_id"`
	MessageID        int32         `json:"message_id"`
	Links            []WebhookLink `json:"links"`
	UserID           int32         `json:"user_id"`
	CreatedAt        time.Time     `json:"created_at"`
	WebhookTimestamp int32         `json:"webhook_timestamp"`
}

type MessageThread struct {
	ID     int64 `json:"id"`
	ChatID int64 `json:"chat_id"`
}

type Message struct {
	ID               int32             `json:"id"`
	EntityType       MessageEntityType `json:"entity_type"`
	EntityID         int32             `json:"entity_id"`
	ChatID           int32             `json:"chat_id"`
	RootChatID       int32             `json:"root_chat_id"`
	Content          string            `json:"content"`
	UserID           int32             `json:"user_id"`
	CreatedAt        time.Time         `json:"created_at"`
	URL              string            `json:"url"`
	Files            []File            `json:"files"`
	Buttons          [][]Button        `json:"buttons"`
	Thread           *MessageThread    `json:"thread"`
	Forwarding       *Forwarding       `json:"forwarding"`
	ParentMessageID  *int32            `json:"parent_message_id"`
	DisplayAvatarURL *string           `json:"display_avatar_url"`
	DisplayName      *string           `json:"display_name"`
	ChangedAt        *string           `json:"changed_at"`
	DeletedAt        *string           `json:"deleted_at"`
}

type MessageCreateRequestFile struct {
	Key      string   `json:"key"`
	Name     string   `json:"name"`
	FileType FileType `json:"file_type"`
	Size     int32    `json:"size"`
	Width    *int32   `json:"width,omitempty"`
	Height   *int32   `json:"height,omitempty"`
}

type MessageCreateRequestMessage struct {
	EntityID           int32                      `json:"entity_id"`
	Content            string                     `json:"content"`
	EntityType         *MessageEntityType         `json:"entity_type,omitempty"`
	Files              []MessageCreateRequestFile `json:"files,omitempty"`
	Buttons            [][]Button                 `json:"buttons,omitempty"`
	ParentMessageID    *int32                     `json:"parent_message_id,omitempty"`
	DisplayAvatarURL   *string                    `json:"display_avatar_url,omitempty"`
	DisplayName        *string                    `json:"display_name,omitempty"`
	SkipInviteMentions *bool                      `json:"skip_invite_mentions,omitempty"`
}

type MessageCreateRequest struct {
	Message     MessageCreateRequestMessage `json:"message"`
	LinkPreview *bool                       `json:"link_preview,omitempty"`
}

type MessageUpdateRequestFile struct {
	Key      string  `json:"key"`
	Name     string  `json:"name"`
	FileType *string `json:"file_type,omitempty"`
	Size     *int32  `json:"size,omitempty"`
	Width    *int32  `json:"width,omitempty"`
	Height   *int32  `json:"height,omitempty"`
}

type MessageUpdateRequestMessage struct {
	Content          *string                    `json:"content,omitempty"`
	Files            []MessageUpdateRequestFile `json:"files,omitempty"`
	Buttons          [][]Button                 `json:"buttons,omitempty"`
	DisplayAvatarURL *string                    `json:"display_avatar_url,omitempty"`
	DisplayName      *string                    `json:"display_name,omitempty"`
}

type MessageUpdateRequest struct {
	Message MessageUpdateRequestMessage `json:"message"`
}

type MessageWebhookPayload struct {
	Type             string                `json:"type"` // always "message"
	ID               int32                 `json:"id"`
	Event            WebhookEventType      `json:"event"`
	EntityType       MessageEntityType     `json:"entity_type"`
	EntityID         int32                 `json:"entity_id"`
	Content          string                `json:"content"`
	UserID           int32                 `json:"user_id"`
	CreatedAt        time.Time             `json:"created_at"`
	URL              string                `json:"url"`
	ChatID           int32                 `json:"chat_id"`
	WebhookTimestamp int32                 `json:"webhook_timestamp"`
	ParentMessageID  *int32                `json:"parent_message_id"`
	Thread           *WebhookMessageThread `json:"thread"`
}

type OAuthError struct {
	Err              string `json:"error"`
	ErrorDescription string `json:"error_description"`
}

func (e *OAuthError) Error() string {
	if e.Err != "" {
		return e.Err
	}
	return "oauth error"
}

type OpenViewRequestView struct {
	Title      string           `json:"title"`
	Blocks     []ViewBlockUnion `json:"blocks"`
	CloseText  *string          `json:"close_text,omitempty"`
	SubmitText *string          `json:"submit_text,omitempty"`
}

type OpenViewRequest struct {
	Type            string              `json:"type"` // always "modal"
	TriggerID       string              `json:"trigger_id"`
	View            OpenViewRequestView `json:"view"`
	PrivateMetadata *string             `json:"private_metadata,omitempty"`
	CallbackID      *string             `json:"callback_id,omitempty"`
}

type PaginationMetaPaginate struct {
	NextPage string `json:"next_page"`
}

type PaginationMeta struct {
	Paginate PaginationMetaPaginate `json:"paginate"`
}

type Reaction struct {
	UserID    int32     `json:"user_id"`
	CreatedAt time.Time `json:"created_at"`
	Code      string    `json:"code"`
	Name      *string   `json:"name"`
}

type ReactionRequest struct {
	Code string  `json:"code"`
	Name *string `json:"name,omitempty"`
}

type ReactionWebhookPayload struct {
	Type             string            `json:"type"` // always "reaction"
	Event            ReactionEventType `json:"event"`
	MessageID        int32             `json:"message_id"`
	Code             string            `json:"code"`
	Name             string            `json:"name"`
	UserID           int32             `json:"user_id"`
	CreatedAt        time.Time         `json:"created_at"`
	WebhookTimestamp int32             `json:"webhook_timestamp"`
}

type SearchPaginationMetaPaginate struct {
	NextPage string `json:"next_page"`
}

type SearchPaginationMeta struct {
	Total    int32                        `json:"total"`
	Paginate SearchPaginationMetaPaginate `json:"paginate"`
}

type StatusUpdateRequestStatus struct {
	Emoji       string     `json:"emoji"`
	Title       string     `json:"title"`
	ExpiresAt   *time.Time `json:"expires_at,omitempty"`
	IsAway      *bool      `json:"is_away,omitempty"`
	AwayMessage *string    `json:"away_message,omitempty"`
}

type StatusUpdateRequest struct {
	Status StatusUpdateRequestStatus `json:"status"`
}

type Task struct {
	ID               int32            `json:"id"`
	Kind             TaskKind         `json:"kind"`
	Content          string           `json:"content"`
	Priority         int32            `json:"priority"`
	UserID           int32            `json:"user_id"`
	Status           TaskStatus       `json:"status"`
	CreatedAt        time.Time        `json:"created_at"`
	PerformerIDs     []int32          `json:"performer_ids"`
	AllDay           bool             `json:"all_day"`
	CustomProperties []CustomProperty `json:"custom_properties"`
	DueAt            *string          `json:"due_at"`
	ChatID           *int32           `json:"chat_id"`
}

type TaskCreateRequestCustomProperty struct {
	ID    int32  `json:"id"`
	Value string `json:"value"`
}

type TaskCreateRequestTask struct {
	Kind             TaskKind                          `json:"kind"`
	Content          *string                           `json:"content,omitempty"`
	DueAt            *time.Time                        `json:"due_at,omitempty"`
	Priority         *int32                            `json:"priority,omitempty"`
	PerformerIDs     []int32                           `json:"performer_ids,omitempty"`
	ChatID           *int32                            `json:"chat_id,omitempty"`
	AllDay           *bool                             `json:"all_day,omitempty"`
	CustomProperties []TaskCreateRequestCustomProperty `json:"custom_properties,omitempty"`
}

type TaskCreateRequest struct {
	Task TaskCreateRequestTask `json:"task"`
}

type TaskUpdateRequestCustomProperty struct {
	ID    int32  `json:"id"`
	Value string `json:"value"`
}

type TaskUpdateRequestTask struct {
	Kind             *TaskKind                         `json:"kind,omitempty"`
	Content          *string                           `json:"content,omitempty"`
	DueAt            *time.Time                        `json:"due_at,omitempty"`
	Priority         *int32                            `json:"priority,omitempty"`
	PerformerIDs     []int32                           `json:"performer_ids,omitempty"`
	Status           *TaskStatus                       `json:"status,omitempty"`
	AllDay           *bool                             `json:"all_day,omitempty"`
	DoneAt           *time.Time                        `json:"done_at,omitempty"`
	CustomProperties []TaskUpdateRequestCustomProperty `json:"custom_properties,omitempty"`
}

type TaskUpdateRequest struct {
	Task TaskUpdateRequestTask `json:"task"`
}

type Thread struct {
	ID            int64     `json:"id"`
	ChatID        int64     `json:"chat_id"`
	MessageID     int64     `json:"message_id"`
	MessageChatID int64     `json:"message_chat_id"`
	UpdatedAt     time.Time `json:"updated_at"`
}

type UpdateMemberRoleRequest struct {
	Role ChatMemberRole `json:"role"`
}

type UploadParams struct {
	ContentDisposition string `json:"Content-Disposition"`
	ACL                string `json:"acl"`
	Policy             string `json:"policy"`
	XAMZCredential     string `json:"x-amz-credential"`
	XAMZAlgorithm      string `json:"x-amz-algorithm"`
	XAMZDate           string `json:"x-amz-date"`
	XAMZSignature      string `json:"x-amz-signature"`
	Key                string `json:"key"`
	DirectURL          string `json:"direct_url"`
}

type User struct {
	ID               int32            `json:"id"`
	FirstName        string           `json:"first_name"`
	LastName         string           `json:"last_name"`
	Nickname         string           `json:"nickname"`
	Email            string           `json:"email"`
	PhoneNumber      string           `json:"phone_number"`
	Department       string           `json:"department"`
	Title            string           `json:"title"`
	Role             UserRole         `json:"role"`
	Suspended        bool             `json:"suspended"`
	InviteStatus     InviteStatus     `json:"invite_status"`
	ListTags         []string         `json:"list_tags"`
	CustomProperties []CustomProperty `json:"custom_properties"`
	Bot              bool             `json:"bot"`
	Sso              bool             `json:"sso"`
	CreatedAt        time.Time        `json:"created_at"`
	LastActivityAt   time.Time        `json:"last_activity_at"`
	TimeZone         string           `json:"time_zone"`
	UserStatus       *UserStatus      `json:"user_status"`
	ImageURL         *string          `json:"image_url"`
}

type UserCreateRequestCustomProperty struct {
	ID    int32  `json:"id"`
	Value string `json:"value"`
}

type UserCreateRequestUser struct {
	Email            string                            `json:"email"`
	FirstName        *string                           `json:"first_name,omitempty"`
	LastName         *string                           `json:"last_name,omitempty"`
	PhoneNumber      *string                           `json:"phone_number,omitempty"`
	Nickname         *string                           `json:"nickname,omitempty"`
	Department       *string                           `json:"department,omitempty"`
	Title            *string                           `json:"title,omitempty"`
	Role             *UserRoleInput                    `json:"role,omitempty"`
	Suspended        *bool                             `json:"suspended,omitempty"`
	ListTags         []string                          `json:"list_tags,omitempty"`
	CustomProperties []UserCreateRequestCustomProperty `json:"custom_properties,omitempty"`
}

type UserCreateRequest struct {
	User            UserCreateRequestUser `json:"user"`
	SkipEmailNotify *bool                 `json:"skip_email_notify,omitempty"`
}

type UserStatusAwayMessage struct {
	Text string `json:"text"`
}

type UserStatus struct {
	Emoji       string                 `json:"emoji"`
	Title       string                 `json:"title"`
	IsAway      bool                   `json:"is_away"`
	ExpiresAt   *string                `json:"expires_at"`
	AwayMessage *UserStatusAwayMessage `json:"away_message"`
}

type UserUpdateRequestCustomProperty struct {
	ID    int32  `json:"id"`
	Value string `json:"value"`
}

type UserUpdateRequestUser struct {
	FirstName        *string                           `json:"first_name,omitempty"`
	LastName         *string                           `json:"last_name,omitempty"`
	Email            *string                           `json:"email,omitempty"`
	PhoneNumber      *string                           `json:"phone_number,omitempty"`
	Nickname         *string                           `json:"nickname,omitempty"`
	Department       *string                           `json:"department,omitempty"`
	Title            *string                           `json:"title,omitempty"`
	Role             *UserRoleInput                    `json:"role,omitempty"`
	Suspended        *bool                             `json:"suspended,omitempty"`
	ListTags         []string                          `json:"list_tags,omitempty"`
	CustomProperties []UserUpdateRequestCustomProperty `json:"custom_properties,omitempty"`
}

type UserUpdateRequest struct {
	User UserUpdateRequestUser `json:"user"`
}

type ViewBlock struct {
	Type        string     `json:"type"`
	Text        *string    `json:"text,omitempty"`
	Name        *string    `json:"name,omitempty"`
	Label       *string    `json:"label,omitempty"`
	InitialDate *time.Time `json:"initial_date,omitempty"`
}

type ViewBlockCheckbox struct {
	Type     string                    `json:"type"` // always "checkbox"
	Name     string                    `json:"name"`
	Label    string                    `json:"label"`
	Options  []ViewBlockCheckboxOption `json:"options,omitempty"`
	Required *bool                     `json:"required,omitempty"`
	Hint     *string                   `json:"hint,omitempty"`
}

type ViewBlockCheckboxOption struct {
	Text        string  `json:"text"`
	Value       string  `json:"value"`
	Description *string `json:"description,omitempty"`
	Checked     *bool   `json:"checked,omitempty"`
}

type ViewBlockDate struct {
	Type        string  `json:"type"` // always "date"
	Name        string  `json:"name"`
	Label       string  `json:"label"`
	InitialDate *string `json:"initial_date,omitempty"`
	Required    *bool   `json:"required,omitempty"`
	Hint        *string `json:"hint,omitempty"`
}

type ViewBlockDivider struct {
	Type string `json:"type"` // always "divider"
}

type ViewBlockFileInput struct {
	Type      string   `json:"type"` // always "file_input"
	Name      string   `json:"name"`
	Label     string   `json:"label"`
	Filetypes []string `json:"filetypes,omitempty"`
	MaxFiles  *int32   `json:"max_files,omitempty"`
	Required  *bool    `json:"required,omitempty"`
	Hint      *string  `json:"hint,omitempty"`
}

type ViewBlockHeader struct {
	Type string `json:"type"` // always "header"
	Text string `json:"text"`
}

type ViewBlockInput struct {
	Type         string  `json:"type"` // always "input"
	Name         string  `json:"name"`
	Label        string  `json:"label"`
	Placeholder  *string `json:"placeholder,omitempty"`
	Multiline    *bool   `json:"multiline,omitempty"`
	InitialValue *string `json:"initial_value,omitempty"`
	MinLength    *int32  `json:"min_length,omitempty"`
	MaxLength    *int32  `json:"max_length,omitempty"`
	Required     *bool   `json:"required,omitempty"`
	Hint         *string `json:"hint,omitempty"`
}

type ViewBlockMarkdown struct {
	Type string `json:"type"` // always "markdown"
	Text string `json:"text"`
}

type ViewBlockPlainText struct {
	Type string `json:"type"` // always "plain_text"
	Text string `json:"text"`
}

type ViewBlockRadio struct {
	Type     string                      `json:"type"` // always "radio"
	Name     string                      `json:"name"`
	Label    string                      `json:"label"`
	Options  []ViewBlockSelectableOption `json:"options,omitempty"`
	Required *bool                       `json:"required,omitempty"`
	Hint     *string                     `json:"hint,omitempty"`
}

type ViewBlockSelect struct {
	Type     string                      `json:"type"` // always "select"
	Name     string                      `json:"name"`
	Label    string                      `json:"label"`
	Options  []ViewBlockSelectableOption `json:"options,omitempty"`
	Required *bool                       `json:"required,omitempty"`
	Hint     *string                     `json:"hint,omitempty"`
}

type ViewBlockSelectableOption struct {
	Text        string  `json:"text"`
	Value       string  `json:"value"`
	Description *string `json:"description,omitempty"`
	Selected    *bool   `json:"selected,omitempty"`
}

type ViewBlockTime struct {
	Type        string  `json:"type"` // always "time"
	Name        string  `json:"name"`
	Label       string  `json:"label"`
	InitialTime *string `json:"initial_time,omitempty"`
	Required    *bool   `json:"required,omitempty"`
	Hint        *string `json:"hint,omitempty"`
}

type ViewSubmitWebhookPayload struct {
	Type             string            `json:"type"` // always "view"
	Event            string            `json:"event"` // always "submit"
	UserID           int32             `json:"user_id"`
	Data             map[string]string `json:"data"`
	WebhookTimestamp int32             `json:"webhook_timestamp"`
	CallbackID       *string           `json:"callback_id"`
	PrivateMetadata  *string           `json:"private_metadata"`
}

type WebhookEvent struct {
	ID        string              `json:"id"`
	EventType string              `json:"event_type"`
	Payload   WebhookPayloadUnion `json:"payload"`
	CreatedAt time.Time           `json:"created_at"`
}

type WebhookLink struct {
	URL    string `json:"url"`
	Domain string `json:"domain"`
}

type WebhookMessageThread struct {
	MessageID     int32 `json:"message_id"`
	MessageChatID int32 `json:"message_chat_id"`
}

type AuditEventDetailsUnion struct {
	AuditDetailsEmpty          *AuditDetailsEmpty
	AuditDetailsUserUpdated    *AuditDetailsUserUpdated
	AuditDetailsRoleChanged    *AuditDetailsRoleChanged
	AuditDetailsTagName        *AuditDetailsTagName
	AuditDetailsInitiator      *AuditDetailsInitiator
	AuditDetailsInviter        *AuditDetailsInviter
	AuditDetailsChatRenamed    *AuditDetailsChatRenamed
	AuditDetailsChatPermission *AuditDetailsChatPermission
	AuditDetailsTagChat        *AuditDetailsTagChat
	AuditDetailsChatId         *AuditDetailsChatId
	AuditDetailsTokenScopes    *AuditDetailsTokenScopes
	AuditDetailsKms            *AuditDetailsKms
	AuditDetailsDlp            *AuditDetailsDlp
	AuditDetailsSearch         *AuditDetailsSearch
}

func (u *AuditEventDetailsUnion) UnmarshalJSON(data []byte) error {
	var disc struct {
		Type string `json:"type"`
	}
	if err := json.Unmarshal(data, &disc); err != nil {
		return err
	}
	switch disc.Type {
	case "AuditDetailsEmpty":
		u.AuditDetailsEmpty = &AuditDetailsEmpty{}
		return json.Unmarshal(data, u.AuditDetailsEmpty)
	case "AuditDetailsUserUpdated":
		u.AuditDetailsUserUpdated = &AuditDetailsUserUpdated{}
		return json.Unmarshal(data, u.AuditDetailsUserUpdated)
	case "AuditDetailsRoleChanged":
		u.AuditDetailsRoleChanged = &AuditDetailsRoleChanged{}
		return json.Unmarshal(data, u.AuditDetailsRoleChanged)
	case "AuditDetailsTagName":
		u.AuditDetailsTagName = &AuditDetailsTagName{}
		return json.Unmarshal(data, u.AuditDetailsTagName)
	case "AuditDetailsInitiator":
		u.AuditDetailsInitiator = &AuditDetailsInitiator{}
		return json.Unmarshal(data, u.AuditDetailsInitiator)
	case "AuditDetailsInviter":
		u.AuditDetailsInviter = &AuditDetailsInviter{}
		return json.Unmarshal(data, u.AuditDetailsInviter)
	case "AuditDetailsChatRenamed":
		u.AuditDetailsChatRenamed = &AuditDetailsChatRenamed{}
		return json.Unmarshal(data, u.AuditDetailsChatRenamed)
	case "AuditDetailsChatPermission":
		u.AuditDetailsChatPermission = &AuditDetailsChatPermission{}
		return json.Unmarshal(data, u.AuditDetailsChatPermission)
	case "AuditDetailsTagChat":
		u.AuditDetailsTagChat = &AuditDetailsTagChat{}
		return json.Unmarshal(data, u.AuditDetailsTagChat)
	case "AuditDetailsChatId":
		u.AuditDetailsChatId = &AuditDetailsChatId{}
		return json.Unmarshal(data, u.AuditDetailsChatId)
	case "AuditDetailsTokenScopes":
		u.AuditDetailsTokenScopes = &AuditDetailsTokenScopes{}
		return json.Unmarshal(data, u.AuditDetailsTokenScopes)
	case "AuditDetailsKms":
		u.AuditDetailsKms = &AuditDetailsKms{}
		return json.Unmarshal(data, u.AuditDetailsKms)
	case "AuditDetailsDlp":
		u.AuditDetailsDlp = &AuditDetailsDlp{}
		return json.Unmarshal(data, u.AuditDetailsDlp)
	case "AuditDetailsSearch":
		u.AuditDetailsSearch = &AuditDetailsSearch{}
		return json.Unmarshal(data, u.AuditDetailsSearch)
	default:
		return fmt.Errorf("unknown AuditEventDetailsUnion type: %s", disc.Type)
	}
}

func (u AuditEventDetailsUnion) MarshalJSON() ([]byte, error) {
	if u.AuditDetailsEmpty != nil {
		return json.Marshal(u.AuditDetailsEmpty)
	}
	if u.AuditDetailsUserUpdated != nil {
		return json.Marshal(u.AuditDetailsUserUpdated)
	}
	if u.AuditDetailsRoleChanged != nil {
		return json.Marshal(u.AuditDetailsRoleChanged)
	}
	if u.AuditDetailsTagName != nil {
		return json.Marshal(u.AuditDetailsTagName)
	}
	if u.AuditDetailsInitiator != nil {
		return json.Marshal(u.AuditDetailsInitiator)
	}
	if u.AuditDetailsInviter != nil {
		return json.Marshal(u.AuditDetailsInviter)
	}
	if u.AuditDetailsChatRenamed != nil {
		return json.Marshal(u.AuditDetailsChatRenamed)
	}
	if u.AuditDetailsChatPermission != nil {
		return json.Marshal(u.AuditDetailsChatPermission)
	}
	if u.AuditDetailsTagChat != nil {
		return json.Marshal(u.AuditDetailsTagChat)
	}
	if u.AuditDetailsChatId != nil {
		return json.Marshal(u.AuditDetailsChatId)
	}
	if u.AuditDetailsTokenScopes != nil {
		return json.Marshal(u.AuditDetailsTokenScopes)
	}
	if u.AuditDetailsKms != nil {
		return json.Marshal(u.AuditDetailsKms)
	}
	if u.AuditDetailsDlp != nil {
		return json.Marshal(u.AuditDetailsDlp)
	}
	if u.AuditDetailsSearch != nil {
		return json.Marshal(u.AuditDetailsSearch)
	}
	return nil, fmt.Errorf("empty AuditEventDetailsUnion")
}

type ViewBlockUnion struct {
	ViewBlockHeader    *ViewBlockHeader
	ViewBlockPlainText *ViewBlockPlainText
	ViewBlockMarkdown  *ViewBlockMarkdown
	ViewBlockDivider   *ViewBlockDivider
	ViewBlockInput     *ViewBlockInput
	ViewBlockSelect    *ViewBlockSelect
	ViewBlockRadio     *ViewBlockRadio
	ViewBlockCheckbox  *ViewBlockCheckbox
	ViewBlockDate      *ViewBlockDate
	ViewBlockTime      *ViewBlockTime
	ViewBlockFileInput *ViewBlockFileInput
}

func (u *ViewBlockUnion) UnmarshalJSON(data []byte) error {
	var disc struct {
		Type string `json:"type"`
	}
	if err := json.Unmarshal(data, &disc); err != nil {
		return err
	}
	switch disc.Type {
	case "header":
		u.ViewBlockHeader = &ViewBlockHeader{}
		return json.Unmarshal(data, u.ViewBlockHeader)
	case "plain_text":
		u.ViewBlockPlainText = &ViewBlockPlainText{}
		return json.Unmarshal(data, u.ViewBlockPlainText)
	case "markdown":
		u.ViewBlockMarkdown = &ViewBlockMarkdown{}
		return json.Unmarshal(data, u.ViewBlockMarkdown)
	case "divider":
		u.ViewBlockDivider = &ViewBlockDivider{}
		return json.Unmarshal(data, u.ViewBlockDivider)
	case "input":
		u.ViewBlockInput = &ViewBlockInput{}
		return json.Unmarshal(data, u.ViewBlockInput)
	case "select":
		u.ViewBlockSelect = &ViewBlockSelect{}
		return json.Unmarshal(data, u.ViewBlockSelect)
	case "radio":
		u.ViewBlockRadio = &ViewBlockRadio{}
		return json.Unmarshal(data, u.ViewBlockRadio)
	case "checkbox":
		u.ViewBlockCheckbox = &ViewBlockCheckbox{}
		return json.Unmarshal(data, u.ViewBlockCheckbox)
	case "date":
		u.ViewBlockDate = &ViewBlockDate{}
		return json.Unmarshal(data, u.ViewBlockDate)
	case "time":
		u.ViewBlockTime = &ViewBlockTime{}
		return json.Unmarshal(data, u.ViewBlockTime)
	case "file_input":
		u.ViewBlockFileInput = &ViewBlockFileInput{}
		return json.Unmarshal(data, u.ViewBlockFileInput)
	default:
		return fmt.Errorf("unknown ViewBlockUnion type: %s", disc.Type)
	}
}

func (u ViewBlockUnion) MarshalJSON() ([]byte, error) {
	if u.ViewBlockHeader != nil {
		return json.Marshal(u.ViewBlockHeader)
	}
	if u.ViewBlockPlainText != nil {
		return json.Marshal(u.ViewBlockPlainText)
	}
	if u.ViewBlockMarkdown != nil {
		return json.Marshal(u.ViewBlockMarkdown)
	}
	if u.ViewBlockDivider != nil {
		return json.Marshal(u.ViewBlockDivider)
	}
	if u.ViewBlockInput != nil {
		return json.Marshal(u.ViewBlockInput)
	}
	if u.ViewBlockSelect != nil {
		return json.Marshal(u.ViewBlockSelect)
	}
	if u.ViewBlockRadio != nil {
		return json.Marshal(u.ViewBlockRadio)
	}
	if u.ViewBlockCheckbox != nil {
		return json.Marshal(u.ViewBlockCheckbox)
	}
	if u.ViewBlockDate != nil {
		return json.Marshal(u.ViewBlockDate)
	}
	if u.ViewBlockTime != nil {
		return json.Marshal(u.ViewBlockTime)
	}
	if u.ViewBlockFileInput != nil {
		return json.Marshal(u.ViewBlockFileInput)
	}
	return nil, fmt.Errorf("empty ViewBlockUnion")
}

type WebhookPayloadUnion struct {
	MessageWebhookPayload       *MessageWebhookPayload
	ReactionWebhookPayload      *ReactionWebhookPayload
	ButtonWebhookPayload        *ButtonWebhookPayload
	ViewSubmitWebhookPayload    *ViewSubmitWebhookPayload
	ChatMemberWebhookPayload    *ChatMemberWebhookPayload
	CompanyMemberWebhookPayload *CompanyMemberWebhookPayload
	LinkSharedWebhookPayload    *LinkSharedWebhookPayload
}

func (u *WebhookPayloadUnion) UnmarshalJSON(data []byte) error {
	var disc struct {
		Type string `json:"type"`
	}
	if err := json.Unmarshal(data, &disc); err != nil {
		return err
	}
	switch disc.Type {
	case "message":
		u.MessageWebhookPayload = &MessageWebhookPayload{}
		return json.Unmarshal(data, u.MessageWebhookPayload)
	case "reaction":
		u.ReactionWebhookPayload = &ReactionWebhookPayload{}
		return json.Unmarshal(data, u.ReactionWebhookPayload)
	case "button":
		u.ButtonWebhookPayload = &ButtonWebhookPayload{}
		return json.Unmarshal(data, u.ButtonWebhookPayload)
	case "view":
		u.ViewSubmitWebhookPayload = &ViewSubmitWebhookPayload{}
		return json.Unmarshal(data, u.ViewSubmitWebhookPayload)
	case "chat_member":
		u.ChatMemberWebhookPayload = &ChatMemberWebhookPayload{}
		return json.Unmarshal(data, u.ChatMemberWebhookPayload)
	case "company_member":
		u.CompanyMemberWebhookPayload = &CompanyMemberWebhookPayload{}
		return json.Unmarshal(data, u.CompanyMemberWebhookPayload)
	default:
		return fmt.Errorf("unknown WebhookPayloadUnion type: %s", disc.Type)
	}
}

func (u WebhookPayloadUnion) MarshalJSON() ([]byte, error) {
	if u.MessageWebhookPayload != nil {
		return json.Marshal(u.MessageWebhookPayload)
	}
	if u.ReactionWebhookPayload != nil {
		return json.Marshal(u.ReactionWebhookPayload)
	}
	if u.ButtonWebhookPayload != nil {
		return json.Marshal(u.ButtonWebhookPayload)
	}
	if u.ViewSubmitWebhookPayload != nil {
		return json.Marshal(u.ViewSubmitWebhookPayload)
	}
	if u.ChatMemberWebhookPayload != nil {
		return json.Marshal(u.ChatMemberWebhookPayload)
	}
	if u.CompanyMemberWebhookPayload != nil {
		return json.Marshal(u.CompanyMemberWebhookPayload)
	}
	if u.LinkSharedWebhookPayload != nil {
		return json.Marshal(u.LinkSharedWebhookPayload)
	}
	return nil, fmt.Errorf("empty WebhookPayloadUnion")
}

type GetAuditEventsParams struct {
	StartTime  *time.Time
	EndTime    *time.Time
	EventKey   *AuditEventKey
	ActorID    *string
	ActorType  *string
	EntityID   *string
	EntityType *string
	Limit      *int32
	Cursor     *string
}

type ListChatsParams struct {
	SortID              *SortOrder
	Availability        *ChatAvailability
	LastMessageAtAfter  *time.Time
	LastMessageAtBefore *time.Time
	Personal            *bool
	Limit               *int32
	Cursor              *string
}

type ListMembersParams struct {
	Role   *ChatMemberRoleFilter
	Limit  *int32
	Cursor *string
}

type ListPropertiesParams struct {
	EntityType SearchEntityType
}

type ListTagsParams struct {
	Names  []string
	Limit  *int32
	Cursor *string
}

type GetTagUsersParams struct {
	Limit  *int32
	Cursor *string
}

type ListChatMessagesParams struct {
	ChatID int32
	SortID *SortOrder
	Limit  *int32
	Cursor *string
}

type RemoveReactionParams struct {
	Code string
	Name *string
}

type ListReactionsParams struct {
	Limit  *int32
	Cursor *string
}

type ListReadMembersParams struct {
	Limit  *int32
	Cursor *string
}

type SearchChatsParams struct {
	Query       *string
	Limit       *int32
	Cursor      *string
	Order       *SortOrder
	CreatedFrom *time.Time
	CreatedTo   *time.Time
	Active      *bool
	ChatSubtype *ChatSubtype
	Personal    *bool
}

type SearchMessagesParams struct {
	Query       *string
	Limit       *int32
	Cursor      *string
	Order       *SortOrder
	CreatedFrom *time.Time
	CreatedTo   *time.Time
	ChatIDs     []int32
	UserIDs     []int32
	Active      *bool
}

type SearchUsersParams struct {
	Query        *string
	Limit        *int32
	Cursor       *string
	Sort         *SearchSortOrder
	Order        *SortOrder
	CreatedFrom  *time.Time
	CreatedTo    *time.Time
	CompanyRoles []UserRole
}

type ListTasksParams struct {
	Limit  *int32
	Cursor *string
}

type ListUsersParams struct {
	Query  *string
	Limit  *int32
	Cursor *string
}

type GetWebhookEventsParams struct {
	Limit  *int32
	Cursor *string
}

type GetAuditEventsResponse struct {
	Data []AuditEvent   `json:"data"`
	Meta PaginationMeta `json:"meta"`
}

type ListChatsResponse struct {
	Data []Chat         `json:"data"`
	Meta PaginationMeta `json:"meta"`
}

type ListMembersResponse struct {
	Data []User         `json:"data"`
	Meta PaginationMeta `json:"meta"`
}

type ListPropertiesResponse struct {
	Data []CustomPropertyDefinition `json:"data"`
}

type ListTagsResponse struct {
	Data []GroupTag     `json:"data"`
	Meta PaginationMeta `json:"meta"`
}

type GetTagUsersResponse struct {
	Data []User         `json:"data"`
	Meta PaginationMeta `json:"meta"`
}

type ListChatMessagesResponse struct {
	Data []Message      `json:"data"`
	Meta PaginationMeta `json:"meta"`
}

type ListReactionsResponse struct {
	Data []Reaction     `json:"data"`
	Meta PaginationMeta `json:"meta"`
}

type SearchChatsResponse struct {
	Data []Chat               `json:"data"`
	Meta SearchPaginationMeta `json:"meta"`
}

type SearchMessagesResponse struct {
	Data []Message            `json:"data"`
	Meta SearchPaginationMeta `json:"meta"`
}

type SearchUsersResponse struct {
	Data []User               `json:"data"`
	Meta SearchPaginationMeta `json:"meta"`
}

type ListTasksResponse struct {
	Data []Task         `json:"data"`
	Meta PaginationMeta `json:"meta"`
}

type ListUsersResponse struct {
	Data []User         `json:"data"`
	Meta PaginationMeta `json:"meta"`
}

type GetWebhookEventsResponse struct {
	Data []WebhookEvent `json:"data"`
	Meta PaginationMeta `json:"meta"`
}
