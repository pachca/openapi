import assert from "node:assert/strict";
import { expect, test } from "vitest";
import { Component, act, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import type { FunctionRef, JobId, JobStatus, OptimisticStore, Pachca } from "@pachca/app-sdk";
import jobs from "@pachca/app-sdk/contract/jobs.json" with { type: "json" };
import { useAction, useJob, useJobStatus, useMutation, usePachca, useQuery } from "../src/index.ts";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

class FakeError extends Error {
  readonly name = "FunctionError" as const;
  constructor(readonly status: number, readonly code: string, message: string) {
    super(message);
  }
}

type Sub = { name: string; args: unknown; onData: (v: unknown) => void; onError?: (e: FakeError) => void; closed: boolean };

function fake() {
  const subs: Sub[] = [];
  const calls: { kind: string; name: string; args: unknown; optimistic: boolean }[] = [];
  const answers = new Map<string, (args: any) => unknown>();
  const answer = (name: string, args: unknown) => {
    const fn = answers.get(name);
    return fn ? Promise.resolve().then(() => fn(args)) : Promise.resolve(null);
  };
  const p: Pachca = {
    files: {} as Pachca["files"],
    download: async () => "downloaded",
    query: (ref, args) => answer(ref._name, args) as never,
    mutation: ((ref: FunctionRef<any, any, any>, args: unknown, o?: { optimisticUpdate?: unknown }) => {
      calls.push({ kind: "mutation", name: ref._name, args, optimistic: !!o?.optimisticUpdate });
      return answer(ref._name, args);
    }) as Pachca["mutation"],
    action: (ref, args) => {
      calls.push({ kind: "action", name: ref._name, args, optimistic: false });
      return answer(ref._name, args) as never;
    },
    subscribe: (ref, args, onData, h) => {
      const s: Sub = { name: ref._name, args, onData: onData as never, onError: h?.onError as never, closed: false };
      subs.push(s);
      return () => void (s.closed = true);
    },
    FunctionError: FakeError as never,
  };
  (globalThis as { pachca?: Pachca }).pachca = p;
  const open = (name: string) => subs.filter((s) => s.name === name && !s.closed);
  return { subs, calls, answers, open };
}

const ref = <K extends "query" | "mutation" | "action" | "job", A, R>(kind: K, name: string) =>
  ({ _name: name, _kind: kind }) as unknown as FunctionRef<K, A, R>;

const list = ref<"query", { owner?: string }, string[]>("query", "notes.list");
const get = ref<"query", { id: number }, string>("query", "notes.get");
const add = ref<"mutation", { text: string }, number>("mutation", "notes.add");
const search = ref<"action", { q: string }, string[]>("action", "notes.search");
const send = ref<"job", { to: string }, { id: string }>("job", "mail.send");

async function render(node: ReactNode) {
  const el = document.createElement("div");
  document.body.append(el);
  const root = createRoot(el);
  await act(async () => root.render(node));
  return { el, unmount: () => act(() => root.unmount()) };
}

class Boundary extends Component<{ children: ReactNode }, { error?: Error }> {
  state: { error?: Error } = {};
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    return this.state.error ? <p>ошибка {(this.state.error as FakeError).code}</p> : this.props.children;
  }
}

test("useQuery: undefined пока грузится, дальше живое значение", async () => {
  const f = fake();
  const seen: (string[] | undefined)[] = [];
  function App() {
    const rows = useQuery(list);
    seen.push(rows);
    return <p>{rows === undefined ? "грузится" : rows.join(",")}</p>;
  }
  const r = await render(<App />);
  assert.equal(r.el.textContent, "грузится");
  assert.equal(f.open("notes.list").length, 1);
  assert.deepEqual(f.open("notes.list")[0]!.args, {});
  await act(async () => f.open("notes.list")[0]!.onData(["a"]));
  assert.equal(r.el.textContent, "a");
  await act(async () => f.open("notes.list")[0]!.onData(["a", "b"]));
  assert.equal(r.el.textContent, "a,b");
  await r.unmount();
  assert.equal(f.open("notes.list").length, 0, "отписка при размонтировании");
});

