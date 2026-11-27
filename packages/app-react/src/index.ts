import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import type {
  FunctionError,
  FunctionRef,
  JobId,
  JobState,
  JobStatus,
  OptimisticStore,
  Pachca,
} from "@pachca/app-sdk";
import { jobsApi } from "@pachca/app-sdk/api";

export type { FunctionError, FunctionRef, JobId, JobState, JobStatus, OptimisticStore };

const client = (): Pachca => {
  const p = (globalThis as { pachca?: Pachca }).pachca;
  if (!p) throw new Error("window.pachca нет: приложение открыто не через платформу Пачки или без Vite-плагина @pachca/app-sdk/vite");
  return p;
};

/** Ошибка вызова функции: `code` из `AppError` сервера, `connection_lost`, `version_changed` и другие. */
export function isFunctionError(e: unknown): e is FunctionError {
  const p = (globalThis as { pachca?: Pachca }).pachca;
  return p ? e instanceof p.FunctionError : false;
}

type AnyRef<K extends "query" | "mutation" | "action" | "job"> = FunctionRef<K, any, any>;
type ArgsOf<F> = F extends FunctionRef<any, infer A, any> ? A : never;
type ResultOf<F> = F extends FunctionRef<any, any, infer R> ? R : never;
/** Аргументы можно опустить, если все поля необязательны (например `{}`). */
type OptionalArgs<A> = {} extends A ? [args?: A] : [args: A];

const keyOf = (name: string, args: unknown) => `${name}\u0000${JSON.stringify(args ?? {})}`;

/**
 * Живое значение запроса: `undefined`, пока грузится, дальше каждое изменение данных на сервере. Ошибка запроса
 * бросается при рендере и ловится ближайшим Error Boundary. `"skip"` вместо аргументов не подписывается (значение `undefined`).
 *
 *   const notes = useQuery(api.notes.list);
 *   const task = useQuery(api.tasks.get, id ? { id } : "skip");
 */
