import {
  ListEventsParams,
  ListEventsResponse,
  OAuthError,
  ExportRequest,
  Export,
} from "./types.js";
import { deserialize, deserializeType, serializeType, fetchWithRetry } from "./utils.js";

/** The body of an error answer, or undefined when it is empty or not JSON (a 404 without a body, a proxy page). */
async function errorBody(response: Response): Promise<any> {
  try {
    return JSON.parse(await response.text());
  } catch {
    return undefined;
  }
}

export class ExportService {
  async listEvents(params: ListEventsParams): Promise<ListEventsResponse> {
    throw new Error("Export.listEvents is not implemented");
  }

  async createExport(request: ExportRequest): Promise<Export> {
    throw new Error("Export.createExport is not implemented");
  }
}

export class ExportServiceImpl extends ExportService {
  constructor(
    private baseUrl: string,
    private headers: Record<string, string>,
  ) {
    super();
  }

  async listEvents(params: ListEventsParams): Promise<ListEventsResponse> {
    const query = new URLSearchParams();
    query.set("date_from", params.dateFrom);
    if (params?.dateTo !== undefined) query.set("date_to", params.dateTo);
    if (params?.createdAfter !== undefined) query.set("created_after", params.createdAfter);
    if (params?.limit !== undefined) query.set("limit", String(params.limit));
    const response = await fetchWithRetry(`${this.baseUrl}/events?${query}`, {
      headers: this.headers,
    });
    switch (response.status) {
      case 200: {
        const body = await response.json();
        return deserialize(body) as ListEventsResponse;
      }
      default:
        throw new Error(`HTTP ${response.status}`);
    }
  }

  async createExport(request: ExportRequest): Promise<Export> {
    const response = await fetchWithRetry(`${this.baseUrl}/exports`, {
      method: "POST",
      headers: { ...this.headers, "Content-Type": "application/json" },
      body: JSON.stringify(serializeType("ExportRequest", request)),
    });
    switch (response.status) {
      case 201: {
        const body = await response.json();
        return deserializeType("Export", body.data) as Export;
      }
      case 401: {
        const body = await errorBody(response);
        throw typeof body?.error === "string" ? new OAuthError(body.error) : new Error(`HTTP ${response.status}`);
      }
      default:
        throw new Error(`HTTP ${response.status}`);
    }
  }
}

export const PACHCA_API_URL = "https://api.pachca.com/api/shared/v1";

export class PachcaClient {
  readonly export: ExportService;

  constructor(token: string, baseUrl?: string);
  constructor(config: { headers: Record<string, string>; baseUrl?: string; export?: ExportService });
  constructor(tokenOrConfig: string | { headers: Record<string, string>; baseUrl?: string; export?: ExportService }, baseUrl?: string) {
    let resolvedHeaders: Record<string, string>;
    let resolvedBaseUrl: string;
    if (typeof tokenOrConfig === 'string') {
      resolvedHeaders = { Authorization: `Bearer ${tokenOrConfig}` };
      resolvedBaseUrl = baseUrl ?? PACHCA_API_URL;
      this.export = new ExportServiceImpl(resolvedBaseUrl, resolvedHeaders);
    } else {
      resolvedHeaders = tokenOrConfig.headers;
      resolvedBaseUrl = tokenOrConfig.baseUrl ?? PACHCA_API_URL;
      this.export = tokenOrConfig.export ?? new ExportServiceImpl(resolvedBaseUrl, resolvedHeaders);
    }
  }

  static stub(overrides: { export?: ExportService } = {}): PachcaClient {
    const client = Object.create(PachcaClient.prototype);
    client.export = overrides.export ?? new ExportService();
    return client;
  }
}
