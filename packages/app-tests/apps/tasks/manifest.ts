import { defineManifest } from "@pachca/app-sdk/server";

export default defineManifest({
  description: "Список задач на SDK",
  pachca: { events: ["message.new", "button.click"] },
  webhooks: {
    orders: {
      signature: { header: "X-Signature", secret: "ORDERS_SECRET" },
      allow: ["127.0.0.1", "10.0.0.0/8"],
    },
    signed: { signature: { header: "X-Signature", secret: "ORDERS_SECRET" } },
    crm: { signature: { header: "X-Signature", secret: "ORDERS_SECRET" }, id: { header: "X-Event-Id" } },
    billing: { signature: { header: "X-Signature", secret: "ORDERS_SECRET" }, id: { json: "event.id" } },
    alerts: { allow: ["127.0.0.1", "10.0.0.0/8"] },
  },
});
