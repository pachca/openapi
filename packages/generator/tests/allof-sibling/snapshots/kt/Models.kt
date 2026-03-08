package com.pachca.sdk

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class BaseEntity(
    val id: Int,
    @SerialName("created_at") val createdAt: String,
)

@Serializable
data class Article(
    val id: Int,
    @SerialName("created_at") val createdAt: String,
    val title: String,
    val body: String,
    @SerialName("is_published") val isPublished: Boolean? = null,
)
