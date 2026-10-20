#nullable enable

using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Pachca.Sdk;

[JsonConverter(typeof(SortOrderConverter))]
public readonly struct SortOrder : IEquatable<SortOrder>
{
    private readonly string? _value;

    public SortOrder(string value) => _value = value ?? throw new ArgumentNullException(nameof(value));

    public static SortOrder Asc { get; } = new("asc");
    public static SortOrder Desc { get; } = new("desc");

    /// <summary>Every value this SDK version lists</summary>
    public static IReadOnlyList<SortOrder> Values { get; } = Array.AsReadOnly(new[] { Asc, Desc });

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

    public static bool operator ==(SortOrder left, SortOrder right) => left.Equals(right);
    public static bool operator !=(SortOrder left, SortOrder right) => !left.Equals(right);
    public static implicit operator SortOrder(string value) => new(value);
    public bool Equals(SortOrder other) => string.Equals(Value, other.Value, StringComparison.Ordinal);
    public override bool Equals(object? obj) => obj is SortOrder other && Equals(other);
    public override int GetHashCode() => StringComparer.Ordinal.GetHashCode(Value);
    public override string ToString() => Value;
}

internal class SortOrderConverter : JsonConverter<SortOrder>
{
    public override SortOrder Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options) =>
        new(reader.GetString() ?? "");

    public override void Write(Utf8JsonWriter writer, SortOrder value, JsonSerializerOptions options) =>
        writer.WriteStringValue(value.Value);
}

/// <summary>Роль пользователя</summary>
[JsonConverter(typeof(UserRoleConverter))]
public readonly struct UserRole : IEquatable<UserRole>
{
    private readonly string? _value;

    public UserRole(string value) => _value = value ?? throw new ArgumentNullException(nameof(value));

    /// <summary>Администратор</summary>
    public static UserRole Admin { get; } = new("admin");
    /// <summary>Сотрудник</summary>
    public static UserRole User { get; } = new("user");
    /// <summary>Мультиадмин</summary>
    public static UserRole MultiAdmin { get; } = new("multi_admin");
    /// <summary>Бот</summary>
    public static UserRole Bot { get; } = new("bot");

    /// <summary>Every value this SDK version lists</summary>
    public static IReadOnlyList<UserRole> Values { get; } = Array.AsReadOnly(new[] { Admin, User, MultiAdmin, Bot });

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

    public static bool operator ==(UserRole left, UserRole right) => left.Equals(right);
    public static bool operator !=(UserRole left, UserRole right) => !left.Equals(right);
    public static implicit operator UserRole(string value) => new(value);
    public bool Equals(UserRole other) => string.Equals(Value, other.Value, StringComparison.Ordinal);
    public override bool Equals(object? obj) => obj is UserRole other && Equals(other);
    public override int GetHashCode() => StringComparer.Ordinal.GetHashCode(Value);
    public override string ToString() => Value;
}

internal class UserRoleConverter : JsonConverter<UserRole>
{
    public override UserRole Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options) =>
        new(reader.GetString() ?? "");

    public override void Write(Utf8JsonWriter writer, UserRole value, JsonSerializerOptions options) =>
        writer.WriteStringValue(value.Value);
}

[JsonConverter(typeof(ViewBlockHeaderTypeConverter))]
public readonly struct ViewBlockHeaderType : IEquatable<ViewBlockHeaderType>
{
    private readonly string? _value;

    public ViewBlockHeaderType(string value) => _value = value ?? throw new ArgumentNullException(nameof(value));

    /// <summary>Для заголовков всегда header</summary>
    public static ViewBlockHeaderType Header { get; } = new("header");

    /// <summary>Every value this SDK version lists</summary>
    public static IReadOnlyList<ViewBlockHeaderType> Values { get; } = Array.AsReadOnly(new[] { Header });

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

    public static bool operator ==(ViewBlockHeaderType left, ViewBlockHeaderType right) => left.Equals(right);
    public static bool operator !=(ViewBlockHeaderType left, ViewBlockHeaderType right) => !left.Equals(right);
    public static implicit operator ViewBlockHeaderType(string value) => new(value);
    public bool Equals(ViewBlockHeaderType other) => string.Equals(Value, other.Value, StringComparison.Ordinal);
    public override bool Equals(object? obj) => obj is ViewBlockHeaderType other && Equals(other);
    public override int GetHashCode() => StringComparer.Ordinal.GetHashCode(Value);
    public override string ToString() => Value;
}

internal class ViewBlockHeaderTypeConverter : JsonConverter<ViewBlockHeaderType>
{
    public override ViewBlockHeaderType Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options) =>
        new(reader.GetString() ?? "");

    public override void Write(Utf8JsonWriter writer, ViewBlockHeaderType value, JsonSerializerOptions options) =>
        writer.WriteStringValue(value.Value);
}