test("useQuery: новый литерал тех же аргументов не пересоздаёт подписку, новые аргументы пересоздают", async () => {
  const f = fake();
  let setId: (n: number) => void = () => {};
  let tick: () => void = () => {};
  const { useState } = await import("react");
  function App() {
    const [id, set] = useState(1);
    const [, force] = useState(0);
    setId = set;
    tick = () => force((n) => n + 1);
    const v = useQuery(get, { id });
    return <p>{v ?? "…"}</p>;
  }
  const r = await render(<App />);
  await act(async () => f.open("notes.get")[0]!.onData("первая"));
  await act(async () => tick());
  assert.equal(f.subs.length, 1);
  await act(async () => setId(2));
  assert.equal(r.el.textContent, "…", "значение старых аргументов не показывается для новых");
  assert.equal(f.subs.length, 2);
  assert.equal(f.subs[0]!.closed, true);
  assert.deepEqual(f.open("notes.get")[0]!.args, { id: 2 });
  await r.unmount();
});

test("useQuery: skip не подписывается", async () => {
  const f = fake();
  function App() {
    const v = useQuery(get, "skip");
    return <p>{v === undefined ? "нет" : v}</p>;
  }
  const r = await render(<App />);
  assert.equal(f.subs.length, 0);
  assert.equal(r.el.textContent, "нет");
  await r.unmount();
});

test("useQuery: ошибка запроса уходит в Error Boundary", async () => {
  const f = fake();
  function App() {
    const v = useQuery(list, {});
    return <p>{String(v)}</p>;
  }
  const orig = console.error;
  console.error = () => {};
  try {
    const r = await render(
      <Boundary>
        <App />
      </Boundary>
    );
    await act(async () => f.open("notes.list")[0]!.onError!(new FakeError(403, "forbidden", "нельзя")));
    assert.equal(r.el.textContent, "ошибка forbidden");
    await r.unmount();
  } finally {
    console.error = orig;
  }
});

test("useMutation: вызов, стабильная функция и оптимистичное обновление", async () => {
  const f = fake();
  f.answers.set("notes.add", () => 7);
  const fns: unknown[] = [];
  let call: (text: string) => Promise<number> = async () => 0;
  let callOptimistic: (text: string) => Promise<number> = async () => 0;
  let rerender: () => void = () => {};
  const { useState } = await import("react");
  function App() {
    const [, force] = useState(0);
    rerender = () => force((n) => n + 1);
    const m = useMutation(add);
    fns.push(m);
    call = (text) => m({ text });
    const opt = m.withOptimisticUpdate((store: OptimisticStore, a) => {
      store.setQuery(list, {}, [...(store.getQuery(list, {}) ?? []), a.text]);
    });
    callOptimistic = (text) => opt({ text });
    return null;
  }
  const r = await render(<App />);
  assert.equal(await call("x"), 7);
  assert.equal(await callOptimistic("y"), 7);
  assert.deepEqual(f.calls, [
    { kind: "mutation", name: "notes.add", args: { text: "x" }, optimistic: false },
    { kind: "mutation", name: "notes.add", args: { text: "y" }, optimistic: true },
  ]);
  await act(async () => rerender());
  assert.equal(fns[0], fns[fns.length - 1], "та же функция между рендерами");
  await r.unmount();
});

test("useMutation: отказ сервера отклоняет промис FunctionError", async () => {
  const f = fake();
  f.answers.set("notes.add", () => {
    throw new FakeError(409, "taken", "занято");
  });
  let call: () => Promise<number> = async () => 0;
  function App() {
    const m = useMutation(add);
    call = () => m({ text: "x" });
    return null;
  }
  const r = await render(<App />);
  await assert.rejects(call(), (e: FakeError) => e.code === "taken");
  await r.unmount();
});

test("useAction: вызывает действие с аргументами", async () => {
  const f = fake();
  f.answers.set("notes.search", (a: { q: string }) => [a.q]);
  let call: () => Promise<string[]> = async () => [];
  function App() {
    const s = useAction(search);
    call = () => s({ q: "кот" });
    return null;
  }
  const r = await render(<App />);
  assert.deepEqual(await call(), ["кот"]);
  assert.equal(f.calls[0]!.kind, "action");
  await r.unmount();
});

