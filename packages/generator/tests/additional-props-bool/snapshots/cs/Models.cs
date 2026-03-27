#nullable enable

using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Pachca.Sdk;

public class Metadata { }

public class Event
{
    [JsonPropertyName("id")]
    public int Id { get; set; } = default!;
    [JsonPropertyName("type")]
    public string Type { get; set; } = default!;
    [JsonPropertyName("metadata")]
    public Dictionary<string, object>? Metadata { get; set; }
}
