export enum SearchSort {
  /** По релевантности */
  Relevance = "relevance",
  /** По дате */
  Date = "date",
}

export interface MessageSearchResult {
  id: number;
  chatId: number;
  userId: number;
  content: string;
  createdAt: string;
}

export interface SearchPaginationMeta {
  total: number;
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
  chatIds?: number[];
  userIds?: number[];
  createdFrom?: string;
  createdTo?: string;
  sort?: SearchSort;
  limit?: number;
  cursor?: string;
}

export interface SearchMessagesResponse {
  data: MessageSearchResult[];
  meta: SearchPaginationMeta;
}
