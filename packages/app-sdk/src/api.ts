import type { ApiFromModules, FunctionRef, InternalFromModules } from "./server.js";

import type { JobsApi } from "./index.js";

export type { ApiFromModules, FunctionRef, InternalFromModules, JobsApi };

/** `api.tasks.list` даёт ссылку с именем `tasks.list`. Типы накладывает `_generated/api.ts`. */
export const anyApi: unknown = (function path(parts: string[]): unknown {
  return new Proxy(Object.create(null), {
    get: (_, prop) => (prop === "_name" ? parts.join(".") : typeof prop === "string" ? path([...parts, prop]) : undefined),
  });
})([]);

/** Встроенные функции заданий `_jobs.get` и `_jobs.cancel`. `_generated/api.ts` кладёт их в `api._jobs`. */
export const jobsApi = (anyApi as { _jobs: JobsApi })._jobs;
