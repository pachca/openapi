package com.pachca

import com.pachca.apis.*
import com.pachca.infrastructure.ApiClient
import com.pachca.models.UploadParams
import io.ktor.client.HttpClient
import io.ktor.client.HttpClientConfig
import io.ktor.client.engine.HttpClientEngine
import io.ktor.client.request.forms.formData
import io.ktor.client.request.forms.submitFormWithBinaryData
import io.ktor.client.statement.HttpResponse
import io.ktor.http.Headers
import io.ktor.http.HttpHeaders
import io.ktor.http.HttpStatusCode

class PachcaClient(
    private val baseUrl: String = ApiClient.BASE_URL,
    private val httpClientEngine: HttpClientEngine? = null,
    private val httpClientConfig: ((HttpClientConfig<*>) -> Unit)? = null,
) {
    val bots by lazy { BotsApi(baseUrl, httpClientEngine, httpClientConfig) }
    val chats by lazy { ChatsApi(baseUrl, httpClientEngine, httpClientConfig) }
    val common by lazy { CommonApi(baseUrl, httpClientEngine, httpClientConfig) }
    val groupTags by lazy { GroupTagsApi(baseUrl, httpClientEngine, httpClientConfig) }
    val linkPreviews by lazy { LinkPreviewsApi(baseUrl, httpClientEngine, httpClientConfig) }
    val members by lazy { MembersApi(baseUrl, httpClientEngine, httpClientConfig) }
    val messages by lazy { MessagesApi(baseUrl, httpClientEngine, httpClientConfig) }
    val profile by lazy { ProfileApi(baseUrl, httpClientEngine, httpClientConfig) }
    val reactions by lazy { ReactionsApi(baseUrl, httpClientEngine, httpClientConfig) }
    val readMember by lazy { ReadMemberApi(baseUrl, httpClientEngine, httpClientConfig) }
    val search by lazy { SearchApi(baseUrl, httpClientEngine, httpClientConfig) }
    val security by lazy { SecurityApi(baseUrl, httpClientEngine, httpClientConfig) }
    val tasks by lazy { TasksApi(baseUrl, httpClientEngine, httpClientConfig) }
    val thread by lazy { ThreadApi(baseUrl, httpClientEngine, httpClientConfig) }
    val users by lazy { UsersApi(baseUrl, httpClientEngine, httpClientConfig) }
    val views by lazy { ViewsApi(baseUrl, httpClientEngine, httpClientConfig) }

    /**
     * Upload a file using params from common.getUploadParams().
     * Handles multipart form construction and \${filename} substitution.
     * Returns the file key for use in message attachments.
     */
    suspend fun uploadFile(uploadParams: UploadParams, file: ByteArray, filename: String): String {
        val key = uploadParams.key.replace("\${filename}", filename)
        val client = HttpClient()
        try {
            val response: HttpResponse = client.submitFormWithBinaryData(
                url = uploadParams.directUrl,
                formData = formData {
                    append("Content-Disposition", uploadParams.contentDisposition)
                    append("acl", uploadParams.acl)
                    append("policy", uploadParams.policy)
                    append("x-amz-credential", uploadParams.xAmzCredential)
                    append("x-amz-algorithm", uploadParams.xAmzAlgorithm)
                    append("x-amz-date", uploadParams.xAmzDate)
                    append("x-amz-signature", uploadParams.xAmzSignature)
                    append("key", key)
                    append("file", file, Headers.build {
                        append(HttpHeaders.ContentDisposition, "filename=\"$filename\"")
                    })
                }
            )
            if (response.status != HttpStatusCode.Created && response.status != HttpStatusCode.NoContent) {
                throw RuntimeException("Upload failed with status ${response.status}")
            }
        } finally {
            client.close()
        }
        return key
    }
}
