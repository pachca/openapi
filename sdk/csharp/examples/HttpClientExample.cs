/**
 * HTTP client example — using a pre-configured HttpClient with optional proxy.
 *
 * Demonstrates the HttpClient-based constructor.
 *
 * Usage:
 *
 *   PACHCA_TOKEN=your_token PACHCA_CHAT_ID=12345 dotnet run -- httpclient
 *   HTTP_PROXY=http://proxy:8080 PACHCA_TOKEN=... PACHCA_CHAT_ID=... dotnet run -- httpclient
 */

namespace Pachca.Sdk.Examples;

public static class HttpClientExample
{
    public static async Task<int> RunAsync()
    {
        var token = Environment.GetEnvironmentVariable("PACHCA_TOKEN")
            ?? throw new InvalidOperationException("Set PACHCA_TOKEN environment variable");
        var chatId = int.Parse(
            Environment.GetEnvironmentVariable("PACHCA_CHAT_ID")
            ?? throw new InvalidOperationException("Set PACHCA_CHAT_ID environment variable"));

        var handler = new HttpClientHandler();
        var proxyUrl = Environment.GetEnvironmentVariable("HTTP_PROXY");
        if (proxyUrl != null)
        {
            handler.Proxy = new System.Net.WebProxy(proxyUrl);
            handler.UseProxy = true;
        }

        var http = new HttpClient(handler);
        http.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        var client = new PachcaClient(PachcaConstants.PachcaApiUrl, http);

        var chat = await client.Chats.GetChatAsync(chatId);
        Console.WriteLine($"Chat: {chat.Name} (id={chat.Id})");

        return 0;
    }
}
