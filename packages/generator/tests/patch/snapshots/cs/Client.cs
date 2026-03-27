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

public class ItemsService
{

    public virtual async System.Threading.Tasks.Task<Item> PatchItemAsync(
        int id,
        ItemPatchRequest request,
        CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException("Items.patchItem is not implemented");
    }
}

public sealed class ItemsServiceImpl : ItemsService
{
    private readonly string _baseUrl;
    private readonly HttpClient _client;

    internal ItemsServiceImpl(string baseUrl, HttpClient client)
    {
        _baseUrl = baseUrl;
        _client = client;
    }

    public override async System.Threading.Tasks.Task<Item> PatchItemAsync(
        int id,
        ItemPatchRequest request,
        CancellationToken cancellationToken = default)
    {
        var url = $"{_baseUrl}/items/{id}";
        using var httpRequest = new HttpRequestMessage(HttpMethod.Patch, url);
        httpRequest.Content = new StringContent(PachcaUtils.Serialize(request), Encoding.UTF8, "application/json");
        using var response = await PachcaUtils.SendWithRetryAsync(_client, httpRequest, cancellationToken).ConfigureAwait(false);
        var json = await response.Content.ReadAsStringAsync(cancellationToken).ConfigureAwait(false);
        switch ((int)response.StatusCode)
        {
            case 200:
                return PachcaUtils.Deserialize<ItemDataWrapper>(json).Data;
            default:
                throw PachcaUtils.Deserialize<ApiError>(json);
        }
    }
}

public sealed class PachcaClient : IDisposable
{
    private readonly HttpClient? _client;

    public ItemsService Items { get; }

    private PachcaClient(ItemsService items)
    {
        Items = items;
    }

    public PachcaClient(string token, string baseUrl = "https://api.example.com/v1", ItemsService? items = null)
    {
        _client = new HttpClient();
        _client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", token);

        Items = items ?? new ItemsServiceImpl(baseUrl, _client);
    }

    public static PachcaClient Stub(ItemsService? items = null)
    {
        return new PachcaClient(items ?? new ItemsService());
    }

    public void Dispose()
    {
        _client?.Dispose();
        GC.SuppressFinalize(this);
    }
}
