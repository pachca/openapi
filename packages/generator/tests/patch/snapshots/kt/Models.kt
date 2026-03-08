package com.pachca.sdk

import kotlinx.serialization.Serializable

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
) : Exception()

@Serializable
data class ItemDataWrapper(val data: Item)
