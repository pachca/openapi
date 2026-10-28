#nullable enable

using System;
using System.Collections.Generic;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Threading;

#pragma warning disable CS1998
namespace Pachca.Sdk;

public class ChatsService
{

    public virtual async System.Threading.Tasks.Task<Chat> GetChatAsync(int id, CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException("Chats.getChat is not implemented");
    }

    public virtual async System.Threading.Tasks.Task<CreateChatResponse> CreateChatAsync(ChatCreateRequest request, CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException("Chats.createChat is not implemented");
    }

    public virtual async System.Threading.Tasks.Task<UpdateChatResponse> UpdateChatAsync(
        int id,
        ChatUpdateRequest request,
        CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException("Chats.updateChat is not implemented");
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
            default:
                throw PachcaUtils.ErrorFromResponse((int)response.StatusCode, json);
        }
    }

    public override async System.Threading.Tasks.Task<CreateChatResponse> CreateChatAsync(ChatCreateRequest request, CancellationToken cancellationToken = default)
    {
        var url = $"{_baseUrl}/chats";
        using var httpRequest = new HttpRequestMessage(HttpMethod.Post, url);
        httpRequest.Content = new StringContent(PachcaUtils.Serialize(request), Encoding.UTF8, "application/json");
        using var response = await PachcaUtils.SendWithRetryAsync(_client, httpRequest, cancellationToken).ConfigureAwait(false);
        var json = await response.Content.ReadAsStringAsync(cancellationToken).ConfigureAwait(false);
        switch ((int)response.StatusCode)
        {
            case 201:
                return PachcaUtils.Deserialize<CreateChatResponse>(json);
            default:
                throw PachcaUtils.ErrorFromResponse((int)response.StatusCode, json);
        }
    }

    public override async System.Threading.Tasks.Task<UpdateChatResponse> UpdateChatAsync(
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
                return PachcaUtils.Deserialize<UpdateChatResponse>(json);
            default:
                throw PachcaUtils.ErrorFromResponse((int)response.StatusCode, json);
        }
    }
}

public static class PachcaConstants
{
    public const string PachcaApiUrl = "https://api.pachca.com/api/shared/v1";
}

public sealed class PachcaClient : IDisposable
{
    private readonly HttpClient? _client;

    public ChatsService Chats { get; }

    private PachcaClient(ChatsService chats)
    {
        Chats = chats;
    }

    public PachcaClient(string token, string baseUrl = PachcaConstants.PachcaApiUrl, ChatsService? chats = null)
    {
        _client = new HttpClient();
        _client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", token);

        Chats = chats ?? new ChatsServiceImpl(baseUrl, _client);
    }

    public PachcaClient(string baseUrl, HttpClient client, ChatsService? chats = null)
    {
        _client = client;

        Chats = chats ?? new ChatsServiceImpl(baseUrl, _client);
    }

    public static PachcaClient Stub(ChatsService? chats = null)
    {
        return new PachcaClient(chats ?? new ChatsService());
    }

    public void Dispose()
    {
        _client?.Dispose();
        GC.SuppressFinalize(this);
    }
}
