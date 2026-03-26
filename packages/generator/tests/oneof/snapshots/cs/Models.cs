#nullable enable

using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Pachca.Sdk;

[JsonPolymorphic(TypeDiscriminatorPropertyName = "kind")]
[JsonDerivedType(typeof(TextContent), "text")]
[JsonDerivedType(typeof(ImageContent), "image")]
[JsonDerivedType(typeof(VideoContent), "video")]
public abstract class ContentBlock
{
    [JsonPropertyName("kind")]
    public abstract string Kind { get; }
}

public class TextContent : ContentBlock
{
    public override string Kind => "text";
    [JsonPropertyName("text")]
    public string Text { get; set; } = default!;
}

public class ImageContent : ContentBlock
{
    public override string Kind => "image";
    [JsonPropertyName("url")]
    public string Url { get; set; } = default!;
    [JsonPropertyName("caption")]
    public string? Caption { get; set; }
}

public class VideoContent : ContentBlock
{
    public override string Kind => "video";
    [JsonPropertyName("url")]
    public string Url { get; set; } = default!;
    [JsonPropertyName("duration")]
    public int? Duration { get; set; }
}
