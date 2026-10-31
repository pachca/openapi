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

public class MessagesService
{

    public virtual async System.Threading.Tasks.Task<Message> CreateMessageAsync(MessageCreateRequest request, CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException("Messages.createMessage is not implemented");
    }

    public virtual async System.Threading.Tasks.Task<Message> UpdateMessageAsync(
        int id,
        MessageUpdateRequest request,
        CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException("Messages.updateMessage is not implemented");
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
            default:
                throw PachcaUtils.ErrorFromResponse((int)response.StatusCode, json);
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

    public MessagesService Messages { get; }

    private PachcaClient(MessagesService messages)
    {
        Messages = messages;
    }

    public PachcaClient(string token, string baseUrl = PachcaConstants.PachcaApiUrl, MessagesService? messages = null)
    {
        _client = new HttpClient();
        _client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", token);

        Messages = messages ?? new MessagesServiceImpl(baseUrl, _client);
    }

    public PachcaClient(string baseUrl, HttpClient client, MessagesService? messages = null)
    {
        _client = client;

        Messages = messages ?? new MessagesServiceImpl(baseUrl, _client);
    }

    public static PachcaClient Stub(MessagesService? messages = null)
    {
        return new PachcaClient(messages ?? new MessagesService());
    }

    public void Dispose()
    {
        _client?.Dispose();
        GC.SuppressFinalize(this);
    }
}
