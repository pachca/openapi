export interface ChatCreateRequest {
  chat: {
    name: string;
    memberIds?: number[];
  };
}

export interface ChatUpdateRequest {
  chat: {
    name?: string;
    public?: boolean;
  };
}

export interface ChatUpdateMeta {
  changedFields: string[];
}

export interface Chat {
  id: number;
  name: string;
  createdAt: string;
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

export class OAuthError extends Error {
  error?: string;
  constructor(error?: string) {
    super(error);
    this.error = error;
  }
}

export interface CreateChatResponseMeta {
  notFoundMemberIds: number[];
}

export interface CreateChatResponse {
  data: Chat;
  meta: CreateChatResponseMeta;
}

export interface UpdateChatResponse {
  data: Chat;
  meta?: ChatUpdateMeta;
}
