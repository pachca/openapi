import { v } from "@pachca/app-sdk/server";
import { internal } from "../_generated/api";
import { internalMutation, webhook } from "../_generated/server";

export const addFromHook = internalMutation({
  args: { owner: v.string(), text: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.insert("notes", { text: args.text, owner: args.owner });
  },
});

export const incoming = webhook({
  body: v.object({ owner: v.string(), text: v.string() }),
  handler: async (ctx, req): Promise<void> => {
    await ctx.runMutation(internal.hooks.addFromHook, { owner: req.body.owner, text: req.body.text.slice(0, 200) });
  },
});
