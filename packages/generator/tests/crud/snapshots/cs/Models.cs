#nullable enable

using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Pachca.Sdk;

[JsonConverter(typeof(SortOrderConverter))]
public enum SortOrder
{
    Asc,
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

[JsonConverter(typeof(ChatAvailabilityConverter))]
public enum ChatAvailability
{
    /// <summary>Чаты, где пользователь является участником</summary>
    IsMember,
    /// <summary>Все открытые чаты компании</summary>
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

public class Chat
{
    [JsonPropertyName("id")]
    public int Id { get; set; } = default!;
    [JsonPropertyName("name")]
    public string Name { get; set; } = default!;
    [JsonPropertyName("is_channel")]
    public bool IsChannel { get; set; } = default!;
    [JsonPropertyName("is_public")]
    public bool IsPublic { get; set; } = default!;
    [JsonPropertyName("created_at")]
    public DateTimeOffset CreatedAt { get; set; } = default!;
    [JsonPropertyName("member_ids")]
    public List<int>? MemberIds { get; set; }
}

public class ChatCreateRequestChat
{
    [JsonPropertyName("name")]
    public string Name { get; set; } = default!;
    [JsonPropertyName("channel")]
    public bool? Channel { get; set; }
    [JsonPropertyName("public")]
    public bool? @Public { get; set; }
    [JsonPropertyName("member_ids")]
    public List<int>? MemberIds { get; set; }
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

public class ListChatsResponse
{
    [JsonPropertyName("data")]
    public List<Chat> Data { get; set; } = new();
    [JsonPropertyName("meta")]
    public PaginationMeta? Meta { get; set; }
}

public class ChatDataWrapper
{
    [JsonPropertyName("data")]
    public Chat Data { get; set; } = default!;
}
