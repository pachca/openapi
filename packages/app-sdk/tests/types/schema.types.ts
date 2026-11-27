// Проверка типов v.ref: файл не исполняется, его компилирует `tsc` в `test` и `typecheck`.
// Строка с `@ts-expect-error` падает, если ошибки типов там больше нет.
import { defineSchema, defineTable, v, type DbWriter, type Doc, type Id } from "../../src/server.ts";

const schema = defineSchema({
  projects: defineTable({ name: v.string() }),
  tasks: defineTable({ project: v.ref("projects"), parent: v.optional(v.ref("tasks")), legacy: v.id("projects") }),
});
type S = typeof schema;
type Task = Doc<S, "tasks">;

declare const task: Task;
declare const projectId: Id<"projects">;
declare const taskId: Id<"tasks">;

// тип v.ref совпадает с v.id: значения взаимозаменяемы, смена вида поля не трогает код
export const same: Id<"projects"> = task.project;
export const legacy: Task["project"] = task.legacy;
export const parent: Id<"tasks"> | undefined = task.parent;
export const ok: Pick<Task, "project" | "legacy"> = { project: projectId, legacy: projectId };
// @ts-expect-error ссылка на другую таблицу
export const wrongTable: Task["project"] = taskId;
// @ts-expect-error число не id
export const plainNumber: Task["project"] = 5;
// схема v.ref отличается от v.id только пометкой x-ref
export const refSchema: { type: string; "x-table"?: unknown; "x-ref"?: unknown } = v.ref("projects").schema;

declare const db: DbWriter<S>;
export async function writes() {
  await db.insert("tasks", { project: projectId, legacy: projectId });
  await db.patch("tasks", taskId, { parent: taskId });
  // @ts-expect-error в поле v.ref("projects") id задачи
  await db.insert("tasks", { project: taskId, legacy: projectId });
}
