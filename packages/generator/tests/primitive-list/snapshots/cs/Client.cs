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

public class ReadMembersService
{

    public virtual async System.Threading.Tasks.Task<ListReadMembersResponse> ListReadMembersAsync(
        int id,
        int? limit = null,
        string? cursor = null,
        CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException("Read members.listReadMembers is not implemented");
    }

    public virtual async System.Threading.Tasks.Task<List<int>> ListReadMembersAllAsync(
        int id,
        int? limit = null,
        CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException("Read members.listReadMembersAll is not implemented");
    }
}

public sealed class ReadMembersServiceImpl : ReadMembersService
{
    private readonly string _baseUrl;
    private readonly HttpClient _client;

    internal ReadMembersServiceImpl(string baseUrl, HttpClient client)
    {
        _baseUrl = baseUrl;
        _client = client;
    }

    public override async System.Threading.Tasks.Task<ListReadMembersResponse> ListReadMembersAsync(
        int id,
        int? limit = null,
        string? cursor = null,
        CancellationToken cancellationToken = default)
    {
        var queryParts = new List<string>();
        if (limit != null)
            queryParts.Add($"limit={Uri.EscapeDataString(limit.Value.ToString()!)}");
        if (cursor != null)
            queryParts.Add($"cursor={Uri.EscapeDataString(cursor)}");
        var url = $"{_baseUrl}/messages/{id}/read_member_ids" + (queryParts.Count > 0 ? "?" + string.Join("&", queryParts) : "");
        using var request = new HttpRequestMessage(HttpMethod.Get, url);
        using var response = await PachcaUtils.SendWithRetryAsync(_client, request, cancellationToken).ConfigureAwait(false);
        var json = await response.Content.ReadAsStringAsync(cancellationToken).ConfigureAwait(false);
        switch ((int)response.StatusCode)
        {
            case 200:
                return PachcaUtils.Deserialize<ListReadMembersResponse>(json);
            default:
                throw PachcaUtils.ErrorFromResponse((int)response.StatusCode, json);
        }
    }

    public override async System.Threading.Tasks.Task<List<int>> ListReadMembersAllAsync(
        int id,
        int? limit = null,
        CancellationToken cancellationToken = default)
    {
        var items = new List<int>();
        string? cursor = null;
        do
        {
            var response = await ListReadMembersAsync(id, limit: limit, cursor: cursor, cancellationToken: cancellationToken).ConfigureAwait(false);
            items.AddRange(response.Data);
            if (response.Data.Count == 0) break;
            cursor = response.Meta.Paginate.NextPage;
        } while (true);
        return items;
    }
}

public static class PachcaConstants
{
    public const string PachcaApiUrl = "https://api.pachca.com/api/shared/v1";
}

public sealed class PachcaClient : IDisposable
{
    private readonly HttpClient? _client;

    public ReadMembersService ReadMembers { get; }

    private PachcaClient(ReadMembersService readMembers)
    {
        ReadMembers = readMembers;
    }

    public PachcaClient(string token, string baseUrl = PachcaConstants.PachcaApiUrl, ReadMembersService? readMembers = null)
    {
        _client = new HttpClient();
        _client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", token);

        ReadMembers = readMembers ?? new ReadMembersServiceImpl(baseUrl, _client);
    }

    public PachcaClient(string baseUrl, HttpClient client, ReadMembersService? readMembers = null)
    {
        _client = client;

        ReadMembers = readMembers ?? new ReadMembersServiceImpl(baseUrl, _client);
    }

    public static PachcaClient Stub(ReadMembersService? readMembers = null)
    {
        return new PachcaClient(readMembers ?? new ReadMembersService());
    }

    public void Dispose()
    {
        _client?.Dispose();
        GC.SuppressFinalize(this);
    }
}
