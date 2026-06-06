export interface WebhookEvent {
  id: string;
  eventType: string;
  payload: WebhookPayloadUnion;
  createdAt: string;
}

export interface MessageWebhookPayload {
  type: "message_new";
  messageId: number;
}

export interface ReactionWebhookPayload {
  type: "reaction_added";
  reaction: string;
}

export interface PaginationMeta {
  paginate: {
    nextPage: string;
    hasNext?: boolean;
  };
}

export type WebhookPayloadUnion = MessageWebhookPayload | ReactionWebhookPayload;

export interface GetWebhookEventsParams {
  limit?: number;
  cursor?: string;
}

export interface GetWebhookEventsResponse {
  data: WebhookEvent[];
  meta: PaginationMeta;
}
