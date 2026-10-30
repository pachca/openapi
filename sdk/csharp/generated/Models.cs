#nullable enable

using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Pachca.Sdk;

/// <summary>Тип аудит-события</summary>
[JsonConverter(typeof(AuditEventKeyConverter))]
public readonly struct AuditEventKey : IEquatable<AuditEventKey>
{
    private readonly string? _value;

    public AuditEventKey(string value) => _value = value ?? throw new ArgumentNullException(nameof(value));

    /// <summary>Пользователь успешно вошел в систему</summary>
    public static AuditEventKey UserLogin { get; } = new("user_login");
    /// <summary>Пользователь вышел из системы</summary>
    public static AuditEventKey UserLogout { get; } = new("user_logout");
    /// <summary>Неудачная попытка двухфакторной аутентификации</summary>
    public static AuditEventKey User2faFail { get; } = new("user_2fa_fail");
    /// <summary>Успешная двухфакторная аутентификация</summary>
    public static AuditEventKey User2faSuccess { get; } = new("user_2fa_success");
    /// <summary>Двухфакторная аутентификация отключена у сотрудника</summary>
    public static AuditEventKey User2faDisabled { get; } = new("user_2fa_disabled");
    /// <summary>Создан QR-код для входа в мобильное приложение</summary>
    public static AuditEventKey LoginGrantCreated { get; } = new("login_grant_created");
    /// <summary>Сотрудник подтвердил вход по QR-коду</summary>
    public static AuditEventKey LoginGrantApproved { get; } = new("login_grant_approved");
    /// <summary>Вход по QR-коду отклонён</summary>
    public static AuditEventKey LoginGrantDenied { get; } = new("login_grant_denied");
    /// <summary>Создана новая учетная запись пользователя</summary>
    public static AuditEventKey UserCreated { get; } = new("user_created");
    /// <summary>Учетная запись пользователя удалена</summary>
    public static AuditEventKey UserDeleted { get; } = new("user_deleted");
    /// <summary>Роль пользователя была изменена</summary>
    public static AuditEventKey UserRoleChanged { get; } = new("user_role_changed");
    /// <summary>Данные пользователя обновлены</summary>
    public static AuditEventKey UserUpdated { get; } = new("user_updated");
    /// <summary>Создан новый тег</summary>
    public static AuditEventKey TagCreated { get; } = new("tag_created");
    /// <summary>Тег удален</summary>
    public static AuditEventKey TagDeleted { get; } = new("tag_deleted");
    /// <summary>Пользователь добавлен в тег</summary>
    public static AuditEventKey UserAddedToTag { get; } = new("user_added_to_tag");
    /// <summary>Пользователь удален из тега</summary>
    public static AuditEventKey UserRemovedFromTag { get; } = new("user_removed_from_tag");
    /// <summary>Создан новый чат</summary>
    public static AuditEventKey ChatCreated { get; } = new("chat_created");
    /// <summary>Чат переименован</summary>
    public static AuditEventKey ChatRenamed { get; } = new("chat_renamed");
    /// <summary>Изменены права доступа к чату</summary>
    public static AuditEventKey ChatPermissionChanged { get; } = new("chat_permission_changed");
    /// <summary>Пользователь присоединился к чату</summary>
    public static AuditEventKey UserChatJoin { get; } = new("user_chat_join");
    /// <summary>Пользователь покинул чат</summary>
    public static AuditEventKey UserChatLeave { get; } = new("user_chat_leave");
    /// <summary>Тег добавлен в чат</summary>
    public static AuditEventKey TagAddedToChat { get; } = new("tag_added_to_chat");
    /// <summary>Тег удален из чата</summary>
    public static AuditEventKey TagRemovedFromChat { get; } = new("tag_removed_from_chat");
    /// <summary>Сообщение отредактировано</summary>
    public static AuditEventKey MessageUpdated { get; } = new("message_updated");
    /// <summary>Сообщение удалено</summary>
    public static AuditEventKey MessageDeleted { get; } = new("message_deleted");
    /// <summary>Сообщение создано</summary>
    public static AuditEventKey MessageCreated { get; } = new("message_created");
    /// <summary>Реакция добавлена</summary>
    public static AuditEventKey ReactionCreated { get; } = new("reaction_created");
    /// <summary>Реакция удалена</summary>
    public static AuditEventKey ReactionDeleted { get; } = new("reaction_deleted");
    /// <summary>Тред создан</summary>
    public static AuditEventKey ThreadCreated { get; } = new("thread_created");
    /// <summary>Создан новый токен доступа</summary>
    public static AuditEventKey AccessTokenCreated { get; } = new("access_token_created");
    /// <summary>Токен доступа обновлен</summary>
    public static AuditEventKey AccessTokenUpdated { get; } = new("access_token_updated");
    /// <summary>Токен доступа удален</summary>
    public static AuditEventKey AccessTokenDestroy { get; } = new("access_token_destroy");
    /// <summary>Данные зашифрованы</summary>
    public static AuditEventKey KmsEncrypt { get; } = new("kms_encrypt");
    /// <summary>Данные расшифрованы</summary>
    public static AuditEventKey KmsDecrypt { get; } = new("kms_decrypt");
    /// <summary>Доступ к журналам аудита получен</summary>
    public static AuditEventKey AuditEventsAccessed { get; } = new("audit_events_accessed");
    /// <summary>Получен список всех чатов пространства</summary>
    public static AuditEventKey CompanyChatsAccessed { get; } = new("company_chats_accessed");
    /// <summary>Получен список всех ботов пространства</summary>
    public static AuditEventKey CompanyBotsAccessed { get; } = new("company_bots_accessed");
    /// <summary>Срабатывание правила DLP-системы</summary>
    public static AuditEventKey DlpViolationDetected { get; } = new("dlp_violation_detected");
    /// <summary>Поиск сотрудников через API</summary>
    public static AuditEventKey SearchUsersApi { get; } = new("search_users_api");
    /// <summary>Поиск чатов через API</summary>
    public static AuditEventKey SearchChatsApi { get; } = new("search_chats_api");
    /// <summary>Поиск сообщений через API</summary>
    public static AuditEventKey SearchMessagesApi { get; } = new("search_messages_api");
    /// <summary>Изменены скоупы токена бота</summary>
    public static AuditEventKey BotScopesUpdated { get; } = new("bot_scopes_updated");
    /// <summary>Изменены настройки исходящего вебхука бота</summary>
    public static AuditEventKey BotWebhookSettingsUpdated { get; } = new("bot_webhook_settings_updated");
    /// <summary>Токен бота перевыпущен (ротация)</summary>
    public static AuditEventKey BotTokenRecreated { get; } = new("bot_token_recreated");
    /// <summary>Бот удалён</summary>
    public static AuditEventKey BotDeleted { get; } = new("bot_deleted");
    /// <summary>Изменены параметры OAuth-клиента бота</summary>
    public static AuditEventKey BotOauthClientUpdated { get; } = new("bot_oauth_client_updated");
    /// <summary>У бота выключена авторизация от имени сотрудника</summary>
    public static AuditEventKey BotOauthClientDisabled { get; } = new("bot_oauth_client_disabled");
    /// <summary>Обновлён секрет OAuth-клиента бота</summary>
    public static AuditEventKey BotOauthClientSecretRotated { get; } = new("bot_oauth_client_secret_rotated");
    /// <summary>Выпущен секрет OAuth-клиента бота</summary>
    public static AuditEventKey BotOauthClientSecretIssued { get; } = new("bot_oauth_client_secret_issued");
    /// <summary>Выпущен токен бота</summary>
    public static AuditEventKey BotTokenCreated { get; } = new("bot_token_created");
    /// <summary>Изменены имя или скоупы токена бота</summary>
    public static AuditEventKey BotTokenUpdated { get; } = new("bot_token_updated");
    /// <summary>Отдельный токен бота перевыпущен</summary>
    public static AuditEventKey BotTokenReissued { get; } = new("bot_token_reissued");
    /// <summary>Токен бота удалён</summary>
    public static AuditEventKey BotTokenDeleted { get; } = new("bot_token_deleted");
    /// <summary>Пользователь выдал OAuth-клиенту доступ к своим данным</summary>
    public static AuditEventKey OauthAuthorizationGranted { get; } = new("oauth_authorization_granted");
    /// <summary>Доступ OAuth-клиента к данным пользователя отозван</summary>
    public static AuditEventKey OauthAuthorizationRevoked { get; } = new("oauth_authorization_revoked");
    /// <summary>OAuth-клиент отозвал выданный ему токен</summary>
    public static AuditEventKey OauthTokenRevoked { get; } = new("oauth_token_revoked");
    /// <summary>Сотрудник подтвердил вход приложения с устройства</summary>
    public static AuditEventKey OauthDeviceAuthorizationApproved { get; } = new("oauth_device_authorization_approved");
    /// <summary>Сотрудник отклонил вход приложения с устройства</summary>
    public static AuditEventKey OauthDeviceAuthorizationDenied { get; } = new("oauth_device_authorization_denied");
    /// <summary>Видеозвонок начат</summary>
    public static AuditEventKey VideoCallStarted { get; } = new("video_call_started");
    /// <summary>Видеозвонок завершён</summary>
    public static AuditEventKey VideoCallFinished { get; } = new("video_call_finished");
    /// <summary>Запись видеозвонка готова</summary>
    public static AuditEventKey VideoCallRecordingReady { get; } = new("video_call_recording_ready");
    /// <summary>Отключена интеграция с Exchange</summary>
    public static AuditEventKey ExchangeDisabled { get; } = new("exchange_disabled");

    /// <summary>Every value this SDK version lists</summary>
    public static IReadOnlyList<AuditEventKey> Values { get; } = Array.AsReadOnly(new[] { UserLogin, UserLogout, User2faFail, User2faSuccess, User2faDisabled, LoginGrantCreated, LoginGrantApproved, LoginGrantDenied, UserCreated, UserDeleted, UserRoleChanged, UserUpdated, TagCreated, TagDeleted, UserAddedToTag, UserRemovedFromTag, ChatCreated, ChatRenamed, ChatPermissionChanged, UserChatJoin, UserChatLeave, TagAddedToChat, TagRemovedFromChat, MessageUpdated, MessageDeleted, MessageCreated, ReactionCreated, ReactionDeleted, ThreadCreated, AccessTokenCreated, AccessTokenUpdated, AccessTokenDestroy, KmsEncrypt, KmsDecrypt, AuditEventsAccessed, CompanyChatsAccessed, CompanyBotsAccessed, DlpViolationDetected, SearchUsersApi, SearchChatsApi, SearchMessagesApi, BotScopesUpdated, BotWebhookSettingsUpdated, BotTokenRecreated, BotDeleted, BotOauthClientUpdated, BotOauthClientDisabled, BotOauthClientSecretRotated, BotOauthClientSecretIssued, BotTokenCreated, BotTokenUpdated, BotTokenReissued, BotTokenDeleted, OauthAuthorizationGranted, OauthAuthorizationRevoked, OauthTokenRevoked, OauthDeviceAuthorizationApproved, OauthDeviceAuthorizationDenied, VideoCallStarted, VideoCallFinished, VideoCallRecordingReady, ExchangeDisabled });

    /// <summary>The value as it travels in JSON</summary>
    public string Value => _value ?? "";

    /// <summary>Whether this SDK version lists the value</summary>
    public bool IsKnown
    {
        get
        {
            foreach (var known in Values)
                if (Equals(known)) return true;
            return false;
        }
    }

    public static bool operator ==(AuditEventKey left, AuditEventKey right) => left.Equals(right);
    public static bool operator !=(AuditEventKey left, AuditEventKey right) => !left.Equals(right);
    public static implicit operator AuditEventKey(string value) => new(value);
    public bool Equals(AuditEventKey other) => string.Equals(Value, other.Value, StringComparison.Ordinal);
    public override bool Equals(object? obj) => obj is AuditEventKey other && Equals(other);
    public override int GetHashCode() => StringComparer.Ordinal.GetHashCode(Value);
    public override string ToString() => Value;
}

internal class AuditEventKeyConverter : JsonConverter<AuditEventKey>
{
    public override AuditEventKey Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options) =>
        new(reader.GetString() ?? "");

    public override void Write(Utf8JsonWriter writer, AuditEventKey value, JsonSerializerOptions options) =>
        writer.WriteStringValue(value.Value);
}

/// <summary>Причина отказа во входе по QR-коду</summary>
[JsonConverter(typeof(AuditLoginGrantDenyReasonConverter))]
public readonly struct AuditLoginGrantDenyReason : IEquatable<AuditLoginGrantDenyReason>
{
    private readonly string? _value;

    public AuditLoginGrantDenyReason(string value) => _value = value ?? throw new ArgumentNullException(nameof(value));

    /// <summary>Сотрудник отклонил вход</summary>
    public static AuditLoginGrantDenyReason Denied { get; } = new("denied");
    /// <summary>Сотрудник ввёл не те цифры, что показало устройство</summary>
    public static AuditLoginGrantDenyReason VerificationFailed { get; } = new("verification_failed");

    /// <summary>Every value this SDK version lists</summary>
    public static IReadOnlyList<AuditLoginGrantDenyReason> Values { get; } = Array.AsReadOnly(new[] { Denied, VerificationFailed });

    /// <summary>The value as it travels in JSON</summary>
    public string Value => _value ?? "";

    /// <summary>Whether this SDK version lists the value</summary>
    public bool IsKnown
    {
        get
        {
            foreach (var known in Values)
                if (Equals(known)) return true;
            return false;
        }
    }

    public static bool operator ==(AuditLoginGrantDenyReason left, AuditLoginGrantDenyReason right) => left.Equals(right);
    public static bool operator !=(AuditLoginGrantDenyReason left, AuditLoginGrantDenyReason right) => !left.Equals(right);
    public static implicit operator AuditLoginGrantDenyReason(string value) => new(value);
    public bool Equals(AuditLoginGrantDenyReason other) => string.Equals(Value, other.Value, StringComparison.Ordinal);
    public override bool Equals(object? obj) => obj is AuditLoginGrantDenyReason other && Equals(other);
    public override int GetHashCode() => StringComparer.Ordinal.GetHashCode(Value);
    public override string ToString() => Value;
}

internal class AuditLoginGrantDenyReasonConverter : JsonConverter<AuditLoginGrantDenyReason>
{
    public override AuditLoginGrantDenyReason Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options) =>
        new(reader.GetString() ?? "");

    public override void Write(Utf8JsonWriter writer, AuditLoginGrantDenyReason value, JsonSerializerOptions options) =>
        writer.WriteStringValue(value.Value);
}

/// <summary>Платформа мобильного приложения, в котором выполняется вход по QR-коду</summary>
[JsonConverter(typeof(AuditLoginGrantDevicePlatformConverter))]
public readonly struct AuditLoginGrantDevicePlatform : IEquatable<AuditLoginGrantDevicePlatform>
{
    private readonly string? _value;

    public AuditLoginGrantDevicePlatform(string value) => _value = value ?? throw new ArgumentNullException(nameof(value));

    /// <summary>Приложение для iOS</summary>
    public static AuditLoginGrantDevicePlatform IOS { get; } = new("iOS");
    /// <summary>Приложение для Android</summary>
    public static AuditLoginGrantDevicePlatform Android { get; } = new("Android");
    /// <summary>Приложение для Android из RuStore</summary>
    public static AuditLoginGrantDevicePlatform Rustore { get; } = new("Rustore");
    /// <summary>Приложение для Android из AppGallery</summary>
    public static AuditLoginGrantDevicePlatform Appgallery { get; } = new("Appgallery");

    /// <summary>Every value this SDK version lists</summary>
    public static IReadOnlyList<AuditLoginGrantDevicePlatform> Values { get; } = Array.AsReadOnly(new[] { IOS, Android, Rustore, Appgallery });

    /// <summary>The value as it travels in JSON</summary>
    public string Value => _value ?? "";

    /// <summary>Whether this SDK version lists the value</summary>
    public bool IsKnown
    {
        get
        {
            foreach (var known in Values)
                if (Equals(known)) return true;
            return false;
        }
    }

    public static bool operator ==(AuditLoginGrantDevicePlatform left, AuditLoginGrantDevicePlatform right) => left.Equals(right);
    public static bool operator !=(AuditLoginGrantDevicePlatform left, AuditLoginGrantDevicePlatform right) => !left.Equals(right);
    public static implicit operator AuditLoginGrantDevicePlatform(string value) => new(value);
    public bool Equals(AuditLoginGrantDevicePlatform other) => string.Equals(Value, other.Value, StringComparison.Ordinal);
    public override bool Equals(object? obj) => obj is AuditLoginGrantDevicePlatform other && Equals(other);
    public override int GetHashCode() => StringComparer.Ordinal.GetHashCode(Value);
    public override string ToString() => Value;
}

internal class AuditLoginGrantDevicePlatformConverter : JsonConverter<AuditLoginGrantDevicePlatform>
{
    public override AuditLoginGrantDevicePlatform Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options) =>
        new(reader.GetString() ?? "");

    public override void Write(Utf8JsonWriter writer, AuditLoginGrantDevicePlatform value, JsonSerializerOptions options) =>
        writer.WriteStringValue(value.Value);
}

/// <summary>Роль, которой разрешено редактировать настройки бота</summary>
[JsonConverter(typeof(BotCanEditConverter))]
public readonly struct BotCanEdit : IEquatable<BotCanEdit>
{
    private readonly string? _value;

    public BotCanEdit(string value) => _value = value ?? throw new ArgumentNullException(nameof(value));

    /// <summary>Администраторы компании</summary>
    public static BotCanEdit Admin { get; } = new("admin");
    /// <summary>Владельцы чатов, в которые добавлен бот</summary>
    public static BotCanEdit ChatOwners { get; } = new("chat_owners");

    /// <summary>Every value this SDK version lists</summary>
    public static IReadOnlyList<BotCanEdit> Values { get; } = Array.AsReadOnly(new[] { Admin, ChatOwners });

    /// <summary>The value as it travels in JSON</summary>
    public string Value => _value ?? "";

    /// <summary>Whether this SDK version lists the value</summary>
    public bool IsKnown
    {
        get
        {
            foreach (var known in Values)
                if (Equals(known)) return true;
            return false;
        }
    }

    public static bool operator ==(BotCanEdit left, BotCanEdit right) => left.Equals(right);
    public static bool operator !=(BotCanEdit left, BotCanEdit right) => !left.Equals(right);
    public static implicit operator BotCanEdit(string value) => new(value);
    public bool Equals(BotCanEdit other) => string.Equals(Value, other.Value, StringComparison.Ordinal);
    public override bool Equals(object? obj) => obj is BotCanEdit other && Equals(other);
    public override int GetHashCode() => StringComparer.Ordinal.GetHashCode(Value);
    public override string ToString() => Value;
}

internal class BotCanEditConverter : JsonConverter<BotCanEdit>
{
    public override BotCanEdit Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options) =>
        new(reader.GetString() ?? "");

    public override void Write(Utf8JsonWriter writer, BotCanEdit value, JsonSerializerOptions options) =>
        writer.WriteStringValue(value.Value);
}

/// <summary>Событие исходящего вебхука бота</summary>
[JsonConverter(typeof(BotEventNameConverter))]
public readonly struct BotEventName : IEquatable<BotEventName>
{
    private readonly string? _value;

    public BotEventName(string value) => _value = value ?? throw new ArgumentNullException(nameof(value));

    /// <summary>Новое сообщение</summary>
    public static BotEventName MessageNew { get; } = new("message_new");
    /// <summary>Сообщение отредактировано</summary>
    public static BotEventName MessageUpdate { get; } = new("message_update");
    /// <summary>Сообщение удалено</summary>
    public static BotEventName MessageDelete { get; } = new("message_delete");
    /// <summary>Добавлена реакция</summary>
    public static BotEventName ReactionNew { get; } = new("reaction_new");
    /// <summary>Реакция удалена</summary>
    public static BotEventName ReactionDelete { get; } = new("reaction_delete");
    /// <summary>Нажата кнопка</summary>
    public static BotEventName ButtonClick { get; } = new("button_click");
    /// <summary>В сообщении отправлена ссылка (для unfurl)</summary>
    public static BotEventName MessageLinkShared { get; } = new("message_link_shared");
    /// <summary>Участник добавлен в чат</summary>
    public static BotEventName ChatMemberAdd { get; } = new("chat_member_add");
    /// <summary>Участник удалён из чата</summary>
    public static BotEventName ChatMemberRemove { get; } = new("chat_member_remove");
    /// <summary>Сотрудник приглашён в компанию</summary>
    public static BotEventName CompanyMemberInvite { get; } = new("company_member_invite");
    /// <summary>Сотрудник подтвердил приглашение</summary>
    public static BotEventName CompanyMemberConfirm { get; } = new("company_member_confirm");
    /// <summary>Сотрудник деактивирован</summary>
    public static BotEventName CompanyMemberSuspend { get; } = new("company_member_suspend");
    /// <summary>Сотрудник активирован</summary>
    public static BotEventName CompanyMemberActivate { get; } = new("company_member_activate");
    /// <summary>Сотрудник удалён из компании</summary>
    public static BotEventName CompanyMemberDelete { get; } = new("company_member_delete");
    /// <summary>Данные сотрудника изменены</summary>
    public static BotEventName CompanyMemberUpdate { get; } = new("company_member_update");
    /// <summary>Видеозвонок начался</summary>
    public static BotEventName VideoCallStarted { get; } = new("video_call_started");
    /// <summary>Видеозвонок завершился</summary>
    public static BotEventName VideoCallFinished { get; } = new("video_call_finished");
    /// <summary>Запись видеозвонка готова</summary>
    public static BotEventName VideoCallRecordingReady { get; } = new("video_call_recording_ready");

    /// <summary>Every value this SDK version lists</summary>
    public static IReadOnlyList<BotEventName> Values { get; } = Array.AsReadOnly(new[] { MessageNew, MessageUpdate, MessageDelete, ReactionNew, ReactionDelete, ButtonClick, MessageLinkShared, ChatMemberAdd, ChatMemberRemove, CompanyMemberInvite, CompanyMemberConfirm, CompanyMemberSuspend, CompanyMemberActivate, CompanyMemberDelete, CompanyMemberUpdate, VideoCallStarted, VideoCallFinished, VideoCallRecordingReady });

    /// <summary>The value as it travels in JSON</summary>
    public string Value => _value ?? "";

    /// <summary>Whether this SDK version lists the value</summary>
    public bool IsKnown
    {
        get
        {
            foreach (var known in Values)
                if (Equals(known)) return true;
            return false;
        }
    }

    public static bool operator ==(BotEventName left, BotEventName right) => left.Equals(right);
    public static bool operator !=(BotEventName left, BotEventName right) => !left.Equals(right);
    public static implicit operator BotEventName(string value) => new(value);
    public bool Equals(BotEventName other) => string.Equals(Value, other.Value, StringComparison.Ordinal);
    public override bool Equals(object? obj) => obj is BotEventName other && Equals(other);
    public override int GetHashCode() => StringComparer.Ordinal.GetHashCode(Value);
    public override string ToString() => Value;
}

internal class BotEventNameConverter : JsonConverter<BotEventName>
{
    public override BotEventName Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options) =>
        new(reader.GetString() ?? "");

    public override void Write(Utf8JsonWriter writer, BotEventName value, JsonSerializerOptions options) =>
        writer.WriteStringValue(value.Value);
}

/// <summary>Шаблонизатор для форматирования входящих вебхуков</summary>
[JsonConverter(typeof(BotTemplateEngineConverter))]
public readonly struct BotTemplateEngine : IEquatable<BotTemplateEngine>
{
    private readonly string? _value;

    public BotTemplateEngine(string value) => _value = value ?? throw new ArgumentNullException(nameof(value));

    /// <summary>Liquid — условия, циклы и фильтры</summary>
    public static BotTemplateEngine Liquid { get; } = new("liquid");
    /// <summary>Mustache — простая подстановка без логики</summary>
    public static BotTemplateEngine Mustache { get; } = new("mustache");

    /// <summary>Every value this SDK version lists</summary>
    public static IReadOnlyList<BotTemplateEngine> Values { get; } = Array.AsReadOnly(new[] { Liquid, Mustache });

    /// <summary>The value as it travels in JSON</summary>
    public string Value => _value ?? "";

    /// <summary>Whether this SDK version lists the value</summary>
    public bool IsKnown
    {
        get
        {
            foreach (var known in Values)
                if (Equals(known)) return true;
            return false;
        }
    }

    public static bool operator ==(BotTemplateEngine left, BotTemplateEngine right) => left.Equals(right);
    public static bool operator !=(BotTemplateEngine left, BotTemplateEngine right) => !left.Equals(right);
    public static implicit operator BotTemplateEngine(string value) => new(value);
    public bool Equals(BotTemplateEngine other) => string.Equals(Value, other.Value, StringComparison.Ordinal);
    public override bool Equals(object? obj) => obj is BotTemplateEngine other && Equals(other);
    public override int GetHashCode() => StringComparer.Ordinal.GetHashCode(Value);
    public override string ToString() => Value;
}

internal class BotTemplateEngineConverter : JsonConverter<BotTemplateEngine>
{
    public override BotTemplateEngine Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options) =>
        new(reader.GetString() ?? "");

    public override void Write(Utf8JsonWriter writer, BotTemplateEngine value, JsonSerializerOptions options) =>
        writer.WriteStringValue(value.Value);
}

