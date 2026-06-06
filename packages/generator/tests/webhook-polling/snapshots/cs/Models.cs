#nullable enable

using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Pachca.Sdk;

[JsonPolymorphic(TypeDiscriminatorPropertyName = "type")]
[JsonDerivedType(typeof(MessageWebhookPayload), "message_new")]
[JsonDerivedType(typeof(ReactionWebhookPayload), "reaction_added")]
public abstract class WebhookPayloadUnion
{
    [JsonPropertyName("type")]
    public abstract string Type { get; }
}

public class MessageWebhookPayload : WebhookPayloadUnion
{
    [JsonPropertyName("type")]
    public override string Type => "message_new";
    [JsonPropertyName("message_id")]
    public int MessageId { get; set; } = default!;
}

public class ReactionWebhookPayload : WebhookPayloadUnion
{
    [JsonPropertyName("type")]
    public override string Type => "reaction_added";
    [JsonPropertyName("reaction")]
    public string Reaction { get; set; } = default!;
}

public class WebhookEvent
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = default!;
    [JsonPropertyName("event_type")]
    public string EventType { get; set; } = default!;
    [JsonPropertyName("payload")]
    public WebhookPayloadUnion Payload { get; set; } = default!;
    [JsonPropertyName("created_at")]
    public DateTimeOffset CreatedAt { get; set; } = default!;
}

public class PaginationMetaPaginate
{
    [JsonPropertyName("next_page")]
    public string NextPage { get; set; } = default!;
    [JsonPropertyName("has_next")]
    public bool? HasNext { get; set; }
}

public class PaginationMeta
{
    [JsonPropertyName("paginate")]
    public PaginationMetaPaginate Paginate { get; set; } = default!;
}

public class GetWebhookEventsResponse
{
    [JsonPropertyName("data")]
    public List<WebhookEvent> Data { get; set; } = new();
    [JsonPropertyName("meta")]
    public PaginationMeta Meta { get; set; } = default!;
}
