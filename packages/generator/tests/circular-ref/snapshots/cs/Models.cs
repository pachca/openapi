#nullable enable

using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Pachca.Sdk;

public class Category
{
    [JsonPropertyName("id")]
    public int Id { get; set; } = default!;
    [JsonPropertyName("name")]
    public string Name { get; set; } = default!;
    [JsonPropertyName("parent")]
    public Category? Parent { get; set; }
    [JsonPropertyName("children")]
    public List<Category>? Children { get; set; }
}

public class TreeNode
{
    [JsonPropertyName("value")]
    public string Value { get; set; } = default!;
    [JsonPropertyName("left")]
    public TreeNode? Left { get; set; }
    [JsonPropertyName("right")]
    public TreeNode? Right { get; set; }
}
