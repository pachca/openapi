#nullable enable

using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Pachca.Sdk;

public class FileUploadRequest
{
    [JsonPropertyName("content-disposition")]
    public string ContentDisposition { get; set; } = default!;
    [JsonPropertyName("acl")]
    public string Acl { get; set; } = default!;
    [JsonPropertyName("policy")]
    public string Policy { get; set; } = default!;
    [JsonPropertyName("x-amz-credential")]
    public string XAmzCredential { get; set; } = default!;
    [JsonPropertyName("x-amz-algorithm")]
    public string XAmzAlgorithm { get; set; } = default!;
    [JsonPropertyName("x-amz-date")]
    public string XAmzDate { get; set; } = default!;
    [JsonPropertyName("x-amz-signature")]
    public string XAmzSignature { get; set; } = default!;
    [JsonPropertyName("key")]
    public string Key { get; set; } = default!;
    [JsonIgnore]
    public byte[] File { get; set; } = Array.Empty<byte>();
}

public class UploadParams
{
    [JsonPropertyName("Content-Disposition")]
    public string ContentDisposition { get; set; } = default!;
    [JsonPropertyName("acl")]
    public string Acl { get; set; } = default!;
    [JsonPropertyName("policy")]
    public string Policy { get; set; } = default!;
    [JsonPropertyName("x-amz-credential")]
    public string XAmzCredential { get; set; } = default!;
    [JsonPropertyName("x-amz-algorithm")]
    public string XAmzAlgorithm { get; set; } = default!;
    [JsonPropertyName("x-amz-date")]
    public string XAmzDate { get; set; } = default!;
    [JsonPropertyName("x-amz-signature")]
    public string XAmzSignature { get; set; } = default!;
    [JsonPropertyName("key")]
    public string Key { get; set; } = default!;
    [JsonPropertyName("direct_url")]
    public string DirectUrl { get; set; } = default!;
}

public class OAuthError : Exception
{
    [JsonPropertyName("error")]
    public string? Error { get; set; }

    public override string Message => Error ?? "oauth error";
}

public class UploadParamsDataWrapper
{
    [JsonPropertyName("data")]
    public UploadParams Data { get; set; } = default!;
}
