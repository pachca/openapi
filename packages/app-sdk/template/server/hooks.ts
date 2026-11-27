import { v } from "@pachca/app-sdk/server";
import { internal } from "../_generated/api";
import { internalMutation, webhook } from "../_generated/server";

/** Заметка от имени внешнего сервиса. Внутренняя: клиент её вызвать не может. */
export const addFromHook = internalMutation({
  args: { owner: v.string(), text: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.insert("notes", { text: args.text, owner: args.owner });
  },
});

/**
 * POST /_hooks/incoming с телом {"owner": "<id пользователя Пачки>", "text": "…"}. Подпись проверила платформа, тело тоже
 * (неверное получает 400 без запуска обработчика), повтор того же тела отброшен. Пользователя нет (`ctx.actor` равен null),
 * в базу пишет мутация. Упавший обработчик не повторяется, поэтому он идемпотентный.
 */
export const incoming = webhook({
  body: v.object({ owner: v.string(), text: v.string() }),
  handler: async (ctx, req): Promise<void> => {
    await ctx.runMutation(internal.hooks.addFromHook, { owner: req.body.owner, text: req.body.text.slice(0, 200) });
  },
});
