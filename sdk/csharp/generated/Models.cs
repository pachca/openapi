#nullable enable

using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Pachca.Sdk;

/// <summary>Тип аудит-события</summary>
[JsonConverter(typeof(AuditEventKeyConverter))]
public enum AuditEventKey
{
    /// <summary>Пользователь успешно вошел в систему</summary>
    UserLogin,
    /// <summary>Пользователь вышел из системы</summary>
    UserLogout,
    /// <summary>Неудачная попытка двухфакторной аутентификации</summary>
    User2faFail,
    /// <summary>Успешная двухфакторная аутентификация</summary>
    User2faSuccess,
    /// <summary>Создана новая учетная запись пользователя</summary>
    UserCreated,
    /// <summary>Учетная запись пользователя удалена</summary>
    UserDeleted,
    /// <summary>Роль пользователя была изменена</summary>
    UserRoleChanged,
    /// <summary>Данные пользователя обновлены</summary>
    UserUpdated,
    /// <summary>Создан новый тег</summary>
    TagCreated,
    /// <summary>Тег удален</summary>
    TagDeleted,
    /// <summary>Пользователь добавлен в тег</summary>
    UserAddedToTag,
    /// <summary>Пользователь удален из тега</summary>
    UserRemovedFromTag,
    /// <summary>Создан новый чат</summary>
    ChatCreated,
    /// <summary>Чат переименован</summary>
    ChatRenamed,
    /// <summary>Изменены права доступа к чату</summary>
    ChatPermissionChanged,
    /// <summary>Пользователь присоединился к чату</summary>
    UserChatJoin,
    /// <summary>Пользователь покинул чат</summary>
    UserChatLeave,
    /// <summary>Тег добавлен в чат</summary>
    TagAddedToChat,
    /// <summary>Тег удален из чата</summary>
    TagRemovedFromChat,
    /// <summary>Сообщение отредактировано</summary>
    MessageUpdated,
    /// <summary>Сообщение удалено</summary>
    MessageDeleted,
    /// <summary>Сообщение создано</summary>
    MessageCreated,
    /// <summary>Реакция добавлена</summary>
    ReactionCreated,
    /// <summary>Реакция удалена</summary>
    ReactionDeleted,
    /// <summary>Тред создан</summary>
    ThreadCreated,
    /// <summary>Создан новый токен доступа</summary>
    AccessTokenCreated,
    /// <summary>Токен доступа обновлен</summary>
    AccessTokenUpdated,
    /// <summary>Токен доступа удален</summary>
    AccessTokenDestroy,
    /// <summary>Данные зашифрованы</summary>
    KmsEncrypt,
    /// <summary>Данные расшифрованы</summary>
    KmsDecrypt,
    /// <summary>Доступ к журналам аудита получен</summary>
    AuditEventsAccessed,
    /// <summary>Срабатывание правила DLP-системы</summary>
    DlpViolationDetected,
    /// <summary>Поиск сотрудников через API</summary>
    SearchUsersApi,
    /// <summary>Поиск чатов через API</summary>
    SearchChatsApi,
    /// <summary>Поиск сообщений через API</summary>
    SearchMessagesApi,
}

internal class AuditEventKeyConverter : JsonConverter<AuditEventKey>
{
    public override AuditEventKey Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        var value = reader.GetString();
        return value switch
        {
            "user_login" => AuditEventKey.UserLogin,
            "user_logout" => AuditEventKey.UserLogout,
            "user_2fa_fail" => AuditEventKey.User2faFail,
            "user_2fa_success" => AuditEventKey.User2faSuccess,
            "user_created" => AuditEventKey.UserCreated,
            "user_deleted" => AuditEventKey.UserDeleted,
            "user_role_changed" => AuditEventKey.UserRoleChanged,
            "user_updated" => AuditEventKey.UserUpdated,
            "tag_created" => AuditEventKey.TagCreated,
            "tag_deleted" => AuditEventKey.TagDeleted,
            "user_added_to_tag" => AuditEventKey.UserAddedToTag,
            "user_removed_from_tag" => AuditEventKey.UserRemovedFromTag,
            "chat_created" => AuditEventKey.ChatCreated,
            "chat_renamed" => AuditEventKey.ChatRenamed,
            "chat_permission_changed" => AuditEventKey.ChatPermissionChanged,
            "user_chat_join" => AuditEventKey.UserChatJoin,
            "user_chat_leave" => AuditEventKey.UserChatLeave,
            "tag_added_to_chat" => AuditEventKey.TagAddedToChat,
            "tag_removed_from_chat" => AuditEventKey.TagRemovedFromChat,
            "message_updated" => AuditEventKey.MessageUpdated,
            "message_deleted" => AuditEventKey.MessageDeleted,
            "message_created" => AuditEventKey.MessageCreated,
            "reaction_created" => AuditEventKey.ReactionCreated,
            "reaction_deleted" => AuditEventKey.ReactionDeleted,
            "thread_created" => AuditEventKey.ThreadCreated,
            "access_token_created" => AuditEventKey.AccessTokenCreated,
            "access_token_updated" => AuditEventKey.AccessTokenUpdated,
            "access_token_destroy" => AuditEventKey.AccessTokenDestroy,
            "kms_encrypt" => AuditEventKey.KmsEncrypt,
            "kms_decrypt" => AuditEventKey.KmsDecrypt,
            "audit_events_accessed" => AuditEventKey.AuditEventsAccessed,
            "dlp_violation_detected" => AuditEventKey.DlpViolationDetected,
            "search_users_api" => AuditEventKey.SearchUsersApi,
            "search_chats_api" => AuditEventKey.SearchChatsApi,
            "search_messages_api" => AuditEventKey.SearchMessagesApi,
            _ => throw new JsonException($"Unknown AuditEventKey value: {value}"),
        };
    }

    public override void Write(Utf8JsonWriter writer, AuditEventKey value, JsonSerializerOptions options)
    {
        var str = value switch
        {
            AuditEventKey.UserLogin => "user_login",
            AuditEventKey.UserLogout => "user_logout",
            AuditEventKey.User2faFail => "user_2fa_fail",
            AuditEventKey.User2faSuccess => "user_2fa_success",
            AuditEventKey.UserCreated => "user_created",
            AuditEventKey.UserDeleted => "user_deleted",
            AuditEventKey.UserRoleChanged => "user_role_changed",
            AuditEventKey.UserUpdated => "user_updated",
            AuditEventKey.TagCreated => "tag_created",
            AuditEventKey.TagDeleted => "tag_deleted",
            AuditEventKey.UserAddedToTag => "user_added_to_tag",
            AuditEventKey.UserRemovedFromTag => "user_removed_from_tag",
            AuditEventKey.ChatCreated => "chat_created",
            AuditEventKey.ChatRenamed => "chat_renamed",
            AuditEventKey.ChatPermissionChanged => "chat_permission_changed",
            AuditEventKey.UserChatJoin => "user_chat_join",
            AuditEventKey.UserChatLeave => "user_chat_leave",
            AuditEventKey.TagAddedToChat => "tag_added_to_chat",
            AuditEventKey.TagRemovedFromChat => "tag_removed_from_chat",
            AuditEventKey.MessageUpdated => "message_updated",
            AuditEventKey.MessageDeleted => "message_deleted",
            AuditEventKey.MessageCreated => "message_created",
            AuditEventKey.ReactionCreated => "reaction_created",
            AuditEventKey.ReactionDeleted => "reaction_deleted",
            AuditEventKey.ThreadCreated => "thread_created",
            AuditEventKey.AccessTokenCreated => "access_token_created",
            AuditEventKey.AccessTokenUpdated => "access_token_updated",
            AuditEventKey.AccessTokenDestroy => "access_token_destroy",
            AuditEventKey.KmsEncrypt => "kms_encrypt",
            AuditEventKey.KmsDecrypt => "kms_decrypt",
            AuditEventKey.AuditEventsAccessed => "audit_events_accessed",
            AuditEventKey.DlpViolationDetected => "dlp_violation_detected",
            AuditEventKey.SearchUsersApi => "search_users_api",
            AuditEventKey.SearchChatsApi => "search_chats_api",
            AuditEventKey.SearchMessagesApi => "search_messages_api",
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
public enum CustomPropertyDataType
{
    /// <summary>Строковое значение</summary>
    String,
    /// <summary>Числовое значение</summary>
    Number,
    /// <summary>Дата</summary>
    Date,
    /// <summary>Ссылка</summary>
    Link,
}

internal class CustomPropertyDataTypeConverter : JsonConverter<CustomPropertyDataType>
{
    public override CustomPropertyDataType Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        var value = reader.GetString();
        return value switch
        {
            "string" => CustomPropertyDataType.String,
            "number" => CustomPropertyDataType.Number,
            "date" => CustomPropertyDataType.Date,
            "link" => CustomPropertyDataType.Link,
            _ => throw new JsonException($"Unknown CustomPropertyDataType value: {value}"),
        };
    }

    public override void Write(Utf8JsonWriter writer, CustomPropertyDataType value, JsonSerializerOptions options)
    {
        var str = value switch
        {
            CustomPropertyDataType.String => "string",
            CustomPropertyDataType.Number => "number",
            CustomPropertyDataType.Date => "date",
            CustomPropertyDataType.Link => "link",
            _ => value.ToString(),
        };
        writer.WriteStringValue(str);
    }
}

/// <summary>Тип файла</summary>
[JsonConverter(typeof(FileTypeConverter))]
public enum FileType
{
    /// <summary>Обычный файл</summary>
    File,
    /// <summary>Изображение</summary>
    Image,
}

internal class FileTypeConverter : JsonConverter<FileType>
{
    public override FileType Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        var value = reader.GetString();
        return value switch
        {
            "file" => FileType.File,
            "image" => FileType.Image,
            _ => throw new JsonException($"Unknown FileType value: {value}"),
        };
    }

    public override void Write(Utf8JsonWriter writer, FileType value, JsonSerializerOptions options)
    {
        var str = value switch
        {
            FileType.File => "file",
            FileType.Image => "image",
            _ => value.ToString(),
        };
        writer.WriteStringValue(str);
    }
}

