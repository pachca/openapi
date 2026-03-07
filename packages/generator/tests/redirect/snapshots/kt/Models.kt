package com.pachca.sdk

import kotlinx.serialization.Serializable

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
data class OAuthError(
    val error: String? = null,
) : Exception()
