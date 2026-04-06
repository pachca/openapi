package com.pachca.sdk

import java.time.OffsetDateTime
import java.time.format.DateTimeFormatter
import kotlinx.serialization.KSerializer
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.descriptors.PrimitiveKind
import kotlinx.serialization.descriptors.PrimitiveSerialDescriptor
import kotlinx.serialization.encoding.Decoder
import kotlinx.serialization.encoding.Encoder

object OffsetDateTimeSerializer : KSerializer<OffsetDateTime> {
    override val descriptor = PrimitiveSerialDescriptor("OffsetDateTime", PrimitiveKind.STRING)
    override fun serialize(encoder: Encoder, value: OffsetDateTime) = encoder.encodeString(value.format(DateTimeFormatter.ISO_OFFSET_DATE_TIME))
    override fun deserialize(decoder: Decoder): OffsetDateTime = OffsetDateTime.parse(decoder.decodeString(), DateTimeFormatter.ISO_OFFSET_DATE_TIME)
}

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
data class ChatCreateRequest(
    val chat: ChatCreateRequestChat,
)

@Serializable
data class Chat(
    val id: Int,
    val name: String,
    @SerialName("is_channel") val isChannel: Boolean,
    @SerialName("is_public") val isPublic: Boolean,
    @Serializable(with = OffsetDateTimeSerializer::class) @SerialName("created_at") val createdAt: OffsetDateTime,
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

@Serializable
data class ChatDataWrapper(val data: Chat)
