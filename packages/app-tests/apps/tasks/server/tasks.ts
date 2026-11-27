import { AppError, v, type Id } from "@pachca/app-sdk/server";
import { api, internal } from "../_generated/api";
import { action, internalAction, internalMutation, job, mutation, pachcaEvent, query, webhook } from "../_generated/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_owner", (q) => q.eq("owner", ctx.actor?.id ?? ""))
      .order("desc")
      .collect();
    return Promise.all(tasks.map(async (t) => ({ ...t, imageUrl: t.image ? await ctx.files.url(t.image) : null })));
  },
});

export const stats = query({
  args: {},
  handler: async (ctx) => {
    const tasks = await ctx.db.query("tasks").withIndex("by_owner", (q) => q.eq("owner", ctx.actor?.id ?? "")).collect();
    return { total: tasks.length, done: tasks.filter((t) => t.done).length };
  },
});

export const add = mutation({
  args: { text: v.string(), note: v.optional(v.string()), image: v.optional(v.file()) },
  handler: async (ctx, args) => {
    if (!ctx.actor) throw new Error("нужен пользователь");
    if (args.text.length < 1 || args.text.length > 200) throw new AppError("текст от 1 до 200 символов", { code: "bad_text", status: 400 });
    return ctx.db.insert("tasks", { text: args.text, done: false, owner: ctx.actor.id, note: args.note, image: args.image });
  },
});

export const uploadUrl = action({
  args: { filename: v.string(), size: v.number(), contentType: v.string() },
  handler: (ctx, args) => {
    if (!ctx.actor) throw new AppError("нужен пользователь", { code: "unauthorized", status: 401 });
    if (!args.contentType.startsWith("image/") || args.size > 5 << 20) throw new AppError("только картинки до 5 МБ", { code: "bad_image", status: 422 });
    return ctx.files.generateUploadUrl(args);
  },
});

export const remove = mutation({
  args: { id: v.id("tasks") },
  handler: async (ctx, args) => {
    const task = await ctx.db.get("tasks", args.id);
    if (!task || task.owner !== ctx.actor?.id) throw new Error("задача не найдена");
    await ctx.db.delete("tasks", args.id);
    if (task.image) await ctx.files.delete(task.image);
  },
});

export const imageInfo = query({
  args: { id: v.id("tasks") },
  handler: async (ctx, args) => {
    const task = await ctx.db.get("tasks", args.id);
    if (!task?.image || task.owner !== ctx.actor?.id) return null;
    return ctx.files.metadata(task.image);
  },
});

export const toggle = mutation({
  args: { id: v.id("tasks") },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const task = await ctx.db.get("tasks", args.id);
    if (!task || task.owner !== ctx.actor?.id) throw new Error("задача не найдена");
    await ctx.db.patch("tasks", args.id, { done: !task.done });
    return !task.done;
  },
});

export const addThenFail = mutation({
  args: { text: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.insert("tasks", { text: args.text, done: false, owner: ctx.actor?.id ?? "" });
    throw new Error("откат");
  },
});

export const taken = mutation({
  args: { text: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.insert("tasks", { text: args.text, done: false, owner: ctx.actor?.id ?? "" });
    throw new AppError("уже занято", { code: "taken", status: 409 });
  },
});

export const whoami = action({
  args: {},
  handler: (ctx) => ({ id: ctx.actor?.id ?? null, app: ctx.app }),
});


export const markReminded = internalMutation({
  args: { id: v.id("tasks") },
  handler: async (ctx, args) => {
    await ctx.db.patch("tasks", args.id, { note: ctx.actor ? `reminded:${ctx.actor.id}` : "reminded" });
  },
});

export const remindViaAction = internalAction({
  args: { id: v.id("tasks") },
  handler: async (ctx, args): Promise<void> => {
    await ctx.runMutation(internal.tasks.markReminded, { id: args.id });
  },
});

export const remind = mutation({
  args: { id: v.id("tasks"), afterMs: v.number(), viaAction: v.optional(v.boolean()) },
  returns: v.id("_scheduled"),
  handler: (ctx, args): Promise<Id<"_scheduled">> =>
    ctx.scheduler.runAfter(args.afterMs, args.viaAction ? internal.tasks.remindViaAction : internal.tasks.markReminded, { id: args.id }),
});

