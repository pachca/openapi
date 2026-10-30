/**
 * Request bodies: an optional field the caller left unset stays out of the body,
 * a nullable one too (null switches a setting off or deletes an object), and a
 * field named in nullFields goes out as null.
 *
 * Usage (from sdk/kotlin/generated):
 *
 *   ./gradlew runTests -Pversion=0.0.0
 */
@file:JvmName("RequestBodies")

package tests.requestbodies

import com.pachca.sdk.BotUpdateRequest
import com.pachca.sdk.BotUpdateRequestWebhook
import com.pachca.sdk.DraftUpdateRequest
import com.pachca.sdk.DraftUpdateRequestDraft
import kotlinx.serialization.SerializationException
import kotlinx.serialization.json.Json
import kotlin.system.exitProcess

// The settings the client sends a request body with.
private val json = Json { explicitNulls = false; ignoreUnknownKeys = true }

private fun check(condition: Boolean, message: String) {
    if (!condition) {
        System.err.println("request bodies failed: $message")
        exitProcess(1)
    }
}

fun main() {
    var body = json.encodeToString(BotUpdateRequest(webhook = BotUpdateRequestWebhook(name = "Бот напоминаний")))
    check(body == """{"webhook":{"name":"Бот напоминаний"}}""", "unset fields stay out: $body")

    body = json.encodeToString(DraftUpdateRequest(draft = DraftUpdateRequestDraft(content = "Отчёт за неделю")))
    check(body == """{"draft":{"content":"Отчёт за неделю"}}""", "unset fields stay out: $body")

    body = json.encodeToString(BotUpdateRequest(nullFields = setOf("oauthClient")))
    check(body == """{"oauth_client":null}""", "oauthClient in nullFields: $body")

    body = json.encodeToString(BotUpdateRequest(webhook = BotUpdateRequestWebhook(nullFields = setOf("kind"))))
    check(body == """{"webhook":{"kind":null}}""", "kind in nullFields: $body")

    body = json.encodeToString(
        DraftUpdateRequest(draft = DraftUpdateRequestDraft(parentMessageId = 7, nullFields = setOf("parentMessageId"))),
    )
    check(body == """{"draft":{"parent_message_id":null}}""", "nullFields wins over a value: $body")

    try {
        json.encodeToString(BotUpdateRequest(nullFields = setOf("promo")))
        check(false, "a field the API does not take as null must be refused")
    } catch (e: SerializationException) {
        // expected
    }
    println("request bodies ok")
}
