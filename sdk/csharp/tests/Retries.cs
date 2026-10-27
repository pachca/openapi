// Retries: a 504 with the error code timeout is a search the server stopped
// because the query is too heavy, so the client hands it back at once with its
// body intact, while a 504 from a proxy is retried. Every request is answered by
// the same canned response instead of the network. Run from OpenEnums.cs.

using System.Diagnostics;
using System.Net;
using System.Text;
using Pachca.Sdk;

static class Retries
{
    private const string SearchTimeout = """{"errors":[{"key":"system","value":null,"message":"Search timed out","code":"timeout","payload":null}]}""";

    public static async System.Threading.Tasks.Task RunAsync()
    {
        // The search timed out: one request, and the error keeps its code.
        var timeout = new RepeatingHandler(HttpStatusCode.GatewayTimeout, SearchTimeout);
        using (var http = new HttpClient(timeout))
        {
            var client = new PachcaClient("https://pachca.test", http);
            var watch = Stopwatch.StartNew();
            try
            {
                await client.Search.SearchMessagesAsync(query: "report");
                Check(false, "expected ApiError with timeout");
            }
            catch (ApiError error)
            {
                Check(error.Errors[0].Code == ValidationErrorCode.Timeout, $"the body reaches the caller, got {error.Errors[0].Code}");
            }
            Check(timeout.Requests == 1, $"a 504 with the code timeout is not repeated, got {timeout.Requests} requests");
            Check(watch.Elapsed < TimeSpan.FromSeconds(5), $"a 504 with the code timeout comes back at once, took {watch.Elapsed}");
        }

        // The retry after a 5xx waits about ten seconds: a call cancelled while
        // waiting, with one request made, was waiting for it.
        foreach (var body in new[] { "<html>Gateway Timeout</html>", """{"errors":[{"code":"unavailable","message":"Try later"}]}""" })
        {
            var proxy = new RepeatingHandler(HttpStatusCode.GatewayTimeout, body);
            using var http = new HttpClient(proxy);
            var client = new PachcaClient("https://pachca.test", http);
            using var cancel = new CancellationTokenSource(TimeSpan.FromSeconds(1));
            try
            {
                await client.Chats.ListChatsAsync(cancellationToken: cancel.Token);
                Check(false, $"a 504 without the code timeout is retried, the call returned for {body}");
            }
            catch (OperationCanceledException)
            {
            }
            catch (Exception error)
            {
                Check(false, $"a 504 without the code timeout is retried, the call failed with {error.GetType().Name} for {body}");
            }
            Check(proxy.Requests == 1, $"one request before the pause, got {proxy.Requests} for {body}");
        }

        Console.WriteLine("retries ok");
    }

    private static void Check(bool condition, string message)
    {
        if (condition) return;
        Console.Error.WriteLine($"retries failed: {message}");
        Environment.Exit(1);
    }

    private sealed class RepeatingHandler : HttpMessageHandler
    {
        private readonly HttpStatusCode _status;
        private readonly string _body;
        private int _requests;

        public RepeatingHandler(HttpStatusCode status, string body) => (_status, _body) = (status, body);

        public int Requests => _requests;

        protected override System.Threading.Tasks.Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            Interlocked.Increment(ref _requests);
            return System.Threading.Tasks.Task.FromResult(new HttpResponseMessage(_status)
            {
                Content = new StringContent(_body, Encoding.UTF8, "application/json"),
            });
        }
    }
}