/// <summary>Условие срабатывания исходящего вебхука бота</summary>
[JsonConverter(typeof(BotTriggerOnConverter))]
public readonly struct BotTriggerOn : IEquatable<BotTriggerOn>
{
    private readonly string? _value;

    public BotTriggerOn(string value) => _value = value ?? throw new ArgumentNullException(nameof(value));

    /// <summary>Только на команды (триггер-слова) из commands</summary>
    public static BotTriggerOn Commands { get; } = new("commands");
    /// <summary>На все сообщения в чатах, где есть бот</summary>
    public static BotTriggerOn AllMessages { get; } = new("all_messages");
    /// <summary>На развёртывание ссылок (link previews)</summary>
    public static BotTriggerOn Unfurl { get; } = new("unfurl");

    /// <summary>Every value this SDK version lists</summary>
    public static IReadOnlyList<BotTriggerOn> Values { get; } = Array.AsReadOnly(new[] { Commands, AllMessages, Unfurl });

    /// <summary>The value as it travels in JSON</summary>
    public string Value => _value ?? "";

    /// <summary>Whether this SDK version lists the value</summary>
    public bool IsKnown
    {
        get
        {
            foreach (var known in Values)
                if (Equals(known)) return true;
            return false;
        }
    }

    public static bool operator ==(BotTriggerOn left, BotTriggerOn right) => left.Equals(right);
    public static bool operator !=(BotTriggerOn left, BotTriggerOn right) => !left.Equals(right);
    public static implicit operator BotTriggerOn(string value) => new(value);
    public bool Equals(BotTriggerOn other) => string.Equals(Value, other.Value, StringComparison.Ordinal);
    public override bool Equals(object? obj) => obj is BotTriggerOn other && Equals(other);
    public override int GetHashCode() => StringComparer.Ordinal.GetHashCode(Value);
    public override string ToString() => Value;
}

internal class BotTriggerOnConverter : JsonConverter<BotTriggerOn>
{
    public override BotTriggerOn Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options) =>
        new(reader.GetString() ?? "");

    public override void Write(Utf8JsonWriter writer, BotTriggerOn value, JsonSerializerOptions options) =>
        writer.WriteStringValue(value.Value);
}

/// <summary>Источник входящего вебхука бота</summary>
[JsonConverter(typeof(BotWebhookKindConverter))]
public readonly struct BotWebhookKind : IEquatable<BotWebhookKind>
{
    private readonly string? _value;

    public BotWebhookKind(string value) => _value = value ?? throw new ArgumentNullException(nameof(value));

    /// <summary>Свой формат: сообщение собирается из тела запроса по шаблону бота</summary>
    public static BotWebhookKind Simple { get; } = new("simple");
    /// <summary>GitLab: Пачка сама разбирает запрос и собирает сообщение</summary>
    public static BotWebhookKind Gitlab { get; } = new("gitlab");
    /// <summary>Grafana: Пачка сама разбирает запрос и собирает сообщение</summary>
    public static BotWebhookKind Grafana { get; } = new("grafana");

    /// <summary>Every value this SDK version lists</summary>
    public static IReadOnlyList<BotWebhookKind> Values { get; } = Array.AsReadOnly(new[] { Simple, Gitlab, Grafana });

    /// <summary>The value as it travels in JSON</summary>
    public string Value => _value ?? "";

    /// <summary>Whether this SDK version lists the value</summary>
    public bool IsKnown
    {
        get
        {
            foreach (var known in Values)
                if (Equals(known)) return true;
            return false;
        }
    }

    public static bool operator ==(BotWebhookKind left, BotWebhookKind right) => left.Equals(right);
    public static bool operator !=(BotWebhookKind left, BotWebhookKind right) => !left.Equals(right);
    public static implicit operator BotWebhookKind(string value) => new(value);
    public bool Equals(BotWebhookKind other) => string.Equals(Value, other.Value, StringComparison.Ordinal);
    public override bool Equals(object? obj) => obj is BotWebhookKind other && Equals(other);
    public override int GetHashCode() => StringComparer.Ordinal.GetHashCode(Value);
    public override string ToString() => Value;
}

internal class BotWebhookKindConverter : JsonConverter<BotWebhookKind>
{
    public override BotWebhookKind Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options) =>
        new(reader.GetString() ?? "");

    public override void Write(Utf8JsonWriter writer, BotWebhookKind value, JsonSerializerOptions options) =>
        writer.WriteStringValue(value.Value);
}

/// <summary>Кто может добавлять бота в чаты</summary>
[JsonConverter(typeof(BotWhoCanAddConverter))]
public readonly struct BotWhoCanAdd : IEquatable<BotWhoCanAdd>
{
    private readonly string? _value;

    public BotWhoCanAdd(string value) => _value = value ?? throw new ArgumentNullException(nameof(value));

    /// <summary>Только создатель бота</summary>
    public static BotWhoCanAdd Creator { get; } = new("creator");
    /// <summary>Создатель и администраторы компании</summary>
    public static BotWhoCanAdd CreatorAdmin { get; } = new("creator_admin");
    /// <summary>Создатель, администраторы и участники компании</summary>
    public static BotWhoCanAdd CreatorAdminUser { get; } = new("creator_admin_user");
    /// <summary>Публичный бот: добавить его может любой сотрудник, кроме гостей и мульти-гостей</summary>
    public static BotWhoCanAdd Anyone { get; } = new("anyone");

    /// <summary>Every value this SDK version lists</summary>
    public static IReadOnlyList<BotWhoCanAdd> Values { get; } = Array.AsReadOnly(new[] { Creator, CreatorAdmin, CreatorAdminUser, Anyone });

    /// <summary>The value as it travels in JSON</summary>
    public string Value => _value ?? "";

    /// <summary>Whether this SDK version lists the value</summary>
    public bool IsKnown
    {
        get
        {
            foreach (var known in Values)
                if (Equals(known)) return true;
            return false;
        }
    }

    public static bool operator ==(BotWhoCanAdd left, BotWhoCanAdd right) => left.Equals(right);
    public static bool operator !=(BotWhoCanAdd left, BotWhoCanAdd right) => !left.Equals(right);
    public static implicit operator BotWhoCanAdd(string value) => new(value);
    public bool Equals(BotWhoCanAdd other) => string.Equals(Value, other.Value, StringComparison.Ordinal);
    public override bool Equals(object? obj) => obj is BotWhoCanAdd other && Equals(other);
    public override int GetHashCode() => StringComparer.Ordinal.GetHashCode(Value);
    public override string ToString() => Value;
}

internal class BotWhoCanAddConverter : JsonConverter<BotWhoCanAdd>
{
    public override BotWhoCanAdd Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options) =>
        new(reader.GetString() ?? "");

    public override void Write(Utf8JsonWriter writer, BotWhoCanAdd value, JsonSerializerOptions options) =>
        writer.WriteStringValue(value.Value);
}

/// <summary>Состояние чатов в выборке</summary>
[JsonConverter(typeof(ChatActivityConverter))]
public enum ChatActivity
{
    /// <summary>Только активные чаты</summary>
    Active,
    /// <summary>Только архивные чаты</summary>
    Archived,
}

internal class ChatActivityConverter : JsonConverter<ChatActivity>
{
    public override ChatActivity Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        var value = reader.GetString();
        return value switch
        {
            "active" => ChatActivity.Active,
            "archived" => ChatActivity.Archived,
            _ => throw new JsonException($"Unknown ChatActivity value: {value}"),
        };
    }

    public override void Write(Utf8JsonWriter writer, ChatActivity value, JsonSerializerOptions options)
    {
        var str = value switch
        {
            ChatActivity.Active => "active",
            ChatActivity.Archived => "archived",
            _ => value.ToString(),
        };
        writer.WriteStringValue(str);
    }
}

/// <summary>Доступность чатов для пользователя</summary>
[JsonConverter(typeof(ChatAvailabilityConverter))]
public enum ChatAvailability
{
    /// <summary>Чаты, где пользователь является участником</summary>
    IsMember,
    /// <summary>Все открытые чаты компании, вне зависимости от участия в них пользователя</summary>
    Public,
}

internal class ChatAvailabilityConverter : JsonConverter<ChatAvailability>
{
    public override ChatAvailability Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        var value = reader.GetString();
        return value switch
        {
            "is_member" => ChatAvailability.IsMember,
            "public" => ChatAvailability.Public,
            _ => throw new JsonException($"Unknown ChatAvailability value: {value}"),
        };
    }

    public override void Write(Utf8JsonWriter writer, ChatAvailability value, JsonSerializerOptions options)
    {
        var str = value switch
        {
            ChatAvailability.IsMember => "is_member",
            ChatAvailability.Public => "public",
            _ => value.ToString(),
        };
        writer.WriteStringValue(str);
    }
}

/// <summary>Роль участника чата</summary>
[JsonConverter(typeof(ChatMemberRoleConverter))]
public enum ChatMemberRole
{
    /// <summary>Админ</summary>
    Admin,
    /// <summary>Редактор (доступно только для каналов)</summary>
    Editor,
    /// <summary>Участник или подписчик</summary>
    Member,
}

internal class ChatMemberRoleConverter : JsonConverter<ChatMemberRole>
{
    public override ChatMemberRole Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        var value = reader.GetString();
        return value switch
        {
            "admin" => ChatMemberRole.Admin,
            "editor" => ChatMemberRole.Editor,
            "member" => ChatMemberRole.Member,
            _ => throw new JsonException($"Unknown ChatMemberRole value: {value}"),
        };
    }

    public override void Write(Utf8JsonWriter writer, ChatMemberRole value, JsonSerializerOptions options)
    {
        var str = value switch
        {
            ChatMemberRole.Admin => "admin",
            ChatMemberRole.Editor => "editor",
            ChatMemberRole.Member => "member",
            _ => value.ToString(),
        };
        writer.WriteStringValue(str);
    }
}

/// <summary>Роль участника чата (с фильтром все)</summary>
[JsonConverter(typeof(ChatMemberRoleFilterConverter))]
public enum ChatMemberRoleFilter
{
    /// <summary>Любая роль</summary>
    All,
    /// <summary>Создатель</summary>
    Owner,
    /// <summary>Админ</summary>
    Admin,
    /// <summary>Редактор</summary>
    Editor,
    /// <summary>Участник/подписчик</summary>
    Member,
}

internal class ChatMemberRoleFilterConverter : JsonConverter<ChatMemberRoleFilter>
{
    public override ChatMemberRoleFilter Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        var value = reader.GetString();
        return value switch
        {
            "all" => ChatMemberRoleFilter.All,
            "owner" => ChatMemberRoleFilter.Owner,
            "admin" => ChatMemberRoleFilter.Admin,
            "editor" => ChatMemberRoleFilter.Editor,
            "member" => ChatMemberRoleFilter.Member,
            _ => throw new JsonException($"Unknown ChatMemberRoleFilter value: {value}"),
        };
    }

    public override void Write(Utf8JsonWriter writer, ChatMemberRoleFilter value, JsonSerializerOptions options)
    {
        var str = value switch
        {
            ChatMemberRoleFilter.All => "all",
            ChatMemberRoleFilter.Owner => "owner",
            ChatMemberRoleFilter.Admin => "admin",
            ChatMemberRoleFilter.Editor => "editor",
            ChatMemberRoleFilter.Member => "member",
            _ => value.ToString(),
        };
        writer.WriteStringValue(str);
    }
}

/// <summary>Поле сортировки чатов</summary>
[JsonConverter(typeof(ChatSortFieldConverter))]
public enum ChatSortField
{
    /// <summary>По идентификатору чата</summary>
    Id,
    /// <summary>По дате и времени создания последнего сообщения</summary>
    LastMessageAt,
}

internal class ChatSortFieldConverter : JsonConverter<ChatSortField>
{
    public override ChatSortField Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        var value = reader.GetString();
        return value switch
        {
            "id" => ChatSortField.Id,
            "last_message_at" => ChatSortField.LastMessageAt,
            _ => throw new JsonException($"Unknown ChatSortField value: {value}"),
        };
    }

    public override void Write(Utf8JsonWriter writer, ChatSortField value, JsonSerializerOptions options)
    {
        var str = value switch
        {
            ChatSortField.Id => "id",
            ChatSortField.LastMessageAt => "last_message_at",
            _ => value.ToString(),
        };
        writer.WriteStringValue(str);
    }
}

/// <summary>Тип чата</summary>
[JsonConverter(typeof(ChatSubtypeConverter))]
public enum ChatSubtype
{
    /// <summary>Канал или беседа</summary>
    Discussion,
    /// <summary>Тред</summary>
    Thread,
}

internal class ChatSubtypeConverter : JsonConverter<ChatSubtype>
{
    public override ChatSubtype Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        var value = reader.GetString();
        return value switch
        {
            "discussion" => ChatSubtype.Discussion,
            "thread" => ChatSubtype.Thread,
            _ => throw new JsonException($"Unknown ChatSubtype value: {value}"),
        };
    }

    public override void Write(Utf8JsonWriter writer, ChatSubtype value, JsonSerializerOptions options)
    {
        var str = value switch
        {
            ChatSubtype.Discussion => "discussion",
            ChatSubtype.Thread => "thread",
            _ => value.ToString(),
        };
        writer.WriteStringValue(str);
    }
}

/// <summary>Тип данных дополнительного поля</summary>
[JsonConverter(typeof(CustomPropertyDataTypeConverter))]
public readonly struct CustomPropertyDataType : IEquatable<CustomPropertyDataType>
{
    private readonly string? _value;

    public CustomPropertyDataType(string value) => _value = value ?? throw new ArgumentNullException(nameof(value));

    /// <summary>Строковое значение</summary>
    public static CustomPropertyDataType String { get; } = new("string");
    /// <summary>Числовое значение</summary>
    public static CustomPropertyDataType Number { get; } = new("number");
    /// <summary>Дата</summary>
    public static CustomPropertyDataType Date { get; } = new("date");
    /// <summary>Ссылка</summary>
    public static CustomPropertyDataType Link { get; } = new("link");

    /// <summary>Every value this SDK version lists</summary>
    public static IReadOnlyList<CustomPropertyDataType> Values { get; } = Array.AsReadOnly(new[] { String, Number, Date, Link });

    /// <summary>The value as it travels in JSON</summary>
    public string Value => _value ?? "";

    /// <summary>Whether this SDK version lists the value</summary>
    public bool IsKnown
    {
        get
        {
            foreach (var known in Values)
                if (Equals(known)) return true;
            return false;
        }
    }

    public static bool operator ==(CustomPropertyDataType left, CustomPropertyDataType right) => left.Equals(right);
    public static bool operator !=(CustomPropertyDataType left, CustomPropertyDataType right) => !left.Equals(right);
    public static implicit operator CustomPropertyDataType(string value) => new(value);
    public bool Equals(CustomPropertyDataType other) => string.Equals(Value, other.Value, StringComparison.Ordinal);
    public override bool Equals(object? obj) => obj is CustomPropertyDataType other && Equals(other);
    public override int GetHashCode() => StringComparer.Ordinal.GetHashCode(Value);
    public override string ToString() => Value;
}

internal class CustomPropertyDataTypeConverter : JsonConverter<CustomPropertyDataType>
{
    public override CustomPropertyDataType Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options) =>
        new(reader.GetString() ?? "");

    public override void Write(Utf8JsonWriter writer, CustomPropertyDataType value, JsonSerializerOptions options) =>
        writer.WriteStringValue(value.Value);
}

/// <summary>Периодичность повтора отложенного сообщения</summary>
[JsonConverter(typeof(DraftRepetitionIntervalConverter))]
public readonly struct DraftRepetitionInterval : IEquatable<DraftRepetitionInterval>
{
    private readonly string? _value;

    public DraftRepetitionInterval(string value) => _value = value ?? throw new ArgumentNullException(nameof(value));

    /// <summary>Один раз</summary>
    public static DraftRepetitionInterval Once { get; } = new("once");
    /// <summary>Каждый день</summary>
    public static DraftRepetitionInterval Daily { get; } = new("daily");
    /// <summary>Каждую неделю</summary>
    public static DraftRepetitionInterval Weekly { get; } = new("weekly");
    /// <summary>Каждый месяц</summary>
    public static DraftRepetitionInterval Monthly { get; } = new("monthly");
    /// <summary>Раз в два месяца</summary>
    public static DraftRepetitionInterval Every2Months { get; } = new("every_2_months");
    /// <summary>Раз в три месяца</summary>
    public static DraftRepetitionInterval Every3Months { get; } = new("every_3_months");
    /// <summary>Раз в четыре месяца</summary>
    public static DraftRepetitionInterval Every4Months { get; } = new("every_4_months");
    /// <summary>Раз в полгода</summary>
    public static DraftRepetitionInterval Every6Months { get; } = new("every_6_months");
    /// <summary>Раз в год</summary>
    public static DraftRepetitionInterval Yearly { get; } = new("yearly");

    /// <summary>Every value this SDK version lists</summary>
    public static IReadOnlyList<DraftRepetitionInterval> Values { get; } = Array.AsReadOnly(new[] { Once, Daily, Weekly, Monthly, Every2Months, Every3Months, Every4Months, Every6Months, Yearly });

    /// <summary>The value as it travels in JSON</summary>
    public string Value => _value ?? "";

    /// <summary>Whether this SDK version lists the value</summary>
    public bool IsKnown
    {
        get
        {
            foreach (var known in Values)
                if (Equals(known)) return true;
            return false;
        }
    }

    public static bool operator ==(DraftRepetitionInterval left, DraftRepetitionInterval right) => left.Equals(right);
    public static bool operator !=(DraftRepetitionInterval left, DraftRepetitionInterval right) => !left.Equals(right);
    public static implicit operator DraftRepetitionInterval(string value) => new(value);
    public bool Equals(DraftRepetitionInterval other) => string.Equals(Value, other.Value, StringComparison.Ordinal);
    public override bool Equals(object? obj) => obj is DraftRepetitionInterval other && Equals(other);
    public override int GetHashCode() => StringComparer.Ordinal.GetHashCode(Value);
    public override string ToString() => Value;
}

internal class DraftRepetitionIntervalConverter : JsonConverter<DraftRepetitionInterval>
{
    public override DraftRepetitionInterval Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options) =>
        new(reader.GetString() ?? "");

    public override void Write(Utf8JsonWriter writer, DraftRepetitionInterval value, JsonSerializerOptions options) =>
        writer.WriteStringValue(value.Value);
}

/// <summary>Что возвращать в списке черновиков</summary>
[JsonConverter(typeof(DraftTypeConverter))]
public enum DraftType
{
    /// <summary>Обычные черновики</summary>
    Regular,
    /// <summary>Отложенные сообщения</summary>
    Scheduled,
    /// <summary>И черновики, и отложенные сообщения</summary>
    All,
}

internal class DraftTypeConverter : JsonConverter<DraftType>
{
    public override DraftType Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        var value = reader.GetString();
        return value switch
        {
            "regular" => DraftType.Regular,
            "scheduled" => DraftType.Scheduled,
            "all" => DraftType.All,
            _ => throw new JsonException($"Unknown DraftType value: {value}"),
        };
    }

    public override void Write(Utf8JsonWriter writer, DraftType value, JsonSerializerOptions options)
    {
        var str = value switch
        {
            DraftType.Regular => "regular",
            DraftType.Scheduled => "scheduled",
            DraftType.All => "all",
            _ => value.ToString(),
        };
        writer.WriteStringValue(str);
    }
}

/// <summary>Что отдать вместо исходного файла</summary>
[JsonConverter(typeof(FileTargetConverter))]
public enum FileTarget
{
    /// <summary>Документ, переведённый в PDF</summary>
    PdfPreview,
    /// <summary>Первая страница документа картинкой</summary>
    PdfFirstPage,
    /// <summary>Уменьшенная копия изображения</summary>
    Thumb,
    /// <summary>Изображение как есть</summary>
    Image,
}

internal class FileTargetConverter : JsonConverter<FileTarget>
{
    public override FileTarget Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        var value = reader.GetString();
        return value switch
        {
            "pdf_preview" => FileTarget.PdfPreview,
            "pdf_first_page" => FileTarget.PdfFirstPage,
            "thumb" => FileTarget.Thumb,
            "image" => FileTarget.Image,
            _ => throw new JsonException($"Unknown FileTarget value: {value}"),
        };
    }

    public override void Write(Utf8JsonWriter writer, FileTarget value, JsonSerializerOptions options)
    {
        var str = value switch
        {
            FileTarget.PdfPreview => "pdf_preview",
            FileTarget.PdfFirstPage => "pdf_first_page",
            FileTarget.Thumb => "thumb",
            FileTarget.Image => "image",
            _ => value.ToString(),
        };
        writer.WriteStringValue(str);
    }
}

/// <summary>Тип файла</summary>
[JsonConverter(typeof(FileTypeConverter))]
public readonly struct FileType : IEquatable<FileType>
{
    private readonly string? _value;

    public FileType(string value) => _value = value ?? throw new ArgumentNullException(nameof(value));

    /// <summary>Обычный файл</summary>
    public static FileType File { get; } = new("file");
    /// <summary>Изображение</summary>
    public static FileType Image { get; } = new("image");
    /// <summary>Аудиофайл</summary>
    public static FileType Audio { get; } = new("audio");
    /// <summary>Голосовое сообщение</summary>
    public static FileType Voice { get; } = new("voice");
    /// <summary>Видеофайл</summary>
    public static FileType Video { get; } = new("video");

    /// <summary>Every value this SDK version lists</summary>
    public static IReadOnlyList<FileType> Values { get; } = Array.AsReadOnly(new[] { File, Image, Audio, Voice, Video });

    /// <summary>The value as it travels in JSON</summary>
    public string Value => _value ?? "";

    /// <summary>Whether this SDK version lists the value</summary>
    public bool IsKnown
    {
        get
        {
            foreach (var known in Values)
                if (Equals(known)) return true;
            return false;
        }
    }

    public static bool operator ==(FileType left, FileType right) => left.Equals(right);
    public static bool operator !=(FileType left, FileType right) => !left.Equals(right);
    public static implicit operator FileType(string value) => new(value);
    public bool Equals(FileType other) => string.Equals(Value, other.Value, StringComparison.Ordinal);
    public override bool Equals(object? obj) => obj is FileType other && Equals(other);
    public override int GetHashCode() => StringComparer.Ordinal.GetHashCode(Value);
    public override string ToString() => Value;
}

internal class FileTypeConverter : JsonConverter<FileType>
{
    public override FileType Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options) =>
        new(reader.GetString() ?? "");

    public override void Write(Utf8JsonWriter writer, FileType value, JsonSerializerOptions options) =>
        writer.WriteStringValue(value.Value);
}

/// <summary>Статус приглашения пользователя</summary>
[JsonConverter(typeof(InviteStatusConverter))]
public readonly struct InviteStatus : IEquatable<InviteStatus>
{
    private readonly string? _value;

    public InviteStatus(string value) => _value = value ?? throw new ArgumentNullException(nameof(value));

    /// <summary>Принято</summary>
    public static InviteStatus Confirmed { get; } = new("confirmed");
    /// <summary>Отправлено</summary>
    public static InviteStatus Sent { get; } = new("sent");

    /// <summary>Every value this SDK version lists</summary>
    public static IReadOnlyList<InviteStatus> Values { get; } = Array.AsReadOnly(new[] { Confirmed, Sent });

    /// <summary>The value as it travels in JSON</summary>
    public string Value => _value ?? "";

    /// <summary>Whether this SDK version lists the value</summary>
    public bool IsKnown
    {
        get
        {
            foreach (var known in Values)
                if (Equals(known)) return true;
            return false;
        }
    }

    public static bool operator ==(InviteStatus left, InviteStatus right) => left.Equals(right);
    public static bool operator !=(InviteStatus left, InviteStatus right) => !left.Equals(right);
    public static implicit operator InviteStatus(string value) => new(value);
    public bool Equals(InviteStatus other) => string.Equals(Value, other.Value, StringComparison.Ordinal);
    public override bool Equals(object? obj) => obj is InviteStatus other && Equals(other);
    public override int GetHashCode() => StringComparer.Ordinal.GetHashCode(Value);
    public override string ToString() => Value;
}

internal class InviteStatusConverter : JsonConverter<InviteStatus>
{
    public override InviteStatus Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options) =>
        new(reader.GetString() ?? "");

    public override void Write(Utf8JsonWriter writer, InviteStatus value, JsonSerializerOptions options) =>
        writer.WriteStringValue(value.Value);
}

/// <summary>Тип события webhook для участников</summary>
[JsonConverter(typeof(MemberEventTypeConverter))]
public readonly struct MemberEventType : IEquatable<MemberEventType>
{
    private readonly string? _value;

    public MemberEventType(string value) => _value = value ?? throw new ArgumentNullException(nameof(value));

    /// <summary>Добавление</summary>
    public static MemberEventType Add { get; } = new("add");
    /// <summary>Удаление</summary>
    public static MemberEventType Remove { get; } = new("remove");

    /// <summary>Every value this SDK version lists</summary>
    public static IReadOnlyList<MemberEventType> Values { get; } = Array.AsReadOnly(new[] { Add, Remove });

    /// <summary>The value as it travels in JSON</summary>
    public string Value => _value ?? "";

    /// <summary>Whether this SDK version lists the value</summary>
    public bool IsKnown
    {
        get
        {
            foreach (var known in Values)
                if (Equals(known)) return true;
            return false;
        }
    }

    public static bool operator ==(MemberEventType left, MemberEventType right) => left.Equals(right);
    public static bool operator !=(MemberEventType left, MemberEventType right) => !left.Equals(right);
    public static implicit operator MemberEventType(string value) => new(value);
    public bool Equals(MemberEventType other) => string.Equals(Value, other.Value, StringComparison.Ordinal);
    public override bool Equals(object? obj) => obj is MemberEventType other && Equals(other);
    public override int GetHashCode() => StringComparer.Ordinal.GetHashCode(Value);
    public override string ToString() => Value;
}

internal class MemberEventTypeConverter : JsonConverter<MemberEventType>
{
    public override MemberEventType Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options) =>
        new(reader.GetString() ?? "");

    public override void Write(Utf8JsonWriter writer, MemberEventType value, JsonSerializerOptions options) =>
        writer.WriteStringValue(value.Value);
}

