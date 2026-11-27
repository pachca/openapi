import { AppError, v, type Id } from "@pachca/app-sdk/server";
import { api, internal } from "../_generated/api";
import { action, internalAction, internalMutation, job, mutation, pachcaEvent, query, webhook } from "../_generated/server";

/** Задачи текущего пользователя, новые сверху. У задачи с картинкой `imageUrl`: подписанный адрес файла, живёт 10–20 минут. */
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
    // image: платформа сама проверит, что файл загружен этим пользователем и принадлежит этому приложению
    return ctx.db.insert("tasks", { text: args.text, done: false, owner: ctx.actor.id, note: args.note, image: args.image });
  },
});

/** Свои правила загрузки: только картинки до 5 МБ. Без этой функции фронт открывает сессию встроенной (любой файл в пределах лимитов платформы). */
export const uploadUrl = action({
  args: { filename: v.string(), size: v.number(), contentType: v.string() },
  handler: (ctx, args) => {
    if (!ctx.actor) throw new AppError("нужен пользователь", { code: "unauthorized", status: 401 });
    if (!args.contentType.startsWith("image/") || args.size > 5 << 20) throw new AppError("только картинки до 5 МБ", { code: "bad_image", status: 422 });
    return ctx.files.generateUploadUrl(args);
  },
});

/** Удаляет задачу вместе с картинкой: место в квоте освобождается сразу. */
export const remove = mutation({
  args: { id: v.id("tasks") },
  handler: async (ctx, args) => {
    const task = await ctx.db.get("tasks", args.id);
    if (!task || task.owner !== ctx.actor?.id) throw new Error("задача не найдена");
    await ctx.db.delete("tasks", args.id);
    if (task.image) await ctx.files.delete(task.image);
  },
});

/** Что известно о картинке задачи. */
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

/** Для проверки транзакций: записывает и падает, запись должна откатиться. */
export const addThenFail = mutation({
  args: { text: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.insert("tasks", { text: args.text, done: false, owner: ctx.actor?.id ?? "" });
    throw new Error("откат");
  },
});

/** Для проверки ожидаемого отказа: 409 с кодом приложения, а не 500. */
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

// ---- планировщик (ctx.scheduler): напоминание о задаче ставится мутацией, выполняет его платформа

/** Внутренняя функция: клиент её вызвать не может, только планировщик и другие функции. */
export const markReminded = internalMutation({
  args: { id: v.id("tasks") },
  handler: async (ctx, args) => {
    // в задании пользователя нет (ctx.actor равен null): note не содержит id, иначе актёр просочился бы в задание
    await ctx.db.patch("tasks", args.id, { note: ctx.actor ? `reminded:${ctx.actor.id}` : "reminded" });
  },
});

/** Напоминание через действие: оно не пишет в базу напрямую, а зовёт внутреннюю мутацию. */
export const remindViaAction = internalAction({
  args: { id: v.id("tasks") },
  handler: async (ctx, args): Promise<void> => {
    await ctx.runMutation(internal.tasks.markReminded, { id: args.id });
  },
});

/** Ставит напоминание. Возвращает id задания. Обработчик, который зовёт `internal.*`, нужно типизировать по возвращаемому значению:
 *  иначе TypeScript не выведет тип из-за круговой ссылки через `_generated/api`. */
export const remind = mutation({
  args: { id: v.id("tasks"), afterMs: v.number(), viaAction: v.optional(v.boolean()) },
  returns: v.id("_scheduled"),
  handler: (ctx, args): Promise<Id<"_scheduled">> =>
    ctx.scheduler.runAfter(args.afterMs, args.viaAction ? internal.tasks.remindViaAction : internal.tasks.markReminded, { id: args.id }),
});

/** По расписанию от имени пользователя действовать нельзя: в типах ctx.pachca.user нет, а обход типов падает понятной ошибкой. */
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

