#nullable enable

using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Pachca.Sdk;

[JsonConverter(typeof(OAuthScopeConverter))]
public enum OAuthScope
{
    ChatsRead,
    ChatsWrite,
    UsersRead,
    UsersWrite,
}

internal class OAuthScopeConverter : JsonConverter<OAuthScope>
{
    public override OAuthScope Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        var value = reader.GetString();
        return value switch
        {
            "chats:read" => OAuthScope.ChatsRead,
            "chats:write" => OAuthScope.ChatsWrite,
            "users:read" => OAuthScope.UsersRead,
            "users:write" => OAuthScope.UsersWrite,
            _ => throw new JsonException($"Unknown OAuthScope value: {value}"),
        };
    }

    public override void Write(Utf8JsonWriter writer, OAuthScope value, JsonSerializerOptions options)
    {
        var str = value switch
        {
            OAuthScope.ChatsRead => "chats:read",
            OAuthScope.ChatsWrite => "chats:write",
            OAuthScope.UsersRead => "users:read",
            OAuthScope.UsersWrite => "users:write",
            _ => value.ToString(),
        };
        writer.WriteStringValue(str);
    }
}

[JsonConverter(typeof(EventTypeConverter))]
public readonly struct EventType : IEquatable<EventType>
{
    private readonly string? _value;

    public EventType(string value) => _value = value ?? throw new ArgumentNullException(nameof(value));

    public static EventType Message { get; } = new("message");
    public static EventType Reaction { get; } = new("reaction");

    /// <summary>Every value this SDK version lists</summary>
    public static IReadOnlyList<EventType> Values { get; } = Array.AsReadOnly(new[] { Message, Reaction });

    /// <summary>The value as it travels in JSON</summary>
    public string Value => _value ?? "";

    /// <summary>Whether this SDK version lists the value</summary>
    public bool IsKnown
    {
        get
        {
            foreach (var known in Values)
                if (Equals(known)) return true;
            return false;
        }
    }

    public static bool operator ==(EventType left, EventType right) => left.Equals(right);
    public static bool operator !=(EventType left, EventType right) => !left.Equals(right);
    public static implicit operator EventType(string value) => new(value);
    public bool Equals(EventType other) => string.Equals(Value, other.Value, StringComparison.Ordinal);
    public override bool Equals(object? obj) => obj is EventType other && Equals(other);
    public override int GetHashCode() => StringComparer.Ordinal.GetHashCode(Value);
    public override string ToString() => Value;
}

internal class EventTypeConverter : JsonConverter<EventType>
{
    public override EventType Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options) =>
        new(reader.GetString() ?? "");

    public override void Write(Utf8JsonWriter writer, EventType value, JsonSerializerOptions options) =>
        writer.WriteStringValue(value.Value);
}

[JsonPolymorphic(TypeDiscriminatorPropertyName = "kind")]
[JsonDerivedType(typeof(MessageNotification), "message")]
[JsonDerivedType(typeof(ReactionNotification), "message")]
public abstract class NotificationUnion
{
    [JsonPropertyName("kind")]
    public abstract string Kind { get; }
}

public class MessageNotification : NotificationUnion
{
    [JsonPropertyName("kind")]
    public override string Kind => "message";
    [JsonPropertyName("text")]
    public string Text { get; set; } = default!;
}

public class ReactionNotification : NotificationUnion
{
    [JsonPropertyName("kind")]
    public override string Kind => "message";
    [JsonPropertyName("emoji")]
    public string Emoji { get; set; } = default!;
}

public class EventFilter { }

public class Event
{
    [JsonPropertyName("id")]
    public int Id { get; set; } = default!;
    [JsonPropertyName("type")]
    public EventType Type { get; set; } = default!;
}

public class PublishEventRequest
{
    [JsonPropertyName("scope")]
    public OAuthScope Scope { get; set; } = default!;
}

public class UploadRequest
{
    [JsonPropertyName("Content-Disposition")]
    public string ContentDisposition { get; set; } = default!;
    [JsonIgnore]
    public byte[] File { get; set; } = Array.Empty<byte>();
}

public class Notification
{
    [JsonPropertyName("kind")]
    public string Kind { get; set; } = default!;
}

public class Schedule
{
    [JsonPropertyName("days")]
    public List<int> Days { get; set; } = default!;
    [JsonPropertyName("value")]
    public object? Value { get; set; }
}

public class ListEventsResponse
{
    [JsonPropertyName("data")]
    public List<Event> Data { get; set; } = new();
}

public class EventDataWrapper
{
    [JsonPropertyName("data")]
    public Event Data { get; set; } = default!;
}
