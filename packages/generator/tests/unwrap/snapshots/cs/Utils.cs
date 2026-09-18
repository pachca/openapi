#nullable enable

using System;
using System.Collections.Generic;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;

namespace Pachca.Sdk;

internal static class PachcaUtils
{
    private const int MaxRetries = 3;
    private static readonly HashSet<int> Retryable5xx = new() { 500, 502, 503, 504 };
    private static readonly Random JitterRandom = new();

    internal static readonly JsonSerializerOptions JsonOptions = new()
    {
        DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull,
        PropertyNameCaseInsensitive = true,
    };

    // Only the daily chat limit and the hour-long ban wait longer than a minute.
    private static readonly TimeSpan MaxRetryAfter = TimeSpan.FromSeconds(60);

    // Retry-After is a minimum, not an estimate: waiting less lands the retry
    // inside a window that is still closed. Jitter only upwards.
    private static TimeSpan AddJitter(TimeSpan delay)
    {
        var factor = 1 + JitterRandom.NextDouble() * 0.25;
        return TimeSpan.FromMilliseconds(delay.TotalMilliseconds * factor);
    }

    internal static async Task<HttpResponseMessage> SendWithRetryAsync(
        HttpClient client,
        HttpRequestMessage request,
        CancellationToken cancellationToken = default)
    {
        for (var attempt = 0; attempt <= MaxRetries; attempt++)
        {
            HttpRequestMessage req;
            if (attempt == 0)
            {
                req = request;
            }
            else
            {
                req = await CloneRequestAsync(request).ConfigureAwait(false);
            }

            var response = await client.SendAsync(req, cancellationToken).ConfigureAwait(false);

            if ((int)response.StatusCode == 429 && attempt < MaxRetries)
            {
                var retryAfter = response.Headers.RetryAfter?.Delta;
                // A long pause is the daily chat limit or an hour-long ban. Retrying it
                // is pointless, and an early retry doubles the pause: hand the response
                // back so the caller can schedule the work itself.
                if (retryAfter is { } wait && wait > MaxRetryAfter)
                {
                    return response;
                }

                var delay = retryAfter ?? TimeSpan.FromSeconds(Math.Pow(2, attempt));
                await System.Threading.Tasks.Task.Delay(AddJitter(delay), cancellationToken).ConfigureAwait(false);
                response.Dispose();
                continue;
            }

            if (Retryable5xx.Contains((int)response.StatusCode) && attempt < MaxRetries)
            {
                var delay = AddJitter(TimeSpan.FromSeconds(10 * Math.Pow(2, attempt)));
                await System.Threading.Tasks.Task.Delay(delay, cancellationToken).ConfigureAwait(false);
                response.Dispose();
                continue;
            }

            return response;
        }

        return await client.SendAsync(
            await CloneRequestAsync(request).ConfigureAwait(false),
            cancellationToken).ConfigureAwait(false);
    }

    private static async Task<HttpRequestMessage> CloneRequestAsync(HttpRequestMessage request)
    {
        var clone = new HttpRequestMessage(request.Method, request.RequestUri);
        foreach (var header in request.Headers)
            clone.Headers.TryAddWithoutValidation(header.Key, header.Value);

        if (request.Content != null)
        {
            var content = await request.Content.ReadAsByteArrayAsync().ConfigureAwait(false);
            clone.Content = new ByteArrayContent(content);
            if (request.Content.Headers.ContentType != null)
                clone.Content.Headers.ContentType = request.Content.Headers.ContentType;
        }

        return clone;
    }

    internal static T Deserialize<T>(string json) =>
        JsonSerializer.Deserialize<T>(json, JsonOptions)
            ?? throw new InvalidOperationException("Deserialization returned null");

    internal static string Serialize<T>(T value) =>
        JsonSerializer.Serialize(value, JsonOptions);

    internal static string EnumToApiString<T>(T value) where T : struct, Enum =>
        JsonSerializer.Serialize(value, JsonOptions).Trim('"');
}
