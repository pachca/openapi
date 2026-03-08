package com.pachca.sdk

import io.ktor.client.*
import io.ktor.client.call.*
import io.ktor.client.plugins.*
import io.ktor.client.plugins.contentnegotiation.*
import io.ktor.client.request.*
import io.ktor.client.request.forms.*
import io.ktor.client.statement.*
import io.ktor.http.*
import io.ktor.serialization.kotlinx.json.*
import java.io.Closeable

class CommonService internal constructor(
    private val baseUrl: String,
    private val client: HttpClient,
) {
    suspend fun uploadFile(request: FileUploadRequest) {
        val response = client.submitFormWithBinaryData(
            "$baseUrl/uploads",
            formData {
                request.contentDisposition?.let { append("content-disposition", it) }
                request.acl?.let { append("acl", it) }
                request.policy?.let { append("policy", it) }
                request.xAmzCredential?.let { append("x-amz-credential", it) }
                request.xAmzAlgorithm?.let { append("x-amz-algorithm", it) }
                request.xAmzDate?.let { append("x-amz-date", it) }
                request.xAmzSignature?.let { append("x-amz-signature", it) }
                append("key", request.key)
                append("file", request.file, Headers.build {
                    append(HttpHeaders.ContentDisposition, "filename=\"file\"")
                })
            },
        )
        when (response.status.value) {
            201 -> return
            401 -> throw response.body<OAuthError>()
            else -> throw RuntimeException("Unexpected status code: ${response.status.value}")
        }
    }
}

class PachcaClient(token: String, baseUrl: String = "https://api.pachca.com/api/shared/v1") : Closeable {
    private val client = HttpClient {
        expectSuccess = false
        install(ContentNegotiation) {
            json()
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
