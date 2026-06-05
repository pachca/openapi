#nullable enable

using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Pachca.Sdk;

public class BaseEntity
{
    [JsonPropertyName("id")]
    public int Id { get; set; } = default!;
    [JsonPropertyName("created_at")]
    public DateTimeOffset CreatedAt { get; set; } = default!;
}

public class Article
{
    [JsonPropertyName("id")]
    public int Id { get; set; } = default!;
    [JsonPropertyName("created_at")]
    public DateTimeOffset CreatedAt { get; set; } = default!;
    [JsonPropertyName("title")]
    public string Title { get; set; } = default!;
    [JsonPropertyName("body")]
    public string Body { get; set; } = default!;
    [JsonPropertyName("is_published")]
    public bool? IsPublished { get; set; }
}
