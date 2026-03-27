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

export interface PachcaClientOptions {
  token: string;
  baseUrl?: string;
  linkPreviews?: LinkPreviewsService;
}

export class PachcaClient {
  readonly linkPreviews: LinkPreviewsService;

  constructor(options: PachcaClientOptions) {
    const { token } = options;
    const baseUrl = options.baseUrl ?? "https://api.pachca.com/api/shared/v1";
    const headers = { Authorization: `Bearer ${token}` };
    this.linkPreviews = options.linkPreviews ?? new LinkPreviewsServiceImpl(baseUrl, headers);
  }

  static stub(options: Partial<PachcaClientOptions> = {}): PachcaClient {
    return new PachcaClient({ token: options.token ?? "", baseUrl: options.baseUrl ?? "https://api.pachca.com/api/shared/v1",
      linkPreviews: options.linkPreviews ?? new LinkPreviewsService(),
    });
  }
}