/// <summary>Тип сущности для сообщений</summary>
[JsonConverter(typeof(MessageEntityTypeConverter))]
public readonly struct MessageEntityType : IEquatable<MessageEntityType>
{
    private readonly string? _value;

    public MessageEntityType(string value) => _value = value ?? throw new ArgumentNullException(nameof(value));

    /// <summary>Беседа или канал</summary>
    public static MessageEntityType Discussion { get; } = new("discussion");
    /// <summary>Тред</summary>
    public static MessageEntityType Thread { get; } = new("thread");
    /// <summary>Пользователь</summary>
    public static MessageEntityType User { get; } = new("user");

    /// <summary>Every value this SDK version lists</summary>
    public static IReadOnlyList<MessageEntityType> Values { get; } = Array.AsReadOnly(new[] { Discussion, Thread, User });

    /// <summary>The value as it travels in JSON</summary>
    public string Value => _value ?? "";

    /// <summary>Whether this SDK version lists the value</summary>
    public bool IsKnown
    {
        get
        {
            foreach (var known in Values)
                if (Equals(known)) return true;
            return false;
        }
    }

    public static bool operator ==(MessageEntityType left, MessageEntityType right) => left.Equals(right);
    public static bool operator !=(MessageEntityType left, MessageEntityType right) => !left.Equals(right);
    public static implicit operator MessageEntityType(string value) => new(value);
    public bool Equals(MessageEntityType other) => string.Equals(Value, other.Value, StringComparison.Ordinal);
    public override bool Equals(object? obj) => obj is MessageEntityType other && Equals(other);
    public override int GetHashCode() => StringComparer.Ordinal.GetHashCode(Value);
    public override string ToString() => Value;
}

internal class MessageEntityTypeConverter : JsonConverter<MessageEntityType>
{
    public override MessageEntityType Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options) =>
        new(reader.GetString() ?? "");

    public override void Write(Utf8JsonWriter writer, MessageEntityType value, JsonSerializerOptions options) =>
        writer.WriteStringValue(value.Value);
}

/// <summary>Сортировка результатов поиска сообщений</summary>
[JsonConverter(typeof(MessageSearchSortConverter))]
public enum MessageSearchSort
{
    /// <summary>По дате создания (хронология)</summary>
    CreatedAt,
    /// <summary>По релевантности</summary>
    Relevance,
}

internal class MessageSearchSortConverter : JsonConverter<MessageSearchSort>
{
    public override MessageSearchSort Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        var value = reader.GetString();
        return value switch
        {
            "created_at" => MessageSearchSort.CreatedAt,
            "relevance" => MessageSearchSort.Relevance,
            _ => throw new JsonException($"Unknown MessageSearchSort value: {value}"),
        };
    }

    public override void Write(Utf8JsonWriter writer, MessageSearchSort value, JsonSerializerOptions options)
    {
        var str = value switch
        {
            MessageSearchSort.CreatedAt => "created_at",
            MessageSearchSort.Relevance => "relevance",
            _ => value.ToString(),
        };
        writer.WriteStringValue(str);
    }
}

[JsonConverter(typeof(MessageSortFieldConverter))]
public enum MessageSortField
{
    /// <summary>По идентификатору сообщения</summary>
    Id,
}

internal class MessageSortFieldConverter : JsonConverter<MessageSortField>
{
    public override MessageSortField Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        var value = reader.GetString();
        return value switch
        {
            "id" => MessageSortField.Id,
            _ => throw new JsonException($"Unknown MessageSortField value: {value}"),
        };
    }

    public override void Write(Utf8JsonWriter writer, MessageSortField value, JsonSerializerOptions options)
    {
        var str = value switch
        {
            MessageSortField.Id => "id",
            _ => value.ToString(),
        };
        writer.WriteStringValue(str);
    }
}

/// <summary>Код ошибки OAuth</summary>
[JsonConverter(typeof(OAuthErrorCodeConverter))]
public readonly struct OAuthErrorCode : IEquatable<OAuthErrorCode>
{
    private readonly string? _value;

    public OAuthErrorCode(string value) => _value = value ?? throw new ArgumentNullException(nameof(value));

    /// <summary>Токен не передан, не найден, истёк или отозван</summary>
    public static OAuthErrorCode InvalidToken { get; } = new("invalid_token");
    /// <summary>У токена нет скоупа, который нужен методу</summary>
    public static OAuthErrorCode InsufficientScope { get; } = new("insufficient_scope");
    /// <summary>Скоуп у токена есть, но роль его владельца не позволяет действие</summary>
    public static OAuthErrorCode RoleForbidden { get; } = new("role_forbidden");
    /// <summary>В запросе нет обязательного параметра или он передан неверно</summary>
    public static OAuthErrorCode InvalidRequest { get; } = new("invalid_request");
    /// <summary>Неверный `client_id` или `client_secret`</summary>
    public static OAuthErrorCode InvalidClient { get; } = new("invalid_client");
    /// <summary>Код истёк, уже использован, выдан для другого `redirect_uri` или не подходит `code_verifier`</summary>
    public static OAuthErrorCode InvalidGrant { get; } = new("invalid_grant");
    /// <summary>Значение `grant_type` не поддерживается</summary>
    public static OAuthErrorCode UnsupportedGrantType { get; } = new("unsupported_grant_type");
    /// <summary>Токен выдан другому боту или клиент не подтвердил себя</summary>
    public static OAuthErrorCode UnauthorizedClient { get; } = new("unauthorized_client");

    /// <summary>Every value this SDK version lists</summary>
    public static IReadOnlyList<OAuthErrorCode> Values { get; } = Array.AsReadOnly(new[] { InvalidToken, InsufficientScope, RoleForbidden, InvalidRequest, InvalidClient, InvalidGrant, UnsupportedGrantType, UnauthorizedClient });

    /// <summary>The value as it travels in JSON</summary>
    public string Value => _value ?? "";

    /// <summary>Whether this SDK version lists the value</summary>
    public bool IsKnown
    {
        get
        {
            foreach (var known in Values)
                if (Equals(known)) return true;
            return false;
        }
    }

    public static bool operator ==(OAuthErrorCode left, OAuthErrorCode right) => left.Equals(right);
    public static bool operator !=(OAuthErrorCode left, OAuthErrorCode right) => !left.Equals(right);
    public static implicit operator OAuthErrorCode(string value) => new(value);
    public bool Equals(OAuthErrorCode other) => string.Equals(Value, other.Value, StringComparison.Ordinal);
    public override bool Equals(object? obj) => obj is OAuthErrorCode other && Equals(other);
    public override int GetHashCode() => StringComparer.Ordinal.GetHashCode(Value);
    public override string ToString() => Value;
}

internal class OAuthErrorCodeConverter : JsonConverter<OAuthErrorCode>
{
    public override OAuthErrorCode Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options) =>
        new(reader.GetString() ?? "");

    public override void Write(Utf8JsonWriter writer, OAuthErrorCode value, JsonSerializerOptions options) =>
        writer.WriteStringValue(value.Value);
}

/// <summary>Скоуп доступа OAuth токена</summary>
[JsonConverter(typeof(OAuthScopeConverter))]
public readonly struct OAuthScope : IEquatable<OAuthScope>
{
    private readonly string? _value;

    public OAuthScope(string value) => _value = value ?? throw new ArgumentNullException(nameof(value));

    /// <summary>Просмотр чатов и списка чатов</summary>
    public static OAuthScope ChatsRead { get; } = new("chats:read");
    /// <summary>Создание новых чатов</summary>
    public static OAuthScope ChatsCreate { get; } = new("chats:create");
    /// <summary>Изменение настроек чата</summary>
    public static OAuthScope ChatsUpdate { get; } = new("chats:update");
    /// <summary>Отметка чатов непрочитанными</summary>
    public static OAuthScope ChatsMarkUnread { get; } = new("chats:mark_unread");
    /// <summary>Архивация и разархивация чатов</summary>
    public static OAuthScope ChatsArchive { get; } = new("chats:archive");
    /// <summary>Выход из чатов</summary>
    public static OAuthScope ChatsLeave { get; } = new("chats:leave");
    /// <summary>Просмотр участников чата</summary>
    public static OAuthScope ChatMembersRead { get; } = new("chat_members:read");
    /// <summary>Добавление, изменение и удаление участников чата</summary>
    public static OAuthScope ChatMembersWrite { get; } = new("chat_members:write");
    /// <summary>Скачивание экспортов чата</summary>
    public static OAuthScope ChatExportsRead { get; } = new("chat_exports:read");
    /// <summary>Создание экспортов чата</summary>
    public static OAuthScope ChatExportsWrite { get; } = new("chat_exports:write");
    /// <summary>Просмотр сообщений в чатах</summary>
    public static OAuthScope MessagesRead { get; } = new("messages:read");
    /// <summary>Отправка сообщений</summary>
    public static OAuthScope MessagesCreate { get; } = new("messages:create");
    /// <summary>Редактирование сообщений</summary>
    public static OAuthScope MessagesUpdate { get; } = new("messages:update");
    /// <summary>Удаление сообщений</summary>
    public static OAuthScope MessagesDelete { get; } = new("messages:delete");
    /// <summary>Просмотр реакций на сообщения</summary>
    public static OAuthScope ReactionsRead { get; } = new("reactions:read");
    /// <summary>Добавление и удаление реакций</summary>
    public static OAuthScope ReactionsWrite { get; } = new("reactions:write");
    /// <summary>Закрепление и открепление сообщений</summary>
    public static OAuthScope PinsWrite { get; } = new("pins:write");
    /// <summary>Просмотр тредов (комментариев)</summary>
    public static OAuthScope ThreadsRead { get; } = new("threads:read");
    /// <summary>Создание тредов (комментариев)</summary>
    public static OAuthScope ThreadsCreate { get; } = new("threads:create");
    /// <summary>Unfurl (разворачивание ссылок)</summary>
    public static OAuthScope LinkPreviewsWrite { get; } = new("link_previews:write");
    /// <summary>Просмотр информации о сотрудниках и списка сотрудников</summary>
    public static OAuthScope UsersRead { get; } = new("users:read");
    /// <summary>Создание новых сотрудников</summary>
    public static OAuthScope UsersCreate { get; } = new("users:create");
    /// <summary>Редактирование данных сотрудника</summary>
    public static OAuthScope UsersUpdate { get; } = new("users:update");
    /// <summary>Удаление сотрудников</summary>
    public static OAuthScope UsersDelete { get; } = new("users:delete");
    /// <summary>Просмотр тегов</summary>
    public static OAuthScope GroupTagsRead { get; } = new("group_tags:read");
    /// <summary>Создание, редактирование и удаление тегов</summary>
    public static OAuthScope GroupTagsWrite { get; } = new("group_tags:write");
    /// <summary>Просмотр ботов</summary>
    public static OAuthScope BotsRead { get; } = new("bots:read");
    /// <summary>Управление ботами</summary>
    public static OAuthScope BotsWrite { get; } = new("bots:write");
    /// <summary>Самостоятельное управление адресом вебхука бота</summary>
    public static OAuthScope BotSelfWebhookWrite { get; } = new("bot_self:webhook:write");
    /// <summary>Самостоятельное управление настройками бота</summary>
    public static OAuthScope BotSelfWrite { get; } = new("bot_self:write");
    /// <summary>Просмотр информации о своем профиле</summary>
    public static OAuthScope ProfileRead { get; } = new("profile:read");
    /// <summary>Просмотр статуса профиля</summary>
    public static OAuthScope ProfileStatusRead { get; } = new("profile_status:read");
    /// <summary>Изменение и удаление статуса профиля</summary>
    public static OAuthScope ProfileStatusWrite { get; } = new("profile_status:write");
    /// <summary>Изменение и удаление аватара профиля</summary>
    public static OAuthScope ProfileAvatarWrite { get; } = new("profile_avatar:write");
    /// <summary>Просмотр статуса сотрудника</summary>
    public static OAuthScope UserStatusRead { get; } = new("user_status:read");
    /// <summary>Изменение и удаление статуса сотрудника</summary>
    public static OAuthScope UserStatusWrite { get; } = new("user_status:write");
    /// <summary>Изменение и удаление аватара сотрудника</summary>
    public static OAuthScope UserAvatarWrite { get; } = new("user_avatar:write");
    /// <summary>Просмотр дополнительных полей</summary>
    public static OAuthScope CustomPropertiesRead { get; } = new("custom_properties:read");
    /// <summary>Просмотр журнала аудита</summary>
    public static OAuthScope AuditEventsRead { get; } = new("audit_events:read");
    /// <summary>Просмотр списка всех чатов пространства</summary>
    public static OAuthScope CompanyChatsRead { get; } = new("company_chats:read");
    /// <summary>Просмотр списка всех ботов пространства</summary>
    public static OAuthScope CompanyBotsRead { get; } = new("company_bots:read");
    /// <summary>Просмотр задач</summary>
    public static OAuthScope TasksRead { get; } = new("tasks:read");
    /// <summary>Создание задач</summary>
    public static OAuthScope TasksCreate { get; } = new("tasks:create");
    /// <summary>Изменение задачи</summary>
    public static OAuthScope TasksUpdate { get; } = new("tasks:update");
    /// <summary>Удаление задачи</summary>
    public static OAuthScope TasksDelete { get; } = new("tasks:delete");
    /// <summary>Скачивание файлов</summary>
    public static OAuthScope FilesRead { get; } = new("files:read");
    /// <summary>Загрузка файлов</summary>
    public static OAuthScope FilesWrite { get; } = new("files:write");
    /// <summary>Получение данных для загрузки файлов</summary>
    public static OAuthScope UploadsWrite { get; } = new("uploads:write");
    /// <summary>Открытие форм (представлений)</summary>
    public static OAuthScope ViewsWrite { get; } = new("views:write");
    /// <summary>Просмотр вебхуков</summary>
    public static OAuthScope WebhooksRead { get; } = new("webhooks:read");
    /// <summary>Создание и управление вебхуками</summary>
    public static OAuthScope WebhooksWrite { get; } = new("webhooks:write");
    /// <summary>Просмотр лога вебхуков</summary>
    public static OAuthScope WebhooksEventsRead { get; } = new("webhooks:events:read");
    /// <summary>Удаление записи в логе вебхука</summary>
    public static OAuthScope WebhooksEventsDelete { get; } = new("webhooks:events:delete");
    /// <summary>Поиск сотрудников</summary>
    public static OAuthScope SearchUsers { get; } = new("search:users");
    /// <summary>Поиск чатов</summary>
    public static OAuthScope SearchChats { get; } = new("search:chats");
    /// <summary>Поиск сообщений</summary>
    public static OAuthScope SearchMessages { get; } = new("search:messages");
    /// <summary>Просмотр черновиков и отложенных сообщений</summary>
    public static OAuthScope DraftsRead { get; } = new("drafts:read");
    /// <summary>Создание, изменение и удаление черновиков и отложенных сообщений</summary>
    public static OAuthScope DraftsWrite { get; } = new("drafts:write");
    /// <summary>Просмотр важных сообщений</summary>
    public static OAuthScope ImportantMessagesRead { get; } = new("important_messages:read");
    /// <summary>Добавление сообщений в важные и удаление из важных</summary>
    public static OAuthScope ImportantMessagesWrite { get; } = new("important_messages:write");

    /// <summary>Every value this SDK version lists</summary>
    public static IReadOnlyList<OAuthScope> Values { get; } = Array.AsReadOnly(new[] { ChatsRead, ChatsCreate, ChatsUpdate, ChatsMarkUnread, ChatsArchive, ChatsLeave, ChatMembersRead, ChatMembersWrite, ChatExportsRead, ChatExportsWrite, MessagesRead, MessagesCreate, MessagesUpdate, MessagesDelete, ReactionsRead, ReactionsWrite, PinsWrite, ThreadsRead, ThreadsCreate, LinkPreviewsWrite, UsersRead, UsersCreate, UsersUpdate, UsersDelete, GroupTagsRead, GroupTagsWrite, BotsRead, BotsWrite, BotSelfWebhookWrite, BotSelfWrite, ProfileRead, ProfileStatusRead, ProfileStatusWrite, ProfileAvatarWrite, UserStatusRead, UserStatusWrite, UserAvatarWrite, CustomPropertiesRead, AuditEventsRead, CompanyChatsRead, CompanyBotsRead, TasksRead, TasksCreate, TasksUpdate, TasksDelete, FilesRead, FilesWrite, UploadsWrite, ViewsWrite, WebhooksRead, WebhooksWrite, WebhooksEventsRead, WebhooksEventsDelete, SearchUsers, SearchChats, SearchMessages, DraftsRead, DraftsWrite, ImportantMessagesRead, ImportantMessagesWrite });

    /// <summary>The value as it travels in JSON</summary>
    public string Value => _value ?? "";

    /// <summary>Whether this SDK version lists the value</summary>
    public bool IsKnown
    {
        get
        {
            foreach (var known in Values)
                if (Equals(known)) return true;
            return false;
        }
    }

    public static bool operator ==(OAuthScope left, OAuthScope right) => left.Equals(right);
    public static bool operator !=(OAuthScope left, OAuthScope right) => !left.Equals(right);
    public static implicit operator OAuthScope(string value) => new(value);
    public bool Equals(OAuthScope other) => string.Equals(Value, other.Value, StringComparison.Ordinal);
    public override bool Equals(object? obj) => obj is OAuthScope other && Equals(other);
    public override int GetHashCode() => StringComparer.Ordinal.GetHashCode(Value);
    public override string ToString() => Value;
}

internal class OAuthScopeConverter : JsonConverter<OAuthScope>
{
    public override OAuthScope Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options) =>
        new(reader.GetString() ?? "");

    public override void Write(Utf8JsonWriter writer, OAuthScope value, JsonSerializerOptions options) =>
        writer.WriteStringValue(value.Value);
}

/// <summary>Что передано в запросе на отзыв токена</summary>
[JsonConverter(typeof(OAuthTokenTypeHintConverter))]
public enum OAuthTokenTypeHint
{
    /// <summary>Токен сотрудника</summary>
    AccessToken,
    /// <summary>Токен обновления</summary>
    RefreshToken,
}

internal class OAuthTokenTypeHintConverter : JsonConverter<OAuthTokenTypeHint>
{
    public override OAuthTokenTypeHint Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        var value = reader.GetString();
        return value switch
        {
            "access_token" => OAuthTokenTypeHint.AccessToken,
            "refresh_token" => OAuthTokenTypeHint.RefreshToken,
            _ => throw new JsonException($"Unknown OAuthTokenTypeHint value: {value}"),
        };
    }

    public override void Write(Utf8JsonWriter writer, OAuthTokenTypeHint value, JsonSerializerOptions options)
    {
        var str = value switch
        {
            OAuthTokenTypeHint.AccessToken => "access_token",
            OAuthTokenTypeHint.RefreshToken => "refresh_token",
            _ => value.ToString(),
        };
        writer.WriteStringValue(str);
    }
}

/// <summary>Тип события webhook для реакций</summary>
[JsonConverter(typeof(ReactionEventTypeConverter))]
public readonly struct ReactionEventType : IEquatable<ReactionEventType>
{
    private readonly string? _value;

    public ReactionEventType(string value) => _value = value ?? throw new ArgumentNullException(nameof(value));

    /// <summary>Создание</summary>
    public static ReactionEventType New { get; } = new("new");
    /// <summary>Удаление</summary>
    public static ReactionEventType Delete { get; } = new("delete");

    /// <summary>Every value this SDK version lists</summary>
    public static IReadOnlyList<ReactionEventType> Values { get; } = Array.AsReadOnly(new[] { New, Delete });

    /// <summary>The value as it travels in JSON</summary>
    public string Value => _value ?? "";

    /// <summary>Whether this SDK version lists the value</summary>
    public bool IsKnown
    {
        get
        {
            foreach (var known in Values)
                if (Equals(known)) return true;
            return false;
        }
    }

    public static bool operator ==(ReactionEventType left, ReactionEventType right) => left.Equals(right);
    public static bool operator !=(ReactionEventType left, ReactionEventType right) => !left.Equals(right);
    public static implicit operator ReactionEventType(string value) => new(value);
    public bool Equals(ReactionEventType other) => string.Equals(Value, other.Value, StringComparison.Ordinal);
    public override bool Equals(object? obj) => obj is ReactionEventType other && Equals(other);
    public override int GetHashCode() => StringComparer.Ordinal.GetHashCode(Value);
    public override string ToString() => Value;
}

internal class ReactionEventTypeConverter : JsonConverter<ReactionEventType>
{
    public override ReactionEventType Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options) =>
        new(reader.GetString() ?? "");

    public override void Write(Utf8JsonWriter writer, ReactionEventType value, JsonSerializerOptions options) =>
        writer.WriteStringValue(value.Value);
}

/// <summary>Тип сущности для поиска</summary>
[JsonConverter(typeof(SearchEntityTypeConverter))]
public enum SearchEntityType
{
    /// <summary>Пользователь</summary>
    User,
    /// <summary>Напоминание</summary>
    Task,
}

internal class SearchEntityTypeConverter : JsonConverter<SearchEntityType>
{
    public override SearchEntityType Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        var value = reader.GetString();
        return value switch
        {
            "User" => SearchEntityType.User,
            "Task" => SearchEntityType.Task,
            _ => throw new JsonException($"Unknown SearchEntityType value: {value}"),
        };
    }

    public override void Write(Utf8JsonWriter writer, SearchEntityType value, JsonSerializerOptions options)
    {
        var str = value switch
        {
            SearchEntityType.User => "User",
            SearchEntityType.Task => "Task",
            _ => value.ToString(),
        };
        writer.WriteStringValue(str);
    }
}

/// <summary>Сортировка результатов поиска</summary>
[JsonConverter(typeof(SearchSortOrderConverter))]
public enum SearchSortOrder
{
    /// <summary>По релевантности</summary>
    ByScore,
    /// <summary>По алфавиту</summary>
    Alphabetical,
    /// <summary>По дате создания</summary>
    Creation,
}

internal class SearchSortOrderConverter : JsonConverter<SearchSortOrder>
{
    public override SearchSortOrder Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        var value = reader.GetString();
        return value switch
        {
            "by_score" => SearchSortOrder.ByScore,
            "alphabetical" => SearchSortOrder.Alphabetical,
            "creation" => SearchSortOrder.Creation,
            _ => throw new JsonException($"Unknown SearchSortOrder value: {value}"),
        };
    }

    public override void Write(Utf8JsonWriter writer, SearchSortOrder value, JsonSerializerOptions options)
    {
        var str = value switch
        {
            SearchSortOrder.ByScore => "by_score",
            SearchSortOrder.Alphabetical => "alphabetical",
            SearchSortOrder.Creation => "creation",
            _ => value.ToString(),
        };
        writer.WriteStringValue(str);
    }
}

/// <summary>Порядок сортировки</summary>
[JsonConverter(typeof(SortOrderConverter))]
public enum SortOrder
{
    /// <summary>По возрастанию</summary>
    Asc,
    /// <summary>По убыванию</summary>
    Desc,
}

internal class SortOrderConverter : JsonConverter<SortOrder>
{
    public override SortOrder Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        var value = reader.GetString();
        return value switch
        {
            "asc" => SortOrder.Asc,
            "desc" => SortOrder.Desc,
            _ => throw new JsonException($"Unknown SortOrder value: {value}"),
        };
    }

    public override void Write(Utf8JsonWriter writer, SortOrder value, JsonSerializerOptions options)
    {
        var str = value switch
        {
            SortOrder.Asc => "asc",
            SortOrder.Desc => "desc",
            _ => value.ToString(),
        };
        writer.WriteStringValue(str);
    }
}

/// <summary>Тип напоминания</summary>
[JsonConverter(typeof(TaskKindConverter))]
public readonly struct TaskKind : IEquatable<TaskKind>
{
    private readonly string? _value;

    public TaskKind(string value) => _value = value ?? throw new ArgumentNullException(nameof(value));

    /// <summary>Позвонить контакту</summary>
    public static TaskKind Call { get; } = new("call");
    /// <summary>Встреча</summary>
    public static TaskKind Meeting { get; } = new("meeting");
    /// <summary>Простое напоминание</summary>
    public static TaskKind Reminder { get; } = new("reminder");
    /// <summary>Событие</summary>
    public static TaskKind Event { get; } = new("event");
    /// <summary>Написать письмо</summary>
    public static TaskKind Email { get; } = new("email");

    /// <summary>Every value this SDK version lists</summary>
    public static IReadOnlyList<TaskKind> Values { get; } = Array.AsReadOnly(new[] { Call, Meeting, Reminder, Event, Email });

    /// <summary>The value as it travels in JSON</summary>
    public string Value => _value ?? "";

    /// <summary>Whether this SDK version lists the value</summary>
    public bool IsKnown
    {
        get
        {
            foreach (var known in Values)
                if (Equals(known)) return true;
            return false;
        }
    }

    public static bool operator ==(TaskKind left, TaskKind right) => left.Equals(right);
    public static bool operator !=(TaskKind left, TaskKind right) => !left.Equals(right);
    public static implicit operator TaskKind(string value) => new(value);
    public bool Equals(TaskKind other) => string.Equals(Value, other.Value, StringComparison.Ordinal);
    public override bool Equals(object? obj) => obj is TaskKind other && Equals(other);
    public override int GetHashCode() => StringComparer.Ordinal.GetHashCode(Value);
    public override string ToString() => Value;
}

internal class TaskKindConverter : JsonConverter<TaskKind>
{
    public override TaskKind Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options) =>
        new(reader.GetString() ?? "");

    public override void Write(Utf8JsonWriter writer, TaskKind value, JsonSerializerOptions options) =>
        writer.WriteStringValue(value.Value);
}

/// <summary>Статус напоминания</summary>
[JsonConverter(typeof(TaskStatusConverter))]
public readonly struct TaskStatus : IEquatable<TaskStatus>
{
    private readonly string? _value;

    public TaskStatus(string value) => _value = value ?? throw new ArgumentNullException(nameof(value));

    /// <summary>Выполнено</summary>
    public static TaskStatus Done { get; } = new("done");
    /// <summary>Активно</summary>
    public static TaskStatus Undone { get; } = new("undone");

    /// <summary>Every value this SDK version lists</summary>
    public static IReadOnlyList<TaskStatus> Values { get; } = Array.AsReadOnly(new[] { Done, Undone });

    /// <summary>The value as it travels in JSON</summary>
    public string Value => _value ?? "";

    /// <summary>Whether this SDK version lists the value</summary>
    public bool IsKnown
    {
        get
        {
            foreach (var known in Values)
                if (Equals(known)) return true;
            return false;
        }
    }

    public static bool operator ==(TaskStatus left, TaskStatus right) => left.Equals(right);
    public static bool operator !=(TaskStatus left, TaskStatus right) => !left.Equals(right);
    public static implicit operator TaskStatus(string value) => new(value);
    public bool Equals(TaskStatus other) => string.Equals(Value, other.Value, StringComparison.Ordinal);
    public override bool Equals(object? obj) => obj is TaskStatus other && Equals(other);
    public override int GetHashCode() => StringComparer.Ordinal.GetHashCode(Value);
    public override string ToString() => Value;
}

