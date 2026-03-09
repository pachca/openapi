import {
  ListEventsParams,
  ListEventsResponse,
  OAuthScope,
  Event,
  UploadRequest,
} from "./types";
import { deserialize, fetchWithRetry } from "./utils";

class EventsService {
  constructor(
    private baseUrl: string,
    private headers: Record<string, string>,
  ) {}

  async listEvents(params?: ListEventsParams): Promise<ListEventsResponse> {
    const query = new URLSearchParams();
    if (params?.isActive !== undefined) query.set("is_active", String(params.isActive));
    if (params?.scopes !== undefined) query.set("scopes", String(params.scopes));
    if (params?.filter !== undefined) query.set("filter", String(params.filter));
    const url = `${this.baseUrl}/events${query.toString() ? `?${query}` : ""}`;
    const response = await fetchWithRetry(url, {
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

  async publishEvent(id: number, scope: OAuthScope): Promise<Event> {
    const response = await fetchWithRetry(`${this.baseUrl}/events/${id}/publish`, {
      method: "PUT",
      headers: { ...this.headers, "Content-Type": "application/json" },
      body: JSON.stringify({ scope: scope }),
    });
    const body = await response.json();
    switch (response.status) {
      case 200:
        return deserialize(body.data) as Event;
      default:
        throw new Error(`HTTP ${response.status}: ${JSON.stringify(body)}`);
    }
  }
}

class UploadsService {
  constructor(
    private baseUrl: string,
    private headers: Record<string, string>,
  ) {}

  async createUpload(request: UploadRequest): Promise<void> {
    const form = new FormData();
    form.set("Content-Disposition", request.contentDisposition);
    form.set("file", request.file, "upload");
    const response = await fetchWithRetry(`${this.baseUrl}/uploads`, {
      method: "POST",
      headers: this.headers,
      body: form,
    });
    switch (response.status) {
      case 201:
        return;
      default:
        throw new Error(`HTTP ${response.status}`);
    }
  }
}

export class PachcaClient {
  readonly events: EventsService;
  readonly uploads: UploadsService;

  constructor(token: string, baseUrl: string) {
    const headers = { Authorization: `Bearer ${token}` };
    this.events = new EventsService(baseUrl, headers);
    this.uploads = new UploadsService(baseUrl, headers);
  }
}
