import { ItemPatchRequest, Item, ApiError } from "./types";
import { deserialize, serialize } from "./utils";

class ItemsService {
  constructor(
    private baseUrl: string,
    private headers: Record<string, string>,
  ) {}

  async patchItem(id: number, request: ItemPatchRequest): Promise<Item> {
    const response = await fetch(`${this.baseUrl}/items/${id}`, {
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

export class PachcaClient {
  readonly items: ItemsService;

  constructor(token: string, baseUrl: string = "https://api.example.com/v1") {
    const headers = { Authorization: `Bearer ${token}` };
    this.items = new ItemsService(baseUrl, headers);
  }
}