/// <summary>Статус приглашения пользователя</summary>
[JsonConverter(typeof(InviteStatusConverter))]
public enum InviteStatus
{
    /// <summary>Принято</summary>
    Confirmed,
    /// <summary>Отправлено</summary>
    Sent,
}

internal class InviteStatusConverter : JsonConverter<InviteStatus>
{
    public override InviteStatus Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        var value = reader.GetString();
        return value switch
        {
            "confirmed" => InviteStatus.Confirmed,
            "sent" => InviteStatus.Sent,
            _ => throw new JsonException($"Unknown InviteStatus value: {value}"),
        };
    }

    public override void Write(Utf8JsonWriter writer, InviteStatus value, JsonSerializerOptions options)
    {
        var str = value switch
        {
            InviteStatus.Confirmed => "confirmed",
            InviteStatus.Sent => "sent",
            _ => value.ToString(),
        };
        writer.WriteStringValue(str);
    }
}

/// <summary>Тип события webhook для участников</summary>
[JsonConverter(typeof(MemberEventTypeConverter))]
public enum MemberEventType
{
    /// <summary>Добавление</summary>
    Add,
    /// <summary>Удаление</summary>
    Remove,
}

internal class MemberEventTypeConverter : JsonConverter<MemberEventType>
{
    public override MemberEventType Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        var value = reader.GetString();
        return value switch
        {
            "add" => MemberEventType.Add,
            "remove" => MemberEventType.Remove,
            _ => throw new JsonException($"Unknown MemberEventType value: {value}"),
        };
    }

    public override void Write(Utf8JsonWriter writer, MemberEventType value, JsonSerializerOptions options)
    {
        var str = value switch
        {
            MemberEventType.Add => "add",
            MemberEventType.Remove => "remove",
            _ => value.ToString(),
        };
        writer.WriteStringValue(str);
    }
}

/// <summary>Тип сущности для сообщений</summary>
[JsonConverter(typeof(MessageEntityTypeConverter))]
public enum MessageEntityType
{
    /// <summary>Беседа или канал</summary>
    Discussion,
    /// <summary>Тред</summary>
    Thread,
    /// <summary>Пользователь</summary>
    User,
}

internal class MessageEntityTypeConverter : JsonConverter<MessageEntityType>
{
    public override MessageEntityType Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        var value = reader.GetString();
        return value switch
        {
            "discussion" => MessageEntityType.Discussion,
            "thread" => MessageEntityType.Thread,
            "user" => MessageEntityType.User,
            _ => throw new JsonException($"Unknown MessageEntityType value: {value}"),
        };
    }

    public override void Write(Utf8JsonWriter writer, MessageEntityType value, JsonSerializerOptions options)
    {
        var str = value switch
        {
            MessageEntityType.Discussion => "discussion",
            MessageEntityType.Thread => "thread",
            MessageEntityType.User => "user",
            _ => value.ToString(),
        };
        writer.WriteStringValue(str);
    }
}

