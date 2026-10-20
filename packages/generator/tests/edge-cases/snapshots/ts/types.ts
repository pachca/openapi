export enum OAuthScope {
  ChatsRead = "chats:read",
  ChatsWrite = "chats:write",
  UsersRead = "users:read",
  UsersWrite = "users:write",
}

/**
 * A response may carry a value this SDK does not list yet: it arrives as the raw string.
 */
export enum EventType {
  Message = "message",
  Reaction = "reaction",
}

export interface EventFilter {
}

export interface Event {
  id: number;
  type: EventType;
}

export interface PublishEventRequest {
  scope: OAuthScope;
}

export interface UploadRequest {
  file: Blob;
  contentDisposition: string;
}

export interface Notification {
  kind: string;
}

export interface MessageNotification {
  kind: "message";
  text: string;
}

export interface ReactionNotification {
  kind: "message";
  emoji: string;
}

export interface Schedule {
  days: number[];
  value: unknown | null;
}

export type NotificationUnion = MessageNotification | ReactionNotification;

export interface ListEventsParams {
  isActive?: boolean;
  scopes?: OAuthScope[];
  filter?: EventFilter;
}

export interface ListEventsResponse {
  data: Event[];
}
