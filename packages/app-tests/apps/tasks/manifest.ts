import { defineManifest } from "@pachca/app-sdk/server";

// Права и сеть приложения. Права Пачки не нужны: только свои данные и вебхук внешнего сервиса заказов.
export default defineManifest({
  description: "Список задач на SDK",
  // События Пачки: обработчики в server/tasks.ts. Права бота не нужны, пока приложение ничего не пишет в чат.
  pachca: { events: ["message.new", "button.click"] },
  // Внешний сервис шлёт POST на /_hooks/<имя>; повторную доставку того же тела платформа отбрасывает.
  webhooks: {
    // и подпись (HMAC-SHA256 от тела, секрет ORDERS_SECRET), и адрес из списка
    orders: {
      signature: { header: "X-Signature", secret: "ORDERS_SECRET" },
      allow: ["127.0.0.1", "10.0.0.0/8"],
    },
    // только подпись: с любого адреса
    signed: { signature: { header: "X-Signature", secret: "ORDERS_SECRET" } },
    // CRM: идентификатор события в заголовке отличает два одинаковых заказа, тело проверяет платформа, а проверку адреса
    // при подключении (Slack-подобный url_verification) отвечает verify
    crm: { signature: { header: "X-Signature", secret: "ORDERS_SECRET" }, id: { header: "X-Event-Id" } },
    // идентификатор в теле: он подписан вместе с телом
    billing: { signature: { header: "X-Signature", secret: "ORDERS_SECRET" }, id: { json: "event.id" } },
    // только адрес: сервис, который подписывать не умеет
    alerts: { allow: ["127.0.0.1", "10.0.0.0/8"] },
  },
});
