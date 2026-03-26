#nullable enable

using System;
using System.Collections.Generic;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.IO;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;

namespace Pachca.Sdk;

public sealed class SecurityService
{
    private readonly string _baseUrl;
    private readonly HttpClient _client;

    internal SecurityService(string baseUrl, HttpClient client)
    {
        _baseUrl = baseUrl;
        _client = client;
    }

    public async Task<GetAuditEventsResponse> GetAuditEventsAsync(
        DateTimeOffset? startTime = null,
        DateTimeOffset? endTime = null,
        AuditEventKey? eventKey = null,
        string? actorId = null,
        string? actorType = null,
        string? entityId = null,
        string? entityType = null,
        int? limit = null,
        string? cursor = null,
        CancellationToken cancellationToken = default)
    {
        var queryParts = new List<string>();
        if (startTime != null)
            queryParts.Add($"start_time={Uri.EscapeDataString(startTime.Value.ToString("o"))}");
        if (endTime != null)
            queryParts.Add($"end_time={Uri.EscapeDataString(endTime.Value.ToString("o"))}");
        if (eventKey != null)
            queryParts.Add($"event_key={Uri.EscapeDataString(PachcaUtils.EnumToApiString(eventKey.Value))}");
        if (actorId != null)
            queryParts.Add($"actor_id={Uri.EscapeDataString(actorId)}");
        if (actorType != null)
            queryParts.Add($"actor_type={Uri.EscapeDataString(actorType)}");
        if (entityId != null)
            queryParts.Add($"entity_id={Uri.EscapeDataString(entityId)}");
        if (entityType != null)
            queryParts.Add($"entity_type={Uri.EscapeDataString(entityType)}");
        if (limit != null)
            queryParts.Add($"limit={Uri.EscapeDataString(limit.Value.ToString())}");
        if (cursor != null)
            queryParts.Add($"cursor={Uri.EscapeDataString(cursor)}");
        var url = $"{_baseUrl}/audit_events" + (queryParts.Count > 0 ? "?" + string.Join("&", queryParts) : "");
        using var request = new HttpRequestMessage(HttpMethod.Get, url);
        using var response = await PachcaUtils.SendWithRetryAsync(_client, request, cancellationToken).ConfigureAwait(false);
        var json = await response.Content.ReadAsStringAsync(cancellationToken).ConfigureAwait(false);
        switch ((int)response.StatusCode)
        {
            case 200:
                return PachcaUtils.Deserialize<GetAuditEventsResponse>(json);
            case 401:
                throw PachcaUtils.Deserialize<OAuthError>(json);
            default:
                throw PachcaUtils.Deserialize<ApiError>(json);
        }
    }

    public async Task<List<AuditEvent>> GetAuditEventsAllAsync(
        DateTimeOffset? startTime = null,
        DateTimeOffset? endTime = null,
        AuditEventKey? eventKey = null,
        string? actorId = null,
        string? actorType = null,
        string? entityId = null,
        string? entityType = null,
        int? limit = null,
        CancellationToken cancellationToken = default)
    {
        var items = new List<AuditEvent>();
        string? cursor = null;
        do
        {
            var response = await GetAuditEventsAsync(startTime: startTime, endTime: endTime, eventKey: eventKey, actorId: actorId, actorType: actorType, entityId: entityId, entityType: entityType, limit: limit, cursor: cursor, cancellationToken: cancellationToken).ConfigureAwait(false);
            items.AddRange(response.Data);
            cursor = response.Meta?.Paginate?.NextPage;
        } while (cursor != null);
        return items;
    }
}

public sealed class BotsService
{
    private readonly string _baseUrl;
    private readonly HttpClient _client;

    internal BotsService(string baseUrl, HttpClient client)
    {
        _baseUrl = baseUrl;
        _client = client;
    }

    public async Task<GetWebhookEventsResponse> GetWebhookEventsAsync(
        int? limit = null,
        string? cursor = null,
        CancellationToken cancellationToken = default)
    {
        var queryParts = new List<string>();
        if (limit != null)
            queryParts.Add($"limit={Uri.EscapeDataString(limit.Value.ToString())}");
        if (cursor != null)
            queryParts.Add($"cursor={Uri.EscapeDataString(cursor)}");
        var url = $"{_baseUrl}/webhooks/events" + (queryParts.Count > 0 ? "?" + string.Join("&", queryParts) : "");
        using var request = new HttpRequestMessage(HttpMethod.Get, url);
        using var response = await PachcaUtils.SendWithRetryAsync(_client, request, cancellationToken).ConfigureAwait(false);
        var json = await response.Content.ReadAsStringAsync(cancellationToken).ConfigureAwait(false);
        switch ((int)response.StatusCode)
        {
            case 200:
                return PachcaUtils.Deserialize<GetWebhookEventsResponse>(json);
            case 401:
                throw PachcaUtils.Deserialize<OAuthError>(json);
            default:
                throw PachcaUtils.Deserialize<ApiError>(json);
        }
    }

    public async Task<List<WebhookEvent>> GetWebhookEventsAllAsync(
        int? limit = null,
        CancellationToken cancellationToken = default)
    {
        var items = new List<WebhookEvent>();
        string? cursor = null;
        do
        {
            var response = await GetWebhookEventsAsync(limit: limit, cursor: cursor, cancellationToken: cancellationToken).ConfigureAwait(false);
            items.AddRange(response.Data);
            cursor = response.Meta?.Paginate?.NextPage;
        } while (cursor != null);
        return items;
    }

    public async Task<BotResponse> UpdateBotAsync(
        int id,
        BotUpdateRequest request,
        CancellationToken cancellationToken = default)
    {
        var url = $"{_baseUrl}/bots/{id}";
        using var httpRequest = new HttpRequestMessage(HttpMethod.Put, url);
        httpRequest.Content = new StringContent(PachcaUtils.Serialize(request), Encoding.UTF8, "application/json");
        using var response = await PachcaUtils.SendWithRetryAsync(_client, httpRequest, cancellationToken).ConfigureAwait(false);
        var json = await response.Content.ReadAsStringAsync(cancellationToken).ConfigureAwait(false);
        switch ((int)response.StatusCode)
        {
            case 200:
                return PachcaUtils.Deserialize<BotResponseDataWrapper>(json).Data;
            case 401:
                throw PachcaUtils.Deserialize<OAuthError>(json);
            default:
                throw PachcaUtils.Deserialize<ApiError>(json);
        }
    }

