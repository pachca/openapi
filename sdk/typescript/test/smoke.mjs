// Node ESM smoke test against the built dist/.
// Verifies the published artifact resolves under Node's strict ESM resolver
// (catches missing .js extensions in generated imports).
//
// Run after `npm run build`:
//   node test/smoke.mjs

import { PachcaClient, MessagesService } from "../dist/index.js";

class FakeMessages extends MessagesService {
  async getMessage(_id) {
    return { id: 1, content: "fake message" };
  }
}

const client = PachcaClient.stub({ messages: new FakeMessages() });

const msg = await client.messages.getMessage(1);
if (msg.content !== "fake message" || msg.id !== 1) {
  console.error("smoke failed: unexpected stub response", msg);
  process.exit(1);
}
console.log("smoke ok");
