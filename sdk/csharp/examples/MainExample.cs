/**
 * Echo bot example demonstrating the Pachca C# SDK.
 *
 * Runs 8 steps that exercise the core API patterns:
 * create, read, nested resource, idempotent POST, thread reply, pin, update, unpin.
 *
 * Usage:
 *
 *   PACHCA_TOKEN=your_token PACHCA_CHAT_ID=12345 dotnet run -- main
 */

namespace Pachca.Sdk.Examples;

public static class MainExample
{
    public static async Task<int> RunAsync()
    {
        var token = Environment.GetEnvironmentVariable("PACHCA_TOKEN")
            ?? throw new InvalidOperationException("Set PACHCA_TOKEN environment variable");
        var chatId = int.Parse(
            Environment.GetEnvironmentVariable("PACHCA_CHAT_ID")
            ?? throw new InvalidOperationException("Set PACHCA_CHAT_ID environment variable"));

        using var client = new PachcaClient(token);

        // -- Step 0: GET -- Fetch chat (verifies datetime deserialization)
        Console.WriteLine("0. Fetching chat...");
        var chat = await client.Chats.GetChatAsync(chatId);
        Console.WriteLine($"   Chat: {chat.Name}, createdAt={chat.CreatedAt} ({chat.CreatedAt.GetType().Name}), lastMessageAt={chat.LastMessageAt} ({chat.LastMessageAt.GetType().Name})");

        // -- Step 1: POST -- Create a message
        Console.WriteLine("1. Creating message...");
        var created = await client.Messages.CreateMessageAsync(new MessageCreateRequest
        {
            Message = new MessageCreateRequestMessage
            {
                EntityId = chatId,
                Content = "SDK test C# \ud83d\ude80",
            }
        });
        var msgId = created.Id;
        Console.WriteLine($"   Created message ID: {msgId}");

        // -- Step 2: GET -- Read the message back
        Console.WriteLine("2. Reading message...");
        var msg = await client.Messages.GetMessageAsync(msgId);
        Console.WriteLine($"   Got message: \"{msg.Content}\"");

        // -- Step 3: POST -- Add a reaction (nested resource)
        Console.WriteLine("3. Adding reaction...");
        await client.Reactions.AddReactionAsync(msgId, new ReactionRequest { Code = "\ud83d\udc40" });
        Console.WriteLine("   Added reaction \ud83d\udc40");

        // -- Step 4: POST -- Create a thread (idempotent)
        Console.WriteLine("4. Creating thread...");
        var thread = await client.Threads.CreateThreadAsync(msgId);
        Console.WriteLine($"   Thread ID: {thread.Id}");

        // -- Step 5: POST -- Reply inside the thread
        Console.WriteLine("5. Replying in thread...");
        var reply = await client.Messages.CreateMessageAsync(new MessageCreateRequest
        {
            Message = new MessageCreateRequestMessage
            {
                EntityType = MessageEntityType.Thread,
                EntityId = (int)thread.Id,
                Content = $"Echo: {msg.Content}",
            }
        });
        var replyId = reply.Id;
        Console.WriteLine($"   Reply ID: {replyId}");

        // -- Step 6: POST -- Pin the original message
        Console.WriteLine("6. Pinning message...");
        await client.Messages.PinMessageAsync(msgId);
        Console.WriteLine("   Pinned");

        // -- Step 7: PUT -- Edit the reply
        Console.WriteLine("7. Updating reply...");
        await client.Messages.UpdateMessageAsync(replyId, new MessageUpdateRequest
        {
            Message = new MessageUpdateRequestMessage
            {
                Content = $"{reply.Content} (processed at {DateTimeOffset.UtcNow})",
            }
        });
        Console.WriteLine("   Updated");

        // -- Step 8: DELETE -- Unpin the original message
        Console.WriteLine("8. Unpinning message...");
        await client.Messages.UnpinMessageAsync(msgId);
        Console.WriteLine("   Unpinned");

        Console.WriteLine("\nDone! All 8 steps completed.");
        return 0;
    }
}
