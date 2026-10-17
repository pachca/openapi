/**
 * Open enums: a value the SDK does not list yet decodes and keeps the raw string —
 * in a response, in the OAuth error body and in the API error body. The client
 * talks to a local server that answers each request with the next canned response.
 *
 * Usage (from sdk/kotlin/generated):
 *
 *   ./gradlew runTests -Pversion=0.0.0
 */
@file:JvmName("OpenEnums")

package tests

import com.pachca.sdk.ApiError
import com.pachca.sdk.OAuthError
import com.pachca.sdk.OAuthErrorCode
import com.pachca.sdk.OAuthScope
import com.pachca.sdk.PachcaClient
import com.pachca.sdk.ValidationErrorCode
import com.sun.net.httpserver.HttpServer
import kotlinx.coroutines.runBlocking
import java.net.InetSocketAddress
import kotlin.system.exitProcess

private const val TOKEN_INFO = """{"data":{"id":4827,"token":"cH5kR9mN...x7Qp","name":null,"user_id":12,""" +
    """"scopes":["messages:read","brand_new:scope"],"created_at":"2025-01-15T10:30:00.000Z",""" +
    """"revoked_at":null,"expires_in":null,"last_used_at":null}}"""
private const val UNLISTED = "A code this SDK does not list"

private fun check(condition: Boolean, message: String) {
    if (!condition) {
        System.err.println("open enums failed: $message")
        exitProcess(1)
    }
}

fun main() {
    val responses = ArrayDeque(
        listOf(
            200 to TOKEN_INFO,
            401 to """{"error":"brand_new_401","error_description":"$UNLISTED"}""",
            403 to """{"error":"brand_new_403","error_description":"$UNLISTED"}""",
            422 to """{"errors":[{"key":"system","value":null,"message":"$UNLISTED","code":"brand_new_code","payload":null}]}""",
        ),
    )
    val server = HttpServer.create(InetSocketAddress("127.0.0.1", 0), 0)
    server.createContext("/") { exchange ->
        val (status, body) = responses.removeFirst()
        val bytes = body.toByteArray()
        exchange.responseHeaders.add("Content-Type", "application/json")
        exchange.sendResponseHeaders(status, bytes.size.toLong())
        exchange.responseBody.use { it.write(bytes) }
    }
    server.start()
    val client = PachcaClient("test-token", baseUrl = "http://127.0.0.1:${server.address.port}")

    try {
        runBlocking {
            val info = client.oauth.getTokenInfo()
            check(info.scopes[0] == OAuthScope.MESSAGES_READ && info.scopes[0].isKnown, "a listed scope decodes to its constant, got ${info.scopes[0]}")
            check(info.scopes[1].value == "brand_new:scope" && !info.scopes[1].isKnown, "an unlisted scope keeps its value, got ${info.scopes[1]}")

            for (code in listOf("brand_new_401", "brand_new_403")) {
                try {
                    client.oauth.getTokenInfo()
                    check(false, "expected OAuthError with $code")
                } catch (error: OAuthError) {
                    check(error.error == OAuthErrorCode(code) && error.message == code, "OAuthError keeps the unlisted code $code, got ${error.error}")
                }
            }

            try {
                client.oauth.getTokenInfo()
                check(false, "expected ApiError with brand_new_code")
            } catch (error: ApiError) {
                check(error.errors[0].code == ValidationErrorCode("brand_new_code"), "ApiError keeps the unlisted code, got ${error.errors[0].code}")
            }
        }
        check(OAuthErrorCode.valueOf("INSUFFICIENT_SCOPE") == OAuthErrorCode.INSUFFICIENT_SCOPE, "valueOf finds a listed constant by name")
        check(OAuthErrorCode.values().toList() == OAuthErrorCode.entries, "values() lists the same constants as entries")
        println("open enums ok")
    } finally {
        client.close()
        server.stop(0)
    }
}
