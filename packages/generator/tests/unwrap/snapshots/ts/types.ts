export interface AddMembersRequest {
  memberIds: number[];
}

export interface ChatCreateRequest {
  chat: {
    name: string;
    channel?: boolean;
    public?: boolean;
    memberIds?: number[];
  };
}

export interface Chat {
  id: number;
  name: string;
  isChannel: boolean;
  isPublic: boolean;
  createdAt: string;
}

export interface ApiErrorItem {
  key?: string;
  value?: string;
}

export class ApiError extends Error {
  errors?: ApiErrorItem[];
  /** HTTP status code of the response. An answer with an empty body or one that is not JSON comes with `errors` empty. */
  status?: number;
  constructor(errors?: ApiErrorItem[], status?: number) {
    super(errors?.length ? errors.map((e) => `${e.key}: ${e.value}`).join(", ") : status !== undefined ? `HTTP ${status}` : "");
    this.errors = errors;
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
