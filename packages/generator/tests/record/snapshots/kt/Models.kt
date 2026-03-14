package com.pachca.sdk

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class LinkPreview(
    val title: String,
    val description: String? = null,
    @SerialName("image_url") val imageUrl: String? = null,
)

@Serializable
data class LinkPreviewsRequest(
    @SerialName("link_previews") val linkPreviews: Map<String, LinkPreview>,
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
data class OAuthError(
    val error: String? = null,
) : Exception()
