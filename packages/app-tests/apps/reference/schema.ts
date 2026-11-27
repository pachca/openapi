import { defineSchema, defineTable, v } from "@pachca/app-sdk/server";

export default defineSchema({
  lists: defineTable({ title: v.string(), owner: v.string() }).index("by_owner", ["owner"]),
  items: defineTable({
    list: v.ref("lists"),
    prev: v.optional(v.id("items")),
    text: v.string(),
    rank: v.number(),
    done: v.boolean(),
    image: v.optional(v.file()),
  })
    .index("by_list", ["list", "done"])
    .index("by_rank", ["rank"]),
});