internal class TaskStatusConverter : JsonConverter<TaskStatus>
{
    public override TaskStatus Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options) =>
        new(reader.GetString() ?? "");

    public override void Write(Utf8JsonWriter writer, TaskStatus value, JsonSerializerOptions options) =>
        writer.WriteStringValue(value.Value);
}

/// <summary>Роль пользователя, допустимая при создании сотрудника. Для роли `guest` параметр `chat_ids` обязателен и должен содержать ровно один чат.</summary>
[JsonConverter(typeof(UserCreateRoleConverter))]
public enum UserCreateRole
{
    /// <summary>Администратор</summary>
    Admin,
    /// <summary>Сотрудник</summary>
    User,
    /// <summary>Мульти-гость</summary>
    MultiGuest,
    /// <summary>Гость</summary>
    Guest,
}

internal class UserCreateRoleConverter : JsonConverter<UserCreateRole>
{
    public override UserCreateRole Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        var value = reader.GetString();
        return value switch
        {
            "admin" => UserCreateRole.Admin,
            "user" => UserCreateRole.User,
            "multi_guest" => UserCreateRole.MultiGuest,
            "guest" => UserCreateRole.Guest,
            _ => throw new JsonException($"Unknown UserCreateRole value: {value}"),
        };
    }

    public override void Write(Utf8JsonWriter writer, UserCreateRole value, JsonSerializerOptions options)
    {
        var str = value switch
        {
            UserCreateRole.Admin => "admin",
            UserCreateRole.User => "user",
            UserCreateRole.MultiGuest => "multi_guest",
            UserCreateRole.Guest => "guest",
            _ => value.ToString(),
        };
        writer.WriteStringValue(str);
    }
}

/// <summary>Тип события webhook для пользователей</summary>
[JsonConverter(typeof(UserEventTypeConverter))]
public readonly struct UserEventType : IEquatable<UserEventType>
{
    private readonly string? _value;

    public UserEventType(string value) => _value = value ?? throw new ArgumentNullException(nameof(value));

    /// <summary>Приглашение</summary>
    public static UserEventType Invite { get; } = new("invite");
    /// <summary>Подтверждение</summary>
    public static UserEventType Confirm { get; } = new("confirm");
    /// <summary>Обновление</summary>
    public static UserEventType Update { get; } = new("update");
    /// <summary>Приостановка</summary>
    public static UserEventType Suspend { get; } = new("suspend");
    /// <summary>Активация</summary>
    public static UserEventType Activate { get; } = new("activate");
    /// <summary>Удаление</summary>
    public static UserEventType Delete { get; } = new("delete");

    /// <summary>Every value this SDK version lists</summary>
    public static IReadOnlyList<UserEventType> Values { get; } = Array.AsReadOnly(new[] { Invite, Confirm, Update, Suspend, Activate, Delete });

    /// <summary>The value as it travels in JSON</summary>
    public string Value => _value ?? "";

    /// <summary>Whether this SDK version lists the value</summary>
    public bool IsKnown
    {
        get
        {
            foreach (var known in Values)
                if (Equals(known)) return true;
            return false;
        }
    }

    public static bool operator ==(UserEventType left, UserEventType right) => left.Equals(right);
    public static bool operator !=(UserEventType left, UserEventType right) => !left.Equals(right);
    public static implicit operator UserEventType(string value) => new(value);
    public bool Equals(UserEventType other) => string.Equals(Value, other.Value, StringComparison.Ordinal);
    public override bool Equals(object? obj) => obj is UserEventType other && Equals(other);
    public override int GetHashCode() => StringComparer.Ordinal.GetHashCode(Value);
    public override string ToString() => Value;
}

internal class UserEventTypeConverter : JsonConverter<UserEventType>
{
    public override UserEventType Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options) =>
        new(reader.GetString() ?? "");

    public override void Write(Utf8JsonWriter writer, UserEventType value, JsonSerializerOptions options) =>
        writer.WriteStringValue(value.Value);
}

/// <summary>Роль пользователя в системе</summary>
[JsonConverter(typeof(UserRoleConverter))]
public readonly struct UserRole : IEquatable<UserRole>
{
    private readonly string? _value;

    public UserRole(string value) => _value = value ?? throw new ArgumentNullException(nameof(value));

    /// <summary>Администратор</summary>
    public static UserRole Admin { get; } = new("admin");
    /// <summary>Сотрудник</summary>
    public static UserRole User { get; } = new("user");
    /// <summary>Мульти-гость</summary>
    public static UserRole MultiGuest { get; } = new("multi_guest");
    /// <summary>Гость</summary>
    public static UserRole Guest { get; } = new("guest");

    /// <summary>Every value this SDK version lists</summary>
    public static IReadOnlyList<UserRole> Values { get; } = Array.AsReadOnly(new[] { Admin, User, MultiGuest, Guest });

    /// <summary>The value as it travels in JSON</summary>
    public string Value => _value ?? "";

    /// <summary>Whether this SDK version lists the value</summary>
    public bool IsKnown
    {
        get
        {
            foreach (var known in Values)
                if (Equals(known)) return true;
            return false;
        }
    }

    public static bool operator ==(UserRole left, UserRole right) => left.Equals(right);
    public static bool operator !=(UserRole left, UserRole right) => !left.Equals(right);
    public static implicit operator UserRole(string value) => new(value);
    public bool Equals(UserRole other) => string.Equals(Value, other.Value, StringComparison.Ordinal);
    public override bool Equals(object? obj) => obj is UserRole other && Equals(other);
    public override int GetHashCode() => StringComparer.Ordinal.GetHashCode(Value);
    public override string ToString() => Value;
}

internal class UserRoleConverter : JsonConverter<UserRole>
{
    public override UserRole Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options) =>
        new(reader.GetString() ?? "");

    public override void Write(Utf8JsonWriter writer, UserRole value, JsonSerializerOptions options) =>
        writer.WriteStringValue(value.Value);
}

/// <summary>Роль пользователя, допустимая при редактировании сотрудника. Роль `guest` передают вместе с `chat_ids`, в котором ровно один чат.</summary>
[JsonConverter(typeof(UserRoleInputConverter))]
public enum UserRoleInput
{
    /// <summary>Администратор</summary>
    Admin,
    /// <summary>Сотрудник</summary>
    User,
    /// <summary>Мульти-гость</summary>
    MultiGuest,
    /// <summary>Гость</summary>
    Guest,
}

internal class UserRoleInputConverter : JsonConverter<UserRoleInput>
{
    public override UserRoleInput Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        var value = reader.GetString();
        return value switch
        {
            "admin" => UserRoleInput.Admin,
            "user" => UserRoleInput.User,
            "multi_guest" => UserRoleInput.MultiGuest,
            "guest" => UserRoleInput.Guest,
            _ => throw new JsonException($"Unknown UserRoleInput value: {value}"),
        };
    }

    public override void Write(Utf8JsonWriter writer, UserRoleInput value, JsonSerializerOptions options)
    {
        var str = value switch
        {
            UserRoleInput.Admin => "admin",
            UserRoleInput.User => "user",
            UserRoleInput.MultiGuest => "multi_guest",
            UserRoleInput.Guest => "guest",
            _ => value.ToString(),
        };
        writer.WriteStringValue(str);
    }
}

/// <summary>Коды ошибок валидации</summary>
[JsonConverter(typeof(ValidationErrorCodeConverter))]
public readonly struct ValidationErrorCode : IEquatable<ValidationErrorCode>
{
    private readonly string? _value;

    public ValidationErrorCode(string value) => _value = value ?? throw new ArgumentNullException(nameof(value));

    /// <summary>Обязательное поле (не может быть пустым)</summary>
    public static ValidationErrorCode Blank { get; } = new("blank");
    /// <summary>Слишком длинное значение (пояснения вы получите в поле message)</summary>
    public static ValidationErrorCode TooLong { get; } = new("too_long");
    /// <summary>Поле не соответствует правилам (пояснения вы получите в поле message)</summary>
    public static ValidationErrorCode Invalid { get; } = new("invalid");
    /// <summary>Поле имеет непредусмотренное значение</summary>
    public static ValidationErrorCode Inclusion { get; } = new("inclusion");
    /// <summary>Поле имеет недопустимое значение</summary>
    public static ValidationErrorCode Exclusion { get; } = new("exclusion");
    /// <summary>Название для этого поля уже существует</summary>
    public static ValidationErrorCode Taken { get; } = new("taken");
    /// <summary>Emoji статуса не может содержать значения отличные от Emoji символа</summary>
    public static ValidationErrorCode WrongEmoji { get; } = new("wrong_emoji");
    /// <summary>Объект не найден</summary>
    public static ValidationErrorCode NotFound { get; } = new("not_found");
    /// <summary>Объект с такими данными уже есть. Конфликтующее поле приходит в key, если его удалось определить</summary>
    public static ValidationErrorCode AlreadyExists { get; } = new("already_exists");
    /// <summary>Ошибка личного чата (пояснения вы получите в поле message)</summary>
    public static ValidationErrorCode PersonalChat { get; } = new("personal_chat");
    /// <summary>Отображаемая ошибка (пояснения вы получите в поле message)</summary>
    public static ValidationErrorCode DisplayedError { get; } = new("displayed_error");
    /// <summary>Действие запрещено</summary>
    public static ValidationErrorCode NotAuthorized { get; } = new("not_authorized");
    /// <summary>Выбран слишком большой диапазон дат</summary>
    public static ValidationErrorCode InvalidDateRange { get; } = new("invalid_date_range");
    /// <summary>Некорректный URL вебхука</summary>
    public static ValidationErrorCode InvalidWebhookUrl { get; } = new("invalid_webhook_url");
    /// <summary>Достигнут лимит запросов</summary>
    public static ValidationErrorCode RateLimit { get; } = new("rate_limit");
    /// <summary>Превышен лимит активных сотрудников. Больше не возвращается</summary>
    public static ValidationErrorCode LicensesLimit { get; } = new("licenses_limit");
    /// <summary>Превышен лимит количества реакций, которые может добавить пользователь (20 уникальных реакций)</summary>
    public static ValidationErrorCode UserLimit { get; } = new("user_limit");
    /// <summary>Превышен лимит количества уникальных реакций, которые можно добавить на сообщение (30 уникальных реакций)</summary>
    public static ValidationErrorCode UniqueLimit { get; } = new("unique_limit");
    /// <summary>Превышен лимит количества реакций, которые можно добавить на сообщение (1000 реакций)</summary>
    public static ValidationErrorCode GeneralLimit { get; } = new("general_limit");
    /// <summary>Запрос не выполнен: сбой на сервере или значение, которое сервер не смог разобрать, а текст в message всегда общий</summary>
    public static ValidationErrorCode Unhandled { get; } = new("unhandled");
    /// <summary>Не удалось найти идентификатор события</summary>
    public static ValidationErrorCode TriggerNotFound { get; } = new("trigger_not_found");
    /// <summary>Время жизни идентификатора события истекло</summary>
    public static ValidationErrorCode TriggerExpired { get; } = new("trigger_expired");
    /// <summary>Обязательный параметр не передан</summary>
    public static ValidationErrorCode Required { get; } = new("required");
    /// <summary>Недопустимое значение (не входит в список допустимых)</summary>
    public static ValidationErrorCode In { get; } = new("in");
    /// <summary>Значение неприменимо в данном контексте (пояснения вы получите в поле message)</summary>
    public static ValidationErrorCode NotApplicable { get; } = new("not_applicable");
    /// <summary>Нельзя изменить свои собственные данные</summary>
    public static ValidationErrorCode SelfUpdate { get; } = new("self_update");
    /// <summary>Нельзя изменить данные владельца</summary>
    public static ValidationErrorCode OwnerProtected { get; } = new("owner_protected");
    /// <summary>Значение уже назначено</summary>
    public static ValidationErrorCode AlreadyAssigned { get; } = new("already_assigned");
    /// <summary>Ближайшая отправка отложенного сообщения приходится на прошлое</summary>
    public static ValidationErrorCode NextSendAtInvalid { get; } = new("next_send_at_invalid");
    /// <summary>Расписание отложенного сообщения не складывается в повтор</summary>
    public static ValidationErrorCode ScheduleInvalid { get; } = new("schedule_invalid");
    /// <summary>Расписание заканчивается раньше ближайшей отправки</summary>
    public static ValidationErrorCode ScheduleEndDateInvalid { get; } = new("schedule_end_date_invalid");
    /// <summary>Превышен лимит отложенных сообщений на чат (50)</summary>
    public static ValidationErrorCode ScheduledMessagesLimit { get; } = new("scheduled_messages_limit");
    /// <summary>Отложенное сообщение нельзя превратить обратно в черновик</summary>
    public static ValidationErrorCode DraftTypeChangeForbidden { get; } = new("draft_type_change_forbidden");
    /// <summary>Скачивание файла запрещено: нужен запрос из безопасного контура или в файле найден вирус</summary>
    public static ValidationErrorCode ConfidentialDownloadDenied { get; } = new("confidential_download_denied");
    /// <summary>Не удалось расшифровать файл</summary>
    public static ValidationErrorCode DecryptionFailed { get; } = new("decryption_failed");
    /// <summary>Правило бота «Кто может добавлять бота в чаты» не разрешает вам добавить его: `id` таких ботов приходят в `value`</summary>
    public static ValidationErrorCode BotAddDenied { get; } = new("bot_add_denied");
    /// <summary>Бот с настройкой «Ограничить одним чатом» уже состоит в другой беседе или канале: `id` таких ботов приходят в `value`</summary>
    public static ValidationErrorCode SingleChatBotOccupied { get; } = new("single_chat_bot_occupied");
    /// <summary>Бота с настройкой «Ограничить одним чатом» нельзя добавить в тег</summary>
    public static ValidationErrorCode SingleChatBotTagDenied { get; } = new("single_chat_bot_tag_denied");
    /// <summary>В тег можно добавить только бота, которого может добавить в чат любой сотрудник</summary>
    public static ValidationErrorCode RestrictedBotTagDenied { get; } = new("restricted_bot_tag_denied");
    /// <summary>Настройки бота изменились во время запроса: повторите его</summary>
    public static ValidationErrorCode BotChangedConcurrently { get; } = new("bot_changed_concurrently");
    /// <summary>Поиск не уложился по времени: сузьте запрос и повторите</summary>
    public static ValidationErrorCode Timeout { get; } = new("timeout");
    /// <summary>Бесплатное пространство исчерпало суточный лимит писем-приглашений: остаток и время сброса — в `payload`</summary>
    public static ValidationErrorCode DailyInvitesLimit { get; } = new("daily_invites_limit");
    /// <summary>Недостаточно прав для выполнения действия (пояснения вы получите в поле message)</summary>
    public static ValidationErrorCode Forbidden { get; } = new("forbidden");
    /// <summary>Доступ запрещён (недостаточно прав)</summary>
    public static ValidationErrorCode PermissionDenied { get; } = new("permission_denied");
    /// <summary>Доступ запрещён</summary>
    public static ValidationErrorCode AccessDenied { get; } = new("access_denied");
    /// <summary>Некорректные параметры запроса (пояснения вы получите в поле message)</summary>
    public static ValidationErrorCode WrongParams { get; } = new("wrong_params");
    /// <summary>Требуется оплата</summary>
    public static ValidationErrorCode PaymentRequired { get; } = new("payment_required");
    /// <summary>Значение слишком короткое (пояснения вы получите в поле message)</summary>
    public static ValidationErrorCode MinLength { get; } = new("min_length");
    /// <summary>Значение слишком длинное (пояснения вы получите в поле message)</summary>
    public static ValidationErrorCode MaxLength { get; } = new("max_length");
    /// <summary>Использовано зарезервированное системное слово (here, all)</summary>
    public static ValidationErrorCode UseOfSystemWords { get; } = new("use_of_system_words");
    /// <summary>Файл экспорта не найден или ещё не готов</summary>
    public static ValidationErrorCode ExportFileNotFound { get; } = new("export_file_not_found");
    /// <summary>Нельзя исключить владельца чата</summary>
    public static ValidationErrorCode CannotKickOwner { get; } = new("cannot_kick_owner");
    /// <summary>Не удалось закрепить сообщение</summary>
    public static ValidationErrorCode PinFailed { get; } = new("pin_failed");
    /// <summary>Сообщение удалено</summary>
    public static ValidationErrorCode MessageDeleted { get; } = new("message_deleted");
    /// <summary>Нельзя создать тред для сообщения, которое уже находится в треде</summary>
    public static ValidationErrorCode ThreadMessage { get; } = new("thread_message");
    /// <summary>Представление не найдено или принадлежит другому боту</summary>
    public static ValidationErrorCode ViewNotFound { get; } = new("view_not_found");
    /// <summary>Время на ответ об отправке формы истекло или ответ уже был принят</summary>
    public static ValidationErrorCode SubmitExpired { get; } = new("submit_expired");
    /// <summary>Сервис временно недоступен, повторите запрос</summary>
    public static ValidationErrorCode ServiceUnavailable { get; } = new("service_unavailable");

    /// <summary>Every value this SDK version lists</summary>
    public static IReadOnlyList<ValidationErrorCode> Values { get; } = Array.AsReadOnly(new[] { Blank, TooLong, Invalid, Inclusion, Exclusion, Taken, WrongEmoji, NotFound, AlreadyExists, PersonalChat, DisplayedError, NotAuthorized, InvalidDateRange, InvalidWebhookUrl, RateLimit, LicensesLimit, UserLimit, UniqueLimit, GeneralLimit, Unhandled, TriggerNotFound, TriggerExpired, Required, In, NotApplicable, SelfUpdate, OwnerProtected, AlreadyAssigned, NextSendAtInvalid, ScheduleInvalid, ScheduleEndDateInvalid, ScheduledMessagesLimit, DraftTypeChangeForbidden, ConfidentialDownloadDenied, DecryptionFailed, BotAddDenied, SingleChatBotOccupied, SingleChatBotTagDenied, RestrictedBotTagDenied, BotChangedConcurrently, Timeout, DailyInvitesLimit, Forbidden, PermissionDenied, AccessDenied, WrongParams, PaymentRequired, MinLength, MaxLength, UseOfSystemWords, ExportFileNotFound, CannotKickOwner, PinFailed, MessageDeleted, ThreadMessage, ViewNotFound, SubmitExpired, ServiceUnavailable });

    /// <summary>The value as it travels in JSON</summary>
    public string Value => _value ?? "";

    /// <summary>Whether this SDK version lists the value</summary>
    public bool IsKnown
    {
        get
        {
            foreach (var known in Values)
                if (Equals(known)) return true;
            return false;
        }
    }

    public static bool operator ==(ValidationErrorCode left, ValidationErrorCode right) => left.Equals(right);
    public static bool operator !=(ValidationErrorCode left, ValidationErrorCode right) => !left.Equals(right);
    public static implicit operator ValidationErrorCode(string value) => new(value);
    public bool Equals(ValidationErrorCode other) => string.Equals(Value, other.Value, StringComparison.Ordinal);
    public override bool Equals(object? obj) => obj is ValidationErrorCode other && Equals(other);
    public override int GetHashCode() => StringComparer.Ordinal.GetHashCode(Value);
    public override string ToString() => Value;
}

internal class ValidationErrorCodeConverter : JsonConverter<ValidationErrorCode>
{
    public override ValidationErrorCode Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options) =>
        new(reader.GetString() ?? "");

    public override void Write(Utf8JsonWriter writer, ValidationErrorCode value, JsonSerializerOptions options) =>
        writer.WriteStringValue(value.Value);
}

/// <summary>Тип события видеозвонка</summary>
[JsonConverter(typeof(VideoCallEventTypeConverter))]
public readonly struct VideoCallEventType : IEquatable<VideoCallEventType>
{
    private readonly string? _value;

    public VideoCallEventType(string value) => _value = value ?? throw new ArgumentNullException(nameof(value));

    /// <summary>Видеозвонок начался</summary>
    public static VideoCallEventType Started { get; } = new("started");
    /// <summary>Видеозвонок завершился</summary>
    public static VideoCallEventType Finished { get; } = new("finished");
    /// <summary>Запись видеозвонка готова</summary>
    public static VideoCallEventType RecordingReady { get; } = new("recording_ready");

    /// <summary>Every value this SDK version lists</summary>
    public static IReadOnlyList<VideoCallEventType> Values { get; } = Array.AsReadOnly(new[] { Started, Finished, RecordingReady });

    /// <summary>The value as it travels in JSON</summary>
    public string Value => _value ?? "";

    /// <summary>Whether this SDK version lists the value</summary>
    public bool IsKnown
    {
        get
        {
            foreach (var known in Values)
                if (Equals(known)) return true;
            return false;
        }
    }

    public static bool operator ==(VideoCallEventType left, VideoCallEventType right) => left.Equals(right);
    public static bool operator !=(VideoCallEventType left, VideoCallEventType right) => !left.Equals(right);
    public static implicit operator VideoCallEventType(string value) => new(value);
    public bool Equals(VideoCallEventType other) => string.Equals(Value, other.Value, StringComparison.Ordinal);
    public override bool Equals(object? obj) => obj is VideoCallEventType other && Equals(other);
    public override int GetHashCode() => StringComparer.Ordinal.GetHashCode(Value);
    public override string ToString() => Value;
}

internal class VideoCallEventTypeConverter : JsonConverter<VideoCallEventType>
{
    public override VideoCallEventType Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options) =>
        new(reader.GetString() ?? "");

    public override void Write(Utf8JsonWriter writer, VideoCallEventType value, JsonSerializerOptions options) =>
        writer.WriteStringValue(value.Value);
}

/// <summary>Тип события webhook</summary>
[JsonConverter(typeof(WebhookEventTypeConverter))]
public readonly struct WebhookEventType : IEquatable<WebhookEventType>
{
    private readonly string? _value;

    public WebhookEventType(string value) => _value = value ?? throw new ArgumentNullException(nameof(value));

    /// <summary>Создание</summary>
    public static WebhookEventType New { get; } = new("new");
    /// <summary>Обновление</summary>
    public static WebhookEventType Update { get; } = new("update");
    /// <summary>Удаление</summary>
    public static WebhookEventType Delete { get; } = new("delete");

    /// <summary>Every value this SDK version lists</summary>
    public static IReadOnlyList<WebhookEventType> Values { get; } = Array.AsReadOnly(new[] { New, Update, Delete });

    /// <summary>The value as it travels in JSON</summary>
    public string Value => _value ?? "";

    /// <summary>Whether this SDK version lists the value</summary>
    public bool IsKnown
    {
        get
        {
            foreach (var known in Values)
                if (Equals(known)) return true;
            return false;
        }
    }

    public static bool operator ==(WebhookEventType left, WebhookEventType right) => left.Equals(right);
    public static bool operator !=(WebhookEventType left, WebhookEventType right) => !left.Equals(right);
    public static implicit operator WebhookEventType(string value) => new(value);
    public bool Equals(WebhookEventType other) => string.Equals(Value, other.Value, StringComparison.Ordinal);
    public override bool Equals(object? obj) => obj is WebhookEventType other && Equals(other);
    public override int GetHashCode() => StringComparer.Ordinal.GetHashCode(Value);
    public override string ToString() => Value;
}

internal class WebhookEventTypeConverter : JsonConverter<WebhookEventType>
{
    public override WebhookEventType Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options) =>
        new(reader.GetString() ?? "");

    public override void Write(Utf8JsonWriter writer, WebhookEventType value, JsonSerializerOptions options) =>
        writer.WriteStringValue(value.Value);
}

[JsonConverter(typeof(AuditEventDetailsUnionConverter))]
public abstract class AuditEventDetailsUnion
{
}

