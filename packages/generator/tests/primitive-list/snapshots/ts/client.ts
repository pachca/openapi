import {
  ListReadMembersParams,
  ListReadMembersResponse,
  OAuthError,
  ApiError,
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

/**
 * An error body is either `{ errors: [...] }` or the OAuth form `{ error, error_description }`,
 * which also comes with 400 and 403 (`insufficient_scope`, `invalid_grant`). The body decides the class.
 * An empty body or one that is not JSON gives an ApiError with no errors. The status code stays in `status`.
 */
async function errorFromResponse(response: Response): Promise<Error> {
  const body = await errorBody(response);
  if (body && typeof body.error === "string" && body.errors === undefined) return new OAuthError(body.error);
  return new ApiError(Array.isArray(body?.errors) ? body.errors : [], response.status);
}

export class ReadMembersService {
  async listReadMembers(id: number, params?: ListReadMembersParams): Promise<ListReadMembersResponse> {
    throw new Error("Read members.listReadMembers is not implemented");
  }

  async listReadMembersAll(id: number, params?: Omit<ListReadMembersParams, 'cursor'>): Promise<number[]> {
    throw new Error("Read members.listReadMembersAll is not implemented");
  }
}

export class ReadMembersServiceImpl extends ReadMembersService {
  constructor(
    private baseUrl: string,
    private headers: Record<string, string>,
  ) {
    super();
  }

  async listReadMembers(id: number, params?: ListReadMembersParams): Promise<ListReadMembersResponse> {
    const query = new URLSearchParams();
    if (params?.limit !== undefined) query.set("limit", String(params.limit));
    if (params?.cursor !== undefined) query.set("cursor", params.cursor);
    const url = `${this.baseUrl}/messages/${id}/read_member_ids${query.toString() ? `?${query}` : ""}`;
    const response = await fetchWithRetry(url, {
      headers: this.headers,
    });
    switch (response.status) {
      case 200: {
        const body = await response.json();
        return deserialize(body) as ListReadMembersResponse;
      }
      default:
        throw await errorFromResponse(response);
    }
  }

  async listReadMembersAll(id: number, params?: Omit<ListReadMembersParams, 'cursor'>): Promise<number[]> {
    const items: number[] = [];
    let cursor: string | undefined;
    do {
      const response = await this.listReadMembers(id, { ...params, cursor } as ListReadMembersParams);
      items.push(...response.data);
      if (response.data.length === 0) break;
      cursor = response.meta.paginate.nextPage;
    } while (true);
    return items;
  }
}

export const PACHCA_API_URL = "https://api.pachca.com/api/shared/v1";

export class PachcaClient {
  readonly readMembers: ReadMembersService;

  constructor(token: string, baseUrl?: string);
  constructor(config: { headers: Record<string, string>; baseUrl?: string; readMembers?: ReadMembersService });
  constructor(tokenOrConfig: string | { headers: Record<string, string>; baseUrl?: string; readMembers?: ReadMembersService }, baseUrl?: string) {
    let resolvedHeaders: Record<string, string>;
    let resolvedBaseUrl: string;
    if (typeof tokenOrConfig === 'string') {
      resolvedHeaders = { Authorization: `Bearer ${tokenOrConfig}` };
      resolvedBaseUrl = baseUrl ?? PACHCA_API_URL;
      this.readMembers = new ReadMembersServiceImpl(resolvedBaseUrl, resolvedHeaders);
    } else {
      resolvedHeaders = tokenOrConfig.headers;
      resolvedBaseUrl = tokenOrConfig.baseUrl ?? PACHCA_API_URL;
      this.readMembers = tokenOrConfig.readMembers ?? new ReadMembersServiceImpl(resolvedBaseUrl, resolvedHeaders);
    }
  }

  static stub(overrides: { readMembers?: ReadMembersService } = {}): PachcaClient {
    const client = Object.create(PachcaClient.prototype);
    client.readMembers = overrides.readMembers ?? new ReadMembersService();
    return client;
  }
}
