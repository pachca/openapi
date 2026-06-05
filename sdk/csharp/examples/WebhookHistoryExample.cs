/**
 * Webhook history example — fetch recent webhook deliveries and inspect payload variants.
 *
 * Usage:
 *
 *   PACHCA_TOKEN=your_token dotnet run -- webhook-history
 */

namespace Pachca.Sdk.Examples;

public static class WebhookHistoryExample
{
    public static async Task<int> RunAsync()
    {
        var token = Environment.GetEnvironmentVariable("PACHCA_TOKEN")
            ?? throw new InvalidOperationException("Set PACHCA_TOKEN environment variable");

        var client = new PachcaClient(token);
        var response = await client.Bots.GetWebhookEventsAsync(limit: 5);

        Console.WriteLine($"Fetched {response.Data.Count} webhook events");
        for (var index = 0; index < response.Data.Count; index++)
        {
            var @event = response.Data[index];
            Console.WriteLine($"{index + 1}. id={@event.Id} created_at={@event.CreatedAt:O} payload={SummarizePayload(@event.Payload)}");
        }

        Console.WriteLine($"has_next={response.Meta.Paginate.HasNext} next_page=\"{response.Meta.Paginate.NextPage}\"");
        return 0;
    }

    private static string SummarizePayload(WebhookPayloadUnion payload) => payload switch
    {
        LinkSharedWebhookPayload linkShared => $"link_shared message_id={linkShared.MessageId} links={linkShared.Links.Count} user_id={linkShared.UserId}",
        MessageWebhookPayload message => $"message event={message.Event} id={message.Id} chat_id={message.ChatId}",
        ReactionWebhookPayload reaction => $"reaction event={reaction.Event} message_id={reaction.MessageId} code={reaction.Code}",
        ButtonWebhookPayload button => $"button message_id={button.MessageId} user_id={button.UserId}",
        ViewSubmitWebhookPayload view => $"view user_id={view.UserId} fields={view.Data.Count}",
        ChatMemberWebhookPayload member => $"chat_member event={member.Event} chat_id={member.ChatId} users={member.UserIds.Count}",
        CompanyMemberWebhookPayload member => $"company_member event={member.Event} users={member.UserIds.Count}",
        _ => $"unknown type={payload.GetType().Name}",
    };
}
