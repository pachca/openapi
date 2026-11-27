import { internal } from "../_generated/api";
import { pachcaEvent } from "../_generated/server";

export const onMessage = pachcaEvent("message.new", {
  handler: async (ctx, event) => {
    if (!event.content.startsWith("/note ")) return;
    const text = event.content.slice(6).trim().slice(0, 200);
    if (!text) return;
    await ctx.runMutation(internal.hooks.addFromHook, { owner: String(event.user_id), text });
    await ctx.pachca.bot.messages.createMessage({
      body: { message: { entityType: "discussion", entityId: event.chat_id, content: `Сохранил заметку: ${text}\n${ctx.app.url}` } },
    });
  },
});
