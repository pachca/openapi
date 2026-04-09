import {
  SearchMessagesParams,
  SearchMessagesResponse,
  MessageSearchResult,
  OAuthError,
} from "./types";
import { deserialize, fetchWithRetry } from "./utils";

export class SearchService {
  async searchMessages(params: SearchMessagesParams): Promise<SearchMessagesResponse> {
    throw new Error("Search.searchMessages is not implemented");
  }

  async searchMessagesAll(params: Omit<SearchMessagesParams, 'cursor'>): Promise<MessageSearchResult[]> {
    throw new Error("Search.searchMessagesAll is not implemented");
  }
}

export class SearchServiceImpl extends SearchService {
  constructor(
    private baseUrl: string,
    private headers: Record<string, string>,
  ) {
    super();
  }

  async searchMessages(params: SearchMessagesParams): Promise<SearchMessagesResponse> {
    const query = new URLSearchParams();
    query.set("query", params.query);
    if (params?.chatIds !== undefined) {
      params.chatIds.forEach((v) => query.append("chat_ids[]", String(v)));
    }
    if (params?.userIds !== undefined) {
      params.userIds.forEach((v) => query.append("user_ids[]", String(v)));
    }
    if (params?.createdFrom !== undefined) query.set("created_from", params.createdFrom);
    if (params?.createdTo !== undefined) query.set("created_to", params.createdTo);
    if (params?.sort !== undefined) query.set("sort", params.sort);
    if (params?.limit !== undefined) query.set("limit", String(params.limit));
    if (params?.cursor !== undefined) query.set("cursor", params.cursor);
    const response = await fetchWithRetry(`${this.baseUrl}/search/messages?${query}`, {
      headers: this.headers,
    });
    const body = await response.json();
    switch (response.status) {
      case 200:
        return deserialize(body) as SearchMessagesResponse;
      case 401:
        throw new OAuthError(body.error);
      default:
        throw new Error(`HTTP ${response.status}: ${JSON.stringify(body)}`);
    }
  }

  async searchMessagesAll(params: Omit<SearchMessagesParams, 'cursor'>): Promise<MessageSearchResult[]> {
    const items: MessageSearchResult[] = [];
    let cursor: string | undefined;
    do {
      const response = await this.searchMessages({ ...params, cursor } as SearchMessagesParams);
      items.push(...response.data);
      if (response.data.length === 0) break;
      cursor = response.meta.paginate.nextPage;
    } while (true);
    return items;
  }
}

export const PACHCA_API_URL = "https://api.pachca.com/api/shared/v1";

export class PachcaClient {
  readonly search: SearchService;

  constructor(token: string, baseUrl?: string);
  constructor(config: { headers: Record<string, string>; baseUrl?: string; search?: SearchService });
  constructor(tokenOrConfig: string | { headers: Record<string, string>; baseUrl?: string; search?: SearchService }, baseUrl?: string) {
    let resolvedHeaders: Record<string, string>;
    let resolvedBaseUrl: string;
    if (typeof tokenOrConfig === 'string') {
      resolvedHeaders = { Authorization: `Bearer ${tokenOrConfig}` };
      resolvedBaseUrl = baseUrl ?? PACHCA_API_URL;
      this.search = new SearchServiceImpl(resolvedBaseUrl, resolvedHeaders);
    } else {
      resolvedHeaders = tokenOrConfig.headers;
      resolvedBaseUrl = tokenOrConfig.baseUrl ?? PACHCA_API_URL;
      this.search = tokenOrConfig.search ?? new SearchServiceImpl(resolvedBaseUrl, resolvedHeaders);
    }
  }

  static stub(search: SearchService = new SearchService()): PachcaClient {
    const client = Object.create(PachcaClient.prototype);
    client.search = search;
    return client;
  }
}
