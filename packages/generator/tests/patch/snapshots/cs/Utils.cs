#nullable enable

using System;
using System.Collections.Generic;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Reflection;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization.Metadata;
using System.Threading;
using System.Threading.Tasks;

namespace Pachca.Sdk;

/// <summary>A request model with properties the API takes as null.</summary>
internal interface INullFields
{
    List<string>? NullFields { get; }
}

internal static class PachcaUtils
{
    private const int MaxRetries = 3;
    private static readonly HashSet<int> Retryable5xx = new() { 500, 502, 503, 504 };

    // A 5xx says nothing about whether the server already applied the request.
    // These methods are safe to repeat. A retried POST or PATCH could apply
    // twice: POST /messages would send the message again, and the API has no
    // idempotency key. 429 is safe for any method: the request was rejected
    // before it was processed.
    private static readonly HashSet<HttpMethod> IdempotentMethods = new()
    {
        HttpMethod.Get, HttpMethod.Head, HttpMethod.Options, HttpMethod.Put, HttpMethod.Delete,
    };
    private static readonly Random JitterRandom = new();

    internal static readonly JsonSerializerOptions JsonOptions = new()
    {
        DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull,
        PropertyNameCaseInsensitive = true,
        TypeInfoResolver = new DefaultJsonTypeInfoResolver { Modifiers = { SendNullFields } },
    };

    // Properties of a request model the caller can send as null, by name in NullFields.
    private static readonly Dictionary<Type, HashSet<string>> NullableProperties = new()
    {
        [typeof(ItemPatchRequestItem)] = new() { "Description" },
    };

    // A property named in NullFields goes out as null, whatever value it holds. A name
    // the model does not take as null fails before the request is sent.
    private static void SendNullFields(JsonTypeInfo typeInfo)
    {
        if (typeInfo.Kind != JsonTypeInfoKind.Object || !NullableProperties.TryGetValue(typeInfo.Type, out var nullable))
            return;
        var model = typeInfo.Type.Name;
        typeInfo.OnSerializing = obj =>
        {
            foreach (var name in ((INullFields)obj).NullFields ?? new List<string>())
            {
                if (!nullable.Contains(name))
                    throw new ArgumentException($"{model}: field \"{name}\" cannot be sent as null");
            }
        };
        foreach (var property in typeInfo.Properties)
        {
            if (property.AttributeProvider is not PropertyInfo info || !nullable.Contains(info.Name) || property.Get is not { } get)
                continue;
            var name = info.Name;
            property.Get = obj => IsNulled(obj, name) ? null : get(obj);
            property.ShouldSerialize = (obj, value) => value != null || IsNulled(obj, name);
        }
    }

    private static bool IsNulled(object obj, string name) =>
        ((INullFields)obj).NullFields?.Contains(name) == true;

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

            if (Retryable5xx.Contains((int)response.StatusCode)
                && IdempotentMethods.Contains(request.Method)
                && attempt < MaxRetries
                && !await IsQueryTimeoutAsync(response, cancellationToken).ConfigureAwait(false))
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

    // A 504 with the code timeout is a search the server stopped because the
    // query is too heavy: the same query would time out again, so it goes back
    // to the caller at once. A 504 from a proxy has no such code and is retried.
    // The content is buffered, so the caller can still read it.
    private static async Task<bool> IsQueryTimeoutAsync(HttpResponseMessage response, CancellationToken cancellationToken)
    {
        if (response.StatusCode != HttpStatusCode.GatewayTimeout)
        {
            return false;
        }

        try
        {
            await response.Content.LoadIntoBufferAsync().ConfigureAwait(false);
            var body = await response.Content.ReadAsStringAsync(cancellationToken).ConfigureAwait(false);
            using var document = JsonDocument.Parse(body);
            if (document.RootElement.ValueKind != JsonValueKind.Object
                || !document.RootElement.TryGetProperty("errors", out var errors)
                || errors.ValueKind != JsonValueKind.Array)
            {
                return false;
            }

            foreach (var error in errors.EnumerateArray())
            {
                if (error.ValueKind == JsonValueKind.Object
                    && error.TryGetProperty("code", out var code)
                    && code.ValueKind == JsonValueKind.String
                    && code.GetString() == "timeout")
                {
                    return true;
                }
            }

            return false;
        }
        catch (JsonException)
        {
            return false;
        }
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

    // An empty body or one that is not JSON gives an ApiError with no errors. The status code stays in StatusCode.
    internal static Exception ErrorFromResponse(int statusCode, string json)
    {
        ApiError? error = null;
        try
        {
            using var document = JsonDocument.Parse(json);
            var root = document.RootElement;
            if (root.ValueKind == JsonValueKind.Object)
                error = Deserialize<ApiError>(json);
        }
        catch (JsonException)
        {
        }
        error ??= new ApiError();
        error.Errors ??= new();
        error.StatusCode = statusCode;
        return error;
    }
}
