export interface DetailsEmpty {
}

export interface DetailsChat {
  chatId: number;
}

export interface DetailsCall {
  chatId: number;
  duration: number;
  recordingSize?: number | null;
}

export interface DetailsRename {
  oldName: string;
  newName: string;
}

export interface Event {
  id: number;
  eventKey: unknown;
  details: EventDetailsUnion;
}

export type EventDetailsUnion = DetailsEmpty | DetailsChat | DetailsCall | DetailsRename;

export interface GetEventsResponse {
  data: Event[];
}
