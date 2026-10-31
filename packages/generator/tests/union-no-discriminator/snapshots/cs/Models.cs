#nullable enable

using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Pachca.Sdk;

[JsonConverter(typeof(EventDetailsUnionConverter))]
public abstract class EventDetailsUnion
{
}

// EventDetailsUnion carries no discriminator field: members are tried in the order
// they match the payload keys (most recognised, then fewest unrecognised, then
// fewest declared), and the first one that decodes wins.
internal sealed class EventDetailsUnionConverter : JsonConverter<EventDetailsUnion>
{
    private static readonly (Type Type, HashSet<string> Keys)[] Shapes =
    {
        (typeof(DetailsEmpty), new HashSet<string>()),
        (typeof(DetailsChat), new HashSet<string> { "chat_id" }),
        (typeof(DetailsCall), new HashSet<string> { "chat_id", "duration", "recording_size" }),
        (typeof(DetailsRename), new HashSet<string> { "old_name", "new_name" }),
    };

    public override EventDetailsUnion Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
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
                return (EventDetailsUnion)JsonSerializer.Deserialize(raw, candidate.Type, options)!;
            }
            catch (JsonException e)
            {
                firstError ??= e;
            }
        }
        throw firstError ?? new JsonException("No EventDetailsUnion member matched the payload");
    }

    public override void Write(Utf8JsonWriter writer, EventDetailsUnion value, JsonSerializerOptions options)
    {
        JsonSerializer.Serialize(writer, (object)value, value.GetType(), options);
    }
}

public class DetailsEmpty : EventDetailsUnion
{
}

public class DetailsChat : EventDetailsUnion
{
    [JsonPropertyName("chat_id")]
    public int ChatId { get; set; } = default!;
}

public class DetailsCall : EventDetailsUnion
{
    [JsonPropertyName("chat_id")]
    public int ChatId { get; set; } = default!;
    [JsonPropertyName("duration")]
    public int Duration { get; set; } = default!;
    [JsonPropertyName("recording_size")]
    public long? RecordingSize { get; set; }
}

public class DetailsRename : EventDetailsUnion
{
    [JsonPropertyName("old_name")]
    public string OldName { get; set; } = default!;
    [JsonPropertyName("new_name")]
    public string NewName { get; set; } = default!;
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
        ["DetailsChat"] = (new[] { "chat_id" }, Array.Empty<(string, string)>()),
        ["DetailsCall"] = (new[] { "chat_id", "duration" }, Array.Empty<(string, string)>()),
        ["DetailsRename"] = (new[] { "old_name", "new_name" }, Array.Empty<(string, string)>()),
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

public class Event
{
    [JsonPropertyName("id")]
    public int Id { get; set; } = default!;
    [JsonPropertyName("event_key")]
    public object EventKey { get; set; } = default!;
    [JsonPropertyName("details")]
    public EventDetailsUnion Details { get; set; } = default!;
}

public class GetEventsResponse
{
    [JsonPropertyName("data")]
    public List<Event> Data { get; set; } = new();
}
