#nullable enable

using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Pachca.Sdk;

public class Address
{
    [JsonPropertyName("city")]
    public string City { get; set; } = default!;
    [JsonPropertyName("zip")]
    public string? Zip { get; set; }
}

public class Person
{
    [JsonPropertyName("id")]
    public int Id { get; set; } = default!;
    [JsonPropertyName("name")]
    public string Name { get; set; } = default!;
    [JsonPropertyName("home_address")]
    public Address? HomeAddress { get; set; }
    [JsonPropertyName("work_address")]
    public Address? WorkAddress { get; set; }
}
