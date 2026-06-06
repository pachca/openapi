/**
 * Webhook polling example — continuously process new webhook deliveries.
 *
 * Usage:
 *
 *   PACHCA_TOKEN=your_token dotnet run -- polling
 *   PACHCA_TOKEN=your_token dotnet run -- polling --payloads
 */

using System.Text.Json;

namespace Pachca.Sdk.Examples;

public static class PollingExample
{
    public static async Task<int> RunAsync(string[] args)
    {
        var pollPayloadsOnly = args.Contains("--payloads");
        var token = Environment.GetEnvironmentVariable("PACHCA_TOKEN")
            ?? throw new InvalidOperationException("Set PACHCA_TOKEN environment variable");

        var client = new PachcaClient(token);
        var startedAt = DateTimeOffset.UtcNow;
        using var cancellation = new CancellationTokenSource();
        Console.CancelKeyPress += (_, e) =>
        {
            e.Cancel = true;
            cancellation.Cancel();
        };

        Console.WriteLine("Webhook polling worker started");
        Console.WriteLine("poll_limit=50 poll_interval=2s");
        Console.WriteLine($"waiting_for_events_created_after={startedAt:O}");

        try
        {
            if (pollPayloadsOnly)
            {
                await foreach (var payload in client.Bots.PollWebhookPayloadsAsync<WebhookPayloadUnion>(
                    limit: 50,
                    interval: TimeSpan.FromSeconds(2),
                    createdAfter: startedAt,
                    maxSeenDeliveryIds: 5000,
                    cancellationToken: cancellation.Token))
                {
                    Console.WriteLine(JsonSerializer.Serialize(payload, new JsonSerializerOptions { WriteIndented = true }));
                }
            }
            else
            {
                await foreach (var @event in client.Bots.PollWebhookEventsAsync(
                    limit: 50,
                    interval: TimeSpan.FromSeconds(2),
                    createdAfter: startedAt,
                    maxSeenDeliveryIds: 5000,
                    cancellationToken: cancellation.Token))
                {
                    Console.WriteLine(JsonSerializer.Serialize(@event, new JsonSerializerOptions { WriteIndented = true }));
                }
            }
        }
        catch (OperationCanceledException)
        {
        }

        return 0;
    }
}
