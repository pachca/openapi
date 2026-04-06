#nullable enable

using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Pachca.Sdk;

/// <summary>Роль пользователя</summary>
[JsonConverter(typeof(UserRoleConverter))]
public enum UserRole
{
    /// <summary>Администратор</summary>
    Admin,
    /// <summary>Сотрудник</summary>
    User,
    /// <summary>Мультиадмин</summary>
    MultiAdmin,
    /// <summary>Бот</summary>
    Bot,
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
            "multi_admin" => UserRole.MultiAdmin,
            "bot" => UserRole.Bot,
            _ => throw new JsonException($"Unknown UserRole value: {value}"),
        };
    }

    public override void Write(Utf8JsonWriter writer, UserRole value, JsonSerializerOptions options)
    {
        var str = value switch
        {
            UserRole.Admin => "admin",
            UserRole.User => "user",
            UserRole.MultiAdmin => "multi_admin",
            UserRole.Bot => "bot",
            _ => value.ToString(),
        };
        writer.WriteStringValue(str);
    }
}

public class User
{
    [JsonPropertyName("id")]
    public int Id { get; set; } = default!;
    [JsonPropertyName("first_name")]
    public string FirstName { get; set; } = default!;
    [JsonPropertyName("last_name")]
    public string LastName { get; set; } = default!;
    [JsonPropertyName("email")]
    public string Email { get; set; } = default!;
    [JsonPropertyName("phone_number")]
    public string? PhoneNumber { get; set; }
    [JsonPropertyName("role")]
    public UserRole Role { get; set; } = default!;
    [JsonPropertyName("is_active")]
    public bool IsActive { get; set; } = default!;
    [JsonPropertyName("bot_id")]
    public long? BotId { get; set; }
    [JsonPropertyName("created_at")]
    public DateTimeOffset CreatedAt { get; set; } = default!;
    [JsonPropertyName("birthday")]
    public string? Birthday { get; set; }
    [JsonPropertyName("tag_ids")]
    public List<int> TagIds { get; set; } = default!;
    [JsonPropertyName("custom_properties")]
    public List<CustomProperty>? CustomProperties { get; set; }
    [JsonPropertyName("status")]
    public UserStatus? Status { get; set; }
}

public class UserStatus
{
    [JsonPropertyName("emoji")]
    public string? Emoji { get; set; }
    [JsonPropertyName("title")]
    public string? Title { get; set; }
    [JsonPropertyName("expires_at")]
    public DateTimeOffset? ExpiresAt { get; set; }
}

public class CustomProperty
{
    [JsonPropertyName("id")]
    public int Id { get; set; } = default!;
    [JsonPropertyName("name")]
    public string Name { get; set; } = default!;
    [JsonPropertyName("data_type")]
    public string DataType { get; set; } = default!;
    [JsonPropertyName("value")]
    public string Value { get; set; } = default!;
}

public class UserCreateRequestUser
{
    [JsonPropertyName("first_name")]
    public string FirstName { get; set; } = default!;
    [JsonPropertyName("last_name")]
    public string LastName { get; set; } = default!;
    [JsonPropertyName("email")]
    public string Email { get; set; } = default!;
    [JsonPropertyName("role")]
    public UserRole? Role { get; set; }
    [JsonPropertyName("is_active")]
    public bool? IsActive { get; set; }
}

public class UserCreateRequest
{
    [JsonPropertyName("user")]
    public UserCreateRequestUser User { get; set; } = default!;
}

public class UserUpdateRequestUser
{
    [JsonPropertyName("first_name")]
    public string? FirstName { get; set; }
    [JsonPropertyName("last_name")]
    public string? LastName { get; set; }
    [JsonPropertyName("phone_number")]
    public string? PhoneNumber { get; set; }
    [JsonPropertyName("role")]
    public UserRole? Role { get; set; }
}

public class UserUpdateRequest
{
    [JsonPropertyName("user")]
    public UserUpdateRequestUser User { get; set; } = default!;
}

public class MessageCreateRequestFile
{
    [JsonPropertyName("key")]
    public string Key { get; set; } = default!;
    [JsonPropertyName("name")]
    public string Name { get; set; } = default!;
    [JsonPropertyName("file_type")]
    public string FileType { get; set; } = default!;
    [JsonPropertyName("size")]
    public int Size { get; set; } = default!;
}

public class MessageCreateRequestButton
{
    [JsonPropertyName("text")]
    public string Text { get; set; } = default!;
    [JsonPropertyName("url")]
    public string? Url { get; set; }
    [JsonPropertyName("data")]
    public string? Data { get; set; }
}

public class MessageCreateRequestMessage
{
    [JsonPropertyName("entity_id")]
    public int EntityId { get; set; } = default!;
    [JsonPropertyName("content")]
    public string Content { get; set; } = default!;
    [JsonPropertyName("files")]
    public List<MessageCreateRequestFile>? Files { get; set; }
    [JsonPropertyName("buttons")]
    public List<List<MessageCreateRequestButton>>? Buttons { get; set; }
}

public class MessageCreateRequest
{
    [JsonPropertyName("message")]
    public MessageCreateRequestMessage Message { get; set; } = default!;
}

public class ApiErrorItem
{
    [JsonPropertyName("key")]
    public string? Key { get; set; }
    [JsonPropertyName("value")]
    public string? Value { get; set; }
}

public class ApiError : Exception
{
    [JsonPropertyName("errors")]
    public List<ApiErrorItem>? Errors { get; set; }
}

public class OAuthError : Exception
{
    [JsonPropertyName("error")]
    public string? Error { get; set; }
}

public class PaginationMetaPaginate
{
    [JsonPropertyName("next_page")]
    public string? NextPage { get; set; }
}

public class PaginationMeta
{
    [JsonPropertyName("paginate")]
    public PaginationMetaPaginate? Paginate { get; set; }
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
