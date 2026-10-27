#nullable enable

using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Pachca.Sdk;

[JsonConverter(typeof(SortOrderConverter))]
public enum SortOrder
{
    Asc,
    Desc,
}

internal class SortOrderConverter : JsonConverter<SortOrder>
{
    public override SortOrder Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        var value = reader.GetString();
        return value switch
        {
            "asc" => SortOrder.Asc,
            "desc" => SortOrder.Desc,
            _ => throw new JsonException($"Unknown SortOrder value: {value}"),
        };
    }

    public override void Write(Utf8JsonWriter writer, SortOrder value, JsonSerializerOptions options)
    {
        var str = value switch
        {
            SortOrder.Asc => "asc",
            SortOrder.Desc => "desc",
            _ => value.ToString(),
        };
        writer.WriteStringValue(str);
    }
}

[JsonConverter(typeof(MemberKindConverter))]
public enum MemberKind
{
    Regular,
    Guest,
    Value,
}

internal class MemberKindConverter : JsonConverter<MemberKind>
{
    public override MemberKind Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        var value = reader.GetString();
        return value switch
        {
            "regular" => MemberKind.Regular,
            "guest" => MemberKind.Guest,
            "value" => MemberKind.Value,
            _ => throw new JsonException($"Unknown MemberKind value: {value}"),
        };
    }

    public override void Write(Utf8JsonWriter writer, MemberKind value, JsonSerializerOptions options)
    {
        var str = value switch
        {
            MemberKind.Regular => "regular",
            MemberKind.Guest => "guest",
            MemberKind.Value => "value",
            _ => value.ToString(),
        };
        writer.WriteStringValue(str);
    }
}

/// <summary>Member role</summary>
[JsonConverter(typeof(MemberRoleConverter))]
public readonly struct MemberRole : IEquatable<MemberRole>
{
    private readonly string? _value;

    public MemberRole(string value) => _value = value ?? throw new ArgumentNullException(nameof(value));

    /// <summary>Administrator</summary>
    public static MemberRole Admin { get; } = new("admin");
    /// <summary>Member</summary>
    public static MemberRole User { get; } = new("user");

    /// <summary>Every value this SDK version lists</summary>
    public static IReadOnlyList<MemberRole> Values { get; } = Array.AsReadOnly(new[] { Admin, User });

    /// <summary>The value as it travels in JSON</summary>
    public string Value => _value ?? "";

    /// <summary>Whether this SDK version lists the value</summary>
    public bool IsKnown
    {
        get
        {
            foreach (var known in Values)
                if (Equals(known)) return true;
            return false;
        }
    }

    public static bool operator ==(MemberRole left, MemberRole right) => left.Equals(right);
    public static bool operator !=(MemberRole left, MemberRole right) => !left.Equals(right);
    public static implicit operator MemberRole(string value) => new(value);
    public bool Equals(MemberRole other) => string.Equals(Value, other.Value, StringComparison.Ordinal);
    public override bool Equals(object? obj) => obj is MemberRole other && Equals(other);
    public override int GetHashCode() => StringComparer.Ordinal.GetHashCode(Value);
    public override string ToString() => Value;
}

internal class MemberRoleConverter : JsonConverter<MemberRole>
{
    public override MemberRole Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options) =>
        new(reader.GetString() ?? "");

    public override void Write(Utf8JsonWriter writer, MemberRole value, JsonSerializerOptions options) =>
        writer.WriteStringValue(value.Value);
}

[JsonConverter(typeof(RegionConverter))]
public readonly struct Region : IEquatable<Region>
{
    private readonly string? _value;

    public Region(string value) => _value = value ?? throw new ArgumentNullException(nameof(value));

    public static Region Eu { get; } = new("eu");
    public static Region Us { get; } = new("us");

    /// <summary>Every value this SDK version lists</summary>
    public static IReadOnlyList<Region> Values { get; } = Array.AsReadOnly(new[] { Eu, Us });

    /// <summary>The value as it travels in JSON</summary>
    public string Value => _value ?? "";

    /// <summary>Whether this SDK version lists the value</summary>
    public bool IsKnown
    {
        get
        {
            foreach (var known in Values)
                if (Equals(known)) return true;
            return false;
        }
    }

    public static bool operator ==(Region left, Region right) => left.Equals(right);
    public static bool operator !=(Region left, Region right) => !left.Equals(right);
    public static implicit operator Region(string value) => new(value);
    public bool Equals(Region other) => string.Equals(Value, other.Value, StringComparison.Ordinal);
    public override bool Equals(object? obj) => obj is Region other && Equals(other);
    public override int GetHashCode() => StringComparer.Ordinal.GetHashCode(Value);
    public override string ToString() => Value;
}

