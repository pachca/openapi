/**
 * HTTP client example — using pre-configured headers with optional proxy.
 *
 * Demonstrates the config-object constructor.
 *
 * Usage:
 *
 *   PACHCA_TOKEN=your_token PACHCA_CHAT_ID=12345 bun run examples/httpclient.ts
 *
 * With proxy (Node.js):
 *   import { ProxyAgent, setGlobalDispatcher } from "undici";
 *   setGlobalDispatcher(new ProxyAgent("http://proxy:8080"));
 */

import { PachcaClient } from "../src/index.js";

const token = process.env.PACHCA_TOKEN;
const chatId = Number(process.env.PACHCA_CHAT_ID);
if (!token || !chatId) {
  console.error("Set PACHCA_TOKEN and PACHCA_CHAT_ID environment variables");
  process.exit(1);
}

const client = new PachcaClient({
  headers: { Authorization: `Bearer ${token}` },
});

const chat = await client.chats.getChat(chatId);
console.log(`Chat: ${chat.name} (id=${chat.id})`);
