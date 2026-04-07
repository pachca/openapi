package com.pachca.sdk

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class MessageResult(
    val id: Int,
    val content: String,
)

@Serializable
data class PaginationMetaPaginate(
    @SerialName("next_page") val nextPage: String,
)

@Serializable
data class PaginationMeta(
    val paginate: PaginationMetaPaginate,
)

@Serializable
data class OAuthError(
    val error: String? = null,
) : Exception()

@Serializable
data class SearchMessagesResponse(
    val data: List<MessageResult>,
    val meta: PaginationMeta,
)
