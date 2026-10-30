// Request bodies: an optional property the caller left unset stays out of the body,
// a nullable one too (null switches a setting off or deletes an object), and a
// property named in NullFields goes out as null.

using System.Net;
using System.Text;
using Pachca.Sdk;

static class RequestBodies
{
    public static async System.Threading.Tasks.Task RunAsync()
    {
        await Expect(
            client => client.Bots.UpdateBotAsync(7, new BotUpdateRequest { Webhook = new BotUpdateRequestWebhook { Name = "Reminder bot" } }),
            """{"webhook":{"name":"Reminder bot"}}""", "unset properties stay out");
        await Expect(
            client => client.Drafts.UpdateDraftAsync(3, new DraftUpdateRequest { Draft = new DraftUpdateRequestDraft { Content = "Weekly report" } }),
            """{"draft":{"content":"Weekly report"}}""", "unset properties stay out");
        await Expect(
            client => client.Bots.UpdateBotAsync(7, new BotUpdateRequest { NullFields = [nameof(BotUpdateRequest.OauthClient)] }),
            """{"oauth_client":null}""", "OauthClient in NullFields");
        await Expect(
            client => client.Bots.UpdateBotAsync(7, new BotUpdateRequest { Webhook = new BotUpdateRequestWebhook { NullFields = [nameof(BotUpdateRequestWebhook.Kind)] } }),
            """{"webhook":{"kind":null}}""", "Kind in NullFields");
        await Expect(
            client => client.Drafts.UpdateDraftAsync(3, new DraftUpdateRequest { Draft = new DraftUpdateRequestDraft { ParentMessageId = 7, NullFields = ["ParentMessageId"] } }),
            """{"draft":{"parent_message_id":null}}""", "NullFields wins over a value");

        var handler = new CapturingHandler();
        using var http = new HttpClient(handler);
        var refused = new PachcaClient("https://pachca.test", http);
        try
        {
            await refused.Bots.UpdateBotAsync(7, new BotUpdateRequest { NullFields = ["Promo"] });
            Check(false, "a property the API does not take as null must be refused");
        }
        catch (ArgumentException)
        {
            Check(handler.Body == null, "a refused body must not be sent");
        }
        Console.WriteLine("request bodies ok");
    }

    private static async System.Threading.Tasks.Task Expect(Func<PachcaClient, System.Threading.Tasks.Task> call, string body, string what)
    {
        var handler = new CapturingHandler();
        using var http = new HttpClient(handler);
        await call(new PachcaClient("https://pachca.test", http));
        Check(handler.Body == body, $"{what}: {handler.Body}");
    }

    private static void Check(bool condition, string message)
    {
        if (condition) return;
        Console.Error.WriteLine($"request bodies failed: {message}");
        Environment.Exit(1);
    }

    private sealed class CapturingHandler : HttpMessageHandler
    {
        public string? Body { get; private set; }

        protected override async System.Threading.Tasks.Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            Body = request.Content == null ? null : await request.Content.ReadAsStringAsync(cancellationToken);
            return new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent("""{"data":{}}""", Encoding.UTF8, "application/json"),
            };
        }
    }
}
