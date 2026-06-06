import {
  GetWebhookEventsParams,
  GetWebhookEventsResponse,
  WebhookEvent,
  WebhookPayloadUnion,
} from "./types.js";
import { deserialize, deserializeType, fetchWithRetry } from "./utils.js";

export interface PollWebhookEventsParams {
  limit?: number;
  intervalMs?: number;
  createdAfter?: Date | string | null;
  maxSeenDeliveryIds?: number;
}

export interface PollWebhookPayloadsParams<TPayload extends WebhookPayloadUnion = WebhookPayloadUnion> extends PollWebhookEventsParams {
  filter?: (payload: WebhookPayloadUnion, event: WebhookEvent) => payload is TPayload;
}

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

function createdAtMatches(event: WebhookEvent, createdAfter: Date | string | null | undefined): boolean {
  if (createdAfter == null) return true;
  return new Date(event.createdAt).getTime() >= new Date(createdAfter).getTime();
}

export class BotsService {
  async getWebhookEvents(params?: GetWebhookEventsParams): Promise<GetWebhookEventsResponse> {
    throw new Error("Bots.getWebhookEvents is not implemented");
  }

  async getWebhookEventsAll(params?: Omit<GetWebhookEventsParams, 'cursor'>): Promise<WebhookEvent[]> {
    throw new Error("Bots.getWebhookEventsAll is not implemented");
  }

  async *pollWebhookEvents(params?: PollWebhookEventsParams): AsyncGenerator<WebhookEvent> {
    const limit = params?.limit ?? 50;
    const intervalMs = params?.intervalMs ?? 5_000;
    const createdAfter = params?.createdAfter ?? new Date();
    const maxSeenDeliveryIds = params?.maxSeenDeliveryIds ?? 5_000;
    if (maxSeenDeliveryIds <= 0) throw new Error("maxSeenDeliveryIds must be greater than 0");

    const seenIdOrder: string[] = [];
    const seenIds = new Set<string>();
    const remember = (id: string): boolean => {
      if (seenIds.has(id)) return false;
      seenIds.add(id);
      seenIdOrder.push(id);
      while (seenIdOrder.length > maxSeenDeliveryIds) {
        const oldest = seenIdOrder.shift();
        if (oldest !== undefined) seenIds.delete(oldest);
      }
      return true;
    };

    while (true) {
      let cursor: string | undefined;
      let hasNext = true;
      while (hasNext) {
        const response = await this.getWebhookEvents({ limit, cursor });
        let pageHasRecentEvents = false;
        for (const event of [...response.data].reverse()) {
          const matchesCreatedAfter = createdAtMatches(event, createdAfter);
          if (matchesCreatedAfter) pageHasRecentEvents = true;
          if (matchesCreatedAfter && remember(event.id)) yield event;
        }
        hasNext = (response.meta.paginate.hasNext ?? response.data.length > 0) && pageHasRecentEvents;
        cursor = response.meta.paginate.nextPage;
      }
      await sleep(intervalMs);
    }
  }

  async *pollWebhookPayloads<TPayload extends WebhookPayloadUnion = WebhookPayloadUnion>(
    params?: PollWebhookPayloadsParams<TPayload>,
  ): AsyncGenerator<TPayload> {
    for await (const event of this.pollWebhookEvents(params)) {
      const payload = event.payload;
      if (params?.filter == null || params.filter(payload, event)) yield payload as TPayload;
    }
  }
}

export class BotsServiceImpl extends BotsService {
  constructor(
    private baseUrl: string,
    private headers: Record<string, string>,
  ) {
    super();
  }

  async getWebhookEvents(params?: GetWebhookEventsParams): Promise<GetWebhookEventsResponse> {
    const query = new URLSearchParams();
    if (params?.limit !== undefined) query.set("limit", String(params.limit));
    if (params?.cursor !== undefined) query.set("cursor", params.cursor);
    const url = `${this.baseUrl}/webhooks/events${query.toString() ? `?${query}` : ""}`;
    const response = await fetchWithRetry(url, {
      headers: this.headers,
    });
    const body = await response.json();
    switch (response.status) {
      case 200:
        return deserialize(body) as GetWebhookEventsResponse;
      default:
        throw new Error(`HTTP ${response.status}: ${JSON.stringify(body)}`);
    }
  }

  async getWebhookEventsAll(params?: Omit<GetWebhookEventsParams, 'cursor'>): Promise<WebhookEvent[]> {
    const items: WebhookEvent[] = [];
    let cursor: string | undefined;
    let hasNext = true;
    while (hasNext) {
      const response = await this.getWebhookEvents({ ...params, cursor } as GetWebhookEventsParams);
      items.push(...response.data);
      if (response.data.length === 0) break;
      cursor = response.meta.paginate.nextPage;
      hasNext = response.meta.paginate.hasNext ?? true;
    }
    return items;
  }
}

export const PACHCA_API_URL = "https://api.pachca.com/api/shared/v1";

export class PachcaClient {
  readonly bots: BotsService;

  constructor(token: string, baseUrl?: string);
  constructor(config: { headers: Record<string, string>; baseUrl?: string; bots?: BotsService });
  constructor(tokenOrConfig: string | { headers: Record<string, string>; baseUrl?: string; bots?: BotsService }, baseUrl?: string) {
    let resolvedHeaders: Record<string, string>;
    let resolvedBaseUrl: string;
    if (typeof tokenOrConfig === 'string') {
      resolvedHeaders = { Authorization: `Bearer ${tokenOrConfig}` };
      resolvedBaseUrl = baseUrl ?? PACHCA_API_URL;
      this.bots = new BotsServiceImpl(resolvedBaseUrl, resolvedHeaders);
    } else {
      resolvedHeaders = tokenOrConfig.headers;
      resolvedBaseUrl = tokenOrConfig.baseUrl ?? PACHCA_API_URL;
      this.bots = tokenOrConfig.bots ?? new BotsServiceImpl(resolvedBaseUrl, resolvedHeaders);
    }
  }

  static stub(overrides: { bots?: BotsService } = {}): PachcaClient {
    const client = Object.create(PachcaClient.prototype);
    client.bots = overrides.bots ?? new BotsService();
    return client;
  }
}
