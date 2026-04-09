#nullable enable

using System;
using System.Collections.Generic;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Threading;

namespace Pachca.Sdk;

public class SearchService
{

    public virtual async System.Threading.Tasks.Task<SearchMessagesResponse> SearchMessagesAsync(
        string query,
        List<int>? chatIds = null,
        List<int>? userIds = null,
        DateTimeOffset? createdFrom = null,
        DateTimeOffset? createdTo = null,
        SearchSort? sort = null,
        int? limit = null,
        string? cursor = null,
        CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException("Search.searchMessages is not implemented");
    }

    public virtual async System.Threading.Tasks.Task<List<MessageSearchResult>> SearchMessagesAllAsync(
        string query,
        List<int>? chatIds = null,
        List<int>? userIds = null,
        DateTimeOffset? createdFrom = null,
        DateTimeOffset? createdTo = null,
        SearchSort? sort = null,
        int? limit = null,
        CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException("Search.searchMessagesAll is not implemented");
    }
}

public sealed class SearchServiceImpl : SearchService
{
    private readonly string _baseUrl;
    private readonly HttpClient _client;

    internal SearchServiceImpl(string baseUrl, HttpClient client)
    {
        _baseUrl = baseUrl;
        _client = client;
    }

    public override async System.Threading.Tasks.Task<SearchMessagesResponse> SearchMessagesAsync(
        string query,
        List<int>? chatIds = null,
        List<int>? userIds = null,
        DateTimeOffset? createdFrom = null,
        DateTimeOffset? createdTo = null,
        SearchSort? sort = null,
        int? limit = null,
        string? cursor = null,
        CancellationToken cancellationToken = default)
    {
        var queryParts = new List<string>();
        queryParts.Add($"query={Uri.EscapeDataString(query)}");
        if (chatIds != null)
            foreach (var item in chatIds)
                queryParts.Add($"chat_ids[]={Uri.EscapeDataString(item.ToString()!)}");
        if (userIds != null)
            foreach (var item in userIds)
                queryParts.Add($"user_ids[]={Uri.EscapeDataString(item.ToString()!)}");
        if (createdFrom != null)
            queryParts.Add($"created_from={Uri.EscapeDataString(createdFrom.Value.ToString("o"))}");
        if (createdTo != null)
            queryParts.Add($"created_to={Uri.EscapeDataString(createdTo.Value.ToString("o"))}");
        if (sort != null)
            queryParts.Add($"sort={Uri.EscapeDataString(PachcaUtils.EnumToApiString(sort.Value))}");
        if (limit != null)
            queryParts.Add($"limit={Uri.EscapeDataString(limit.Value.ToString()!)}");
        if (cursor != null)
            queryParts.Add($"cursor={Uri.EscapeDataString(cursor)}");
        var url = $"{_baseUrl}/search/messages" + (queryParts.Count > 0 ? "?" + string.Join("&", queryParts) : "");
        using var request = new HttpRequestMessage(HttpMethod.Get, url);
        using var response = await PachcaUtils.SendWithRetryAsync(_client, request, cancellationToken).ConfigureAwait(false);
        var json = await response.Content.ReadAsStringAsync(cancellationToken).ConfigureAwait(false);
        switch ((int)response.StatusCode)
        {
            case 200:
                return PachcaUtils.Deserialize<SearchMessagesResponse>(json);
            case 401:
                throw PachcaUtils.Deserialize<OAuthError>(json);
            default:
                throw new InvalidOperationException($"Unexpected status code: {(int)response.StatusCode}");
        }
    }

    public override async System.Threading.Tasks.Task<List<MessageSearchResult>> SearchMessagesAllAsync(
        string query,
        List<int>? chatIds = null,
        List<int>? userIds = null,
        DateTimeOffset? createdFrom = null,
        DateTimeOffset? createdTo = null,
        SearchSort? sort = null,
        int? limit = null,
        CancellationToken cancellationToken = default)
    {
        var items = new List<MessageSearchResult>();
        string? cursor = null;
        do
        {
            var response = await SearchMessagesAsync(query: query, chatIds: chatIds, userIds: userIds, createdFrom: createdFrom, createdTo: createdTo, sort: sort, limit: limit, cursor: cursor, cancellationToken: cancellationToken).ConfigureAwait(false);
            items.AddRange(response.Data);
            if (response.Data.Count == 0) break;
            cursor = response.Meta.Paginate.NextPage;
        } while (true);
        return items;
    }
}

public static class PachcaConstants
{
    public const string PachcaApiUrl = "https://api.pachca.com/api/shared/v1";
}

public sealed class PachcaClient : IDisposable
{
    private readonly HttpClient? _client;

    public SearchService Search { get; }

    private PachcaClient(SearchService search)
    {
        Search = search;
    }

    public PachcaClient(string token, string baseUrl = PachcaConstants.PachcaApiUrl, SearchService? search = null)
    {
        _client = new HttpClient();
        _client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", token);

        Search = search ?? new SearchServiceImpl(baseUrl, _client);
    }

    public PachcaClient(string baseUrl, HttpClient client, SearchService? search = null)
    {
        _client = client;

        Search = search ?? new SearchServiceImpl(baseUrl, _client);
    }

    public static PachcaClient Stub(SearchService? search = null)
    {
        return new PachcaClient(search ?? new SearchService());
    }

    public void Dispose()
    {
        _client?.Dispose();
        GC.SuppressFinalize(this);
    }
}
