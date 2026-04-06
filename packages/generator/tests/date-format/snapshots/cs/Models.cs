#nullable enable

using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Pachca.Sdk;

public class ExportRequest
{
    [JsonPropertyName("start_at")]
    public DateOnly StartAt { get; set; } = default!;
    [JsonPropertyName("end_at")]
    public DateOnly EndAt { get; set; } = default!;
    [JsonPropertyName("webhook_url")]
    public string WebhookUrl { get; set; } = default!;
}

public class Export
{
    [JsonPropertyName("id")]
    public int Id { get; set; } = default!;
    [JsonPropertyName("start_at")]
    public DateOnly StartAt { get; set; } = default!;
    [JsonPropertyName("end_at")]
    public DateOnly EndAt { get; set; } = default!;
    [JsonPropertyName("status")]
    public string Status { get; set; } = default!;
    [JsonPropertyName("created_at")]
    public DateTimeOffset CreatedAt { get; set; } = default!;
}

public class Event
{
    [JsonPropertyName("id")]
    public int Id { get; set; } = default!;
    [JsonPropertyName("type")]
    public string Type { get; set; } = default!;
    [JsonPropertyName("occurred_at")]
    public DateTimeOffset OccurredAt { get; set; } = default!;
}

public class OAuthError : Exception
{
    [JsonPropertyName("error")]
    public string? Error { get; set; }
}

public class ListEventsResponse
{
    [JsonPropertyName("data")]
    public List<Event> Data { get; set; } = new();
}

public class ExportDataWrapper
{
    [JsonPropertyName("data")]
    public Export Data { get; set; } = default!;
}
