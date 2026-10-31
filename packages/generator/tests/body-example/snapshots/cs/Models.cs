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
            // System.Text.Json fills a missing field with its default: a member that
            // misses a required key, in itself or in a model nested in it, gives way
            // to the next one here.
            var missing = UnionRequiredKeys.Missing(candidate.Type.Name, root);
            if (missing != null)
            {
                firstError ??= new JsonException(missing);
                continue;
            }
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

// UnionRequiredKeys lists, for a model a union without a discriminator may hold
// or nest, the keys it cannot do without and the fields that hold a model (or a
// list of them) with required keys of its own. A required field that may hold
// null is not listed: its key may be missing. System.Text.Json fills a missing
// field with its default, so a union checks the keys before it takes a member;
// decoding a model on its own stays as lenient as System.Text.Json.
internal static class UnionRequiredKeys
{
    private static readonly Dictionary<string, (string[] Keys, (string Key, string Model)[] Nested)> Shapes = new()
    {
        ["UrlButton"] = (new[] { "text", "url" }, Array.Empty<(string, string)>()),
        ["DataButton"] = (new[] { "text", "data" }, Array.Empty<(string, string)>()),
    };

    // Missing names the first required key the payload of a model lacks, in the
    // model or in a model nested in it, or returns null when nothing is missing.
    public static string? Missing(string model, JsonElement value)
    {
        if (!Shapes.TryGetValue(model, out var shape)) return null;
        var isObject = value.ValueKind == JsonValueKind.Object;
        foreach (var key in shape.Keys)
        {
            if (!isObject || !value.TryGetProperty(key, out _)) return $"{model} requires \"{key}\"";
        }
        if (!isObject) return null;
        foreach (var (key, nested) in shape.Nested)
        {
            if (value.TryGetProperty(key, out var inner) && MissingIn(nested, inner) is { } missing) return missing;
        }
        return null;
    }

    // A field value: an object of the model, a list of them, or a value of another
    // kind, which the converter itself takes or refuses.
    private static string? MissingIn(string model, JsonElement value)
    {
        switch (value.ValueKind)
        {
            case JsonValueKind.Object:
                return Missing(model, value);
            case JsonValueKind.Array:
                foreach (var item in value.EnumerateArray())
                {
                    if (MissingIn(model, item) is { } missing) return missing;
                }
                return null;
            default:
                return null;
        }
    }
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
