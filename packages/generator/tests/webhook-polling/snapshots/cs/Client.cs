#nullable enable

using System;
using System.Collections.Generic;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Runtime.CompilerServices;

namespace Pachca.Sdk;

public class BotsService
{

    public virtual async System.Threading.Tasks.Task<GetWebhookEventsResponse> GetWebhookEventsAsync(
        int? limit = null,
        string? cursor = null,
        CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException("Bots.getWebhookEvents is not implemented");
    }

    public virtual async System.Threading.Tasks.Task<List<WebhookEvent>> GetWebhookEventsAllAsync(
        int? limit = null,
        CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException("Bots.getWebhookEventsAll is not implemented");
    }

    public virtual async IAsyncEnumerable<WebhookEvent> PollWebhookEventsAsync(
        int? limit = 50,
        TimeSpan? interval = null,
        DateTimeOffset? createdAfter = null,
        int maxSeenDeliveryIds = 5000,
        [EnumeratorCancellation] CancellationToken cancellationToken = default)
    {
        if (maxSeenDeliveryIds <= 0)
            throw new ArgumentOutOfRangeException(nameof(maxSeenDeliveryIds), "maxSeenDeliveryIds must be greater than 0");

        var pollInterval = interval ?? TimeSpan.FromSeconds(5);
        var effectiveCreatedAfter = createdAfter ?? DateTimeOffset.UtcNow;
        var seenIdOrder = new Queue<string>();
        var seenIds = new HashSet<string>();

        bool Remember(string id)
        {
            if (!seenIds.Add(id)) return false;
            seenIdOrder.Enqueue(id);
            while (seenIdOrder.Count > maxSeenDeliveryIds)
                seenIds.Remove(seenIdOrder.Dequeue());
            return true;
        }

        while (!cancellationToken.IsCancellationRequested)
        {
            string? cursor = null;
            var hasNext = true;
            while (hasNext && !cancellationToken.IsCancellationRequested)
            {
                var response = await GetWebhookEventsAsync(limit: limit, cursor: cursor, cancellationToken: cancellationToken).ConfigureAwait(false);
                var pageHasRecentEvents = false;
                for (var i = response.Data.Count - 1; i >= 0; i--)
                {
                    var webhookEvent = response.Data[i];
                    var matchesCreatedAfter = webhookEvent.CreatedAt >= effectiveCreatedAfter;
                    if (matchesCreatedAfter)
                        pageHasRecentEvents = true;
                    if (matchesCreatedAfter && Remember(webhookEvent.Id))
                        yield return webhookEvent;
                }
                hasNext = (response.Meta.Paginate.HasNext ?? response.Data.Count > 0) && pageHasRecentEvents;
                cursor = response.Meta.Paginate.NextPage;
            }
            await System.Threading.Tasks.Task.Delay(pollInterval, cancellationToken).ConfigureAwait(false);
        }
    }

    public virtual async IAsyncEnumerable<TPayload> PollWebhookPayloadsAsync<TPayload>(
        int? limit = 50,
        TimeSpan? interval = null,
        DateTimeOffset? createdAfter = null,
        int maxSeenDeliveryIds = 5000,
        [EnumeratorCancellation] CancellationToken cancellationToken = default)
        where TPayload : WebhookPayloadUnion
    {
        await foreach (var webhookEvent in PollWebhookEventsAsync(
            limit: limit,
            interval: interval,
            createdAfter: createdAfter,
            maxSeenDeliveryIds: maxSeenDeliveryIds,
            cancellationToken: cancellationToken))
        {
            if (webhookEvent.Payload is TPayload payload)
                yield return payload;
        }
    }
}

public sealed class BotsServiceImpl : BotsService
{
    private readonly string _baseUrl;
    private readonly HttpClient _client;

    internal BotsServiceImpl(string baseUrl, HttpClient client)
    {
        _baseUrl = baseUrl;
        _client = client;
    }

    public override async System.Threading.Tasks.Task<GetWebhookEventsResponse> GetWebhookEventsAsync(
        int? limit = null,
        string? cursor = null,
        CancellationToken cancellationToken = default)
    {
        var queryParts = new List<string>();
        if (limit != null)
            queryParts.Add($"limit={Uri.EscapeDataString(limit.Value.ToString()!)}");
        if (cursor != null)
            queryParts.Add($"cursor={Uri.EscapeDataString(cursor)}");
        var url = $"{_baseUrl}/webhooks/events" + (queryParts.Count > 0 ? "?" + string.Join("&", queryParts) : "");
        using var request = new HttpRequestMessage(HttpMethod.Get, url);
        using var response = await PachcaUtils.SendWithRetryAsync(_client, request, cancellationToken).ConfigureAwait(false);
        var json = await response.Content.ReadAsStringAsync(cancellationToken).ConfigureAwait(false);
        switch ((int)response.StatusCode)
        {
            case 200:
                return PachcaUtils.Deserialize<GetWebhookEventsResponse>(json);
            default:
                throw new InvalidOperationException($"Unexpected status code: {(int)response.StatusCode}");
        }
    }

    public override async System.Threading.Tasks.Task<List<WebhookEvent>> GetWebhookEventsAllAsync(
        int? limit = null,
        CancellationToken cancellationToken = default)
    {
        var items = new List<WebhookEvent>();
        string? cursor = null;
        var hasNext = true;
        while (hasNext)
        {
            var response = await GetWebhookEventsAsync(limit: limit, cursor: cursor, cancellationToken: cancellationToken).ConfigureAwait(false);
            items.AddRange(response.Data);
            if (response.Data.Count == 0) break;
            cursor = response.Meta.Paginate.NextPage;
            hasNext = response.Meta.Paginate.HasNext ?? true;
        }
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

    public BotsService Bots { get; }

    private PachcaClient(BotsService bots)
    {
        Bots = bots;
    }

    public PachcaClient(string token, string baseUrl = PachcaConstants.PachcaApiUrl, BotsService? bots = null)
    {
        _client = new HttpClient();
        _client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", token);

        Bots = bots ?? new BotsServiceImpl(baseUrl, _client);
    }

    public PachcaClient(string baseUrl, HttpClient client, BotsService? bots = null)
    {
        _client = client;

        Bots = bots ?? new BotsServiceImpl(baseUrl, _client);
    }

    public static PachcaClient Stub(BotsService? bots = null)
    {
        return new PachcaClient(bots ?? new BotsService());
    }

    public void Dispose()
    {
        _client?.Dispose();
        GC.SuppressFinalize(this);
    }
}
