import type { FunctionRef, JobId, JobStatus, Pachca } from "@pachca/app-sdk";
import type { JobsApi } from "@pachca/app-sdk/api";
import { useAction, useJob, useMutation, useQuery } from "../src/index.ts";

declare const send: FunctionRef<"job", { to: string }, { id: string }>;
declare const add: FunctionRef<"mutation", { text: string }, number>;
declare const list: FunctionRef<"query", {}, string[]>;
declare const get: FunctionRef<"query", { id: number }, string>;
declare const search: FunctionRef<"action", { q: string }, string[]>;
declare const p: Pachca;
declare const jobs: JobsApi;
type Eq<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
const is = <T extends true>(_: T) => {};

export function types() {
  const id = p.mutation(send, { to: "a" });
  is<Eq<typeof id, Promise<JobId<{ id: string }>>>>(true);
  is<Eq<ReturnType<typeof p.mutation<"mutation", { text: string }, number>>, Promise<number>>>(true);
  // @ts-expect-error действие не мутация
  p.mutation(search, { q: "x" });
  void p.query(jobs.get, { id: 1 as JobId }).then((s) => is<Eq<typeof s, JobStatus<unknown> | null>>(true));

  const job = useJob(send);
  void job.start({ to: "a" });
  // @ts-expect-error аргументы задания проверяются
  void job.start({ to: 1 });
  // @ts-expect-error useJob только для заданий
  useJob(add);
  is<Eq<typeof job.result, { id: string } | undefined>>(true);
  is<Eq<typeof job.id, JobId<{ id: string }> | undefined>>(true);

  const m = useMutation(add);
  void m({ text: "x" }).then((n) => is<Eq<typeof n, number>>(true));
  // @ts-expect-error задание запускается через useJob
  useMutation(send);
  // @ts-expect-error обязательные аргументы
  void m();

  is<Eq<ReturnType<typeof useQuery<typeof list>>, string[] | undefined>>(true);
  useQuery(list);
  useQuery(get, "skip");
  // @ts-expect-error обязательные аргументы
  useQuery(get);
  // @ts-expect-error не запрос
  useQuery(add, { text: "x" });

  const s = useAction(search);
  void s({ q: "x" });
}
