#nullable enable

using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Pachca.Sdk;

[JsonPolymorphic(TypeDiscriminatorPropertyName = "type")]
[JsonDerivedType(typeof(ViewBlockHeader), "header")]
[JsonDerivedType(typeof(ViewBlockPlainText), "plain_text")]
[JsonDerivedType(typeof(ViewBlockImage), "image")]
public abstract class ViewBlockUnion
{
    [JsonPropertyName("type")]
    public abstract string Type { get; }
}

public class ViewBlockHeader : ViewBlockUnion
{
    [JsonPropertyName("type")]
    public override string Type => "header";
    [JsonPropertyName("text")]
    public string Text { get; set; } = default!;
}

public class ViewBlockPlainText : ViewBlockUnion
{
    [JsonPropertyName("type")]
    public override string Type => "plain_text";
    [JsonPropertyName("text")]
    public string Text { get; set; } = default!;
}

public class ViewBlockImage : ViewBlockUnion
{
    [JsonPropertyName("type")]
    public override string Type => "image";
    [JsonPropertyName("event")]
    public string @Event => "image_shared";
    [JsonPropertyName("url")]
    public string Url { get; set; } = default!;
    [JsonPropertyName("alt")]
    public string? Alt { get; set; }
}
