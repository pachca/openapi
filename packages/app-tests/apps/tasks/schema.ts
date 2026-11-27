import { defineSchema, defineTable, v } from "@pachca/app-sdk/server";

export default defineSchema({
  tasks: defineTable({ text: v.string(), done: v.boolean(), owner: v.string(), note: v.optional(v.string()), image: v.optional(v.file()) }).index("by_owner", ["owner"]),
});
