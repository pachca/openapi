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

public class ExportService
{

    public virtual async System.Threading.Tasks.Task<ListEventsResponse> ListEventsAsync(
        string dateFrom,
        string? dateTo = null,
        DateTimeOffset? createdAfter = null,
        int? limit = null,
        CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException("Export.listEvents is not implemented");
    }

    public virtual async System.Threading.Tasks.Task<Export> CreateExportAsync(ExportRequest request, CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException("Export.createExport is not implemented");
    }
}

public sealed class ExportServiceImpl : ExportService
{
    private readonly string _baseUrl;
    private readonly HttpClient _client;

    internal ExportServiceImpl(string baseUrl, HttpClient client)
    {
        _baseUrl = baseUrl;
        _client = client;
    }

    public override async System.Threading.Tasks.Task<ListEventsResponse> ListEventsAsync(
        string dateFrom,
        string? dateTo = null,
        DateTimeOffset? createdAfter = null,
        int? limit = null,
        CancellationToken cancellationToken = default)
    {
        var queryParts = new List<string>();
        queryParts.Add($"date_from={Uri.EscapeDataString(dateFrom)}");
        if (dateTo != null)
            queryParts.Add($"date_to={Uri.EscapeDataString(dateTo)}");
        if (createdAfter != null)
            queryParts.Add($"created_after={Uri.EscapeDataString(createdAfter.Value.ToString("o"))}");
        if (limit != null)
            queryParts.Add($"limit={Uri.EscapeDataString(limit.Value.ToString()!)}");
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

    public override async System.Threading.Tasks.Task<Export> CreateExportAsync(ExportRequest request, CancellationToken cancellationToken = default)
    {
        var url = $"{_baseUrl}/exports";
        using var httpRequest = new HttpRequestMessage(HttpMethod.Post, url);
        httpRequest.Content = new StringContent(PachcaUtils.Serialize(request), Encoding.UTF8, "application/json");
        using var response = await PachcaUtils.SendWithRetryAsync(_client, httpRequest, cancellationToken).ConfigureAwait(false);
        var json = await response.Content.ReadAsStringAsync(cancellationToken).ConfigureAwait(false);
        switch ((int)response.StatusCode)
        {
            case 201:
                return PachcaUtils.Deserialize<ExportDataWrapper>(json).Data;
            case 401:
                throw PachcaUtils.Deserialize<OAuthError>(json);
            default:
                throw new InvalidOperationException($"Unexpected status code: {(int)response.StatusCode}");
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

    public ExportService Export { get; }

    private PachcaClient(ExportService export)
    {
        Export = export;
    }

    public PachcaClient(string token, string baseUrl = PachcaConstants.PachcaApiUrl, ExportService? export = null)
    {
        _client = new HttpClient();
        _client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", token);

        Export = export ?? new ExportServiceImpl(baseUrl, _client);
    }

    public PachcaClient(string baseUrl, HttpClient client, ExportService? export = null)
    {
        _client = client;

        Export = export ?? new ExportServiceImpl(baseUrl, _client);
    }

    public static PachcaClient Stub(ExportService? export = null)
    {
        return new PachcaClient(export ?? new ExportService());
    }

    public void Dispose()
    {
        _client?.Dispose();
        GC.SuppressFinalize(this);
    }
}