/// <summary>Скоуп доступа OAuth токена</summary>
[JsonConverter(typeof(OAuthScopeConverter))]
public enum OAuthScope
{
    /// <summary>Просмотр чатов и списка чатов</summary>
    ChatsRead,
    /// <summary>Создание новых чатов</summary>
    ChatsCreate,
    /// <summary>Изменение настроек чата</summary>
    ChatsUpdate,
    /// <summary>Архивация и разархивация чатов</summary>
    ChatsArchive,
    /// <summary>Выход из чатов</summary>
    ChatsLeave,
    /// <summary>Просмотр участников чата</summary>
    ChatMembersRead,
    /// <summary>Добавление, изменение и удаление участников чата</summary>
    ChatMembersWrite,
    /// <summary>Скачивание экспортов чата</summary>
    ChatExportsRead,
    /// <summary>Создание экспортов чата</summary>
    ChatExportsWrite,
    /// <summary>Просмотр сообщений в чатах</summary>
    MessagesRead,
    /// <summary>Отправка сообщений</summary>
    MessagesCreate,
    /// <summary>Редактирование сообщений</summary>
    MessagesUpdate,
    /// <summary>Удаление сообщений</summary>
    MessagesDelete,
    /// <summary>Просмотр реакций на сообщения</summary>
    ReactionsRead,
    /// <summary>Добавление и удаление реакций</summary>
    ReactionsWrite,
    /// <summary>Закрепление и открепление сообщений</summary>
    PinsWrite,
    /// <summary>Просмотр тредов (комментариев)</summary>
    ThreadsRead,
    /// <summary>Создание тредов (комментариев)</summary>
    ThreadsCreate,
    /// <summary>Unfurl (разворачивание ссылок)</summary>
    LinkPreviewsWrite,
    /// <summary>Просмотр информации о сотрудниках и списка сотрудников</summary>
    UsersRead,
    /// <summary>Создание новых сотрудников</summary>
    UsersCreate,
    /// <summary>Редактирование данных сотрудника</summary>
    UsersUpdate,
    /// <summary>Удаление сотрудников</summary>
    UsersDelete,
    /// <summary>Просмотр тегов</summary>
    GroupTagsRead,
    /// <summary>Создание, редактирование и удаление тегов</summary>
    GroupTagsWrite,
    /// <summary>Изменение настроек бота</summary>
    BotsWrite,
    /// <summary>Просмотр информации о своем профиле</summary>
    ProfileRead,
    /// <summary>Просмотр статуса профиля</summary>
    ProfileStatusRead,
    /// <summary>Изменение и удаление статуса профиля</summary>
    ProfileStatusWrite,
    /// <summary>Просмотр статуса сотрудника</summary>
    UserStatusRead,
    /// <summary>Изменение и удаление статуса сотрудника</summary>
    UserStatusWrite,
    /// <summary>Просмотр дополнительных полей</summary>
    CustomPropertiesRead,
    /// <summary>Просмотр журнала аудита</summary>
    AuditEventsRead,
    /// <summary>Просмотр задач</summary>
    TasksRead,
    /// <summary>Создание задач</summary>
    TasksCreate,
    /// <summary>Изменение задачи</summary>
    TasksUpdate,
    /// <summary>Удаление задачи</summary>
    TasksDelete,
    /// <summary>Скачивание файлов</summary>
    FilesRead,
    /// <summary>Загрузка файлов</summary>
    FilesWrite,
    /// <summary>Получение данных для загрузки файлов</summary>
    UploadsWrite,
    /// <summary>Открытие форм (представлений)</summary>
    ViewsWrite,
    /// <summary>Просмотр вебхуков</summary>
    WebhooksRead,
    /// <summary>Создание и управление вебхуками</summary>
    WebhooksWrite,
    /// <summary>Просмотр лога вебхуков</summary>
    WebhooksEventsRead,
    /// <summary>Удаление записи в логе вебхука</summary>
    WebhooksEventsDelete,
    /// <summary>Поиск сотрудников</summary>
    SearchUsers,
    /// <summary>Поиск чатов</summary>
    SearchChats,
    /// <summary>Поиск сообщений</summary>
    SearchMessages,
}

internal class OAuthScopeConverter : JsonConverter<OAuthScope>
{
    public override OAuthScope Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        var value = reader.GetString();
        return value switch
        {
            "chats:read" => OAuthScope.ChatsRead,
            "chats:create" => OAuthScope.ChatsCreate,
            "chats:update" => OAuthScope.ChatsUpdate,
            "chats:archive" => OAuthScope.ChatsArchive,
            "chats:leave" => OAuthScope.ChatsLeave,
            "chat_members:read" => OAuthScope.ChatMembersRead,
            "chat_members:write" => OAuthScope.ChatMembersWrite,
            "chat_exports:read" => OAuthScope.ChatExportsRead,
            "chat_exports:write" => OAuthScope.ChatExportsWrite,
            "messages:read" => OAuthScope.MessagesRead,
            "messages:create" => OAuthScope.MessagesCreate,
            "messages:update" => OAuthScope.MessagesUpdate,
            "messages:delete" => OAuthScope.MessagesDelete,
            "reactions:read" => OAuthScope.ReactionsRead,
            "reactions:write" => OAuthScope.ReactionsWrite,
            "pins:write" => OAuthScope.PinsWrite,
            "threads:read" => OAuthScope.ThreadsRead,
            "threads:create" => OAuthScope.ThreadsCreate,
            "link_previews:write" => OAuthScope.LinkPreviewsWrite,
            "users:read" => OAuthScope.UsersRead,
            "users:create" => OAuthScope.UsersCreate,
            "users:update" => OAuthScope.UsersUpdate,
            "users:delete" => OAuthScope.UsersDelete,
            "group_tags:read" => OAuthScope.GroupTagsRead,
            "group_tags:write" => OAuthScope.GroupTagsWrite,
            "bots:write" => OAuthScope.BotsWrite,
            "profile:read" => OAuthScope.ProfileRead,
            "profile_status:read" => OAuthScope.ProfileStatusRead,
            "profile_status:write" => OAuthScope.ProfileStatusWrite,
            "user_status:read" => OAuthScope.UserStatusRead,
            "user_status:write" => OAuthScope.UserStatusWrite,
            "custom_properties:read" => OAuthScope.CustomPropertiesRead,
            "audit_events:read" => OAuthScope.AuditEventsRead,
            "tasks:read" => OAuthScope.TasksRead,
            "tasks:create" => OAuthScope.TasksCreate,
            "tasks:update" => OAuthScope.TasksUpdate,
            "tasks:delete" => OAuthScope.TasksDelete,
            "files:read" => OAuthScope.FilesRead,
            "files:write" => OAuthScope.FilesWrite,
            "uploads:write" => OAuthScope.UploadsWrite,
            "views:write" => OAuthScope.ViewsWrite,
            "webhooks:read" => OAuthScope.WebhooksRead,
            "webhooks:write" => OAuthScope.WebhooksWrite,
            "webhooks:events:read" => OAuthScope.WebhooksEventsRead,
            "webhooks:events:delete" => OAuthScope.WebhooksEventsDelete,
            "search:users" => OAuthScope.SearchUsers,
            "search:chats" => OAuthScope.SearchChats,
            "search:messages" => OAuthScope.SearchMessages,
            _ => throw new JsonException($"Unknown OAuthScope value: {value}"),
        };
    }

    public override void Write(Utf8JsonWriter writer, OAuthScope value, JsonSerializerOptions options)
    {
        var str = value switch
        {
            OAuthScope.ChatsRead => "chats:read",
            OAuthScope.ChatsCreate => "chats:create",
            OAuthScope.ChatsUpdate => "chats:update",
            OAuthScope.ChatsArchive => "chats:archive",
            OAuthScope.ChatsLeave => "chats:leave",
            OAuthScope.ChatMembersRead => "chat_members:read",
            OAuthScope.ChatMembersWrite => "chat_members:write",
            OAuthScope.ChatExportsRead => "chat_exports:read",
            OAuthScope.ChatExportsWrite => "chat_exports:write",
            OAuthScope.MessagesRead => "messages:read",
            OAuthScope.MessagesCreate => "messages:create",
            OAuthScope.MessagesUpdate => "messages:update",
            OAuthScope.MessagesDelete => "messages:delete",
            OAuthScope.ReactionsRead => "reactions:read",
            OAuthScope.ReactionsWrite => "reactions:write",
            OAuthScope.PinsWrite => "pins:write",
            OAuthScope.ThreadsRead => "threads:read",
            OAuthScope.ThreadsCreate => "threads:create",
            OAuthScope.LinkPreviewsWrite => "link_previews:write",
            OAuthScope.UsersRead => "users:read",
            OAuthScope.UsersCreate => "users:create",
            OAuthScope.UsersUpdate => "users:update",
            OAuthScope.UsersDelete => "users:delete",
            OAuthScope.GroupTagsRead => "group_tags:read",
            OAuthScope.GroupTagsWrite => "group_tags:write",
            OAuthScope.BotsWrite => "bots:write",
            OAuthScope.ProfileRead => "profile:read",
            OAuthScope.ProfileStatusRead => "profile_status:read",
            OAuthScope.ProfileStatusWrite => "profile_status:write",
            OAuthScope.UserStatusRead => "user_status:read",
            OAuthScope.UserStatusWrite => "user_status:write",
            OAuthScope.CustomPropertiesRead => "custom_properties:read",
            OAuthScope.AuditEventsRead => "audit_events:read",
            OAuthScope.TasksRead => "tasks:read",
            OAuthScope.TasksCreate => "tasks:create",
            OAuthScope.TasksUpdate => "tasks:update",
            OAuthScope.TasksDelete => "tasks:delete",
            OAuthScope.FilesRead => "files:read",
            OAuthScope.FilesWrite => "files:write",
            OAuthScope.UploadsWrite => "uploads:write",
            OAuthScope.ViewsWrite => "views:write",
            OAuthScope.WebhooksRead => "webhooks:read",
            OAuthScope.WebhooksWrite => "webhooks:write",
            OAuthScope.WebhooksEventsRead => "webhooks:events:read",
            OAuthScope.WebhooksEventsDelete => "webhooks:events:delete",
            OAuthScope.SearchUsers => "search:users",
            OAuthScope.SearchChats => "search:chats",
            OAuthScope.SearchMessages => "search:messages",
            _ => value.ToString(),
        };
        writer.WriteStringValue(str);
    }
}

