import { defineManifest } from "@pachca/app-sdk/server";

export default defineManifest({
  description: "__NAME__",
  db: true,
  pachca: {
    bot: ["messages:create"],
    events: ["message.new"],
  },
  webhooks: {
    incoming: { signature: { header: "X-Signature", secret: "INCOMING_SECRET" } },
  },
});
