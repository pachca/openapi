#nullable enable

using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Pachca.Sdk;

/// <summary>Роль пользователя</summary>
[JsonConverter(typeof(UserRoleConverter))]
public readonly struct UserRole : IEquatable<UserRole>
{
    private readonly string? _value;

    public UserRole(string value) => _value = value ?? throw new ArgumentNullException(nameof(value));

    /// <summary>Администратор</summary>
    public static UserRole Admin { get; } = new("admin");
    /// <summary>Сотрудник</summary>
    public static UserRole User { get; } = new("user");
    /// <summary>Мультиадмин</summary>
    public static UserRole MultiAdmin { get; } = new("multi_admin");
    /// <summary>Бот</summary>
    public static UserRole Bot { get; } = new("bot");

    /// <summary>Every value this SDK version lists</summary>
    public static IReadOnlyList<UserRole> Values { get; } = Array.AsReadOnly(new[] { Admin, User, MultiAdmin, Bot });

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

    public override string Message => Error ?? "oauth error";
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
