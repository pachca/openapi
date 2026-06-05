import Foundation
import PachcaSDK

// Webhook history example — fetch recent webhook deliveries and inspect payload variants.
//
// Usage:
//   PACHCA_TOKEN=your_token swift run WebhookHistory

guard let token = ProcessInfo.processInfo.environment["PACHCA_TOKEN"] else {
    fatalError("Set PACHCA_TOKEN environment variable")
}

let client = PachcaClient(token: token)
let response = try await client.bots.getWebhookEvents(limit: 5)

print("Fetched \(response.data.count) webhook events")
for (index, event) in response.data.enumerated() {
    print("\(index + 1). id=\(event.id) created_at=\(event.createdAt) payload=\(summarizePayload(event.payload))")
}

print("has_next=\(response.meta.paginate.hasNext ?? false) next_page=\(response.meta.paginate.nextPage)")

func summarizePayload(_ payload: WebhookPayloadUnion) -> String {
    switch payload {
    case .linkSharedWebhookPayload(let linkShared):
        return "link_shared message_id=\(linkShared.messageId) links=\(linkShared.links.count) user_id=\(linkShared.userId)"
    case .messageWebhookPayload(let message):
        return "message event=\(message.event) id=\(message.id) chat_id=\(message.chatId)"
    case .reactionWebhookPayload(let reaction):
        return "reaction event=\(reaction.event) message_id=\(reaction.messageId) code=\(reaction.code)"
    case .buttonWebhookPayload(let button):
        return "button message_id=\(button.messageId) user_id=\(button.userId)"
    case .viewSubmitWebhookPayload(let view):
        return "view user_id=\(view.userId) fields=\(view.data.count)"
    case .chatMemberWebhookPayload(let member):
        return "chat_member event=\(member.event) chat_id=\(String(describing: member.chatId)) users=\(member.userIds.count)"
    case .companyMemberWebhookPayload(let member):
        return "company_member event=\(member.event) users=\(member.userIds.count)"
    }
}
