// Open enums: a value the SDK does not list yet decodes and keeps the raw string —
// in a response, in the OAuth error body and in the API error body. Every request
// is answered by the next canned response instead of the network.

using System.Net;
using System.Text;
using Pachca.Sdk;

const string Unlisted = "A code this SDK does not list";
var handler = new CannedHandler(
    (HttpStatusCode.OK, """{"data":{"id":4827,"token":"cH5kR9mN...x7Qp","name":null,"user_id":12,"scopes":["messages:read","brand_new:scope"],"created_at":"2025-01-15T10:30:00.000Z","revoked_at":null,"expires_in":null,"last_used_at":null}}"""),
    (HttpStatusCode.Unauthorized, $$"""{"error":"brand_new_401","error_description":"{{Unlisted}}"}"""),
    (HttpStatusCode.Forbidden, $$"""{"error":"brand_new_403","error_description":"{{Unlisted}}"}"""),
    (HttpStatusCode.UnprocessableEntity, $$"""{"errors":[{"key":"system","value":null,"message":"{{Unlisted}}","code":"brand_new_code","payload":null}]}"""));
using var http = new HttpClient(handler);
var client = new PachcaClient("https://pachca.test", http);

var info = await client.Oauth.GetTokenInfoAsync();
Check(info.Scopes[0] == OAuthScope.MessagesRead && info.Scopes[0].IsKnown, $"a listed scope decodes to its value, got {info.Scopes[0]}");
Check(info.Scopes[1].Value == "brand_new:scope" && !info.Scopes[1].IsKnown, $"an unlisted scope keeps its value, got {info.Scopes[1]}");

foreach (var code in new[] { "brand_new_401", "brand_new_403" })
{
    try
    {
        await client.Oauth.GetTokenInfoAsync();
        Check(false, $"expected OAuthError with {code}");
    }
    catch (OAuthError error)
    {
        Check(error.Error == new OAuthErrorCode(code) && error.Message == code, $"OAuthError keeps the unlisted code {code}, got {error.Error}");
    }
}

try
{
    await client.Oauth.GetTokenInfoAsync();
    Check(false, "expected ApiError with brand_new_code");
}
catch (ApiError error)
{
    Check(error.Errors[0].Code.Value == "brand_new_code", $"ApiError keeps the unlisted code, got {error.Errors[0].Code}");
}

Check(OAuthErrorCode.Values.Contains(OAuthErrorCode.InsufficientScope), "Values lists the known codes");
try
{
    ((IList<OAuthErrorCode>)OAuthErrorCode.Values)[0] = new OAuthErrorCode("replaced");
    Check(false, "Values is read-only");
}
catch (NotSupportedException)
{
}
Check(OAuthErrorCode.InvalidToken.IsKnown, "a listed code stays known");
Console.WriteLine("open enums ok");

await Retries.RunAsync();
await ErrorBodies.RunAsync();
await AuditDetails.RunAsync();
await RequestBodies.RunAsync();
return 0;

static void Check(bool condition, string message)
{
    if (condition) return;
    Console.Error.WriteLine($"open enums failed: {message}");
    Environment.Exit(1);
}

sealed class CannedHandler : HttpMessageHandler
{
    private readonly Queue<(HttpStatusCode Status, string Body)> _responses;

    public CannedHandler(params (HttpStatusCode Status, string Body)[] responses) =>
        _responses = new Queue<(HttpStatusCode Status, string Body)>(responses);

    protected override System.Threading.Tasks.Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
    {
        var (status, body) = _responses.Dequeue();
        return System.Threading.Tasks.Task.FromResult(new HttpResponseMessage(status)
        {
            Content = new StringContent(body, Encoding.UTF8, "application/json"),
        });
    }
}
