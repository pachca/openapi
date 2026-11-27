import type { PachcaEvents, PachcaEventType } from "./events.js";

export type * from "./events.js";

// Серверная часть SDK: типы схемы, функций и контекста. Реализацию ctx (db, fetch, pachca) даёт платформа,
// здесь только описание того, что приложению доступно, поэтому ошибки видны на `check`, до загрузки.

import type { PachcaSides } from "./pachca.js";
export {
  PachcaError,
  type PachcaBotUpload,
  type PachcaClient,
  type PachcaDownload,
  type PachcaFileInput,
  type PachcaFileMethods,
  type PachcaOp,
  type PachcaSavedFile,
  type PachcaSides,
  type PachcaUploadedFile,
} from "./pachca.js";

// ---- v: один язык описания данных для аргументов, результатов и схемы таблиц

/** Фрагмент JSON Schema (подмножество). Описание это данные: проверяет их платформа, кода проверки в бандле нет. */
export type JsonSchema = { readonly type: "string" | "number" | "boolean" | "integer" | "array" | "object"; readonly [key: string]: unknown };

/** Описание значения. `T` виден только типам, `optional` говорит, что поле можно не передавать. */
export interface Validator<T = unknown, O extends boolean = boolean> {
  readonly schema: JsonSchema;
  readonly optional: O;
  readonly _type?: T;
}
type AnyValidator = Validator<any, boolean>;

/** Объект из описаний: аргументы функции и поля документа. */
export type FieldsDef = { readonly [key: string]: AnyValidator };

const make = <T, O extends boolean>(schema: JsonSchema, optional: O) => ({ schema, optional }) as Validator<T, O>;

/** Объект из описаний как JSON Schema: поля без `v.optional` обязательны, лишних полей быть не может. */
export const objectSchema = (fields: FieldsDef): JsonSchema => ({
  type: "object",
  properties: Object.fromEntries(Object.entries(fields).map(([k, f]) => [k, f.schema])),
  required: Object.entries(fields).filter(([, f]) => !f.optional).map(([k]) => k),
  additionalProperties: false,
});

/** Типы значений. Объекты и массивы годятся для аргументов и результатов функций, но не для полей таблиц. Вариантов пока нет. */
export const v = {
  string: () => make<string, false>({ type: "string" }, false),
  number: () => make<number, false>({ type: "number" }, false),
  boolean: () => make<boolean, false>({ type: "boolean" }, false),
  /**
   * Загруженный файл (внутри строка uuid). В таблице поле принимает только файл этого приложения, загруженный и
   * подтверждённый этим же пользователем (`ctx.actor`). Показать: `ctx.files.url(id)`, загрузить: `pachca.files.upload`.
   */
  file: () => make<FileId, false>({ type: "string", format: "uuid", "x-file": true }, false),
  /** Ссылка на документ таблицы. Что документ существует, не проверяется: для этого `v.ref`. */
  id: <N extends string>(table: N) => make<Id<N>, false>({ type: "integer", minimum: 1, "x-table": table }, false),
  /**
   * Проверяемая ссылка на документ таблицы (тип как у `v.id`). В поле таблицы `insert` и `patch` отклоняются кодом
   * `ref_missing` (422), если документа нет, а `delete` документа, на который ссылаются, кодом `ref_in_use` (409).
   * Загрузка версии проверяет существующие ссылки, как остальные данные. В аргументах и результатах это `v.id`.
   */
  ref: <N extends string>(table: N) => make<Id<N>, false>({ type: "integer", minimum: 1, "x-table": table, "x-ref": true }, false),
  /** Объект с заданными полями, лишних полей быть не может. */
  object: <const F extends FieldsDef>(fields: F) => make<Infer<F>, false>(objectSchema(fields), false),
  /** Массив значений одного типа. */
  array: <T>(items: Validator<T, false>) => make<T[], false>({ type: "array", items: items.schema }, false),
  /** Поле можно не передавать (null не принимается). */
  optional: <T>(inner: Validator<T, false>) => make<T, true>(inner.schema, true),
};

