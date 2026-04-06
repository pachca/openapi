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

public sealed class ChatsService
{
    private readonly string _baseUrl;
    private readonly HttpClient _client;

    internal ChatsService(string baseUrl, HttpClient client)
    {
        _baseUrl = baseUrl;
        _client = client;
    }

    public async System.Threading.Tasks.Task<ListChatsResponse> ListChatsAsync(
        ChatAvailability? availability = null,
        int? limit = null,
        string? cursor = null,
        string? sortField = null,
        SortOrder? sortOrder = null,
        CancellationToken cancellationToken = default)
    {
        var queryParts = new List<string>();
        if (availability != null)
            queryParts.Add($"availability={Uri.EscapeDataString(PachcaUtils.EnumToApiString(availability.Value))}");
        if (limit != null)
            queryParts.Add($"limit={Uri.EscapeDataString(limit.Value.ToString()!)}");
        if (cursor != null)
            queryParts.Add($"cursor={Uri.EscapeDataString(cursor)}");
        if (sortField != null)
            queryParts.Add($"sort[field]={Uri.EscapeDataString(sortField)}");
        if (sortOrder != null)
            queryParts.Add($"sort[order]={Uri.EscapeDataString(PachcaUtils.EnumToApiString(sortOrder.Value))}");
        var url = $"{_baseUrl}/chats" + (queryParts.Count > 0 ? "?" + string.Join("&", queryParts) : "");
        using var request = new HttpRequestMessage(HttpMethod.Get, url);
        using var response = await PachcaUtils.SendWithRetryAsync(_client, request, cancellationToken).ConfigureAwait(false);
        var json = await response.Content.ReadAsStringAsync(cancellationToken).ConfigureAwait(false);
        switch ((int)response.StatusCode)
        {
            case 200:
                return PachcaUtils.Deserialize<ListChatsResponse>(json);
            case 401:
                throw PachcaUtils.Deserialize<OAuthError>(json);
            default:
                throw PachcaUtils.Deserialize<ApiError>(json);
        }
    }

    public async System.Threading.Tasks.Task<List<Chat>> ListChatsAllAsync(
        ChatAvailability? availability = null,
        int? limit = null,
        string? sortField = null,
        SortOrder? sortOrder = null,
        CancellationToken cancellationToken = default)
    {
        var items = new List<Chat>();
        string? cursor = null;
        do
        {
            var response = await ListChatsAsync(availability: availability, limit: limit, cursor: cursor, sortField: sortField, sortOrder: sortOrder, cancellationToken: cancellationToken).ConfigureAwait(false);
            items.AddRange(response.Data);
            if (response.Data.Count == 0) break;
            cursor = response.Meta?.Paginate?.NextPage;
        } while (cursor != null);
        return items;
    }

    public async System.Threading.Tasks.Task<Chat> GetChatAsync(int id, CancellationToken cancellationToken = default)
    {
        var url = $"{_baseUrl}/chats/{id}";
        using var request = new HttpRequestMessage(HttpMethod.Get, url);
        using var response = await PachcaUtils.SendWithRetryAsync(_client, request, cancellationToken).ConfigureAwait(false);
        var json = await response.Content.ReadAsStringAsync(cancellationToken).ConfigureAwait(false);
        switch ((int)response.StatusCode)
        {
            case 200:
                return PachcaUtils.Deserialize<ChatDataWrapper>(json).Data;
            case 401:
                throw PachcaUtils.Deserialize<OAuthError>(json);
            default:
                throw PachcaUtils.Deserialize<ApiError>(json);
        }
    }

    public async System.Threading.Tasks.Task<Chat> CreateChatAsync(ChatCreateRequest request, CancellationToken cancellationToken = default)
    {
        var url = $"{_baseUrl}/chats";
        using var httpRequest = new HttpRequestMessage(HttpMethod.Post, url);
        httpRequest.Content = new StringContent(PachcaUtils.Serialize(request), Encoding.UTF8, "application/json");
        using var response = await PachcaUtils.SendWithRetryAsync(_client, httpRequest, cancellationToken).ConfigureAwait(false);
        var json = await response.Content.ReadAsStringAsync(cancellationToken).ConfigureAwait(false);
        switch ((int)response.StatusCode)
        {
            case 201:
                return PachcaUtils.Deserialize<ChatDataWrapper>(json).Data;
            case 401:
                throw PachcaUtils.Deserialize<OAuthError>(json);
            default:
                throw PachcaUtils.Deserialize<ApiError>(json);
        }
    }

    public async System.Threading.Tasks.Task<Chat> UpdateChatAsync(
        int id,
        ChatUpdateRequest request,
        CancellationToken cancellationToken = default)
    {
        var url = $"{_baseUrl}/chats/{id}";
        using var httpRequest = new HttpRequestMessage(HttpMethod.Put, url);
        httpRequest.Content = new StringContent(PachcaUtils.Serialize(request), Encoding.UTF8, "application/json");
        using var response = await PachcaUtils.SendWithRetryAsync(_client, httpRequest, cancellationToken).ConfigureAwait(false);
        var json = await response.Content.ReadAsStringAsync(cancellationToken).ConfigureAwait(false);
        switch ((int)response.StatusCode)
        {
            case 200:
                return PachcaUtils.Deserialize<ChatDataWrapper>(json).Data;
            case 401:
                throw PachcaUtils.Deserialize<OAuthError>(json);
            default:
                throw PachcaUtils.Deserialize<ApiError>(json);
        }
    }

    public async System.Threading.Tasks.Task ArchiveChatAsync(int id, CancellationToken cancellationToken = default)
    {
        var url = $"{_baseUrl}/chats/{id}/archive";
        using var request = new HttpRequestMessage(HttpMethod.Put, url);
        using var response = await PachcaUtils.SendWithRetryAsync(_client, request, cancellationToken).ConfigureAwait(false);
        var json = await response.Content.ReadAsStringAsync(cancellationToken).ConfigureAwait(false);
        switch ((int)response.StatusCode)
        {
            case 204:
                return;
            case 401:
                throw PachcaUtils.Deserialize<OAuthError>(json);
            default:
                throw PachcaUtils.Deserialize<ApiError>(json);
        }
    }

    public async System.Threading.Tasks.Task DeleteChatAsync(int id, CancellationToken cancellationToken = default)
    {
        var url = $"{_baseUrl}/chats/{id}";
        using var request = new HttpRequestMessage(HttpMethod.Delete, url);
        using var response = await PachcaUtils.SendWithRetryAsync(_client, request, cancellationToken).ConfigureAwait(false);
        var json = await response.Content.ReadAsStringAsync(cancellationToken).ConfigureAwait(false);
        switch ((int)response.StatusCode)
        {
            case 204:
                return;
            case 401:
                throw PachcaUtils.Deserialize<OAuthError>(json);
            default:
                throw PachcaUtils.Deserialize<ApiError>(json);
        }
    }
}

public sealed class PachcaClient : IDisposable
{
    private readonly HttpClient _client;

    public ChatsService Chats { get; }

    public PachcaClient(string token, string baseUrl = "https://api.pachca.com/api/shared/v1")
    {
        _client = new HttpClient();
        _client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", token);

        Chats = new ChatsService(baseUrl, _client);
    }

    public void Dispose()
    {
        _client.Dispose();
        GC.SuppressFinalize(this);
    }
}
