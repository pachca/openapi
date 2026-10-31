export interface DetailsEmpty {
}

export interface DetailsBot {
  botId: number;
  actorId: number | null;
  webhookId?: number;
  scopes?: string[] | ScopesChange;
}

export interface DetailsBotScopes {
  botId: number;
  scopes: string[];
}

export interface DetailsBotTokenUpdated {
  tokenKind: string;
  resourceOwnerId: number;
  accessTokenId: number;
  botId?: number | null;
  webhookId?: number;
  scopes?: ScopesChange;
}

export interface DetailsToken {
  tokenKind: string;
  resourceOwnerId: number;
  scopes: string[];
  accessTokenId: number;
}

export interface ScopesChange {
  previous: string[];
  new: string[];
}

export interface Actor {
  id: number;
  name?: string;
}

export interface Event {
  id: number;
  eventKey: string;
  actor?: string | Actor | null;
  details: EventDetailsUnion;
}

export type EventDetailsUnion = DetailsEmpty | DetailsBot | DetailsBotScopes | DetailsBotTokenUpdated | DetailsToken;

export interface GetEventsResponse {
  data: Event[];
}