type TypeOf<V> = V extends Validator<infer T, any> ? T : never;
type OptionalKeys<F extends FieldsDef> = { [K in keyof F]: F[K]["optional"] extends true ? K : never }[keyof F];
type Flatten<T> = { [K in keyof T]: T[K] } & {};

/** Значение объекта по его описанию. */
export type Infer<F extends FieldsDef> = Flatten<
  { [K in Exclude<keyof F, OptionalKeys<F>>]: TypeOf<F[K]> } & { [K in OptionalKeys<F>]?: TypeOf<F[K]> }
>;

/** Идентификатор файла приложения (uuid сессии загрузки). */
export type FileId = string & { readonly __file: true };

// ---- схема

/** Поля документа без служебных `_id` и `_creationTime`. */
export type DocFields<F extends FieldsDef> = Infer<F>;

export type IndexMap = Record<string, readonly string[]>;

export interface Table<F extends FieldsDef = FieldsDef, I extends IndexMap = IndexMap> {
  readonly _fields: F;
  readonly _indexes: I;
  /** Индекс по полям, в порядке из списка: по нему запрос берёт строки, если задать равенства по началу списка. */
  index<N extends string, K extends readonly (keyof DocFields<F> & string)[]>(
    name: N,
    fields: K
  ): Table<F, I & { [P in N]: K }>;
}

export function defineTable<const F extends FieldsDef>(fields: F): Table<F, {}> {
  const make = (indexes: IndexMap): Table<F, any> => ({
    _fields: fields,
    _indexes: indexes,
    index: (name, cols) => make({ ...indexes, [name]: cols }),
  });
  return make({});
}

export type Tables = Record<string, Table<any, any>>;
export interface Schema<T extends Tables = Tables> {
  readonly tables: T;
}

/**
 * Задания планировщика (`ctx.scheduler`). Таблицу ведёт платформа, поэтому состояние задания читается живым запросом:
 * `ctx.db.query("_scheduled").withIndex("by_state", q => q.eq("state", "pending"))`. Записать в неё напрямую нельзя.
 * `state`: pending, running, success, failed, canceled. `runAt` и `finishedAt` в миллисекундах.
 * Для заданий, которые вызвало действие или `job`: `result` это JSON возвращённого значения (`JSON.parse`) после `success`,
 * `error` и `errorCode` это текст и код отказа после `failed`.
 */
export const scheduledTable = defineTable({
  fn: v.string(),
  args: v.string(),
  actor: v.string(),
  runAt: v.number(),
  state: v.string(),
  result: v.optional(v.string()),
  error: v.optional(v.string()),
  errorCode: v.optional(v.string()),
  finishedAt: v.optional(v.number()),
}).index("by_state", ["state", "runAt"]);

export const defineSchema = <T extends Tables>(tables: T): Schema<T & { _scheduled: typeof scheduledTable }> => {
  for (const name of Object.keys(tables)) {
    if (name.startsWith("_")) throw new Error(`таблица ${name}: имена на «_» зарезервированы платформой`);
  }
  return { tables: { ...tables, _scheduled: scheduledTable } };
};

export type Id<N extends string> = number & { readonly __table: N };
type TableName<S extends Schema> = keyof S["tables"] & string;
type FieldsOf<S extends Schema, N extends TableName<S>> = S["tables"][N]["_fields"];
type IndexesOf<S extends Schema, N extends TableName<S>> = S["tables"][N]["_indexes"];

export type Doc<S extends Schema, N extends TableName<S>> = Flatten<
  { _id: Id<N>; _creationTime: number } & DocFields<FieldsOf<S, N>>
>;

// ---- чтение и запись

export interface IndexRange<D, K extends readonly string[]> {
  eq<F extends K[number] & keyof D>(field: F, value: D[F]): IndexRange<D, K>;
}
export interface OrderedQuery<D> {
  order(direction: "asc" | "desc"): OrderedQuery<D>;
  collect(): Promise<D[]>;
  take(n: number): Promise<D[]>;
  first(): Promise<D | null>;
}
export interface QueryBuilder<D, I extends IndexMap> extends OrderedQuery<D> {
  withIndex<N extends keyof I & string>(
    name: N,
    range?: (q: IndexRange<D, I[N]>) => IndexRange<D, I[N]>
  ): OrderedQuery<D>;
}

