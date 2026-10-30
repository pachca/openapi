import Foundation
import PachcaSDK

// Request bodies: an optional field the caller left unset stays out of the body,
// a nullable one too (null switches a setting off or deletes an object), and a
// field named in nullFields goes out as null. Run from main.swift.

func checkRequestBodies() {
    func fail(_ message: String) -> Never {
        FileHandle.standardError.write(Data("request bodies failed: \(message)\n".utf8))
        exit(1)
    }
    func body<T: Encodable>(_ value: T) -> String {
        let encoder = JSONEncoder()
        encoder.outputFormatting = [.sortedKeys, .withoutEscapingSlashes]
        guard let data = try? encoder.encode(value) else { fail("\(T.self) does not encode") }
        return String(decoding: data, as: UTF8.self)
    }

    var sent = body(BotUpdateRequest(webhook: BotUpdateRequestWebhook(name: "Бот напоминаний")))
    if sent != #"{"webhook":{"name":"Бот напоминаний"}}"# { fail("unset fields stay out: \(sent)") }

    sent = body(DraftUpdateRequest(draft: DraftUpdateRequestDraft(content: "Отчёт за неделю")))
    if sent != #"{"draft":{"content":"Отчёт за неделю"}}"# { fail("unset fields stay out: \(sent)") }

    sent = body(BotUpdateRequest(nullFields: ["oauthClient"]))
    if sent != #"{"oauth_client":null}"# { fail("oauthClient in nullFields: \(sent)") }

    sent = body(BotUpdateRequest(webhook: BotUpdateRequestWebhook(nullFields: ["kind"])))
    if sent != #"{"webhook":{"kind":null}}"# { fail("kind in nullFields: \(sent)") }

    sent = body(DraftUpdateRequest(draft: DraftUpdateRequestDraft(parentMessageId: 7, nullFields: ["parentMessageId"])))
    if sent != #"{"draft":{"parent_message_id":null}}"# { fail("nullFields wins over a value: \(sent)") }

    do {
        _ = try JSONEncoder().encode(BotUpdateRequest(nullFields: ["promo"]))
        fail("a field the API does not take as null must be refused")
    } catch is EncodingError {
        // expected
    } catch {
        fail("expected EncodingError, got \(error)")
    }
    print("request bodies ok")
}