/** Откат мутации откатывает и постановку задания. */
export const remindThenFail = mutation({
  args: { id: v.id("tasks") },
  handler: async (ctx, args): Promise<void> => {
    await ctx.scheduler.runAfter(100, internal.tasks.markReminded, { id: args.id });
    throw new Error("откат");
  },
});

/** Состояние заданий читается обычным живым запросом. */
export const jobs = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query("_scheduled").collect();
    return rows.map((j) => ({ id: j._id, fn: j.fn, state: j.state, error: j.error ?? null, errorCode: j.errorCode ?? null }));
  },
});

// ---- задание (job): внешний вызов со статусом. Клиент запускает его сам и следит встроенным запросом `_jobs.get`

/** «Отправка письма»: в сеть не ходит, режим `mode` задаёт исход, `ms` растягивает выполнение. */
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

/** Задание с бэка: на фронте оно выглядит так же, как запущенное клиентом. */
export const sendJobLater = mutation({
  args: { text: v.string(), afterMs: v.number() },
  handler: (ctx, args): Promise<Id<"_scheduled">> => ctx.scheduler.runAfter(args.afterMs, api.tasks.sendJob, { text: args.text }),
});

// ---- вебхук внешнего сервиса (manifest.webhooks.orders): платформа проверила подпись и адрес, обработчик идёт без пользователя

/** Пишет задачу от имени вебхука. Внутренняя: клиент её вызвать не может. */
export const addFromHook = internalMutation({
  args: { text: v.string() },
  handler: async (ctx, args) => {
    if (ctx.actor) throw new Error("в вебхуке не должно быть пользователя"); // ctx.actor равен null
    await ctx.db.insert("tasks", { text: args.text, done: false, owner: "hook" });
  },
});

/** POST /_hooks/orders с телом {"text": "..."}: заказ превращается в задачу. */
export const orders = webhook({
  handler: async (ctx, req): Promise<void> => {
    const order = JSON.parse(req.body) as { text?: string };
    if (!order.text) throw new Error("в заказе нет text");
    await ctx.runMutation(internal.tasks.addFromHook, { text: order.text });
  },
});

/** POST /_hooks/signed: только подпись, с любого адреса. */
export const signed = webhook({
  handler: async (ctx, req): Promise<void> => {
    await ctx.runMutation(internal.tasks.addFromHook, { text: `signed:${req.body}` });
  },
});

/** POST /_hooks/alerts: только список адресов, без подписи. */
export const alerts = webhook({
  handler: async (ctx, req): Promise<void> => {
    await ctx.runMutation(internal.tasks.addFromHook, { text: `alert:${req.body}` });
  },
});

/**
 * POST /_hooks/crm: тело проверяет платформа (при неверном 400 без запуска обработчика), повтор узнаётся по X-Event-Id.
 * Проверочный запрос подключения {"type":"url_verification","challenge":"…"} получает эхо сразу, до очереди.
 */
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

/** POST /_hooks/billing: идентификатор события в теле (`event.id`). */
export const billing = webhook({
  body: v.object({ event: v.object({ id: v.string() }), amount: v.number() }),
  handler: async (ctx, req): Promise<void> => {
    await ctx.runMutation(internal.tasks.addFromHook, { text: `billing:${req.body.amount}` });
  },
});

// ---- события Пачки (manifest.pachca.events): платформа проверила подлинность, повтор отброшен, пользователя нет

/** Новое сообщение в чате с ботом: событие типизировано по схеме Пачки. */
export const onMessage = pachcaEvent("message.new", {
  handler: async (ctx, event): Promise<void> => {
    await ctx.runMutation(internal.tasks.addFromHook, { text: `msg:${event.chat_id}:${event.content}` });
  },
});

/** Нажатие кнопки под сообщением бота. */
export const onClick = pachcaEvent("button.click", {
  handler: async (ctx, event): Promise<void> => {
    await ctx.runMutation(internal.tasks.addFromHook, { text: `click:${event.data}` });
  },
});
