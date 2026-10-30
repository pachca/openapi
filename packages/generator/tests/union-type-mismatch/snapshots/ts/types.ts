export interface DetailsEmpty {
}

export interface DetailsBot {
  botId: number;
  webhookId?: number | null;
  scopes?: string[];
}

export interface DetailsBotTokenUpdated {
  tokenKind: string;
  resourceOwnerId: number;
  currentScopes?: string[];
  accessTokenId: number;
  botId?: number | null;
  webhookId?: number | null;
  scopes?: ScopesChange;
}

export interface DetailsToken {
  tokenKind: string;
  resourceOwnerId: number;
  scopes: string[];
  accessTokenId: number;
  botId?: number | null;
  webhookId?: number | null;
  applicationId?: number | null;
  deviceName?: string | null;
}

export interface ScopesChange {
  previous: string[];
  new: string[];
}

export interface Event {
  id: number;
  eventKey: unknown;
  details: EventDetailsUnion;
}

export type EventDetailsUnion = DetailsEmpty | DetailsBot | DetailsBotTokenUpdated | DetailsToken;

export interface GetEventsResponse {
  data: Event[];
}
