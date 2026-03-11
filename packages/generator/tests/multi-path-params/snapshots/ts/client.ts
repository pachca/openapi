import { Task, TaskUpdateRequest } from "./types";
import { deserialize, serialize, fetchWithRetry } from "./utils";

class TasksService {
  constructor(
    private baseUrl: string,
    private headers: Record<string, string>,
  ) {}

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

export class PachcaClient {
  readonly tasks: TasksService;

  constructor(token: string, baseUrl: string = "https://api.example.com/v1") {
    const headers = { Authorization: `Bearer ${token}` };
    this.tasks = new TasksService(baseUrl, headers);
  }
}
