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

    public LinkPreviewsService LinkPreviews { get; }

    public PachcaClient(string token, string baseUrl = "https://api.pachca.com/api/shared/v1", LinkPreviewsService? linkPreviews = null)
    {
        _client = new HttpClient();
        _client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", token);

        LinkPreviews = linkPreviews ?? new LinkPreviewsServiceImpl(baseUrl, _client);
    }

    public void Dispose()
    {
        _client.Dispose();
        GC.SuppressFinalize(this);
    }
}
