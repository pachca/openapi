// Типы клиентского SDK. Сам SDK подставляет платформа первым скриптом документа, приложение пользуется `window.pachca`
// (или просто `pachca`), а этот модуль только описывает его. `_generated/api.ts` подключает его сам.
import type { FileId, FunctionRef, Id, UploadSession } from "./server.js";

export type { FileId, FunctionRef, Id, UploadSession };
export { PROTOCOL } from "./protocol.js";

/** Номер задания (`job`) в `_scheduled`. Помнит тип результата задания, чтобы статус был типизирован. */
export type JobId<R = unknown> = Id<"_scheduled"> & { readonly __jobResult?: R };

/** Состояние задания: `pending` ждёт запуска, `running` выполняется, дальше `success`, `failed` или `canceled`. */
export type JobState = "pending" | "running" | "success" | "failed" | "canceled";

/** Статус задания из встроенного запроса `_jobs.get`. `result` есть после `success`, `error` после `failed`. */
export interface JobStatus<R = unknown> {
  readonly state: JobState;
  readonly result: R | null;
  readonly error: { readonly code: string; readonly message: string } | null;
  readonly runAt: number;
  readonly finishedAt: number | null;
}

/** Встроенные функции заданий: статус и отмена своего задания (чужое и несуществующее неотличимы: `null` и `false`). */
export interface JobsApi {
  readonly get: FunctionRef<"query", { id: JobId<any> }, JobStatus<unknown> | null>;
  readonly cancel: FunctionRef<"mutation", { id: JobId<any> }, boolean>;
}

/** Что возвращает `mutation`: у мутации её результат, у задания (`job`) номер задания. */
export type MutationResult<K, R> = K extends "job" ? JobId<R> : R;

/**
 * Ошибка вызова функции: `code` и `status` из `AppError` на сервере, `connection_lost`, `launch_required`, `version_changed`
 * (опубликована новая версия, документ устарел) и другие.
 */
export interface FunctionError extends Error {
  readonly name: "FunctionError";
  readonly status: number;
  readonly code: string;
}

/** Локальное представление запросов для оптимистичного значения: читать и подменять можно только живые запросы. */
export interface OptimisticStore {
  getQuery<A, R>(ref: FunctionRef<"query", A, R>, args: A): R | undefined;
  setQuery<A, R>(ref: FunctionRef<"query", A, R>, args: A, value: R): void;
}

/** `outdated`: опубликована новая версия приложения, этот документ больше не соединяется. Хост предлагает человеку открыть новую. */
export type ConnectionStatus = "live" | "reconnecting" | "outdated";

/** Параметры `pachca.files.upload`. */
export interface UploadOptions {
  signal?: AbortSignal;
  /** Процент отправленного, 0..100. */
  onProgress?: (percent: number) => void;
  /** Своя функция открытия сессии (action с `ctx.files.generateUploadUrl`) вместо встроенной: своё правило, кому можно загружать. */
  createSession?: FunctionRef<"action", { filename: string; size: number; contentType: string; checksum?: string }, UploadSession>;
}

/**
 * Ошибка загрузки файла. `code`: `aborted`, `network`, `timeout`, `http` (тогда `status` от хранилища или платформы),
 * `invalid_session`, `unauthorized`. Отказ создания сессии (лимит файла 413 `file_too_large`, квота 422 `quota_exceeded`,
 * частота 429 `rate_limited`) приходит как `FunctionError` с теми же `status` и `code`.
 */
export interface UploadError extends Error {
  readonly name: "UploadError";
  readonly code: string;
  readonly status: number;
}

/** Параметры `pachca.download`. */
export interface DownloadOptions {
  /** Имя файла, обязательно для `Blob`. У адреса имя берётся из файла приложения. */
  filename?: string;
  /** Для `Blob`: отмена загрузки временного файла. */
  signal?: AbortSignal;
  /** Для `Blob`: процент загрузки временного файла, 0..100. */
  onProgress?: (percent: number) => void;
}