export function useQuery<F extends AnyRef<"query">>(
  ref: F,
  ...rest: {} extends ArgsOf<F> ? [args?: ArgsOf<F> | "skip"] : [args: ArgsOf<F> | "skip"]
): ResultOf<F> | undefined {
  const args = rest[0] ?? {};
  const skip = args === "skip";
  const key = skip ? null : keyOf(ref._name, args);
  const [state, setState] = useState<{ key: string | null; value?: unknown; error?: FunctionError }>({ key: null });
  const argsRef = useRef(args);
  argsRef.current = args;
  useEffect(() => {
    if (key === null) return;
    return client().subscribe(ref, argsRef.current as ArgsOf<F>, (value) => setState({ key, value }), {
      onError: (error) => setState({ key, error }),
    });
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps
  if (key === null || state.key !== key) return undefined;
  if (state.error) throw state.error;
  return state.value as ResultOf<F>;
}

/** Функция мутации; `withOptimisticUpdate` даёт её же с оптимистичным обновлением живых запросов. */
export interface ReactMutation<F extends AnyRef<"mutation">> {
  (...args: OptionalArgs<ArgsOf<F>>): Promise<ResultOf<F>>;
  /**
   * Та же мутация, но сразу показывает ожидаемый результат: `update` меняет живые запросы через `store.setQuery`. Слой
   * держится, пока сервер не подтвердит запись, и заменяется настоящим значением, при отказе просто снимается.
   */
  withOptimisticUpdate(update: (store: OptimisticStore, args: ArgsOf<F>) => void): ReactMutation<F>;
}

function makeMutation<F extends AnyRef<"mutation">>(ref: F, update?: (store: OptimisticStore, args: ArgsOf<F>) => void): ReactMutation<F> {
  const run = ((args?: ArgsOf<F>) =>
    client().mutation(ref, (args ?? {}) as ArgsOf<F>, update ? { optimisticUpdate: update } : undefined)) as unknown as ReactMutation<F>;
  run.withOptimisticUpdate = (u) => makeMutation(ref, u);
  return run;
}

/**
 * Мутация. Выполняется ровно один раз, даже если связь оборвалась, и по порядку вызовов. Промис отклоняется
 * `FunctionError` с `code` из `AppError`, если сервер отказал.
 *
 *   const add = useMutation(api.notes.add).withOptimisticUpdate((store, { text }) => { … });
 *   await add({ text });
 */
export function useMutation<F extends AnyRef<"mutation">>(ref: F): ReactMutation<F> {
  return useMemo(() => makeMutation(ref), [ref._name]); // eslint-disable-line react-hooks/exhaustive-deps
}

/**
 * Действие: внешний вызов, повтор которого безвреден (поиск, чтение). Выполняется не больше одного раза, при обрыве связи
 * промис отклоняется с кодом `connection_lost`. То, что нельзя повторять (письмо, платёж), делайте `job` и `useJob`.
 */
export function useAction<F extends AnyRef<"action">>(ref: F): (...args: OptionalArgs<ArgsOf<F>>) => Promise<ResultOf<F>> {
  return useCallback(
    (args?: ArgsOf<F>) => client().action(ref, (args ?? {}) as ArgsOf<F>),
    [ref._name] // eslint-disable-line react-hooks/exhaustive-deps
  ) as (...args: OptionalArgs<ArgsOf<F>>) => Promise<ResultOf<F>>;
}

/** Ошибка задания или его запуска: код и текст `AppError` обработчика, иначе `job_failed`. */
export type JobError = { readonly code: string; readonly message: string };

export interface JobStatusView<R> {
  /** Состояние: `starting` пока платформа принимает запуск, дальше как в `_scheduled`. `undefined` до запуска. */
  readonly state: JobState | "starting" | undefined;
  /** Результат после `success` (то, что вернул обработчик). */
  readonly result: R | undefined;
  /** Ошибка после `failed` или отказа запуска (неверные аргументы, `AppError` при постановке). */
  readonly error: JobError | undefined;
  /** Задание ещё не закончилось: `starting`, `pending` или `running`. */
  readonly isRunning: boolean;
}

export interface ReactJob<F extends AnyRef<"job">> extends JobStatusView<ResultOf<F>> {
  /** Номер задания, запущенного этим хуком или подхваченного из `localStorage` после перезагрузки. */
  readonly id: JobId<ResultOf<F>> | undefined;
  /**
   * Запускает задание и следит за ним. Платформа выполнит его не больше одного раза; запуск, как мутация, не теряется при
   * обрыве связи. Промис не отклоняется: отказ запуска попадает в `error`, номер задания приходит в промисе и в `id`.
   */
  start(...args: OptionalArgs<ArgsOf<F>>): Promise<JobId<ResultOf<F>> | undefined>;
  /** Отменяет задание, которое ещё не началось (`pending`). `true`, если отменено. Начавшееся доработает до конца. */
  cancel(): Promise<boolean>;
  /** Забывает задание: хук снова готов к запуску. Само задание это не отменяет. */
  reset(): void;
}

const NO_STATUS: JobStatusView<never> = { state: undefined, result: undefined, error: undefined, isRunning: false };

function view<R>(status: JobStatus<R> | null | undefined, error?: JobError): JobStatusView<R> {
  if (error) return { state: "failed", result: undefined, error, isRunning: false };
  if (!status) return NO_STATUS;
  const running = status.state === "pending" || status.state === "running";
  return {
    state: status.state,
    result: status.state === "success" ? (status.result as R) : undefined,
    error: status.error ?? undefined,
    isRunning: running,
  };
}

function useJobLive<R>(id: JobId<R> | undefined | null) {
  const [state, setState] = useState<{ id?: number; status?: JobStatus<R> | null; error?: JobError }>({});
  useEffect(() => {
    if (id == null) return;
    return client().subscribe(jobsApi.get, { id }, (status) => setState({ id, status: status as JobStatus<R> | null }), {
      onError: (e) => setState({ id, error: { code: e.code, message: e.message } }),
    });
  }, [id]);
  const current = id != null && state.id === id;
  return {
    view: current ? view(state.status, state.error) : (NO_STATUS as JobStatusView<R>),
    missing: current && !state.error && state.status === null,
  };
}

/**
 * Живой статус задания по номеру, например сохранённому в базе или `localStorage`. Видно только своё задание: чужое и
 * несуществующее дают `state: undefined`.
 */
export function useJobStatus<R = unknown>(id: JobId<R> | undefined | null): JobStatusView<R> {
  return useJobLive(id).view;
}

export interface UseJobOptions {
  /**
   * Под каким именем хук помнит номер задания в `localStorage` приложения, чтобы после перезагрузки iframe (новая версия,
   * закрытое окно) снова показать его статус и результат. По умолчанию имя функции. Свой ключ нужен, когда одно задание
   * запускают несколько мест сразу (например, по строке таблицы: `key: "send:" + row._id`). `null` ничего не хранит.
   */
  readonly key?: string | null;
}

const STORE_PREFIX = "pachca:job:";
const stored = {
  get(key: string | null): number | undefined {
    if (key === null) return undefined;
    try {
      const n = Number(globalThis.localStorage?.getItem(STORE_PREFIX + key));
      return Number.isInteger(n) && n > 0 ? n : undefined;
    } catch {
      return undefined;
    }
  },
  set(key: string | null, id: number | undefined) {
    if (key === null) return;
    try {
      if (id == null) globalThis.localStorage?.removeItem(STORE_PREFIX + key);
      else globalThis.localStorage?.setItem(STORE_PREFIX + key, String(id));
    } catch {
    }
  },
};

/**
 * Задание (`job` на сервере): внешний вызов, который что-то меняет и который нельзя повторять (письмо, платёж, запись в CRM).
 * Номер последнего запуска хук хранит в `localStorage` и после перезагрузки iframe подхватывает задание: статус и результат
 * остаются видны, пока не вызван `reset` или новый `start`.
 *
 *   const send = useJob(api.mail.send);
 *   <button disabled={send.isRunning} onClick={() => send.start({ to, text })}>Отправить</button>
 *   {send.state === "success" && <p>Отправлено, id {send.result?.id}</p>}
 *   {send.error && <p>{send.error.message}</p>}
 */
export function useJob<F extends AnyRef<"job">>(ref: F, options?: UseJobOptions): ReactJob<F> {
  type R = ResultOf<F>;
  const key = options?.key === undefined ? ref._name : options.key;
  type Run = { n: number; key: string | null; id?: JobId<R>; restored?: boolean; starting?: boolean; error?: JobError };
  const restore = (n: number): Run => {
    const id = stored.get(key) as JobId<R> | undefined;
    return id == null ? { n, key } : { n, key, id, restored: true };
  };
  const [state, setRun] = useState<Run>(() => restore(0));
  const counter = useRef(0);
  const run = state.key === key ? state : restore(++counter.current);
  if (run !== state) setRun(run);
  const live = useJobLive<R>(run.id);

  useEffect(() => {
    if (!run.restored || !live.missing) return;
    stored.set(key, undefined);
    setRun((r) => (r.n === run.n ? { n: ++counter.current, key } : r));
  }, [run.restored, run.n, live.missing, key]);

  const start = useCallback(async (args?: ArgsOf<F>) => {
    const n = ++counter.current;
    stored.set(key, undefined);
    setRun({ n, key, starting: true });
    try {
      const id = (await client().mutation(ref, (args ?? {}) as ArgsOf<F>)) as JobId<R>;
      if (counter.current === n) {
        stored.set(key, id);
        setRun({ n, key, id });
      }
      return id;
    } catch (e) {
      const error = isFunctionError(e) ? { code: e.code, message: e.message } : { code: "start_failed", message: String((e as Error)?.message ?? e) };
      if (counter.current === n) setRun({ n, key, error });
      return undefined;
    }
  }, [ref._name, key]); // eslint-disable-line react-hooks/exhaustive-deps

  const cancel = useCallback(async () => (run.id == null ? false : client().mutation(jobsApi.cancel, { id: run.id })), [run.id]);
  const reset = useCallback(() => {
    stored.set(key, undefined);
    setRun({ n: ++counter.current, key });
  }, [key]);

  const status: JobStatusView<R> = run.starting
    ? { state: "starting", result: undefined, error: undefined, isRunning: true }
    : run.error
      ? view<R>(null, run.error)
      :
        run.id != null && live.view.state === undefined && !live.missing
        ? { state: "pending", result: undefined, error: undefined, isRunning: true }
        : live.view;
  return { ...status, id: run.id, start: start as ReactJob<F>["start"], cancel, reset };
}


export type Theme = "light" | "dark";

export interface PachcaEnv {
  /** Тема окна Пачки. Меняется на лету: хост шлёт её мосту, мост ставит `<html data-pachca-theme>`. */
  readonly theme: Theme;
}

const readTheme = (): Theme => {
  const t = typeof document === "undefined" ? null : document.documentElement.getAttribute("data-pachca-theme");
  if (t === "dark" || t === "light") return t;
  return typeof matchMedia === "function" && matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

const subscribeTheme = (onChange: () => void) => {
  if (typeof MutationObserver === "undefined") return () => {};
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-pachca-theme"] });
  return () => observer.disconnect();
};

/**
 * Окружение Пачки. Сейчас это тема окна (`light` или `dark`), она меняется без перезагрузки. Для оформления хватает CSS
 * `:root[data-pachca-theme="dark"]`, хук нужен, когда тема влияет на код (графики, canvas). Пользователь приложения есть
 * только на сервере (`ctx.actor`).
 */
export function usePachca(): PachcaEnv {
  const theme = useSyncExternalStore(subscribeTheme, readTheme, () => "light" as Theme);
  return useMemo(() => ({ theme }), [theme]);
}
