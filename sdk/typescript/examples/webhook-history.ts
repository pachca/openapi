/**
 * Webhook history example — fetch recent webhook deliveries and inspect payload variants.
 *
 * Usage:
 *   PACHCA_TOKEN=your_token bun run examples/webhook-history.ts
 */

import { PachcaClient } from "../src/index.js";
import type {
  ButtonWebhookPayload,
  ChatMemberWebhookPayload,
  CompanyMemberWebhookPayload,
  LinkSharedWebhookPayload,
  MessageWebhookPayload,
  ReactionWebhookPayload,
  ViewSubmitWebhookPayload,
  WebhookPayloadUnion,
} from "../src/generated/types.js";

const token = process.env.PACHCA_TOKEN;
if (!token) {
  console.error("Set PACHCA_TOKEN environment variable");
  process.exit(1);
}

const client = new PachcaClient(token);
const response = await client.bots.getWebhookEvents({ limit: 5 });

console.log(`Fetched ${response.data.length} webhook events`);
for (const [index, event] of response.data.entries()) {
  console.log(
    `${index + 1}. id=${event.id} created_at=${event.createdAt} payload=${summarizePayload(event.payload)}`,
  );
}

console.log(
  `has_next=${response.meta.paginate.hasNext} next_page=${JSON.stringify(response.meta.paginate.nextPage)}`,
);

function summarizePayload(payload: WebhookPayloadUnion): string {
  if (payload.type === "message" && payload.event === "link_shared") {
    const linkShared = payload as LinkSharedWebhookPayload;
    return `link_shared message_id=${linkShared.messageId} links=${linkShared.links.length} user_id=${linkShared.userId}`;
  }
  switch (payload.type) {
    case "message": {
      const message = payload as MessageWebhookPayload;
      return `message event=${message.event} id=${message.id} chat_id=${message.chatId}`;
    }
    case "reaction": {
      const reaction = payload as ReactionWebhookPayload;
      return `reaction event=${reaction.event} message_id=${reaction.messageId} code=${reaction.code}`;
    }
    case "button": {
      const button = payload as ButtonWebhookPayload;
      return `button message_id=${button.messageId} user_id=${button.userId}`;
    }
    case "view": {
      const view = payload as ViewSubmitWebhookPayload;
      return `view user_id=${view.userId} fields=${Object.keys(view.data).length}`;
    }
    case "chat_member": {
      const member = payload as ChatMemberWebhookPayload;
      return `chat_member event=${member.event} chat_id=${member.chatId} users=${member.userIds.length}`;
    }
    case "company_member": {
      const member = payload as CompanyMemberWebhookPayload;
      return `company_member event=${member.event} users=${member.userIds.length}`;
    }
    default:
      return "unknown";
  }
}