/// <summary>Тип события webhook для реакций</summary>
[JsonConverter(typeof(ReactionEventTypeConverter))]
public enum ReactionEventType
{
    /// <summary>Создание</summary>
    New,
    /// <summary>Удаление</summary>
    Delete,
}

internal class ReactionEventTypeConverter : JsonConverter<ReactionEventType>
{
    public override ReactionEventType Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        var value = reader.GetString();
        return value switch
        {
            "new" => ReactionEventType.New,
            "delete" => ReactionEventType.Delete,
            _ => throw new JsonException($"Unknown ReactionEventType value: {value}"),
        };
    }

    public override void Write(Utf8JsonWriter writer, ReactionEventType value, JsonSerializerOptions options)
    {
        var str = value switch
        {
            ReactionEventType.New => "new",
            ReactionEventType.Delete => "delete",
            _ => value.ToString(),
        };
        writer.WriteStringValue(str);
    }
}

/// <summary>Тип сущности для поиска</summary>
[JsonConverter(typeof(SearchEntityTypeConverter))]
public enum SearchEntityType
{
    /// <summary>Пользователь</summary>
    User,
    /// <summary>Задача</summary>
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
            _ => throw new JsonException($"Unknown SearchSortOrder value: {value}"),
        };
    }

    public override void Write(Utf8JsonWriter writer, SearchSortOrder value, JsonSerializerOptions options)
    {
        var str = value switch
        {
            SearchSortOrder.ByScore => "by_score",
            SearchSortOrder.Alphabetical => "alphabetical",
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

/// <summary>Тип задачи</summary>
[JsonConverter(typeof(TaskKindConverter))]
public enum TaskKind
{
    /// <summary>Позвонить контакту</summary>
    Call,
    /// <summary>Встреча</summary>
    Meeting,
    /// <summary>Простое напоминание</summary>
    Reminder,
    /// <summary>Событие</summary>
    Event,
    /// <summary>Написать письмо</summary>
    Email,
}

internal class TaskKindConverter : JsonConverter<TaskKind>
{
    public override TaskKind Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        var value = reader.GetString();
        return value switch
        {
            "call" => TaskKind.Call,
            "meeting" => TaskKind.Meeting,
            "reminder" => TaskKind.Reminder,
            "event" => TaskKind.Event,
            "email" => TaskKind.Email,
            _ => throw new JsonException($"Unknown TaskKind value: {value}"),
        };
    }

    public override void Write(Utf8JsonWriter writer, TaskKind value, JsonSerializerOptions options)
    {
        var str = value switch
        {
            TaskKind.Call => "call",
            TaskKind.Meeting => "meeting",
            TaskKind.Reminder => "reminder",
            TaskKind.Event => "event",
            TaskKind.Email => "email",
            _ => value.ToString(),
        };
        writer.WriteStringValue(str);
    }
}

/// <summary>Статус напоминания</summary>
[JsonConverter(typeof(TaskStatusConverter))]
public enum TaskStatus
{
    /// <summary>Выполнено</summary>
    Done,
    /// <summary>Активно</summary>
    Undone,
}

internal class TaskStatusConverter : JsonConverter<TaskStatus>
{
    public override TaskStatus Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        var value = reader.GetString();
        return value switch
        {
            "done" => TaskStatus.Done,
            "undone" => TaskStatus.Undone,
            _ => throw new JsonException($"Unknown TaskStatus value: {value}"),
        };
    }

    public override void Write(Utf8JsonWriter writer, TaskStatus value, JsonSerializerOptions options)
    {
        var str = value switch
        {
            TaskStatus.Done => "done",
            TaskStatus.Undone => "undone",
            _ => value.ToString(),
        };
        writer.WriteStringValue(str);
    }
}

/// <summary>Тип события webhook для пользователей</summary>
[JsonConverter(typeof(UserEventTypeConverter))]
public enum UserEventType
{
    /// <summary>Приглашение</summary>
    Invite,
    /// <summary>Подтверждение</summary>
    Confirm,
    /// <summary>Обновление</summary>
    Update,
    /// <summary>Приостановка</summary>
    Suspend,
    /// <summary>Активация</summary>
    Activate,
    /// <summary>Удаление</summary>
    Delete,
}

internal class UserEventTypeConverter : JsonConverter<UserEventType>
{
    public override UserEventType Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        var value = reader.GetString();
        return value switch
        {
            "invite" => UserEventType.Invite,
            "confirm" => UserEventType.Confirm,
            "update" => UserEventType.Update,
            "suspend" => UserEventType.Suspend,
            "activate" => UserEventType.Activate,
            "delete" => UserEventType.Delete,
            _ => throw new JsonException($"Unknown UserEventType value: {value}"),
        };
    }

    public override void Write(Utf8JsonWriter writer, UserEventType value, JsonSerializerOptions options)
    {
        var str = value switch
        {
            UserEventType.Invite => "invite",
            UserEventType.Confirm => "confirm",
            UserEventType.Update => "update",
            UserEventType.Suspend => "suspend",
            UserEventType.Activate => "activate",
            UserEventType.Delete => "delete",
            _ => value.ToString(),
        };
        writer.WriteStringValue(str);
    }
}

