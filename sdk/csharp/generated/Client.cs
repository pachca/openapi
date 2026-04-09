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

namespace Pachca.Sdk;

public class SecurityService
{

    public virtual async System.Threading.Tasks.Task<GetAuditEventsResponse> GetAuditEventsAsync(
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
        throw new NotImplementedException("Security.getAuditEvents is not implemented");
    }

    public virtual async System.Threading.Tasks.Task<List<AuditEvent>> GetAuditEventsAllAsync(
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
        throw new NotImplementedException("Security.getAuditEventsAll is not implemented");
    }
}

public sealed class SecurityServiceImpl : SecurityService
{
    private readonly string _baseUrl;
    private readonly HttpClient _client;

    internal SecurityServiceImpl(string baseUrl, HttpClient client)
    {
        _baseUrl = baseUrl;
        _client = client;
    }

    public override async System.Threading.Tasks.Task<GetAuditEventsResponse> GetAuditEventsAsync(
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
            queryParts.Add($"limit={Uri.EscapeDataString(limit.Value.ToString()!)}");
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

    public override async System.Threading.Tasks.Task<List<AuditEvent>> GetAuditEventsAllAsync(
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
            if (response.Data.Count == 0) break;
            cursor = response.Meta.Paginate.NextPage;
        } while (true);
        return items;
    }
}

public class BotsService
{

    public virtual async System.Threading.Tasks.Task<GetWebhookEventsResponse> GetWebhookEventsAsync(
        int? limit = null,
        string? cursor = null,
        CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException("Bots.getWebhookEvents is not implemented");
    }

    public virtual async System.Threading.Tasks.Task<List<WebhookEvent>> GetWebhookEventsAllAsync(
        int? limit = null,
        CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException("Bots.getWebhookEventsAll is not implemented");
    }

    public virtual async System.Threading.Tasks.Task<BotResponse> UpdateBotAsync(
        int id,
        BotUpdateRequest request,
        CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException("Bots.updateBot is not implemented");
    }

    public virtual async System.Threading.Tasks.Task DeleteWebhookEventAsync(string id, CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException("Bots.deleteWebhookEvent is not implemented");
    }
}

public sealed class BotsServiceImpl : BotsService
{
    private readonly string _baseUrl;
    private readonly HttpClient _client;

    internal BotsServiceImpl(string baseUrl, HttpClient client)
    {
        _baseUrl = baseUrl;
        _client = client;
    }

