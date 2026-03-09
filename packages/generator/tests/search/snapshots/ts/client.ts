import {
  SearchMessagesParams,
  SearchMessagesResponse,
  MessageSearchResult,
  OAuthError,
} from "./types";
import { deserialize } from "./utils";

class SearchService {
  constructor(
    private baseUrl: string,
    private headers: Record<string, string>,
  ) {}

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
    const response = await fetch(`${this.baseUrl}/search/messages?${query}`, {
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
      cursor = response.meta?.paginate?.nextPage;
    } while (cursor);
    return items;
  }
}

export class PachcaClient {
  readonly search: SearchService;

  constructor(token: string, baseUrl: string = "https://api.pachca.com/api/shared/v1") {
    const headers = { Authorization: `Bearer ${token}` };
    this.search = new SearchService(baseUrl, headers);
  }
}
