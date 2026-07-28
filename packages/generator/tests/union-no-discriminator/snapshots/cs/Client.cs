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

public class EventsService
{

    public virtual async System.Threading.Tasks.Task<GetEventsResponse> GetEventsAsync(CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException("Events.getEvents is not implemented");
    }
}

public sealed class EventsServiceImpl : EventsService
{
    private readonly string _baseUrl;
    private readonly HttpClient _client;

    internal EventsServiceImpl(string baseUrl, HttpClient client)
    {
        _baseUrl = baseUrl;
        _client = client;
    }

    public override async System.Threading.Tasks.Task<GetEventsResponse> GetEventsAsync(CancellationToken cancellationToken = default)
    {
        var url = $"{_baseUrl}/events";
        using var request = new HttpRequestMessage(HttpMethod.Get, url);
        using var response = await PachcaUtils.SendWithRetryAsync(_client, request, cancellationToken).ConfigureAwait(false);
        var json = await response.Content.ReadAsStringAsync(cancellationToken).ConfigureAwait(false);
        switch ((int)response.StatusCode)
        {
            case 200:
                return PachcaUtils.Deserialize<GetEventsResponse>(json);
            default:
                throw new InvalidOperationException($"Unexpected status code: {(int)response.StatusCode}");
        }
    }
}

public sealed class PachcaClient : IDisposable
{
    private readonly HttpClient? _client;

    public EventsService Events { get; }

    private PachcaClient(EventsService events)
    {
        Events = events;
    }

    public PachcaClient(string token, string baseUrl, EventsService? events = null)
    {
        _client = new HttpClient();
        _client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", token);

        Events = events ?? new EventsServiceImpl(baseUrl, _client);
    }

    public PachcaClient(string baseUrl, HttpClient client, EventsService? events = null)
    {
        _client = client;

        Events = events ?? new EventsServiceImpl(baseUrl, _client);
    }

    public static PachcaClient Stub(EventsService? events = null)
    {
        return new PachcaClient(events ?? new EventsService());
    }

    public void Dispose()
    {
        _client?.Dispose();
        GC.SuppressFinalize(this);
    }
}
