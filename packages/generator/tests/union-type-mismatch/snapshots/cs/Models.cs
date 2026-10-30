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
        (typeof(DetailsBot), new HashSet<string> { "bot_id", "webhook_id", "scopes" }),
        (typeof(DetailsBotTokenUpdated), new HashSet<string> { "token_kind", "resource_owner_id", "current_scopes", "access_token_id", "bot_id", "webhook_id", "scopes" }),
        (typeof(DetailsToken), new HashSet<string> { "token_kind", "resource_owner_id", "scopes", "access_token_id", "bot_id", "webhook_id", "application_id", "device_name" }),
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

public class DetailsBot : EventDetailsUnion
{
    [JsonPropertyName("bot_id")]
    public int BotId { get; set; } = default!;
    [JsonPropertyName("webhook_id")]
    public int? WebhookId { get; set; }
    [JsonPropertyName("scopes")]
    public List<string>? Scopes { get; set; }
}

public class DetailsBotTokenUpdated : EventDetailsUnion
{
    [JsonPropertyName("token_kind")]
    public string TokenKind { get; set; } = default!;
    [JsonPropertyName("resource_owner_id")]
    public int ResourceOwnerId { get; set; } = default!;
    [JsonPropertyName("current_scopes")]
    public List<string>? CurrentScopes { get; set; }
    [JsonPropertyName("access_token_id")]
    public int AccessTokenId { get; set; } = default!;
    [JsonPropertyName("bot_id")]
    public int? BotId { get; set; }
    [JsonPropertyName("webhook_id")]
    public int? WebhookId { get; set; }
    [JsonPropertyName("scopes")]
    public ScopesChange? Scopes { get; set; }
}

public class DetailsToken : EventDetailsUnion
{
    [JsonPropertyName("token_kind")]
    public string TokenKind { get; set; } = default!;
    [JsonPropertyName("resource_owner_id")]
    public int ResourceOwnerId { get; set; } = default!;
    [JsonPropertyName("scopes")]
    public List<string> Scopes { get; set; } = default!;
    [JsonPropertyName("access_token_id")]
    public int AccessTokenId { get; set; } = default!;
    [JsonPropertyName("bot_id")]
    public int? BotId { get; set; }
    [JsonPropertyName("webhook_id")]
    public int? WebhookId { get; set; }
    [JsonPropertyName("application_id")]
    public int? ApplicationId { get; set; }
    [JsonPropertyName("device_name")]
    public string? DeviceName { get; set; }
}

public class ScopesChange
{
    [JsonPropertyName("previous")]
    public List<string> Previous { get; set; } = default!;
    [JsonPropertyName("new")]
    public List<string> @New { get; set; } = default!;
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
