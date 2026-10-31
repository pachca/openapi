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
        (typeof(DetailsBot), new HashSet<string> { "bot_id", "actor_id", "webhook_id", "scopes" }),
        (typeof(DetailsBotScopes), new HashSet<string> { "bot_id", "scopes" }),
        (typeof(DetailsBotTokenUpdated), new HashSet<string> { "token_kind", "resource_owner_id", "access_token_id", "bot_id", "webhook_id", "scopes" }),
        (typeof(DetailsToken), new HashSet<string> { "token_kind", "resource_owner_id", "scopes", "access_token_id" }),
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

public class DetailsBot : EventDetailsUnion
{
    [JsonPropertyName("bot_id")]
    public int BotId { get; set; } = default!;
    [JsonPropertyName("actor_id")]
    public int? ActorId { get; set; }
    [JsonPropertyName("webhook_id")]
    public int? WebhookId { get; set; }
    [JsonPropertyName("scopes")]
    public DetailsBotScopesValue? Scopes { get; set; }
}

public class DetailsBotScopes : EventDetailsUnion
{
    [JsonPropertyName("bot_id")]
    public int BotId { get; set; } = default!;
    [JsonPropertyName("scopes")]
    public List<string> Scopes { get; set; } = default!;
}

public class DetailsBotTokenUpdated : EventDetailsUnion
{
    [JsonPropertyName("token_kind")]
    public string TokenKind { get; set; } = default!;
    [JsonPropertyName("resource_owner_id")]
    public int ResourceOwnerId { get; set; } = default!;
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
        ["DetailsBot"] = (new[] { "bot_id" }, new[] { ("scopes", "ScopesChange") }),
        ["DetailsBotScopes"] = (new[] { "bot_id", "scopes" }, Array.Empty<(string, string)>()),
        ["DetailsBotTokenUpdated"] = (new[] { "token_kind", "resource_owner_id", "access_token_id" }, new[] { ("scopes", "ScopesChange") }),
        ["DetailsToken"] = (new[] { "token_kind", "resource_owner_id", "scopes", "access_token_id" }, Array.Empty<(string, string)>()),
        ["ScopesChange"] = (new[] { "previous", "new" }, Array.Empty<(string, string)>()),
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

/// <summary>
/// Права токена у bot_token_created, изменение прав у bot_token_updated в старых записях.
/// </summary>
[JsonConverter(typeof(DetailsBotScopesValueConverter))]
public sealed class DetailsBotScopesValue
{
    public List<string>? StringList { get; }
    public ScopesChange? ScopesChange { get; }

    public DetailsBotScopesValue(List<string> value) { StringList = value; }
    public DetailsBotScopesValue(ScopesChange value) { ScopesChange = value; }

    public static implicit operator DetailsBotScopesValue(List<string> value) => new(value);
    public static implicit operator DetailsBotScopesValue(ScopesChange value) => new(value);
}

internal sealed class DetailsBotScopesValueConverter : JsonConverter<DetailsBotScopesValue>
{
    public override DetailsBotScopesValue Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        switch (reader.TokenType)
        {
            case JsonTokenType.StartArray:
                return new DetailsBotScopesValue(JsonSerializer.Deserialize<List<string>>(ref reader, options)!);
            case JsonTokenType.StartObject:
                return new DetailsBotScopesValue(JsonSerializer.Deserialize<ScopesChange>(ref reader, options)!);
            default:
                throw new JsonException($"DetailsBotScopesValue takes StringList or ScopesChange, got {reader.TokenType}");
        }
    }

    public override void Write(Utf8JsonWriter writer, DetailsBotScopesValue value, JsonSerializerOptions options)
    {
        if (value.StringList != null)
        {
            JsonSerializer.Serialize(writer, value.StringList, options);
            return;
        }
        if (value.ScopesChange != null)
        {
            JsonSerializer.Serialize(writer, value.ScopesChange, options);
            return;
        }
        writer.WriteNullValue();
    }
}

/// <summary>
/// Автор события. Строка у системных событий.
/// </summary>
[JsonConverter(typeof(EventActorConverter))]
public sealed class EventActor
{
    public string? String { get; }
    public Actor? Actor { get; }

    public EventActor(string value) { String = value; }
    public EventActor(Actor value) { Actor = value; }

    public static implicit operator EventActor(string value) => new(value);
    public static implicit operator EventActor(Actor value) => new(value);
}

internal sealed class EventActorConverter : JsonConverter<EventActor>
{
    public override EventActor Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        switch (reader.TokenType)
        {
            case JsonTokenType.String:
                return new EventActor(JsonSerializer.Deserialize<string>(ref reader, options)!);
            case JsonTokenType.StartObject:
                return new EventActor(JsonSerializer.Deserialize<Actor>(ref reader, options)!);
            default:
                throw new JsonException($"EventActor takes String or Actor, got {reader.TokenType}");
        }
    }

    public override void Write(Utf8JsonWriter writer, EventActor value, JsonSerializerOptions options)
    {
        if (value.String != null)
        {
            JsonSerializer.Serialize(writer, value.String, options);
            return;
        }
        if (value.Actor != null)
        {
            JsonSerializer.Serialize(writer, value.Actor, options);
            return;
        }
        writer.WriteNullValue();
    }
}

public class ScopesChange
{
    [JsonPropertyName("previous")]
    public List<string> Previous { get; set; } = default!;
    [JsonPropertyName("new")]
    public List<string> @New { get; set; } = default!;
}

public class Actor
{
    [JsonPropertyName("id")]
    public int Id { get; set; } = default!;
    [JsonPropertyName("name")]
    public string? Name { get; set; }
}

public class Event
{
    [JsonPropertyName("id")]
    public int Id { get; set; } = default!;
    [JsonPropertyName("event_key")]
    public string EventKey { get; set; } = default!;
    [JsonPropertyName("actor")]
    public EventActor? Actor { get; set; }
    [JsonPropertyName("details")]
    public EventDetailsUnion Details { get; set; } = default!;
}

public class GetEventsResponse
{
    [JsonPropertyName("data")]
    public List<Event> Data { get; set; } = new();
}
