#nullable enable

using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Pachca.Sdk;

public class LinkPreview
{
    [JsonPropertyName("title")]
    public string Title { get; set; } = default!;
    [JsonPropertyName("description")]
    public string? Description { get; set; }
    [JsonPropertyName("image_url")]
    public string? ImageUrl { get; set; }
}

public class LinkPreviewsRequest
{
    [JsonPropertyName("link_previews")]
    public Dictionary<string, LinkPreview> LinkPreviews { get; set; } = default!;
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
