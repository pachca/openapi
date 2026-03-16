package com.pachca.sdk

import io.ktor.client.*
import io.ktor.client.call.*
import io.ktor.client.plugins.*
import io.ktor.client.plugins.auth.*
import io.ktor.client.plugins.auth.providers.*
import io.ktor.client.plugins.contentnegotiation.*
import io.ktor.client.request.*
import io.ktor.client.request.forms.*
import io.ktor.client.statement.*
import io.ktor.http.*
import io.ktor.serialization.kotlinx.json.*
import kotlinx.serialization.json.Json
import java.io.Closeable

class CommonService internal constructor(
    private val baseUrl: String,
    private val client: HttpClient,
) {
    suspend fun uploadFile(directUrl: String, request: FileUploadRequest) {
        val response = client.submitFormWithBinaryData(
            directUrl,
            formData {
                append("content-disposition", request.contentDisposition)
                append("acl", request.acl)
                append("policy", request.policy)
                append("x-amz-credential", request.xAmzCredential)
                append("x-amz-algorithm", request.xAmzAlgorithm)
                append("x-amz-date", request.xAmzDate)
                append("x-amz-signature", request.xAmzSignature)
                append("key", request.key)
                append("file", request.file, Headers.build {
                    append(HttpHeaders.ContentDisposition, "filename=\"file\"")
                })
            },
        ) {
            headers.remove(HttpHeaders.Authorization)
        }
        when (response.status.value) {
            204 -> return
            401 -> throw response.body<OAuthError>()
            else -> throw RuntimeException("Unexpected status code: ${response.status.value}")
        }
    }

    suspend fun getUploadParams(): UploadParams {
        val response = client.post("$baseUrl/uploads")
        return when (response.status.value) {
            201 -> response.body<UploadParamsDataWrapper>().data
            401 -> throw response.body<OAuthError>()
            else -> throw RuntimeException("Unexpected status code: ${response.status.value}")
        }
    }
}

class PachcaClient(token: String, baseUrl: String = "https://api.pachca.com/api/shared/v1") : Closeable {
    private val client = HttpClient {
        expectSuccess = false
        install(ContentNegotiation) {
            json(Json { explicitNulls = false })
        }
        install(HttpRequestRetry) {
            retryOnServerErrors(maxRetries = 3)
            retryIf { _, response -> response.status.value == 429 }
            delayMillis { retry ->
                val retryAfter = response?.headers?.get("Retry-After")?.toLongOrNull()
                if (retryAfter != null) retryAfter * 1000L else retry * 1000L
            }
        }
        defaultRequest {
            bearerAuth(token)
        }
    }

    val common = CommonService(baseUrl, client)

    override fun close() {
        client.close()
    }
}
