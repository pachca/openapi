import { GetEventsResponse } from "./types.js";
import { deserialize, deserializeType, fetchWithRetry } from "./utils.js";

export class EventsService {
  async getEvents(): Promise<GetEventsResponse> {
    throw new Error("Events.getEvents is not implemented");
  }
}

export class EventsServiceImpl extends EventsService {
  constructor(
    private baseUrl: string,
    private headers: Record<string, string>,
  ) {
    super();
  }

  async getEvents(): Promise<GetEventsResponse> {
    const response = await fetchWithRetry(`${this.baseUrl}/events`, {
      headers: this.headers,
    });
    const body = await response.json();
    switch (response.status) {
      case 200:
        return deserialize(body) as GetEventsResponse;
      default:
        throw new Error(`HTTP ${response.status}: ${JSON.stringify(body)}`);
    }
  }
}

export class PachcaClient {
  readonly events: EventsService;

  constructor(token: string, baseUrl?: string);
  constructor(config: { headers: Record<string, string>; baseUrl?: string; events?: EventsService });
  constructor(tokenOrConfig: string | { headers: Record<string, string>; baseUrl?: string; events?: EventsService }, baseUrl?: string) {
    let resolvedHeaders: Record<string, string>;
    let resolvedBaseUrl: string;
    if (typeof tokenOrConfig === 'string') {
      resolvedHeaders = { Authorization: `Bearer ${tokenOrConfig}` };
      resolvedBaseUrl = baseUrl ?? '';
      this.events = new EventsServiceImpl(resolvedBaseUrl, resolvedHeaders);
    } else {
      resolvedHeaders = tokenOrConfig.headers;
      resolvedBaseUrl = tokenOrConfig.baseUrl ?? '';
      this.events = tokenOrConfig.events ?? new EventsServiceImpl(resolvedBaseUrl, resolvedHeaders);
    }
  }

  static stub(overrides: { events?: EventsService } = {}): PachcaClient {
    const client = Object.create(PachcaClient.prototype);
    client.events = overrides.events ?? new EventsService();
    return client;
  }
}
