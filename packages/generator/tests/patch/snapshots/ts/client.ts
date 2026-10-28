import { ItemPatchRequest, Item, ApiError } from "./types.js";
import { deserialize, deserializeType, serializeType, fetchWithRetry } from "./utils.js";

/** The body of an error answer, or undefined when it is empty or not JSON (a 404 without a body, a proxy page). */
async function errorBody(response: Response): Promise<any> {
  try {
    return JSON.parse(await response.text());
  } catch {
    return undefined;
  }
}

/**
 * An empty body or one that is not JSON gives an ApiError with no errors. The status code stays in `status`.
 */
async function errorFromResponse(response: Response): Promise<Error> {
  const body = await errorBody(response);
  return new ApiError(Array.isArray(body?.errors) ? body.errors : [], response.status);
}

export class ItemsService {
  async patchItem(id: number, request: ItemPatchRequest): Promise<Item> {
    throw new Error("Items.patchItem is not implemented");
  }
}

export class ItemsServiceImpl extends ItemsService {
  constructor(
    private baseUrl: string,
    private headers: Record<string, string>,
  ) {
    super();
  }

  async patchItem(id: number, request: ItemPatchRequest): Promise<Item> {
    const response = await fetchWithRetry(`${this.baseUrl}/items/${id}`, {
      method: "PATCH",
      headers: { ...this.headers, "Content-Type": "application/json" },
      body: JSON.stringify(serializeType("ItemPatchRequest", request)),
    });
    switch (response.status) {
      case 200: {
        const body = await response.json();
        return deserializeType("Item", body.data) as Item;
      }
      default:
        throw await errorFromResponse(response);
    }
  }
}

export const PACHCA_API_URL = "https://api.example.com/v1";

export class PachcaClient {
  readonly items: ItemsService;

  constructor(token: string, baseUrl?: string);
  constructor(config: { headers: Record<string, string>; baseUrl?: string; items?: ItemsService });
  constructor(tokenOrConfig: string | { headers: Record<string, string>; baseUrl?: string; items?: ItemsService }, baseUrl?: string) {
    let resolvedHeaders: Record<string, string>;
    let resolvedBaseUrl: string;
    if (typeof tokenOrConfig === 'string') {
      resolvedHeaders = { Authorization: `Bearer ${tokenOrConfig}` };
      resolvedBaseUrl = baseUrl ?? PACHCA_API_URL;
      this.items = new ItemsServiceImpl(resolvedBaseUrl, resolvedHeaders);
    } else {
      resolvedHeaders = tokenOrConfig.headers;
      resolvedBaseUrl = tokenOrConfig.baseUrl ?? PACHCA_API_URL;
      this.items = tokenOrConfig.items ?? new ItemsServiceImpl(resolvedBaseUrl, resolvedHeaders);
    }
  }

  static stub(overrides: { items?: ItemsService } = {}): PachcaClient {
    const client = Object.create(PachcaClient.prototype);
    client.items = overrides.items ?? new ItemsService();
    return client;
  }
}
