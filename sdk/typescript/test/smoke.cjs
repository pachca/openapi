// Node CommonJS smoke test against the built dist/cjs/.
// Verifies the package can be `require()`d from a CommonJS consumer.
//
// Run after `npm run build`:
//   node test/smoke.cjs

const { PachcaClient, MessagesService } = require("../dist/cjs/index.js");

class FakeMessages extends MessagesService {
  async getMessage(_id) {
    return { id: 1, content: "fake message" };
  }
}

const client = PachcaClient.stub(
  undefined, undefined, undefined, undefined, undefined, undefined,
  new FakeMessages(),
);

(async () => {
  const msg = await client.messages.getMessage(1);
  if (msg.content !== "fake message" || msg.id !== 1) {
    console.error("smoke failed: unexpected stub response", msg);
    process.exit(1);
  }
  console.log("smoke ok (cjs)");
})();
