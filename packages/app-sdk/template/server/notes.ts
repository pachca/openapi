import { AppError, v } from "@pachca/app-sdk/server";
import { job, mutation, query } from "../_generated/server";

/** Заметки текущего пользователя, новые сверху. */
export const list = query({
  args: {},
  handler: (ctx) =>
    ctx.db
      .query("notes")
      .withIndex("by_owner", (q) => q.eq("owner", ctx.actor?.id ?? ""))
      .order("desc")
      .collect(),
});

/** Одна заметка; чужая и несуществующая неотличимы (null). */
export const get = query({
  args: { id: v.id("notes") },
  handler: async (ctx, args) => {
    const note = await ctx.db.get("notes", args.id);
    return note && note.owner === ctx.actor?.id ? note : null;
  },
});

export const add = mutation({
  args: { text: v.string() },
  handler: async (ctx, args) => {
    if (!ctx.actor) throw new AppError("нужен пользователь", { status: 401 });
    if (args.text.length < 1 || args.text.length > 200) throw new AppError("текст от 1 до 200 символов", { status: 400 });
    return ctx.db.insert("notes", { text: args.text, owner: ctx.actor.id });
  },
});

export const remove = mutation({
  args: { id: v.id("notes") },
  handler: async (ctx, args) => {
    const note = await ctx.db.get("notes", args.id);
    if (!note || note.owner !== ctx.actor?.id) throw new AppError("заметка не найдена", { status: 404 }); // ожидаемый отказ: клиенту 404, не 500
    await ctx.db.delete("notes", args.id);
  },
});

/**
 * Задание: внешний вызов, который нельзя повторять (письмо, платёж, запись в CRM). Фронт запускает его `useJob` и видит
 * живой статус. В настоящем приложении здесь `ctx.fetch` на хост из `manifest.fetch`; ключ сервиса объявляется в
 * `manifest.secrets`, и платформа сама добавляет его в запрос. В заготовке вызов только имитируется. Пользователя в задании нет (`ctx.actor` равен null): всё нужное приходит в аргументах.
 */
export const send = job({
  args: { text: v.string() },
  returns: v.object({ words: v.number() }),
  handler: async (_ctx, args) => {
    await new Promise((r) => setTimeout(r, 1500));
    if (!args.text.trim()) throw new AppError("пустую заметку не отправить", { code: "empty" });
    return { words: args.text.trim().split(/\s+/).length };
  },
});