test("useJob: start ставит задание, статус живой, результат и отмена", async () => {
  const f = fake();
  f.answers.set("mail.send", () => 42);
  f.answers.set("_jobs.cancel", (a: { id: number }) => a.id === 42);
  let job!: ReturnType<typeof useJob<typeof send>>;
  function App() {
    job = useJob(send);
    return <p>{job.state ?? "нет"}</p>;
  }
  const r = await render(<App />);
  assert.equal(job.state, undefined);
  assert.equal(job.isRunning, false);

  let started: Promise<JobId<{ id: string }> | undefined> = Promise.resolve(undefined);
  await act(async () => {
    started = job.start({ to: "a@b" });
  });
  assert.equal(await started, 42);
  assert.deepEqual(f.calls[0], { kind: "mutation", name: "mail.send", args: { to: "a@b" }, optimistic: false });
  assert.equal(job.id, 42);
  assert.equal(job.state, "pending", "до первого статуса задание ждёт");
  assert.equal(job.isRunning, true);
  const sub = f.open("_jobs.get")[0]!;
  assert.deepEqual(sub.args, { id: 42 });

  const st = (s: Partial<JobStatus<{ id: string }>>): JobStatus<{ id: string }> => ({ state: "pending", result: null, error: null, runAt: 1, finishedAt: null, ...s });
  await act(async () => sub.onData(st({ state: "running" })));
  assert.equal(r.el.textContent, "running");
  assert.equal(await job.cancel(), true);
  assert.equal(f.calls[1]!.name, "_jobs.cancel");
  assert.deepEqual(f.calls[1]!.args, { id: 42 });

  await act(async () => sub.onData(st({ state: "success", result: { id: "m1" }, finishedAt: 2 })));
  assert.equal(job.state, "success");
  assert.equal(job.isRunning, false);
  assert.deepEqual(job.result, { id: "m1" });
  assert.equal(job.error, undefined);

  await act(async () => job.reset());
  assert.equal(job.state, undefined);
  assert.equal(job.id, undefined);
  assert.equal(f.open("_jobs.get").length, 0, "после reset статус не слушается");
  await r.unmount();
});

test("useJob: ошибка задания и отказ запуска попадают в error, промис start не отклоняется", async () => {
  const f = fake();
  let n = 0;
  f.answers.set("mail.send", () => {
    if (n++ === 0) return 5;
    throw new FakeError(400, "invalid_args", "to: ожидается string");
  });
  let job!: ReturnType<typeof useJob<typeof send>>;
  function App() {
    job = useJob(send);
    return null;
  }
  const r = await render(<App />);
  await act(async () => void (await job.start({ to: "x" })));
  await act(async () =>
    f.open("_jobs.get")[0]!.onData({ state: "failed", result: null, error: { code: "mail_rejected", message: "почта не приняла" }, runAt: 1, finishedAt: 2 })
  );
  assert.equal(job.state, "failed");
  assert.deepEqual(job.error, { code: "mail_rejected", message: "почта не приняла" });

  let id: unknown = "не тронут";
  await act(async () => void (id = await job.start({ to: "y" })));
  assert.equal(id, undefined);
  assert.equal(job.state, "failed");
  assert.deepEqual(job.error, { code: "invalid_args", message: "to: ожидается string" });
  assert.equal(job.id, undefined);
  assert.equal(await job.cancel(), false, "отменять нечего");
  await r.unmount();
});

test("useJob: номер задания переживает перезагрузку, reset и чужое задание его забывают", async () => {
  localStorage.clear();
  const f = fake();
  f.answers.set("mail.send", () => 77);
  let job!: ReturnType<typeof useJob<typeof send>>;
  function App() {
    job = useJob(send);
    return null;
  }
  let r = await render(<App />);
  await act(async () => void (await job.start({ to: "a" })));
  assert.equal(localStorage.getItem("pachca:job:mail.send"), "77");
  await r.unmount();

  r = await render(<App />);
  assert.equal(job.id, 77);
  assert.equal(job.state, "pending", "до первого статуса подхваченное задание ждёт");
  const sub = f.open("_jobs.get")[0]!;
  assert.deepEqual(sub.args, { id: 77 });
  await act(async () => sub.onData({ state: "success", result: { id: "m1" }, error: null, runAt: 1, finishedAt: 2 }));
  assert.equal(job.state, "success");
  assert.deepEqual(job.result, { id: "m1" });
  await act(async () => job.reset());
  assert.equal(localStorage.getItem("pachca:job:mail.send"), null);
  await r.unmount();

  localStorage.setItem("pachca:job:mail.send", "13");
  r = await render(<App />);
  assert.equal(job.id, 13);
  await act(async () => f.open("_jobs.get")[0]!.onData(null));
  assert.equal(job.id, undefined);
  assert.equal(job.state, undefined);
  assert.equal(localStorage.getItem("pachca:job:mail.send"), null);
  await r.unmount();
});

