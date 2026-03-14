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
  constructor(errors?: ApiErrorItem[]) {
    super(errors?.map((e) => `${e.key}: ${e.value}`).join(", "));
    this.errors = errors;
  }
}

export class OAuthError extends Error {
  error?: string;
  constructor(error?: string) {
    super(error);
    this.error = error;
  }
}
