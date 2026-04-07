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

public sealed class SearchService
{
    private readonly string _baseUrl;
    private readonly HttpClient _client;

    internal SearchService(string baseUrl, HttpClient client)
    {
        _baseUrl = baseUrl;
        _client = client;
    }

    public async System.Threading.Tasks.Task<SearchMessagesResponse> SearchMessagesAsync(
        string query,
        List<int> chatIds,
        List<int>? userIds = null,
        int? limit = null,
        string? cursor = null,
        CancellationToken cancellationToken = default)
    {
        var queryParts = new List<string>();
        queryParts.Add($"query={Uri.EscapeDataString(query)}");
        foreach (var item in chatIds)
            queryParts.Add($"chat_ids[]={Uri.EscapeDataString(item.ToString()!)}");
        if (userIds != null)
            foreach (var item in userIds)
                queryParts.Add($"user_ids[]={Uri.EscapeDataString(item.ToString()!)}");
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

    public async System.Threading.Tasks.Task<List<MessageResult>> SearchMessagesAllAsync(
        string query,
        List<int> chatIds,
        List<int>? userIds = null,
        int? limit = null,
        CancellationToken cancellationToken = default)
    {
        var items = new List<MessageResult>();
        string? cursor = null;
        do
        {
            var response = await SearchMessagesAsync(query: query, chatIds: chatIds, userIds: userIds, limit: limit, cursor: cursor, cancellationToken: cancellationToken).ConfigureAwait(false);
            items.AddRange(response.Data);
            if (response.Data.Count == 0) break;
            cursor = response.Meta.Paginate.NextPage;
        } while (true);
        return items;
    }
}

public sealed class PachcaClient : IDisposable
{
    private readonly HttpClient _client;

    public SearchService Search { get; }

    public PachcaClient(string token, string baseUrl = "https://api.pachca.com/api/shared/v1")
    {
        _client = new HttpClient();
        _client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", token);

        Search = new SearchService(baseUrl, _client);
    }

    public void Dispose()
    {
        _client.Dispose();
        GC.SuppressFinalize(this);
    }
}
