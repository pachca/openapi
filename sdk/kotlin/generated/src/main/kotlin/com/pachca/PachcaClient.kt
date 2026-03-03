package com.pachca

import com.pachca.apis.*
import com.pachca.infrastructure.ApiClient
import io.ktor.client.HttpClientConfig
import io.ktor.client.engine.HttpClientEngine

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
}
