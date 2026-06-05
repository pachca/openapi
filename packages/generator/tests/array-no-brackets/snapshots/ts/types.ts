export interface MessageResult {
  id: number;
  content: string;
}

export interface PaginationMeta {
  paginate: {
    nextPage: string;
  };
}

export class OAuthError extends Error {
  error?: string;
  constructor(error?: string) {
    super(error);
    this.error = error;
  }
}

export interface SearchMessagesParams {
  query: string;
  chatIds: number[];
  userIds?: number[];
  limit?: number;
  cursor?: string;
}

export interface SearchMessagesResponse {
  data: MessageResult[];
  meta: PaginationMeta;
}
