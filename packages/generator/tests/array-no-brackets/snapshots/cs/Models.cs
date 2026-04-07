#nullable enable

using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Pachca.Sdk;

public class MessageResult
{
    [JsonPropertyName("id")]
    public int Id { get; set; } = default!;
    [JsonPropertyName("content")]
    public string Content { get; set; } = default!;
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

public class OAuthError : Exception
{
    [JsonPropertyName("error")]
    public string? Error { get; set; }
}

public class SearchMessagesResponse
{
    [JsonPropertyName("data")]
    public List<MessageResult> Data { get; set; } = new();
    [JsonPropertyName("meta")]
    public PaginationMeta Meta { get; set; } = default!;
}