    public override async System.Threading.Tasks.Task<GetWebhookEventsResponse> GetWebhookEventsAsync(
        int? limit = null,
        string? cursor = null,
        CancellationToken cancellationToken = default)
    {
        var queryParts = new List<string>();
        if (limit != null)
            queryParts.Add($"limit={Uri.EscapeDataString(limit.Value.ToString()!)}");
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

    public override async System.Threading.Tasks.Task<List<WebhookEvent>> GetWebhookEventsAllAsync(
        int? limit = null,
        CancellationToken cancellationToken = default)
    {
        var items = new List<WebhookEvent>();
        string? cursor = null;
        do
        {
            var response = await GetWebhookEventsAsync(limit: limit, cursor: cursor, cancellationToken: cancellationToken).ConfigureAwait(false);
            items.AddRange(response.Data);
            if (response.Data.Count == 0) break;
            cursor = response.Meta.Paginate.NextPage;
        } while (true);
        return items;
    }

    public override async System.Threading.Tasks.Task<BotResponse> UpdateBotAsync(
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

    public override async System.Threading.Tasks.Task DeleteWebhookEventAsync(string id, CancellationToken cancellationToken = default)
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

public class ChatsService
{

    public virtual async System.Threading.Tasks.Task<ListChatsResponse> ListChatsAsync(
        ChatSortField? sort = null,
        SortOrder? order = null,
        ChatAvailability? availability = null,
        DateTimeOffset? lastMessageAtAfter = null,
        DateTimeOffset? lastMessageAtBefore = null,
        bool? personal = null,
        int? limit = null,
        string? cursor = null,
        CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException("Chats.listChats is not implemented");
    }

    public virtual async System.Threading.Tasks.Task<List<Chat>> ListChatsAllAsync(
        ChatSortField? sort = null,
        SortOrder? order = null,
        ChatAvailability? availability = null,
        DateTimeOffset? lastMessageAtAfter = null,
        DateTimeOffset? lastMessageAtBefore = null,
        bool? personal = null,
        int? limit = null,
        CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException("Chats.listChatsAll is not implemented");
    }

    public virtual async System.Threading.Tasks.Task<Chat> GetChatAsync(int id, CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException("Chats.getChat is not implemented");
    }

    public virtual async System.Threading.Tasks.Task<Chat> CreateChatAsync(ChatCreateRequest request, CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException("Chats.createChat is not implemented");
    }

    public virtual async System.Threading.Tasks.Task<Chat> UpdateChatAsync(
        int id,
        ChatUpdateRequest request,
        CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException("Chats.updateChat is not implemented");
    }

    public virtual async System.Threading.Tasks.Task ArchiveChatAsync(int id, CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException("Chats.archiveChat is not implemented");
    }

    public virtual async System.Threading.Tasks.Task UnarchiveChatAsync(int id, CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException("Chats.unarchiveChat is not implemented");
    }
}

public sealed class ChatsServiceImpl : ChatsService
{
    private readonly string _baseUrl;
    private readonly HttpClient _client;

    internal ChatsServiceImpl(string baseUrl, HttpClient client)
    {
        _baseUrl = baseUrl;
        _client = client;
    }

    public override async System.Threading.Tasks.Task<ListChatsResponse> ListChatsAsync(
        ChatSortField? sort = null,
        SortOrder? order = null,
        ChatAvailability? availability = null,
        DateTimeOffset? lastMessageAtAfter = null,
        DateTimeOffset? lastMessageAtBefore = null,
        bool? personal = null,
        int? limit = null,
        string? cursor = null,
        CancellationToken cancellationToken = default)
    {
        var queryParts = new List<string>();
        if (sort != null)
            queryParts.Add($"sort={Uri.EscapeDataString(PachcaUtils.EnumToApiString(sort.Value))}");
        if (order != null)
            queryParts.Add($"order={Uri.EscapeDataString(PachcaUtils.EnumToApiString(order.Value))}");
        if (availability != null)
            queryParts.Add($"availability={Uri.EscapeDataString(PachcaUtils.EnumToApiString(availability.Value))}");
        if (lastMessageAtAfter != null)
            queryParts.Add($"last_message_at_after={Uri.EscapeDataString(lastMessageAtAfter.Value.ToString("o"))}");
        if (lastMessageAtBefore != null)
            queryParts.Add($"last_message_at_before={Uri.EscapeDataString(lastMessageAtBefore.Value.ToString("o"))}");
        if (personal != null)
            queryParts.Add($"personal={Uri.EscapeDataString((personal.Value ? "true" : "false"))}");
        if (limit != null)
            queryParts.Add($"limit={Uri.EscapeDataString(limit.Value.ToString()!)}");
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

    public override async System.Threading.Tasks.Task<List<Chat>> ListChatsAllAsync(
        ChatSortField? sort = null,
        SortOrder? order = null,
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
            var response = await ListChatsAsync(sort: sort, order: order, availability: availability, lastMessageAtAfter: lastMessageAtAfter, lastMessageAtBefore: lastMessageAtBefore, personal: personal, limit: limit, cursor: cursor, cancellationToken: cancellationToken).ConfigureAwait(false);
            items.AddRange(response.Data);
            if (response.Data.Count == 0) break;
            cursor = response.Meta.Paginate.NextPage;
        } while (true);
        return items;
    }

    public override async System.Threading.Tasks.Task<Chat> GetChatAsync(int id, CancellationToken cancellationToken = default)
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

    public override async System.Threading.Tasks.Task<Chat> CreateChatAsync(ChatCreateRequest request, CancellationToken cancellationToken = default)
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

    public override async System.Threading.Tasks.Task<Chat> UpdateChatAsync(
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

    public override async System.Threading.Tasks.Task ArchiveChatAsync(int id, CancellationToken cancellationToken = default)
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

    public override async System.Threading.Tasks.Task UnarchiveChatAsync(int id, CancellationToken cancellationToken = default)
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

public class CommonService
{

    public virtual async System.Threading.Tasks.Task<string> DownloadExportAsync(int id, CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException("Common.downloadExport is not implemented");
    }

    public virtual async System.Threading.Tasks.Task<ListPropertiesResponse> ListPropertiesAsync(SearchEntityType entityType, CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException("Common.listProperties is not implemented");
    }

    public virtual async System.Threading.Tasks.Task RequestExportAsync(ExportRequest request, CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException("Common.requestExport is not implemented");
    }

    public virtual async System.Threading.Tasks.Task UploadFileAsync(
        string directUrl,
        FileUploadRequest request,
        CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException("Common.uploadFile is not implemented");
    }

    public virtual async System.Threading.Tasks.Task<UploadParams> GetUploadParamsAsync(CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException("Common.getUploadParams is not implemented");
    }
}

public sealed class CommonServiceImpl : CommonService
{
    private readonly string _baseUrl;
    private readonly HttpClient _client;

    internal CommonServiceImpl(string baseUrl, HttpClient client)
    {
        _baseUrl = baseUrl;
        _client = client;
    }

    public override async System.Threading.Tasks.Task<string> DownloadExportAsync(int id, CancellationToken cancellationToken = default)
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

    public override async System.Threading.Tasks.Task<ListPropertiesResponse> ListPropertiesAsync(SearchEntityType entityType, CancellationToken cancellationToken = default)
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

    public override async System.Threading.Tasks.Task RequestExportAsync(ExportRequest request, CancellationToken cancellationToken = default)
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

    public override async System.Threading.Tasks.Task UploadFileAsync(
        string directUrl,
        FileUploadRequest request,
        CancellationToken cancellationToken = default)
    {
        var url = directUrl;
        using var content = new MultipartFormDataContent();
        content.Add(new StringContent($"{request.ContentDisposition}"), "Content-Disposition");
        content.Add(new StringContent($"{request.Acl}"), "acl");
        content.Add(new StringContent($"{request.Policy}"), "policy");
        content.Add(new StringContent($"{request.XAmzCredential}"), "x-amz-credential");
        content.Add(new StringContent($"{request.XAmzAlgorithm}"), "x-amz-algorithm");
        content.Add(new StringContent($"{request.XAmzDate}"), "x-amz-date");
        content.Add(new StringContent($"{request.XAmzSignature}"), "x-amz-signature");
        content.Add(new StringContent($"{request.Key}"), "key");
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

    public override async System.Threading.Tasks.Task<UploadParams> GetUploadParamsAsync(CancellationToken cancellationToken = default)
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

public class MembersService
{

    public virtual async System.Threading.Tasks.Task<ListMembersResponse> ListMembersAsync(
        int id,
        ChatMemberRoleFilter? role = null,
        int? limit = null,
        string? cursor = null,
        CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException("Members.listMembers is not implemented");
    }

    public virtual async System.Threading.Tasks.Task<List<User>> ListMembersAllAsync(
        int id,
        ChatMemberRoleFilter? role = null,
        int? limit = null,
        CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException("Members.listMembersAll is not implemented");
    }

    public virtual async System.Threading.Tasks.Task AddTagsAsync(
        int id,
        List<int> groupTagIds,
        CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException("Members.addTags is not implemented");
    }

    public virtual async System.Threading.Tasks.Task AddMembersAsync(
        int id,
        AddMembersRequest request,
        CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException("Members.addMembers is not implemented");
    }

    public virtual async System.Threading.Tasks.Task UpdateMemberRoleAsync(
        int id,
        int userId,
        ChatMemberRole role,
        CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException("Members.updateMemberRole is not implemented");
    }

    public virtual async System.Threading.Tasks.Task RemoveTagAsync(
        int id,
        int tagId,
        CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException("Members.removeTag is not implemented");
    }

    public virtual async System.Threading.Tasks.Task LeaveChatAsync(int id, CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException("Members.leaveChat is not implemented");
    }

    public virtual async System.Threading.Tasks.Task RemoveMemberAsync(
        int id,
        int userId,
        CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException("Members.removeMember is not implemented");
    }
}

public sealed class MembersServiceImpl : MembersService
{
    private readonly string _baseUrl;
    private readonly HttpClient _client;

    internal MembersServiceImpl(string baseUrl, HttpClient client)
    {
        _baseUrl = baseUrl;
        _client = client;
    }

    public override async System.Threading.Tasks.Task<ListMembersResponse> ListMembersAsync(
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
            queryParts.Add($"limit={Uri.EscapeDataString(limit.Value.ToString()!)}");
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

    public override async System.Threading.Tasks.Task<List<User>> ListMembersAllAsync(
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
            if (response.Data.Count == 0) break;
            cursor = response.Meta.Paginate.NextPage;
        } while (true);
        return items;
    }

    public override async System.Threading.Tasks.Task AddTagsAsync(
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

    public override async System.Threading.Tasks.Task AddMembersAsync(
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

    public override async System.Threading.Tasks.Task UpdateMemberRoleAsync(
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

    public override async System.Threading.Tasks.Task RemoveTagAsync(
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

    public override async System.Threading.Tasks.Task LeaveChatAsync(int id, CancellationToken cancellationToken = default)
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

    public override async System.Threading.Tasks.Task RemoveMemberAsync(
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

public class GroupTagsService
{

    public virtual async System.Threading.Tasks.Task<ListTagsResponse> ListTagsAsync(
        List<string>? names = null,
        int? limit = null,
        string? cursor = null,
        CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException("Group tags.listTags is not implemented");
    }

    public virtual async System.Threading.Tasks.Task<List<GroupTag>> ListTagsAllAsync(
        List<string>? names = null,
        int? limit = null,
        CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException("Group tags.listTagsAll is not implemented");
    }

    public virtual async System.Threading.Tasks.Task<GroupTag> GetTagAsync(int id, CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException("Group tags.getTag is not implemented");
    }

    public virtual async System.Threading.Tasks.Task<GetTagUsersResponse> GetTagUsersAsync(
        int id,
        int? limit = null,
        string? cursor = null,
        CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException("Group tags.getTagUsers is not implemented");
    }

    public virtual async System.Threading.Tasks.Task<List<User>> GetTagUsersAllAsync(
        int id,
        int? limit = null,
        CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException("Group tags.getTagUsersAll is not implemented");
    }

    public virtual async System.Threading.Tasks.Task<GroupTag> CreateTagAsync(GroupTagRequest request, CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException("Group tags.createTag is not implemented");
    }

    public virtual async System.Threading.Tasks.Task<GroupTag> UpdateTagAsync(
        int id,
        GroupTagRequest request,
        CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException("Group tags.updateTag is not implemented");
    }

    public virtual async System.Threading.Tasks.Task DeleteTagAsync(int id, CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException("Group tags.deleteTag is not implemented");
    }
}

public sealed class GroupTagsServiceImpl : GroupTagsService
{
    private readonly string _baseUrl;
    private readonly HttpClient _client;

    internal GroupTagsServiceImpl(string baseUrl, HttpClient client)
    {
        _baseUrl = baseUrl;
        _client = client;
    }

    public override async System.Threading.Tasks.Task<ListTagsResponse> ListTagsAsync(
        List<string>? names = null,
        int? limit = null,
        string? cursor = null,
        CancellationToken cancellationToken = default)
    {
        var queryParts = new List<string>();
        if (names != null)
            foreach (var item in names)
                queryParts.Add($"names[]={Uri.EscapeDataString(item.ToString()!)}");
        if (limit != null)
            queryParts.Add($"limit={Uri.EscapeDataString(limit.Value.ToString()!)}");
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

    public override async System.Threading.Tasks.Task<List<GroupTag>> ListTagsAllAsync(
        List<string>? names = null,
        int? limit = null,
        CancellationToken cancellationToken = default)
    {
        var items = new List<GroupTag>();
        string? cursor = null;
        do
        {
            var response = await ListTagsAsync(names: names, limit: limit, cursor: cursor, cancellationToken: cancellationToken).ConfigureAwait(false);
            items.AddRange(response.Data);
            if (response.Data.Count == 0) break;
            cursor = response.Meta.Paginate.NextPage;
        } while (true);
        return items;
    }

    public override async System.Threading.Tasks.Task<GroupTag> GetTagAsync(int id, CancellationToken cancellationToken = default)
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

    public override async System.Threading.Tasks.Task<GetTagUsersResponse> GetTagUsersAsync(
        int id,
        int? limit = null,
        string? cursor = null,
        CancellationToken cancellationToken = default)
    {
        var queryParts = new List<string>();
        if (limit != null)
            queryParts.Add($"limit={Uri.EscapeDataString(limit.Value.ToString()!)}");
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

    public override async System.Threading.Tasks.Task<List<User>> GetTagUsersAllAsync(
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
            if (response.Data.Count == 0) break;
            cursor = response.Meta.Paginate.NextPage;
        } while (true);
        return items;
    }

    public override async System.Threading.Tasks.Task<GroupTag> CreateTagAsync(GroupTagRequest request, CancellationToken cancellationToken = default)
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

    public override async System.Threading.Tasks.Task<GroupTag> UpdateTagAsync(
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

    public override async System.Threading.Tasks.Task DeleteTagAsync(int id, CancellationToken cancellationToken = default)
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

public class MessagesService
{

    public virtual async System.Threading.Tasks.Task<ListChatMessagesResponse> ListChatMessagesAsync(
        int chatId,
        MessageSortField? sort = null,
        SortOrder? order = null,
        int? limit = null,
        string? cursor = null,
        CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException("Messages.listChatMessages is not implemented");
    }

    public virtual async System.Threading.Tasks.Task<List<Message>> ListChatMessagesAllAsync(
        int chatId,
        MessageSortField? sort = null,
        SortOrder? order = null,
        int? limit = null,
        CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException("Messages.listChatMessagesAll is not implemented");
    }

    public virtual async System.Threading.Tasks.Task<Message> GetMessageAsync(int id, CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException("Messages.getMessage is not implemented");
    }

    public virtual async System.Threading.Tasks.Task<Message> CreateMessageAsync(MessageCreateRequest request, CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException("Messages.createMessage is not implemented");
    }

    public virtual async System.Threading.Tasks.Task PinMessageAsync(int id, CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException("Messages.pinMessage is not implemented");
    }

    public virtual async System.Threading.Tasks.Task<Message> UpdateMessageAsync(
        int id,
        MessageUpdateRequest request,
        CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException("Messages.updateMessage is not implemented");
    }

    public virtual async System.Threading.Tasks.Task DeleteMessageAsync(int id, CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException("Messages.deleteMessage is not implemented");
    }

    public virtual async System.Threading.Tasks.Task UnpinMessageAsync(int id, CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException("Messages.unpinMessage is not implemented");
    }
}

public sealed class MessagesServiceImpl : MessagesService
{
    private readonly string _baseUrl;
    private readonly HttpClient _client;

    internal MessagesServiceImpl(string baseUrl, HttpClient client)
    {
        _baseUrl = baseUrl;
        _client = client;
    }

    public override async System.Threading.Tasks.Task<ListChatMessagesResponse> ListChatMessagesAsync(
        int chatId,
        MessageSortField? sort = null,
        SortOrder? order = null,
        int? limit = null,
        string? cursor = null,
        CancellationToken cancellationToken = default)
    {
        var queryParts = new List<string>();
        queryParts.Add($"chat_id={Uri.EscapeDataString(chatId.ToString()!)}");
        if (sort != null)
            queryParts.Add($"sort={Uri.EscapeDataString(PachcaUtils.EnumToApiString(sort.Value))}");
        if (order != null)
            queryParts.Add($"order={Uri.EscapeDataString(PachcaUtils.EnumToApiString(order.Value))}");
        if (limit != null)
            queryParts.Add($"limit={Uri.EscapeDataString(limit.Value.ToString()!)}");
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

    public override async System.Threading.Tasks.Task<List<Message>> ListChatMessagesAllAsync(
        int chatId,
        MessageSortField? sort = null,
        SortOrder? order = null,
        int? limit = null,
        CancellationToken cancellationToken = default)
    {
        var items = new List<Message>();
        string? cursor = null;
        do
        {
            var response = await ListChatMessagesAsync(chatId: chatId, sort: sort, order: order, limit: limit, cursor: cursor, cancellationToken: cancellationToken).ConfigureAwait(false);
            items.AddRange(response.Data);
            if (response.Data.Count == 0) break;
            cursor = response.Meta.Paginate.NextPage;
        } while (true);
        return items;
    }

    public override async System.Threading.Tasks.Task<Message> GetMessageAsync(int id, CancellationToken cancellationToken = default)
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

    public override async System.Threading.Tasks.Task<Message> CreateMessageAsync(MessageCreateRequest request, CancellationToken cancellationToken = default)
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

    public override async System.Threading.Tasks.Task PinMessageAsync(int id, CancellationToken cancellationToken = default)
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

    public override async System.Threading.Tasks.Task<Message> UpdateMessageAsync(
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

    public override async System.Threading.Tasks.Task DeleteMessageAsync(int id, CancellationToken cancellationToken = default)
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

    public override async System.Threading.Tasks.Task UnpinMessageAsync(int id, CancellationToken cancellationToken = default)
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

public class LinkPreviewsService
{

    public virtual async System.Threading.Tasks.Task CreateLinkPreviewsAsync(
        int id,
        LinkPreviewsRequest request,
        CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException("Link Previews.createLinkPreviews is not implemented");
    }
}

public sealed class LinkPreviewsServiceImpl : LinkPreviewsService
{
    private readonly string _baseUrl;
    private readonly HttpClient _client;

    internal LinkPreviewsServiceImpl(string baseUrl, HttpClient client)
    {
        _baseUrl = baseUrl;
        _client = client;
    }

    public override async System.Threading.Tasks.Task CreateLinkPreviewsAsync(
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

public class ReactionsService
{

    public virtual async System.Threading.Tasks.Task<ListReactionsResponse> ListReactionsAsync(
        int id,
        int? limit = null,
        string? cursor = null,
        CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException("Reactions.listReactions is not implemented");
    }

    public virtual async System.Threading.Tasks.Task<List<Reaction>> ListReactionsAllAsync(
        int id,
        int? limit = null,
        CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException("Reactions.listReactionsAll is not implemented");
    }

    public virtual async System.Threading.Tasks.Task<Reaction> AddReactionAsync(
        int id,
        ReactionRequest request,
        CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException("Reactions.addReaction is not implemented");
    }

    public virtual async System.Threading.Tasks.Task RemoveReactionAsync(
        int id,
        string code,
        string? name = null,
        CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException("Reactions.removeReaction is not implemented");
    }
}

public sealed class ReactionsServiceImpl : ReactionsService
{
    private readonly string _baseUrl;
    private readonly HttpClient _client;

    internal ReactionsServiceImpl(string baseUrl, HttpClient client)
    {
        _baseUrl = baseUrl;
        _client = client;
    }

    public override async System.Threading.Tasks.Task<ListReactionsResponse> ListReactionsAsync(
        int id,
        int? limit = null,
        string? cursor = null,
        CancellationToken cancellationToken = default)
    {
        var queryParts = new List<string>();
        if (limit != null)
            queryParts.Add($"limit={Uri.EscapeDataString(limit.Value.ToString()!)}");
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

    public override async System.Threading.Tasks.Task<List<Reaction>> ListReactionsAllAsync(
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
            if (response.Data.Count == 0) break;
            cursor = response.Meta.Paginate.NextPage;
        } while (true);
        return items;
    }

    public override async System.Threading.Tasks.Task<Reaction> AddReactionAsync(
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

    public override async System.Threading.Tasks.Task RemoveReactionAsync(
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

public class ReadMembersService
{

    public virtual async System.Threading.Tasks.Task<object> ListReadMembersAsync(
        int id,
        int? limit = null,
        string? cursor = null,
        CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException("Read members.listReadMembers is not implemented");
    }
}

public sealed class ReadMembersServiceImpl : ReadMembersService
{
    private readonly string _baseUrl;
    private readonly HttpClient _client;

    internal ReadMembersServiceImpl(string baseUrl, HttpClient client)
    {
        _baseUrl = baseUrl;
        _client = client;
    }

    public override async System.Threading.Tasks.Task<object> ListReadMembersAsync(
        int id,
        int? limit = null,
        string? cursor = null,
        CancellationToken cancellationToken = default)
    {
        var queryParts = new List<string>();
        if (limit != null)
            queryParts.Add($"limit={Uri.EscapeDataString(limit.Value.ToString()!)}");
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

public class ThreadsService
{

    public virtual async System.Threading.Tasks.Task<Pachca.Sdk.Thread> GetThreadAsync(int id, CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException("Threads.getThread is not implemented");
    }

    public virtual async System.Threading.Tasks.Task<Pachca.Sdk.Thread> CreateThreadAsync(int id, CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException("Threads.createThread is not implemented");
    }
}

public sealed class ThreadsServiceImpl : ThreadsService
{
    private readonly string _baseUrl;
    private readonly HttpClient _client;

    internal ThreadsServiceImpl(string baseUrl, HttpClient client)
    {
        _baseUrl = baseUrl;
        _client = client;
    }

    public override async System.Threading.Tasks.Task<Pachca.Sdk.Thread> GetThreadAsync(int id, CancellationToken cancellationToken = default)
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

    public override async System.Threading.Tasks.Task<Pachca.Sdk.Thread> CreateThreadAsync(int id, CancellationToken cancellationToken = default)
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

public class ProfileService
{

    public virtual async System.Threading.Tasks.Task<AccessTokenInfo> GetTokenInfoAsync(CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException("Profile.getTokenInfo is not implemented");
    }

    public virtual async System.Threading.Tasks.Task<User> GetProfileAsync(CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException("Profile.getProfile is not implemented");
    }

    public virtual async System.Threading.Tasks.Task<object> GetStatusAsync(CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException("Profile.getStatus is not implemented");
    }

    public virtual async System.Threading.Tasks.Task<AvatarData> UpdateProfileAvatarAsync(byte[] image, CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException("Profile.updateProfileAvatar is not implemented");
    }

    public virtual async System.Threading.Tasks.Task<UserStatus> UpdateStatusAsync(StatusUpdateRequest request, CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException("Profile.updateStatus is not implemented");
    }

    public virtual async System.Threading.Tasks.Task DeleteProfileAvatarAsync(CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException("Profile.deleteProfileAvatar is not implemented");
    }

    public virtual async System.Threading.Tasks.Task DeleteStatusAsync(CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException("Profile.deleteStatus is not implemented");
    }
}

public sealed class ProfileServiceImpl : ProfileService
{
    private readonly string _baseUrl;
    private readonly HttpClient _client;

    internal ProfileServiceImpl(string baseUrl, HttpClient client)
    {
        _baseUrl = baseUrl;
        _client = client;
    }

    public override async System.Threading.Tasks.Task<AccessTokenInfo> GetTokenInfoAsync(CancellationToken cancellationToken = default)
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

    public override async System.Threading.Tasks.Task<User> GetProfileAsync(CancellationToken cancellationToken = default)
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

    public override async System.Threading.Tasks.Task<object> GetStatusAsync(CancellationToken cancellationToken = default)
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

    public override async System.Threading.Tasks.Task<AvatarData> UpdateProfileAvatarAsync(byte[] image, CancellationToken cancellationToken = default)
    {
        var url = $"{_baseUrl}/profile/avatar";
        using var content = new MultipartFormDataContent();
        content.Add(new ByteArrayContent(image), "image", "image");
        using var httpRequest = new HttpRequestMessage(HttpMethod.Put, url);
        httpRequest.Content = content;
        using var response = await PachcaUtils.SendWithRetryAsync(_client, httpRequest, cancellationToken).ConfigureAwait(false);
        var json = await response.Content.ReadAsStringAsync(cancellationToken).ConfigureAwait(false);
        switch ((int)response.StatusCode)
        {
            case 200:
                return PachcaUtils.Deserialize<AvatarDataDataWrapper>(json).Data;
            case 401:
                throw PachcaUtils.Deserialize<OAuthError>(json);
            default:
                throw PachcaUtils.Deserialize<ApiError>(json);
        }
    }

    public override async System.Threading.Tasks.Task<UserStatus> UpdateStatusAsync(StatusUpdateRequest request, CancellationToken cancellationToken = default)
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

    public override async System.Threading.Tasks.Task DeleteProfileAvatarAsync(CancellationToken cancellationToken = default)
    {
        var url = $"{_baseUrl}/profile/avatar";
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

    public override async System.Threading.Tasks.Task DeleteStatusAsync(CancellationToken cancellationToken = default)
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

public class SearchService
{

    public virtual async System.Threading.Tasks.Task<SearchChatsResponse> SearchChatsAsync(
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
        throw new NotImplementedException("Search.searchChats is not implemented");
    }

    public virtual async System.Threading.Tasks.Task<List<Chat>> SearchChatsAllAsync(
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
        throw new NotImplementedException("Search.searchChatsAll is not implemented");
    }

    public virtual async System.Threading.Tasks.Task<SearchMessagesResponse> SearchMessagesAsync(
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
        throw new NotImplementedException("Search.searchMessages is not implemented");
    }

    public virtual async System.Threading.Tasks.Task<List<Message>> SearchMessagesAllAsync(
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
        throw new NotImplementedException("Search.searchMessagesAll is not implemented");
    }

    public virtual async System.Threading.Tasks.Task<SearchUsersResponse> SearchUsersAsync(
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
        throw new NotImplementedException("Search.searchUsers is not implemented");
    }

    public virtual async System.Threading.Tasks.Task<List<User>> SearchUsersAllAsync(
        string? query = null,
        int? limit = null,
        SearchSortOrder? sort = null,
        SortOrder? order = null,
        DateTimeOffset? createdFrom = null,
        DateTimeOffset? createdTo = null,
        List<UserRole>? companyRoles = null,
        CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException("Search.searchUsersAll is not implemented");
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

    public override async System.Threading.Tasks.Task<SearchChatsResponse> SearchChatsAsync(
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
            queryParts.Add($"limit={Uri.EscapeDataString(limit.Value.ToString()!)}");
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

    public override async System.Threading.Tasks.Task<List<Chat>> SearchChatsAllAsync(
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
            if (response.Data.Count == 0) break;
            cursor = response.Meta.Paginate.NextPage;
        } while (true);
        return items;
    }

    public override async System.Threading.Tasks.Task<SearchMessagesResponse> SearchMessagesAsync(
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
            queryParts.Add($"limit={Uri.EscapeDataString(limit.Value.ToString()!)}");
        if (cursor != null)
            queryParts.Add($"cursor={Uri.EscapeDataString(cursor)}");
        if (order != null)
            queryParts.Add($"order={Uri.EscapeDataString(PachcaUtils.EnumToApiString(order.Value))}");
        if (createdFrom != null)
            queryParts.Add($"created_from={Uri.EscapeDataString(createdFrom.Value.ToString("o"))}");
        if (createdTo != null)
            queryParts.Add($"created_to={Uri.EscapeDataString(createdTo.Value.ToString("o"))}");
        if (chatIds != null)
            foreach (var item in chatIds)
                queryParts.Add($"chat_ids[]={Uri.EscapeDataString(item.ToString()!)}");
        if (userIds != null)
            foreach (var item in userIds)
                queryParts.Add($"user_ids[]={Uri.EscapeDataString(item.ToString()!)}");
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

    public override async System.Threading.Tasks.Task<List<Message>> SearchMessagesAllAsync(
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
            if (response.Data.Count == 0) break;
            cursor = response.Meta.Paginate.NextPage;
        } while (true);
        return items;
    }

    public override async System.Threading.Tasks.Task<SearchUsersResponse> SearchUsersAsync(
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
            queryParts.Add($"limit={Uri.EscapeDataString(limit.Value.ToString()!)}");
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
            foreach (var item in companyRoles)
                queryParts.Add($"company_roles[]={Uri.EscapeDataString(PachcaUtils.EnumToApiString(item))}");
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

    public override async System.Threading.Tasks.Task<List<User>> SearchUsersAllAsync(
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
            if (response.Data.Count == 0) break;
            cursor = response.Meta.Paginate.NextPage;
        } while (true);
        return items;
    }
}

public class TasksService
{

    public virtual async System.Threading.Tasks.Task<ListTasksResponse> ListTasksAsync(
        int? limit = null,
        string? cursor = null,
        CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException("Tasks.listTasks is not implemented");
    }

    public virtual async System.Threading.Tasks.Task<List<Pachca.Sdk.Task>> ListTasksAllAsync(
        int? limit = null,
        CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException("Tasks.listTasksAll is not implemented");
    }

    public virtual async System.Threading.Tasks.Task<Pachca.Sdk.Task> GetTaskAsync(int id, CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException("Tasks.getTask is not implemented");
    }

    public virtual async System.Threading.Tasks.Task<Pachca.Sdk.Task> CreateTaskAsync(TaskCreateRequest request, CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException("Tasks.createTask is not implemented");
    }

    public virtual async System.Threading.Tasks.Task<Pachca.Sdk.Task> UpdateTaskAsync(
        int id,
        TaskUpdateRequest request,
        CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException("Tasks.updateTask is not implemented");
    }

    public virtual async System.Threading.Tasks.Task DeleteTaskAsync(int id, CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException("Tasks.deleteTask is not implemented");
    }
}

public sealed class TasksServiceImpl : TasksService
{
    private readonly string _baseUrl;
    private readonly HttpClient _client;

    internal TasksServiceImpl(string baseUrl, HttpClient client)
    {
        _baseUrl = baseUrl;
        _client = client;
    }

    public override async System.Threading.Tasks.Task<ListTasksResponse> ListTasksAsync(
        int? limit = null,
        string? cursor = null,
        CancellationToken cancellationToken = default)
    {
        var queryParts = new List<string>();
        if (limit != null)
            queryParts.Add($"limit={Uri.EscapeDataString(limit.Value.ToString()!)}");
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

    public override async System.Threading.Tasks.Task<List<Pachca.Sdk.Task>> ListTasksAllAsync(
        int? limit = null,
        CancellationToken cancellationToken = default)
    {
        var items = new List<Pachca.Sdk.Task>();
        string? cursor = null;
        do
        {
            var response = await ListTasksAsync(limit: limit, cursor: cursor, cancellationToken: cancellationToken).ConfigureAwait(false);
            items.AddRange(response.Data);
            if (response.Data.Count == 0) break;
            cursor = response.Meta.Paginate.NextPage;
        } while (true);
        return items;
    }

    public override async System.Threading.Tasks.Task<Pachca.Sdk.Task> GetTaskAsync(int id, CancellationToken cancellationToken = default)
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

    public override async System.Threading.Tasks.Task<Pachca.Sdk.Task> CreateTaskAsync(TaskCreateRequest request, CancellationToken cancellationToken = default)
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

    public override async System.Threading.Tasks.Task<Pachca.Sdk.Task> UpdateTaskAsync(
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

    public override async System.Threading.Tasks.Task DeleteTaskAsync(int id, CancellationToken cancellationToken = default)
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

public class UsersService
{

    public virtual async System.Threading.Tasks.Task<ListUsersResponse> ListUsersAsync(
        string? query = null,
        int? limit = null,
        string? cursor = null,
        CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException("Users.listUsers is not implemented");
    }

    public virtual async System.Threading.Tasks.Task<List<User>> ListUsersAllAsync(
        string? query = null,
        int? limit = null,
        CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException("Users.listUsersAll is not implemented");
    }

    public virtual async System.Threading.Tasks.Task<User> GetUserAsync(int id, CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException("Users.getUser is not implemented");
    }

    public virtual async System.Threading.Tasks.Task<object> GetUserStatusAsync(int userId, CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException("Users.getUserStatus is not implemented");
    }

    public virtual async System.Threading.Tasks.Task<User> CreateUserAsync(UserCreateRequest request, CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException("Users.createUser is not implemented");
    }

    public virtual async System.Threading.Tasks.Task<User> UpdateUserAsync(
        int id,
        UserUpdateRequest request,
        CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException("Users.updateUser is not implemented");
    }

    public virtual async System.Threading.Tasks.Task<AvatarData> UpdateUserAvatarAsync(
        int userId,
        byte[] image,
        CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException("Users.updateUserAvatar is not implemented");
    }

    public virtual async System.Threading.Tasks.Task<UserStatus> UpdateUserStatusAsync(
        int userId,
        StatusUpdateRequest request,
        CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException("Users.updateUserStatus is not implemented");
    }

    public virtual async System.Threading.Tasks.Task DeleteUserAsync(int id, CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException("Users.deleteUser is not implemented");
    }

    public virtual async System.Threading.Tasks.Task DeleteUserAvatarAsync(int userId, CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException("Users.deleteUserAvatar is not implemented");
    }

    public virtual async System.Threading.Tasks.Task DeleteUserStatusAsync(int userId, CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException("Users.deleteUserStatus is not implemented");
    }
}

public sealed class UsersServiceImpl : UsersService
{
    private readonly string _baseUrl;
    private readonly HttpClient _client;

    internal UsersServiceImpl(string baseUrl, HttpClient client)
    {
        _baseUrl = baseUrl;
        _client = client;
    }

    public override async System.Threading.Tasks.Task<ListUsersResponse> ListUsersAsync(
        string? query = null,
        int? limit = null,
        string? cursor = null,
        CancellationToken cancellationToken = default)
    {
        var queryParts = new List<string>();
        if (query != null)
            queryParts.Add($"query={Uri.EscapeDataString(query)}");
        if (limit != null)
            queryParts.Add($"limit={Uri.EscapeDataString(limit.Value.ToString()!)}");
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

    public override async System.Threading.Tasks.Task<List<User>> ListUsersAllAsync(
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
            if (response.Data.Count == 0) break;
            cursor = response.Meta.Paginate.NextPage;
        } while (true);
        return items;
    }

    public override async System.Threading.Tasks.Task<User> GetUserAsync(int id, CancellationToken cancellationToken = default)
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

    public override async System.Threading.Tasks.Task<object> GetUserStatusAsync(int userId, CancellationToken cancellationToken = default)
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

    public override async System.Threading.Tasks.Task<User> CreateUserAsync(UserCreateRequest request, CancellationToken cancellationToken = default)
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

    public override async System.Threading.Tasks.Task<User> UpdateUserAsync(
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

    public override async System.Threading.Tasks.Task<AvatarData> UpdateUserAvatarAsync(
        int userId,
        byte[] image,
        CancellationToken cancellationToken = default)
    {
        var url = $"{_baseUrl}/users/{userId}/avatar";
        using var content = new MultipartFormDataContent();
        content.Add(new ByteArrayContent(image), "image", "image");
        using var httpRequest = new HttpRequestMessage(HttpMethod.Put, url);
        httpRequest.Content = content;
        using var response = await PachcaUtils.SendWithRetryAsync(_client, httpRequest, cancellationToken).ConfigureAwait(false);
        var json = await response.Content.ReadAsStringAsync(cancellationToken).ConfigureAwait(false);
        switch ((int)response.StatusCode)
        {
            case 200:
                return PachcaUtils.Deserialize<AvatarDataDataWrapper>(json).Data;
            case 401:
                throw PachcaUtils.Deserialize<OAuthError>(json);
            default:
                throw PachcaUtils.Deserialize<ApiError>(json);
        }
    }

    public override async System.Threading.Tasks.Task<UserStatus> UpdateUserStatusAsync(
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

    public override async System.Threading.Tasks.Task DeleteUserAsync(int id, CancellationToken cancellationToken = default)
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

    public override async System.Threading.Tasks.Task DeleteUserAvatarAsync(int userId, CancellationToken cancellationToken = default)
    {
        var url = $"{_baseUrl}/users/{userId}/avatar";
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

    public override async System.Threading.Tasks.Task DeleteUserStatusAsync(int userId, CancellationToken cancellationToken = default)
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

public class ViewsService
{

    public virtual async System.Threading.Tasks.Task OpenViewAsync(OpenViewRequest request, CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException("Views.openView is not implemented");
    }
}

public sealed class ViewsServiceImpl : ViewsService
{
    private readonly string _baseUrl;
    private readonly HttpClient _client;

    internal ViewsServiceImpl(string baseUrl, HttpClient client)
    {
        _baseUrl = baseUrl;
        _client = client;
    }

    public override async System.Threading.Tasks.Task OpenViewAsync(OpenViewRequest request, CancellationToken cancellationToken = default)
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
    private readonly HttpClient? _client;

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

    private PachcaClient(BotsService bots, ChatsService chats, CommonService common, GroupTagsService groupTags, LinkPreviewsService linkPreviews, MembersService members, MessagesService messages, ProfileService profile, ReactionsService reactions, ReadMembersService readMembers, SearchService search, SecurityService security, TasksService tasks, ThreadsService threads, UsersService users, ViewsService views)
    {
        Bots = bots;
        Chats = chats;
        Common = common;
        GroupTags = groupTags;
        LinkPreviews = linkPreviews;
        Members = members;
        Messages = messages;
        Profile = profile;
        Reactions = reactions;
        ReadMembers = readMembers;
        Search = search;
        Security = security;
        Tasks = tasks;
        Threads = threads;
        Users = users;
        Views = views;
    }

    public PachcaClient(string token, string baseUrl = "https://api.pachca.com/api/shared/v1", BotsService? bots = null, ChatsService? chats = null, CommonService? common = null, GroupTagsService? groupTags = null, LinkPreviewsService? linkPreviews = null, MembersService? members = null, MessagesService? messages = null, ProfileService? profile = null, ReactionsService? reactions = null, ReadMembersService? readMembers = null, SearchService? search = null, SecurityService? security = null, TasksService? tasks = null, ThreadsService? threads = null, UsersService? users = null, ViewsService? views = null)
    {
        var handler = new SocketsHttpHandler
        {
            AllowAutoRedirect = false,
        };
        _client = new HttpClient(handler);
        _client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", token);

        Bots = bots ?? new BotsServiceImpl(baseUrl, _client);
        Chats = chats ?? new ChatsServiceImpl(baseUrl, _client);
        Common = common ?? new CommonServiceImpl(baseUrl, _client);
        GroupTags = groupTags ?? new GroupTagsServiceImpl(baseUrl, _client);
        LinkPreviews = linkPreviews ?? new LinkPreviewsServiceImpl(baseUrl, _client);
        Members = members ?? new MembersServiceImpl(baseUrl, _client);
        Messages = messages ?? new MessagesServiceImpl(baseUrl, _client);
        Profile = profile ?? new ProfileServiceImpl(baseUrl, _client);
        Reactions = reactions ?? new ReactionsServiceImpl(baseUrl, _client);
        ReadMembers = readMembers ?? new ReadMembersServiceImpl(baseUrl, _client);
        Search = search ?? new SearchServiceImpl(baseUrl, _client);
        Security = security ?? new SecurityServiceImpl(baseUrl, _client);
        Tasks = tasks ?? new TasksServiceImpl(baseUrl, _client);
        Threads = threads ?? new ThreadsServiceImpl(baseUrl, _client);
        Users = users ?? new UsersServiceImpl(baseUrl, _client);
        Views = views ?? new ViewsServiceImpl(baseUrl, _client);
    }

    public static PachcaClient Stub(BotsService? bots = null, ChatsService? chats = null, CommonService? common = null, GroupTagsService? groupTags = null, LinkPreviewsService? linkPreviews = null, MembersService? members = null, MessagesService? messages = null, ProfileService? profile = null, ReactionsService? reactions = null, ReadMembersService? readMembers = null, SearchService? search = null, SecurityService? security = null, TasksService? tasks = null, ThreadsService? threads = null, UsersService? users = null, ViewsService? views = null)
    {
        return new PachcaClient(bots ?? new BotsService(), chats ?? new ChatsService(), common ?? new CommonService(), groupTags ?? new GroupTagsService(), linkPreviews ?? new LinkPreviewsService(), members ?? new MembersService(), messages ?? new MessagesService(), profile ?? new ProfileService(), reactions ?? new ReactionsService(), readMembers ?? new ReadMembersService(), search ?? new SearchService(), security ?? new SecurityService(), tasks ?? new TasksService(), threads ?? new ThreadsService(), users ?? new UsersService(), views ?? new ViewsService());
    }

    public void Dispose()
    {
        _client?.Dispose();
        GC.SuppressFinalize(this);
    }
}