export interface DbReader<S extends Schema> {
  query<N extends TableName<S>>(table: N): QueryBuilder<Doc<S, N>, IndexesOf<S, N>>;
  get<N extends TableName<S>>(table: N, id: Id<N>): Promise<Doc<S, N> | null>;
}
export interface DbWriter<S extends Schema> extends DbReader<S> {
  insert<N extends TableName<S>>(table: N, doc: DocFields<FieldsOf<S, N>>): Promise<Id<N>>;
  patch<N extends TableName<S>>(table: N, id: Id<N>, fields: Partial<DocFields<FieldsOf<S, N>>>): Promise<void>;
  delete<N extends TableName<S>>(table: N, id: Id<N>): Promise<void>;
}

/** Пользователь, открывший приложение (id в Пачке). Пусто, если вызов без токена (в проде функции без токена недоступны). */
export interface Actor {
  readonly id: string;
  /** Роль в компании: `owner`, `admin`, `user`, `multi_guest` или `guest`. */
  readonly role: "owner" | "admin" | "user" | "multi_guest" | "guest";
}

// ---- ошибки приложения

/** Ожидаемый отказ функции (не найдено, уже занято, нельзя): клиент получает код 4xx с `code` и `message`, а в журнале
 *  приложения это не «Internal Server Error». Любая другая брошенная ошибка остаётся 500. Мутация откатывается в обоих случаях. */
export class AppError extends Error {
  /** Признак для платформы: приложение и SDK собираются в разные бандлы, `instanceof` между ними не работает. */
  readonly isAppError = true;
  readonly code: string;
  readonly status: number;

  constructor(message: string, options: { code?: string; status?: number } = {}) {
    super(message);
    this.name = "AppError";
    this.code = options.code ?? "app_error";
    this.status = options.status !== undefined && options.status >= 400 && options.status < 500 ? options.status : 400;
  }
}

// ---- функции

export type FunctionKind = "query" | "mutation" | "action" | "internalQuery" | "internalMutation" | "internalAction" | "webhook" | "pachcaEvent" | "job";

interface Def<K extends FunctionKind, A, R> {
  readonly kind: K;
  /** Описание аргументов и результата: платформа проверяет по нему вызов и ответ, `A` и `R` выведены из него. */
  readonly args: FieldsDef;
  readonly returns?: AnyValidator;
  readonly handler: (ctx: never, args: A) => R | Promise<R>;
}
export type QueryDef<A = any, R = any> = Def<"query", A, R>;
export type MutationDef<A = any, R = any> = Def<"mutation", A, R>;
export type ActionDef<A = any, R = any> = Def<"action", A, R>;
/** Внутренние функции вызывают только другие функции (`ctx.runQuery` и т. д.) и планировщик; клиент их не видит. */
export type InternalQueryDef<A = any, R = any> = Def<"internalQuery", A, R>;
export type InternalMutationDef<A = any, R = any> = Def<"internalMutation", A, R>;
export type InternalActionDef<A = any, R = any> = Def<"internalAction", A, R>;
/** Обработчик входящего вебхука внешнего сервиса (`manifest.webhooks`). Клиенту и другим функциям недоступен. */
export interface WebhookDef<B = string> extends Def<"webhook", WebhookRequest<B>, unknown> {
  /** Описание тела (`body`): платформа разбирает JSON и проверяет его до запуска обработчика. */
  readonly body?: AnyValidator;
  /** Синхронная проверка адреса при подключении сервиса. */
  readonly verify?: (req: WebhookVerifyRequest) => WebhookVerifyReply | void;
}
/** Обработчик события Пачки (`manifest.pachca.events`). Клиенту и другим функциям недоступен. */
export interface PachcaEventDef<E extends PachcaEventType = PachcaEventType> extends Def<"pachcaEvent", PachcaEvents[E], unknown> {
  readonly event: E;
}
/** Внешний вызов со статусом (письмо, платёж): клиент его запускает, платформа ставит в планировщик и выполняет как действие. */
export type JobDef<A = any, R = any> = Def<"job", A, R>;
export type AnyDef = JobDef | QueryDef | MutationDef | ActionDef | InternalQueryDef | InternalMutationDef | InternalActionDef | WebhookDef<any> | PachcaEventDef;

