package com.pachca.sdk

import io.ktor.client.*
import io.ktor.client.call.*
import io.ktor.client.plugins.*
import io.ktor.client.plugins.auth.*
import io.ktor.client.plugins.auth.providers.*
import io.ktor.client.plugins.contentnegotiation.*
import io.ktor.client.request.*
import io.ktor.client.statement.*
import io.ktor.http.*
import io.ktor.serialization.kotlinx.json.*
import kotlinx.serialization.json.Json
import java.io.Closeable

class TasksService internal constructor(
    private val baseUrl: String,
    private val client: HttpClient,
) {
    suspend fun getTask(projectId: Int, taskId: Int): Task {
        val response = client.get("$baseUrl/projects/$projectId/tasks/$taskId")
        return when (response.status.value) {
            200 -> response.body<TaskDataWrapper>().data
            else -> throw RuntimeException("Unexpected status code: ${response.status.value}")
        }
    }

    suspend fun updateTask(
        projectId: Int,
        taskId: Int,
        request: TaskUpdateRequest,
    ): Task {
        val response = client.put("$baseUrl/projects/$projectId/tasks/$taskId") {
            contentType(ContentType.Application.Json)
            setBody(request)
        }
        return when (response.status.value) {
            200 -> response.body<TaskDataWrapper>().data
            else -> throw RuntimeException("Unexpected status code: ${response.status.value}")
        }
    }

    suspend fun deleteComment(
        projectId: Int,
        taskId: Int,
        commentId: Int,
    ) {
        val response = client.delete("$baseUrl/projects/$projectId/tasks/$taskId/comments/$commentId")
        when (response.status.value) {
            204 -> return
            else -> throw RuntimeException("Unexpected status code: ${response.status.value}")
        }
    }
}

class PachcaClient(token: String, baseUrl: String = "https://api.example.com/v1") : Closeable {
    private val client = HttpClient {
        expectSuccess = false
        install(ContentNegotiation) {
            json(Json { explicitNulls = false })
        }
        install(HttpRequestRetry) {
            retryOnServerErrors(maxRetries = 3)
            retryIf { _, response -> response.status.value == 429 }
            delayMillis { retry, response ->
                val retryAfter = response?.headers?.get("Retry-After")?.toLongOrNull()
                if (retryAfter != null) retryAfter * 1000L else retry * 1000L
            }
        }
        defaultRequest {
            bearerAuth(token)
        }
    }

    val tasks = TasksService(baseUrl, client)

    override fun close() {
        client.close()
    }
}
