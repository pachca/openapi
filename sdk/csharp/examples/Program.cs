using Pachca.Sdk.Examples;

var example = args.Length > 0 ? args[0].ToLowerInvariant() : "main";

return example switch
{
    "main" => await MainExample.RunAsync(),
    "upload" => await UploadExample.RunAsync(),
    _ => PrintUsage()
};

static int PrintUsage()
{
    Console.WriteLine("Usage: dotnet run -- <example>");
    Console.WriteLine();
    Console.WriteLine("Examples:");
    Console.WriteLine("  main    - Echo bot (create, read, react, thread, pin, update, unpin)");
    Console.WriteLine("  upload  - File upload (requires PACHCA_FILE_PATH)");
    Console.WriteLine();
    Console.WriteLine("Environment variables:");
    Console.WriteLine("  PACHCA_TOKEN    - API token (required)");
    Console.WriteLine("  PACHCA_CHAT_ID  - Chat ID (required)");
    Console.WriteLine("  PACHCA_FILE_PATH - File path (upload only)");
    return 1;
}
