#nullable enable

using System;
using System.Collections.Generic;
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
public enum EventType
{
    Message,
    Reaction,
}

internal class EventTypeConverter : JsonConverter<EventType>
{
    public override EventType Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        var value = reader.GetString();
        return value switch
        {
            "message" => EventType.Message,
            "reaction" => EventType.Reaction,
            _ => throw new JsonException($"Unknown EventType value: {value}"),
        };
    }

    public override void Write(Utf8JsonWriter writer, EventType value, JsonSerializerOptions options)
    {
        var str = value switch
        {
            EventType.Message => "message",
            EventType.Reaction => "reaction",
            _ => value.ToString(),
        };
        writer.WriteStringValue(str);
    }
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
    public override string Kind => "message";
    [JsonPropertyName("text")]
    public string Text { get; set; } = default!;
}

public class ReactionNotification : NotificationUnion
{
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
