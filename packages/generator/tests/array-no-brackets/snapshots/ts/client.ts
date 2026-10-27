import {
  SearchMessagesParams,
  SearchMessagesResponse,
  MessageResult,
  OAuthError,
} from "./types.js";
import { deserialize, deserializeType, fetchWithRetry } from "./utils.js";

/** The body of an error answer, or undefined when it is empty or not JSON (a 404 without a body, a proxy page). */
async function errorBody(response: Response): Promise<any> {
  try {
    return JSON.parse(await response.text());
  } catch {
    return undefined;
  }
}

export class SearchService {
  async searchMessages(params: SearchMessagesParams): Promise<SearchMessagesResponse> {
    throw new Error("Search.searchMessages is not implemented");
  }

  async searchMessagesAll(params: Omit<SearchMessagesParams, 'cursor'>): Promise<MessageResult[]> {
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
    if (params.chatIds !== undefined) {
      params.chatIds.forEach((v) => query.append("chat_ids[]", String(v)));
    }
    if (params?.userIds !== undefined) {
      params.userIds.forEach((v) => query.append("user_ids", String(v)));
    }
    if (params?.limit !== undefined) query.set("limit", String(params.limit));
    if (params?.cursor !== undefined) query.set("cursor", params.cursor);
    const response = await fetchWithRetry(`${this.baseUrl}/search/messages?${query}`, {
      headers: this.headers,
    });
    switch (response.status) {
      case 200: {
        const body = await response.json();
        return deserialize(body) as SearchMessagesResponse;
      }
      case 401: {
        const body = await errorBody(response);
        throw typeof body?.error === "string" ? new OAuthError(body.error) : new Error(`HTTP ${response.status}`);
      }
      default:
        throw new Error(`HTTP ${response.status}`);
    }
  }

  async searchMessagesAll(params: Omit<SearchMessagesParams, 'cursor'>): Promise<MessageResult[]> {
    const items: MessageResult[] = [];
    let cursor: string | undefined;
    let hasNext = true;
    while (hasNext) {
      const response = await this.searchMessages({ ...params, cursor } as SearchMessagesParams);
      items.push(...response.data);
      if (response.data.length === 0) break;
      cursor = response.meta.paginate.nextPage;
      hasNext = response.meta.paginate.hasNext ?? true;
    }
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

  static stub(overrides: { search?: SearchService } = {}): PachcaClient {
    const client = Object.create(PachcaClient.prototype);
    client.search = overrides.search ?? new SearchService();
    return client;
  }
}
