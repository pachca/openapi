/**
 * Webhook polling example — continuously process new webhook deliveries.
 *
 * Usage:
 *   PACHCA_TOKEN=your_token bun run examples/polling.ts
 *   PACHCA_TOKEN=your_token bun run examples/polling.ts --payloads
 */

import { PachcaClient } from "../src/index.js";

const token = process.env.PACHCA_TOKEN;
if (!token) {
  console.error("Set PACHCA_TOKEN environment variable");
  process.exit(1);
}

const pollPayloadsOnly = process.argv.includes("--payloads");
const client = new PachcaClient(token);
const startedAt = new Date();

console.log("Webhook polling worker started");
console.log("poll_limit=50 poll_interval=2s");
console.log(`waiting_for_events_created_after=${startedAt.toISOString()}`);

if (pollPayloadsOnly) {
  for await (const payload of client.bots.pollWebhookPayloads({
    limit: 50,
    intervalMs: 2_000,
    createdAfter: startedAt,
    maxSeenDeliveryIds: 5_000,
  })) {
    console.log(payload);
  }
} else {
  for await (const event of client.bots.pollWebhookEvents({
    limit: 50,
    intervalMs: 2_000,
    createdAfter: startedAt,
    maxSeenDeliveryIds: 5_000,
  })) {
    console.log(event);
  }
}
