import { defineSchema, defineTable, v } from "@pachca/app-sdk/server";

export default defineSchema({
  notes: defineTable({ text: v.string(), owner: v.string() }).index("by_owner", ["owner"]),
});
