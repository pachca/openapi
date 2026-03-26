#nullable enable

using System;
using System.Collections.Generic;
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

/// <summary>Роль пользователя</summary>
[JsonConverter(typeof(UserRoleConverter))]
public enum UserRole
{
    /// <summary>Администратор</summary>
    Admin,
    /// <summary>Сотрудник</summary>
    User,
    /// <summary>Мультиадмин</summary>
    MultiAdmin,
    /// <summary>Бот</summary>
    Bot,
}

internal class UserRoleConverter : JsonConverter<UserRole>
{
    public override UserRole Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        var value = reader.GetString();
        return value switch
        {
            "admin" => UserRole.Admin,
            "user" => UserRole.User,
            "multi_admin" => UserRole.MultiAdmin,
            "bot" => UserRole.Bot,
            _ => throw new JsonException($"Unknown UserRole value: {value}"),
        };
    }

    public override void Write(Utf8JsonWriter writer, UserRole value, JsonSerializerOptions options)
    {
        var str = value switch
        {
            UserRole.Admin => "admin",
            UserRole.User => "user",
            UserRole.MultiAdmin => "multi_admin",
            UserRole.Bot => "bot",
            _ => value.ToString(),
        };
        writer.WriteStringValue(str);
    }
}

[JsonConverter(typeof(ViewBlockHeaderTypeConverter))]
public enum ViewBlockHeaderType
{
    /// <summary>Для заголовков всегда header</summary>
    Header,
}

internal class ViewBlockHeaderTypeConverter : JsonConverter<ViewBlockHeaderType>
{
    public override ViewBlockHeaderType Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        var value = reader.GetString();
        return value switch
        {
            "header" => ViewBlockHeaderType.Header,
            _ => throw new JsonException($"Unknown ViewBlockHeaderType value: {value}"),
        };
    }

    public override void Write(Utf8JsonWriter writer, ViewBlockHeaderType value, JsonSerializerOptions options)
    {
        var str = value switch
        {
            ViewBlockHeaderType.Header => "header",
            _ => value.ToString(),
        };
        writer.WriteStringValue(str);
    }
}
