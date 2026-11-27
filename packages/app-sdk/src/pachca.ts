// Типы ctx.pachca: методы API Пачки (`PachcaApi` из `@pachca/app-sdk/pachca`) и скоупы манифеста. Сами методы даёт платформа
// по таблице `@pachca/app-sdk/ops.json`, она же проверяет скоуп каждого вызова: в бандле приложения клиента нет.

import type { FileId } from "./server.js";

/** Метод API Пачки в типах: скоуп, только ли для бота, аргументы и результат. */
export interface PachcaOp<Scope extends string, BotOnly extends boolean, Args, Result> {
  readonly _scope: Scope;
  readonly _botOnly: BotOnly;
  readonly _args: Args;
  readonly _result: Result;
}

type Call<A, R> = {} extends A ? (args?: A) => Promise<R> : (args: A) => Promise<R>;
/** Метод без скоупа: вызов не компилируется, а текст ошибки говорит, что добавить в манифест. */
type ScopeRequired<Scope extends string, Side extends string> = (scopeRequired: `добавьте "${Scope}" в manifest.pachca.${Side}`) => never;

/** Клиент одной стороны: методы со скоупом из манифеста вызываются, остальные остаются заглушками с подсказкой. */
export type PachcaClient<Api, Scopes extends string, Side extends "bot" | "user"> = {
  [S in keyof Api]: {
    [M in keyof Api[S] as Side extends "user" ? (Api[S][M] extends PachcaOp<string, true, unknown, unknown> ? never : M) : M]:
      Api[S][M] extends PachcaOp<infer Sc, boolean, infer A, infer R> ? ([Sc] extends [Scopes] ? Call<A, R> : ScopeRequired<Sc, Side>) : never;
  };
};

type SideScopes<M, Side extends "bot" | "user"> = M extends { pachca: { [K in Side]: readonly (infer S)[] } } ? S & string : never;
/** profile:read платформа добавляет сама, если у пользователя есть любые права. */
type UserScopes<M> = [SideScopes<M, "user">] extends [never] ? never : SideScopes<M, "user"> | "profile:read";

/** Файл, загруженный в Пачку: кладётся в `files` нового сообщения как есть. */
export interface PachcaUploadedFile {
  key: string;
  name: string;
  size: number;
  fileType: "file" | "image";
}

/**
 * Содержимое файла, которое уходит в Пачку (`uploadFile`, поле `image` у загрузки аватара). Либо uuid файла приложения
 * (`v.file()`, `ctx.files`): платформа берёт его из хранилища сама, через память приложения он не проходит. Либо байты
 * из кода с именем: `Blob`, `ArrayBuffer`, `Uint8Array`, строка или поток (`(await ctx.fetch(url)).body`), поток уходит
 * без сборки в памяти. Размер ограничен лимитом платформы (по умолчанию 32 МБ), больше это `file_too_large`.
 */
export type PachcaFileInput =
  | string
  | {
      data: Blob | ArrayBuffer | ArrayBufferView | ReadableStream<Uint8Array> | string;
      /** Имя с расширением: по нему Пачка определяет тип (у сообщения расширение `name` и `key` должно совпадать). */
      name: string;
      contentType?: string;
    };

/**
 * Файл из Пачки (`files.downloadFile`): тело приходит потоком, пока его не прочитали, в памяти приложения его нет.
 * Прочитать один раз: `body` (например, передать дальше в `ctx.fetch`), `arrayBuffer()` или `text()`. Сохранить в файлы
 * приложения без чтения в коде: `saveFile`.
 */
export interface PachcaDownload {
  /** Имя из `Content-Disposition`, пустое, если Пачка его не прислала. */
  name: string;
  contentType: string;
  /** Байт, `null` у зашифрованных файлов (Пачка не сообщает размер заранее). */
  size: number | null;
  body: ReadableStream<Uint8Array>;
  arrayBuffer(): Promise<ArrayBuffer>;
  text(): Promise<string>;
}

/** Файл Пачки, сохранённый в файлы приложения (`saveFile`). */
export interface PachcaSavedFile {
  /** uuid файла приложения: в поле `v.file()`, в `ctx.files.url`. */
  id: FileId;
  name: string;
  size: number;
  contentType: string;
}

/** Методы платформы для файлов на каждой стороне: загрузка в Пачку и сохранение вложения в файлы приложения. */
export interface PachcaFileMethods {
  /**
   * Загружает файл в Пачку и возвращает описание для поля `files` сообщения:
   * `messages.createMessage({ body: { message: { …, files: [file] } } })`. Нужен скоуп `uploads:write`. Аргумент это uuid
   * файла приложения или байты с именем (`PachcaFileInput`). У файла приложения права проверяйте сами (например,
   * `(await ctx.files.metadata(id))?.owner === ctx.actor?.id`). Отказ платформы (`scope_missing`, `not_found`,
   * `file_too_large`, `files_disabled`, `upload_failed`) это `Error` с `code`, отказ Пачки это `PachcaError`.
   */
  uploadFile(file: PachcaFileInput): Promise<PachcaUploadedFile>;
  /**
   * Скачивает вложение Пачки (`id` из поля `id` вложения, `target` как у `files.downloadFile`) прямо в файлы приложения
   * и возвращает uuid нового файла: дальше `ctx.files.url(id)` или поле `v.file()`. Нужен скоуп `files:read`, в коде
   * приложения содержимое не появляется. Владелец файла это `ctx.actor` вызова (в задании и вебхуке без владельца), лимиты и
   * квота как у файлов приложения (`file_too_large`, `quota_exceeded`). Отказ Пачки (`confidential_download_denied`…)
   * это `PachcaError`.
   */
  saveFile(args: { id: number; target?: "pdf_preview" | "pdf_first_page" | "thumb" | "image"; name?: string }): Promise<PachcaSavedFile>;
}

/** @deprecated Старое имя: `uploadFile` теперь есть у обеих сторон, см. `PachcaFileMethods`. */
export type PachcaBotUpload = Pick<PachcaFileMethods, "uploadFile">;

/** Методы файлов со скоупами: без скоупа в манифесте метод остаётся заглушкой с подсказкой, как у методов API. */
type SideFiles<Scopes extends string, Side extends "bot" | "user"> = {
  uploadFile: ["uploads:write"] extends [Scopes] ? PachcaFileMethods["uploadFile"] : ScopeRequired<"uploads:write", Side>;
  saveFile: ["files:read"] extends [Scopes] ? PachcaFileMethods["saveFile"] : ScopeRequired<"files:read", Side>;
};

/** Обе стороны ctx.pachca по API Пачки и манифесту приложения. */
export interface PachcaSides<Api = {}, M = {}> {
  bot: PachcaClient<Api, SideScopes<M, "bot">, "bot"> & SideFiles<SideScopes<M, "bot">, "bot">;
  user: PachcaClient<Api, UserScopes<M>, "user"> & SideFiles<UserScopes<M>, "user">;
}

/**
 * Ответ Пачки с ошибкой: `status` HTTP, `code` из тела (`insufficient_scope`, `not_found`, `role_forbidden`…). Бросает её
 * рантайм платформы, поэтому `instanceof` узнаёт её по имени.
 */
export class PachcaError extends Error {
  static [Symbol.hasInstance](v: unknown): boolean {
    return v instanceof Error && v.name === "PachcaError" && typeof (v as { status?: unknown }).status === "number";
  }
  readonly status: number;
  readonly code: string;
  readonly body: unknown;
  constructor(status: number, code: string, message: string, body: unknown) {
    super(message);
    this.name = "PachcaError";
    this.status = status;
    this.code = code;
    this.body = body;
  }
}
