/**
 * Retries: a 504 with the error code `timeout` is a search the server stopped because the
 * query is too heavy, so the SDK hands it back at once with its body intact, while a 504
 * from a proxy is retried. `retryIf` cannot read the body: an interceptor under the retry
 * plugin marks such a call. The client talks to a local server that answers each request
 * with the next canned response.
 *
 * Usage (from sdk/kotlin/generated), run by `runTests`:
 *
 *   ./gradlew runRetryTests -Pversion=0.0.0
 */
@file:JvmName("Retries")

package tests.retries

import com.pachca.sdk.ApiError
import com.pachca.sdk.PachcaClient
import com.pachca.sdk.ValidationErrorCode
import com.sun.net.httpserver.HttpServer
import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.withTimeoutOrNull
import java.net.InetSocketAddress
import java.util.concurrent.ConcurrentLinkedQueue
import java.util.concurrent.atomic.AtomicInteger
import kotlin.system.exitProcess

private const val SEARCH_TIMEOUT =
    """{"errors":[{"key":"system","value":null,"message":"Search timed out","code":"timeout","payload":null}]}"""

private fun checkRetry(condition: Boolean, message: String) {
    if (!condition) {
        System.err.println("retries failed: $message")
        exitProcess(1)
    }
}

fun main() {
    val responses = ConcurrentLinkedQueue<Pair<Int, String>>()
    val requests = AtomicInteger()
    val server = HttpServer.create(InetSocketAddress("127.0.0.1", 0), 0)
    server.createContext("/") { exchange ->
        requests.incrementAndGet()
        val (status, body) = responses.remove()
        val bytes = body.toByteArray()
        exchange.responseHeaders.add("Content-Type", "application/json")
        exchange.sendResponseHeaders(status, bytes.size.toLong())
        exchange.responseBody.use { it.write(bytes) }
    }
    server.start()
    val client = PachcaClient("test-token", baseUrl = "http://127.0.0.1:${server.address.port}")

    try {
        runBlocking {
            // The search timed out: one request, and the error keeps its code.
            responses.add(504 to SEARCH_TIMEOUT)
            requests.set(0)
            val started = System.nanoTime()
            try {
                client.search.searchMessages(query = "report")
                checkRetry(false, "expected ApiError with timeout")
            } catch (error: ApiError) {
                checkRetry(error.errors[0].code == ValidationErrorCode.TIMEOUT, "the body reaches the caller, got ${error.errors[0].code}")
            }
            val elapsedMs = (System.nanoTime() - started) / 1_000_000
            checkRetry(requests.get() == 1, "a 504 with the code timeout is not repeated, got ${requests.get()} requests")
            checkRetry(elapsedMs < 5_000, "a 504 with the code timeout comes back at once, took $elapsedMs ms")

            // A 504 from a proxy, and a 504 with another code: the retry waits about 20 seconds,
            // so a call still running after two seconds, with one request made, is waiting for it.
            for (body in listOf("<html>Gateway Timeout</html>", """{"errors":[{"code":"unavailable","message":"Try later"}]}""")) {
                responses.clear()
                responses.add(504 to body)
                requests.set(0)
                val result = withTimeoutOrNull(2_000) {
                    runCatching { client.search.searchMessages(query = "report") }
                }
                checkRetry(result == null, "a 504 without the code timeout is retried, got $result for $body")
                checkRetry(requests.get() == 1, "one request before the pause, got ${requests.get()} for $body")
            }
        }
    } finally {
        client.close()
        server.stop(0)
    }
    println("retries ok")
}