export const callAsUser = internalAction({
  args: {},
  handler: async (ctx): Promise<void> => {
    void (ctx.pachca as unknown as { user: unknown }).user;
  },
});

export const remindAsUser = mutation({
  args: { afterMs: v.number() },
  handler: (ctx, args): Promise<Id<"_scheduled">> => ctx.scheduler.runAfter(args.afterMs, internal.tasks.callAsUser, {}),
});

export const cancelReminder = mutation({
  args: { job: v.id("_scheduled") },
  handler: (ctx, args) => ctx.scheduler.cancel(args.job),
});

export const remindThenFail = mutation({
  args: { id: v.id("tasks") },
  handler: async (ctx, args): Promise<void> => {
    await ctx.scheduler.runAfter(100, internal.tasks.markReminded, { id: args.id });
    throw new Error("откат");
  },
});

export const jobs = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query("_scheduled").collect();
    return rows.map((j) => ({ id: j._id, fn: j.fn, state: j.state, error: j.error ?? null, errorCode: j.errorCode ?? null }));
  },
});


export const sendJob = job({
  args: { text: v.string(), mode: v.optional(v.string()), ms: v.optional(v.number()) },
  returns: v.object({ text: v.string(), noActor: v.boolean() }),
  handler: async (ctx, args) => {
    if (args.ms) await new Promise((r) => setTimeout(r, args.ms));
    if (args.mode === "app") throw new AppError("Почта не приняла письмо", { code: "mail_rejected" });
    if (args.mode === "crash") throw new Error("секретная деталь реализации");
    return { text: args.text, noActor: ctx.actor === null };
  },
});

export const sendJobLater = mutation({
  args: { text: v.string(), afterMs: v.number() },
  handler: (ctx, args): Promise<Id<"_scheduled">> => ctx.scheduler.runAfter(args.afterMs, api.tasks.sendJob, { text: args.text }),
});


export const addFromHook = internalMutation({
  args: { text: v.string() },
  handler: async (ctx, args) => {
    if (ctx.actor) throw new Error("в вебхуке не должно быть пользователя");
    await ctx.db.insert("tasks", { text: args.text, done: false, owner: "hook" });
  },
});

export const orders = webhook({
  handler: async (ctx, req): Promise<void> => {
    const order = JSON.parse(req.body) as { text?: string };
    if (!order.text) throw new Error("в заказе нет text");
    await ctx.runMutation(internal.tasks.addFromHook, { text: order.text });
  },
});

export const signed = webhook({
  handler: async (ctx, req): Promise<void> => {
    await ctx.runMutation(internal.tasks.addFromHook, { text: `signed:${req.body}` });
  },
});

export const alerts = webhook({
  handler: async (ctx, req): Promise<void> => {
    await ctx.runMutation(internal.tasks.addFromHook, { text: `alert:${req.body}` });
  },
});

export const crm = webhook({
  body: v.object({ order_id: v.string(), status: v.string() }),
  verify: (req) => {
    if (req.method !== "POST") return;
    try {
      const probe = JSON.parse(req.body) as { type?: string; challenge?: string };
      if (probe.type === "url_verification") return { body: String(probe.challenge) };
    } catch {}
  },
  handler: async (ctx, req): Promise<void> => {
    await ctx.runMutation(internal.tasks.addFromHook, { text: `crm:${req.body.order_id}:${req.body.status}` });
  },
});

export const billing = webhook({
  body: v.object({ event: v.object({ id: v.string() }), amount: v.number() }),
  handler: async (ctx, req): Promise<void> => {
    await ctx.runMutation(internal.tasks.addFromHook, { text: `billing:${req.body.amount}` });
  },
});


export const onMessage = pachcaEvent("message.new", {
  handler: async (ctx, event): Promise<void> => {
    await ctx.runMutation(internal.tasks.addFromHook, { text: `msg:${event.chat_id}:${event.content}` });
  },
});

export const onClick = pachcaEvent("button.click", {
  handler: async (ctx, event): Promise<void> => {
    await ctx.runMutation(internal.tasks.addFromHook, { text: `click:${event.data}` });
  },
});
