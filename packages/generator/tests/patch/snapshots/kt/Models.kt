package com.pachca.sdk

import kotlinx.serialization.Serializable
import kotlinx.serialization.Transient

@Serializable
data class Item(
    val id: Int,
    val name: String,
    val description: String? = null,
    val priority: Int? = null,
)

@Serializable
data class ItemPatchRequestItem(
    val name: String? = null,
    val description: String? = null,
    val priority: Int? = null,
)

@Serializable
data class ItemPatchRequest(
    val item: ItemPatchRequestItem,
)

@Serializable
data class ApiErrorItem(
    val key: String? = null,
    val value: String? = null,
)

@Serializable
data class ApiError(
    val errors: List<ApiErrorItem>? = null,
    /** HTTP status code of the answer, set by the client. An empty body or one that is not JSON leaves errors empty. */
    @Transient val statusCode: Int? = null,
) : Exception()

@Serializable
data class ItemDataWrapper(val data: Item)