/** Где в запросе лежит идентификатор события сервиса: заголовок или путь в JSON-теле. */
export type WebhookId = { header: string; json?: undefined } | { json: string; header?: undefined };

/** Подпись запроса: заголовок с подписью (hex или base64, можно с префиксом `sha256=`) и имя секрета приложения. */
export interface WebhookSignature {
  header: string;
  secret: string;
}
/** Проверка вебхука: подпись, список адресов (адреса и сети CIDR) или оба. Хотя бы одно обязательно. */
export type WebhookAuth = (
  | { signature: WebhookSignature; allow?: readonly string[] }
  | { signature?: undefined; allow: readonly [string, ...string[]] }
) & {
  /**
   * Где идентификатор события сервиса: `{ header: "X-Event-Id" }` или `{ json: "data.event.id" }` (путь по ключам тела,
   * строка или число). Повтор с тем же идентификатором отбрасывается сутки; без `id` по хэшу тела, и два одинаковых законных
   * события (одинаковая оплата) склеиваются. Заголовок не подписан, его подменит тот, кто перехватил запрос; id в теле подписан.
   */
  id?: WebhookId;
};

/** Запрос внешнего сервиса, уже проверенный платформой (подпись, список адресов, повтор). */
export interface WebhookRequest<B = string> {
  readonly method: string;
  /** Заголовки в нижнем регистре; `cookie` и `authorization` платформа не передаёт. */
  readonly headers: Readonly<Record<string, string>>;
  readonly query: Readonly<Record<string, string>>;
  /** Тело как строка (до 32 КБ). Если в `webhook` задано `body`, то уже разобранный и проверенный объект. */
  readonly body: B;
}

/** Запрос, по которому `verify` решает, проверочный ли он. Тело как строка. */
export interface WebhookVerifyRequest {
  readonly method: string;
  readonly headers: Readonly<Record<string, string>>;
  readonly query: Readonly<Record<string, string>>;
  readonly body: string;
}
/** Ответ сервису на проверочный запрос: платформа отдаёт его сразу, обработчик не запускается и повтор не запоминается. */
export interface WebhookVerifyReply {
  readonly status?: number;
  /** Строка отдаётся текстом, всё остальное как JSON. */
  readonly body: string | object;
}

/**
 * Постановка заданий: функция выполнится позже, без пользователя: `ctx.actor` в задании всегда `null`, `ctx.pachca.user`
 * недоступен (от имени пользователя приложение действует только в его запросе). Если задание должно знать, для кого оно, передайте
 * id пользователя в аргументах. По расписанию пишите от бота (`ctx.pachca.bot`).
 */
export interface Scheduler {
  /** Через `delayMs` миллисекунд. Из мутации постановка входит в её транзакцию: откат отменяет и задание. */
  runAfter<A>(delayMs: number, ref: FunctionRef<"mutation" | "action" | "job", A, unknown>, args: A): Promise<Id<"_scheduled">>;
  /** В момент `timestampMs` (миллисекунды от эпохи). */
  runAt<A>(timestampMs: number, ref: FunctionRef<"mutation" | "action" | "job", A, unknown>, args: A): Promise<Id<"_scheduled">>;
  /** Отменить ещё не начавшееся задание. Начавшееся отменить нельзя. Вернёт `true`, если задание отменено. */
  cancel(id: Id<"_scheduled">): Promise<boolean>;
}

