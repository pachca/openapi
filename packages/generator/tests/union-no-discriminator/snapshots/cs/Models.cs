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

// EventDetailsUnion carries no discriminator field: the member is chosen by which
// one best matches the payload keys (most recognised, then fewest unrecognised,
// then fewest declared).
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
        Type? best = null;
        int bestMatched = 0, bestUnknown = 0, bestDeclared = 0;
        foreach (var (type, shapeKeys) in Shapes)
        {
            var matched = 0;
            foreach (var key in keys)
            {
                if (shapeKeys.Contains(key)) matched++;
            }
            var unknown = keys.Count - matched;
            var declared = shapeKeys.Count;
            var better = best is null
                || matched > bestMatched
                || (matched == bestMatched && unknown < bestUnknown)
                || (matched == bestMatched && unknown == bestUnknown && declared < bestDeclared);
            if (better)
            {
                best = type;
                bestMatched = matched;
                bestUnknown = unknown;
                bestDeclared = declared;
            }
        }
        if (best is null) throw new JsonException("No EventDetailsUnion member matched the payload");
        return (EventDetailsUnion)JsonSerializer.Deserialize(root.GetRawText(), best, options)!;
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
