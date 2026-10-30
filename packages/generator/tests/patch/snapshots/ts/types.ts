export interface Item {
  id: number;
  name: string;
  description?: string | null;
  priority?: number;
}

export interface ItemPatchRequest {
  item: {
    name?: string;
    description?: string | null;
    priority?: number;
  };
}

export interface ApiErrorItem {
  key?: string;
  value?: string;
}

export class ApiError extends Error {
  errors: ApiErrorItem[];
  /** HTTP status code of the response. An answer with an empty body or one that is not JSON comes with `errors` empty. */
  status?: number;
  constructor(errors: ApiErrorItem[] = [], status?: number) {
    const list = errors ?? [];
    super(list.length ? list.map((e) => `${e.key}: ${e.value}`).join(", ") : status !== undefined ? `HTTP ${status}` : "");
    this.errors = list;
    this.status = status;
  }
}
