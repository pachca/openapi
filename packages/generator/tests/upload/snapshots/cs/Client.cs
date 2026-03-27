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

public sealed class CommonService
{
    private readonly string _baseUrl;
    private readonly HttpClient _client;

    internal CommonService(string baseUrl, HttpClient client)
    {
        _baseUrl = baseUrl;
        _client = client;
    }

    public async System.Threading.Tasks.Task UploadFileAsync(
        string directUrl,
        FileUploadRequest request,
        CancellationToken cancellationToken = default)
    {
        var url = directUrl;
        using var content = new MultipartFormDataContent();
        content.Add(new StringContent($"{request.ContentDisposition}"), "content-disposition");
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
            case 401:
                throw PachcaUtils.Deserialize<OAuthError>(json);
            default:
                throw new InvalidOperationException($"Unexpected status code: {(int)response.StatusCode}");
        }
    }

    public async System.Threading.Tasks.Task<UploadParams> GetUploadParamsAsync(CancellationToken cancellationToken = default)
    {
        var url = $"{_baseUrl}/uploads";
        using var request = new HttpRequestMessage(HttpMethod.Post, url);
        using var response = await PachcaUtils.SendWithRetryAsync(_client, request, cancellationToken).ConfigureAwait(false);
        var json = await response.Content.ReadAsStringAsync(cancellationToken).ConfigureAwait(false);
        switch ((int)response.StatusCode)
        {
            case 201:
                return PachcaUtils.Deserialize<UploadParamsDataWrapper>(json).Data;
            case 401:
                throw PachcaUtils.Deserialize<OAuthError>(json);
            default:
                throw new InvalidOperationException($"Unexpected status code: {(int)response.StatusCode}");
        }
    }
}

public sealed class PachcaClient : IDisposable
{
    private readonly HttpClient _client;

    public CommonService Common { get; }

    public PachcaClient(string token, string baseUrl = "https://api.pachca.com/api/shared/v1")
    {
        _client = new HttpClient();
        _client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", token);

        Common = new CommonService(baseUrl, _client);
    }

    public void Dispose()
    {
        _client.Dispose();
        GC.SuppressFinalize(this);
    }
}
