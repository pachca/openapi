package com.pachca.sdk

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.Transient

@Serializable
data class PaginationMetaPaginate(
    @SerialName("next_page") val nextPage: String,
)

@Serializable
data class PaginationMeta(
    val paginate: PaginationMetaPaginate,
)

@Serializable
data class ApiErrorItem(
    val key: String? = null,
    val message: String,
)

@Serializable
data class ApiError(
    val errors: List<ApiErrorItem>,
    /** HTTP status code of the answer, set by the client. An empty body or one that is not JSON leaves errors empty. */
    @Transient val statusCode: Int? = null,
) : Exception()

@Serializable
data class OAuthError(
    val error: String? = null,
) : Exception()
 {
    override val message: String get() = error
}

@Serializable
data class ListReadMembersResponse(
    val data: List<Int>,
    val meta: PaginationMeta,
)