// AuditEventDetailsUnion carries no discriminator field: members are tried in the order
// they match the payload keys (most recognised, then fewest unrecognised, then
// fewest declared), and the first one that decodes wins.
internal sealed class AuditEventDetailsUnionConverter : JsonConverter<AuditEventDetailsUnion>
{
    private static readonly (Type Type, HashSet<string> Keys)[] Shapes =
    {
        (typeof(AuditDetailsEmpty), new HashSet<string>()),
        (typeof(AuditDetailsUserUpdated), new HashSet<string> { "changed_attrs", "context" }),
        (typeof(AuditDetailsRoleChanged), new HashSet<string> { "new_company_role", "previous_company_role", "initiator_id" }),
        (typeof(AuditDetailsTagName), new HashSet<string> { "name" }),
        (typeof(AuditDetailsInitiator), new HashSet<string> { "initiator_id" }),
        (typeof(AuditDetailsInviter), new HashSet<string> { "inviter_id" }),
        (typeof(AuditDetailsChatRenamed), new HashSet<string> { "old_name", "new_name" }),
        (typeof(AuditDetailsChatPermission), new HashSet<string> { "public_access" }),
        (typeof(AuditDetailsTagChat), new HashSet<string> { "chat_id", "tag_name" }),
        (typeof(AuditDetailsChatId), new HashSet<string> { "chat_id" }),
        (typeof(AuditDetailsTokenScopes), new HashSet<string> { "scopes" }),
        (typeof(AuditDetailsKms), new HashSet<string> { "chat_id", "message_id", "reason" }),
        (typeof(AuditDetailsDlp), new HashSet<string> { "dlp_rule_id", "dlp_rule_name", "message_id", "chat_id", "user_id", "action_message", "conditions_matched" }),
        (typeof(AuditDetailsSearch), new HashSet<string> { "search_type", "query_present", "cursor_present", "limit", "filters" }),
        (typeof(AuditDetailsBot), new HashSet<string> { "bot_id", "actor_id", "webhook_id", "application_id", "access_token_id", "access_token_preview", "scopes", "name" }),
        (typeof(AuditDetailsBotScopes), new HashSet<string> { "bot_id", "actor_id", "added_scopes", "removed_scopes", "bot_name", "webhook_id", "previous_scopes", "new_scopes" }),
        (typeof(AuditDetailsBotWebhookSettings), new HashSet<string> { "bot_id", "actor_id", "changes", "bot_name", "webhook_id", "access_token_id", "access_token_preview", "application_id" }),
        (typeof(AuditDetailsBotOAuthClient), new HashSet<string> { "bot_id", "actor_id", "client_id", "changes", "application_id", "application_name", "bot_name", "webhook_id", "scopes", "access_token_id", "access_token_preview" }),
        (typeof(AuditDetailsOAuthAuthorizationGranted), new HashSet<string> { "client_id", "scopes", "application_id", "application_name", "bot_id", "bot_name", "authorization_grant_id" }),
        (typeof(AuditDetailsOAuthAuthorizationRevoked), new HashSet<string> { "client_id", "revoked_tokens_count", "user_id", "application_id", "application_name", "bot_id", "bot_name" }),
        (typeof(AuditDetailsDeviceAuthorizationApproved), new HashSet<string> { "client_id", "scopes", "device_name", "application_id", "application_name", "device_grant_id", "token_kind" }),
        (typeof(AuditDetailsDeviceAuthorizationDenied), new HashSet<string> { "client_id", "scopes", "device_name", "application_id", "device_grant_id", "token_kind" }),
        (typeof(AuditDetailsVideoCallStarted), new HashSet<string> { "chat_id", "started_message_id" }),
        (typeof(AuditDetailsVideoCallFinished), new HashSet<string> { "chat_id", "started_message_id", "duration", "max_members_count" }),
        (typeof(AuditDetailsVideoCallRecording), new HashSet<string> { "chat_id", "started_message_id", "recording_id", "file_id", "duration", "size" }),
        (typeof(AuditDetailsBotOAuthClientSecretRotated), new HashSet<string> { "bot_id", "actor_id", "client_id", "application_id", "application_name", "bot_name", "webhook_id", "scopes", "access_token_id", "access_token_preview" }),
        (typeof(AuditDetailsBotOAuthClientDisabled), new HashSet<string> { "bot_id", "actor_id", "client_id", "deleted_access_tokens_count", "deleted_access_grants_count", "application_id", "application_name", "bot_name", "webhook_id", "scopes", "access_token_id", "access_token_preview" }),
        (typeof(AuditDetailsToken), new HashSet<string> { "token_kind", "token_name", "resource_owner_id", "scopes", "access_token_id", "access_token_preview", "application_id", "application_name", "client_id", "bot_id", "bot_name", "device_name", "actor_id", "webhook_id", "user_id", "source", "reason" }),
        (typeof(AuditDetailsBotTokenUpdated), new HashSet<string> { "token_kind", "token_name", "resource_owner_id", "current_scopes", "bot_id", "actor_id", "access_token_id", "access_token_preview", "application_id", "application_name", "client_id", "bot_name", "webhook_id", "name", "scopes" }),
        (typeof(AuditDetailsUserLoginQr), new HashSet<string> { "method", "login_grant_id" }),
        (typeof(AuditDetailsLoginGrantCreated), new HashSet<string> { "login_grant_id" }),
        (typeof(AuditDetailsLoginGrantApproved), new HashSet<string> { "login_grant_id", "device" }),
        (typeof(AuditDetailsLoginGrantDenied), new HashSet<string> { "login_grant_id", "device", "reason" }),
    };

    public override AuditEventDetailsUnion Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        using var document = JsonDocument.ParseValue(ref reader);
        var root = document.RootElement;
        var keys = new HashSet<string>();
        if (root.ValueKind == JsonValueKind.Object)
        {
            foreach (var property in root.EnumerateObject()) keys.Add(property.Name);
        }
        // OrderBy is stable: a tie keeps the declared order.
        var ranked = Shapes
            .Select(shape => (shape.Type, Matched: keys.Count(shape.Keys.Contains), Declared: shape.Keys.Count))
            .OrderByDescending(c => c.Matched)
            .ThenBy(c => keys.Count - c.Matched)
            .ThenBy(c => c.Declared);
        var raw = root.GetRawText();
        JsonException? firstError = null;
        foreach (var candidate in ranked)
        {
            try
            {
                return (AuditEventDetailsUnion)JsonSerializer.Deserialize(raw, candidate.Type, options)!;
            }
            catch (JsonException e)
            {
                firstError ??= e;
            }
        }
        throw firstError ?? new JsonException("No AuditEventDetailsUnion member matched the payload");
    }

    public override void Write(Utf8JsonWriter writer, AuditEventDetailsUnion value, JsonSerializerOptions options)
    {
        JsonSerializer.Serialize(writer, (object)value, value.GetType(), options);
    }
}

public class AuditDetailsEmpty : AuditEventDetailsUnion
{
}

public class AuditDetailsUserUpdated : AuditEventDetailsUnion
{
    [JsonPropertyName("changed_attrs")]
    public List<string> ChangedAttrs { get; set; } = default!;
    [JsonPropertyName("context")]
    public string? Context { get; set; }
}

public class AuditDetailsRoleChanged : AuditEventDetailsUnion
{
    [JsonPropertyName("new_company_role")]
    public string NewCompanyRole { get; set; } = default!;
    [JsonPropertyName("previous_company_role")]
    public string PreviousCompanyRole { get; set; } = default!;
    [JsonPropertyName("initiator_id")]
    public int InitiatorId { get; set; } = default!;
}

public class AuditDetailsTagName : AuditEventDetailsUnion
{
    [JsonPropertyName("name")]
    public string Name { get; set; } = default!;
}

public class AuditDetailsInitiator : AuditEventDetailsUnion
{
    [JsonPropertyName("initiator_id")]
    public int InitiatorId { get; set; } = default!;
}

public class AuditDetailsInviter : AuditEventDetailsUnion
{
    [JsonPropertyName("inviter_id")]
    public int InviterId { get; set; } = default!;
}

public class AuditDetailsChatRenamed : AuditEventDetailsUnion
{
    [JsonPropertyName("old_name")]
    public string OldName { get; set; } = default!;
    [JsonPropertyName("new_name")]
    public string NewName { get; set; } = default!;
}

public class AuditDetailsChatPermission : AuditEventDetailsUnion
{
    [JsonPropertyName("public_access")]
    public bool PublicAccess { get; set; } = default!;
}

public class AuditDetailsTagChat : AuditEventDetailsUnion
{
    [JsonPropertyName("chat_id")]
    public int ChatId { get; set; } = default!;
    [JsonPropertyName("tag_name")]
    public string TagName { get; set; } = default!;
}

public class AuditDetailsChatId : AuditEventDetailsUnion
{
    [JsonPropertyName("chat_id")]
    public int ChatId { get; set; } = default!;
}

public class AuditDetailsTokenScopes : AuditEventDetailsUnion
{
    [JsonPropertyName("scopes")]
    public List<string> Scopes { get; set; } = default!;
}

public class AuditDetailsKms : AuditEventDetailsUnion
{
    [JsonPropertyName("chat_id")]
    public int ChatId { get; set; } = default!;
    [JsonPropertyName("message_id")]
    public int MessageId { get; set; } = default!;
    [JsonPropertyName("reason")]
    public string Reason { get; set; } = default!;
}

public class AuditDetailsDlp : AuditEventDetailsUnion
{
    [JsonPropertyName("dlp_rule_id")]
    public string DlpRuleId { get; set; } = default!;
    [JsonPropertyName("dlp_rule_name")]
    public string DlpRuleName { get; set; } = default!;
    [JsonPropertyName("message_id")]
    public int MessageId { get; set; } = default!;
    [JsonPropertyName("chat_id")]
    public int ChatId { get; set; } = default!;
    [JsonPropertyName("user_id")]
    public int UserId { get; set; } = default!;
    [JsonPropertyName("action_message")]
    public string? ActionMessage { get; set; }
    [JsonPropertyName("conditions_matched")]
    public bool ConditionsMatched { get; set; } = default!;
}

public class AuditDetailsSearch : AuditEventDetailsUnion
{
    [JsonPropertyName("search_type")]
    public string SearchType { get; set; } = default!;
    [JsonPropertyName("query_present")]
    public bool QueryPresent { get; set; } = default!;
    [JsonPropertyName("cursor_present")]
    public bool CursorPresent { get; set; } = default!;
    [JsonPropertyName("limit")]
    public int? Limit { get; set; }
    [JsonPropertyName("filters")]
    public Dictionary<string, object> Filters { get; set; } = default!;
}

public class AuditDetailsBot : AuditEventDetailsUnion
{
    [JsonPropertyName("bot_id")]
    public int BotId { get; set; } = default!;
    [JsonPropertyName("actor_id")]
    public int? ActorId { get; set; }
    [JsonPropertyName("webhook_id")]
    public int? WebhookId { get; set; }
    [JsonPropertyName("application_id")]
    public int? ApplicationId { get; set; }
    [JsonPropertyName("access_token_id")]
    public int? AccessTokenId { get; set; }
    [JsonPropertyName("access_token_preview")]
    public string? AccessTokenPreview { get; set; }
    [JsonPropertyName("scopes")]
    public List<string>? Scopes { get; set; }
    [JsonPropertyName("name")]
    public AuditDetailsTokenNameChange? Name { get; set; }
}

public class AuditDetailsBotScopes : AuditEventDetailsUnion
{
    [JsonPropertyName("bot_id")]
    public int BotId { get; set; } = default!;
    [JsonPropertyName("actor_id")]
    public int? ActorId { get; set; }
    [JsonPropertyName("added_scopes")]
    public List<string> AddedScopes { get; set; } = default!;
    [JsonPropertyName("removed_scopes")]
    public List<string> RemovedScopes { get; set; } = default!;
    [JsonPropertyName("bot_name")]
    public string? BotName { get; set; }
    [JsonPropertyName("webhook_id")]
    public int WebhookId { get; set; } = default!;
    [JsonPropertyName("previous_scopes")]
    public List<string> PreviousScopes { get; set; } = default!;
    [JsonPropertyName("new_scopes")]
    public List<string> NewScopes { get; set; } = default!;
}

public class AuditDetailsBotWebhookSettings : AuditEventDetailsUnion
{
    [JsonPropertyName("bot_id")]
    public int BotId { get; set; } = default!;
    [JsonPropertyName("actor_id")]
    public int? ActorId { get; set; }
    [JsonPropertyName("changes")]
    public Dictionary<string, object> Changes { get; set; } = default!;
    [JsonPropertyName("bot_name")]
    public string? BotName { get; set; }
    [JsonPropertyName("webhook_id")]
    public int? WebhookId { get; set; }
    [JsonPropertyName("access_token_id")]
    public int? AccessTokenId { get; set; }
    [JsonPropertyName("access_token_preview")]
    public string? AccessTokenPreview { get; set; }
    [JsonPropertyName("application_id")]
    public int? ApplicationId { get; set; }
}

public class AuditDetailsBotOAuthClient : AuditEventDetailsUnion
{
    [JsonPropertyName("bot_id")]
    public int BotId { get; set; } = default!;
    [JsonPropertyName("actor_id")]
    public int? ActorId { get; set; }
    [JsonPropertyName("client_id")]
    public string ClientId { get; set; } = default!;
    [JsonPropertyName("changes")]
    public Dictionary<string, object> Changes { get; set; } = default!;
    [JsonPropertyName("application_id")]
    public int? ApplicationId { get; set; }
    [JsonPropertyName("application_name")]
    public string? ApplicationName { get; set; }
    [JsonPropertyName("bot_name")]
    public string? BotName { get; set; }
    [JsonPropertyName("webhook_id")]
    public int? WebhookId { get; set; }
    [JsonPropertyName("scopes")]
    public List<string>? Scopes { get; set; }
    [JsonPropertyName("access_token_id")]
    public int? AccessTokenId { get; set; }
    [JsonPropertyName("access_token_preview")]
    public string? AccessTokenPreview { get; set; }
}

public class AuditDetailsOAuthAuthorizationGranted : AuditEventDetailsUnion
{
    [JsonPropertyName("client_id")]
    public string? ClientId { get; set; }
    [JsonPropertyName("scopes")]
    public List<string> Scopes { get; set; } = default!;
    [JsonPropertyName("application_id")]
    public int ApplicationId { get; set; } = default!;
    [JsonPropertyName("application_name")]
    public string? ApplicationName { get; set; }
    [JsonPropertyName("bot_id")]
    public int? BotId { get; set; }
    [JsonPropertyName("bot_name")]
    public string? BotName { get; set; }
    [JsonPropertyName("authorization_grant_id")]
    public int AuthorizationGrantId { get; set; } = default!;
}

public class AuditDetailsOAuthAuthorizationRevoked : AuditEventDetailsUnion
{
    [JsonPropertyName("client_id")]
    public string ClientId { get; set; } = default!;
    [JsonPropertyName("revoked_tokens_count")]
    public int RevokedTokensCount { get; set; } = default!;
    [JsonPropertyName("user_id")]
    public int? UserId { get; set; }
    [JsonPropertyName("application_id")]
    public int ApplicationId { get; set; } = default!;
    [JsonPropertyName("application_name")]
    public string? ApplicationName { get; set; }
    [JsonPropertyName("bot_id")]
    public int? BotId { get; set; }
    [JsonPropertyName("bot_name")]
    public string? BotName { get; set; }
}

public class AuditDetailsDeviceAuthorizationApproved : AuditEventDetailsUnion
{
    [JsonPropertyName("client_id")]
    public string ClientId { get; set; } = default!;
    [JsonPropertyName("scopes")]
    public List<string> Scopes { get; set; } = default!;
    [JsonPropertyName("device_name")]
    public string? DeviceName { get; set; }
    [JsonPropertyName("application_id")]
    public int ApplicationId { get; set; } = default!;
    [JsonPropertyName("application_name")]
    public string? ApplicationName { get; set; }
    [JsonPropertyName("device_grant_id")]
    public int DeviceGrantId { get; set; } = default!;
    [JsonPropertyName("token_kind")]
    public string? TokenKind { get; set; }
}

public class AuditDetailsDeviceAuthorizationDenied : AuditEventDetailsUnion
{
    [JsonPropertyName("client_id")]
    public string ClientId { get; set; } = default!;
    [JsonPropertyName("scopes")]
    public List<string> Scopes { get; set; } = default!;
    [JsonPropertyName("device_name")]
    public string? DeviceName { get; set; }
    [JsonPropertyName("application_id")]
    public int? ApplicationId { get; set; }
    [JsonPropertyName("device_grant_id")]
    public int DeviceGrantId { get; set; } = default!;
    [JsonPropertyName("token_kind")]
    public string? TokenKind { get; set; }
}

public class AuditDetailsVideoCallStarted : AuditEventDetailsUnion
{
    [JsonPropertyName("chat_id")]
    public int ChatId { get; set; } = default!;
    [JsonPropertyName("started_message_id")]
    public int? StartedMessageId { get; set; }
}

public class AuditDetailsVideoCallFinished : AuditEventDetailsUnion
{
    [JsonPropertyName("chat_id")]
    public int ChatId { get; set; } = default!;
    [JsonPropertyName("started_message_id")]
    public int? StartedMessageId { get; set; }
    [JsonPropertyName("duration")]
    public int? Duration { get; set; }
    [JsonPropertyName("max_members_count")]
    public int MaxMembersCount { get; set; } = default!;
}

public class AuditDetailsVideoCallRecording : AuditEventDetailsUnion
{
    [JsonPropertyName("chat_id")]
    public int ChatId { get; set; } = default!;
    [JsonPropertyName("started_message_id")]
    public int? StartedMessageId { get; set; }
    [JsonPropertyName("recording_id")]
    public int RecordingId { get; set; } = default!;
    [JsonPropertyName("file_id")]
    public int FileId { get; set; } = default!;
    [JsonPropertyName("duration")]
    public int Duration { get; set; } = default!;
    [JsonPropertyName("size")]
    public long Size { get; set; } = default!;
}

public class AuditDetailsBotOAuthClientSecretRotated : AuditEventDetailsUnion
{
    [JsonPropertyName("bot_id")]
    public int BotId { get; set; } = default!;
    [JsonPropertyName("actor_id")]
    public int? ActorId { get; set; }
    [JsonPropertyName("client_id")]
    public string ClientId { get; set; } = default!;
    [JsonPropertyName("application_id")]
    public int? ApplicationId { get; set; }
    [JsonPropertyName("application_name")]
    public string? ApplicationName { get; set; }
    [JsonPropertyName("bot_name")]
    public string? BotName { get; set; }
    [JsonPropertyName("webhook_id")]
    public int? WebhookId { get; set; }
    [JsonPropertyName("scopes")]
    public List<string>? Scopes { get; set; }
    [JsonPropertyName("access_token_id")]
    public int? AccessTokenId { get; set; }
    [JsonPropertyName("access_token_preview")]
    public string? AccessTokenPreview { get; set; }
}

public class AuditDetailsBotOAuthClientDisabled : AuditEventDetailsUnion
{
    [JsonPropertyName("bot_id")]
    public int BotId { get; set; } = default!;
    [JsonPropertyName("actor_id")]
    public int? ActorId { get; set; }
    [JsonPropertyName("client_id")]
    public string ClientId { get; set; } = default!;
    [JsonPropertyName("deleted_access_tokens_count")]
    public int DeletedAccessTokensCount { get; set; } = default!;
    [JsonPropertyName("deleted_access_grants_count")]
    public int DeletedAccessGrantsCount { get; set; } = default!;
    [JsonPropertyName("application_id")]
    public int? ApplicationId { get; set; }
    [JsonPropertyName("application_name")]
    public string? ApplicationName { get; set; }
    [JsonPropertyName("bot_name")]
    public string? BotName { get; set; }
    [JsonPropertyName("webhook_id")]
    public int? WebhookId { get; set; }
    [JsonPropertyName("scopes")]
    public List<string>? Scopes { get; set; }
    [JsonPropertyName("access_token_id")]
    public int? AccessTokenId { get; set; }
    [JsonPropertyName("access_token_preview")]
    public string? AccessTokenPreview { get; set; }
}

public class AuditDetailsToken : AuditEventDetailsUnion
{
    [JsonPropertyName("token_kind")]
    public string TokenKind { get; set; } = default!;
    [JsonPropertyName("token_name")]
    public string? TokenName { get; set; }
    [JsonPropertyName("resource_owner_id")]
    public int ResourceOwnerId { get; set; } = default!;
    [JsonPropertyName("scopes")]
    public List<string> Scopes { get; set; } = default!;
    [JsonPropertyName("access_token_id")]
    public int AccessTokenId { get; set; } = default!;
    [JsonPropertyName("access_token_preview")]
    public string? AccessTokenPreview { get; set; }
    [JsonPropertyName("application_id")]
    public int? ApplicationId { get; set; }
    [JsonPropertyName("application_name")]
    public string? ApplicationName { get; set; }
    [JsonPropertyName("client_id")]
    public string? ClientId { get; set; }
    [JsonPropertyName("bot_id")]
    public int? BotId { get; set; }
    [JsonPropertyName("bot_name")]
    public string? BotName { get; set; }
    [JsonPropertyName("device_name")]
    public string? DeviceName { get; set; }
    [JsonPropertyName("actor_id")]
    public int? ActorId { get; set; }
    [JsonPropertyName("webhook_id")]
    public int? WebhookId { get; set; }
    [JsonPropertyName("user_id")]
    public int? UserId { get; set; }
    [JsonPropertyName("source")]
    public string? Source { get; set; }
    [JsonPropertyName("reason")]
    public string? Reason { get; set; }
}

public class AuditDetailsBotTokenUpdated : AuditEventDetailsUnion
{
    [JsonPropertyName("token_kind")]
    public string TokenKind { get; set; } = default!;
    [JsonPropertyName("token_name")]
    public string? TokenName { get; set; }
    [JsonPropertyName("resource_owner_id")]
    public int ResourceOwnerId { get; set; } = default!;
    [JsonPropertyName("current_scopes")]
    public List<string> CurrentScopes { get; set; } = default!;
    [JsonPropertyName("bot_id")]
    public int? BotId { get; set; }
    [JsonPropertyName("actor_id")]
    public int? ActorId { get; set; }
    [JsonPropertyName("access_token_id")]
    public int AccessTokenId { get; set; } = default!;
    [JsonPropertyName("access_token_preview")]
    public string? AccessTokenPreview { get; set; }
    [JsonPropertyName("application_id")]
    public int? ApplicationId { get; set; }
    [JsonPropertyName("application_name")]
    public string? ApplicationName { get; set; }
    [JsonPropertyName("client_id")]
    public string? ClientId { get; set; }
    [JsonPropertyName("bot_name")]
    public string? BotName { get; set; }
    [JsonPropertyName("webhook_id")]
    public int WebhookId { get; set; } = default!;
    [JsonPropertyName("name")]
    public AuditDetailsTokenNameChange? Name { get; set; }
    [JsonPropertyName("scopes")]
    public AuditDetailsTokenScopesChange? Scopes { get; set; }
}

public class AuditDetailsUserLoginQr : AuditEventDetailsUnion
{
    [JsonPropertyName("method")]
    public string Method { get; set; } = default!;
    [JsonPropertyName("login_grant_id")]
    public string LoginGrantId { get; set; } = default!;
}

public class AuditDetailsLoginGrantCreated : AuditEventDetailsUnion
{
    [JsonPropertyName("login_grant_id")]
    public string LoginGrantId { get; set; } = default!;
}

public class AuditDetailsLoginGrantApproved : AuditEventDetailsUnion
{
    [JsonPropertyName("login_grant_id")]
    public string LoginGrantId { get; set; } = default!;
    [JsonPropertyName("device")]
    public AuditLoginGrantDevice Device { get; set; } = default!;
}

public class AuditDetailsLoginGrantDenied : AuditEventDetailsUnion
{
    [JsonPropertyName("login_grant_id")]
    public string LoginGrantId { get; set; } = default!;
    [JsonPropertyName("device")]
    public AuditLoginGrantDevice Device { get; set; } = default!;
    [JsonPropertyName("reason")]
    public AuditLoginGrantDenyReason Reason { get; set; } = default!;
}

[JsonPolymorphic(TypeDiscriminatorPropertyName = "type")]
[JsonDerivedType(typeof(ViewBlockHeader), "header")]
[JsonDerivedType(typeof(ViewBlockPlainText), "plain_text")]
[JsonDerivedType(typeof(ViewBlockMarkdown), "markdown")]
[JsonDerivedType(typeof(ViewBlockDivider), "divider")]
[JsonDerivedType(typeof(ViewBlockInput), "input")]
[JsonDerivedType(typeof(ViewBlockSelect), "select")]
[JsonDerivedType(typeof(ViewBlockRadio), "radio")]
[JsonDerivedType(typeof(ViewBlockCheckbox), "checkbox")]
[JsonDerivedType(typeof(ViewBlockDate), "date")]
[JsonDerivedType(typeof(ViewBlockTime), "time")]
[JsonDerivedType(typeof(ViewBlockFileInput), "file_input")]
public abstract class ViewBlockUnion
{
    [JsonPropertyName("type")]
    public abstract string Type { get; }
}

public class ViewBlockHeader : ViewBlockUnion
{
    [JsonPropertyName("type")]
    public override string Type => "header";
    [JsonPropertyName("text")]
    public string Text { get; set; } = default!;
}

public class ViewBlockPlainText : ViewBlockUnion
{
    [JsonPropertyName("type")]
    public override string Type => "plain_text";
    [JsonPropertyName("text")]
    public string Text { get; set; } = default!;
}

public class ViewBlockMarkdown : ViewBlockUnion
{
    [JsonPropertyName("type")]
    public override string Type => "markdown";
    [JsonPropertyName("text")]
    public string Text { get; set; } = default!;
}

public class ViewBlockDivider : ViewBlockUnion
{
    [JsonPropertyName("type")]
    public override string Type => "divider";
}

public class ViewBlockInput : ViewBlockUnion
{
    [JsonPropertyName("type")]
    public override string Type => "input";
    [JsonPropertyName("name")]
    public string Name { get; set; } = default!;
    [JsonPropertyName("label")]
    public string Label { get; set; } = default!;
    [JsonPropertyName("placeholder")]
    public string? Placeholder { get; set; }
    [JsonPropertyName("multiline")]
    public bool? Multiline { get; set; }
    [JsonPropertyName("initial_value")]
    public string? InitialValue { get; set; }
    [JsonPropertyName("min_length")]
    public int? MinLength { get; set; }
    [JsonPropertyName("max_length")]
    public int? MaxLength { get; set; }
    [JsonPropertyName("required")]
    public bool? Required { get; set; }
    [JsonPropertyName("hint")]
    public string? Hint { get; set; }
}

public class ViewBlockSelect : ViewBlockUnion
{
    [JsonPropertyName("type")]
    public override string Type => "select";
    [JsonPropertyName("name")]
    public string Name { get; set; } = default!;
    [JsonPropertyName("label")]
    public string Label { get; set; } = default!;
    [JsonPropertyName("options")]
    public List<ViewBlockSelectOption> Options { get; set; } = default!;
    [JsonPropertyName("required")]
    public bool? Required { get; set; }
    [JsonPropertyName("hint")]
    public string? Hint { get; set; }
}

public class ViewBlockRadio : ViewBlockUnion
{
    [JsonPropertyName("type")]
    public override string Type => "radio";
    [JsonPropertyName("name")]
    public string Name { get; set; } = default!;
    [JsonPropertyName("label")]
    public string Label { get; set; } = default!;
    [JsonPropertyName("options")]
    public List<ViewBlockSelectableOption> Options { get; set; } = default!;
    [JsonPropertyName("required")]
    public bool? Required { get; set; }
    [JsonPropertyName("hint")]
    public string? Hint { get; set; }
}

public class ViewBlockCheckbox : ViewBlockUnion
{
    [JsonPropertyName("type")]
    public override string Type => "checkbox";
    [JsonPropertyName("name")]
    public string Name { get; set; } = default!;
    [JsonPropertyName("label")]
    public string Label { get; set; } = default!;
    [JsonPropertyName("options")]
    public List<ViewBlockCheckboxOption> Options { get; set; } = default!;
    [JsonPropertyName("required")]
    public bool? Required { get; set; }
    [JsonPropertyName("hint")]
    public string? Hint { get; set; }
}

