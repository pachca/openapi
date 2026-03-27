#nullable enable

using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Pachca.Sdk;

public class Item
{
    [JsonPropertyName("id")]
    public int Id { get; set; } = default!;
    [JsonPropertyName("name")]
    public string Name { get; set; } = default!;
    [JsonPropertyName("description")]
    public string? Description { get; set; }
    [JsonPropertyName("priority")]
    public int? Priority { get; set; }
}

public class ItemPatchRequestItem
{
    [JsonPropertyName("name")]
    public string? Name { get; set; }
    [JsonPropertyName("description")]
    public string? Description { get; set; }
    [JsonPropertyName("priority")]
    public int? Priority { get; set; }
}

public class ItemPatchRequest
{
    [JsonPropertyName("item")]
    public ItemPatchRequestItem Item { get; set; } = default!;
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

public class ItemDataWrapper
{
    [JsonPropertyName("data")]
    public Item Data { get; set; } = default!;
}
