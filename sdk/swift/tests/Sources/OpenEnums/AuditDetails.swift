import Foundation
import PachcaSDK

// Audit event details carry no discriminator: members are tried in the order they
// match the payload keys, and the first one that decodes wins. A record whose keys
// fit a member but whose types do not (an older format) decodes into the next
// member that fits, and one record never breaks the page. Run from main.swift.

private func auditEvent(_ id: String, _ key: String, _ details: String) -> String {
    #"{"id":"\#(id)","created_at":"2026-10-01T10:00:00.000Z","event_key":"\#(key)","entity_id":"7","entity_type":"Bot","actor_id":"12","actor_type":"User","details":\#(details),"ip_address":null,"user_agent":null}"#
}

func checkAuditDetails() {
    // bot_token_updated before 7 October 2026: scopes is an object, not a list.
    let oldBotTokenUpdated = auditEvent("1", "bot_token_updated",
        #"{"actor_id":12,"bot_id":7,"webhook_id":31,"application_id":null,"access_token_id":4827,"access_token_preview":"cH5k...x7Qp","scopes":{"previous":["messages:read"],"new":["messages:read","chats:read"]}}"#)
    let botTokenUpdated = auditEvent("2", "bot_token_updated",
        #"{"token_kind":"bot","token_name":null,"resource_owner_id":7,"current_scopes":["messages:read"],"bot_id":7,"actor_id":null,"access_token_id":4827,"access_token_preview":null,"webhook_id":31}"#)
    // Fits AuditDetailsKms by keys, but reason is missing: AuditDetailsChatId takes it.
    let chatAndMessage = auditEvent("3", "message_deleted", #"{"chat_id":5,"message_id":1}"#)
    let page = #"{"data":["# + [oldBotTokenUpdated, botTokenUpdated, chatAndMessage].joined(separator: ",") +
        #"],"meta":{"paginate":{"next_page":"eyJpZCI6M30"}}}"#

    let events: [AuditEvent]
    do {
        events = try JSONDecoder().decode(GetAuditEventsResponse.self, from: Data(page.utf8)).data
    } catch {
        FileHandle.standardError.write(Data("audit details failed: the page does not decode: \(error)\n".utf8))
        exit(1)
    }
    func fail(_ message: String) -> Never {
        FileHandle.standardError.write(Data("audit details failed: \(message)\n".utf8))
        exit(1)
    }
    if events.count != 3 { fail("the page keeps every record, got \(events.count)") }
    if case .auditDetailsBot = events[0].details { fail("AuditDetailsBot takes scopes as a list: it must give way") }
    guard case .auditDetailsBotTokenUpdated(let updated) = events[1].details, updated.tokenName == nil, updated.actorId == nil else {
        fail("required fields that hold null decode, got \(events[1].details)")
    }
    guard case .auditDetailsChatId(let chat) = events[2].details, chat.chatId == 5 else {
        fail("the first member that decodes wins, got \(events[2].details)")
    }
    print("audit details ok")
}