/// <summary>Роль пользователя в системе</summary>
[JsonConverter(typeof(UserRoleConverter))]
public enum UserRole
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

internal class UserRoleConverter : JsonConverter<UserRole>
{
    public override UserRole Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        var value = reader.GetString();
        return value switch
        {
            "admin" => UserRole.Admin,
            "user" => UserRole.User,
            "multi_guest" => UserRole.MultiGuest,
            "guest" => UserRole.Guest,
            _ => throw new JsonException($"Unknown UserRole value: {value}"),
        };
    }

    public override void Write(Utf8JsonWriter writer, UserRole value, JsonSerializerOptions options)
    {
        var str = value switch
        {
            UserRole.Admin => "admin",
            UserRole.User => "user",
            UserRole.MultiGuest => "multi_guest",
            UserRole.Guest => "guest",
            _ => value.ToString(),
        };
        writer.WriteStringValue(str);
    }
}

/// <summary>Роль пользователя, допустимая при создании и редактировании. Роль `guest` недоступна для установки через API.</summary>
[JsonConverter(typeof(UserRoleInputConverter))]
public enum UserRoleInput
{
    /// <summary>Администратор</summary>
    Admin,
    /// <summary>Сотрудник</summary>
    User,
    /// <summary>Мульти-гость</summary>
    MultiGuest,
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
            _ => value.ToString(),
        };
        writer.WriteStringValue(str);
    }
}

/// <summary>Коды ошибок валидации</summary>
[JsonConverter(typeof(ValidationErrorCodeConverter))]
public enum ValidationErrorCode
{
    /// <summary>Обязательное поле (не может быть пустым)</summary>
    Blank,
    /// <summary>Слишком длинное значение (пояснения вы получите в поле message)</summary>
    TooLong,
    /// <summary>Поле не соответствует правилам (пояснения вы получите в поле message)</summary>
    Invalid,
    /// <summary>Поле имеет непредусмотренное значение</summary>
    Inclusion,
    /// <summary>Поле имеет недопустимое значение</summary>
    Exclusion,
    /// <summary>Название для этого поля уже существует</summary>
    Taken,
    /// <summary>Emoji статуса не может содержать значения отличные от Emoji символа</summary>
    WrongEmoji,
    /// <summary>Объект не найден</summary>
    NotFound,
    /// <summary>Объект уже существует (пояснения вы получите в поле message)</summary>
    AlreadyExists,
    /// <summary>Ошибка личного чата (пояснения вы получите в поле message)</summary>
    PersonalChat,
    /// <summary>Отображаемая ошибка (пояснения вы получите в поле message)</summary>
    DisplayedError,
    /// <summary>Действие запрещено</summary>
    NotAuthorized,
    /// <summary>Выбран слишком большой диапазон дат</summary>
    InvalidDateRange,
    /// <summary>Некорректный URL вебхука</summary>
    InvalidWebhookUrl,
    /// <summary>Достигнут лимит запросов</summary>
    RateLimit,
    /// <summary>Превышен лимит активных сотрудников (пояснения вы получите в поле message)</summary>
    LicensesLimit,
    /// <summary>Превышен лимит количества реакций, которые может добавить пользователь (20 уникальных реакций)</summary>
    UserLimit,
    /// <summary>Превышен лимит количества уникальных реакций, которые можно добавить на сообщение (30 уникальных реакций)</summary>
    UniqueLimit,
    /// <summary>Превышен лимит количества реакций, которые можно добавить на сообщение (1000 реакций)</summary>
    GeneralLimit,
    /// <summary>Ошибка выполнения запроса (пояснения вы получите в поле message)</summary>
    Unhandled,
    /// <summary>Не удалось найти идентификатор события</summary>
    TriggerNotFound,
    /// <summary>Время жизни идентификатора события истекло</summary>
    TriggerExpired,
    /// <summary>Обязательный параметр не передан</summary>
    Required,
    /// <summary>Недопустимое значение (не входит в список допустимых)</summary>
    In,
    /// <summary>Значение неприменимо в данном контексте (пояснения вы получите в поле message)</summary>
    NotApplicable,
    /// <summary>Нельзя изменить свои собственные данные</summary>
    SelfUpdate,
    /// <summary>Нельзя изменить данные владельца</summary>
    OwnerProtected,
    /// <summary>Значение уже назначено</summary>
    AlreadyAssigned,
    /// <summary>Недостаточно прав для выполнения действия (пояснения вы получите в поле message)</summary>
    Forbidden,
    /// <summary>Доступ запрещён (недостаточно прав)</summary>
    PermissionDenied,
    /// <summary>Доступ запрещён</summary>
    AccessDenied,
    /// <summary>Некорректные параметры запроса (пояснения вы получите в поле message)</summary>
    WrongParams,
    /// <summary>Требуется оплата</summary>
    PaymentRequired,
    /// <summary>Значение слишком короткое (пояснения вы получите в поле message)</summary>
    MinLength,
    /// <summary>Значение слишком длинное (пояснения вы получите в поле message)</summary>
    MaxLength,
    /// <summary>Использовано зарезервированное системное слово (here, all)</summary>
    UseOfSystemWords,
}

