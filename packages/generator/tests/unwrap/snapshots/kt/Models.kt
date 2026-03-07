package com.pachca.sdk

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class AddMembersRequest(
        @SerialName("member_ids") val memberIds: List<Int>,
)

@Serializable
data class ChatCreateRequestChat(
        val name: String,
        val channel: Boolean? = null,
        val public: Boolean? = null,
        @SerialName("member_ids") val memberIds: List<Int>? = null,
)

@Serializable
data class Chat(
        val id: Int,
        val name: String,
        @SerialName("is_channel") val isChannel: Boolean,
        @SerialName("is_public") val isPublic: Boolean,
        @SerialName("created_at") val createdAt: String,
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