/** Сессия загрузки файла: то же, что `UploadSession` в вебе Пачки, поля в camelCase. */
export interface UploadSession {
  readonly uploadUuid: FileId;
  /** PUT multipart на origin приложения (часть `file`), токен запуска в `Authorization`. */
  readonly uploadUrl: string;
  /** Порядок, в котором клиент пробует способы; следующий пробуется, если предыдущий не удался. */
  readonly strategy: readonly ("presigned_upload" | "proxy_s3_url" | "upload_url")[];
  readonly presignedUpload?: {
    /** Подписаны Content-Type, Content-Length и If-None-Match: * (объект пишется один раз, повтор получает 412). */
    readonly url: string;
    /** Всегда `null`: прокси на домене приложения нет. */
    readonly proxyS3Url: string | null;
    readonly method: "PUT";
    /** Заголовки PUT, передаются как есть. */
    readonly headers: Readonly<Record<string, string>>;
    readonly expiresAt: string;
    /** `POST` сюда подтверждает загрузку. */
    readonly completeUrl: string;
  };
}

/** Что известно о загруженном файле. */
export interface FileMetadata {
  readonly uuid: FileId;
  readonly name: string;
  readonly size: number;
  /** Тип без параметров, как заявлен при создании сессии. */
  readonly contentType: string;
  /** id пользователя, который загрузил файл. */
  readonly owner: string;
  readonly createdAt: number;
}

/** Файлы приложения: чтение. */
export interface FilesReader {
  /**
   * Подписанный короткоживущий адрес файла на origin приложения (`/_files/<uuid>?sig=…&exp=…`, живёт 10–20 минут): его можно
   * положить в `<img src>`. Картинки отдаются как есть, остальное как `attachment`. Одно окно времени даёт один и тот же адрес.
   * `{ download: true }` даёт адрес для `pachca.download`: признак входит в подпись, и картинки тоже отдаются как `attachment`.
   */
  url(id: FileId | string, options?: { download?: boolean }): Promise<string>;
  /** Описание загруженного файла этого приложения; `null`, если нет такого или загрузка не подтверждена. */
  metadata(id: FileId | string): Promise<FileMetadata | null>;
}

/** Файлы приложения: запись. Хранилище внешнее, лимиты файла и квоты компании в README («Лимиты и квоты»). */
export interface FilesWriter extends FilesReader {
  /**
   * Открывает сессию загрузки для пользователя `ctx.actor` (без пользователя отказ). Размер и тип заявляются сразу и
   * проверяются при загрузке: `size` не больше лимита файла (413), имя без перевода строки и разделителей пути, `contentType` вида
   * `type/subtype`; с `checksum` (SHA-256 в hex) остаётся только `upload_url`. Из мутации сессия входит в её транзакцию.
   */
  generateUploadUrl(input: { filename: string; size: number; contentType: string; checksum?: string }): Promise<UploadSession>;
  /** Удаляет файл: место в квоте освобождается сразу, содержимое снимает фоновая очистка. Откат мутации возвращает файл. */
  delete(id: FileId | string): Promise<void>;
}

/**
 * Приложение, в котором выполняется код. Одна сборка работает в любом приложении (например, в тестовом и в рабочем), поэтому id
 * и ссылку не пишите в код, берите отсюда.
 */
export interface AppInfo {
  /** id приложения в Пачке: 12 символов `[0-9a-z]`. */
  readonly id: string;
  /** Ссылка, которая открывает приложение в Пачке (`https://app.pachca.com/app/<id>`), например для кнопки в сообщении бота. */
  readonly url: string;
}

