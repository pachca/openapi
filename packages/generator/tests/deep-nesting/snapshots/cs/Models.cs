#nullable enable

using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Pachca.Sdk;

public class OrganizationSettingsNotificationsEmail
{
    [JsonPropertyName("enabled")]
    public bool Enabled { get; set; } = default!;
    [JsonPropertyName("frequency")]
    public string? Frequency { get; set; }
}

public class OrganizationSettingsNotificationsPush
{
    [JsonPropertyName("enabled")]
    public bool? Enabled { get; set; }
    [JsonPropertyName("sound")]
    public string? Sound { get; set; }
}

public class OrganizationSettingsNotifications
{
    [JsonPropertyName("email")]
    public OrganizationSettingsNotificationsEmail Email { get; set; } = default!;
    [JsonPropertyName("push")]
    public OrganizationSettingsNotificationsPush? Push { get; set; }
}

public class OrganizationSettings
{
    [JsonPropertyName("theme")]
    public string? Theme { get; set; }
    [JsonPropertyName("notifications")]
    public OrganizationSettingsNotifications Notifications { get; set; } = default!;
}

public class Organization
{
    [JsonPropertyName("id")]
    public int Id { get; set; } = default!;
    [JsonPropertyName("name")]
    public string Name { get; set; } = default!;
    [JsonPropertyName("settings")]
    public OrganizationSettings Settings { get; set; } = default!;
}
