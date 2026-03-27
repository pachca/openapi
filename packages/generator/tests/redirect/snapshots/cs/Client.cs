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

public class CommonService
{

    public virtual async System.Threading.Tasks.Task<string> DownloadExportAsync(int id, CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException("Common.downloadExport is not implemented");
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
        var url = $"{_baseUrl}/exports/{id}";
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
}

public sealed class PachcaClient : IDisposable
{
    private readonly HttpClient _client;

    public CommonService Common { get; }

    public PachcaClient(string token, string baseUrl = "https://api.pachca.com/api/shared/v1", CommonService? common = null)
    {
        var handler = new SocketsHttpHandler
        {
            AllowAutoRedirect = false,
        };
        _client = new HttpClient(handler);
        _client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", token);

        Common = common ?? new CommonServiceImpl(baseUrl, _client);
    }

    public void Dispose()
    {
        _client.Dispose();
        GC.SuppressFinalize(this);
    }
}
