import { ItemPatchRequest, Item, ApiError } from "./types";
import { deserialize, serialize, fetchWithRetry } from "./utils";

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
      body: JSON.stringify(serialize(request)),
    });
    const body = await response.json();
    switch (response.status) {
      case 200:
        return deserialize(body.data) as Item;
      default:
        throw new ApiError(body.errors);
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

  static stub(items: ItemsService = new ItemsService()): PachcaClient {
    const client = Object.create(PachcaClient.prototype);
    client.items = items;
    return client;
  }
}
