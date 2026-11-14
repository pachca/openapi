#nullable enable

using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Pachca.Sdk;

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

public class ApiErrorItem
{
    [JsonPropertyName("key")]
    public string? Key { get; set; }
    [JsonPropertyName("message")]
    public string Message { get; set; } = default!;
}

public class ApiError : Exception
{
    [JsonPropertyName("errors")]
    public List<ApiErrorItem> Errors { get; set; } = default!;

    /// <summary>HTTP status code of the answer, set by the client. An empty body or one that is not JSON leaves Errors empty.</summary>
    [JsonIgnore]
    public int? StatusCode { get; set; }
}

public class OAuthError : Exception
{
    [JsonPropertyName("error")]
    public string? Error { get; set; }

    public override string Message => Error ?? "oauth error";
}

public class ListReadMembersResponse
{
    [JsonPropertyName("data")]
    public List<int> Data { get; set; } = new();
    [JsonPropertyName("meta")]
    public PaginationMeta Meta { get; set; } = default!;
}
