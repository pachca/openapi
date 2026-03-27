import { Task, TaskUpdateRequest } from "./types";
import { deserialize, serialize, fetchWithRetry } from "./utils";

export abstract class TasksService {
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
  ) {}

  override async getTask(projectId: number, taskId: number): Promise<Task> {
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

  override async updateTask(projectId: number, taskId: number, request: TaskUpdateRequest): Promise<Task> {
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

  override async deleteComment(projectId: number, taskId: number, commentId: number): Promise<void> {
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

export interface PachcaServices {
  tasks?: TasksService;
}

export class PachcaClient {
  readonly tasks: TasksService;

  constructor(token: string, baseUrl: string = "https://api.example.com/v1", services: PachcaServices = {}) {
    const headers = { Authorization: `Bearer ${token}` };
    this.tasks = services.tasks ?? new TasksServiceImpl(baseUrl, headers);
  }
}
