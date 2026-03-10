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

import { PachcaClient, MessageCreateRequest, MessageUpdateRequest, ReactionRequest } from "../src/index.js";

const token = process.env.PACHCA_TOKEN;
const chatIdStr = process.env.PACHCA_CHAT_ID;

if (!token || !chatIdStr) {
  console.error("Set PACHCA_TOKEN and PACHCA_CHAT_ID environment variables");
  process.exit(1);
}

const chatId = Number(chatIdStr);
const client = new PachcaClient(token);

// ── Step 1: POST — Create a message ──────────────────────────────
console.log("1. Creating message...");
const created = await client.messages.createMessage({
  message: {
    entityId: chatId,
    content: "SDK test TypeScript 🚀",
  },
} as MessageCreateRequest);
const msgId = created.id;
console.log(`   Created message ID: ${msgId}`);

// ── Step 2: GET — Read the message back ──────────────────────────
console.log("2. Reading message...");
const msg = await client.messages.getMessage(msgId);
console.log(`   Got message: "${msg.content}"`);

// ── Step 3: POST — Add a reaction (nested resource) ──────────────
console.log("3. Adding reaction...");
await client.reactions.addReaction(msgId, { code: "👀" } as ReactionRequest);
console.log("   Added reaction 👀");

// ── Step 4: POST — Create a thread (idempotent) ──────────────────
console.log("4. Creating thread...");
const thread = await client.threads.createThread(msgId);
console.log(`   Thread ID: ${thread.id}`);

// ── Step 5: POST — Reply inside the thread ───────────────────────
console.log("5. Replying in thread...");
const reply = await client.messages.createMessage({
  message: {
    entityType: "thread",
    entityId: thread.id,
    content: `Echo: ${msg.content}`,
  },
} as MessageCreateRequest);
const replyId = reply.id;
console.log(`   Reply ID: ${replyId}`);

// ── Step 6: POST — Pin the original message ──────────────────────
console.log("6. Pinning message...");
await client.messages.pinMessage(msgId);
console.log("   Pinned");

// ── Step 7: PUT — Edit the reply ─────────────────────────────────
console.log("7. Updating reply...");
await client.messages.updateMessage(replyId, {
  message: {
    content: `${reply.content} (processed at ${new Date().toISOString()})`,
  },
} as MessageUpdateRequest);
console.log("   Updated");

// ── Step 8: DELETE — Unpin the original message ──────────────────
console.log("8. Unpinning message...");
await client.messages.unpinMessage(msgId);
console.log("   Unpinned");

console.log("\nDone! All 8 steps completed.");
