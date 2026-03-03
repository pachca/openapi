/**
 * Echo bot example demonstrating the Pachca TypeScript SDK.
 *
 * Runs 8 steps that exercise the core API patterns:
 * create, read, nested resource, idempotent POST, thread reply, pin, update, unpin.
 *
 * Usage:
 *
 *   PACHCA_TOKEN=your_token PACHCA_CHAT_ID=12345 bun run examples/main.ts
 */

import { Pachca } from "../src/index.js";

const token = process.env.PACHCA_TOKEN;
const chatIdStr = process.env.PACHCA_CHAT_ID;

if (!token || !chatIdStr) {
  console.error("Set PACHCA_TOKEN and PACHCA_CHAT_ID environment variables");
  process.exit(1);
}

const chatId = Number(chatIdStr);
const pachca = new Pachca({ token });

// ── Step 1: POST — Create a message ──────────────────────────────
console.log("1. Creating message...");
const { data: created } = await pachca.messages.createMessage({
  body: {
    message: {
      entity_type: "discussion",
      entity_id: chatId,
      content: "SDK test TypeScript 🚀",
    },
  },
});
const msgId = created!.data.id;
console.log(`   Created message ID: ${msgId}`);

// ── Step 2: GET — Read the message back ──────────────────────────
console.log("2. Reading message...");
const { data: msg } = await pachca.messages.getMessage({
  path: { id: msgId },
});
console.log(`   Got message: "${msg!.data.content}"`);

// ── Step 3: POST — Add a reaction (nested resource) ──────────────
console.log("3. Adding reaction...");
await pachca.reactions.addReaction({
  path: { id: msgId },
  body: { code: "👀" },
});
console.log("   Added reaction 👀");

// ── Step 4: POST — Create a thread (idempotent) ──────────────────
console.log("4. Creating thread...");
const { data: thread } = await pachca.threads.createThread({
  path: { id: msgId },
});
console.log(`   Thread ID: ${thread!.data.id}`);

// ── Step 5: POST — Reply inside the thread ───────────────────────
console.log("5. Replying in thread...");
const { data: reply } = await pachca.messages.createMessage({
  body: {
    message: {
      entity_type: "thread",
      entity_id: thread!.data.id,
      content: `Echo: ${msg!.data.content}`,
    },
  },
});
const replyId = reply!.data.id;
console.log(`   Reply ID: ${replyId}`);

// ── Step 6: POST — Pin the original message ──────────────────────
console.log("6. Pinning message...");
await pachca.messages.pinMessage({ path: { id: msgId } });
console.log("   Pinned");

// ── Step 7: PUT — Edit the reply ─────────────────────────────────
console.log("7. Updating reply...");
await pachca.messages.updateMessage({
  path: { id: replyId },
  body: {
    message: {
      content: `${reply!.data.content} (processed at ${new Date().toISOString()})`,
    },
  },
});
console.log("   Updated");

// ── Step 8: DELETE — Unpin the original message ──────────────────
console.log("8. Unpinning message...");
await pachca.messages.unpinMessage({ path: { id: msgId } });
console.log("   Unpinned");

console.log("\nDone! All 8 steps completed.");
