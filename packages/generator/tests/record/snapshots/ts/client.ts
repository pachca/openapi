import { LinkPreviewsRequest, OAuthError, ApiError } from "./types";
import { serialize, fetchWithRetry } from "./utils";

export class LinkPreviewsService {
  async createLinkPreviews(id: number, request: LinkPreviewsRequest): Promise<void> {
    throw new Error("Link Previews.createLinkPreviews is not implemented");
  }
}

export class LinkPreviewsServiceImpl extends LinkPreviewsService {
  constructor(
    private baseUrl: string,
    private headers: Record<string, string>,
  ) {
    super();
  }

  async createLinkPreviews(id: number, request: LinkPreviewsRequest): Promise<void> {
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

export const PACHCA_API_URL = "https://api.pachca.com/api/shared/v1";

export class PachcaClient {
  readonly linkPreviews: LinkPreviewsService;

  constructor(token: string, baseUrl?: string);
  constructor(config: { headers: Record<string, string>; baseUrl?: string; linkPreviews?: LinkPreviewsService });
  constructor(tokenOrConfig: string | { headers: Record<string, string>; baseUrl?: string; linkPreviews?: LinkPreviewsService }, baseUrl?: string) {
    let resolvedHeaders: Record<string, string>;
    let resolvedBaseUrl: string;
    if (typeof tokenOrConfig === 'string') {
      resolvedHeaders = { Authorization: `Bearer ${tokenOrConfig}` };
      resolvedBaseUrl = baseUrl ?? PACHCA_API_URL;
      this.linkPreviews = new LinkPreviewsServiceImpl(resolvedBaseUrl, resolvedHeaders);
    } else {
      resolvedHeaders = tokenOrConfig.headers;
      resolvedBaseUrl = tokenOrConfig.baseUrl ?? PACHCA_API_URL;
      this.linkPreviews = tokenOrConfig.linkPreviews ?? new LinkPreviewsServiceImpl(resolvedBaseUrl, resolvedHeaders);
    }
  }

  static stub(linkPreviews: LinkPreviewsService = new LinkPreviewsService()): PachcaClient {
    const client = Object.create(PachcaClient.prototype);
    client.linkPreviews = linkPreviews;
    return client;
  }
}
