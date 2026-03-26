/**
 * File upload example demonstrating the Pachca C# SDK.
 *
 * Uploads a local file and sends it as a message attachment.
 *
 * Usage:
 *
 *   PACHCA_TOKEN=your_token PACHCA_CHAT_ID=12345 PACHCA_FILE_PATH=./photo.png dotnet run
 */

using Pachca.Sdk;

var token = Environment.GetEnvironmentVariable("PACHCA_TOKEN")
    ?? throw new InvalidOperationException("Set PACHCA_TOKEN environment variable");
var chatId = int.Parse(
    Environment.GetEnvironmentVariable("PACHCA_CHAT_ID")
    ?? throw new InvalidOperationException("Set PACHCA_CHAT_ID environment variable"));
var filePath = Environment.GetEnvironmentVariable("PACHCA_FILE_PATH")
    ?? throw new InvalidOperationException("Set PACHCA_FILE_PATH environment variable");

var fileName = Path.GetFileName(filePath);

using var client = new PachcaClient(token);

// -- Step 1: Read the local file
Console.WriteLine($"1. Reading file: {filePath}");
var fileBytes = await File.ReadAllBytesAsync(filePath);
var fileSize = fileBytes.Length;
Console.WriteLine($"   Size: {fileSize} bytes");

// -- Step 2: Get upload params
Console.WriteLine("2. Getting upload params...");
var uploadParams = await client.Common.GetUploadParamsAsync();
var key = uploadParams.Key.Replace("${filename}", fileName);
Console.WriteLine($"   Got direct_url: {uploadParams.DirectUrl}");

// -- Step 3: Upload the file via SDK
Console.WriteLine("3. Uploading file...");
await client.Common.UploadFileAsync(
    uploadParams.DirectUrl,
    new FileUploadRequest
    {
        ContentDisposition = uploadParams.ContentDisposition,
        Acl = uploadParams.Acl,
        Policy = uploadParams.Policy,
        XAmzCredential = uploadParams.XAmzCredential,
        XAmzAlgorithm = uploadParams.XAmzAlgorithm,
        XAmzDate = uploadParams.XAmzDate,
        XAmzSignature = uploadParams.XAmzSignature,
        Key = key,
        File = fileBytes,
    });
Console.WriteLine($"   Uploaded, key: {key}");

// -- Step 4: Send message with the file attached
Console.WriteLine("4. Sending message with attachment...");
var msg = await client.Messages.CreateMessageAsync(new MessageCreateRequest
{
    Message = new MessageCreateRequestMessage
    {
        EntityId = chatId,
        Content = $"File upload test: {fileName} \ud83d\ude80",
        Files = new List<MessageCreateRequestFile>
        {
            new()
            {
                Key = key,
                Name = fileName,
                FileType = FileType.File,
                Size = fileSize,
            }
        },
    }
});
Console.WriteLine($"   Message ID: {msg.Id}");

Console.WriteLine("\nDone! File uploaded and sent.");