public class ViewBlockDate : ViewBlockUnion
{
    [JsonPropertyName("type")]
    public override string Type => "date";
    [JsonPropertyName("name")]
    public string Name { get; set; } = default!;
    [JsonPropertyName("label")]
    public string Label { get; set; } = default!;
    [JsonPropertyName("initial_date")]
    public string? InitialDate { get; set; }
    [JsonPropertyName("required")]
    public bool? Required { get; set; }
    [JsonPropertyName("hint")]
    public string? Hint { get; set; }
}

public class ViewBlockTime : ViewBlockUnion
{
    [JsonPropertyName("type")]
    public override string Type => "time";
    [JsonPropertyName("name")]
    public string Name { get; set; } = default!;
    [JsonPropertyName("label")]
    public string Label { get; set; } = default!;
    [JsonPropertyName("initial_time")]
    public string? InitialTime { get; set; }
    [JsonPropertyName("required")]
    public bool? Required { get; set; }
    [JsonPropertyName("hint")]
    public string? Hint { get; set; }
}

public class ViewBlockFileInput : ViewBlockUnion
{
    [JsonPropertyName("type")]
    public override string Type => "file_input";
    [JsonPropertyName("name")]
    public string Name { get; set; } = default!;
    [JsonPropertyName("label")]
    public string Label { get; set; } = default!;
    [JsonPropertyName("filetypes")]
    public List<string>? Filetypes { get; set; }
    [JsonPropertyName("max_files")]
    public int? MaxFiles { get; set; }
    [JsonPropertyName("required")]
    public bool? Required { get; set; }
    [JsonPropertyName("hint")]
    public string? Hint { get; set; }
}

[JsonConverter(typeof(WebhookPayloadUnionConverter))]
public abstract class WebhookPayloadUnion
{
    [JsonPropertyName("type")]
    public abstract string Type { get; }
}

internal sealed class WebhookPayloadUnionConverter : JsonConverter<WebhookPayloadUnion>
{
    public override WebhookPayloadUnion Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        using var document = JsonDocument.ParseValue(ref reader);
        var root = document.RootElement;
        var type = root.GetProperty("type").GetString();
        var eventValue = root.TryGetProperty("event", out var eventProperty) ? eventProperty.GetString() : null;
        var raw = root.GetRawText();
        return type switch
        {
            "message" when eventValue == "link_shared" => JsonSerializer.Deserialize<LinkSharedWebhookPayload>(raw, options)!,
            "message" => JsonSerializer.Deserialize<MessageWebhookPayload>(raw, options)!,
            "reaction" => JsonSerializer.Deserialize<ReactionWebhookPayload>(raw, options)!,
            "button" => JsonSerializer.Deserialize<ButtonWebhookPayload>(raw, options)!,
            "view" => JsonSerializer.Deserialize<ViewSubmitWebhookPayload>(raw, options)!,
            "chat_member" => JsonSerializer.Deserialize<ChatMemberWebhookPayload>(raw, options)!,
            "company_member" => JsonSerializer.Deserialize<CompanyMemberWebhookPayload>(raw, options)!,
            "video_call" => JsonSerializer.Deserialize<VideoCallWebhookPayload>(raw, options)!,
            _ => throw new JsonException($"Unknown WebhookPayloadUnion type: {type}")
        };
    }

    public override void Write(Utf8JsonWriter writer, WebhookPayloadUnion value, JsonSerializerOptions options)
    {
        JsonSerializer.Serialize(writer, (object)value, value.GetType(), options);
    }
}

public class MessageWebhookPayload : WebhookPayloadUnion
{
    [JsonPropertyName("type")]
    public override string Type => "message";
    [JsonPropertyName("id")]
    public int Id { get; set; } = default!;
    [JsonPropertyName("event")]
    public WebhookEventType @Event { get; set; } = default!;
    [JsonPropertyName("entity_type")]
    public MessageEntityType EntityType { get; set; } = default!;
    [JsonPropertyName("entity_id")]
    public int EntityId { get; set; } = default!;
    [JsonPropertyName("content")]
    public string Content { get; set; } = default!;
    [JsonPropertyName("user_id")]
    public int UserId { get; set; } = default!;
    [JsonPropertyName("created_at")]
    public DateTimeOffset CreatedAt { get; set; } = default!;
    [JsonPropertyName("changed_at")]
    public DateTimeOffset? ChangedAt { get; set; }
    [JsonPropertyName("url")]
    public string Url { get; set; } = default!;
    [JsonPropertyName("chat_id")]
    public int ChatId { get; set; } = default!;
    [JsonPropertyName("parent_message_id")]
    public int? ParentMessageId { get; set; }
    [JsonPropertyName("thread")]
    public WebhookMessageThread? Thread { get; set; }
    [JsonPropertyName("webhook_timestamp")]
    public int WebhookTimestamp { get; set; } = default!;
}

public class ReactionWebhookPayload : WebhookPayloadUnion
{
    [JsonPropertyName("type")]
    public override string Type => "reaction";
    [JsonPropertyName("event")]
    public ReactionEventType @Event { get; set; } = default!;
    [JsonPropertyName("chat_id")]
    public int? ChatId { get; set; }
    [JsonPropertyName("message_id")]
    public int MessageId { get; set; } = default!;
    [JsonPropertyName("code")]
    public string Code { get; set; } = default!;
    [JsonPropertyName("name")]
    public string Name { get; set; } = default!;
    [JsonPropertyName("user_id")]
    public int UserId { get; set; } = default!;
    [JsonPropertyName("created_at")]
    public DateTimeOffset CreatedAt { get; set; } = default!;
    [JsonPropertyName("webhook_timestamp")]
    public int WebhookTimestamp { get; set; } = default!;
}

public class ButtonWebhookPayload : WebhookPayloadUnion
{
    [JsonPropertyName("type")]
    public override string Type => "button";
    [JsonPropertyName("event")]
    public string @Event => "click";
    [JsonPropertyName("message_id")]
    public int MessageId { get; set; } = default!;
    [JsonPropertyName("trigger_id")]
    public string TriggerId { get; set; } = default!;
    [JsonPropertyName("data")]
    public string Data { get; set; } = default!;
    [JsonPropertyName("user_id")]
    public int UserId { get; set; } = default!;
    [JsonPropertyName("chat_id")]
    public int ChatId { get; set; } = default!;
    [JsonPropertyName("webhook_timestamp")]
    public int WebhookTimestamp { get; set; } = default!;
}

public class ViewSubmitWebhookPayload : WebhookPayloadUnion
{
    [JsonPropertyName("type")]
    public override string Type => "view";
    [JsonPropertyName("event")]
    public string @Event => "submit";
    [JsonPropertyName("callback_id")]
    public string? CallbackId { get; set; }
    [JsonPropertyName("private_metadata")]
    public string? PrivateMetadata { get; set; }
    [JsonPropertyName("chat_id")]
    public int? ChatId { get; set; }
    [JsonPropertyName("user_id")]
    public int UserId { get; set; } = default!;
    [JsonPropertyName("view_id")]
    public string ViewId { get; set; } = default!;
    [JsonPropertyName("submit_id")]
    public string SubmitId { get; set; } = default!;
    [JsonPropertyName("data")]
    public Dictionary<string, object> Data { get; set; } = default!;
    [JsonPropertyName("webhook_timestamp")]
    public int WebhookTimestamp { get; set; } = default!;
}

public class ChatMemberWebhookPayload : WebhookPayloadUnion
{
    [JsonPropertyName("type")]
    public override string Type => "chat_member";
    [JsonPropertyName("event")]
    public MemberEventType @Event { get; set; } = default!;
    [JsonPropertyName("chat_id")]
    public int ChatId { get; set; } = default!;
    [JsonPropertyName("thread_id")]
    public int? ThreadId { get; set; }
    [JsonPropertyName("user_ids")]
    public List<int> UserIds { get; set; } = default!;
    [JsonPropertyName("created_at")]
    public DateTimeOffset CreatedAt { get; set; } = default!;
    [JsonPropertyName("webhook_timestamp")]
    public int WebhookTimestamp { get; set; } = default!;
}

public class CompanyMemberWebhookPayload : WebhookPayloadUnion
{
    [JsonPropertyName("type")]
    public override string Type => "company_member";
    [JsonPropertyName("event")]
    public UserEventType @Event { get; set; } = default!;
    [JsonPropertyName("user_ids")]
    public List<int> UserIds { get; set; } = default!;
    [JsonPropertyName("created_at")]
    public DateTimeOffset CreatedAt { get; set; } = default!;
    [JsonPropertyName("webhook_timestamp")]
    public int WebhookTimestamp { get; set; } = default!;
}

public class LinkSharedWebhookPayload : WebhookPayloadUnion
{
    [JsonPropertyName("type")]
    public override string Type => "message";
    [JsonPropertyName("event")]
    public string @Event => "link_shared";
    [JsonPropertyName("chat_id")]
    public int ChatId { get; set; } = default!;
    [JsonPropertyName("message_id")]
    public int MessageId { get; set; } = default!;
    [JsonPropertyName("links")]
    public List<WebhookLink> Links { get; set; } = default!;
    [JsonPropertyName("user_id")]
    public int UserId { get; set; } = default!;
    [JsonPropertyName("entity_type")]
    public MessageEntityType EntityType { get; set; } = default!;
    [JsonPropertyName("entity_id")]
    public int? EntityId { get; set; }
    [JsonPropertyName("thread")]
    public WebhookMessageThread? Thread { get; set; }
    [JsonPropertyName("created_at")]
    public DateTimeOffset CreatedAt { get; set; } = default!;
    [JsonPropertyName("webhook_timestamp")]
    public int WebhookTimestamp { get; set; } = default!;
}

public class VideoCallWebhookPayload : WebhookPayloadUnion
{
    [JsonPropertyName("type")]
    public override string Type => "video_call";
    [JsonPropertyName("event")]
    public VideoCallEventType @Event { get; set; } = default!;
    [JsonPropertyName("video_room_id")]
    public int VideoRoomId { get; set; } = default!;
    [JsonPropertyName("chat_id")]
    public int ChatId { get; set; } = default!;
    [JsonPropertyName("owner_id")]
    public int OwnerId { get; set; } = default!;
    [JsonPropertyName("thread")]
    public WebhookVideoCallThread? Thread { get; set; }
    [JsonPropertyName("started_at")]
    public DateTimeOffset? StartedAt { get; set; }
    [JsonPropertyName("finished_at")]
    public DateTimeOffset? FinishedAt { get; set; }
    [JsonPropertyName("duration")]
    public int? Duration { get; set; }
    [JsonPropertyName("members")]
    public List<WebhookVideoCallMember>? Members { get; set; }
    [JsonPropertyName("recording_id")]
    public int? RecordingId { get; set; }
    [JsonPropertyName("file_id")]
    public int? FileId { get; set; }
    [JsonPropertyName("url")]
    public string? Url { get; set; }
    [JsonPropertyName("size")]
    public long? Size { get; set; }
    [JsonPropertyName("webhook_timestamp")]
    public int WebhookTimestamp { get; set; } = default!;
}

public class AccessTokenInfo
{
    [JsonPropertyName("id")]
    public long Id { get; set; } = default!;
    [JsonPropertyName("token")]
    public string Token { get; set; } = default!;
    [JsonPropertyName("name")]
    public string? Name { get; set; }
    [JsonPropertyName("user_id")]
    public long UserId { get; set; } = default!;
    [JsonPropertyName("scopes")]
    public List<OAuthScope> Scopes { get; set; } = default!;
    [JsonPropertyName("created_at")]
    public DateTimeOffset CreatedAt { get; set; } = default!;
    [JsonPropertyName("revoked_at")]
    public DateTimeOffset? RevokedAt { get; set; }
    [JsonPropertyName("expires_in")]
    public int? ExpiresIn { get; set; }
    [JsonPropertyName("last_used_at")]
    public DateTimeOffset? LastUsedAt { get; set; }
    [JsonPropertyName("authorized_at")]
    public DateTimeOffset? AuthorizedAt { get; set; }
}

public class AddMembersRequest
{
    [JsonPropertyName("member_ids")]
    public List<int> MemberIds { get; set; } = default!;
    [JsonPropertyName("silent")]
    public bool? Silent { get; set; }
}

public class AddTagsRequest
{
    [JsonPropertyName("group_tag_ids")]
    public List<int> GroupTagIds { get; set; } = default!;
}

public class ApiError : Exception
{
    [JsonPropertyName("errors")]
    public List<ApiErrorItem> Errors { get; set; } = default!;

    /// <summary>HTTP status code of the answer, set by the client. An empty body or one that is not JSON leaves Errors empty.</summary>
    [JsonIgnore]
    public int? StatusCode { get; set; }

    public override string Message => Errors is not { Count: > 0 }
        ? StatusCode is { } status ? $"HTTP {status}" : "api error"
        : Errors.Count == 1 ? Errors[0].Message
        : $"Errors: {string.Join("; ", Errors.Select(t => t.Message))}";
}

public class ApiErrorItem
{
    [JsonPropertyName("key")]
    public string Key { get; set; } = default!;
    [JsonPropertyName("value")]
    public object? Value { get; set; }
    [JsonPropertyName("message")]
    public string Message { get; set; } = default!;
    [JsonPropertyName("code")]
    public ValidationErrorCode Code { get; set; } = default!;
    [JsonPropertyName("payload")]
    public Dictionary<string, object>? Payload { get; set; }
}

public class AuditDetailsTokenNameChange
{
    [JsonPropertyName("previous")]
    public string? Previous { get; set; }
    [JsonPropertyName("new")]
    public string? @New { get; set; }
}

public class AuditDetailsTokenScopesChange
{
    [JsonPropertyName("previous")]
    public List<string> Previous { get; set; } = default!;
    [JsonPropertyName("new")]
    public List<string> @New { get; set; } = default!;
}

public class AuditEvent
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = default!;
    [JsonPropertyName("created_at")]
    public DateTimeOffset CreatedAt { get; set; } = default!;
    [JsonPropertyName("event_key")]
    public AuditEventKey EventKey { get; set; } = default!;
    [JsonPropertyName("entity_id")]
    public string EntityId { get; set; } = default!;
    [JsonPropertyName("entity_type")]
    public string EntityType { get; set; } = default!;
    [JsonPropertyName("actor_id")]
    public string ActorId { get; set; } = default!;
    [JsonPropertyName("actor_type")]
    public string ActorType { get; set; } = default!;
    [JsonPropertyName("details")]
    public AuditEventDetailsUnion Details { get; set; } = default!;
    [JsonPropertyName("ip_address")]
    public string? IpAddress { get; set; }
    [JsonPropertyName("user_agent")]
    public string? UserAgent { get; set; }
}

public class AuditLoginGrantDevice
{
    [JsonPropertyName("name")]
    public string Name { get; set; } = default!;
    [JsonPropertyName("platform")]
    public AuditLoginGrantDevicePlatform Platform { get; set; } = default!;
    [JsonPropertyName("os_version")]
    public string? OsVersion { get; set; }
    [JsonPropertyName("app_version")]
    public string? AppVersion { get; set; }
}

public class AvatarData
{
    [JsonPropertyName("image_url")]
    public string ImageUrl { get; set; } = default!;
}

public class BotAccessToken
{
    [JsonPropertyName("id")]
    public long Id { get; set; } = default!;
    [JsonPropertyName("token")]
    public string Token { get; set; } = default!;
    [JsonPropertyName("name")]
    public string? Name { get; set; }
    [JsonPropertyName("user_id")]
    public long UserId { get; set; } = default!;
    [JsonPropertyName("scopes")]
    public List<string> Scopes { get; set; } = default!;
    [JsonPropertyName("created_at")]
    public DateTimeOffset CreatedAt { get; set; } = default!;
    [JsonPropertyName("revoked_at")]
    public DateTimeOffset? RevokedAt { get; set; }
    [JsonPropertyName("expires_in")]
    public int? ExpiresIn { get; set; }
    [JsonPropertyName("last_used_at")]
    public DateTimeOffset? LastUsedAt { get; set; }
    [JsonPropertyName("authorized_at")]
    public DateTimeOffset? AuthorizedAt { get; set; }
}

public class BotCreateRequestWebhook
{
    [JsonPropertyName("name")]
    public string Name { get; set; } = default!;
    [JsonPropertyName("nickname")]
    public string? Nickname { get; set; }
    [JsonPropertyName("outgoing_url")]
    public string? OutgoingUrl { get; set; }
    [JsonPropertyName("events")]
    public List<BotEventName>? Events { get; set; }
    [JsonPropertyName("trigger_on")]
    public BotTriggerOn? TriggerOn { get; set; }
    [JsonPropertyName("commands")]
    public List<string>? Commands { get; set; }
    [JsonPropertyName("scopes")]
    public List<string>? Scopes { get; set; }
    [JsonPropertyName("template")]
    public string? Template { get; set; }
    [JsonPropertyName("template_engine")]
    public BotTemplateEngine? TemplateEngine { get; set; }
    [JsonPropertyName("challenge_key")]
    public string? ChallengeKey { get; set; }
    [JsonPropertyName("link_preview_enabled")]
    public bool? LinkPreviewEnabled { get; set; }
    [JsonPropertyName("ignore_self_messages")]
    public bool? IgnoreSelfMessages { get; set; }
    [JsonPropertyName("events_history_enabled")]
    public bool? EventsHistoryEnabled { get; set; }
    [JsonPropertyName("who_can_add")]
    public BotWhoCanAdd? WhoCanAdd { get; set; }
    [JsonPropertyName("can_edit")]
    public List<BotCanEdit>? CanEdit { get; set; }
    [JsonPropertyName("single_chat")]
    public bool? SingleChat { get; set; }
    [JsonPropertyName("kind")]
    public BotWebhookKind? Kind { get; set; }
    [JsonPropertyName("unfurl_domains")]
    public List<string>? UnfurlDomains { get; set; }
}

public class BotCreateRequest
{
    [JsonPropertyName("empty")]
    public bool? Empty { get; set; }
    [JsonPropertyName("webhook")]
    public BotCreateRequestWebhook Webhook { get; set; } = default!;
    [JsonPropertyName("oauth_client")]
    public BotOAuthClientRequest? OauthClient { get; set; }
    [JsonPropertyName("promo")]
    public BotPromoRequest? Promo { get; set; }
}

public class BotCreateResponse
{
    [JsonPropertyName("id")]
    public int Id { get; set; } = default!;
    [JsonPropertyName("name")]
    public string Name { get; set; } = default!;
    [JsonPropertyName("nickname")]
    public string Nickname { get; set; } = default!;
    [JsonPropertyName("avatar_url")]
    public string? AvatarUrl { get; set; }
    [JsonPropertyName("creator_id")]
    public int? CreatorId { get; set; }
    [JsonPropertyName("created_at")]
    public DateTimeOffset CreatedAt { get; set; } = default!;
    [JsonPropertyName("authorized_users_count")]
    public int AuthorizedUsersCount { get; set; } = default!;
    [JsonPropertyName("last_used_at")]
    public DateTimeOffset? LastUsedAt { get; set; }
    [JsonPropertyName("webhook")]
    public BotWebhook Webhook { get; set; } = default!;
    [JsonPropertyName("oauth_client_enabled")]
    public bool OauthClientEnabled { get; set; } = default!;
    [JsonPropertyName("oauth_client")]
    public BotOAuthClient? OauthClient { get; set; }
    [JsonPropertyName("promo")]
    public BotPromo? Promo { get; set; }
    [JsonPropertyName("permissions")]
    public BotPermissions Permissions { get; set; } = default!;
    [JsonPropertyName("client_secret")]
    public string? ClientSecret { get; set; }
    [JsonPropertyName("access_token")]
    public string? AccessToken { get; set; }
}

public class BotOAuthClient
{
    [JsonPropertyName("client_id")]
    public string ClientId { get; set; } = default!;
    [JsonPropertyName("client_secret_preview")]
    public string ClientSecretPreview { get; set; } = default!;
    [JsonPropertyName("confidential")]
    public bool Confidential { get; set; } = default!;
    [JsonPropertyName("redirect_uris")]
    public List<string> RedirectUris { get; set; } = default!;
    [JsonPropertyName("scopes")]
    public List<string> Scopes { get; set; } = default!;
}

public class BotOAuthClientRequest
{
    [JsonPropertyName("confidential")]
    public bool? Confidential { get; set; }
    [JsonPropertyName("redirect_uris")]
    public List<string>? RedirectUris { get; set; }
    [JsonPropertyName("scopes")]
    public List<string>? Scopes { get; set; }
}

public class BotPermissions
{
    [JsonPropertyName("update_oauth_client")]
    public bool UpdateOauthClient { get; set; } = default!;
    [JsonPropertyName("recreate_token")]
    public bool RecreateToken { get; set; } = default!;
    [JsonPropertyName("destroy")]
    public bool Destroy { get; set; } = default!;
}

public class BotPromo
{
    [JsonPropertyName("description")]
    public string? Description { get; set; }
    [JsonPropertyName("published")]
    public bool Published { get; set; } = default!;
    [JsonPropertyName("promo_images")]
    public List<BotPromoImage> PromoImages { get; set; } = default!;
}

public class BotPromoImage
{
    [JsonPropertyName("key")]
    public string Key { get; set; } = default!;
    [JsonPropertyName("url")]
    public string Url { get; set; } = default!;
}

public class BotPromoRequest
{
    [JsonPropertyName("description")]
    public string? Description { get; set; }
    [JsonPropertyName("published")]
    public bool? Published { get; set; }
    [JsonPropertyName("promo_images")]
    public List<string>? PromoImages { get; set; }
}

public class BotResponse
{
    [JsonPropertyName("id")]
    public int Id { get; set; } = default!;
    [JsonPropertyName("name")]
    public string Name { get; set; } = default!;
    [JsonPropertyName("nickname")]
    public string Nickname { get; set; } = default!;
    [JsonPropertyName("avatar_url")]
    public string? AvatarUrl { get; set; }
    [JsonPropertyName("creator_id")]
    public int? CreatorId { get; set; }
    [JsonPropertyName("created_at")]
    public DateTimeOffset CreatedAt { get; set; } = default!;
    [JsonPropertyName("authorized_users_count")]
    public int AuthorizedUsersCount { get; set; } = default!;
    [JsonPropertyName("last_used_at")]
    public DateTimeOffset? LastUsedAt { get; set; }
    [JsonPropertyName("webhook")]
    public BotWebhook Webhook { get; set; } = default!;
    [JsonPropertyName("oauth_client_enabled")]
    public bool OauthClientEnabled { get; set; } = default!;
    [JsonPropertyName("oauth_client")]
    public BotOAuthClient? OauthClient { get; set; }
    [JsonPropertyName("promo")]
    public BotPromo? Promo { get; set; }
    [JsonPropertyName("permissions")]
    public BotPermissions Permissions { get; set; } = default!;
    [JsonPropertyName("client_secret")]
    public string? ClientSecret { get; set; }
}

public class BotScopeCatalog
{
    [JsonPropertyName("scopes")]
    public List<BotScopeCatalogItem> Scopes { get; set; } = default!;
    [JsonPropertyName("groups")]
    public List<BotScopeCatalogGroup> Groups { get; set; } = default!;
    [JsonPropertyName("presets")]
    public List<BotScopeCatalogPreset> Presets { get; set; } = default!;
}

public class BotScopeCatalogGroup
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = default!;
    [JsonPropertyName("title")]
    public string Title { get; set; } = default!;
    [JsonPropertyName("description")]
    public string Description { get; set; } = default!;
}

public class BotScopeCatalogItem
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = default!;
    [JsonPropertyName("title")]
    public string Title { get; set; } = default!;
    [JsonPropertyName("group")]
    public string Group { get; set; } = default!;
    [JsonPropertyName("preset")]
    public List<string> Preset { get; set; } = default!;
}

public class BotScopeCatalogPreset
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = default!;
    [JsonPropertyName("title")]
    public string Title { get; set; } = default!;
}

public class BotSelfResponse
{
    [JsonPropertyName("id")]
    public int Id { get; set; } = default!;
    [JsonPropertyName("oauth_client")]
    public BotOAuthClient? OauthClient { get; set; }
    [JsonPropertyName("webhook")]
    public BotSelfWebhook Webhook { get; set; } = default!;
}

public class BotSelfTokenResponse
{
    [JsonPropertyName("id")]
    public int Id { get; set; } = default!;
    [JsonPropertyName("oauth_client")]
    public BotOAuthClient? OauthClient { get; set; }
    [JsonPropertyName("webhook")]
    public BotSelfWebhook Webhook { get; set; } = default!;
    [JsonPropertyName("access_token")]
    public string AccessToken { get; set; } = default!;
}

public class BotSelfWebhook
{
    [JsonPropertyName("name")]
    public string Name { get; set; } = default!;
    [JsonPropertyName("nickname")]
    public string Nickname { get; set; } = default!;
    [JsonPropertyName("outgoing_url")]
    public string? OutgoingUrl { get; set; }
    [JsonPropertyName("events")]
    public List<BotEventName> Events { get; set; } = default!;
    [JsonPropertyName("trigger_on")]
    public BotTriggerOn TriggerOn { get; set; } = default!;
    [JsonPropertyName("commands")]
    public List<string> Commands { get; set; } = default!;
    [JsonPropertyName("scopes")]
    public List<string> Scopes { get; set; } = default!;
    [JsonPropertyName("template")]
    public string? Template { get; set; }
    [JsonPropertyName("template_engine")]
    public BotTemplateEngine TemplateEngine { get; set; } = default!;
    [JsonPropertyName("challenge_key")]
    public string? ChallengeKey { get; set; }
    [JsonPropertyName("link_preview_enabled")]
    public bool LinkPreviewEnabled { get; set; } = default!;
    [JsonPropertyName("ignore_self_messages")]
    public bool IgnoreSelfMessages { get; set; } = default!;
    [JsonPropertyName("events_history_enabled")]
    public bool EventsHistoryEnabled { get; set; } = default!;
    [JsonPropertyName("single_chat")]
    public bool SingleChat { get; set; } = default!;
    [JsonPropertyName("can_edit")]
    public List<BotCanEdit> CanEdit { get; set; } = default!;
    [JsonPropertyName("who_can_add")]
    public BotWhoCanAdd WhoCanAdd { get; set; } = default!;
}

