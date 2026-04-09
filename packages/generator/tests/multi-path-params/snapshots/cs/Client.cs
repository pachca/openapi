#nullable enable

using System;
using System.Collections.Generic;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Threading;

namespace Pachca.Sdk;

public class TasksService
{

    public virtual async System.Threading.Tasks.Task<Pachca.Sdk.Task> GetTaskAsync(
        int projectId,
        int taskId,
        CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException("Tasks.getTask is not implemented");
    }

    public virtual async System.Threading.Tasks.Task<Pachca.Sdk.Task> UpdateTaskAsync(
        int projectId,
        int taskId,
        TaskUpdateRequest request,
        CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException("Tasks.updateTask is not implemented");
    }

    public virtual async System.Threading.Tasks.Task DeleteCommentAsync(
        int projectId,
        int taskId,
        int commentId,
        CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException("Tasks.deleteComment is not implemented");
    }
}

public sealed class TasksServiceImpl : TasksService
{
    private readonly string _baseUrl;
    private readonly HttpClient _client;

    internal TasksServiceImpl(string baseUrl, HttpClient client)
    {
        _baseUrl = baseUrl;
        _client = client;
    }

    public override async System.Threading.Tasks.Task<Pachca.Sdk.Task> GetTaskAsync(
        int projectId,
        int taskId,
        CancellationToken cancellationToken = default)
    {
        var url = $"{_baseUrl}/projects/{projectId}/tasks/{taskId}";
        using var request = new HttpRequestMessage(HttpMethod.Get, url);
        using var response = await PachcaUtils.SendWithRetryAsync(_client, request, cancellationToken).ConfigureAwait(false);
        var json = await response.Content.ReadAsStringAsync(cancellationToken).ConfigureAwait(false);
        switch ((int)response.StatusCode)
        {
            case 200:
                return PachcaUtils.Deserialize<Pachca.Sdk.TaskDataWrapper>(json).Data;
            default:
                throw new InvalidOperationException($"Unexpected status code: {(int)response.StatusCode}");
        }
    }

    public override async System.Threading.Tasks.Task<Pachca.Sdk.Task> UpdateTaskAsync(
        int projectId,
        int taskId,
        TaskUpdateRequest request,
        CancellationToken cancellationToken = default)
    {
        var url = $"{_baseUrl}/projects/{projectId}/tasks/{taskId}";
        using var httpRequest = new HttpRequestMessage(HttpMethod.Put, url);
        httpRequest.Content = new StringContent(PachcaUtils.Serialize(request), Encoding.UTF8, "application/json");
        using var response = await PachcaUtils.SendWithRetryAsync(_client, httpRequest, cancellationToken).ConfigureAwait(false);
        var json = await response.Content.ReadAsStringAsync(cancellationToken).ConfigureAwait(false);
        switch ((int)response.StatusCode)
        {
            case 200:
                return PachcaUtils.Deserialize<Pachca.Sdk.TaskDataWrapper>(json).Data;
            default:
                throw new InvalidOperationException($"Unexpected status code: {(int)response.StatusCode}");
        }
    }

    public override async System.Threading.Tasks.Task DeleteCommentAsync(
        int projectId,
        int taskId,
        int commentId,
        CancellationToken cancellationToken = default)
    {
        var url = $"{_baseUrl}/projects/{projectId}/tasks/{taskId}/comments/{commentId}";
        using var request = new HttpRequestMessage(HttpMethod.Delete, url);
        using var response = await PachcaUtils.SendWithRetryAsync(_client, request, cancellationToken).ConfigureAwait(false);
        var json = await response.Content.ReadAsStringAsync(cancellationToken).ConfigureAwait(false);
        switch ((int)response.StatusCode)
        {
            case 204:
                return;
            default:
                throw new InvalidOperationException($"Unexpected status code: {(int)response.StatusCode}");
        }
    }
}

public static class PachcaConstants
{
    public const string PachcaApiUrl = "https://api.example.com/v1";
}

public sealed class PachcaClient : IDisposable
{
    private readonly HttpClient? _client;

    public TasksService Tasks { get; }

    private PachcaClient(TasksService tasks)
    {
        Tasks = tasks;
    }

    public PachcaClient(string token, string baseUrl = PachcaConstants.PachcaApiUrl, TasksService? tasks = null)
    {
        _client = new HttpClient();
        _client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", token);

        Tasks = tasks ?? new TasksServiceImpl(baseUrl, _client);
    }

    public PachcaClient(string baseUrl, HttpClient client, TasksService? tasks = null)
    {
        _client = client;

        Tasks = tasks ?? new TasksServiceImpl(baseUrl, _client);
    }

    public static PachcaClient Stub(TasksService? tasks = null)
    {
        return new PachcaClient(tasks ?? new TasksService());
    }

    public void Dispose()
    {
        _client?.Dispose();
        GC.SuppressFinalize(this);
    }
}
