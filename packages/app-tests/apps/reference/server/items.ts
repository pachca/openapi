import { AppError, v } from "@pachca/app-sdk/server";
import { internal } from "../_generated/api";
import { action, internalAction, internalMutation, internalQuery, job, mutation, pachcaEvent, query, webhook } from "../_generated/server";


export const list = query({
  args: { list: v.id("lists"), done: v.optional(v.boolean()) },
  returns: v.array(v.object({ text: v.string(), rank: v.number() })),
  handler: async (ctx, args) => {
    const items = await ctx.db
      .query("items")
      .withIndex("by_list", (q) => q.eq("list", args.list).eq("done", args.done ?? false))
      .collect();
    return items.map((i) => ({ text: i.text, rank: i.rank }));
  },
});

export const add = mutation({
  args: { list: v.ref("lists"), text: v.string(), image: v.optional(v.file()) },
  returns: v.id("items"),
  handler: async (ctx, args) => {
    if (!ctx.actor) throw new AppError("нужен пользователь", { status: 401, code: "auth" });
    return ctx.db.insert("items", { list: args.list, text: args.text, rank: Date.now(), done: false, image: args.image });
  },
});

export const search = action({
  args: { q: v.string() },
  returns: v.number(),
  handler: async (ctx, args) => {
    const r = await ctx.fetch(`https://api.example.com/search?q=${encodeURIComponent(args.q)}`);
    return r.status;
  },
});

export const count = internalQuery({
  args: {},
  handler: async (ctx) => (await ctx.db.query("items").collect()).length,
});

export const mark = internalMutation({
  args: { text: v.string() },
  handler: async (ctx, args) => {
    const list = await ctx.db.insert("lists", { title: "hooks", owner: "hook" });
    await ctx.db.insert("items", { list, text: args.text, rank: 0, done: false });
  },
});

export const tick = internalAction({
  args: { n: v.number() },
  handler: async (ctx, args): Promise<void> => {
    await ctx.runMutation(internal.items.mark, { text: `tick ${args.n}` });
  },
});

export const send = job({
  args: { to: v.string(), tags: v.array(v.string()) },
  returns: v.object({ id: v.string() }),
  handler: async (ctx, args) => {
    const r = await ctx.fetch("https://api.example.com/send", { method: "POST", body: JSON.stringify(args) });
    if (!r.ok) throw new AppError("не отправлено", { code: "send_failed" });
    return { id: String(r.status) };
  },
});

export const orders = webhook({
  body: v.object({ order: v.object({ id: v.string() }), amount: v.number() }),
  verify: (req) => (req.method === "GET" ? { status: 200, body: "ok" } : undefined),
  handler: async (ctx, req): Promise<void> => {
    await ctx.runMutation(internal.items.mark, { text: req.body.order.id });
  },
});

export const alerts = webhook({
  handler: async (ctx, req): Promise<void> => {
    await ctx.runMutation(internal.items.mark, { text: req.body });
  },
});

export const onMessage = pachcaEvent("message.new", {
  handler: async (ctx, event) => {
    await ctx.pachca.bot.messages.createMessage({ body: { message: { entityId: event.chat_id, content: "ok" } } });
  },
});