internal class ValidationErrorCodeConverter : JsonConverter<ValidationErrorCode>
{
    public override ValidationErrorCode Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        var value = reader.GetString();
        return value switch
        {
            "blank" => ValidationErrorCode.Blank,
            "too_long" => ValidationErrorCode.TooLong,
            "invalid" => ValidationErrorCode.Invalid,
            "inclusion" => ValidationErrorCode.Inclusion,
            "exclusion" => ValidationErrorCode.Exclusion,
            "taken" => ValidationErrorCode.Taken,
            "wrong_emoji" => ValidationErrorCode.WrongEmoji,
            "not_found" => ValidationErrorCode.NotFound,
            "already_exists" => ValidationErrorCode.AlreadyExists,
            "personal_chat" => ValidationErrorCode.PersonalChat,
            "displayed_error" => ValidationErrorCode.DisplayedError,
            "not_authorized" => ValidationErrorCode.NotAuthorized,
            "invalid_date_range" => ValidationErrorCode.InvalidDateRange,
            "invalid_webhook_url" => ValidationErrorCode.InvalidWebhookUrl,
            "rate_limit" => ValidationErrorCode.RateLimit,
            "licenses_limit" => ValidationErrorCode.LicensesLimit,
            "user_limit" => ValidationErrorCode.UserLimit,
            "unique_limit" => ValidationErrorCode.UniqueLimit,
            "general_limit" => ValidationErrorCode.GeneralLimit,
            "unhandled" => ValidationErrorCode.Unhandled,
            "trigger_not_found" => ValidationErrorCode.TriggerNotFound,
            "trigger_expired" => ValidationErrorCode.TriggerExpired,
            "required" => ValidationErrorCode.Required,
            "in" => ValidationErrorCode.In,
            "not_applicable" => ValidationErrorCode.NotApplicable,
            "self_update" => ValidationErrorCode.SelfUpdate,
            "owner_protected" => ValidationErrorCode.OwnerProtected,
            "already_assigned" => ValidationErrorCode.AlreadyAssigned,
            "forbidden" => ValidationErrorCode.Forbidden,
            "permission_denied" => ValidationErrorCode.PermissionDenied,
            "access_denied" => ValidationErrorCode.AccessDenied,
            "wrong_params" => ValidationErrorCode.WrongParams,
            "payment_required" => ValidationErrorCode.PaymentRequired,
            "min_length" => ValidationErrorCode.MinLength,
            "max_length" => ValidationErrorCode.MaxLength,
            "use_of_system_words" => ValidationErrorCode.UseOfSystemWords,
            _ => throw new JsonException($"Unknown ValidationErrorCode value: {value}"),
        };
    }

    public override void Write(Utf8JsonWriter writer, ValidationErrorCode value, JsonSerializerOptions options)
    {
        var str = value switch
        {
            ValidationErrorCode.Blank => "blank",
            ValidationErrorCode.TooLong => "too_long",
            ValidationErrorCode.Invalid => "invalid",
            ValidationErrorCode.Inclusion => "inclusion",
            ValidationErrorCode.Exclusion => "exclusion",
            ValidationErrorCode.Taken => "taken",
            ValidationErrorCode.WrongEmoji => "wrong_emoji",
            ValidationErrorCode.NotFound => "not_found",
            ValidationErrorCode.AlreadyExists => "already_exists",
            ValidationErrorCode.PersonalChat => "personal_chat",
            ValidationErrorCode.DisplayedError => "displayed_error",
            ValidationErrorCode.NotAuthorized => "not_authorized",
            ValidationErrorCode.InvalidDateRange => "invalid_date_range",
            ValidationErrorCode.InvalidWebhookUrl => "invalid_webhook_url",
            ValidationErrorCode.RateLimit => "rate_limit",
            ValidationErrorCode.LicensesLimit => "licenses_limit",
            ValidationErrorCode.UserLimit => "user_limit",
            ValidationErrorCode.UniqueLimit => "unique_limit",
            ValidationErrorCode.GeneralLimit => "general_limit",
            ValidationErrorCode.Unhandled => "unhandled",
            ValidationErrorCode.TriggerNotFound => "trigger_not_found",
            ValidationErrorCode.TriggerExpired => "trigger_expired",
            ValidationErrorCode.Required => "required",
            ValidationErrorCode.In => "in",
            ValidationErrorCode.NotApplicable => "not_applicable",
            ValidationErrorCode.SelfUpdate => "self_update",
            ValidationErrorCode.OwnerProtected => "owner_protected",
            ValidationErrorCode.AlreadyAssigned => "already_assigned",
            ValidationErrorCode.Forbidden => "forbidden",
            ValidationErrorCode.PermissionDenied => "permission_denied",
            ValidationErrorCode.AccessDenied => "access_denied",
            ValidationErrorCode.WrongParams => "wrong_params",
            ValidationErrorCode.PaymentRequired => "payment_required",
            ValidationErrorCode.MinLength => "min_length",
            ValidationErrorCode.MaxLength => "max_length",
            ValidationErrorCode.UseOfSystemWords => "use_of_system_words",
            _ => value.ToString(),
        };
        writer.WriteStringValue(str);
    }
}

/// <summary>Тип события webhook</summary>
[JsonConverter(typeof(WebhookEventTypeConverter))]
public enum WebhookEventType
{
    /// <summary>Создание</summary>
    New,
    /// <summary>Обновление</summary>
    Update,
    /// <summary>Удаление</summary>
    Delete,
}

internal class WebhookEventTypeConverter : JsonConverter<WebhookEventType>
{
    public override WebhookEventType Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        var value = reader.GetString();
        return value switch
        {
            "new" => WebhookEventType.New,
            "update" => WebhookEventType.Update,
            "delete" => WebhookEventType.Delete,
            _ => throw new JsonException($"Unknown WebhookEventType value: {value}"),
        };
    }

    public override void Write(Utf8JsonWriter writer, WebhookEventType value, JsonSerializerOptions options)
    {
        var str = value switch
        {
            WebhookEventType.New => "new",
            WebhookEventType.Update => "update",
            WebhookEventType.Delete => "delete",
            _ => value.ToString(),
        };
        writer.WriteStringValue(str);
    }
}

[JsonPolymorphic(TypeDiscriminatorPropertyName = "type")]
[JsonDerivedType(typeof(AuditDetailsEmpty), "")]
[JsonDerivedType(typeof(AuditDetailsUserUpdated), "")]
[JsonDerivedType(typeof(AuditDetailsRoleChanged), "")]
[JsonDerivedType(typeof(AuditDetailsTagName), "")]
[JsonDerivedType(typeof(AuditDetailsInitiator), "")]
[JsonDerivedType(typeof(AuditDetailsInviter), "")]
[JsonDerivedType(typeof(AuditDetailsChatRenamed), "")]
[JsonDerivedType(typeof(AuditDetailsChatPermission), "")]
[JsonDerivedType(typeof(AuditDetailsTagChat), "")]
[JsonDerivedType(typeof(AuditDetailsChatId), "")]
[JsonDerivedType(typeof(AuditDetailsTokenScopes), "")]
[JsonDerivedType(typeof(AuditDetailsKms), "")]
[JsonDerivedType(typeof(AuditDetailsDlp), "")]
[JsonDerivedType(typeof(AuditDetailsSearch), "")]
public abstract class AuditEventDetailsUnion
{
    [JsonPropertyName("type")]
    public abstract string Type { get; }
}

public class AuditDetailsEmpty : AuditEventDetailsUnion
{
    public override string Type => "";
}

public class AuditDetailsUserUpdated : AuditEventDetailsUnion
{
    public override string Type => "";
    [JsonPropertyName("changed_attrs")]
    public List<string> ChangedAttrs { get; set; } = default!;
}

public class AuditDetailsRoleChanged : AuditEventDetailsUnion
{
    public override string Type => "";
    [JsonPropertyName("new_company_role")]
    public string NewCompanyRole { get; set; } = default!;
    [JsonPropertyName("previous_company_role")]
    public string PreviousCompanyRole { get; set; } = default!;
    [JsonPropertyName("initiator_id")]
    public int InitiatorId { get; set; } = default!;
}

public class AuditDetailsTagName : AuditEventDetailsUnion
{
    public override string Type => "";
    [JsonPropertyName("name")]
    public string Name { get; set; } = default!;
}

public class AuditDetailsInitiator : AuditEventDetailsUnion
{
    public override string Type => "";
    [JsonPropertyName("initiator_id")]
    public int InitiatorId { get; set; } = default!;
}

public class AuditDetailsInviter : AuditEventDetailsUnion
{
    public override string Type => "";
    [JsonPropertyName("inviter_id")]
    public int InviterId { get; set; } = default!;
}

