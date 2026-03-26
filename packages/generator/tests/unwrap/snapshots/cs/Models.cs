#nullable enable

using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Pachca.Sdk;

public class AddMembersRequest
{
    [JsonPropertyName("member_ids")]
    public List<int> MemberIds { get; set; } = default!;
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

public class ChatDataWrapper
{
    [JsonPropertyName("data")]
    public Chat Data { get; set; } = default!;
}
