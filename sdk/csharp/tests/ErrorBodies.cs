// Error bodies: an error answer whose body is empty or not JSON is an ApiError
// with the status code and no errors, not a JSON parse error. The event stream
// answers 404 with no body when the event history is off, and a proxy answers
// 502 with an HTML page. Every request is answered by one canned response
// instead of the network. Run from OpenEnums.cs.

using System.Net;
using System.Text;
using Pachca.Sdk;

static class ErrorBodies
{
    public static async System.Threading.Tasks.Task RunAsync()
    {
        var empty = await FailureAsync(HttpStatusCode.NotFound, null, null, client => client.Bots.GetWebhookEventsStreamAsync());
        var apiError = CheckApiError(empty, 404, "a 404 with no body");
        Check(apiError.Errors.Count == 0, $"an empty body gives no errors, got {apiError.Errors.Count}");
        Check(apiError.Message == "HTTP 404", $"the message names the status, got {apiError.Message}");

        // POST is not repeated after a 5xx: one request, the page comes back at once.
        var proxy = await FailureAsync(HttpStatusCode.BadGateway, "<html><body>502 Bad Gateway</body></html>", "text/html", client => client.Bots.SelfRecreateBotTokenAsync());
        CheckApiError(proxy, 502, "a proxy page");
        var deleted = await FailureAsync(HttpStatusCode.NotFound, "<html>Not Found</html>", "text/html", client => client.Messages.DeleteMessageAsync(1));
        CheckApiError(deleted, 404, "a call with no answer body");

        var invalid = await FailureAsync(
            HttpStatusCode.UnprocessableEntity,
            """{"errors":[{"key":"name","value":null,"message":"Name is blank","code":"blank","payload":null}]}""",
            "application/json",
            client => client.Bots.SelfRecreateBotTokenAsync());
        var withErrors = CheckApiError(invalid, 422, "a JSON error");
        Check(withErrors.Errors.Count == 1 && withErrors.Message == "Name is blank", $"a JSON error keeps its errors, got {withErrors.Message}");

        var oauth = await FailureAsync(
            HttpStatusCode.Unauthorized,
            """{"error":"invalid_token","error_description":"Access token is missing"}""",
            "application/json",
            client => client.Bots.GetWebhookEventsStreamAsync());
        Check(oauth is OAuthError { } oauthError && oauthError.Error == OAuthErrorCode.InvalidToken, $"the OAuth form is an OAuthError, got {oauth.GetType().Name}");
        var unauthorized = await FailureAsync(HttpStatusCode.Unauthorized, null, null, client => client.Bots.GetWebhookEventsStreamAsync());
        CheckApiError(unauthorized, 401, "a 401 with no body");

        Console.WriteLine("error bodies ok");
    }

    private static async System.Threading.Tasks.Task<Exception> FailureAsync(
        HttpStatusCode status, string? body, string? contentType, Func<PachcaClient, System.Threading.Tasks.Task> call)
    {
        using var http = new HttpClient(new RawHandler(status, body, contentType));
        var client = new PachcaClient("https://pachca.test", http);
        try
        {
            await call(client);
        }
        catch (Exception error)
        {
            return error;
        }
        Check(false, $"the call did not fail for {(int)status}");
        throw new InvalidOperationException();
    }

    private static ApiError CheckApiError(Exception error, int status, string what)
    {
        Check(error is ApiError, $"{what} is an ApiError, got {error.GetType().Name}: {error.Message}");
        var apiError = (ApiError)error;
        Check(apiError.StatusCode == status, $"{what} keeps the status code {status}, got {apiError.StatusCode}");
        return apiError;
    }

    private static void Check(bool condition, string message)
    {
        if (condition) return;
        Console.Error.WriteLine($"error bodies failed: {message}");
        Environment.Exit(1);
    }

    private sealed class RawHandler : HttpMessageHandler
    {
        private readonly HttpStatusCode _status;
        private readonly string? _body;
        private readonly string? _contentType;

        public RawHandler(HttpStatusCode status, string? body, string? contentType) =>
            (_status, _body, _contentType) = (status, body, contentType);

        protected override System.Threading.Tasks.Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            var response = new HttpResponseMessage(_status);
            if (_body is not null) response.Content = new StringContent(_body, Encoding.UTF8, _contentType ?? "text/plain");
            return System.Threading.Tasks.Task.FromResult(response);
        }
    }
}
