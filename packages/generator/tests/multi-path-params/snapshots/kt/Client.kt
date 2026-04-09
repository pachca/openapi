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

interface TasksService {
    suspend fun getTask(projectId: Int, taskId: Int): Task =
        throw NotImplementedError("Tasks.getTask is not implemented")

    suspend fun updateTask(
        projectId: Int,
        taskId: Int,
        request: TaskUpdateRequest,
    ): Task =
        throw NotImplementedError("Tasks.updateTask is not implemented")

    suspend fun deleteComment(
        projectId: Int,
        taskId: Int,
        commentId: Int,
    ) =
        throw NotImplementedError("Tasks.deleteComment is not implemented")
}

class TasksServiceImpl internal constructor(
    private val baseUrl: String,
    private val client: HttpClient,
) : TasksService {
    override suspend fun getTask(projectId: Int, taskId: Int): Task {
        val response = client.get("$baseUrl/projects/$projectId/tasks/$taskId")
        return when (response.status.value) {
            200 -> response.body<TaskDataWrapper>().data
            else -> throw RuntimeException("Unexpected status code: ${response.status.value}")
        }
    }

    override suspend fun updateTask(
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

    override suspend fun deleteComment(
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

class PachcaClient private constructor(
    private val client: HttpClient?,
    val tasks: TasksService
) : Closeable {

    companion object {
        operator fun invoke(
            token: String,
            baseUrl: String = "https://api.example.com/v1",
            tasks: TasksService? = null
        ): PachcaClient {
            val client = createClient(token)
            return PachcaClient(
                client = client,
                tasks = tasks ?: TasksServiceImpl(baseUrl, client)
            )
        }

        fun stub(
            tasks: TasksService = object : TasksService {}
        ): PachcaClient = PachcaClient(
            client = null,
            tasks = tasks
        )

        private fun createClient(token: String): HttpClient = HttpClient {
            expectSuccess = false
            install(ContentNegotiation) { json(Json { explicitNulls = false }) }
            install(HttpRequestRetry) {
                maxRetries = 3
                retryIf { _, response ->
                    response.status.value == 429 || response.status.value in setOf(500, 502, 503, 504)
                }
                delayMillis { retry ->
                    val retryAfter = response?.headers?.get("Retry-After")?.toLongOrNull()
                    if (retryAfter != null && response?.status?.value == 429) {
                        retryAfter * 1000L
                    } else {
                        val base = 10_000L * (1L shl retry)
                        val jitter = 0.5 + kotlin.random.Random.nextDouble() * 0.5
                        (base * jitter).toLong()
                    }
                }
            }
            defaultRequest { bearerAuth(token) }
        }
    }

    override fun close() {
        client?.close()
    }
}
