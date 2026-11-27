import { defineManifest } from "@pachca/app-sdk/server";

// Эталонная сборка: каждое поле манифеста, которое читает платформа.
export default defineManifest({
  description: "Эталонная сборка контракта",
  fetch: ["api.example.com"],
  browser: ["*.tiles.example.com"],
  secrets: { API_KEY: { host: "api.example.com", header: "Authorization", prefix: "Bearer " } },
  pachca: { bot: ["messages:create"], user: ["chats:read"], events: ["message.new"] },
  webhooks: {
    orders: { signature: { header: "X-Signature", secret: "ORDERS_SECRET" }, id: { header: "X-Event-Id" } },
    alerts: { allow: ["10.0.0.0/8"] },
  },
});
