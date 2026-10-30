#nullable enable

using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Pachca.Sdk;

[JsonConverter(typeof(FileTypeConverter))]
public enum FileType
{
    File,
    Image,
    Voice,
}

internal class FileTypeConverter : JsonConverter<FileType>
{
    public override FileType Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        var value = reader.GetString();
        return value switch
        {
            "file" => FileType.File,
            "image" => FileType.Image,
            "voice" => FileType.Voice,
            _ => throw new JsonException($"Unknown FileType value: {value}"),
        };
    }

    public override void Write(Utf8JsonWriter writer, FileType value, JsonSerializerOptions options)
    {
        var str = value switch
        {
            FileType.File => "file",
            FileType.Image => "image",
            FileType.Voice => "voice",
            _ => value.ToString(),
        };
        writer.WriteStringValue(str);
    }
}

[JsonConverter(typeof(ButtonConverter))]
public abstract class Button
{
}

// Button carries no discriminator field: members are tried in the order
// they match the payload keys (most recognised, then fewest unrecognised, then
// fewest declared), and the first one that decodes wins.
internal sealed class ButtonConverter : JsonConverter<Button>
{
    private static readonly (Type Type, HashSet<string> Keys)[] Shapes =
    {
        (typeof(UrlButton), new HashSet<string> { "text", "url" }),
        (typeof(DataButton), new HashSet<string> { "text", "data" }),
    };

    public override Button Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        using var document = JsonDocument.ParseValue(ref reader);
        var root = document.RootElement;
        var keys = new HashSet<string>();
        if (root.ValueKind == JsonValueKind.Object)
        {
            foreach (var property in root.EnumerateObject()) keys.Add(property.Name);
        }
        // OrderBy is stable: a tie keeps the declared order.
        var ranked = Shapes
            .Select(shape => (shape.Type, Matched: keys.Count(shape.Keys.Contains), Declared: shape.Keys.Count))
            .OrderByDescending(c => c.Matched)
            .ThenBy(c => keys.Count - c.Matched)
            .ThenBy(c => c.Declared);
        var raw = root.GetRawText();
        JsonException? firstError = null;
        foreach (var candidate in ranked)
        {
            try
            {
                return (Button)JsonSerializer.Deserialize(raw, candidate.Type, options)!;
            }
            catch (JsonException e)
            {
                firstError ??= e;
            }
        }
        throw firstError ?? new JsonException("No Button member matched the payload");
    }

    public override void Write(Utf8JsonWriter writer, Button value, JsonSerializerOptions options)
    {
        JsonSerializer.Serialize(writer, (object)value, value.GetType(), options);
    }
}

public class UrlButton : Button
{
    [JsonPropertyName("text")]
    public string Text { get; set; } = default!;
    [JsonPropertyName("url")]
    public string Url { get; set; } = default!;
}

public class DataButton : Button
{
    [JsonPropertyName("text")]
    public string Text { get; set; } = default!;
    [JsonPropertyName("data")]
    public string Data { get; set; } = default!;
}

public class MessageFile
{
    [JsonPropertyName("key")]
    public string Key { get; set; } = default!;
    [JsonPropertyName("name")]
    public string Name { get; set; } = default!;
    [JsonPropertyName("file_type")]
    public FileType FileType { get; set; } = default!;
    [JsonPropertyName("width")]
    public int? Width { get; set; }
    [JsonPropertyName("height")]
    public int? Height { get; set; }
    [JsonPropertyName("duration_ms")]
    public int? DurationMs { get; set; }
    [JsonPropertyName("waveform")]
    public string? Waveform { get; set; }
}

public class MessageCreateRequestMessage
{
    [JsonPropertyName("entity_id")]
    public int EntityId { get; set; } = default!;
    [JsonPropertyName("content")]
    public string? Content { get; set; }
    [JsonPropertyName("files")]
    public List<MessageFile>? Files { get; set; }
    [JsonPropertyName("buttons")]
    public List<List<Button>>? Buttons { get; set; }
    [JsonPropertyName("display_name")]
    public string? DisplayName { get; set; }
}

public class MessageCreateRequest
{
    [JsonPropertyName("message")]
    public MessageCreateRequestMessage Message { get; set; } = default!;
    [JsonPropertyName("link_preview")]
    public bool? LinkPreview { get; set; }
}

public class MessageUpdateRequestMessage
{
    [JsonPropertyName("content")]
    public string? Content { get; set; }
    [JsonPropertyName("files")]
    public List<MessageFile>? Files { get; set; }
}

public class MessageUpdateRequest
{
    [JsonPropertyName("message")]
    public MessageUpdateRequestMessage Message { get; set; } = default!;
}

public class Message
{
    [JsonPropertyName("id")]
    public int Id { get; set; } = default!;
    [JsonPropertyName("content")]
    public string Content { get; set; } = default!;
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

public class MessageDataWrapper
{
    [JsonPropertyName("data")]
    public Message Data { get; set; } = default!;
}
