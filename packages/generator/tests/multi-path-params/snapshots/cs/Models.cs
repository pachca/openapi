#nullable enable

using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Pachca.Sdk;

public class Task
{
    [JsonPropertyName("id")]
    public int Id { get; set; } = default!;
    [JsonPropertyName("title")]
    public string Title { get; set; } = default!;
    [JsonPropertyName("is_done")]
    public bool? IsDone { get; set; }
}

public class TaskUpdateRequestTask
{
    [JsonPropertyName("title")]
    public string? Title { get; set; }
    [JsonPropertyName("is_done")]
    public bool? IsDone { get; set; }
}

public class TaskUpdateRequest
{
    [JsonPropertyName("task")]
    public TaskUpdateRequestTask Task { get; set; } = default!;
}

public class TaskDataWrapper
{
    [JsonPropertyName("data")]
    public Task Data { get; set; } = default!;
}