export interface QueryCtx<S extends Schema> {
  readonly actor: Actor | null;
  readonly app: AppInfo;
  readonly files: FilesReader;
  /** Только чтение: запрос детерминирован, поэтому платформа умеет его подписывать. */
  readonly db: DbReader<S>;
}
export interface MutationCtx<S extends Schema> {
  readonly actor: Actor | null;
  readonly app: AppInfo;
  readonly files: FilesWriter;
  /** Вся мутация выполняется в одной транзакции: бросили ошибку, и ничего не записалось. */
  readonly db: DbWriter<S>;
  /** Задания по расписанию. Мутация по расписанию выполняется ровно один раз, действие не больше одного раза, автоповторов нет. */
  readonly scheduler: Scheduler;
}
export interface ActionCtx<P extends PachcaSides<any, any> = PachcaSides> {
  readonly actor: Actor | null;
  readonly app: AppInfo;
  readonly files: FilesWriter;
  readonly scheduler: Scheduler;
  /** Сеть только на хосты из манифеста. Ключ подключения (`manifest.secrets`) к запросу на его хост платформа добавит сама. */
  fetch(url: string, init?: { method?: string; headers?: Record<string, string>; body?: string }): Promise<{
    status: number;
    /** `status` от 200 до 299. */
    ok: boolean;
    text(): Promise<string>;
    json(): Promise<unknown>;
  }>;
  /**
   * API Пачки: `bot` от бота приложения, `user` от имени пользователя (после его согласия). Методы и типы из открытой
   * спецификации (`_generated/pachca.ts`), поля в camelCase. Аргументы как в API: `{ path, query, body }`. Ответ `{ data }`
   * приходит как `data`, списки целиком с `meta`. Метод без скоупа в манифесте не компилируется. Ошибка Пачки это `PachcaError`.
   */
  pachca: P;
  /** Действие не пишет в базу напрямую: оно вызывает мутации. */
  runQuery<A, R>(ref: FunctionRef<"query", A, R>, args: A): Promise<R>;
  runMutation<A, R>(ref: FunctionRef<"mutation", A, R>, args: A): Promise<R>;
}

/** Действие без пользователя (задание, внутреннее действие, вебхук, событие Пачки): `ctx.actor` пуст, в Пачку пишет только бот. */
export interface BackgroundCtx<P extends PachcaSides<any, any> = PachcaSides> extends Omit<ActionCtx<P>, "pachca"> {
  /** От бота приложения. От имени пользователя без его запроса действовать нельзя: id пользователя передавайте в аргументах. */
  pachca: { bot: P["bot"] };
}

/**
 * Обработчик вебхука: имя экспорта должно совпадать с ключом в `manifest.webhooks`. Выполняется как действие, но без
 * пользователя: `ctx.actor` пуст, `ctx.pachca.user` нет, пишите в базу через `ctx.runMutation`, в чат через
 * `ctx.pachca.bot`. Платформа принимает запрос сразу, а обработчик ставит в очередь: событие приходит не больше одного
 * раза для одного идентификатора (`id` в манифесте, без него по хэшу тела), но упавший обработчик не повторяется.
 * `body` описывает JSON-тело на языке `v`: платформа проверяет его и при ошибке отвечает 400 без запуска обработчика, а
 * `req.body` приходит уже объектом (лишние поля допускаются). `verify` отвечает сервису на проверку адреса при подключении
 * (`url_verification` у Slack, `hub.challenge` у Meta): без базы и сети, платформа даёт ему две секунды; вернул `undefined`,
 * значит запрос обычный и разбирается как всегда.
 */
interface WebhookBuilder<P extends PachcaSides<any, any>> {
  <B extends AnyValidator>(def: {
    body: B;
    verify?: (req: WebhookVerifyRequest) => WebhookVerifyReply | void;
    handler: (ctx: BackgroundCtx<P>, req: WebhookRequest<TypeOf<B>>) => unknown | Promise<unknown>;
  }): WebhookDef<TypeOf<B>>;
  (def: {
    body?: undefined;
    verify?: (req: WebhookVerifyRequest) => WebhookVerifyReply | void;
    handler: (ctx: BackgroundCtx<P>, req: WebhookRequest) => unknown | Promise<unknown>;
  }): WebhookDef;
}

interface PachcaEventBuilder<P extends PachcaSides<any, any>> {
  <E extends PachcaEventType>(
    event: E,
    def: { handler: (ctx: BackgroundCtx<P>, event: PachcaEvents[E]) => unknown | Promise<unknown> }
  ): PachcaEventDef<E>;
}

/** Строитель функции: `returns` необязателен, а если задан, обработчик обязан вернуть именно этот тип. */
interface Builder<Ctx, K extends FunctionKind> {
  <A extends FieldsDef, R>(def: {
    args: A;
    returns: Validator<R, boolean>;
    handler: (ctx: Ctx, args: Infer<A>) => NoInfer<R> | Promise<NoInfer<R>>;
  }): Def<K, Infer<A>, R>;
  <A extends FieldsDef, R>(def: { args: A; returns?: undefined; handler: (ctx: Ctx, args: Infer<A>) => R | Promise<R> }): Def<K, Infer<A>, Awaited<R>>;
}

