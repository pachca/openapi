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

public sealed class EventsService
{
    private readonly string _baseUrl;
    private readonly HttpClient _client;

    internal EventsService(string baseUrl, HttpClient client)
    {
        _baseUrl = baseUrl;
        _client = client;
    }

    public async System.Threading.Tasks.Task<ListEventsResponse> ListEventsAsync(
        bool? isActive = null,
        List<OAuthScope>? scopes = null,
        EventFilter? filter = null,
        CancellationToken cancellationToken = default)
    {
        var queryParts = new List<string>();
        if (isActive != null)
            queryParts.Add($"is_active={Uri.EscapeDataString((isActive.Value ? "true" : "false"))}");
        if (scopes != null)
            queryParts.Add($"scopes={Uri.EscapeDataString(scopes.ToString()!)}");
        if (filter != null)
            queryParts.Add($"filter={Uri.EscapeDataString(filter.ToString()!)}");
        var url = $"{_baseUrl}/events" + (queryParts.Count > 0 ? "?" + string.Join("&", queryParts) : "");
        using var request = new HttpRequestMessage(HttpMethod.Get, url);
        using var response = await PachcaUtils.SendWithRetryAsync(_client, request, cancellationToken).ConfigureAwait(false);
        var json = await response.Content.ReadAsStringAsync(cancellationToken).ConfigureAwait(false);
        switch ((int)response.StatusCode)
        {
            case 200:
                return PachcaUtils.Deserialize<ListEventsResponse>(json);
            default:
                throw new InvalidOperationException($"Unexpected status code: {(int)response.StatusCode}");
        }
    }

    public async System.Threading.Tasks.Task<Event> PublishEventAsync(
        int id,
        OAuthScope scope,
        CancellationToken cancellationToken = default)
    {
        var url = $"{_baseUrl}/events/{id}/publish";
        using var request = new HttpRequestMessage(HttpMethod.Put, url);
        var body = new PublishEventRequest { Scope = scope };
        request.Content = new StringContent(PachcaUtils.Serialize(body), Encoding.UTF8, "application/json");
        using var response = await PachcaUtils.SendWithRetryAsync(_client, request, cancellationToken).ConfigureAwait(false);
        var json = await response.Content.ReadAsStringAsync(cancellationToken).ConfigureAwait(false);
        switch ((int)response.StatusCode)
        {
            case 200:
                return PachcaUtils.Deserialize<EventDataWrapper>(json).Data;
            default:
                throw new InvalidOperationException($"Unexpected status code: {(int)response.StatusCode}");
        }
    }
}

public sealed class UploadsService
{
    private readonly string _baseUrl;
    private readonly HttpClient _client;

    internal UploadsService(string baseUrl, HttpClient client)
    {
        _baseUrl = baseUrl;
        _client = client;
    }

    public async System.Threading.Tasks.Task CreateUploadAsync(UploadRequest request, CancellationToken cancellationToken = default)
    {
        var url = $"{_baseUrl}/uploads";
        using var content = new MultipartFormDataContent();
        content.Add(new StringContent($"{request.ContentDisposition}"), "Content-Disposition");
        content.Add(new ByteArrayContent(request.File), "file", "file");
        using var httpRequest = new HttpRequestMessage(HttpMethod.Post, url);
        httpRequest.Content = content;
        using var response = await PachcaUtils.SendWithRetryAsync(_client, httpRequest, cancellationToken).ConfigureAwait(false);
        var json = await response.Content.ReadAsStringAsync(cancellationToken).ConfigureAwait(false);
        switch ((int)response.StatusCode)
        {
            case 201:
                return;
            default:
                throw new InvalidOperationException($"Unexpected status code: {(int)response.StatusCode}");
        }
    }
}

public sealed class PachcaClient : IDisposable
{
    private readonly HttpClient _client;

    public EventsService Events { get; }
    public UploadsService Uploads { get; }

    public PachcaClient(string token, string baseUrl)
    {
        _client = new HttpClient();
        _client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", token);

        Events = new EventsService(baseUrl, _client);
        Uploads = new UploadsService(baseUrl, _client);
    }

    public void Dispose()
    {
        _client.Dispose();
        GC.SuppressFinalize(this);
    }
}
