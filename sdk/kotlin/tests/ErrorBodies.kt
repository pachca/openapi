/**
 * Error bodies: an error answer whose body is empty or not JSON is an [ApiError] with the
 * status code and no errors, not a JSON parse error. The event stream answers 404 with no
 * body when the event history is off, and a proxy answers 502 with an HTML page. The client
 * talks to a local server that answers each request with the next canned response.
 *
 * Usage (from sdk/kotlin/generated), run by `runTests`:
 *
 *   ./gradlew runErrorBodyTests -Pversion=0.0.0
 */
@file:JvmName("ErrorBodies")

package tests.errorbodies

import com.pachca.sdk.ApiError
import com.pachca.sdk.OAuthError
import com.pachca.sdk.OAuthErrorCode
import com.pachca.sdk.PachcaClient
import com.sun.net.httpserver.HttpServer
import kotlinx.coroutines.runBlocking
import java.net.InetSocketAddress
import java.util.concurrent.ConcurrentLinkedQueue
import kotlin.system.exitProcess

private data class Canned(val status: Int, val body: String, val contentType: String? = null)

private fun check(condition: Boolean, message: String) {
    if (!condition) {
        System.err.println("error bodies failed: $message")
        exitProcess(1)
    }
}

private suspend fun failure(call: suspend () -> Unit): Exception {
    try {
        call()
    } catch (error: Exception) {
        return error
    }
    check(false, "the call did not fail")
    error("unreachable")
}

private fun checkApiError(error: Exception, status: Int, what: String): ApiError {
    check(error is ApiError, "$what is an ApiError, got ${error::class.simpleName}: ${error.message}")
    val apiError = error as ApiError
    check(apiError.statusCode == status, "$what keeps the status code $status, got ${apiError.statusCode}")
    return apiError
}

fun main() {
    val responses = ConcurrentLinkedQueue<Canned>()
    val server = HttpServer.create(InetSocketAddress("127.0.0.1", 0), 0)
    server.createContext("/") { exchange ->
        val canned = responses.remove()
        val bytes = canned.body.toByteArray()
        canned.contentType?.let { exchange.responseHeaders.add("Content-Type", it) }
        // -1 sends no body at all, 0 would mean a chunked one.
        exchange.sendResponseHeaders(canned.status, if (bytes.isEmpty()) -1 else bytes.size.toLong())
        exchange.responseBody.use { if (bytes.isNotEmpty()) it.write(bytes) }
    }
    server.start()
    val client = PachcaClient("test-token", baseUrl = "http://127.0.0.1:${server.address.port}")

    try {
        runBlocking {
            responses.add(Canned(404, ""))
            val empty = checkApiError(failure { client.bots.getWebhookEventsStream() }, 404, "a 404 with no body")
            check(empty.errors.isEmpty(), "an empty body gives no errors, got ${empty.errors}")
            check(empty.message == "HTTP 404", "the message names the status, got ${empty.message}")

            // POST is not repeated after a 5xx: one request, the page comes back at once.
            responses.add(Canned(502, "<html><body>502 Bad Gateway</body></html>", "text/html"))
            checkApiError(failure { client.bots.selfRecreateBotToken() }, 502, "a proxy page")
            responses.add(Canned(404, "<html>Not Found</html>", "text/html"))
            checkApiError(failure { client.messages.deleteMessage(1) }, 404, "a call with no answer body")

            responses.add(
                Canned(
                    422,
                    """{"errors":[{"key":"name","value":null,"message":"Name is blank","code":"blank","payload":null}]}""",
                    "application/json",
                ),
            )
            val invalid = checkApiError(failure { client.bots.selfRecreateBotToken() }, 422, "a JSON error")
            check(invalid.errors.size == 1 && invalid.message == "Name is blank", "a JSON error keeps its errors, got ${invalid.message}")

            responses.add(Canned(401, """{"error":"invalid_token","error_description":"Access token is missing"}""", "application/json"))
            val oauth = failure { client.bots.getWebhookEventsStream() }
            check(oauth is OAuthError && oauth.error == OAuthErrorCode.INVALID_TOKEN, "the OAuth form is an OAuthError, got $oauth")
            responses.add(Canned(401, ""))
            checkApiError(failure { client.bots.getWebhookEventsStream() }, 401, "a 401 with no body")
        }
    } finally {
        client.close()
        server.stop(0)
    }
    println("error bodies ok")
}