test("useJob: свой ключ разделяет места запуска, key: null ничего не хранит", async () => {
  localStorage.clear();
  const f = fake();
  let next = 1;
  f.answers.set("mail.send", () => next++);
  const jobs: Record<string, ReturnType<typeof useJob<typeof send>>> = {};
  function App() {
    jobs.a = useJob(send, { key: "send:1" });
    jobs.b = useJob(send, { key: "send:2" });
    jobs.off = useJob(send, { key: null });
    return null;
  }
  let r = await render(<App />);
  await act(async () => void (await jobs.a!.start({ to: "a" })));
  await act(async () => void (await jobs.b!.start({ to: "b" })));
  await act(async () => void (await jobs.off!.start({ to: "c" })));
  assert.deepEqual([localStorage.getItem("pachca:job:send:1"), localStorage.getItem("pachca:job:send:2"), localStorage.length], ["1", "2", 2]);
  await r.unmount();
  r = await render(<App />);
  assert.deepEqual([jobs.a!.id, jobs.b!.id, jobs.off!.id], [1, 2, undefined]);
  await r.unmount();
  localStorage.clear();
});

test("useJobStatus: чужое или несуществующее задание без состояния", async () => {
  const f = fake();
  let s!: ReturnType<typeof useJobStatus>;
  function App({ id }: { id: JobId | undefined }) {
    s = useJobStatus(id);
    return null;
  }
  const r = await render(<App id={9 as JobId} />);
  await act(async () => f.open("_jobs.get")[0]!.onData(null));
  assert.equal(s.state, undefined);
  await r.unmount();
  const r2 = await render(<App id={undefined} />);
  assert.equal(f.open("_jobs.get").length, 0);
  await r2.unmount();
});

test("usePachca: тема из data-pachca-theme и её смена на лету", async () => {
  fake();
  document.documentElement.setAttribute("data-pachca-theme", "dark");
  function App() {
    return <p>{usePachca().theme}</p>;
  }
  const r = await render(<App />);
  assert.equal(r.el.textContent, "dark");
  await act(async () => {
    document.documentElement.setAttribute("data-pachca-theme", "light");
    await new Promise((res) => setTimeout(res, 0));
  });
  assert.equal(r.el.textContent, "light");
  await r.unmount();
});

test("без window.pachca хук объясняет, что не так", async () => {
  delete (globalThis as { pachca?: Pachca }).pachca;
  let err: unknown;
  function App() {
    const a = useAction(search);
    try {
      void a({ q: "x" });
    } catch (e) {
      err = e;
    }
    return null;
  }
  const r = await render(<App />);
  assert.match(String(err), /window\.pachca нет/);
  await r.unmount();
});

test("контракт: статус задания из _jobs.get (contract/jobs.json) разбирается useJobStatus", async () => {
  const same = (file: string, what: string, got: unknown, want: unknown) =>
    expect(got, `${what}: формат из @pachca/app-sdk/contract/${file}, его изменение требует подъёма версии протокола`).toStrictEqual(want);
  const f = fake();
  let s!: ReturnType<typeof useJobStatus>;
  function App() {
    s = useJobStatus(7 as JobId);
    return null;
  }
  const r = await render(<App />);
  same("refs.json", "подписка на статус задания", f.open("_jobs.get").map((x) => x.args), [{ id: 7 }]);
  for (const { status } of jobs.get) {
    await act(async () => f.open("_jobs.get")[0]!.onData(status));
    const st = status as JobStatus;
    same("jobs.json", `${st.state}: состояние`, s.state, st.state);
    same("jobs.json", `${st.state}: результат`, s.result, st.state === "success" ? st.result : undefined);
    same("jobs.json", `${st.state}: ошибка`, s.error, st.error ?? undefined);
    same("jobs.json", `${st.state}: идёт`, s.isRunning, st.state === "pending" || st.state === "running");
  }
  await act(async () => f.open("_jobs.get")[0]!.onData(jobs.foreign));
  same("jobs.json", "чужое задание", s.state, undefined);
  await r.unmount();
});
