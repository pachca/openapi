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