public class BotTokenCreateRequest
{
    [JsonPropertyName("name")]
    public string Name { get; set; } = default!;
    [JsonPropertyName("scopes")]
    public List<string>? Scopes { get; set; }
}

public class BotTokenUpdateRequest
{
    [JsonPropertyName("name")]
    public string? Name { get; set; }
    [JsonPropertyName("scopes")]
    public List<string>? Scopes { get; set; }
}

public class BotUpdateRequestWebhook : INullFields
{
    [JsonPropertyName("name")]
    public string? Name { get; set; }
    [JsonPropertyName("nickname")]
    public string? Nickname { get; set; }
    [JsonPropertyName("outgoing_url")]
    public string? OutgoingUrl { get; set; }
    [JsonPropertyName("events")]
    public List<BotEventName>? Events { get; set; }
    [JsonPropertyName("trigger_on")]
    public BotTriggerOn? TriggerOn { get; set; }
    [JsonPropertyName("commands")]
    public List<string>? Commands { get; set; }
    [JsonPropertyName("scopes")]
    public List<string>? Scopes { get; set; }
    [JsonPropertyName("template")]
    public string? Template { get; set; }
    [JsonPropertyName("template_engine")]
    public BotTemplateEngine? TemplateEngine { get; set; }
    [JsonPropertyName("challenge_key")]
    public string? ChallengeKey { get; set; }
    [JsonPropertyName("link_preview_enabled")]
    public bool? LinkPreviewEnabled { get; set; }
    [JsonPropertyName("ignore_self_messages")]
    public bool? IgnoreSelfMessages { get; set; }
    [JsonPropertyName("events_history_enabled")]
    public bool? EventsHistoryEnabled { get; set; }
    [JsonPropertyName("who_can_add")]
    public BotWhoCanAdd? WhoCanAdd { get; set; }
    [JsonPropertyName("can_edit")]
    public List<BotCanEdit>? CanEdit { get; set; }
    [JsonPropertyName("single_chat")]
    public bool? SingleChat { get; set; }
    [JsonPropertyName("kind")]
    public BotWebhookKind? Kind { get; set; }
    [JsonPropertyName("unfurl_domains")]
    public List<string>? UnfurlDomains { get; set; }

    /// <summary>Properties to send as null: Kind. An unset property stays out of the body.</summary>
    [JsonIgnore]
    public List<string>? NullFields { get; set; }
}

public class BotUpdateRequest : INullFields
{
    [JsonPropertyName("webhook")]
    public BotUpdateRequestWebhook? Webhook { get; set; }
    [JsonPropertyName("oauth_client")]
    public BotOAuthClientRequest? OauthClient { get; set; }
    [JsonPropertyName("promo")]
    public BotPromoRequest? Promo { get; set; }

    /// <summary>Properties to send as null: OauthClient. An unset property stays out of the body.</summary>
    [JsonIgnore]
    public List<string>? NullFields { get; set; }
}

public class BotWebhook
{
    [JsonPropertyName("name")]
    public string Name { get; set; } = default!;
    [JsonPropertyName("nickname")]
    public string Nickname { get; set; } = default!;
    [JsonPropertyName("outgoing_url")]
    public string? OutgoingUrl { get; set; }
    [JsonPropertyName("events")]
    public List<BotEventName> Events { get; set; } = default!;
    [JsonPropertyName("trigger_on")]
    public BotTriggerOn TriggerOn { get; set; } = default!;
    [JsonPropertyName("commands")]
    public List<string> Commands { get; set; } = default!;
    [JsonPropertyName("scopes")]
    public List<string> Scopes { get; set; } = default!;
    [JsonPropertyName("template")]
    public string? Template { get; set; }
    [JsonPropertyName("template_engine")]
    public BotTemplateEngine TemplateEngine { get; set; } = default!;
    [JsonPropertyName("challenge_key")]
    public string? ChallengeKey { get; set; }
    [JsonPropertyName("link_preview_enabled")]
    public bool LinkPreviewEnabled { get; set; } = default!;
    [JsonPropertyName("ignore_self_messages")]
    public bool IgnoreSelfMessages { get; set; } = default!;
    [JsonPropertyName("events_history_enabled")]
    public bool EventsHistoryEnabled { get; set; } = default!;
    [JsonPropertyName("single_chat")]
    public bool SingleChat { get; set; } = default!;
    [JsonPropertyName("can_edit")]
    public List<BotCanEdit> CanEdit { get; set; } = default!;
    [JsonPropertyName("who_can_add")]
    public BotWhoCanAdd WhoCanAdd { get; set; } = default!;
    [JsonPropertyName("kind")]
    public BotWebhookKind? Kind { get; set; }
    [JsonPropertyName("unfurl_domains")]
    public List<string> UnfurlDomains { get; set; } = default!;
    [JsonPropertyName("last_request_at")]
    public DateTimeOffset? LastRequestAt { get; set; }
    [JsonPropertyName("url")]
    public string? Url { get; set; }
    [JsonPropertyName("secret_token")]
    public string? SecretToken { get; set; }
    [JsonPropertyName("last_request_body")]
    public string? LastRequestBody { get; set; }
}

public class BotWebhookSelfUpdateRequestWebhook
{
    [JsonPropertyName("outgoing_url")]
    public string OutgoingUrl { get; set; } = default!;
}

public class BotWebhookSelfUpdateRequest
{
    [JsonPropertyName("webhook")]
    public BotWebhookSelfUpdateRequestWebhook Webhook { get; set; } = default!;
}

public class Button
{
    [JsonPropertyName("text")]
    public string Text { get; set; } = default!;
    [JsonPropertyName("url")]
    public string? Url { get; set; }
    [JsonPropertyName("data")]
    public string? Data { get; set; }
}

public class Chat
{
    [JsonPropertyName("id")]
    public int Id { get; set; } = default!;
    [JsonPropertyName("name")]
    public string Name { get; set; } = default!;
    [JsonPropertyName("created_at")]
    public DateTimeOffset CreatedAt { get; set; } = default!;
    [JsonPropertyName("owner_id")]
    public int OwnerId { get; set; } = default!;
    [JsonPropertyName("member_ids")]
    public List<int> MemberIds { get; set; } = default!;
    [JsonPropertyName("group_tag_ids")]
    public List<int> GroupTagIds { get; set; } = default!;
    [JsonPropertyName("channel")]
    public bool Channel { get; set; } = default!;
    [JsonPropertyName("archived")]
    public bool Archived { get; set; } = default!;
    [JsonPropertyName("personal")]
    public bool Personal { get; set; } = default!;
    [JsonPropertyName("public")]
    public bool @Public { get; set; } = default!;
    [JsonPropertyName("last_message_at")]
    public DateTimeOffset LastMessageAt { get; set; } = default!;
    [JsonPropertyName("meet_room_url")]
    public string MeetRoomUrl { get; set; } = default!;
    [JsonPropertyName("avatar_url")]
    public string? AvatarUrl { get; set; }
}

public class ChatCreateRequestChat
{
    [JsonPropertyName("name")]
    public string Name { get; set; } = default!;
    [JsonPropertyName("member_ids")]
    public List<int>? MemberIds { get; set; }
    [JsonPropertyName("group_tag_ids")]
    public List<int>? GroupTagIds { get; set; }
    [JsonPropertyName("channel")]
    public bool? Channel { get; set; }
    [JsonPropertyName("public")]
    public bool? @Public { get; set; }
}

public class ChatCreateRequest
{
    [JsonPropertyName("chat")]
    public ChatCreateRequestChat Chat { get; set; } = default!;
}

public class ChatExport
{
    [JsonPropertyName("id")]
    public int Id { get; set; } = default!;
}

public class ChatUpdateRequestChat
{
    [JsonPropertyName("name")]
    public string? Name { get; set; }
    [JsonPropertyName("public")]
    public bool? @Public { get; set; }
}

public class ChatUpdateRequest
{
    [JsonPropertyName("chat")]
    public ChatUpdateRequestChat Chat { get; set; } = default!;
}

public class CompanyBotResponse
{
    [JsonPropertyName("id")]
    public int Id { get; set; } = default!;
    [JsonPropertyName("oauth_client")]
    public BotOAuthClient? OauthClient { get; set; }
    [JsonPropertyName("webhook")]
    public CompanyBotWebhook Webhook { get; set; } = default!;
}

public class CompanyBotWebhook
{
    [JsonPropertyName("name")]
    public string Name { get; set; } = default!;
    [JsonPropertyName("nickname")]
    public string Nickname { get; set; } = default!;
    [JsonPropertyName("outgoing_url")]
    public string? OutgoingUrl { get; set; }
    [JsonPropertyName("events")]
    public List<BotEventName>? Events { get; set; }
    [JsonPropertyName("trigger_on")]
    public BotTriggerOn? TriggerOn { get; set; }
    [JsonPropertyName("commands")]
    public List<string>? Commands { get; set; }
    [JsonPropertyName("scopes")]
    public List<string>? Scopes { get; set; }
    [JsonPropertyName("template")]
    public string? Template { get; set; }
    [JsonPropertyName("template_engine")]
    public BotTemplateEngine? TemplateEngine { get; set; }
    [JsonPropertyName("challenge_key")]
    public string? ChallengeKey { get; set; }
    [JsonPropertyName("link_preview_enabled")]
    public bool? LinkPreviewEnabled { get; set; }
    [JsonPropertyName("ignore_self_messages")]
    public bool? IgnoreSelfMessages { get; set; }
    [JsonPropertyName("events_history_enabled")]
    public bool? EventsHistoryEnabled { get; set; }
    [JsonPropertyName("single_chat")]
    public bool? SingleChat { get; set; }
    [JsonPropertyName("can_edit")]
    public List<BotCanEdit>? CanEdit { get; set; }
    [JsonPropertyName("who_can_add")]
    public BotWhoCanAdd? WhoCanAdd { get; set; }
}

public class CustomProperty
{
    [JsonPropertyName("id")]
    public int Id { get; set; } = default!;
    [JsonPropertyName("name")]
    public string Name { get; set; } = default!;
    [JsonPropertyName("data_type")]
    public CustomPropertyDataType DataType { get; set; } = default!;
    [JsonPropertyName("value")]
    public string? Value { get; set; }
}

public class CustomPropertyDefinition
{
    [JsonPropertyName("id")]
    public int Id { get; set; } = default!;
    [JsonPropertyName("name")]
    public string Name { get; set; } = default!;
    [JsonPropertyName("data_type")]
    public CustomPropertyDataType DataType { get; set; } = default!;
}

public class Draft
{
    [JsonPropertyName("id")]
    public int Id { get; set; } = default!;
    [JsonPropertyName("entity_type")]
    public MessageEntityType? EntityType { get; set; }
    [JsonPropertyName("entity_id")]
    public int? EntityId { get; set; }
    [JsonPropertyName("chat_id")]
    public int? ChatId { get; set; }
    [JsonPropertyName("content")]
    public string Content { get; set; } = default!;
    [JsonPropertyName("parent_message_id")]
    public int? ParentMessageId { get; set; }
    [JsonPropertyName("files")]
    public List<File> Files { get; set; } = default!;
    [JsonPropertyName("voice_content")]
    public VoiceContent? VoiceContent { get; set; }
    [JsonPropertyName("schedule")]
    public DraftSchedule? Schedule { get; set; }
    [JsonPropertyName("next_send_at")]
    public DateTimeOffset? NextSendAt { get; set; }
    [JsonPropertyName("created_at")]
    public DateTimeOffset CreatedAt { get; set; } = default!;
    [JsonPropertyName("updated_at")]
    public DateTimeOffset UpdatedAt { get; set; } = default!;
}

public class DraftCreateRequestDraft : INullFields
{
    [JsonPropertyName("entity_type")]
    public MessageEntityType EntityType { get; set; } = default!;
    [JsonPropertyName("entity_id")]
    public int EntityId { get; set; } = default!;
    [JsonPropertyName("content")]
    public string? Content { get; set; }
    [JsonPropertyName("parent_message_id")]
    public int? ParentMessageId { get; set; }
    [JsonPropertyName("files")]
    public List<DraftFileRequest>? Files { get; set; }
    [JsonPropertyName("schedule")]
    public DraftScheduleRequest? Schedule { get; set; }

    /// <summary>Properties to send as null: ParentMessageId, Schedule. An unset property stays out of the body.</summary>
    [JsonIgnore]
    public List<string>? NullFields { get; set; }
}

public class DraftCreateRequest
{
    [JsonPropertyName("draft")]
    public DraftCreateRequestDraft Draft { get; set; } = default!;
}

public class DraftFileRequest
{
    [JsonPropertyName("id")]
    public int? Id { get; set; }
    [JsonPropertyName("key")]
    public string Key { get; set; } = default!;
    [JsonPropertyName("name")]
    public string Name { get; set; } = default!;
    [JsonPropertyName("file_type")]
    public FileType? FileType { get; set; }
    [JsonPropertyName("size")]
    public long? Size { get; set; }
    [JsonPropertyName("width")]
    public int? Width { get; set; }
    [JsonPropertyName("height")]
    public int? Height { get; set; }
    [JsonPropertyName("duration_ms")]
    public int? DurationMs { get; set; }
    [JsonPropertyName("waveform")]
    public string? Waveform { get; set; }
}

public class DraftRepetition
{
    [JsonPropertyName("interval")]
    public DraftRepetitionInterval Interval { get; set; } = default!;
    [JsonPropertyName("days")]
    public List<int>? Days { get; set; }
    [JsonPropertyName("nth_day")]
    public int? NthDay { get; set; }
}

public class DraftRepetitionRequest : INullFields
{
    [JsonPropertyName("interval")]
    public DraftRepetitionInterval Interval { get; set; } = default!;
    [JsonPropertyName("days")]
    public List<int>? Days { get; set; }
    [JsonPropertyName("nth_day")]
    public int? NthDay { get; set; }

    /// <summary>Properties to send as null: NthDay. An unset property stays out of the body.</summary>
    [JsonIgnore]
    public List<string>? NullFields { get; set; }
}

public class DraftSchedule
{
    [JsonPropertyName("start_date")]
    public DateTimeOffset StartDate { get; set; } = default!;
    [JsonPropertyName("end_date")]
    public DateTimeOffset? EndDate { get; set; }
    [JsonPropertyName("repetition")]
    public DraftRepetition Repetition { get; set; } = default!;
}

public class DraftScheduleRequest : INullFields
{
    [JsonPropertyName("start_date")]
    public DateTimeOffset StartDate { get; set; } = default!;
    [JsonPropertyName("end_date")]
    public DateTimeOffset? EndDate { get; set; }
    [JsonPropertyName("repetition")]
    public DraftRepetitionRequest Repetition { get; set; } = default!;

    /// <summary>Properties to send as null: EndDate. An unset property stays out of the body.</summary>
    [JsonIgnore]
    public List<string>? NullFields { get; set; }
}

public class DraftUpdateRequestDraft : INullFields
{
    [JsonPropertyName("content")]
    public string? Content { get; set; }
    [JsonPropertyName("parent_message_id")]
    public int? ParentMessageId { get; set; }
    [JsonPropertyName("files")]
    public List<DraftFileRequest>? Files { get; set; }
    [JsonPropertyName("schedule")]
    public DraftScheduleRequest? Schedule { get; set; }

    /// <summary>Properties to send as null: ParentMessageId, Schedule. An unset property stays out of the body.</summary>
    [JsonIgnore]
    public List<string>? NullFields { get; set; }
}

public class DraftUpdateRequest
{
    [JsonPropertyName("draft")]
    public DraftUpdateRequestDraft Draft { get; set; } = default!;
}

public class ExportRequest
{
    [JsonPropertyName("start_at")]
    public string StartAt { get; set; } = default!;
    [JsonPropertyName("end_at")]
    public string EndAt { get; set; } = default!;
    [JsonPropertyName("webhook_url")]
    public string? WebhookUrl { get; set; }
    [JsonPropertyName("chat_ids")]
    public List<int>? ChatIds { get; set; }
    [JsonPropertyName("skip_chats_file")]
    public bool? SkipChatsFile { get; set; }
}

public class ExportWebhookPayload
{
    [JsonPropertyName("type")]
    public string Type { get; set; } = default!;
    [JsonPropertyName("event")]
    public string @Event { get; set; } = default!;
    [JsonPropertyName("export_id")]
    public int ExportId { get; set; } = default!;
    [JsonPropertyName("created_at")]
    public DateTimeOffset CreatedAt { get; set; } = default!;
}

public class File
{
    [JsonPropertyName("id")]
    public int Id { get; set; } = default!;
    [JsonPropertyName("key")]
    public string Key { get; set; } = default!;
    [JsonPropertyName("name")]
    public string Name { get; set; } = default!;
    [JsonPropertyName("file_type")]
    public FileType FileType { get; set; } = default!;
    [JsonPropertyName("url")]
    public string Url { get; set; } = default!;
    [JsonPropertyName("width")]
    public int? Width { get; set; }
    [JsonPropertyName("height")]
    public int? Height { get; set; }
    [JsonPropertyName("duration_ms")]
    public int? DurationMs { get; set; }
}

public class FileUploadRequest
{
    [JsonPropertyName("Content-Disposition")]
    public string ContentDisposition { get; set; } = default!;
    [JsonPropertyName("acl")]
    public string? Acl { get; set; }
    [JsonPropertyName("policy")]
    public string Policy { get; set; } = default!;
    [JsonPropertyName("x-amz-credential")]
    public string XAmzCredential { get; set; } = default!;
    [JsonPropertyName("x-amz-algorithm")]
    public string XAmzAlgorithm { get; set; } = default!;
    [JsonPropertyName("x-amz-date")]
    public string XAmzDate { get; set; } = default!;
    [JsonPropertyName("x-amz-signature")]
    public string XAmzSignature { get; set; } = default!;
    [JsonPropertyName("key")]
    public string Key { get; set; } = default!;
    [JsonPropertyName("bucket")]
    public string? Bucket { get; set; }
    [JsonIgnore]
    public byte[] File { get; set; } = Array.Empty<byte>();
}

public class Forwarding
{
    [JsonPropertyName("original_message_id")]
    public int OriginalMessageId { get; set; } = default!;
    [JsonPropertyName("original_chat_id")]
    public int OriginalChatId { get; set; } = default!;
    [JsonPropertyName("author_id")]
    public int AuthorId { get; set; } = default!;
    [JsonPropertyName("original_created_at")]
    public DateTimeOffset OriginalCreatedAt { get; set; } = default!;
    [JsonPropertyName("original_thread_id")]
    public int? OriginalThreadId { get; set; }
    [JsonPropertyName("original_thread_message_id")]
    public int? OriginalThreadMessageId { get; set; }
    [JsonPropertyName("original_thread_parent_chat_id")]
    public int? OriginalThreadParentChatId { get; set; }
}

public class GroupTag
{
    [JsonPropertyName("id")]
    public int Id { get; set; } = default!;
    [JsonPropertyName("name")]
    public string Name { get; set; } = default!;
    [JsonPropertyName("users_count")]
    public int UsersCount { get; set; } = default!;
}

public class GroupTagRequestGroupTag
{
    [JsonPropertyName("name")]
    public string Name { get; set; } = default!;
}

public class GroupTagRequest
{
    [JsonPropertyName("group_tag")]
    public GroupTagRequestGroupTag GroupTag { get; set; } = default!;
}

public class ImportantMessageRequest
{
    [JsonPropertyName("message_id")]
    public int MessageId { get; set; } = default!;
}

public class LinkPreviewImage
{
    [JsonPropertyName("key")]
    public string Key { get; set; } = default!;
    [JsonPropertyName("name")]
    public string Name { get; set; } = default!;
    [JsonPropertyName("size")]
    public int? Size { get; set; }
}

public class LinkPreview
{
    [JsonPropertyName("title")]
    public string Title { get; set; } = default!;
    [JsonPropertyName("description")]
    public string Description { get; set; } = default!;
    [JsonPropertyName("image_url")]
    public string? ImageUrl { get; set; }
    [JsonPropertyName("image")]
    public LinkPreviewImage? Image { get; set; }
}

public class LinkPreviewsRequest
{
    [JsonPropertyName("link_previews")]
    public Dictionary<string, LinkPreview> LinkPreviews { get; set; } = default!;
}

public class MarkChatUnreadRequest
{
    [JsonPropertyName("message_id")]
    public int? MessageId { get; set; }
}

public class MessageThread
{
    [JsonPropertyName("id")]
    public long Id { get; set; } = default!;
    [JsonPropertyName("chat_id")]
    public long ChatId { get; set; } = default!;
}

public class Message
{
    [JsonPropertyName("id")]
    public int Id { get; set; } = default!;
    [JsonPropertyName("entity_type")]
    public MessageEntityType EntityType { get; set; } = default!;
    [JsonPropertyName("entity_id")]
    public int EntityId { get; set; } = default!;
    [JsonPropertyName("chat_id")]
    public int ChatId { get; set; } = default!;
    [JsonPropertyName("root_chat_id")]
    public int RootChatId { get; set; } = default!;
    [JsonPropertyName("content")]
    public string Content { get; set; } = default!;
    [JsonPropertyName("user_id")]
    public int UserId { get; set; } = default!;
    [JsonPropertyName("created_at")]
    public DateTimeOffset CreatedAt { get; set; } = default!;
    [JsonPropertyName("url")]
    public string Url { get; set; } = default!;
    [JsonPropertyName("files")]
    public List<File> Files { get; set; } = default!;
    [JsonPropertyName("voice_content")]
    public VoiceContent? VoiceContent { get; set; }
    [JsonPropertyName("buttons")]
    public List<List<Button>>? Buttons { get; set; }
    [JsonPropertyName("thread")]
    public MessageThread? Thread { get; set; }
    [JsonPropertyName("forwarding")]
    public Forwarding? Forwarding { get; set; }
    [JsonPropertyName("parent_message_id")]
    public int? ParentMessageId { get; set; }
    [JsonPropertyName("display_avatar_url")]
    public string? DisplayAvatarUrl { get; set; }
    [JsonPropertyName("display_name")]
    public string? DisplayName { get; set; }
    [JsonPropertyName("changed_at")]
    public DateTimeOffset? ChangedAt { get; set; }
    [JsonPropertyName("deleted_at")]
    public DateTimeOffset? DeletedAt { get; set; }
    [JsonPropertyName("important")]
    public bool Important { get; set; } = default!;
}

public class MessageCreateRequestFile
{
    [JsonPropertyName("key")]
    public string Key { get; set; } = default!;
    [JsonPropertyName("name")]
    public string Name { get; set; } = default!;
    [JsonPropertyName("file_type")]
    public FileType FileType { get; set; } = default!;
    [JsonPropertyName("size")]
    public long? Size { get; set; }
    [JsonPropertyName("width")]
    public int? Width { get; set; }
    [JsonPropertyName("height")]
    public int? Height { get; set; }
    [JsonPropertyName("duration_ms")]
    public int? DurationMs { get; set; }
    [JsonPropertyName("waveform")]
    public string? Waveform { get; set; }
}

public class MessageCreateRequestMessage
{
    [JsonPropertyName("entity_type")]
    public MessageEntityType? EntityType { get; set; }
    [JsonPropertyName("entity_id")]
    public int EntityId { get; set; } = default!;
    [JsonPropertyName("content")]
    public string? Content { get; set; }
    [JsonPropertyName("files")]
    public List<MessageCreateRequestFile>? Files { get; set; }
    [JsonPropertyName("buttons")]
    public List<List<Button>>? Buttons { get; set; }
    [JsonPropertyName("parent_message_id")]
    public int? ParentMessageId { get; set; }
    [JsonPropertyName("display_avatar_url")]
    public string? DisplayAvatarUrl { get; set; }
    [JsonPropertyName("display_name")]
    public string? DisplayName { get; set; }
    [JsonPropertyName("skip_invite_mentions")]
    public bool? SkipInviteMentions { get; set; }
}

public class MessageCreateRequest
{
    [JsonPropertyName("message")]
    public MessageCreateRequestMessage Message { get; set; } = default!;
    [JsonPropertyName("link_preview")]
    public bool? LinkPreview { get; set; }
}

public class MessageUpdateRequestFile
{
    [JsonPropertyName("key")]
    public string Key { get; set; } = default!;
    [JsonPropertyName("name")]
    public string Name { get; set; } = default!;
    [JsonPropertyName("file_type")]
    public FileType? FileType { get; set; }
    [JsonPropertyName("size")]
    public long? Size { get; set; }
    [JsonPropertyName("width")]
    public int? Width { get; set; }
    [JsonPropertyName("height")]
    public int? Height { get; set; }
    [JsonPropertyName("duration_ms")]
    public int? DurationMs { get; set; }
    [JsonPropertyName("waveform")]
    public string? Waveform { get; set; }
}

public class MessageUpdateRequestMessage
{
    [JsonPropertyName("content")]
    public string? Content { get; set; }
    [JsonPropertyName("files")]
    public List<MessageUpdateRequestFile>? Files { get; set; }
    [JsonPropertyName("buttons")]
    public List<List<Button>>? Buttons { get; set; }
    [JsonPropertyName("display_avatar_url")]
    public string? DisplayAvatarUrl { get; set; }
    [JsonPropertyName("display_name")]
    public string? DisplayName { get; set; }
}

public class MessageUpdateRequest
{
    [JsonPropertyName("message")]
    public MessageUpdateRequestMessage Message { get; set; } = default!;
}

public class OAuthError : Exception
{
    [JsonPropertyName("error")]
    public OAuthErrorCode Error { get; set; } = default!;
    [JsonPropertyName("error_description")]
    public string ErrorDescription { get; set; } = default!;

    public override string Message => string.IsNullOrEmpty(Error.Value) ? "oauth error" : Error.Value;
}

public class OAuthRevokeRequest
{
    [JsonPropertyName("token")]
    public string Token { get; set; } = default!;
    [JsonPropertyName("token_type_hint")]
    public OAuthTokenTypeHint? TokenTypeHint { get; set; }
    [JsonPropertyName("client_id")]
    public string? ClientId { get; set; }
    [JsonPropertyName("client_secret")]
    public string? ClientSecret { get; set; }
}

