// Audit event details carry no discriminator: a record whose keys fit a member but
// whose types do not, or that misses a required key, decodes into the next member
// that fits. One record never breaks the page. Records from before 7 October 2026
// keep scopes as an object in bot_token_updated and as a list in bot_token_created:
// AuditDetailsBot takes both. A member is checked in depth: a nested model that
// misses a required key makes the member give way, as in Kotlin, Python and Swift.

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
        // bot_token_created before 7 October 2026: scopes is a list, no token_kind.
        var oldBotTokenCreated = Event("6", "bot_token_created",
            """{"actor_id":12,"bot_id":7,"webhook_id":31,"application_id":null,"access_token_id":4827,"access_token_preview":"cH5k...x7Qp","scopes":["messages:read","chats:read"]}""");
        // Fits AuditDetailsKms by keys, but reason is missing: AuditDetailsChatId takes it.
        var chatAndMessage = Event("7", "message_deleted", """{"chat_id":5,"message_id":1}""");
        // A member is checked in depth, as in Kotlin, Python and Swift: scopes {} misses
        // previous and new, so AuditDetailsBot gives way to the next member that fits.
        var emptyScopes = Event("8", "bot_token_updated", """{"actor_id":12,"bot_id":7,"webhook_id":31,"scopes":{}}""");
        // Scopes without new: AuditDetailsBotTokenUpdated gives way too.
        var scopesWithoutNew = Event("9", "bot_token_updated",
            """{"token_kind":"bot","token_name":null,"resource_owner_id":7,"current_scopes":[],"bot_id":7,"actor_id":12,"access_token_id":4827,"access_token_preview":null,"webhook_id":31,"scopes":{"previous":[]}}""");
        // A nested model that is not a value union: a device without platform.
        var deviceWithoutPlatform = Event("10", "login_grant_approved", """{"login_grant_id":"g1","device":{"name":"iPhone"}}""");
        var loginGrantApproved = Event("11", "login_grant_approved", """{"login_grant_id":"g1","device":{"name":"iPhone","platform":"iOS"}}""");
        var page = "{\"data\":[" + string.Join(",", oldBotTokenUpdated, botTokenUpdated, chatJoin, accessTokenCreated, botTokenScopesUpdated, oldBotTokenCreated, chatAndMessage,
            emptyScopes, scopesWithoutNew, deviceWithoutPlatform, loginGrantApproved) +
            """],"meta":{"paginate":{"next_page":"eyJpZCI6M30"}}}""";

        using var http = new HttpClient(new CannedHandler((HttpStatusCode.OK, page)));
        var client = new PachcaClient("https://pachca.test", http);
        var events = (await client.Security.GetAuditEventsAsync()).Data;

        Check(events.Count == 11, $"the page keeps every record, got {events.Count}");
        Check(
            events[0].Details is AuditDetailsBot { AccessTokenId: 4827, Scopes: { StringList: null, AuditDetailsTokenScopesChange: { Previous: ["messages:read"], New: ["messages:read", "chats:read"] } } },
            $"an old bot_token_updated decodes into AuditDetailsBot with scopes as an object, got {events[0].Details}");
        Check(events[1].Details is AuditDetailsBotTokenUpdated { TokenName: null, ActorId: null }, $"required fields that hold null decode, got {events[1].Details}");
        Check(events[2].Details is AuditDetailsChatId { ChatId: 5 }, $"a plain record decodes as before, got {events[2].Details}");
        Check(events[3].Details is AuditDetailsToken { Scopes: ["messages:read"] }, $"a token record decodes as a token, got {events[3].Details}");
        Check(events[4].Details is AuditDetailsBotTokenUpdated { CurrentScopes: ["messages:read", "chats:read"] }, $"a change of the bot token scopes decodes as bot_token_updated, got {events[4].Details}");
        Check(
            events[5].Details is AuditDetailsBot { Scopes: { StringList: ["messages:read", "chats:read"], AuditDetailsTokenScopesChange: null } },
            $"an old bot_token_created decodes into AuditDetailsBot with scopes as a list, got {events[5].Details}");
        Check(events[6].Details is AuditDetailsChatId { ChatId: 5 }, $"a member that misses a required key gives way, got {events[6].Details}");
        Check(events[7].Details is AuditDetailsEmpty, $"scopes {{}} misses previous and new: AuditDetailsBot gives way, got {events[7].Details}");
        Check(events[8].Details is not AuditDetailsBotTokenUpdated, $"scopes without new: AuditDetailsBotTokenUpdated gives way, got {events[8].Details}");
        Check(events[9].Details is AuditDetailsLoginGrantCreated, $"a device without platform gives way, got {events[9].Details}");
        Check(
            events[10].Details is AuditDetailsLoginGrantApproved approved && approved.Device.Platform == AuditLoginGrantDevicePlatform.IOS,
            $"a full device decodes into AuditDetailsLoginGrantApproved, got {events[10].Details}");
        // A model decoded on its own stays as lenient as System.Text.Json: only a union
        // that picks a member checks the keys in depth.
        var lenient = System.Text.Json.JsonSerializer.Deserialize<AuditDetailsBot>("""{"bot_id":7,"scopes":{}}""");
        Check(lenient is { Scopes.AuditDetailsTokenScopesChange.New: null }, $"scopes {{}} decodes into an empty change on its own, got {lenient?.Scopes}");
        var written = System.Text.Json.JsonSerializer.Serialize((AuditDetailsBot)events[0].Details);
        Check(written.Contains("\"scopes\":{\"previous\":[\"messages:read\"],\"new\":[\"messages:read\",\"chats:read\"]}"), $"scopes goes back out as an object, got {written}");
        Console.WriteLine("audit details ok");
    }

    private static void Check(bool condition, string message)
    {
        if (condition) return;
        Console.Error.WriteLine($"audit details failed: {message}");
        Environment.Exit(1);
    }
}
