// Проверка типов ctx.pachca: файл не исполняется, его компилирует `tsc` в `test` и `typecheck`.
// Строка с `@ts-expect-error` падает, если ошибки типов там больше нет.
import type { PachcaDownload, PachcaFileInput, PachcaOp, PachcaSavedFile, PachcaSides, PachcaUploadedFile } from "../../src/pachca.ts";
import type { FileId } from "../../src/server.ts";

type Api = {
  messages: {
    createMessage: PachcaOp<"messages:create", false, { body: { content: string } }, { id: number }>;
    addLinkPreviews: PachcaOp<"link_previews:write", true, { path: { id: number } }, void>;
  };
  files: {
    downloadFile: PachcaOp<"files:read", false, { path: { id: number } }, PachcaDownload>;
  };
  profile: {
    updateProfileAvatar: PachcaOp<"profile_avatar:write", false, { body: { image: PachcaFileInput } }, { imageUrl: string }>;
  };
};

declare const full: PachcaSides<Api, { pachca: { bot: ["messages:create", "uploads:write", "link_previews:write", "files:read", "profile_avatar:write"]; user: ["messages:create", "uploads:write"] } }>;
declare const bare: PachcaSides<Api, { pachca: { bot: ["messages:create"] } }>;
declare const none: PachcaSides<Api, {}>;

export async function scopes() {
  const file: PachcaUploadedFile = await full.bot.uploadFile("3f2a4c1e-0b6d-4f10-9a52-6f6a3a0f1c11");
  await full.bot.messages.createMessage({ body: { content: file.name } });
  await full.bot.messages.addLinkPreviews({ path: { id: 1 } });
  await full.user.messages.createMessage({ body: { content: "x" } });

  // @ts-expect-error без uploads:write в manifest.pachca.bot метод заглушка
  await bare.bot.uploadFile("3f2a4c1e-0b6d-4f10-9a52-6f6a3a0f1c11");
  // @ts-expect-error без скоупа метод API заглушка
  await bare.bot.messages.addLinkPreviews({ path: { id: 1 } });
  // @ts-expect-error без манифеста у бота нет скоупов
  await none.bot.uploadFile("3f2a4c1e-0b6d-4f10-9a52-6f6a3a0f1c11");
  // у пользователя uploadFile со своим скоупом, saveFile без files:read заглушка
  await full.user.uploadFile({ data: new Uint8Array([1]), name: "a.bin" });
  // @ts-expect-error без files:read в manifest.pachca.user
  await full.user.saveFile({ id: 1 });
  // @ts-expect-error метод только для бота у пользователя отсутствует
  await full.user.messages.addLinkPreviews({ path: { id: 1 } });
}

// Текст заглушки подсказывает, что добавить в манифест.
type Hint<F> = F extends (hint: infer H) => never ? H : never;
export const hint: Hint<typeof bare.bot.uploadFile> = 'добавьте "uploads:write" в manifest.pachca.bot';

export async function files(id: FileId, stream: ReadableStream<Uint8Array>) {
  const f: PachcaDownload = await full.bot.files.downloadFile({ path: { id: 7 } });
  const bytes: ArrayBuffer = await f.arrayBuffer();
  const size: number | null = f.size;
  await full.bot.profile.updateProfileAvatar({ body: { image: id } });
  await full.bot.profile.updateProfileAvatar({ body: { image: { data: stream, name: "a.png", contentType: "image/png" } } });
  // @ts-expect-error у байтов нужно имя
  await full.bot.profile.updateProfileAvatar({ body: { image: { data: bytes } } });
  const saved: PachcaSavedFile = await full.bot.saveFile({ id: 7, target: "thumb" });
  const fileId: FileId = saved.id;
  // @ts-expect-error неизвестный вариант target
  await full.bot.saveFile({ id: 7, target: "raw" });
  return [size, fileId];
}

// Сгенерированный PachcaApi из packages/spec/openapi.yaml
import type { PachcaApi } from "../../src/generated/pachca.ts";
declare const real: PachcaSides<PachcaApi, { pachca: { bot: ["messages:create"]; user: ["chats:read"] } }>;
void real.bot.messages.createMessage({ body: { message: { entityId: 1, content: "Готово" } } });
void real.user.chats.listChats({ query: { limit: 50 } });
// @ts-expect-error скоупа chats:read у бота нет
void real.bot.chats.listChats({});