public class AuditDetailsChatRenamed : AuditEventDetailsUnion
{
    public override string Type => "";
    [JsonPropertyName("old_name")]
    public string OldName { get; set; } = default!;
    [JsonPropertyName("new_name")]
    public string NewName { get; set; } = default!;
}

public class AuditDetailsChatPermission : AuditEventDetailsUnion
{
    public override string Type => "";
    [JsonPropertyName("public_access")]
    public bool PublicAccess { get; set; } = default!;
}

public class AuditDetailsTagChat : AuditEventDetailsUnion
{
    public override string Type => "";
    [JsonPropertyName("chat_id")]
    public int ChatId { get; set; } = default!;
    [JsonPropertyName("tag_name")]
    public string TagName { get; set; } = default!;
}

public class AuditDetailsChatId : AuditEventDetailsUnion
{
    public override string Type => "";
    [JsonPropertyName("chat_id")]
    public int ChatId { get; set; } = default!;
}

public class AuditDetailsTokenScopes : AuditEventDetailsUnion
{
    public override string Type => "";
    [JsonPropertyName("scopes")]
    public List<string> Scopes { get; set; } = default!;
}

public class AuditDetailsKms : AuditEventDetailsUnion
{
    public override string Type => "";
    [JsonPropertyName("chat_id")]
    public int ChatId { get; set; } = default!;
    [JsonPropertyName("message_id")]
    public int MessageId { get; set; } = default!;
    [JsonPropertyName("reason")]
    public string Reason { get; set; } = default!;
}

public class AuditDetailsDlp : AuditEventDetailsUnion
{
    public override string Type => "";
    [JsonPropertyName("dlp_rule_id")]
    public int DlpRuleId { get; set; } = default!;
    [JsonPropertyName("dlp_rule_name")]
    public string DlpRuleName { get; set; } = default!;
    [JsonPropertyName("message_id")]
    public int MessageId { get; set; } = default!;
    [JsonPropertyName("chat_id")]
    public int ChatId { get; set; } = default!;
    [JsonPropertyName("user_id")]
    public int UserId { get; set; } = default!;
    [JsonPropertyName("action_message")]
    public string ActionMessage { get; set; } = default!;
    [JsonPropertyName("conditions_matched")]
    public bool ConditionsMatched { get; set; } = default!;
}

public class AuditDetailsSearch : AuditEventDetailsUnion
{
    public override string Type => "";
    [JsonPropertyName("search_type")]
    public string SearchType { get; set; } = default!;
    [JsonPropertyName("query_present")]
    public bool QueryPresent { get; set; } = default!;
    [JsonPropertyName("cursor_present")]
    public bool CursorPresent { get; set; } = default!;
    [JsonPropertyName("limit")]
    public int Limit { get; set; } = default!;
    [JsonPropertyName("filters")]
    public Dictionary<string, string> Filters { get; set; } = default!;
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
    public override string Type => "header";
    [JsonPropertyName("text")]
    public string Text { get; set; } = default!;
}

public class ViewBlockPlainText : ViewBlockUnion
{
    public override string Type => "plain_text";
    [JsonPropertyName("text")]
    public string Text { get; set; } = default!;
}

public class ViewBlockMarkdown : ViewBlockUnion
{
    public override string Type => "markdown";
    [JsonPropertyName("text")]
    public string Text { get; set; } = default!;
}

public class ViewBlockDivider : ViewBlockUnion
{
    public override string Type => "divider";
}

public class ViewBlockInput : ViewBlockUnion
{
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
    public override string Type => "select";
    [JsonPropertyName("name")]
    public string Name { get; set; } = default!;
    [JsonPropertyName("label")]
    public string Label { get; set; } = default!;
    [JsonPropertyName("options")]
    public List<ViewBlockSelectableOption>? Options { get; set; }
    [JsonPropertyName("required")]
    public bool? Required { get; set; }
    [JsonPropertyName("hint")]
    public string? Hint { get; set; }
}

public class ViewBlockRadio : ViewBlockUnion
{
    public override string Type => "radio";
    [JsonPropertyName("name")]
    public string Name { get; set; } = default!;
    [JsonPropertyName("label")]
    public string Label { get; set; } = default!;
    [JsonPropertyName("options")]
    public List<ViewBlockSelectableOption>? Options { get; set; }
    [JsonPropertyName("required")]
    public bool? Required { get; set; }
    [JsonPropertyName("hint")]
    public string? Hint { get; set; }
}

public class ViewBlockCheckbox : ViewBlockUnion
{
    public override string Type => "checkbox";
    [JsonPropertyName("name")]
    public string Name { get; set; } = default!;
    [JsonPropertyName("label")]
    public string Label { get; set; } = default!;
    [JsonPropertyName("options")]
    public List<ViewBlockCheckboxOption>? Options { get; set; }
    [JsonPropertyName("required")]
    public bool? Required { get; set; }
    [JsonPropertyName("hint")]
    public string? Hint { get; set; }
}

public class ViewBlockDate : ViewBlockUnion
{
    public override string Type => "date";
    [JsonPropertyName("name")]
    public string Name { get; set; } = default!;
    [JsonPropertyName("label")]
    public string Label { get; set; } = default!;
    [JsonPropertyName("initial_date")]
    public DateOnly? InitialDate { get; set; }
    [JsonPropertyName("required")]
    public bool? Required { get; set; }
    [JsonPropertyName("hint")]
    public string? Hint { get; set; }
}

