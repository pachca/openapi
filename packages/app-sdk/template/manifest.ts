import { defineManifest } from "@pachca/app-sdk/server";

// Права и сеть приложения. Каждое право человек подтверждает при загрузке: не добавляйте лишнего.
export default defineManifest({
  description: "__NAME__",
  // Приложению нужна своя база (таблицы из schema.ts).
  db: true,
  pachca: {
    // бот приложения отвечает в чат (server/bot.ts)
    bot: ["messages:create"],
    // сообщения в чатах с ботом приложения
    events: ["message.new"],
  },
  // Внешний сервис шлёт POST на /_hooks/<имя> хоста приложения (server/hooks.ts). Подпись: HMAC-SHA256 от тела в
  // заголовке X-Signature, секрет человек задаёт командой `npx pachca-app secret set INCOMING_SECRET`.
  webhooks: {
    incoming: { signature: { header: "X-Signature", secret: "INCOMING_SECRET" } },
  },
});
