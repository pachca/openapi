export interface Task {
  id: number;
  title: string;
  isDone?: boolean;
}

export interface TaskUpdateRequest {
  task: {
    title?: string;
    isDone?: boolean;
  };
}