internal class RegionConverter : JsonConverter<Region>
{
    public override Region Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options) =>
        new(reader.GetString() ?? "");

    public override void Write(Utf8JsonWriter writer, Region value, JsonSerializerOptions options) =>
        writer.WriteStringValue(value.Value);
}

[JsonConverter(typeof(MemberStatusConverter))]
public readonly struct MemberStatus : IEquatable<MemberStatus>
{
    private readonly string? _value;

    public MemberStatus(string value) => _value = value ?? throw new ArgumentNullException(nameof(value));

    public static MemberStatus Active { get; } = new("active");
    public static MemberStatus Suspended { get; } = new("suspended");
    public static MemberStatus Unknown { get; } = new("unknown");

    /// <summary>Every value this SDK version lists</summary>
    public static IReadOnlyList<MemberStatus> Values { get; } = Array.AsReadOnly(new[] { Active, Suspended, Unknown });

    /// <summary>The value as it travels in JSON</summary>
    public string Value => _value ?? "";

    /// <summary>Whether this SDK version lists the value</summary>
    public bool IsKnown
    {
        get
        {
            foreach (var known in Values)
                if (Equals(known)) return true;
            return false;
        }
    }

    public static bool operator ==(MemberStatus left, MemberStatus right) => left.Equals(right);
    public static bool operator !=(MemberStatus left, MemberStatus right) => !left.Equals(right);
    public static implicit operator MemberStatus(string value) => new(value);
    public bool Equals(MemberStatus other) => string.Equals(Value, other.Value, StringComparison.Ordinal);
    public override bool Equals(object? obj) => obj is MemberStatus other && Equals(other);
    public override int GetHashCode() => StringComparer.Ordinal.GetHashCode(Value);
    public override string ToString() => Value;
}

internal class MemberStatusConverter : JsonConverter<MemberStatus>
{
    public override MemberStatus Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options) =>
        new(reader.GetString() ?? "");

    public override void Write(Utf8JsonWriter writer, MemberStatus value, JsonSerializerOptions options) =>
        writer.WriteStringValue(value.Value);
}

[JsonConverter(typeof(ErrorCodeConverter))]
public readonly struct ErrorCode : IEquatable<ErrorCode>
{
    private readonly string? _value;

    public ErrorCode(string value) => _value = value ?? throw new ArgumentNullException(nameof(value));

    public static ErrorCode Blank { get; } = new("blank");
    public static ErrorCode Taken { get; } = new("taken");

    /// <summary>Every value this SDK version lists</summary>
    public static IReadOnlyList<ErrorCode> Values { get; } = Array.AsReadOnly(new[] { Blank, Taken });

    /// <summary>The value as it travels in JSON</summary>
    public string Value => _value ?? "";

    /// <summary>Whether this SDK version lists the value</summary>
    public bool IsKnown
    {
        get
        {
            foreach (var known in Values)
                if (Equals(known)) return true;
            return false;
        }
    }

    public static bool operator ==(ErrorCode left, ErrorCode right) => left.Equals(right);
    public static bool operator !=(ErrorCode left, ErrorCode right) => !left.Equals(right);
    public static implicit operator ErrorCode(string value) => new(value);
    public bool Equals(ErrorCode other) => string.Equals(Value, other.Value, StringComparison.Ordinal);
    public override bool Equals(object? obj) => obj is ErrorCode other && Equals(other);
    public override int GetHashCode() => StringComparer.Ordinal.GetHashCode(Value);
    public override string ToString() => Value;
}

internal class ErrorCodeConverter : JsonConverter<ErrorCode>
{
    public override ErrorCode Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options) =>
        new(reader.GetString() ?? "");

    public override void Write(Utf8JsonWriter writer, ErrorCode value, JsonSerializerOptions options) =>
        writer.WriteStringValue(value.Value);
}

/// <summary>OAuth error code</summary>
[JsonConverter(typeof(OAuthErrorCodeConverter))]
public readonly struct OAuthErrorCode : IEquatable<OAuthErrorCode>
{
    private readonly string? _value;

    public OAuthErrorCode(string value) => _value = value ?? throw new ArgumentNullException(nameof(value));

    /// <summary>The token is missing or revoked</summary>
    public static OAuthErrorCode InvalidToken { get; } = new("invalid_token");
    /// <summary>The token lacks the scope</summary>
    public static OAuthErrorCode InsufficientScope { get; } = new("insufficient_scope");

    /// <summary>Every value this SDK version lists</summary>
    public static IReadOnlyList<OAuthErrorCode> Values { get; } = Array.AsReadOnly(new[] { InvalidToken, InsufficientScope });

    /// <summary>The value as it travels in JSON</summary>
    public string Value => _value ?? "";

    /// <summary>Whether this SDK version lists the value</summary>
    public bool IsKnown
    {
        get
        {
            foreach (var known in Values)
                if (Equals(known)) return true;
            return false;
        }
    }

    public static bool operator ==(OAuthErrorCode left, OAuthErrorCode right) => left.Equals(right);
    public static bool operator !=(OAuthErrorCode left, OAuthErrorCode right) => !left.Equals(right);
    public static implicit operator OAuthErrorCode(string value) => new(value);
    public bool Equals(OAuthErrorCode other) => string.Equals(Value, other.Value, StringComparison.Ordinal);
    public override bool Equals(object? obj) => obj is OAuthErrorCode other && Equals(other);
    public override int GetHashCode() => StringComparer.Ordinal.GetHashCode(Value);
    public override string ToString() => Value;
}

