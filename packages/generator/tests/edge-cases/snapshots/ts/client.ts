import {
  ListEventsParams,
  ListEventsResponse,
  OAuthScope,
  Event,
  UploadRequest,
} from "./types";
import { deserialize, fetchWithRetry } from "./utils";

export abstract class EventsService {
  async listEvents(params?: ListEventsParams): Promise<ListEventsResponse> {
    throw new Error("Events.listEvents is not implemented");
  }

  async publishEvent(id: number, scope: OAuthScope): Promise<Event> {
    throw new Error("Events.publishEvent is not implemented");
  }
}

export class EventsServiceImpl extends EventsService {
  constructor(
    private baseUrl: string,
    private headers: Record<string, string>,
  ) {}

  override async listEvents(params?: ListEventsParams): Promise<ListEventsResponse> {
    const query = new URLSearchParams();
    if (params?.isActive !== undefined) query.set("is_active", String(params.isActive));
    if (params?.scopes !== undefined) {
      params.scopes.forEach((v) => query.append("scopes[]", String(v)));
    }
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

  override async publishEvent(id: number, scope: OAuthScope): Promise<Event> {
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

export abstract class UploadsService {
  async createUpload(request: UploadRequest): Promise<void> {
    throw new Error("Uploads.createUpload is not implemented");
  }
}

export class UploadsServiceImpl extends UploadsService {
  constructor(
    private baseUrl: string,
    private headers: Record<string, string>,
  ) {}

  override async createUpload(request: UploadRequest): Promise<void> {
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

export interface PachcaServices {
  events?: EventsService;
  uploads?: UploadsService;
}

export class PachcaClient {
  readonly events: EventsService;
  readonly uploads: UploadsService;

  constructor(token: string, baseUrl: string, services: PachcaServices = {}) {
    const headers = { Authorization: `Bearer ${token}` };
    this.events = services.events ?? new EventsServiceImpl(baseUrl, headers);
    this.uploads = services.uploads ?? new UploadsServiceImpl(baseUrl, headers);
  }
}
