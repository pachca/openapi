#nullable enable

using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Pachca.Sdk;

public class Entity
{
    [JsonPropertyName("class")]
    public string @Class { get; set; } = default!;
    [JsonPropertyName("type")]
    public string Type { get; set; } = default!;
    [JsonPropertyName("import")]
    public bool Import { get; set; } = default!;
    [JsonPropertyName("return")]
    public string? @Return { get; set; }
    [JsonPropertyName("val")]
    public int? Val { get; set; }
}
