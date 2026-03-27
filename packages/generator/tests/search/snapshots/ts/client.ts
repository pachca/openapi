import {
  SearchMessagesParams,
  SearchMessagesResponse,
  MessageSearchResult,
  OAuthError,
} from "./types";
import { deserialize, fetchWithRetry } from "./utils";

export abstract class SearchService {
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
  ) {}

  override async searchMessages(params: SearchMessagesParams): Promise<SearchMessagesResponse> {
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

  override async searchMessagesAll(params: Omit<SearchMessagesParams, 'cursor'>): Promise<MessageSearchResult[]> {
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

export interface PachcaServices {
  search?: SearchService;
}

export class PachcaClient {
  readonly search: SearchService;

  constructor(token: string, baseUrl: string = "https://api.pachca.com/api/shared/v1", services: PachcaServices = {}) {
    const headers = { Authorization: `Bearer ${token}` };
    this.search = services.search ?? new SearchServiceImpl(baseUrl, headers);
  }
}
