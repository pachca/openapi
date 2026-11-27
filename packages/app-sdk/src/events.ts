
/** Источник сообщения и приложение, из которого оно отправлено (если не человеком из клиента). */
export interface PachcaEventApplication {
  readonly id: number;
  readonly name: string;
}

/** Новое сообщение в чате, где есть бот приложения. Собственные сообщения бота не приходят. */
export interface MessageNewEvent {
  readonly type: "message";
  readonly event: "new";
  /** Время отправки вебхука, секунды от эпохи. */
  readonly webhook_timestamp: number;
  readonly id: number;
  /** Где написано: `discussion`, `thread` или `user` (личная переписка). */
  readonly entity_type: "discussion" | "thread" | "user";
  readonly entity_id: number;
  readonly chat_id: number;
  /** Текст сообщения. */
  readonly content: string;
  /** Автор. */
  readonly user_id: number;
  /** Тред, который открыт под сообщением, если он есть. */
  readonly thread: { readonly message_id: number; readonly message_chat_id: number } | null;
  readonly created_at: string;
  readonly parent_message_id: number | null;
  readonly url: string;
  readonly source?: string | null;
  readonly application?: PachcaEventApplication | null;
}

/** Нажатие кнопки под сообщением бота приложения. */
export interface ButtonClickEvent {
  readonly type: "button";
  readonly event: "click";
  readonly webhook_timestamp: number;
  readonly message_id: number;
  readonly chat_id: number;
  /** Кто нажал. */
  readonly user_id: number;
  /** Значение `data` нажатой кнопки. */
  readonly data: string;
  /** Одноразовый идентификатор нажатия (открывает форму в течение трёх секунд). */
  readonly trigger_id: string;
}

/** Отправка формы, которую открыл бот приложения. Ответить в форму (закрыть или показать ошибки) обработчик не может: форма закрывается сразу. */
export interface ViewSubmitEvent {
  readonly type: "view";
  readonly event: "submit";
  readonly webhook_timestamp: number;
  readonly chat_id: number | null;
  readonly callback_id: string | null;
  readonly private_metadata: string | null;
  /** Кто отправил форму. */
  readonly user_id: number;
  readonly view_id: string;
  readonly submit_id: string;
  /** Значения полей по их `name`. */
  readonly data: Readonly<Record<string, unknown>>;
}

/** Типы событий фазы 1: имя это `type.event` из тела вебхука Пачки. */
export interface PachcaEvents {
  "message.new": MessageNewEvent;
  "button.click": ButtonClickEvent;
  "view.submit": ViewSubmitEvent;
}
export type PachcaEventType = keyof PachcaEvents;