public class ViewBlockTime : ViewBlockUnion
{
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

[JsonPolymorphic(TypeDiscriminatorPropertyName = "type")]
[JsonDerivedType(typeof(MessageWebhookPayload), "message")]
[JsonDerivedType(typeof(ReactionWebhookPayload), "reaction")]
[JsonDerivedType(typeof(ButtonWebhookPayload), "button")]
[JsonDerivedType(typeof(ViewSubmitWebhookPayload), "view")]
[JsonDerivedType(typeof(ChatMemberWebhookPayload), "chat_member")]
[JsonDerivedType(typeof(CompanyMemberWebhookPayload), "company_member")]
[JsonDerivedType(typeof(LinkSharedWebhookPayload), "message")]
public abstract class WebhookPayloadUnion
{
    [JsonPropertyName("type")]
    public abstract string Type { get; }
}

public class MessageWebhookPayload : WebhookPayloadUnion
{
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
    public override string Type => "reaction";
    [JsonPropertyName("event")]
    public ReactionEventType @Event { get; set; } = default!;
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
    public override string Type => "button";
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
    public override string Type => "view";
    [JsonPropertyName("callback_id")]
    public string? CallbackId { get; set; }
    [JsonPropertyName("private_metadata")]
    public string? PrivateMetadata { get; set; }
    [JsonPropertyName("user_id")]
    public int UserId { get; set; } = default!;
    [JsonPropertyName("data")]
    public Dictionary<string, string> Data { get; set; } = default!;
    [JsonPropertyName("webhook_timestamp")]
    public int WebhookTimestamp { get; set; } = default!;
}

public class ChatMemberWebhookPayload : WebhookPayloadUnion
{
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
    public override string Type => "message";
    [JsonPropertyName("chat_id")]
    public int ChatId { get; set; } = default!;
    [JsonPropertyName("message_id")]
    public int MessageId { get; set; } = default!;
    [JsonPropertyName("links")]
    public List<WebhookLink> Links { get; set; } = default!;
    [JsonPropertyName("user_id")]
    public int UserId { get; set; } = default!;
    [JsonPropertyName("created_at")]
    public DateTimeOffset CreatedAt { get; set; } = default!;
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
}

public class ApiErrorItem
{
    [JsonPropertyName("key")]
    public string Key { get; set; } = default!;
    [JsonPropertyName("value")]
    public string? Value { get; set; }
    [JsonPropertyName("message")]
    public string Message { get; set; } = default!;
    [JsonPropertyName("code")]
    public ValidationErrorCode Code { get; set; } = default!;
    [JsonPropertyName("payload")]
    public Dictionary<string, string>? Payload { get; set; }
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
    public string IpAddress { get; set; } = default!;
    [JsonPropertyName("user_agent")]
    public string UserAgent { get; set; } = default!;
}

public class BotResponseWebhook
{
    [JsonPropertyName("outgoing_url")]
    public string OutgoingUrl { get; set; } = default!;
}

public class BotResponse
{
    [JsonPropertyName("id")]
    public int Id { get; set; } = default!;
    [JsonPropertyName("webhook")]
    public BotResponseWebhook Webhook { get; set; } = default!;
}

public class BotUpdateRequestBotWebhook
{
    [JsonPropertyName("outgoing_url")]
    public string OutgoingUrl { get; set; } = default!;
}

public class BotUpdateRequestBot
{
    [JsonPropertyName("webhook")]
    public BotUpdateRequestBotWebhook Webhook { get; set; } = default!;
}

public class BotUpdateRequest
{
    [JsonPropertyName("bot")]
    public BotUpdateRequestBot Bot { get; set; } = default!;
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
    [JsonPropertyName("personal")]
    public bool Personal { get; set; } = default!;
    [JsonPropertyName("public")]
    public bool @Public { get; set; } = default!;
    [JsonPropertyName("last_message_at")]
    public DateTimeOffset LastMessageAt { get; set; } = default!;
    [JsonPropertyName("meet_room_url")]
    public string MeetRoomUrl { get; set; } = default!;
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

public class CustomProperty
{
    [JsonPropertyName("id")]
    public int Id { get; set; } = default!;
    [JsonPropertyName("name")]
    public string Name { get; set; } = default!;
    [JsonPropertyName("data_type")]
    public CustomPropertyDataType DataType { get; set; } = default!;
    [JsonPropertyName("value")]
    public string Value { get; set; } = default!;
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

public class ExportRequest
{
    [JsonPropertyName("start_at")]
    public DateOnly StartAt { get; set; } = default!;
    [JsonPropertyName("end_at")]
    public DateOnly EndAt { get; set; } = default!;
    [JsonPropertyName("webhook_url")]
    public string WebhookUrl { get; set; } = default!;
    [JsonPropertyName("chat_ids")]
    public List<int>? ChatIds { get; set; }
    [JsonPropertyName("skip_chats_file")]
    public bool? SkipChatsFile { get; set; }
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
}

public class FileUploadRequest
{
    [JsonPropertyName("Content-Disposition")]
    public string ContentDisposition { get; set; } = default!;
    [JsonPropertyName("acl")]
    public string Acl { get; set; } = default!;
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
    public int Size { get; set; } = default!;
    [JsonPropertyName("width")]
    public int? Width { get; set; }
    [JsonPropertyName("height")]
    public int? Height { get; set; }
}

public class MessageCreateRequestMessage
{
    [JsonPropertyName("entity_type")]
    public MessageEntityType? EntityType { get; set; }
    [JsonPropertyName("entity_id")]
    public int EntityId { get; set; } = default!;
    [JsonPropertyName("content")]
    public string Content { get; set; } = default!;
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
    public string? FileType { get; set; }
    [JsonPropertyName("size")]
    public int? Size { get; set; }
    [JsonPropertyName("width")]
    public int? Width { get; set; }
    [JsonPropertyName("height")]
    public int? Height { get; set; }
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
    public string Error { get; set; } = default!;
    [JsonPropertyName("error_description")]
    public string ErrorDescription { get; set; } = default!;
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

public class PaginationMetaPaginate
{
    [JsonPropertyName("next_page")]
    public string NextPage { get; set; } = default!;
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
    public string? Name { get; set; }
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
    public string Emoji { get; set; } = default!;
    [JsonPropertyName("title")]
    public string Title { get; set; } = default!;
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
    public long MessageId { get; set; } = default!;
    [JsonPropertyName("message_chat_id")]
    public long MessageChatId { get; set; } = default!;
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
    public string Acl { get; set; } = default!;
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
    [JsonPropertyName("direct_url")]
    public string DirectUrl { get; set; } = default!;
}

public class User
{
    [JsonPropertyName("id")]
    public int Id { get; set; } = default!;
    [JsonPropertyName("first_name")]
    public string FirstName { get; set; } = default!;
    [JsonPropertyName("last_name")]
    public string LastName { get; set; } = default!;
    [JsonPropertyName("nickname")]
    public string Nickname { get; set; } = default!;
    [JsonPropertyName("email")]
    public string Email { get; set; } = default!;
    [JsonPropertyName("phone_number")]
    public string PhoneNumber { get; set; } = default!;
    [JsonPropertyName("department")]
    public string Department { get; set; } = default!;
    [JsonPropertyName("title")]
    public string Title { get; set; } = default!;
    [JsonPropertyName("role")]
    public UserRole Role { get; set; } = default!;
    [JsonPropertyName("suspended")]
    public bool Suspended { get; set; } = default!;
    [JsonPropertyName("invite_status")]
    public InviteStatus InviteStatus { get; set; } = default!;
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
    public DateTimeOffset LastActivityAt { get; set; } = default!;
    [JsonPropertyName("time_zone")]
    public string TimeZone { get; set; } = default!;
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
    public UserRoleInput? Role { get; set; }
    [JsonPropertyName("suspended")]
    public bool? Suspended { get; set; }
    [JsonPropertyName("list_tags")]
    public List<string>? ListTags { get; set; }
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

public class ViewBlockSelectableOption
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

public class WebhookLink
{
    [JsonPropertyName("url")]
    public string Url { get; set; } = default!;
    [JsonPropertyName("domain")]
    public string Domain { get; set; } = default!;
}

public class WebhookMessageThread
{
    [JsonPropertyName("message_id")]
    public int MessageId { get; set; } = default!;
    [JsonPropertyName("message_chat_id")]
    public int MessageChatId { get; set; } = default!;
}

public class GetAuditEventsResponse
{
    [JsonPropertyName("data")]
    public List<AuditEvent> Data { get; set; } = new();
    [JsonPropertyName("meta")]
    public PaginationMeta Meta { get; set; } = default!;
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

public class ListPropertiesResponse
{
    [JsonPropertyName("data")]
    public List<CustomPropertyDefinition> Data { get; set; } = new();
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

public class ChatDataWrapper
{
    [JsonPropertyName("data")]
    public Chat Data { get; set; } = default!;
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
