export enum SortOrder {
  Asc = "asc",
  Desc = "desc",
}

export enum ChatAvailability {
  /** Чаты, где пользователь является участником */
  IsMember = "is_member",
  /** Все открытые чаты компании */
  Public = "public",
}

export interface Chat {
  id: number;
  name: string;
  isChannel: boolean;
  isPublic: boolean;
  createdAt: string;
  memberIds?: number[];
}

export interface ChatCreateRequest {
  chat: {
    name: string;
    channel?: boolean;
    public?: boolean;
    memberIds?: number[];
  };
}

export interface ChatUpdateRequest {
  chat: {
    name?: string;
    public?: boolean;
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

export class OAuthError extends Error {
  error?: string;
  constructor(error?: string) {
    super(error);
    this.error = error;
  }
}

export interface PaginationMeta {
  paginate?: {
    nextPage?: string;
  };
}

export interface ListChatsParams {
  availability?: ChatAvailability;
  limit?: number;
  cursor?: string;
  sortField?: string;
  sortOrder?: SortOrder;
}

export interface ListChatsResponse {
  data: Chat[];
  meta?: PaginationMeta;
}
