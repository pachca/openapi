/**
 * Stub client example — unit-testing with dependency injection.
 *
 * Demonstrates PachcaClient.Stub() with a custom MessagesService override.
 *
 * Usage:
 *
 *   dotnet run -- stub
 */

namespace Pachca.Sdk.Examples;

public static class StubExample
{
    private class FakeMessages : MessagesService
    {
        public override System.Threading.Tasks.Task<Message> GetMessageAsync(int id, CancellationToken cancellationToken = default)
        {
            return System.Threading.Tasks.Task.FromResult(new Message
            {
                Id = 1,
                Content = "fake message",
            });
        }
    }

    public static async System.Threading.Tasks.Task<int> RunAsync()
    {
        using var client = PachcaClient.Stub(messages: new FakeMessages());

        var msg = await client.Messages.GetMessageAsync(1);
        Console.WriteLine($"Got: \"{msg.Content}\" (id={msg.Id})");

        return 0;
    }
}
