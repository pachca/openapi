#nullable enable

using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Pachca.Sdk;

[JsonConverter(typeof(SearchSortConverter))]
public enum SearchSort
{
    /// <summary>По релевантности</summary>
    Relevance,
    /// <summary>По дате</summary>
    Date,
}

internal class SearchSortConverter : JsonConverter<SearchSort>
{
    public override SearchSort Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        var value = reader.GetString();
        return value switch
        {
            "relevance" => SearchSort.Relevance,
            "date" => SearchSort.Date,
            _ => throw new JsonException($"Unknown SearchSort value: {value}"),
        };
    }

    public override void Write(Utf8JsonWriter writer, SearchSort value, JsonSerializerOptions options)
    {
        var str = value switch
        {
            SearchSort.Relevance => "relevance",
            SearchSort.Date => "date",
            _ => value.ToString(),
        };
        writer.WriteStringValue(str);
    }
}

public class MessageSearchResult
{
    [JsonPropertyName("id")]
    public int Id { get; set; } = default!;
    [JsonPropertyName("chat_id")]
    public int ChatId { get; set; } = default!;
    [JsonPropertyName("user_id")]
    public int UserId { get; set; } = default!;
    [JsonPropertyName("content")]
    public string Content { get; set; } = default!;
    [JsonPropertyName("created_at")]
    public DateTimeOffset CreatedAt { get; set; } = default!;
}

public class SearchPaginationMetaPaginate
{
    [JsonPropertyName("next_page")]
    public string NextPage { get; set; } = default!;
}

public class SearchPaginationMeta
{
    [JsonPropertyName("total")]
    public int Total { get; set; } = default!;
    [JsonPropertyName("paginate")]
    public SearchPaginationMetaPaginate Paginate { get; set; } = default!;
}

public class OAuthError : Exception
{
    [JsonPropertyName("error")]
    public string? Error { get; set; }

    public override string Message => Error ?? "oauth error";
}

public class SearchMessagesResponse
{
    [JsonPropertyName("data")]
    public List<MessageSearchResult> Data { get; set; } = new();
    [JsonPropertyName("meta")]
    public SearchPaginationMeta Meta { get; set; } = default!;
}