public class OAuthToken
{
    [JsonPropertyName("access_token")]
    public string AccessToken { get; set; } = default!;
    [JsonPropertyName("token_type")]
    public string TokenType { get; set; } = default!;
    [JsonPropertyName("refresh_token")]
    public string RefreshToken { get; set; } = default!;
    [JsonPropertyName("scope")]
    public string Scope { get; set; } = default!;
    [JsonPropertyName("created_at")]
    public long CreatedAt { get; set; } = default!;
}

public class OAuthTokenRequest
{
    [JsonPropertyName("grant_type")]
    public string GrantType { get; set; } = default!;
    [JsonPropertyName("code")]
    public string Code { get; set; } = default!;
    [JsonPropertyName("redirect_uri")]
    public string RedirectUri { get; set; } = default!;
    [JsonPropertyName("client_id")]
    public string? ClientId { get; set; }
    [JsonPropertyName("client_secret")]
    public string? ClientSecret { get; set; }
    [JsonPropertyName("code_verifier")]
    public string? CodeVerifier { get; set; }
}

public class OpenViewRequestView
{
    [JsonPropertyName("title")]
    public string Title { get; set; } = default!;
    [JsonPropertyName("close_text")]
    public string? CloseText { get; set; }
    [JsonPropertyName("submit_text")]
    public string? SubmitText { get; set; }
    [JsonPropertyName("blocks")]
    public List<ViewBlockUnion> Blocks { get; set; } = default!;
}

public class OpenViewRequest
{
    [JsonPropertyName("type")]
    public string Type { get; set; } = default!;
    [JsonPropertyName("trigger_id")]
    public string TriggerId { get; set; } = default!;
    [JsonPropertyName("private_metadata")]
    public string? PrivateMetadata { get; set; }
    [JsonPropertyName("callback_id")]
    public string? CallbackId { get; set; }
    [JsonPropertyName("view")]
    public OpenViewRequestView View { get; set; } = default!;
}

public class OpenViewResult
{
    [JsonPropertyName("success")]
    public bool Success { get; set; } = default!;
}

public class PaginationMetaPaginate
{
    [JsonPropertyName("next_page")]
    public string NextPage { get; set; } = default!;
    [JsonPropertyName("prev_page")]
    public string? PrevPage { get; set; }
    [JsonPropertyName("has_next")]
    public bool? HasNext { get; set; }
    [JsonPropertyName("has_prev")]
    public bool? HasPrev { get; set; }
}

public class PaginationMeta
{
    [JsonPropertyName("paginate")]
    public PaginationMetaPaginate Paginate { get; set; } = default!;
}

public class Reaction
{
    [JsonPropertyName("user_id")]
    public int UserId { get; set; } = default!;
    [JsonPropertyName("created_at")]
    public DateTimeOffset CreatedAt { get; set; } = default!;
    [JsonPropertyName("code")]
    public string Code { get; set; } = default!;
    [JsonPropertyName("name")]
    public string Name { get; set; } = default!;
}

public class ReactionRequest
{
    [JsonPropertyName("code")]
    public string Code { get; set; } = default!;
    [JsonPropertyName("name")]
    public string? Name { get; set; }
}

public class SearchPaginationMetaPaginate
{
    [JsonPropertyName("next_page")]
    public string NextPage { get; set; } = default!;
}

public class SearchPaginationMeta
{
    [JsonPropertyName("total")]
    public int Total { get; set; } = default!;
    [JsonPropertyName("paginate")]
    public SearchPaginationMetaPaginate Paginate { get; set; } = default!;
}

public class StatusUpdateRequestStatus
{
    [JsonPropertyName("emoji")]
    public string? Emoji { get; set; }
    [JsonPropertyName("title")]
    public string? Title { get; set; }
    [JsonPropertyName("expires_at")]
    public DateTimeOffset? ExpiresAt { get; set; }
    [JsonPropertyName("is_away")]
    public bool? IsAway { get; set; }
    [JsonPropertyName("away_message")]
    public string? AwayMessage { get; set; }
}

public class StatusUpdateRequest
{
    [JsonPropertyName("status")]
    public StatusUpdateRequestStatus Status { get; set; } = default!;
}

public class SubmitViewResponseRequest
{
    [JsonPropertyName("submit_id")]
    public string SubmitId { get; set; } = default!;
    [JsonPropertyName("errors")]
    public Dictionary<string, string>? Errors { get; set; }
}

public class SubmitViewResponseResult
{
    [JsonPropertyName("success")]
    public bool Success { get; set; } = default!;
}

public class Task
{
    [JsonPropertyName("id")]
    public int Id { get; set; } = default!;
    [JsonPropertyName("kind")]
    public TaskKind Kind { get; set; } = default!;
    [JsonPropertyName("content")]
    public string Content { get; set; } = default!;
    [JsonPropertyName("due_at")]
    public DateTimeOffset? DueAt { get; set; }
    [JsonPropertyName("priority")]
    public int Priority { get; set; } = default!;
    [JsonPropertyName("user_id")]
    public int UserId { get; set; } = default!;
    [JsonPropertyName("chat_id")]
    public int? ChatId { get; set; }
    [JsonPropertyName("status")]
    public TaskStatus Status { get; set; } = default!;
    [JsonPropertyName("created_at")]
    public DateTimeOffset CreatedAt { get; set; } = default!;
    [JsonPropertyName("performer_ids")]
    public List<int> PerformerIds { get; set; } = default!;
    [JsonPropertyName("all_day")]
    public bool AllDay { get; set; } = default!;
    [JsonPropertyName("custom_properties")]
    public List<CustomProperty> CustomProperties { get; set; } = default!;
}

public class TaskCreateRequestCustomProperty
{
    [JsonPropertyName("id")]
    public int Id { get; set; } = default!;
    [JsonPropertyName("value")]
    public string Value { get; set; } = default!;
}

public class TaskCreateRequestTask
{
    [JsonPropertyName("kind")]
    public TaskKind Kind { get; set; } = default!;
    [JsonPropertyName("content")]
    public string? Content { get; set; }
    [JsonPropertyName("due_at")]
    public DateTimeOffset? DueAt { get; set; }
    [JsonPropertyName("priority")]
    public int? Priority { get; set; }
    [JsonPropertyName("performer_ids")]
    public List<int>? PerformerIds { get; set; }
    [JsonPropertyName("chat_id")]
    public int? ChatId { get; set; }
    [JsonPropertyName("all_day")]
    public bool? AllDay { get; set; }
    [JsonPropertyName("custom_properties")]
    public List<TaskCreateRequestCustomProperty>? CustomProperties { get; set; }
}

public class TaskCreateRequest
{
    [JsonPropertyName("task")]
    public TaskCreateRequestTask Task { get; set; } = default!;
}

public class TaskUpdateRequestCustomProperty
{
    [JsonPropertyName("id")]
    public int Id { get; set; } = default!;
    [JsonPropertyName("value")]
    public string Value { get; set; } = default!;
}

public class TaskUpdateRequestTask
{
    [JsonPropertyName("kind")]
    public TaskKind? Kind { get; set; }
    [JsonPropertyName("content")]
    public string? Content { get; set; }
    [JsonPropertyName("due_at")]
    public DateTimeOffset? DueAt { get; set; }
    [JsonPropertyName("priority")]
    public int? Priority { get; set; }
    [JsonPropertyName("performer_ids")]
    public List<int>? PerformerIds { get; set; }
    [JsonPropertyName("status")]
    public TaskStatus? Status { get; set; }
    [JsonPropertyName("all_day")]
    public bool? AllDay { get; set; }
    [JsonPropertyName("done_at")]
    public DateTimeOffset? DoneAt { get; set; }
    [JsonPropertyName("custom_properties")]
    public List<TaskUpdateRequestCustomProperty>? CustomProperties { get; set; }
}

public class TaskUpdateRequest
{
    [JsonPropertyName("task")]
    public TaskUpdateRequestTask Task { get; set; } = default!;
}

public class Thread
{
    [JsonPropertyName("id")]
    public long Id { get; set; } = default!;
    [JsonPropertyName("chat_id")]
    public long ChatId { get; set; } = default!;
    [JsonPropertyName("message_id")]
    public long? MessageId { get; set; }
    [JsonPropertyName("message_chat_id")]
    public long? MessageChatId { get; set; }
    [JsonPropertyName("updated_at")]
    public DateTimeOffset UpdatedAt { get; set; } = default!;
}

public class UpdateMemberRoleRequest
{
    [JsonPropertyName("role")]
    public ChatMemberRole Role { get; set; } = default!;
}

public class UploadParams
{
    [JsonPropertyName("Content-Disposition")]
    public string ContentDisposition { get; set; } = default!;
    [JsonPropertyName("acl")]
    public string? Acl { get; set; }
    [JsonPropertyName("policy")]
    public string Policy { get; set; } = default!;
    [JsonPropertyName("x-amz-credential")]
    public string XAmzCredential { get; set; } = default!;
    [JsonPropertyName("x-amz-algorithm")]
    public string XAmzAlgorithm { get; set; } = default!;
    [JsonPropertyName("x-amz-date")]
    public string XAmzDate { get; set; } = default!;
    [JsonPropertyName("x-amz-signature")]
    public string XAmzSignature { get; set; } = default!;
    [JsonPropertyName("key")]
    public string Key { get; set; } = default!;
    [JsonPropertyName("bucket")]
    public string? Bucket { get; set; }
    [JsonPropertyName("direct_url")]
    public string DirectUrl { get; set; } = default!;
}

public class User
{
    [JsonPropertyName("id")]
    public int Id { get; set; } = default!;
    [JsonPropertyName("first_name")]
    public string? FirstName { get; set; }
    [JsonPropertyName("last_name")]
    public string? LastName { get; set; }
    [JsonPropertyName("nickname")]
    public string Nickname { get; set; } = default!;
    [JsonPropertyName("email")]
    public string? Email { get; set; }
    [JsonPropertyName("phone_number")]
    public string? PhoneNumber { get; set; }
    [JsonPropertyName("department")]
    public string? Department { get; set; }
    [JsonPropertyName("title")]
    public string? Title { get; set; }
    [JsonPropertyName("role")]
    public UserRole Role { get; set; } = default!;
    [JsonPropertyName("suspended")]
    public bool Suspended { get; set; } = default!;
    [JsonPropertyName("invite_status")]
    public InviteStatus InviteStatus { get; set; } = default!;
    [JsonPropertyName("inviter_id")]
    public int? InviterId { get; set; }
    [JsonPropertyName("list_tags")]
    public List<string> ListTags { get; set; } = default!;
    [JsonPropertyName("custom_properties")]
    public List<CustomProperty> CustomProperties { get; set; } = default!;
    [JsonPropertyName("user_status")]
    public UserStatus? UserStatus { get; set; }
    [JsonPropertyName("bot")]
    public bool Bot { get; set; } = default!;
    [JsonPropertyName("sso")]
    public bool Sso { get; set; } = default!;
    [JsonPropertyName("created_at")]
    public DateTimeOffset CreatedAt { get; set; } = default!;
    [JsonPropertyName("last_activity_at")]
    public DateTimeOffset? LastActivityAt { get; set; }
    [JsonPropertyName("time_zone")]
    public string? TimeZone { get; set; }
    [JsonPropertyName("image_url")]
    public string? ImageUrl { get; set; }
}

public class UserCreateRequestCustomProperty
{
    [JsonPropertyName("id")]
    public int Id { get; set; } = default!;
    [JsonPropertyName("value")]
    public string Value { get; set; } = default!;
}

public class UserCreateRequestUser
{
    [JsonPropertyName("first_name")]
    public string? FirstName { get; set; }
    [JsonPropertyName("last_name")]
    public string? LastName { get; set; }
    [JsonPropertyName("email")]
    public string Email { get; set; } = default!;
    [JsonPropertyName("phone_number")]
    public string? PhoneNumber { get; set; }
    [JsonPropertyName("nickname")]
    public string? Nickname { get; set; }
    [JsonPropertyName("department")]
    public string? Department { get; set; }
    [JsonPropertyName("title")]
    public string? Title { get; set; }
    [JsonPropertyName("role")]
    public UserCreateRole? Role { get; set; }
    [JsonPropertyName("suspended")]
    public bool? Suspended { get; set; }
    [JsonPropertyName("list_tags")]
    public List<string>? ListTags { get; set; }
    [JsonPropertyName("chat_ids")]
    public List<int>? ChatIds { get; set; }
    [JsonPropertyName("custom_properties")]
    public List<UserCreateRequestCustomProperty>? CustomProperties { get; set; }
}

public class UserCreateRequest
{
    [JsonPropertyName("user")]
    public UserCreateRequestUser User { get; set; } = default!;
    [JsonPropertyName("skip_email_notify")]
    public bool? SkipEmailNotify { get; set; }
}

public class UserStatusAwayMessage
{
    [JsonPropertyName("text")]
    public string Text { get; set; } = default!;
}

public class UserStatus
{
    [JsonPropertyName("emoji")]
    public string Emoji { get; set; } = default!;
    [JsonPropertyName("title")]
    public string Title { get; set; } = default!;
    [JsonPropertyName("expires_at")]
    public DateTimeOffset? ExpiresAt { get; set; }
    [JsonPropertyName("is_away")]
    public bool IsAway { get; set; } = default!;
    [JsonPropertyName("away_message")]
    public UserStatusAwayMessage? AwayMessage { get; set; }
}

public class UserUpdateRequestCustomProperty
{
    [JsonPropertyName("id")]
    public int Id { get; set; } = default!;
    [JsonPropertyName("value")]
    public string Value { get; set; } = default!;
}

public class UserUpdateRequestUser
{
    [JsonPropertyName("first_name")]
    public string? FirstName { get; set; }
    [JsonPropertyName("last_name")]
    public string? LastName { get; set; }
    [JsonPropertyName("email")]
    public string? Email { get; set; }
    [JsonPropertyName("phone_number")]
    public string? PhoneNumber { get; set; }
    [JsonPropertyName("nickname")]
    public string? Nickname { get; set; }
    [JsonPropertyName("department")]
    public string? Department { get; set; }
    [JsonPropertyName("title")]
    public string? Title { get; set; }
    [JsonPropertyName("role")]
    public UserRoleInput? Role { get; set; }
    [JsonPropertyName("chat_ids")]
    public List<int>? ChatIds { get; set; }
    [JsonPropertyName("suspended")]
    public bool? Suspended { get; set; }
    [JsonPropertyName("list_tags")]
    public List<string>? ListTags { get; set; }
    [JsonPropertyName("custom_properties")]
    public List<UserUpdateRequestCustomProperty>? CustomProperties { get; set; }
}

public class UserUpdateRequest
{
    [JsonPropertyName("user")]
    public UserUpdateRequestUser User { get; set; } = default!;
}

public class ViewBlock
{
    [JsonPropertyName("type")]
    public string Type { get; set; } = default!;
    [JsonPropertyName("text")]
    public string? Text { get; set; }
    [JsonPropertyName("name")]
    public string? Name { get; set; }
    [JsonPropertyName("label")]
    public string? Label { get; set; }
    [JsonPropertyName("initial_date")]
    public DateTimeOffset? InitialDate { get; set; }
}

public class ViewBlockCheckboxOption
{
    [JsonPropertyName("text")]
    public string Text { get; set; } = default!;
    [JsonPropertyName("value")]
    public string Value { get; set; } = default!;
    [JsonPropertyName("description")]
    public string? Description { get; set; }
    [JsonPropertyName("checked")]
    public bool? @Checked { get; set; }
}

public class ViewBlockSelectOption
{
    [JsonPropertyName("text")]
    public string Text { get; set; } = default!;
    [JsonPropertyName("value")]
    public string Value { get; set; } = default!;
    [JsonPropertyName("description")]
    public string? Description { get; set; }
    [JsonPropertyName("selected")]
    public bool? Selected { get; set; }
}

public class ViewBlockSelectableOption
{
    [JsonPropertyName("text")]
    public string Text { get; set; } = default!;
    [JsonPropertyName("value")]
    public string Value { get; set; } = default!;
    [JsonPropertyName("description")]
    public string? Description { get; set; }
    [JsonPropertyName("checked")]
    public bool? @Checked { get; set; }
}

public class VoiceContent
{
    [JsonPropertyName("duration_ms")]
    public int DurationMs { get; set; } = default!;
    [JsonPropertyName("waveform")]
    public string Waveform { get; set; } = default!;
    [JsonPropertyName("transcript")]
    public string? Transcript { get; set; }
}

public class WebhookEvent
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = default!;
    [JsonPropertyName("event_type")]
    public string EventType { get; set; } = default!;
    [JsonPropertyName("payload")]
    public WebhookPayloadUnion Payload { get; set; } = default!;
    [JsonPropertyName("created_at")]
    public DateTimeOffset CreatedAt { get; set; } = default!;
}

public class WebhookEventsStream
{
    [JsonPropertyName("url")]
    public string Url { get; set; } = default!;
    [JsonPropertyName("expires_at")]
    public DateTimeOffset ExpiresAt { get; set; } = default!;
}

public class WebhookLink
{
    [JsonPropertyName("url")]
    public string Url { get; set; } = default!;
    [JsonPropertyName("domain")]
    public string Domain { get; set; } = default!;
    [JsonPropertyName("skip")]
    public bool Skip { get; set; } = default!;
}

public class WebhookMessageThread
{
    [JsonPropertyName("message_id")]
    public int? MessageId { get; set; }
    [JsonPropertyName("message_chat_id")]
    public int? MessageChatId { get; set; }
}

public class WebhookVideoCallMember
{
    [JsonPropertyName("user_id")]
    public int UserId { get; set; } = default!;
    [JsonPropertyName("joined_at")]
    public DateTimeOffset JoinedAt { get; set; } = default!;
    [JsonPropertyName("left_at")]
    public DateTimeOffset LeftAt { get; set; } = default!;
}

public class WebhookVideoCallThread
{
    [JsonPropertyName("id")]
    public int Id { get; set; } = default!;
    [JsonPropertyName("chat_id")]
    public int ChatId { get; set; } = default!;
    [JsonPropertyName("message_id")]
    public int? MessageId { get; set; }
    [JsonPropertyName("message_chat_id")]
    public int? MessageChatId { get; set; }
}

public class UpdateBotAvatarRequest
{
    [JsonIgnore]
    public byte[] Image { get; set; } = Array.Empty<byte>();
}

public class CreateChatResponseMeta
{
    [JsonPropertyName("not_found_member_ids")]
    public List<int> NotFoundMemberIds { get; set; } = default!;
    [JsonPropertyName("not_found_group_tag_ids")]
    public List<int> NotFoundGroupTagIds { get; set; } = default!;
}

public class UpdateChatAvatarRequest
{
    [JsonIgnore]
    public byte[] Image { get; set; } = Array.Empty<byte>();
}

public class UpdateProfileAvatarRequest
{
    [JsonIgnore]
    public byte[] Image { get; set; } = Array.Empty<byte>();
}

public class UpdateUserAvatarRequest
{
    [JsonIgnore]
    public byte[] Image { get; set; } = Array.Empty<byte>();
}

public class GetAuditEventsResponse
{
    [JsonPropertyName("data")]
    public List<AuditEvent> Data { get; set; } = new();
    [JsonPropertyName("meta")]
    public PaginationMeta Meta { get; set; } = default!;
}

public class ListBotsResponse
{
    [JsonPropertyName("data")]
    public List<BotResponse> Data { get; set; } = new();
    [JsonPropertyName("meta")]
    public PaginationMeta Meta { get; set; } = default!;
}

public class ListBotTokensResponse
{
    [JsonPropertyName("data")]
    public List<BotAccessToken> Data { get; set; } = new();
    [JsonPropertyName("meta")]
    public PaginationMeta Meta { get; set; } = default!;
}

public class CreateChatResponse
{
    [JsonPropertyName("data")]
    public Chat Data { get; set; } = default!;
    [JsonPropertyName("meta")]
    public CreateChatResponseMeta Meta { get; set; } = default!;
}

public class ListChatsResponse
{
    [JsonPropertyName("data")]
    public List<Chat> Data { get; set; } = new();
    [JsonPropertyName("meta")]
    public PaginationMeta Meta { get; set; } = default!;
}

public class ListMembersResponse
{
    [JsonPropertyName("data")]
    public List<User> Data { get; set; } = new();
    [JsonPropertyName("meta")]
    public PaginationMeta Meta { get; set; } = default!;
}

public class ListCompanyBotsResponse
{
    [JsonPropertyName("data")]
    public List<CompanyBotResponse> Data { get; set; } = new();
    [JsonPropertyName("meta")]
    public PaginationMeta Meta { get; set; } = default!;
}

public class ListCompanyChatsResponse
{
    [JsonPropertyName("data")]
    public List<Chat> Data { get; set; } = new();
    [JsonPropertyName("meta")]
    public PaginationMeta Meta { get; set; } = default!;
}

public class ListPropertiesResponse
{
    [JsonPropertyName("data")]
    public List<CustomPropertyDefinition> Data { get; set; } = new();
}

public class ListDraftsResponse
{
    [JsonPropertyName("data")]
    public List<Draft> Data { get; set; } = new();
    [JsonPropertyName("meta")]
    public PaginationMeta Meta { get; set; } = default!;
}

public class ListTagsResponse
{
    [JsonPropertyName("data")]
    public List<GroupTag> Data { get; set; } = new();
    [JsonPropertyName("meta")]
    public PaginationMeta Meta { get; set; } = default!;
}

public class GetTagUsersResponse
{
    [JsonPropertyName("data")]
    public List<User> Data { get; set; } = new();
    [JsonPropertyName("meta")]
    public PaginationMeta Meta { get; set; } = default!;
}

public class ListImportantMessagesResponse
{
    [JsonPropertyName("data")]
    public List<Message> Data { get; set; } = new();
    [JsonPropertyName("meta")]
    public PaginationMeta Meta { get; set; } = default!;
}

public class ListChatMessagesResponse
{
    [JsonPropertyName("data")]
    public List<Message> Data { get; set; } = new();
    [JsonPropertyName("meta")]
    public PaginationMeta Meta { get; set; } = default!;
}

public class ListReactionsResponse
{
    [JsonPropertyName("data")]
    public List<Reaction> Data { get; set; } = new();
    [JsonPropertyName("meta")]
    public PaginationMeta Meta { get; set; } = default!;
}

public class SearchChatsResponse
{
    [JsonPropertyName("data")]
    public List<Chat> Data { get; set; } = new();
    [JsonPropertyName("meta")]
    public SearchPaginationMeta Meta { get; set; } = default!;
}

public class SearchMessagesResponse
{
    [JsonPropertyName("data")]
    public List<Message> Data { get; set; } = new();
    [JsonPropertyName("meta")]
    public SearchPaginationMeta Meta { get; set; } = default!;
}

public class SearchUsersResponse
{
    [JsonPropertyName("data")]
    public List<User> Data { get; set; } = new();
    [JsonPropertyName("meta")]
    public SearchPaginationMeta Meta { get; set; } = default!;
}

public class ListTasksResponse
{
    [JsonPropertyName("data")]
    public List<Task> Data { get; set; } = new();
    [JsonPropertyName("meta")]
    public PaginationMeta Meta { get; set; } = default!;
}

public class ListThreadsResponse
{
    [JsonPropertyName("data")]
    public List<Thread> Data { get; set; } = new();
    [JsonPropertyName("meta")]
    public PaginationMeta Meta { get; set; } = default!;
}

public class ListUsersResponse
{
    [JsonPropertyName("data")]
    public List<User> Data { get; set; } = new();
    [JsonPropertyName("meta")]
    public PaginationMeta Meta { get; set; } = default!;
}

public class GetWebhookEventsResponse
{
    [JsonPropertyName("data")]
    public List<WebhookEvent> Data { get; set; } = new();
    [JsonPropertyName("meta")]
    public PaginationMeta Meta { get; set; } = default!;
}

public class BotResponseDataWrapper
{
    [JsonPropertyName("data")]
    public BotResponse Data { get; set; } = default!;
}

public class WebhookEventsStreamDataWrapper
{
    [JsonPropertyName("data")]
    public WebhookEventsStream Data { get; set; } = default!;
}

public class BotSelfTokenResponseDataWrapper
{
    [JsonPropertyName("data")]
    public BotSelfTokenResponse Data { get; set; } = default!;
}

public class BotCreateResponseDataWrapper
{
    [JsonPropertyName("data")]
    public BotCreateResponse Data { get; set; } = default!;
}

public class BotAccessTokenDataWrapper
{
    [JsonPropertyName("data")]
    public BotAccessToken Data { get; set; } = default!;
}

public class BotSelfResponseDataWrapper
{
    [JsonPropertyName("data")]
    public BotSelfResponse Data { get; set; } = default!;
}

public class AvatarDataDataWrapper
{
    [JsonPropertyName("data")]
    public AvatarData Data { get; set; } = default!;
}

public class ChatDataWrapper
{
    [JsonPropertyName("data")]
    public Chat Data { get; set; } = default!;
}

public class ChatExportDataWrapper
{
    [JsonPropertyName("data")]
    public ChatExport Data { get; set; } = default!;
}

public class DraftDataWrapper
{
    [JsonPropertyName("data")]
    public Draft Data { get; set; } = default!;
}

public class GroupTagDataWrapper
{
    [JsonPropertyName("data")]
    public GroupTag Data { get; set; } = default!;
}

public class MessageDataWrapper
{
    [JsonPropertyName("data")]
    public Message Data { get; set; } = default!;
}

public class ThreadDataWrapper
{
    [JsonPropertyName("data")]
    public Thread Data { get; set; } = default!;
}

public class AccessTokenInfoDataWrapper
{
    [JsonPropertyName("data")]
    public AccessTokenInfo Data { get; set; } = default!;
}

public class UserDataWrapper
{
    [JsonPropertyName("data")]
    public User Data { get; set; } = default!;
}

public class UserStatusDataWrapper
{
    [JsonPropertyName("data")]
    public UserStatus Data { get; set; } = default!;
}

public class TaskDataWrapper
{
    [JsonPropertyName("data")]
    public Task Data { get; set; } = default!;
}
