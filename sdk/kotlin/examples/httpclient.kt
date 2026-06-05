/**
 * HTTP client example — using a pre-configured Ktor HttpClient with optional proxy.
 *
 * Demonstrates the secondary constructor that accepts an HttpClient.
 *
 * Usage:
 *
 *   PACHCA_TOKEN=your_token PACHCA_CHAT_ID=12345 kotlin httpclient.kt
 */
package examples.httpclient

import com.pachca.sdk.PachcaClient
import com.pachca.sdk.PACHCA_API_URL
import io.ktor.client.*
import io.ktor.client.engine.*
import io.ktor.client.engine.cio.*
import io.ktor.http.Url
import io.ktor.client.plugins.*
import io.ktor.client.plugins.contentnegotiation.*
import io.ktor.serialization.kotlinx.json.*
import kotlinx.coroutines.runBlocking
import kotlinx.serialization.json.Json

fun main() = runBlocking {
    val token = System.getenv("PACHCA_TOKEN")
        ?: error("Set PACHCA_TOKEN environment variable")
    val chatId = System.getenv("PACHCA_CHAT_ID")?.toIntOrNull()
        ?: error("Set PACHCA_CHAT_ID environment variable")

    val http = HttpClient(CIO) {
        engine {
            val proxyUrl = System.getenv("HTTP_PROXY")
            if (proxyUrl != null) {
                proxy = ProxyBuilder.http(Url(proxyUrl))
            }
        }
        defaultRequest {
            headers.append("Authorization", "Bearer $token")
        }
        install(ContentNegotiation) {
            json(Json { ignoreUnknownKeys = true })
        }
    }

    val client = PachcaClient(client = http, baseUrl = PACHCA_API_URL)

    val chat = client.chats.getChat(chatId)
    println("Chat: ${chat.name} (id=${chat.id})")

    client.close()
}
