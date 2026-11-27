import { AppError, v } from "@pachca/app-sdk/server";
import { job, mutation, query } from "../_generated/server";

export const list = query({
  args: {},
  handler: (ctx) =>
    ctx.db
      .query("notes")
      .withIndex("by_owner", (q) => q.eq("owner", ctx.actor?.id ?? ""))
      .order("desc")
      .collect(),
});

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
    if (!note || note.owner !== ctx.actor?.id) throw new AppError("заметка не найдена", { status: 404 });
    await ctx.db.delete("notes", args.id);
  },
});

export const send = job({
  args: { text: v.string() },
  returns: v.object({ words: v.number() }),
  handler: async (_ctx, args) => {
    await new Promise((r) => setTimeout(r, 1500));
    if (!args.text.trim()) throw new AppError("пустую заметку не отправить", { code: "empty" });
    return { words: args.text.trim().split(/\s+/).length };
  },
});
