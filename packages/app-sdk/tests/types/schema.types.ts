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

export const same: Id<"projects"> = task.project;
export const legacy: Task["project"] = task.legacy;
export const parent: Id<"tasks"> | undefined = task.parent;
export const ok: Pick<Task, "project" | "legacy"> = { project: projectId, legacy: projectId };
// @ts-expect-error ссылка на другую таблицу
export const wrongTable: Task["project"] = taskId;
// @ts-expect-error число не id
export const plainNumber: Task["project"] = 5;
export const refSchema: { type: string; "x-table"?: unknown; "x-ref"?: unknown } = v.ref("projects").schema;

declare const db: DbWriter<S>;
export async function writes() {
  await db.insert("tasks", { project: projectId, legacy: projectId });
  await db.patch("tasks", taskId, { parent: taskId });
  // @ts-expect-error в поле v.ref("projects") id задачи
  await db.insert("tasks", { project: taskId, legacy: projectId });
}
