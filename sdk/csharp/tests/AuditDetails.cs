// Audit event details carry no discriminator: a record whose keys fit a member but
// whose types do not (an older format) decodes into the next member that fits.
// One record never breaks the page.

using System.Net;
using Pachca.Sdk;

static class AuditDetails
{
    private static string Event(string id, string key, string details) =>
        $$"""{"id":"{{id}}","created_at":"2026-10-01T10:00:00.000Z","event_key":"{{key}}","entity_id":"7","entity_type":"Bot","actor_id":"12","actor_type":"User","details":{{details}},"ip_address":null,"user_agent":null}""";

    public static async System.Threading.Tasks.Task RunAsync()
    {
        // bot_token_updated before 7 October 2026: scopes is an object, not a list.
        var oldBotTokenUpdated = Event("1", "bot_token_updated",
            """{"actor_id":12,"bot_id":7,"webhook_id":31,"application_id":null,"access_token_id":4827,"access_token_preview":"cH5k...x7Qp","scopes":{"previous":["messages:read"],"new":["messages:read","chats:read"]}}""");
        var botTokenUpdated = Event("2", "bot_token_updated",
            """{"token_kind":"bot","token_name":null,"resource_owner_id":7,"current_scopes":["messages:read"],"bot_id":7,"actor_id":null,"access_token_id":4827,"access_token_preview":null,"webhook_id":31}""");
        var chatJoin = Event("3", "user_chat_join", """{"chat_id":5}""");
        // A token record: scopes is a list.
        var accessTokenCreated = Event("4", "access_token_created",
            """{"token_kind":"user","token_name":"Отчёты","resource_owner_id":12,"scopes":["messages:read"],"access_token_id":4828,"access_token_preview":"dG9r...a2Vu","actor_id":12}""");
        // A change of the bot token scopes: scopes is an object beside current_scopes.
        var botTokenScopesUpdated = Event("5", "bot_token_updated",
            """{"token_kind":"bot","token_name":null,"resource_owner_id":7,"current_scopes":["messages:read","chats:read"],"scopes":{"previous":["messages:read"],"new":["messages:read","chats:read"]},"bot_id":7,"actor_id":12,"access_token_id":4827,"access_token_preview":null,"webhook_id":31}""");
        var page = "{\"data\":[" + string.Join(",", oldBotTokenUpdated, botTokenUpdated, chatJoin, accessTokenCreated, botTokenScopesUpdated) +
            """],"meta":{"paginate":{"next_page":"eyJpZCI6M30"}}}""";

        using var http = new HttpClient(new CannedHandler((HttpStatusCode.OK, page)));
        var client = new PachcaClient("https://pachca.test", http);
        var events = (await client.Security.GetAuditEventsAsync()).Data;

        Check(events.Count == 5, $"the page keeps every record, got {events.Count}");
        Check(events[0].Details is not AuditDetailsBot, $"AuditDetailsBot takes scopes as a list: it must give way, got {events[0].Details}");
        Check(events[1].Details is AuditDetailsBotTokenUpdated { TokenName: null, ActorId: null }, $"required fields that hold null decode, got {events[1].Details}");
        Check(events[2].Details is AuditDetailsChatId { ChatId: 5 }, $"a plain record decodes as before, got {events[2].Details}");
        Check(events[3].Details is AuditDetailsToken { Scopes: ["messages:read"] }, $"a token record decodes as a token, got {events[3].Details}");
        Check(events[4].Details is AuditDetailsBotTokenUpdated { CurrentScopes: ["messages:read", "chats:read"] }, $"a change of the bot token scopes decodes as bot_token_updated, got {events[4].Details}");
        Console.WriteLine("audit details ok");
    }

    private static void Check(bool condition, string message)
    {
        if (condition) return;
        Console.Error.WriteLine($"audit details failed: {message}");
        Environment.Exit(1);
    }
}
