#nullable enable

using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Pachca.Sdk;

public class ChatCreateRequestChat
{
    [JsonPropertyName("name")]
    public string Name { get; set; } = default!;
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

public class ChatUpdateMeta
{
    [JsonPropertyName("changed_fields")]
    public List<string> ChangedFields { get; set; } = default!;
}

public class Chat
{
    [JsonPropertyName("id")]
    public int Id { get; set; } = default!;
    [JsonPropertyName("name")]
    public string Name { get; set; } = default!;
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

    public override string Message => Error ?? "oauth error";
}

public class CreateChatResponseMeta
{
    [JsonPropertyName("not_found_member_ids")]
    public List<int> NotFoundMemberIds { get; set; } = default!;
}

public class CreateChatResponse
{
    [JsonPropertyName("data")]
    public Chat Data { get; set; } = default!;
    [JsonPropertyName("meta")]
    public CreateChatResponseMeta Meta { get; set; } = default!;
}

public class UpdateChatResponse
{
    [JsonPropertyName("data")]
    public Chat Data { get; set; } = default!;
    [JsonPropertyName("meta")]
    public ChatUpdateMeta? Meta { get; set; }
}

public class ChatDataWrapper
{
    [JsonPropertyName("data")]
    public Chat Data { get; set; } = default!;
}
