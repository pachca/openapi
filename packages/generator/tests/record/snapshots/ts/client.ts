import { LinkPreviewsRequest, OAuthError, ApiError } from "./types";
import { serialize, fetchWithRetry } from "./utils";

export abstract class LinkPreviewsService {
  async createLinkPreviews(id: number, request: LinkPreviewsRequest): Promise<void> {
    throw new Error("Link Previews.createLinkPreviews is not implemented");
  }
}

export class LinkPreviewsServiceImpl extends LinkPreviewsService {
  constructor(
    private baseUrl: string,
    private headers: Record<string, string>,
  ) {}

  override async createLinkPreviews(id: number, request: LinkPreviewsRequest): Promise<void> {
    const response = await fetchWithRetry(`${this.baseUrl}/messages/${id}/link_previews`, {
      method: "POST",
      headers: { ...this.headers, "Content-Type": "application/json" },
      body: JSON.stringify(serialize(request)),
    });
    switch (response.status) {
      case 201:
        return;
      case 401:
        throw new OAuthError(((await response.json()) as any).error);
      default:
        throw new ApiError(((await response.json()) as any).errors);
    }
  }
}

export interface PachcaServices {
  linkPreviews?: LinkPreviewsService;
}

export class PachcaClient {
  readonly linkPreviews: LinkPreviewsService;

  constructor(token: string, baseUrl: string = "https://api.pachca.com/api/shared/v1", services: PachcaServices = {}) {
    const headers = { Authorization: `Bearer ${token}` };
    this.linkPreviews = services.linkPreviews ?? new LinkPreviewsServiceImpl(baseUrl, headers);
  }
}