/** Строители функций с типами, выведенными из схемы приложения и манифеста (см. `_generated/server.ts`). */
export function createFunctions<S extends Schema, P extends PachcaSides<any, any> = PachcaSides>() {
  const build = (kind: FunctionKind) => (def: { handler: (ctx: any, args: any) => unknown }) => ({ kind, ...def });
  return {
    query: build("query") as unknown as Builder<QueryCtx<S>, "query">,
    mutation: build("mutation") as unknown as Builder<MutationCtx<S>, "mutation">,
    action: build("action") as unknown as Builder<ActionCtx<P>, "action">,
    internalQuery: build("internalQuery") as unknown as Builder<QueryCtx<S>, "internalQuery">,
    internalMutation: build("internalMutation") as unknown as Builder<MutationCtx<S>, "internalMutation">,
    /** Вызывает только планировщик, поэтому пользователя нет: в Пачку пишет бот. */
    internalAction: build("internalAction") as unknown as Builder<BackgroundCtx<P>, "internalAction">,
    /**
     * Внешний вызов, который что-то меняет (письмо, платёж, запись в CRM). Обработчик выполняется как действие, то есть с
     * `ctx.fetch`, `ctx.runQuery` и `ctx.runMutation`, но без пользователя: `ctx.actor` пуст. Напрямую его не вызвать: клиент
     * запускает задание и сразу получает его номер, а платформа ставит задание в планировщик по гарантиям мутации (по порядку
     * сессии и ровно один раз). Статус, результат и ошибку клиент читает встроенным запросом; `AppError` доходит с кодом и текстом,
     * непредвиденная ошибка с общим кодом `job_failed`. Выполняется не больше одного раза, автоповторов нет.
     * Результат хранится в `_scheduled.result` (JSON, до 1 МБ).
     */
    job: build("job") as unknown as Builder<BackgroundCtx<P>, "job">,
    /**
     * Обработчик вебхука: имя экспорта должно совпадать с ключом в `manifest.webhooks`. Выполняется как действие, но без
     * пользователя: `ctx.actor` пуст, `ctx.pachca.user` нет, пишите в базу через `ctx.runMutation`, в чат через
     * `ctx.pachca.bot`. Платформа принимает запрос сразу, а обработчик ставит в очередь: событие приходит не больше одного
     * раза для одного идентификатора, но упавший обработчик не повторяется.
     */
    webhook: ((def: { handler: (ctx: any, req: any) => unknown }) => ({ kind: "webhook", args: {}, ...def })) as unknown as WebhookBuilder<P>,
    /**
     * Обработчик события Пачки: тип должен быть в `manifest.pachca.events`, на каждый тип одна функция. Событие типизировано по
     * схеме Пачки. Выполняется как действие без пользователя (`ctx.actor` пуст): пишите в базу через `ctx.runMutation`, отвечайте
     * в чат через `ctx.pachca.bot`. Платформа проверяет подлинность события и отбрасывает повторную доставку, а упавший обработчик
     * не повторяется. События от бота самого приложения не приходят.
     */
    pachcaEvent: (<E extends PachcaEventType>(event: E, def: { handler: (ctx: any, event: any) => unknown }) =>
      ({ kind: "pachcaEvent", args: {}, event, ...def })) as unknown as PachcaEventBuilder<P>,
  };
}

// ---- ссылки на функции для фронта

export interface FunctionRef<K extends FunctionKind, A, R> {
  readonly _kind: K;
  readonly _args: A;
  readonly _return: R;
  readonly _name: string;
}

type RefOf<D> =
  D extends QueryDef<infer A, infer R> ? FunctionRef<"query", A, R>
  : D extends MutationDef<infer A, infer R> ? FunctionRef<"mutation", A, R>
  : D extends ActionDef<infer A, infer R> ? FunctionRef<"action", A, R>
  : D extends JobDef<infer A, infer R> ? FunctionRef<"job", A, R>
  : never;

