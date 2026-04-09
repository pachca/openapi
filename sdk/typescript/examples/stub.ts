/**
 * Stub client example — unit-testing with dependency injection.
 *
 * Demonstrates PachcaClient.stub() with a custom MessagesService override.
 *
 * Usage:
 *
 *   bun run examples/stub.ts
 */

import { PachcaClient, MessagesService } from "../src/index.js";
import type { Message } from "../src/index.js";

class FakeMessages extends MessagesService {
  async getMessage(_id: number): Promise<Message> {
    return {
      id: 1,
      content: "fake message",
    } as Message;
  }
}

const client = PachcaClient.stub(
  undefined, undefined, undefined, undefined, undefined, undefined,
  new FakeMessages(),
);

const msg = await client.messages.getMessage(1);
console.log(`Got: "${msg.content}" (id=${msg.id})`);