/** Чем закончилось скачивание: человек скачал файл (`downloaded`) или отказался в окне подтверждения (`cancelled`). */
export type DownloadStatus = "downloaded" | "cancelled";

export interface Files {
  /**
   * Загружает файл и возвращает его uuid для мутации (`v.file()`). Открывает сессию серверной функцией, пробует способы по порядку
   * (`presigned_upload` в хранилище, `upload_url` на origin приложения), подтверждает загрузку и возвращает uuid. Хранилище внешнее:
   * хост бакета добавлен в `connect-src`, остальное идёт на origin приложения.
   */
  upload(file: File, options?: UploadOptions): Promise<FileId>;
  /** Класс ошибок загрузки: `error instanceof pachca.files.UploadError`. */
  readonly UploadError: abstract new (...args: never[]) => UploadError;
}

export interface Pachca {
  /** Разовое чтение запроса. Для экрана, который должен обновляться сам, нужен `subscribe`. */
  query<A, R>(ref: FunctionRef<"query", A, R>, args: A): Promise<R>;
  /**
   * Мутация. Выполняется ровно один раз, даже если связь оборвалась: после переподключения SDK отправит её с тем же
   * номером. Мутации документа применяются в том порядке, в котором вызваны. `optimisticUpdate` показывает ожидаемый
   * результат сразу: он держится, пока сервер не подтвердит запись, и заменяется настоящим значением. Задание (`job`)
   * запускается так же: результат это номер задания, статус читает `_jobs.get`.
   */
  mutation<K extends "mutation" | "job", A, R>(
    ref: FunctionRef<K, A, R>,
    args: A,
    options?: { optimisticUpdate?: (store: OptimisticStore, args: A) => void }
  ): Promise<MutationResult<K, R>>;
  /** Действие выполняется не больше одного раза: при обрыве связи промис отклоняется с кодом `connection_lost`, повтора нет. */
  action<A, R>(ref: FunctionRef<"action", A, R>, args: A): Promise<R>;
  /** Подписка на запрос: `onData` получает текущий результат и каждое изменение. Возвращает отписку. */
  subscribe<A, R>(
    ref: FunctionRef<"query", A, R>,
    args: A,
    onData: (value: R) => void,
    handlers?: { onError?: (error: FunctionError) => void; onStatus?: (status: ConnectionStatus) => void }
  ): () => void;
  /** Файлы приложения: загрузка. Показ (`ctx.files.url`) и сохранение в документ делает сервер. */
  readonly files: Files;
  /**
   * Скачивание файла человеком. iframe приложения скачивать не может, поэтому скачивает Пачка: она показывает окно с
   * названием приложения, именем и размером файла и после согласия сохраняет файл. Байты идут с origin приложения.
   *
   * - Адрес из `ctx.files.url(id, { download: true })`: файл приложения, право на него решает функция, которая выдала адрес.
   *   Адрес живёт 10–20 минут, после этого хост отвечает `expired`, и адрес нужно запросить заново.
   * - `Blob` с `{ filename }`: SDK загружает его временным файлом (живёт час, занимает квоту компании, в документ не
   *   сохраняется), затем скачивает. Ошибки загрузки как у `files.upload`.
   *
   * Отказ это `FunctionError` с `code`: `host_unsupported` (Пачка не умеет скачивать, человек видит плашку), `bad_url`,
   * `bad_filename`, `busy` (уже открыто другое окно скачивания), `expired`, `not_found`.
   */
  download(file: string | Blob, options?: DownloadOptions): Promise<DownloadStatus>;
  /** Класс ошибок вызова: `error instanceof pachca.FunctionError`. */
  readonly FunctionError: abstract new (...args: never[]) => FunctionError;
}

declare global {
  /** Клиентский SDK Пачки. Подставляется платформой, неизменяемый. */
  const pachca: Pachca;
  interface Window {
    readonly pachca: Pachca;
  }
}
