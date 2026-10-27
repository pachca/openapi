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

public class MembersService
{

    public virtual async System.Threading.Tasks.Task<ListMembersResponse> ListMembersAsync(
        SortOrder? sort = null,
        MemberRole? role = null,
        List<MemberRole>? roles = null,
        Region? region = null,
        CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException("Members.listMembers is not implemented");
    }

    public virtual async System.Threading.Tasks.Task<Member> UpdateMemberAsync(
        int id,
        MemberUpdateRequest request,
        CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException("Members.updateMember is not implemented");
    }
}

public sealed class MembersServiceImpl : MembersService
{
    private readonly string _baseUrl;
    private readonly HttpClient _client;

    internal MembersServiceImpl(string baseUrl, HttpClient client)
    {
        _baseUrl = baseUrl;
        _client = client;
    }

    public override async System.Threading.Tasks.Task<ListMembersResponse> ListMembersAsync(
        SortOrder? sort = null,
        MemberRole? role = null,
        List<MemberRole>? roles = null,
        Region? region = null,
        CancellationToken cancellationToken = default)
    {
        var queryParts = new List<string>();
        if (sort != null)
            queryParts.Add($"sort={Uri.EscapeDataString(PachcaUtils.EnumToApiString(sort.Value))}");
        if (role != null)
            queryParts.Add($"role={Uri.EscapeDataString(role.Value.Value)}");
        if (roles != null)
            foreach (var item in roles)
                queryParts.Add($"roles[]={Uri.EscapeDataString(item.Value)}");
        if (region != null)
            queryParts.Add($"region={Uri.EscapeDataString(region.Value.Value)}");
        var url = $"{_baseUrl}/members" + (queryParts.Count > 0 ? "?" + string.Join("&", queryParts) : "");
        using var request = new HttpRequestMessage(HttpMethod.Get, url);
        using var response = await PachcaUtils.SendWithRetryAsync(_client, request, cancellationToken).ConfigureAwait(false);
        var json = await response.Content.ReadAsStringAsync(cancellationToken).ConfigureAwait(false);
        switch ((int)response.StatusCode)
        {
            case 200:
                return PachcaUtils.Deserialize<ListMembersResponse>(json);
            default:
                throw PachcaUtils.ErrorFromResponse((int)response.StatusCode, json);
        }
    }

    public override async System.Threading.Tasks.Task<Member> UpdateMemberAsync(
        int id,
        MemberUpdateRequest request,
        CancellationToken cancellationToken = default)
    {
        var url = $"{_baseUrl}/members/{id}";
        using var httpRequest = new HttpRequestMessage(HttpMethod.Put, url);
        httpRequest.Content = new StringContent(PachcaUtils.Serialize(request), Encoding.UTF8, "application/json");
        using var response = await PachcaUtils.SendWithRetryAsync(_client, httpRequest, cancellationToken).ConfigureAwait(false);
        var json = await response.Content.ReadAsStringAsync(cancellationToken).ConfigureAwait(false);
        switch ((int)response.StatusCode)
        {
            case 200:
                return PachcaUtils.Deserialize<MemberDataWrapper>(json).Data;
            default:
                throw PachcaUtils.ErrorFromResponse((int)response.StatusCode, json);
        }
    }
}

public sealed class PachcaClient : IDisposable
{
    private readonly HttpClient? _client;

    public MembersService Members { get; }

    private PachcaClient(MembersService members)
    {
        Members = members;
    }

    public PachcaClient(string token, string baseUrl, MembersService? members = null)
    {
        _client = new HttpClient();
        _client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", token);

        Members = members ?? new MembersServiceImpl(baseUrl, _client);
    }

    public PachcaClient(string baseUrl, HttpClient client, MembersService? members = null)
    {
        _client = client;

        Members = members ?? new MembersServiceImpl(baseUrl, _client);
    }

    public static PachcaClient Stub(MembersService? members = null)
    {
        return new PachcaClient(members ?? new MembersService());
    }

    public void Dispose()
    {
        _client?.Dispose();
        GC.SuppressFinalize(this);
    }
}