    public async Task DeleteWebhookEventAsync(string id, CancellationToken cancellationToken = default)
    {
        var url = $"{_baseUrl}/webhooks/events/{id}";
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

public sealed class ChatsService
{
    private readonly string _baseUrl;
    private readonly HttpClient _client;

    internal ChatsService(string baseUrl, HttpClient client)
    {
        _baseUrl = baseUrl;
        _client = client;
    }

    public async Task<ListChatsResponse> ListChatsAsync(
        SortOrder? sortId = null,
        ChatAvailability? availability = null,
        DateTimeOffset? lastMessageAtAfter = null,
        DateTimeOffset? lastMessageAtBefore = null,
        bool? personal = null,
        int? limit = null,
        string? cursor = null,
        CancellationToken cancellationToken = default)
    {
        var queryParts = new List<string>();
        if (sortId != null)
            queryParts.Add($"sort[{{field}}]={Uri.EscapeDataString(PachcaUtils.EnumToApiString(sortId.Value))}");
        if (availability != null)
            queryParts.Add($"availability={Uri.EscapeDataString(PachcaUtils.EnumToApiString(availability.Value))}");
        if (lastMessageAtAfter != null)
            queryParts.Add($"last_message_at_after={Uri.EscapeDataString(lastMessageAtAfter.Value.ToString("o"))}");
        if (lastMessageAtBefore != null)
            queryParts.Add($"last_message_at_before={Uri.EscapeDataString(lastMessageAtBefore.Value.ToString("o"))}");
        if (personal != null)
            queryParts.Add($"personal={Uri.EscapeDataString((personal.Value ? "true" : "false"))}");
        if (limit != null)
            queryParts.Add($"limit={Uri.EscapeDataString(limit.Value.ToString())}");
        if (cursor != null)
            queryParts.Add($"cursor={Uri.EscapeDataString(cursor)}");
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

    public async Task<List<Chat>> ListChatsAllAsync(
        SortOrder? sortId = null,
        ChatAvailability? availability = null,
        DateTimeOffset? lastMessageAtAfter = null,
        DateTimeOffset? lastMessageAtBefore = null,
        bool? personal = null,
        int? limit = null,
        CancellationToken cancellationToken = default)
    {
        var items = new List<Chat>();
        string? cursor = null;
        do
        {
            var response = await ListChatsAsync(sortId: sortId, availability: availability, lastMessageAtAfter: lastMessageAtAfter, lastMessageAtBefore: lastMessageAtBefore, personal: personal, limit: limit, cursor: cursor, cancellationToken: cancellationToken).ConfigureAwait(false);
            items.AddRange(response.Data);
            cursor = response.Meta?.Paginate?.NextPage;
        } while (cursor != null);
        return items;
    }

    public async Task<Chat> GetChatAsync(int id, CancellationToken cancellationToken = default)
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

    public async Task<Chat> CreateChatAsync(ChatCreateRequest request, CancellationToken cancellationToken = default)
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

    public async Task<Chat> UpdateChatAsync(
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

    public async Task ArchiveChatAsync(int id, CancellationToken cancellationToken = default)
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

    public async Task UnarchiveChatAsync(int id, CancellationToken cancellationToken = default)
    {
        var url = $"{_baseUrl}/chats/{id}/unarchive";
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
}

public sealed class CommonService
{
    private readonly string _baseUrl;
    private readonly HttpClient _client;

    internal CommonService(string baseUrl, HttpClient client)
    {
        _baseUrl = baseUrl;
        _client = client;
    }

    public async Task<string> DownloadExportAsync(int id, CancellationToken cancellationToken = default)
    {
        var url = $"{_baseUrl}/chats/exports/{id}";
        using var request = new HttpRequestMessage(HttpMethod.Get, url);
        using var response = await PachcaUtils.SendWithRetryAsync(_client, request, cancellationToken).ConfigureAwait(false);
        var json = await response.Content.ReadAsStringAsync(cancellationToken).ConfigureAwait(false);
        switch ((int)response.StatusCode)
        {
            case 302:
                return response.Headers.Location?.ToString()
                    ?? throw new InvalidOperationException("Missing Location header in redirect response");
            case 401:
                throw PachcaUtils.Deserialize<OAuthError>(json);
            default:
                throw PachcaUtils.Deserialize<ApiError>(json);
        }
    }

    public async Task<ListPropertiesResponse> ListPropertiesAsync(SearchEntityType entityType, CancellationToken cancellationToken = default)
    {
        var queryParts = new List<string>();
        queryParts.Add($"entity_type={Uri.EscapeDataString(PachcaUtils.EnumToApiString(entityType))}");
        var url = $"{_baseUrl}/custom_properties" + (queryParts.Count > 0 ? "?" + string.Join("&", queryParts) : "");
        using var request = new HttpRequestMessage(HttpMethod.Get, url);
        using var response = await PachcaUtils.SendWithRetryAsync(_client, request, cancellationToken).ConfigureAwait(false);
        var json = await response.Content.ReadAsStringAsync(cancellationToken).ConfigureAwait(false);
        switch ((int)response.StatusCode)
        {
            case 200:
                return PachcaUtils.Deserialize<ListPropertiesResponse>(json);
            case 401:
                throw PachcaUtils.Deserialize<OAuthError>(json);
            default:
                throw PachcaUtils.Deserialize<ApiError>(json);
        }
    }

    public async Task RequestExportAsync(ExportRequest request, CancellationToken cancellationToken = default)
    {
        var url = $"{_baseUrl}/chats/exports";
        using var httpRequest = new HttpRequestMessage(HttpMethod.Post, url);
        httpRequest.Content = new StringContent(PachcaUtils.Serialize(request), Encoding.UTF8, "application/json");
        using var response = await PachcaUtils.SendWithRetryAsync(_client, httpRequest, cancellationToken).ConfigureAwait(false);
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

    public async Task UploadFileAsync(
        string directUrl,
        FileUploadRequest request,
        CancellationToken cancellationToken = default)
    {
        var url = directUrl;
        using var content = new MultipartFormDataContent();
        content.Add(new StringContent(request.ContentDisposition.ToString()!), "Content-Disposition");
        content.Add(new StringContent(request.Acl.ToString()!), "acl");
        content.Add(new StringContent(request.Policy.ToString()!), "policy");
        content.Add(new StringContent(request.XAmzCredential.ToString()!), "x-amz-credential");
        content.Add(new StringContent(request.XAmzAlgorithm.ToString()!), "x-amz-algorithm");
        content.Add(new StringContent(request.XAmzDate.ToString()!), "x-amz-date");
        content.Add(new StringContent(request.XAmzSignature.ToString()!), "x-amz-signature");
        content.Add(new StringContent(request.Key.ToString()!), "key");
        content.Add(new ByteArrayContent(request.File), "file", "file");
        using var httpRequest = new HttpRequestMessage(HttpMethod.Post, url);
        httpRequest.Content = content;
        httpRequest.Headers.Authorization = null;
        using var response = await PachcaUtils.SendWithRetryAsync(_client, httpRequest, cancellationToken).ConfigureAwait(false);
        var json = await response.Content.ReadAsStringAsync(cancellationToken).ConfigureAwait(false);
        switch ((int)response.StatusCode)
        {
            case 204:
                return;
            default:
                throw PachcaUtils.Deserialize<ApiError>(json);
        }
    }

    public async Task<UploadParams> GetUploadParamsAsync(CancellationToken cancellationToken = default)
    {
        var url = $"{_baseUrl}/uploads";
        using var request = new HttpRequestMessage(HttpMethod.Post, url);
        using var response = await PachcaUtils.SendWithRetryAsync(_client, request, cancellationToken).ConfigureAwait(false);
        var json = await response.Content.ReadAsStringAsync(cancellationToken).ConfigureAwait(false);
        switch ((int)response.StatusCode)
        {
            case 201:
                return PachcaUtils.Deserialize<UploadParams>(json);
            case 401:
                throw PachcaUtils.Deserialize<OAuthError>(json);
            default:
                throw PachcaUtils.Deserialize<ApiError>(json);
        }
    }
}

public sealed class MembersService
{
    private readonly string _baseUrl;
    private readonly HttpClient _client;

    internal MembersService(string baseUrl, HttpClient client)
    {
        _baseUrl = baseUrl;
        _client = client;
    }

    public async Task<ListMembersResponse> ListMembersAsync(
        int id,
        ChatMemberRoleFilter? role = null,
        int? limit = null,
        string? cursor = null,
        CancellationToken cancellationToken = default)
    {
        var queryParts = new List<string>();
        if (role != null)
            queryParts.Add($"role={Uri.EscapeDataString(PachcaUtils.EnumToApiString(role.Value))}");
        if (limit != null)
            queryParts.Add($"limit={Uri.EscapeDataString(limit.Value.ToString())}");
        if (cursor != null)
            queryParts.Add($"cursor={Uri.EscapeDataString(cursor)}");
        var url = $"{_baseUrl}/chats/{id}/members" + (queryParts.Count > 0 ? "?" + string.Join("&", queryParts) : "");
        using var request = new HttpRequestMessage(HttpMethod.Get, url);
        using var response = await PachcaUtils.SendWithRetryAsync(_client, request, cancellationToken).ConfigureAwait(false);
        var json = await response.Content.ReadAsStringAsync(cancellationToken).ConfigureAwait(false);
        switch ((int)response.StatusCode)
        {
            case 200:
                return PachcaUtils.Deserialize<ListMembersResponse>(json);
            case 401:
                throw PachcaUtils.Deserialize<OAuthError>(json);
            default:
                throw PachcaUtils.Deserialize<ApiError>(json);
        }
    }

    public async Task<List<User>> ListMembersAllAsync(
        int id,
        ChatMemberRoleFilter? role = null,
        int? limit = null,
        CancellationToken cancellationToken = default)
    {
        var items = new List<User>();
        string? cursor = null;
        do
        {
            var response = await ListMembersAsync(id, role: role, limit: limit, cursor: cursor, cancellationToken: cancellationToken).ConfigureAwait(false);
            items.AddRange(response.Data);
            cursor = response.Meta?.Paginate?.NextPage;
        } while (cursor != null);
        return items;
    }

    public async Task AddTagsAsync(
        int id,
        List<int> groupTagIds,
        CancellationToken cancellationToken = default)
    {
        var url = $"{_baseUrl}/chats/{id}/group_tags";
        using var request = new HttpRequestMessage(HttpMethod.Post, url);
        var body = new AddTagsRequest { GroupTagIds = groupTagIds };
        request.Content = new StringContent(PachcaUtils.Serialize(body), Encoding.UTF8, "application/json");
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

    public async Task AddMembersAsync(
        int id,
        AddMembersRequest request,
        CancellationToken cancellationToken = default)
    {
        var url = $"{_baseUrl}/chats/{id}/members";
        using var httpRequest = new HttpRequestMessage(HttpMethod.Post, url);
        httpRequest.Content = new StringContent(PachcaUtils.Serialize(request), Encoding.UTF8, "application/json");
        using var response = await PachcaUtils.SendWithRetryAsync(_client, httpRequest, cancellationToken).ConfigureAwait(false);
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

    public async Task UpdateMemberRoleAsync(
        int id,
        int userId,
        ChatMemberRole role,
        CancellationToken cancellationToken = default)
    {
        var url = $"{_baseUrl}/chats/{id}/members/{userId}";
        using var request = new HttpRequestMessage(HttpMethod.Put, url);
        var body = new UpdateMemberRoleRequest { Role = role };
        request.Content = new StringContent(PachcaUtils.Serialize(body), Encoding.UTF8, "application/json");
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

    public async Task RemoveTagAsync(
        int id,
        int tagId,
        CancellationToken cancellationToken = default)
    {
        var url = $"{_baseUrl}/chats/{id}/group_tags/{tagId}";
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

    public async Task LeaveChatAsync(int id, CancellationToken cancellationToken = default)
    {
        var url = $"{_baseUrl}/chats/{id}/leave";
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

    public async Task RemoveMemberAsync(
        int id,
        int userId,
        CancellationToken cancellationToken = default)
    {
        var url = $"{_baseUrl}/chats/{id}/members/{userId}";
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

public sealed class GroupTagsService
{
    private readonly string _baseUrl;
    private readonly HttpClient _client;

    internal GroupTagsService(string baseUrl, HttpClient client)
    {
        _baseUrl = baseUrl;
        _client = client;
    }

    public async Task<ListTagsResponse> ListTagsAsync(
        TagNamesFilter? names = null,
        int? limit = null,
        string? cursor = null,
        CancellationToken cancellationToken = default)
    {
        var queryParts = new List<string>();
        if (names != null)
            queryParts.Add($"names={Uri.EscapeDataString(names.ToString())}");
        if (limit != null)
            queryParts.Add($"limit={Uri.EscapeDataString(limit.Value.ToString())}");
        if (cursor != null)
            queryParts.Add($"cursor={Uri.EscapeDataString(cursor)}");
        var url = $"{_baseUrl}/group_tags" + (queryParts.Count > 0 ? "?" + string.Join("&", queryParts) : "");
        using var request = new HttpRequestMessage(HttpMethod.Get, url);
        using var response = await PachcaUtils.SendWithRetryAsync(_client, request, cancellationToken).ConfigureAwait(false);
        var json = await response.Content.ReadAsStringAsync(cancellationToken).ConfigureAwait(false);
        switch ((int)response.StatusCode)
        {
            case 200:
                return PachcaUtils.Deserialize<ListTagsResponse>(json);
            case 401:
                throw PachcaUtils.Deserialize<OAuthError>(json);
            default:
                throw PachcaUtils.Deserialize<ApiError>(json);
        }
    }

    public async Task<List<GroupTag>> ListTagsAllAsync(
        TagNamesFilter? names = null,
        int? limit = null,
        CancellationToken cancellationToken = default)
    {
        var items = new List<GroupTag>();
        string? cursor = null;
        do
        {
            var response = await ListTagsAsync(names: names, limit: limit, cursor: cursor, cancellationToken: cancellationToken).ConfigureAwait(false);
            items.AddRange(response.Data);
            cursor = response.Meta?.Paginate?.NextPage;
        } while (cursor != null);
        return items;
    }

    public async Task<GroupTag> GetTagAsync(int id, CancellationToken cancellationToken = default)
    {
        var url = $"{_baseUrl}/group_tags/{id}";
        using var request = new HttpRequestMessage(HttpMethod.Get, url);
        using var response = await PachcaUtils.SendWithRetryAsync(_client, request, cancellationToken).ConfigureAwait(false);
        var json = await response.Content.ReadAsStringAsync(cancellationToken).ConfigureAwait(false);
        switch ((int)response.StatusCode)
        {
            case 200:
                return PachcaUtils.Deserialize<GroupTagDataWrapper>(json).Data;
            case 401:
                throw PachcaUtils.Deserialize<OAuthError>(json);
            default:
                throw PachcaUtils.Deserialize<ApiError>(json);
        }
    }

    public async Task<ListMembersResponse> GetTagUsersAsync(
        int id,
        int? limit = null,
        string? cursor = null,
        CancellationToken cancellationToken = default)
    {
        var queryParts = new List<string>();
        if (limit != null)
            queryParts.Add($"limit={Uri.EscapeDataString(limit.Value.ToString())}");
        if (cursor != null)
            queryParts.Add($"cursor={Uri.EscapeDataString(cursor)}");
        var url = $"{_baseUrl}/group_tags/{id}/users" + (queryParts.Count > 0 ? "?" + string.Join("&", queryParts) : "");
        using var request = new HttpRequestMessage(HttpMethod.Get, url);
        using var response = await PachcaUtils.SendWithRetryAsync(_client, request, cancellationToken).ConfigureAwait(false);
        var json = await response.Content.ReadAsStringAsync(cancellationToken).ConfigureAwait(false);
        switch ((int)response.StatusCode)
        {
            case 200:
                return PachcaUtils.Deserialize<GetTagUsersResponse>(json);
            case 401:
                throw PachcaUtils.Deserialize<OAuthError>(json);
            default:
                throw PachcaUtils.Deserialize<ApiError>(json);
        }
    }

    public async Task<List<User>> GetTagUsersAllAsync(
        int id,
        int? limit = null,
        CancellationToken cancellationToken = default)
    {
        var items = new List<User>();
        string? cursor = null;
        do
        {
            var response = await GetTagUsersAsync(id, limit: limit, cursor: cursor, cancellationToken: cancellationToken).ConfigureAwait(false);
            items.AddRange(response.Data);
            cursor = response.Meta?.Paginate?.NextPage;
        } while (cursor != null);
        return items;
    }

    public async Task<GroupTag> CreateTagAsync(GroupTagRequest request, CancellationToken cancellationToken = default)
    {
        var url = $"{_baseUrl}/group_tags";
        using var httpRequest = new HttpRequestMessage(HttpMethod.Post, url);
        httpRequest.Content = new StringContent(PachcaUtils.Serialize(request), Encoding.UTF8, "application/json");
        using var response = await PachcaUtils.SendWithRetryAsync(_client, httpRequest, cancellationToken).ConfigureAwait(false);
        var json = await response.Content.ReadAsStringAsync(cancellationToken).ConfigureAwait(false);
        switch ((int)response.StatusCode)
        {
            case 201:
                return PachcaUtils.Deserialize<GroupTagDataWrapper>(json).Data;
            case 401:
                throw PachcaUtils.Deserialize<OAuthError>(json);
            default:
                throw PachcaUtils.Deserialize<ApiError>(json);
        }
    }

    public async Task<GroupTag> UpdateTagAsync(
        int id,
        GroupTagRequest request,
        CancellationToken cancellationToken = default)
    {
        var url = $"{_baseUrl}/group_tags/{id}";
        using var httpRequest = new HttpRequestMessage(HttpMethod.Put, url);
        httpRequest.Content = new StringContent(PachcaUtils.Serialize(request), Encoding.UTF8, "application/json");
        using var response = await PachcaUtils.SendWithRetryAsync(_client, httpRequest, cancellationToken).ConfigureAwait(false);
        var json = await response.Content.ReadAsStringAsync(cancellationToken).ConfigureAwait(false);
        switch ((int)response.StatusCode)
        {
            case 200:
                return PachcaUtils.Deserialize<GroupTagDataWrapper>(json).Data;
            case 401:
                throw PachcaUtils.Deserialize<OAuthError>(json);
            default:
                throw PachcaUtils.Deserialize<ApiError>(json);
        }
    }

    public async Task DeleteTagAsync(int id, CancellationToken cancellationToken = default)
    {
        var url = $"{_baseUrl}/group_tags/{id}";
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

public sealed class MessagesService
{
    private readonly string _baseUrl;
    private readonly HttpClient _client;

    internal MessagesService(string baseUrl, HttpClient client)
    {
        _baseUrl = baseUrl;
        _client = client;
    }

    public async Task<ListChatMessagesResponse> ListChatMessagesAsync(
        int chatId,
        SortOrder? sortId = null,
        int? limit = null,
        string? cursor = null,
        CancellationToken cancellationToken = default)
    {
        var queryParts = new List<string>();
        queryParts.Add($"chat_id={Uri.EscapeDataString(chatId.ToString())}");
        if (sortId != null)
            queryParts.Add($"sort[{{field}}]={Uri.EscapeDataString(PachcaUtils.EnumToApiString(sortId.Value))}");
        if (limit != null)
            queryParts.Add($"limit={Uri.EscapeDataString(limit.Value.ToString())}");
        if (cursor != null)
            queryParts.Add($"cursor={Uri.EscapeDataString(cursor)}");
        var url = $"{_baseUrl}/messages" + (queryParts.Count > 0 ? "?" + string.Join("&", queryParts) : "");
        using var request = new HttpRequestMessage(HttpMethod.Get, url);
        using var response = await PachcaUtils.SendWithRetryAsync(_client, request, cancellationToken).ConfigureAwait(false);
        var json = await response.Content.ReadAsStringAsync(cancellationToken).ConfigureAwait(false);
        switch ((int)response.StatusCode)
        {
            case 200:
                return PachcaUtils.Deserialize<ListChatMessagesResponse>(json);
            case 401:
                throw PachcaUtils.Deserialize<OAuthError>(json);
            default:
                throw PachcaUtils.Deserialize<ApiError>(json);
        }
    }

    public async Task<List<Message>> ListChatMessagesAllAsync(
        int chatId,
        SortOrder? sortId = null,
        int? limit = null,
        CancellationToken cancellationToken = default)
    {
        var items = new List<Message>();
        string? cursor = null;
        do
        {
            var response = await ListChatMessagesAsync(chatId: chatId, sortId: sortId, limit: limit, cursor: cursor, cancellationToken: cancellationToken).ConfigureAwait(false);
            items.AddRange(response.Data);
            cursor = response.Meta?.Paginate?.NextPage;
        } while (cursor != null);
        return items;
    }

    public async Task<Message> GetMessageAsync(int id, CancellationToken cancellationToken = default)
    {
        var url = $"{_baseUrl}/messages/{id}";
        using var request = new HttpRequestMessage(HttpMethod.Get, url);
        using var response = await PachcaUtils.SendWithRetryAsync(_client, request, cancellationToken).ConfigureAwait(false);
        var json = await response.Content.ReadAsStringAsync(cancellationToken).ConfigureAwait(false);
        switch ((int)response.StatusCode)
        {
            case 200:
                return PachcaUtils.Deserialize<MessageDataWrapper>(json).Data;
            case 401:
                throw PachcaUtils.Deserialize<OAuthError>(json);
            default:
                throw PachcaUtils.Deserialize<ApiError>(json);
        }
    }

    public async Task<Message> CreateMessageAsync(MessageCreateRequest request, CancellationToken cancellationToken = default)
    {
        var url = $"{_baseUrl}/messages";
        using var httpRequest = new HttpRequestMessage(HttpMethod.Post, url);
        httpRequest.Content = new StringContent(PachcaUtils.Serialize(request), Encoding.UTF8, "application/json");
        using var response = await PachcaUtils.SendWithRetryAsync(_client, httpRequest, cancellationToken).ConfigureAwait(false);
        var json = await response.Content.ReadAsStringAsync(cancellationToken).ConfigureAwait(false);
        switch ((int)response.StatusCode)
        {
            case 201:
                return PachcaUtils.Deserialize<MessageDataWrapper>(json).Data;
            case 401:
                throw PachcaUtils.Deserialize<OAuthError>(json);
            default:
                throw PachcaUtils.Deserialize<ApiError>(json);
        }
    }

    public async Task PinMessageAsync(int id, CancellationToken cancellationToken = default)
    {
        var url = $"{_baseUrl}/messages/{id}/pin";
        using var request = new HttpRequestMessage(HttpMethod.Post, url);
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

    public async Task<Message> UpdateMessageAsync(
        int id,
        MessageUpdateRequest request,
        CancellationToken cancellationToken = default)
    {
        var url = $"{_baseUrl}/messages/{id}";
        using var httpRequest = new HttpRequestMessage(HttpMethod.Put, url);
        httpRequest.Content = new StringContent(PachcaUtils.Serialize(request), Encoding.UTF8, "application/json");
        using var response = await PachcaUtils.SendWithRetryAsync(_client, httpRequest, cancellationToken).ConfigureAwait(false);
        var json = await response.Content.ReadAsStringAsync(cancellationToken).ConfigureAwait(false);
        switch ((int)response.StatusCode)
        {
            case 200:
                return PachcaUtils.Deserialize<MessageDataWrapper>(json).Data;
            case 401:
                throw PachcaUtils.Deserialize<OAuthError>(json);
            default:
                throw PachcaUtils.Deserialize<ApiError>(json);
        }
    }

    public async Task DeleteMessageAsync(int id, CancellationToken cancellationToken = default)
    {
        var url = $"{_baseUrl}/messages/{id}";
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

    public async Task UnpinMessageAsync(int id, CancellationToken cancellationToken = default)
    {
        var url = $"{_baseUrl}/messages/{id}/pin";
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

public sealed class LinkPreviewsService
{
    private readonly string _baseUrl;
    private readonly HttpClient _client;

    internal LinkPreviewsService(string baseUrl, HttpClient client)
    {
        _baseUrl = baseUrl;
        _client = client;
    }

    public async Task CreateLinkPreviewsAsync(
        int id,
        LinkPreviewsRequest request,
        CancellationToken cancellationToken = default)
    {
        var url = $"{_baseUrl}/messages/{id}/link_previews";
        using var httpRequest = new HttpRequestMessage(HttpMethod.Post, url);
        httpRequest.Content = new StringContent(PachcaUtils.Serialize(request), Encoding.UTF8, "application/json");
        using var response = await PachcaUtils.SendWithRetryAsync(_client, httpRequest, cancellationToken).ConfigureAwait(false);
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

public sealed class ReactionsService
{
    private readonly string _baseUrl;
    private readonly HttpClient _client;

    internal ReactionsService(string baseUrl, HttpClient client)
    {
        _baseUrl = baseUrl;
        _client = client;
    }

    public async Task<ListReactionsResponse> ListReactionsAsync(
        int id,
        int? limit = null,
        string? cursor = null,
        CancellationToken cancellationToken = default)
    {
        var queryParts = new List<string>();
        if (limit != null)
            queryParts.Add($"limit={Uri.EscapeDataString(limit.Value.ToString())}");
        if (cursor != null)
            queryParts.Add($"cursor={Uri.EscapeDataString(cursor)}");
        var url = $"{_baseUrl}/messages/{id}/reactions" + (queryParts.Count > 0 ? "?" + string.Join("&", queryParts) : "");
        using var request = new HttpRequestMessage(HttpMethod.Get, url);
        using var response = await PachcaUtils.SendWithRetryAsync(_client, request, cancellationToken).ConfigureAwait(false);
        var json = await response.Content.ReadAsStringAsync(cancellationToken).ConfigureAwait(false);
        switch ((int)response.StatusCode)
        {
            case 200:
                return PachcaUtils.Deserialize<ListReactionsResponse>(json);
            case 401:
                throw PachcaUtils.Deserialize<OAuthError>(json);
            default:
                throw PachcaUtils.Deserialize<ApiError>(json);
        }
    }

    public async Task<List<Reaction>> ListReactionsAllAsync(
        int id,
        int? limit = null,
        CancellationToken cancellationToken = default)
    {
        var items = new List<Reaction>();
        string? cursor = null;
        do
        {
            var response = await ListReactionsAsync(id, limit: limit, cursor: cursor, cancellationToken: cancellationToken).ConfigureAwait(false);
            items.AddRange(response.Data);
            cursor = response.Meta?.Paginate?.NextPage;
        } while (cursor != null);
        return items;
    }

    public async Task<Reaction> AddReactionAsync(
        int id,
        ReactionRequest request,
        CancellationToken cancellationToken = default)
    {
        var url = $"{_baseUrl}/messages/{id}/reactions";
        using var httpRequest = new HttpRequestMessage(HttpMethod.Post, url);
        httpRequest.Content = new StringContent(PachcaUtils.Serialize(request), Encoding.UTF8, "application/json");
        using var response = await PachcaUtils.SendWithRetryAsync(_client, httpRequest, cancellationToken).ConfigureAwait(false);
        var json = await response.Content.ReadAsStringAsync(cancellationToken).ConfigureAwait(false);
        switch ((int)response.StatusCode)
        {
            case 201:
                return PachcaUtils.Deserialize<Reaction>(json);
            case 401:
                throw PachcaUtils.Deserialize<OAuthError>(json);
            default:
                throw PachcaUtils.Deserialize<ApiError>(json);
        }
    }

    public async Task RemoveReactionAsync(
        int id,
        string code,
        string? name = null,
        CancellationToken cancellationToken = default)
    {
        var queryParts = new List<string>();
        queryParts.Add($"code={Uri.EscapeDataString(code)}");
        if (name != null)
            queryParts.Add($"name={Uri.EscapeDataString(name)}");
        var url = $"{_baseUrl}/messages/{id}/reactions" + (queryParts.Count > 0 ? "?" + string.Join("&", queryParts) : "");
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

public sealed class ReadMembersService
{
    private readonly string _baseUrl;
    private readonly HttpClient _client;

    internal ReadMembersService(string baseUrl, HttpClient client)
    {
        _baseUrl = baseUrl;
        _client = client;
    }

    public async Task<object> ListReadMembersAsync(
        int id,
        int? limit = null,
        string? cursor = null,
        CancellationToken cancellationToken = default)
    {
        var queryParts = new List<string>();
        if (limit != null)
            queryParts.Add($"limit={Uri.EscapeDataString(limit.Value.ToString())}");
        if (cursor != null)
            queryParts.Add($"cursor={Uri.EscapeDataString(cursor)}");
        var url = $"{_baseUrl}/messages/{id}/read_member_ids" + (queryParts.Count > 0 ? "?" + string.Join("&", queryParts) : "");
        using var request = new HttpRequestMessage(HttpMethod.Get, url);
        using var response = await PachcaUtils.SendWithRetryAsync(_client, request, cancellationToken).ConfigureAwait(false);
        var json = await response.Content.ReadAsStringAsync(cancellationToken).ConfigureAwait(false);
        switch ((int)response.StatusCode)
        {
            case 200:
                return PachcaUtils.Deserialize<object>(json);
            case 401:
                throw PachcaUtils.Deserialize<OAuthError>(json);
            default:
                throw PachcaUtils.Deserialize<ApiError>(json);
        }
    }
}

public sealed class ThreadsService
{
    private readonly string _baseUrl;
    private readonly HttpClient _client;

    internal ThreadsService(string baseUrl, HttpClient client)
    {
        _baseUrl = baseUrl;
        _client = client;
    }

    public async Task<Pachca.Sdk.Thread> GetThreadAsync(int id, CancellationToken cancellationToken = default)
    {
        var url = $"{_baseUrl}/threads/{id}";
        using var request = new HttpRequestMessage(HttpMethod.Get, url);
        using var response = await PachcaUtils.SendWithRetryAsync(_client, request, cancellationToken).ConfigureAwait(false);
        var json = await response.Content.ReadAsStringAsync(cancellationToken).ConfigureAwait(false);
        switch ((int)response.StatusCode)
        {
            case 200:
                return PachcaUtils.Deserialize<Pachca.Sdk.ThreadDataWrapper>(json).Data;
            case 401:
                throw PachcaUtils.Deserialize<OAuthError>(json);
            default:
                throw PachcaUtils.Deserialize<ApiError>(json);
        }
    }

    public async Task<Pachca.Sdk.Thread> CreateThreadAsync(int id, CancellationToken cancellationToken = default)
    {
        var url = $"{_baseUrl}/messages/{id}/thread";
        using var request = new HttpRequestMessage(HttpMethod.Post, url);
        using var response = await PachcaUtils.SendWithRetryAsync(_client, request, cancellationToken).ConfigureAwait(false);
        var json = await response.Content.ReadAsStringAsync(cancellationToken).ConfigureAwait(false);
        switch ((int)response.StatusCode)
        {
            case 201:
                return PachcaUtils.Deserialize<Pachca.Sdk.ThreadDataWrapper>(json).Data;
            case 401:
                throw PachcaUtils.Deserialize<OAuthError>(json);
            default:
                throw PachcaUtils.Deserialize<ApiError>(json);
        }
    }
}

public sealed class ProfileService
{
    private readonly string _baseUrl;
    private readonly HttpClient _client;

    internal ProfileService(string baseUrl, HttpClient client)
    {
        _baseUrl = baseUrl;
        _client = client;
    }

    public async Task<AccessTokenInfo> GetTokenInfoAsync(CancellationToken cancellationToken = default)
    {
        var url = $"{_baseUrl}/oauth/token/info";
        using var request = new HttpRequestMessage(HttpMethod.Get, url);
        using var response = await PachcaUtils.SendWithRetryAsync(_client, request, cancellationToken).ConfigureAwait(false);
        var json = await response.Content.ReadAsStringAsync(cancellationToken).ConfigureAwait(false);
        switch ((int)response.StatusCode)
        {
            case 200:
                return PachcaUtils.Deserialize<AccessTokenInfoDataWrapper>(json).Data;
            case 401:
                throw PachcaUtils.Deserialize<OAuthError>(json);
            default:
                throw PachcaUtils.Deserialize<ApiError>(json);
        }
    }

    public async Task<User> GetProfileAsync(CancellationToken cancellationToken = default)
    {
        var url = $"{_baseUrl}/profile";
        using var request = new HttpRequestMessage(HttpMethod.Get, url);
        using var response = await PachcaUtils.SendWithRetryAsync(_client, request, cancellationToken).ConfigureAwait(false);
        var json = await response.Content.ReadAsStringAsync(cancellationToken).ConfigureAwait(false);
        switch ((int)response.StatusCode)
        {
            case 200:
                return PachcaUtils.Deserialize<UserDataWrapper>(json).Data;
            case 401:
                throw PachcaUtils.Deserialize<OAuthError>(json);
            default:
                throw PachcaUtils.Deserialize<ApiError>(json);
        }
    }

    public async Task<object> GetStatusAsync(CancellationToken cancellationToken = default)
    {
        var url = $"{_baseUrl}/profile/status";
        using var request = new HttpRequestMessage(HttpMethod.Get, url);
        using var response = await PachcaUtils.SendWithRetryAsync(_client, request, cancellationToken).ConfigureAwait(false);
        var json = await response.Content.ReadAsStringAsync(cancellationToken).ConfigureAwait(false);
        switch ((int)response.StatusCode)
        {
            case 200:
                return PachcaUtils.Deserialize<object>(json);
            case 401:
                throw PachcaUtils.Deserialize<OAuthError>(json);
            default:
                throw PachcaUtils.Deserialize<ApiError>(json);
        }
    }

    public async Task<UserStatus> UpdateStatusAsync(StatusUpdateRequest request, CancellationToken cancellationToken = default)
    {
        var url = $"{_baseUrl}/profile/status";
        using var httpRequest = new HttpRequestMessage(HttpMethod.Put, url);
        httpRequest.Content = new StringContent(PachcaUtils.Serialize(request), Encoding.UTF8, "application/json");
        using var response = await PachcaUtils.SendWithRetryAsync(_client, httpRequest, cancellationToken).ConfigureAwait(false);
        var json = await response.Content.ReadAsStringAsync(cancellationToken).ConfigureAwait(false);
        switch ((int)response.StatusCode)
        {
            case 200:
                return PachcaUtils.Deserialize<UserStatusDataWrapper>(json).Data;
            case 401:
                throw PachcaUtils.Deserialize<OAuthError>(json);
            default:
                throw PachcaUtils.Deserialize<ApiError>(json);
        }
    }

    public async Task DeleteStatusAsync(CancellationToken cancellationToken = default)
    {
        var url = $"{_baseUrl}/profile/status";
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

public sealed class SearchService
{
    private readonly string _baseUrl;
    private readonly HttpClient _client;

    internal SearchService(string baseUrl, HttpClient client)
    {
        _baseUrl = baseUrl;
        _client = client;
    }

    public async Task<ListChatsResponse> SearchChatsAsync(
        string? query = null,
        int? limit = null,
        string? cursor = null,
        SortOrder? order = null,
        DateTimeOffset? createdFrom = null,
        DateTimeOffset? createdTo = null,
        bool? active = null,
        ChatSubtype? chatSubtype = null,
        bool? personal = null,
        CancellationToken cancellationToken = default)
    {
        var queryParts = new List<string>();
        if (query != null)
            queryParts.Add($"query={Uri.EscapeDataString(query)}");
        if (limit != null)
            queryParts.Add($"limit={Uri.EscapeDataString(limit.Value.ToString())}");
        if (cursor != null)
            queryParts.Add($"cursor={Uri.EscapeDataString(cursor)}");
        if (order != null)
            queryParts.Add($"order={Uri.EscapeDataString(PachcaUtils.EnumToApiString(order.Value))}");
        if (createdFrom != null)
            queryParts.Add($"created_from={Uri.EscapeDataString(createdFrom.Value.ToString("o"))}");
        if (createdTo != null)
            queryParts.Add($"created_to={Uri.EscapeDataString(createdTo.Value.ToString("o"))}");
        if (active != null)
            queryParts.Add($"active={Uri.EscapeDataString((active.Value ? "true" : "false"))}");
        if (chatSubtype != null)
            queryParts.Add($"chat_subtype={Uri.EscapeDataString(PachcaUtils.EnumToApiString(chatSubtype.Value))}");
        if (personal != null)
            queryParts.Add($"personal={Uri.EscapeDataString((personal.Value ? "true" : "false"))}");
        var url = $"{_baseUrl}/search/chats" + (queryParts.Count > 0 ? "?" + string.Join("&", queryParts) : "");
        using var request = new HttpRequestMessage(HttpMethod.Get, url);
        using var response = await PachcaUtils.SendWithRetryAsync(_client, request, cancellationToken).ConfigureAwait(false);
        var json = await response.Content.ReadAsStringAsync(cancellationToken).ConfigureAwait(false);
        switch ((int)response.StatusCode)
        {
            case 200:
                return PachcaUtils.Deserialize<SearchChatsResponse>(json);
            case 401:
                throw PachcaUtils.Deserialize<OAuthError>(json);
            default:
                throw PachcaUtils.Deserialize<ApiError>(json);
        }
    }

    public async Task<List<Chat>> SearchChatsAllAsync(
        string? query = null,
        int? limit = null,
        SortOrder? order = null,
        DateTimeOffset? createdFrom = null,
        DateTimeOffset? createdTo = null,
        bool? active = null,
        ChatSubtype? chatSubtype = null,
        bool? personal = null,
        CancellationToken cancellationToken = default)
    {
        var items = new List<Chat>();
        string? cursor = null;
        do
        {
            var response = await SearchChatsAsync(query: query, limit: limit, cursor: cursor, order: order, createdFrom: createdFrom, createdTo: createdTo, active: active, chatSubtype: chatSubtype, personal: personal, cancellationToken: cancellationToken).ConfigureAwait(false);
            items.AddRange(response.Data);
            cursor = response.Meta?.Paginate?.NextPage;
        } while (cursor != null);
        return items;
    }

    public async Task<ListChatMessagesResponse> SearchMessagesAsync(
        string? query = null,
        int? limit = null,
        string? cursor = null,
        SortOrder? order = null,
        DateTimeOffset? createdFrom = null,
        DateTimeOffset? createdTo = null,
        List<int>? chatIds = null,
        List<int>? userIds = null,
        bool? active = null,
        CancellationToken cancellationToken = default)
    {
        var queryParts = new List<string>();
        if (query != null)
            queryParts.Add($"query={Uri.EscapeDataString(query)}");
        if (limit != null)
            queryParts.Add($"limit={Uri.EscapeDataString(limit.Value.ToString())}");
        if (cursor != null)
            queryParts.Add($"cursor={Uri.EscapeDataString(cursor)}");
        if (order != null)
            queryParts.Add($"order={Uri.EscapeDataString(PachcaUtils.EnumToApiString(order.Value))}");
        if (createdFrom != null)
            queryParts.Add($"created_from={Uri.EscapeDataString(createdFrom.Value.ToString("o"))}");
        if (createdTo != null)
            queryParts.Add($"created_to={Uri.EscapeDataString(createdTo.Value.ToString("o"))}");
        if (chatIds != null)
            queryParts.Add($"chat_ids={Uri.EscapeDataString(chatIds.ToString())}");
        if (userIds != null)
            queryParts.Add($"user_ids={Uri.EscapeDataString(userIds.ToString())}");
        if (active != null)
            queryParts.Add($"active={Uri.EscapeDataString((active.Value ? "true" : "false"))}");
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
                throw PachcaUtils.Deserialize<ApiError>(json);
        }
    }

    public async Task<List<Message>> SearchMessagesAllAsync(
        string? query = null,
        int? limit = null,
        SortOrder? order = null,
        DateTimeOffset? createdFrom = null,
        DateTimeOffset? createdTo = null,
        List<int>? chatIds = null,
        List<int>? userIds = null,
        bool? active = null,
        CancellationToken cancellationToken = default)
    {
        var items = new List<Message>();
        string? cursor = null;
        do
        {
            var response = await SearchMessagesAsync(query: query, limit: limit, cursor: cursor, order: order, createdFrom: createdFrom, createdTo: createdTo, chatIds: chatIds, userIds: userIds, active: active, cancellationToken: cancellationToken).ConfigureAwait(false);
            items.AddRange(response.Data);
            cursor = response.Meta?.Paginate?.NextPage;
        } while (cursor != null);
        return items;
    }

    public async Task<ListMembersResponse> SearchUsersAsync(
        string? query = null,
        int? limit = null,
        string? cursor = null,
        SearchSortOrder? sort = null,
        SortOrder? order = null,
        DateTimeOffset? createdFrom = null,
        DateTimeOffset? createdTo = null,
        List<UserRole>? companyRoles = null,
        CancellationToken cancellationToken = default)
    {
        var queryParts = new List<string>();
        if (query != null)
            queryParts.Add($"query={Uri.EscapeDataString(query)}");
        if (limit != null)
            queryParts.Add($"limit={Uri.EscapeDataString(limit.Value.ToString())}");
        if (cursor != null)
            queryParts.Add($"cursor={Uri.EscapeDataString(cursor)}");
        if (sort != null)
            queryParts.Add($"sort={Uri.EscapeDataString(PachcaUtils.EnumToApiString(sort.Value))}");
        if (order != null)
            queryParts.Add($"order={Uri.EscapeDataString(PachcaUtils.EnumToApiString(order.Value))}");
        if (createdFrom != null)
            queryParts.Add($"created_from={Uri.EscapeDataString(createdFrom.Value.ToString("o"))}");
        if (createdTo != null)
            queryParts.Add($"created_to={Uri.EscapeDataString(createdTo.Value.ToString("o"))}");
        if (companyRoles != null)
            queryParts.Add($"company_roles={Uri.EscapeDataString(companyRoles.ToString())}");
        var url = $"{_baseUrl}/search/users" + (queryParts.Count > 0 ? "?" + string.Join("&", queryParts) : "");
        using var request = new HttpRequestMessage(HttpMethod.Get, url);
        using var response = await PachcaUtils.SendWithRetryAsync(_client, request, cancellationToken).ConfigureAwait(false);
        var json = await response.Content.ReadAsStringAsync(cancellationToken).ConfigureAwait(false);
        switch ((int)response.StatusCode)
        {
            case 200:
                return PachcaUtils.Deserialize<SearchUsersResponse>(json);
            case 401:
                throw PachcaUtils.Deserialize<OAuthError>(json);
            default:
                throw PachcaUtils.Deserialize<ApiError>(json);
        }
    }

    public async Task<List<User>> SearchUsersAllAsync(
        string? query = null,
        int? limit = null,
        SearchSortOrder? sort = null,
        SortOrder? order = null,
        DateTimeOffset? createdFrom = null,
        DateTimeOffset? createdTo = null,
        List<UserRole>? companyRoles = null,
        CancellationToken cancellationToken = default)
    {
        var items = new List<User>();
        string? cursor = null;
        do
        {
            var response = await SearchUsersAsync(query: query, limit: limit, cursor: cursor, sort: sort, order: order, createdFrom: createdFrom, createdTo: createdTo, companyRoles: companyRoles, cancellationToken: cancellationToken).ConfigureAwait(false);
            items.AddRange(response.Data);
            cursor = response.Meta?.Paginate?.NextPage;
        } while (cursor != null);
        return items;
    }
}

public sealed class TasksService
{
    private readonly string _baseUrl;
    private readonly HttpClient _client;

    internal TasksService(string baseUrl, HttpClient client)
    {
        _baseUrl = baseUrl;
        _client = client;
    }

    public async Task<ListTasksResponse> ListTasksAsync(
        int? limit = null,
        string? cursor = null,
        CancellationToken cancellationToken = default)
    {
        var queryParts = new List<string>();
        if (limit != null)
            queryParts.Add($"limit={Uri.EscapeDataString(limit.Value.ToString())}");
        if (cursor != null)
            queryParts.Add($"cursor={Uri.EscapeDataString(cursor)}");
        var url = $"{_baseUrl}/tasks" + (queryParts.Count > 0 ? "?" + string.Join("&", queryParts) : "");
        using var request = new HttpRequestMessage(HttpMethod.Get, url);
        using var response = await PachcaUtils.SendWithRetryAsync(_client, request, cancellationToken).ConfigureAwait(false);
        var json = await response.Content.ReadAsStringAsync(cancellationToken).ConfigureAwait(false);
        switch ((int)response.StatusCode)
        {
            case 200:
                return PachcaUtils.Deserialize<ListTasksResponse>(json);
            case 401:
                throw PachcaUtils.Deserialize<OAuthError>(json);
            default:
                throw PachcaUtils.Deserialize<ApiError>(json);
        }
    }

    public async Task<List<Pachca.Sdk.Task>> ListTasksAllAsync(
        int? limit = null,
        CancellationToken cancellationToken = default)
    {
        var items = new List<Pachca.Sdk.Task>();
        string? cursor = null;
        do
        {
            var response = await ListTasksAsync(limit: limit, cursor: cursor, cancellationToken: cancellationToken).ConfigureAwait(false);
            items.AddRange(response.Data);
            cursor = response.Meta?.Paginate?.NextPage;
        } while (cursor != null);
        return items;
    }

    public async Task<Pachca.Sdk.Task> GetTaskAsync(int id, CancellationToken cancellationToken = default)
    {
        var url = $"{_baseUrl}/tasks/{id}";
        using var request = new HttpRequestMessage(HttpMethod.Get, url);
        using var response = await PachcaUtils.SendWithRetryAsync(_client, request, cancellationToken).ConfigureAwait(false);
        var json = await response.Content.ReadAsStringAsync(cancellationToken).ConfigureAwait(false);
        switch ((int)response.StatusCode)
        {
            case 200:
                return PachcaUtils.Deserialize<Pachca.Sdk.TaskDataWrapper>(json).Data;
            case 401:
                throw PachcaUtils.Deserialize<OAuthError>(json);
            default:
                throw PachcaUtils.Deserialize<ApiError>(json);
        }
    }

    public async Task<Pachca.Sdk.Task> CreateTaskAsync(TaskCreateRequest request, CancellationToken cancellationToken = default)
    {
        var url = $"{_baseUrl}/tasks";
        using var httpRequest = new HttpRequestMessage(HttpMethod.Post, url);
        httpRequest.Content = new StringContent(PachcaUtils.Serialize(request), Encoding.UTF8, "application/json");
        using var response = await PachcaUtils.SendWithRetryAsync(_client, httpRequest, cancellationToken).ConfigureAwait(false);
        var json = await response.Content.ReadAsStringAsync(cancellationToken).ConfigureAwait(false);
        switch ((int)response.StatusCode)
        {
            case 201:
                return PachcaUtils.Deserialize<Pachca.Sdk.TaskDataWrapper>(json).Data;
            case 401:
                throw PachcaUtils.Deserialize<OAuthError>(json);
            default:
                throw PachcaUtils.Deserialize<ApiError>(json);
        }
    }

    public async Task<Pachca.Sdk.Task> UpdateTaskAsync(
        int id,
        TaskUpdateRequest request,
        CancellationToken cancellationToken = default)
    {
        var url = $"{_baseUrl}/tasks/{id}";
        using var httpRequest = new HttpRequestMessage(HttpMethod.Put, url);
        httpRequest.Content = new StringContent(PachcaUtils.Serialize(request), Encoding.UTF8, "application/json");
        using var response = await PachcaUtils.SendWithRetryAsync(_client, httpRequest, cancellationToken).ConfigureAwait(false);
        var json = await response.Content.ReadAsStringAsync(cancellationToken).ConfigureAwait(false);
        switch ((int)response.StatusCode)
        {
            case 200:
                return PachcaUtils.Deserialize<Pachca.Sdk.TaskDataWrapper>(json).Data;
            case 401:
                throw PachcaUtils.Deserialize<OAuthError>(json);
            default:
                throw PachcaUtils.Deserialize<ApiError>(json);
        }
    }

    public async Task DeleteTaskAsync(int id, CancellationToken cancellationToken = default)
    {
        var url = $"{_baseUrl}/tasks/{id}";
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

public sealed class UsersService
{
    private readonly string _baseUrl;
    private readonly HttpClient _client;

    internal UsersService(string baseUrl, HttpClient client)
    {
        _baseUrl = baseUrl;
        _client = client;
    }

    public async Task<ListMembersResponse> ListUsersAsync(
        string? query = null,
        int? limit = null,
        string? cursor = null,
        CancellationToken cancellationToken = default)
    {
        var queryParts = new List<string>();
        if (query != null)
            queryParts.Add($"query={Uri.EscapeDataString(query)}");
        if (limit != null)
            queryParts.Add($"limit={Uri.EscapeDataString(limit.Value.ToString())}");
        if (cursor != null)
            queryParts.Add($"cursor={Uri.EscapeDataString(cursor)}");
        var url = $"{_baseUrl}/users" + (queryParts.Count > 0 ? "?" + string.Join("&", queryParts) : "");
        using var request = new HttpRequestMessage(HttpMethod.Get, url);
        using var response = await PachcaUtils.SendWithRetryAsync(_client, request, cancellationToken).ConfigureAwait(false);
        var json = await response.Content.ReadAsStringAsync(cancellationToken).ConfigureAwait(false);
        switch ((int)response.StatusCode)
        {
            case 200:
                return PachcaUtils.Deserialize<ListUsersResponse>(json);
            case 401:
                throw PachcaUtils.Deserialize<OAuthError>(json);
            default:
                throw PachcaUtils.Deserialize<ApiError>(json);
        }
    }

    public async Task<List<User>> ListUsersAllAsync(
        string? query = null,
        int? limit = null,
        CancellationToken cancellationToken = default)
    {
        var items = new List<User>();
        string? cursor = null;
        do
        {
            var response = await ListUsersAsync(query: query, limit: limit, cursor: cursor, cancellationToken: cancellationToken).ConfigureAwait(false);
            items.AddRange(response.Data);
            cursor = response.Meta?.Paginate?.NextPage;
        } while (cursor != null);
        return items;
    }

    public async Task<User> GetUserAsync(int id, CancellationToken cancellationToken = default)
    {
        var url = $"{_baseUrl}/users/{id}";
        using var request = new HttpRequestMessage(HttpMethod.Get, url);
        using var response = await PachcaUtils.SendWithRetryAsync(_client, request, cancellationToken).ConfigureAwait(false);
        var json = await response.Content.ReadAsStringAsync(cancellationToken).ConfigureAwait(false);
        switch ((int)response.StatusCode)
        {
            case 200:
                return PachcaUtils.Deserialize<UserDataWrapper>(json).Data;
            case 401:
                throw PachcaUtils.Deserialize<OAuthError>(json);
            default:
                throw PachcaUtils.Deserialize<ApiError>(json);
        }
    }

    public async Task<object> GetUserStatusAsync(int userId, CancellationToken cancellationToken = default)
    {
        var url = $"{_baseUrl}/users/{userId}/status";
        using var request = new HttpRequestMessage(HttpMethod.Get, url);
        using var response = await PachcaUtils.SendWithRetryAsync(_client, request, cancellationToken).ConfigureAwait(false);
        var json = await response.Content.ReadAsStringAsync(cancellationToken).ConfigureAwait(false);
        switch ((int)response.StatusCode)
        {
            case 200:
                return PachcaUtils.Deserialize<object>(json);
            case 401:
                throw PachcaUtils.Deserialize<OAuthError>(json);
            default:
                throw PachcaUtils.Deserialize<ApiError>(json);
        }
    }

    public async Task<User> CreateUserAsync(UserCreateRequest request, CancellationToken cancellationToken = default)
    {
        var url = $"{_baseUrl}/users";
        using var httpRequest = new HttpRequestMessage(HttpMethod.Post, url);
        httpRequest.Content = new StringContent(PachcaUtils.Serialize(request), Encoding.UTF8, "application/json");
        using var response = await PachcaUtils.SendWithRetryAsync(_client, httpRequest, cancellationToken).ConfigureAwait(false);
        var json = await response.Content.ReadAsStringAsync(cancellationToken).ConfigureAwait(false);
        switch ((int)response.StatusCode)
        {
            case 201:
                return PachcaUtils.Deserialize<UserDataWrapper>(json).Data;
            case 401:
                throw PachcaUtils.Deserialize<OAuthError>(json);
            default:
                throw PachcaUtils.Deserialize<ApiError>(json);
        }
    }

    public async Task<User> UpdateUserAsync(
        int id,
        UserUpdateRequest request,
        CancellationToken cancellationToken = default)
    {
        var url = $"{_baseUrl}/users/{id}";
        using var httpRequest = new HttpRequestMessage(HttpMethod.Put, url);
        httpRequest.Content = new StringContent(PachcaUtils.Serialize(request), Encoding.UTF8, "application/json");
        using var response = await PachcaUtils.SendWithRetryAsync(_client, httpRequest, cancellationToken).ConfigureAwait(false);
        var json = await response.Content.ReadAsStringAsync(cancellationToken).ConfigureAwait(false);
        switch ((int)response.StatusCode)
        {
            case 200:
                return PachcaUtils.Deserialize<UserDataWrapper>(json).Data;
            case 401:
                throw PachcaUtils.Deserialize<OAuthError>(json);
            default:
                throw PachcaUtils.Deserialize<ApiError>(json);
        }
    }

    public async Task<UserStatus> UpdateUserStatusAsync(
        int userId,
        StatusUpdateRequest request,
        CancellationToken cancellationToken = default)
    {
        var url = $"{_baseUrl}/users/{userId}/status";
        using var httpRequest = new HttpRequestMessage(HttpMethod.Put, url);
        httpRequest.Content = new StringContent(PachcaUtils.Serialize(request), Encoding.UTF8, "application/json");
        using var response = await PachcaUtils.SendWithRetryAsync(_client, httpRequest, cancellationToken).ConfigureAwait(false);
        var json = await response.Content.ReadAsStringAsync(cancellationToken).ConfigureAwait(false);
        switch ((int)response.StatusCode)
        {
            case 200:
                return PachcaUtils.Deserialize<UserStatusDataWrapper>(json).Data;
            case 401:
                throw PachcaUtils.Deserialize<OAuthError>(json);
            default:
                throw PachcaUtils.Deserialize<ApiError>(json);
        }
    }

    public async Task DeleteUserAsync(int id, CancellationToken cancellationToken = default)
    {
        var url = $"{_baseUrl}/users/{id}";
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

    public async Task DeleteUserStatusAsync(int userId, CancellationToken cancellationToken = default)
    {
        var url = $"{_baseUrl}/users/{userId}/status";
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

public sealed class ViewsService
{
    private readonly string _baseUrl;
    private readonly HttpClient _client;

    internal ViewsService(string baseUrl, HttpClient client)
    {
        _baseUrl = baseUrl;
        _client = client;
    }

    public async Task OpenViewAsync(OpenViewRequest request, CancellationToken cancellationToken = default)
    {
        var url = $"{_baseUrl}/views/open";
        using var httpRequest = new HttpRequestMessage(HttpMethod.Post, url);
        httpRequest.Content = new StringContent(PachcaUtils.Serialize(request), Encoding.UTF8, "application/json");
        using var response = await PachcaUtils.SendWithRetryAsync(_client, httpRequest, cancellationToken).ConfigureAwait(false);
        var json = await response.Content.ReadAsStringAsync(cancellationToken).ConfigureAwait(false);
        switch ((int)response.StatusCode)
        {
            case 201:
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

    public BotsService Bots { get; }
    public ChatsService Chats { get; }
    public CommonService Common { get; }
    public GroupTagsService GroupTags { get; }
    public LinkPreviewsService LinkPreviews { get; }
    public MembersService Members { get; }
    public MessagesService Messages { get; }
    public ProfileService Profile { get; }
    public ReactionsService Reactions { get; }
    public ReadMembersService ReadMembers { get; }
    public SearchService Search { get; }
    public SecurityService Security { get; }
    public TasksService Tasks { get; }
    public ThreadsService Threads { get; }
    public UsersService Users { get; }
    public ViewsService Views { get; }

    public PachcaClient(string token, string baseUrl = "https://api.pachca.com/api/shared/v1")
    {
        var handler = new SocketsHttpHandler
        {
            AllowAutoRedirect = false,
        };
        _client = new HttpClient(handler);
        _client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", token);

        Bots = new BotsService(baseUrl, _client);
        Chats = new ChatsService(baseUrl, _client);
        Common = new CommonService(baseUrl, _client);
        GroupTags = new GroupTagsService(baseUrl, _client);
        LinkPreviews = new LinkPreviewsService(baseUrl, _client);
        Members = new MembersService(baseUrl, _client);
        Messages = new MessagesService(baseUrl, _client);
        Profile = new ProfileService(baseUrl, _client);
        Reactions = new ReactionsService(baseUrl, _client);
        ReadMembers = new ReadMembersService(baseUrl, _client);
        Search = new SearchService(baseUrl, _client);
        Security = new SecurityService(baseUrl, _client);
        Tasks = new TasksService(baseUrl, _client);
        Threads = new ThreadsService(baseUrl, _client);
        Users = new UsersService(baseUrl, _client);
        Views = new ViewsService(baseUrl, _client);
    }

    public void Dispose()
    {
        _client.Dispose();
        GC.SuppressFinalize(this);
    }
}
