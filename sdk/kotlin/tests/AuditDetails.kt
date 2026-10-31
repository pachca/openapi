/**
 * Audit event details carry no discriminator: a required field that holds null
 * decodes, and a record whose keys fit a member but whose types do not decodes
 * into the next member that fits. One record never breaks the page. Records from
 * before 7 October 2026 keep scopes as an object in bot_token_updated and as a
 * list in bot_token_created: AuditDetailsBot takes both.
 *
 * Usage (from sdk/kotlin/generated):
 *
 *   ./gradlew runTests -Pversion=0.0.0
 */
@file:JvmName("AuditDetails")

package tests.auditdetails

import com.pachca.sdk.AuditDetailsBot
import com.pachca.sdk.AuditDetailsBotScopesValue
import com.pachca.sdk.AuditDetailsBotTokenUpdated
import com.pachca.sdk.AuditDetailsChatId
import com.pachca.sdk.AuditDetailsDlp
import com.pachca.sdk.AuditDetailsToken
import com.pachca.sdk.PachcaClient
import com.sun.net.httpserver.HttpServer
import kotlinx.coroutines.runBlocking
import java.net.InetSocketAddress
import kotlin.system.exitProcess

private fun event(id: String, key: String, details: String) =
    """{"id":"$id","created_at":"2026-10-01T10:00:00.000Z","event_key":"$key","entity_id":"7",""" +
        """"entity_type":"Bot","actor_id":"12","actor_type":"User","details":$details,""" +
        """"ip_address":null,"user_agent":null}"""

// bot_token_updated before 7 October 2026: scopes is an object, not a list.
private val OLD_BOT_TOKEN_UPDATED = event(
    "1", "bot_token_updated",
    """{"actor_id":12,"bot_id":7,"webhook_id":31,"application_id":null,"access_token_id":4827,""" +
        """"access_token_preview":"cH5k...x7Qp","scopes":{"previous":["messages:read"],"new":["messages:read","chats:read"]}}""",
)

// Required fields that hold null: token_name, actor_id, access_token_preview.
private val BOT_TOKEN_UPDATED = event(
    "2", "bot_token_updated",
    """{"token_kind":"bot","token_name":null,"resource_owner_id":7,"current_scopes":["messages:read"],""" +
        """"bot_id":7,"actor_id":null,"access_token_id":4827,"access_token_preview":null,"webhook_id":31}""",
)

private val DLP = event(
    "3", "dlp_violation_detected",
    """{"dlp_rule_id":"11","dlp_rule_name":"Паспорт","message_id":1,"chat_id":5,"user_id":12,""" +
        """"action_message":null,"conditions_matched":true}""",
)

private val CHAT_JOIN = event("4", "user_chat_join", """{"chat_id":5}""")

// A token record: scopes is a list.
private val ACCESS_TOKEN_CREATED = event(
    "5", "access_token_created",
    """{"token_kind":"user","token_name":"Отчёты","resource_owner_id":12,"scopes":["messages:read"],""" +
        """"access_token_id":4828,"access_token_preview":"dG9r...a2Vu","actor_id":12}""",
)

// A change of the bot token scopes: scopes is an object beside current_scopes.
private val BOT_TOKEN_SCOPES_UPDATED = event(
    "6", "bot_token_updated",
    """{"token_kind":"bot","token_name":null,"resource_owner_id":7,"current_scopes":["messages:read","chats:read"],""" +
        """"scopes":{"previous":["messages:read"],"new":["messages:read","chats:read"]},"bot_id":7,"actor_id":12,""" +
        """"access_token_id":4827,"access_token_preview":null,"webhook_id":31}""",
)

// bot_token_created before 7 October 2026: scopes is a list, no token_kind.
private val OLD_BOT_TOKEN_CREATED = event(
    "7", "bot_token_created",
    """{"actor_id":12,"bot_id":7,"webhook_id":31,"application_id":null,"access_token_id":4827,""" +
        """"access_token_preview":"cH5k...x7Qp","scopes":["messages:read","chats:read"]}""",
)

private fun check(condition: Boolean, message: String) {
    if (!condition) {
        System.err.println("audit details failed: $message")
        exitProcess(1)
    }
}

fun main() {
    val page = """{"data":[$OLD_BOT_TOKEN_UPDATED,$BOT_TOKEN_UPDATED,$DLP,$CHAT_JOIN,$ACCESS_TOKEN_CREATED,$BOT_TOKEN_SCOPES_UPDATED,$OLD_BOT_TOKEN_CREATED],"meta":{"paginate":{"next_page":"eyJpZCI6NH0"}}}"""
    val server = HttpServer.create(InetSocketAddress("127.0.0.1", 0), 0)
    server.createContext("/") { exchange ->
        val bytes = page.toByteArray()
        exchange.responseHeaders.add("Content-Type", "application/json")
        exchange.sendResponseHeaders(200, bytes.size.toLong())
        exchange.responseBody.use { it.write(bytes) }
    }
    server.start()
    val client = PachcaClient("test-token", baseUrl = "http://127.0.0.1:${server.address.port}")

    try {
        runBlocking {
            val events = client.security.getAuditEvents().data
            check(events.size == 7, "the page keeps every record, got ${events.size}")
            val old = events[0].details
            val change = ((old as? AuditDetailsBot)?.scopes as? AuditDetailsBotScopesValue.AuditDetailsTokenScopesChange)?.value
            check(
                change != null && change.previous == listOf("messages:read") && change.new == listOf("messages:read", "chats:read"),
                "an old bot_token_updated decodes into AuditDetailsBot with scopes as an object, got $old",
            )
            val updated = events[1].details
            check(
                updated is AuditDetailsBotTokenUpdated && updated.tokenName == null && updated.actorId == null && updated.accessTokenPreview == null,
                "required fields that hold null decode, got $updated",
            )
            val dlp = events[2].details
            check(dlp is AuditDetailsDlp && dlp.actionMessage == null, "action_message null decodes, got $dlp")
            val join = events[3].details
            check(join is AuditDetailsChatId && join.chatId == 5, "a plain record decodes as before, got $join")
            val token = events[4].details
            check(token is AuditDetailsToken && token.scopes == listOf("messages:read"), "a token record decodes as a token, got $token")
            val scopesUpdated = events[5].details
            check(
                scopesUpdated is AuditDetailsBotTokenUpdated && scopesUpdated.currentScopes == listOf("messages:read", "chats:read"),
                "a change of the bot token scopes decodes as bot_token_updated, got $scopesUpdated",
            )
            val created = events[6].details
            check(
                created is AuditDetailsBot && created.scopes == AuditDetailsBotScopesValue.StringList(listOf("messages:read", "chats:read")),
                "an old bot_token_created decodes into AuditDetailsBot with scopes as a list, got $created",
            )
            val written = kotlinx.serialization.json.Json.encodeToString(AuditDetailsBot.serializer(), old as AuditDetailsBot)
            check(
                written.contains(""""scopes":{"previous":["messages:read"],"new":["messages:read","chats:read"]}"""),
                "scopes goes back out as an object, got $written",
            )
        }
        println("audit details ok")
    } finally {
        server.stop(0)
        client.close()
    }
}