internal class OAuthErrorCodeConverter : JsonConverter<OAuthErrorCode>
{
    public override OAuthErrorCode Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options) =>
        new(reader.GetString() ?? "");

    public override void Write(Utf8JsonWriter writer, OAuthErrorCode value, JsonSerializerOptions options) =>
        writer.WriteStringValue(value.Value);
}

[JsonConverter(typeof(PayloadKindConverter))]
public readonly struct PayloadKind : IEquatable<PayloadKind>
{
    private readonly string? _value;

    public PayloadKind(string value) => _value = value ?? throw new ArgumentNullException(nameof(value));

    public static PayloadKind Created { get; } = new("created");
    public static PayloadKind ValueMember { get; } = new("value");

    /// <summary>Every value this SDK version lists</summary>
    public static IReadOnlyList<PayloadKind> Values { get; } = Array.AsReadOnly(new[] { Created, ValueMember });

    /// <summary>The value as it travels in JSON</summary>
    public string Value => _value ?? "";

    /// <summary>Whether this SDK version lists the value</summary>
    public bool IsKnown
    {
        get
        {
            foreach (var known in Values)
                if (Equals(known)) return true;
            return false;
        }
    }

    public static bool operator ==(PayloadKind left, PayloadKind right) => left.Equals(right);
    public static bool operator !=(PayloadKind left, PayloadKind right) => !left.Equals(right);
    public static implicit operator PayloadKind(string value) => new(value);
    public bool Equals(PayloadKind other) => string.Equals(Value, other.Value, StringComparison.Ordinal);
    public override bool Equals(object? obj) => obj is PayloadKind other && Equals(other);
    public override int GetHashCode() => StringComparer.Ordinal.GetHashCode(Value);
    public override string ToString() => Value;
}

internal class PayloadKindConverter : JsonConverter<PayloadKind>
{
    public override PayloadKind Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options) =>
        new(reader.GetString() ?? "");

    public override void Write(Utf8JsonWriter writer, PayloadKind value, JsonSerializerOptions options) =>
        writer.WriteStringValue(value.Value);
}

public class Member
{
    [JsonPropertyName("id")]
    public int Id { get; set; } = default!;
    [JsonPropertyName("role")]
    public MemberRole Role { get; set; } = default!;
    [JsonPropertyName("status")]
    public MemberStatus Status { get; set; } = default!;
    [JsonPropertyName("previous_statuses")]
    public List<MemberStatus>? PreviousStatuses { get; set; }
}

public class MemberUpdateRequest
{
    [JsonPropertyName("role")]
    public MemberRole? Role { get; set; }
    [JsonPropertyName("kind")]
    public MemberKind? Kind { get; set; }
}

public class MemberEventPayload
{
    [JsonPropertyName("kind")]
    public PayloadKind Kind { get; set; } = default!;
}

public class ApiErrorItem
{
    [JsonPropertyName("key")]
    public string Key { get; set; } = default!;
    [JsonPropertyName("message")]
    public string Message { get; set; } = default!;
    [JsonPropertyName("code")]
    public ErrorCode Code { get; set; } = default!;
}

public class ApiError : Exception
{
    [JsonPropertyName("errors")]
    public List<ApiErrorItem> Errors { get; set; } = default!;

    /// <summary>HTTP status code of the answer, set by the client. An empty body or one that is not JSON leaves Errors empty.</summary>
    [JsonIgnore]
    public int? StatusCode { get; set; }
}

public class OAuthError : Exception
{
    [JsonPropertyName("error")]
    public OAuthErrorCode Error { get; set; } = default!;
    [JsonPropertyName("error_description")]
    public string ErrorDescription { get; set; } = default!;

    public override string Message => string.IsNullOrEmpty(Error.Value) ? "oauth error" : Error.Value;
}

public class ListMembersResponse
{
    [JsonPropertyName("data")]
    public List<Member> Data { get; set; } = new();
}

public class MemberDataWrapper
{
    [JsonPropertyName("data")]
    public Member Data { get; set; } = default!;
}
