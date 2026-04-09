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

interface CommonService {
    suspend fun uploadFile(directUrl: String, request: FileUploadRequest) =
        throw NotImplementedError("Common.uploadFile is not implemented")

    suspend fun getUploadParams(): UploadParams =
        throw NotImplementedError("Common.getUploadParams is not implemented")
}

class CommonServiceImpl internal constructor(
    private val baseUrl: String,
    private val client: HttpClient,
) : CommonService {
    override suspend fun uploadFile(directUrl: String, request: FileUploadRequest) {
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

    override suspend fun getUploadParams(): UploadParams {
        val response = client.post("$baseUrl/uploads")
        return when (response.status.value) {
            201 -> response.body<UploadParamsDataWrapper>().data
            401 -> throw response.body<OAuthError>()
            else -> throw RuntimeException("Unexpected status code: ${response.status.value}")
        }
    }
}

class PachcaClient private constructor(
    private val client: HttpClient?,
    val common: CommonService
) : Closeable {

    companion object {
        operator fun invoke(
            token: String,
            baseUrl: String = "https://api.pachca.com/api/shared/v1",
            common: CommonService? = null
        ): PachcaClient {
            val client = createClient(token)
            return PachcaClient(
                client = client,
                common = common ?: CommonServiceImpl(baseUrl, client)
            )
        }

        fun stub(
            common: CommonService = object : CommonService {}
        ): PachcaClient = PachcaClient(
            client = null,
            common = common
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
