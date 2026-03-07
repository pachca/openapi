package com.pachca.sdk

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
enum class SearchSort(val value: String) {
    /** По релевантности */
    @SerialName("relevance") RELEVANCE("relevance"),
    /** По дате */
    @SerialName("date") DATE("date"),
}

@Serializable
data class MessageSearchResult(
    val id: Int,
    @SerialName("chat_id") val chatId: Int,
    @SerialName("user_id") val userId: Int,
    val content: String,
    @SerialName("created_at") val createdAt: String,
)

@Serializable
data class SearchPaginationMetaPaginate(
    @SerialName("next_page") val nextPage: String,
)

@Serializable
data class SearchPaginationMeta(
    val total: Int,
    val paginate: SearchPaginationMetaPaginate,
)

@Serializable
data class OAuthError(
    val error: String? = null,
) : Exception()

@Serializable
data class SearchMessagesResponse(
    val data: List<MessageSearchResult>,
    val meta: SearchPaginationMeta,
)
