import {
  ListEventsParams,
  ListEventsResponse,
  OAuthError,
  ExportRequest,
  Export,
} from "./types";
import { deserialize, serialize, fetchWithRetry } from "./utils";

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
    const body = await response.json();
    switch (response.status) {
      case 200:
        return deserialize(body) as ListEventsResponse;
      default:
        throw new Error(`HTTP ${response.status}: ${JSON.stringify(body)}`);
    }
  }

  async createExport(request: ExportRequest): Promise<Export> {
    const response = await fetchWithRetry(`${this.baseUrl}/exports`, {
      method: "POST",
      headers: { ...this.headers, "Content-Type": "application/json" },
      body: JSON.stringify(serialize(request)),
    });
    const body = await response.json();
    switch (response.status) {
      case 201:
        return deserialize(body.data) as Export;
      case 401:
        throw new OAuthError(body.error);
      default:
        throw new Error(`HTTP ${response.status}: ${JSON.stringify(body)}`);
    }
  }
}

export class PachcaClient {
  readonly export: ExportService;

  constructor(token: string, baseUrl: string = "https://api.pachca.com/api/shared/v1") {
    const headers = { Authorization: `Bearer ${token}` };
    this.export = new ExportServiceImpl(baseUrl, headers);
  }

  static stub(export: ExportService = new ExportService()): PachcaClient {
    const client = Object.create(PachcaClient.prototype);
    client.export = export;
    return client;
  }
}
