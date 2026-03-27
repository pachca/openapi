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

public class MembersService
{

    public virtual async System.Threading.Tasks.Task AddMembersAsync(
        int id,
        List<int> memberIds,
        CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException("Members.addMembers is not implemented");
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

    public override async System.Threading.Tasks.Task AddMembersAsync(
        int id,
        List<int> memberIds,
        CancellationToken cancellationToken = default)
    {
        var url = $"{_baseUrl}/chats/{id}/members";
        using var request = new HttpRequestMessage(HttpMethod.Post, url);
        var body = new AddMembersRequest { MemberIds = memberIds };
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
}

public class ChatsService
{

    public virtual async System.Threading.Tasks.Task<Chat> CreateChatAsync(ChatCreateRequest request, CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException("Chats.createChat is not implemented");
    }

    public virtual async System.Threading.Tasks.Task ArchiveChatAsync(int id, CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException("Chats.archiveChat is not implemented");
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
}

public sealed class PachcaClient : IDisposable
{
    private readonly HttpClient _client;

    public ChatsService Chats { get; }
    public MembersService Members { get; }

    public PachcaClient(string token, string baseUrl = "https://api.pachca.com/api/shared/v1", ChatsService? chats = null, MembersService? members = null)
    {
        _client = new HttpClient();
        _client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", token);

        Chats = chats ?? new ChatsServiceImpl(baseUrl, _client);
        Members = members ?? new MembersServiceImpl(baseUrl, _client);
    }

    public void Dispose()
    {
        _client.Dispose();
        GC.SuppressFinalize(this);
    }
}