type InternalRefOf<D> =
  D extends InternalQueryDef<infer A, infer R> ? FunctionRef<"query", A, R>
  : D extends InternalMutationDef<infer A, infer R> ? FunctionRef<"mutation", A, R>
  : D extends InternalActionDef<infer A, infer R> ? FunctionRef<"action", A, R>
  : never;

/** `api.<модуль>.<функция>` для публичных функций модулей `server/*.ts`. */
export type ApiFromModules<M> = {
  [Mod in keyof M]: { [Fn in keyof M[Mod] as RefOf<M[Mod][Fn]> extends never ? never : Fn]: RefOf<M[Mod][Fn]> };
};

/** `internal.<модуль>.<функция>` для внутренних функций: их зовут `ctx.runMutation(internal…)` и `ctx.scheduler`. */
export type InternalFromModules<M> = {
  [Mod in keyof M]: { [Fn in keyof M[Mod] as InternalRefOf<M[Mod][Fn]> extends never ? never : Fn]: InternalRefOf<M[Mod][Fn]> };
};

// ---- манифест

/** Место ключа подключения: заголовок (с префиксом, например `"Bearer "`) или параметр адреса. */
export type SecretPlace =
  | { readonly host: string; readonly header: string; readonly prefix?: string; readonly query?: never }
  | { readonly host: string; readonly query: string; readonly header?: never; readonly prefix?: never };

export interface ManifestInput {
  description?: string;
  /** Точные хосты, на которые приложению можно ходить (ctx.fetch). */
  fetch?: readonly string[];
  /**
   * Хосты, на которые фронт ходит из браузера: fetch, картинки, шрифты, стили, медиа (тайлы карт, CDN картинок, публичные API
   * без ключа). Точный хост или маска поддомена `*.example.com`, можно с портом, без схемы и пути. Скрипты всё равно только свои.
   * Секреты сюда не подставляются: всё с ключом идёт серверным действием через `fetch`. Хосты показываются на экране согласия.
   */
  browser?: readonly string[];
  /**
   * Подключения к внешним сервисам: ключ (`secret set NAME`) платформа сама добавляет в каждый запрос `ctx.fetch` к хосту
   * подключения и только в объявленное место. Код ключа не видит и не пишет. Хост один и из `fetch`; смена хоста в новой
   * версии сбрасывает ключ.
   * ```ts
   * secrets: {
   *   CDEK_KEY: { host: "api.cdek.ru", header: "Authorization", prefix: "Bearer " },
   *   WEATHER_KEY: { host: "api.openweathermap.org", query: "appid" },
   * }
   * ```
   */
  secrets?: Readonly<Record<string, SecretPlace>>;
  /**
   * Входящие вебхуки внешних сервисов. Ключ это имя функции `webhook` и адрес `/_hooks/<ключ>` на хосте приложения.
   * Запрос проверяется подписью (`signature`: HMAC-SHA256 от тела, ключ это секрет приложения, `secret set`) и/или списком
   * адресов (`allow`). Нужна хотя бы одна проверка; если заданы обе, запрос должен пройти обе. Без подписи `allow` не может
   * разрешать любой адрес (`/0`). Повторную доставку того же тела платформа отбрасывает (сутки). Нужна база (`db: true`).
   */
  webhooks?: Readonly<Record<string, WebhookAuth>>;
  /**
   * `events`: события Пачки, которые получает приложение (`pachcaEvent`): `message.new`, `button.click`, `view.submit`. Экран
   * публикации показывает их человеку. Нужна база (`db: true`), на каждое событие ровно один обработчик.
   */
  pachca?: { bot?: readonly string[]; user?: readonly string[]; events?: readonly PachcaEventType[] };
  /** GET-пути без токена для функциональных приложений не нужны: статику платформа отдаёт публично сама. */
  public?: readonly string[];
  /** Приложению нужна своя база: платформа создаст её по schema.ts. `pachca-app build` ставит true сам, если в схеме есть таблицы. */
  db?: boolean;
}
export const defineManifest = <const M extends ManifestInput>(manifest: M): M => manifest;
