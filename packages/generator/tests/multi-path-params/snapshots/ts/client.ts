import { Task, TaskUpdateRequest } from "./types";
import { deserialize, serialize, fetchWithRetry } from "./utils";

export class TasksService {
  async getTask(projectId: number, taskId: number): Promise<Task> {
    throw new Error("Tasks.getTask is not implemented");
  }

  async updateTask(projectId: number, taskId: number, request: TaskUpdateRequest): Promise<Task> {
    throw new Error("Tasks.updateTask is not implemented");
  }

  async deleteComment(projectId: number, taskId: number, commentId: number): Promise<void> {
    throw new Error("Tasks.deleteComment is not implemented");
  }
}

export class TasksServiceImpl extends TasksService {
  constructor(
    private baseUrl: string,
    private headers: Record<string, string>,
  ) {
    super();
  }

  async getTask(projectId: number, taskId: number): Promise<Task> {
    const response = await fetchWithRetry(`${this.baseUrl}/projects/${projectId}/tasks/${taskId}`, {
      headers: this.headers,
    });
    const body = await response.json();
    switch (response.status) {
      case 200:
        return deserialize(body.data) as Task;
      default:
        throw new Error(`HTTP ${response.status}: ${JSON.stringify(body)}`);
    }
  }

  async updateTask(projectId: number, taskId: number, request: TaskUpdateRequest): Promise<Task> {
    const response = await fetchWithRetry(`${this.baseUrl}/projects/${projectId}/tasks/${taskId}`, {
      method: "PUT",
      headers: { ...this.headers, "Content-Type": "application/json" },
      body: JSON.stringify(serialize(request)),
    });
    const body = await response.json();
    switch (response.status) {
      case 200:
        return deserialize(body.data) as Task;
      default:
        throw new Error(`HTTP ${response.status}: ${JSON.stringify(body)}`);
    }
  }

  async deleteComment(projectId: number, taskId: number, commentId: number): Promise<void> {
    const response = await fetchWithRetry(`${this.baseUrl}/projects/${projectId}/tasks/${taskId}/comments/${commentId}`, {
      method: "DELETE",
      headers: this.headers,
    });
    switch (response.status) {
      case 204:
        return;
      default:
        throw new Error(`HTTP ${response.status}`);
    }
  }
}

export const PACHCA_API_URL = "https://api.example.com/v1";

export class PachcaClient {
  readonly tasks: TasksService;

  constructor(token: string, baseUrl?: string);
  constructor(config: { headers: Record<string, string>; baseUrl?: string; tasks?: TasksService });
  constructor(tokenOrConfig: string | { headers: Record<string, string>; baseUrl?: string; tasks?: TasksService }, baseUrl?: string) {
    let resolvedHeaders: Record<string, string>;
    let resolvedBaseUrl: string;
    if (typeof tokenOrConfig === 'string') {
      resolvedHeaders = { Authorization: `Bearer ${tokenOrConfig}` };
      resolvedBaseUrl = baseUrl ?? PACHCA_API_URL;
      this.tasks = new TasksServiceImpl(resolvedBaseUrl, resolvedHeaders);
    } else {
      resolvedHeaders = tokenOrConfig.headers;
      resolvedBaseUrl = tokenOrConfig.baseUrl ?? PACHCA_API_URL;
      this.tasks = tokenOrConfig.tasks ?? new TasksServiceImpl(resolvedBaseUrl, resolvedHeaders);
    }
  }

  static stub(tasks: TasksService = new TasksService()): PachcaClient {
    const client = Object.create(PachcaClient.prototype);
    client.tasks = tasks;
    return client;
  }
}
