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
  errors?: ApiErrorItem[];
  constructor(errors?: ApiErrorItem[]) {
    super(errors?.map((e) => `${e.key}: ${e.value}`).join(", "));
    this.errors = errors;
  }
}
